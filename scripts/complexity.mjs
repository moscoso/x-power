/**
 * Cognitive complexity checker.
 *
 * Usage:
 *   npm run complexity                        — check all src files (pass/fail)
 *   npm run complexity -- --staged            — pass/fail for staged files only
 *   npm run complexity -- --changed           — pass/fail for changed files vs HEAD
 *   npm run complexity -- --threshold=10      — override complexity threshold
 *
 *   npm run complexity -- --report            — full project report with function names + baseline delta
 *   npm run complexity -- --report --changed  — same, scoped to changed files
 *   npm run complexity -- --snapshot          — update complexity-snapshot.json (commit this)
 */

import { execSync, spawnSync } from 'child_process';
import { resolve, dirname, sep } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const args = process.argv.slice(2);

const SNAPSHOT_PATH = resolve(root, 'complexity-snapshot.json');

const stagedOnly  = args.includes('--staged');
const changedOnly = args.includes('--changed');
const reportMode  = args.includes('--report');
const snapshotMode = args.includes('--snapshot');

const thresholdArg = args.find(a => a.startsWith('--threshold='));
if (thresholdArg) {
  process.env.COMPLEXITY_THRESHOLD = thresholdArg.split('=')[1];
}

// Report and snapshot modes capture everything — override threshold
if (reportMode || snapshotMode) {
  process.env.COMPLEXITY_THRESHOLD = '0';
}

// ── File target resolution ─────────────────────────────────────────────────────

function getGitFiles(command) {
  const output = execSync(command, { encoding: 'utf8', cwd: root });
  return output
    .trim()
    .split('\n')
    .filter(f => f && f.endsWith('.ts') && !f.endsWith('.spec.ts'));
}

let fileTargets;
let scopeLabel;

if (stagedOnly) {
  const files = getGitFiles('git diff --cached --name-only --diff-filter=ACMR');
  if (files.length === 0) { console.log('No staged TypeScript files to check.'); process.exit(0); }
  fileTargets = files;
  scopeLabel = `${files.length} staged file(s)`;
} else if (changedOnly) {
  const tracked   = getGitFiles('git diff HEAD --name-only --diff-filter=ACMR');
  const untracked = getGitFiles('git ls-files --others --exclude-standard');
  const files = [...new Set([...tracked, ...untracked])].filter(
    f => f.endsWith('.ts') && !f.endsWith('.spec.ts')
  );
  if (files.length === 0) { console.log('No changed TypeScript files to check.'); process.exit(0); }
  fileTargets = files;
  scopeLabel = `${files.length} changed file(s)`;
} else {
  fileTargets = ['src/**/*.ts'];
  scopeLabel = 'full project';
}

// ── ESLint runner (shared) ─────────────────────────────────────────────────────

function runEslint(format = 'stylish') {
  return spawnSync(
    'npx',
    ['eslint', '--config', 'eslint.complexity.config.mjs', '--format', format, ...fileTargets],
    { cwd: root, shell: true, env: { ...process.env }, encoding: 'utf8' }
  );
}

// ── Function name extraction ───────────────────────────────────────────────────

