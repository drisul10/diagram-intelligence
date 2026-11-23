#!/usr/bin/env node
// Installs the Diagram Intelligence skill into an agent skills folder.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const defaultDir = join(homedir(), '.claude', 'skills', 'diagram-intelligence');
const entries = [
  'SKILL.md', 'LICENSE', 'NOTICE', 'README.md',
  'capabilities', 'knowledge', 'types',
  'scripts/validate.mjs', 'scripts/package.json', 'scripts/package-lock.json',
];

const usage = `diagram-intelligence ${version}

Usage:
  npx diagram-intelligence install [--dir DIR] [--force] [--validator]

Options:
  --dir DIR     install into DIR (default ${defaultDir})
  --force       replace an existing install in DIR
  --validator   also install the validator dependencies (about 440 MB)
  -h, --help    show this help
  -v, --version show the version`;

function fail(msg) {
  console.error(`error: ${msg}\n\n${usage}`);
  process.exit(2);
}

const args = process.argv.slice(2);
if (args.includes('-h') || args.includes('--help')) { console.log(usage); process.exit(0); }
if (args.includes('-v') || args.includes('--version')) { console.log(version); process.exit(0); }

const [command, ...rest] = args;
if (command !== 'install') fail(command ? `unknown command "${command}"` : 'missing command');

let dir = defaultDir, force = false, validator = false;
for (let i = 0; i < rest.length; i++) {
  const a = rest[i];
  if (a === '--dir') { dir = rest[++i]; if (!dir) fail('--dir needs a path'); }
  else if (a === '--force') force = true;
  else if (a === '--validator') validator = true;
  else fail(`unknown option "${a}"`);
}
dir = resolve(dir.replace(/^~(?=$|\/)/, homedir()));

if (existsSync(join(dir, 'SKILL.md'))) {
  if (!force) fail(`${dir} already has a skill installed. Use --force to replace it.`);
  for (const e of entries) rmSync(join(dir, e), { recursive: true, force: true });
}

mkdirSync(join(dir, 'scripts'), { recursive: true });
for (const e of entries) {
  const src = join(root, e);
  if (existsSync(src)) cpSync(src, join(dir, e), { recursive: true });
}
console.log(`Installed Diagram Intelligence ${version} to ${dir}`);

const scripts = join(dir, 'scripts');
if (validator) {
  console.log('Installing validator dependencies (uses your system Chrome, skips the Puppeteer download)...');
  const r = spawnSync('npm', ['ci'], {
    cwd: scripts, stdio: 'inherit', shell: process.platform === 'win32',
    env: { ...process.env, PUPPETEER_SKIP_DOWNLOAD: process.env.PUPPETEER_SKIP_DOWNLOAD ?? '1' },
  });
  if (r.status !== 0) { console.error('error: npm ci failed in ' + scripts); process.exit(1); }
  console.log('Validator ready.');
} else {
  console.log(`To enable the validator later:\n  cd "${scripts}" && PUPPETEER_SKIP_DOWNLOAD=1 npm ci`);
}