function extractFunctionName(filePath, lineNum) {
  let lines;
  try {
    lines = readFileSync(filePath, 'utf8').split('\n');
  } catch {
    return null;
  }

  // Search the reported line and up to 4 lines above it (handles decorators, modifiers)
  for (let i = lineNum - 1; i >= Math.max(0, lineNum - 5); i--) {
    const line = lines[i] || '';
    let m;

    // function declaration: (async) function name(
    m = line.match(/(?:async\s+)?function\s+(\w+)\s*[(<]/);
    if (m) return m[1];

    // constructor
    if (/\bconstructor\s*\(/.test(line)) return 'constructor';

    // class method — handles access modifiers, async, static, override
    m = line.match(/^\s+(?:(?:public|private|protected|static|async|override|readonly)\s+)*(\w+)\s*\(/);
    if (m && !['if', 'for', 'while', 'switch', 'catch', 'return'].includes(m[1])) return m[1];

    // arrow / assigned function: const foo = (async) (...) =>
    m = line.match(/(?:const|let|var)\s+(\w+)\s*=/);
    if (m) return m[1];
  }
  return null;
}

// ── Parse ESLint JSON into findings ───────────────────────────────────────────

function parseFindings(jsonOutput) {
  let files;
  try {
    files = JSON.parse(jsonOutput);
  } catch {
    console.error('Failed to parse eslint output.');
    process.exit(1);
  }

  return files
    .filter(f => f.messages.length > 0)
    .map(f => {
      const relPath = f.filePath.replace(root + sep, '').replace(/\\/g, '/');
      const functions = f.messages
        .filter(m => m.ruleId === 'sonarjs/cognitive-complexity')
        .map(m => {
          const match = m.message.match(/from (\d+) to the/);
          const score = match ? parseInt(match[1]) : 0;
          const name  = extractFunctionName(f.filePath, m.line) ?? '(anonymous)';
          return { line: m.line, name, score };
        })
        .filter(fn => fn.score > 0)
        .sort((a, b) => b.score - a.score);
      return { file: relPath, functions };
    })
    .filter(f => f.functions.length > 0)
    .sort((a, b) => b.functions[0].score - a.functions[0].score);
}

// ── Snapshot mode ──────────────────────────────────────────────────────────────

if (snapshotMode) {
  const result = runEslint('json');
  const findings = parseFindings(result.stdout);

  let commit = 'unknown';
  try { commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8', cwd: root }).trim(); } catch {}

  const snapshot = {
    generated: new Date().toISOString(),
    commit,
    files: Object.fromEntries(
      findings.map(({ file, functions }) => [
        file,
        Object.fromEntries(functions.map(fn => [fn.name, fn.score])),
      ])
    ),
  };

  writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2) + '\n');
  console.log(`Snapshot saved → complexity-snapshot.json  (${findings.length} file(s), commit ${commit})`);
  process.exit(0);
}

// ── Report mode ────────────────────────────────────────────────────────────────

if (reportMode) {
  const result = runEslint('json');
  const findings = parseFindings(result.stdout);

  // Load baseline for delta
  let baseline = null;
  if (existsSync(SNAPSHOT_PATH)) {
    try { baseline = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8')); } catch {}
  }

  if (findings.length === 0) {
    console.log('No complex functions found.');
    process.exit(0);
  }

  const baselineNote = baseline
    ? `baseline @ ${baseline.commit} (${baseline.generated.slice(0, 10)})`
    : 'no baseline — run --snapshot to create one';

  console.log(`Complexity Report — ${scopeLabel}  [${baselineNote}]\n`);

  for (const { file, functions } of findings) {
    console.log(file);
    for (const { line, name, score } of functions) {
      let delta = '';
      if (baseline?.files?.[file]?.[name] !== undefined) {
        const diff = score - baseline.files[file][name];
        if (diff > 0)      delta = `  ↑${diff} vs baseline`;
        else if (diff < 0) delta = `  ↓${Math.abs(diff)} vs baseline`;
      } else if (baseline) {
        delta = '  (new)';
      }

      const lineCol  = `:${line}`.padEnd(7);
      const nameCol  = name.padEnd(24);
      console.log(`  ${lineCol} ${nameCol} score ${score}${delta}`);
    }
    console.log();
  }

  process.exit(0);
}

// ── Pass/fail mode (default, used by CI / pre-commit) ─────────────────────────

const threshold = process.env.COMPLEXITY_THRESHOLD ?? '15';
console.log(`Cognitive complexity check (threshold: ${threshold}) — ${scopeLabel}\n`);
if (stagedOnly || changedOnly) {
  fileTargets.forEach(f => console.log(`  ${f}`));
  console.log();
}

const result = runEslint('stylish');
// Pipe output to stdout manually since we used encoding: 'utf8' instead of inherit
process.stdout.write(result.stdout || '');
process.stderr.write(result.stderr || '');
process.exit(result.status ?? 0);
