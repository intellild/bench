#!/usr/bin/env zx

import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

import { chalk } from 'zx';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const babelLoaderPath = require.resolve('babel-loader');
const repoRoot = path.resolve(
  process.env.RSPACK_REPO ?? path.join(projectRoot, 'rspack-storage'),
);
const cliPath = path.join(repoRoot, 'packages/rspack-cli/bin/rspack.js');
const benchRoot = path.resolve(
  process.env.RSPACK_LOADER_CACHE_MAKE_BENCH_DIR ??
    path.join(os.tmpdir(), 'rspack-loader-cache-make-bench'),
);
const iterations = readPositiveInteger(
  'RSPACK_LOADER_CACHE_MAKE_BENCH_ITERATIONS',
  5,
);
const manifest = JSON.parse(
  await fs.readFile(path.join(projectRoot, 'fixtures/manifest.json'), 'utf8'),
);
const requestedScenario =
  process.env.RSPACK_LOADER_CACHE_MAKE_BENCH_SCENARIO;
const scenarioDefinitions = requestedScenario
  ? manifest.scenarios.filter(({ name }) => name === requestedScenario)
  : manifest.scenarios;
const compilationPasses = [
  'build module graph',
  'finish modules',
  'seal',
  'optimize dependencies',
  'build chunk graph',
  'optimize modules',
  'optimize chunks',
  'optimize tree',
  'optimize chunk modules',
  'module ids',
  'chunk ids',
  'assign runtime ids',
  'optimize code generation',
  'create module hashes',
  'code generation',
  'runtime requirements',
  'hashing',
  'create module assets',
  'create chunk assets',
  'process assets',
  'after process assets',
  'after seal',
];
const modes = {
  persistMake: {
    configMode: 'persist-make',
    prepare: async () => {},
  },
  loaderOnly: {
    configMode: 'loader-only',
    prepare: clearCompilerCache,
  },
};

if (process.argv.includes('--help')) {
  console.log(`Usage: pnpm benchmark:make-cache

Compares a complete warm build restored by compilation persistent cache with a
complete warm build that retains only loader cache. A dated Markdown report is
written to the benchmark repository.

Environment:
  RSPACK_REPO                                  Rspack checkout (default: ./rspack-storage)
  RSPACK_LOADER_CACHE_MAKE_BENCH_DIR           Runtime directory
  RSPACK_LOADER_CACHE_MAKE_BENCH_ITERATIONS    Iterations (default: 5)
  RSPACK_LOADER_CACHE_MAKE_BENCH_SCENARIO      One fixture scenario (default: all)
  RSPACK_LOADER_CACHE_MAKE_BENCH_RESULT_FILE   Report path (default: dated file)`);
  process.exit(0);
}

if (scenarioDefinitions.length === 0) {
  throw new Error(`Unknown scenario: ${requestedScenario}`);
}

function readPositiveInteger(name, fallback) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

function localTimestamp(date) {
  const parts = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
    String(date.getSeconds()).padStart(2, '0'),
  ];
  return `${parts.slice(0, 3).join('-')}-${parts.slice(3).join('-')}`;
}

function formatMs(value) {
  return `${value.toFixed(1)} ms`;
}

function formatDelta(value, baseline) {
  if (baseline === 0) return 'n/a';
  const delta = (value / baseline - 1) * 100;
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`;
}

function summarize(values) {
  const sorted = values.toSorted((a, b) => a - b);
  return {
    min: sorted[0],
    median: sorted[Math.floor(sorted.length / 2)],
    mean: values.reduce((sum, value) => sum + value, 0) / values.length,
    max: sorted.at(-1),
  };
}

async function prepareFixture(name) {
  await fs.rm(benchRoot, { recursive: true, force: true });
  await fs.cp(path.join(projectRoot, 'fixtures', name), benchRoot, {
    recursive: true,
  });

  const reliableTime = new Date(Date.now() - 10_000);
  const srcDir = path.join(benchRoot, 'src');
  const files = await fs.readdir(srcDir);
  await Promise.all(
    files.map((filename) =>
      fs.utimes(path.join(srcDir, filename), reliableTime, reliableTime),
    ),
  );

  const baseConfig = path.join(benchRoot, 'rspack.config.cjs');
  const timingConfig = path.join(benchRoot, 'rspack.timing.config.cjs');
  await fs.writeFile(
    timingConfig,
    `const config = require(${JSON.stringify(baseConfig)});\n` +
      `if (process.env.RSPACK_LOADER_CACHE_MAKE_BENCH_MODE === 'loader-only') config.cache = { ...config.cache, readonly: true };\n` +
      `config.stats = { all: false, logging: 'verbose', loggingDebug: [/^rspack\\.(Compiler|Compilation)$/] };\n` +
      `module.exports = config;\n`,
  );
  return timingConfig;
}

async function clearCompilerCache() {
  const cacheDir = path.join(benchRoot, '.cache');
  const entries = await fs.readdir(cacheDir);
  await Promise.all(
    entries
      .filter((entry) => entry !== 'loader-cache')
      .map((entry) =>
        fs.rm(path.join(cacheDir, entry), { recursive: true, force: true }),
      ),
  );
}

async function snapshotCache(snapshotDir) {
  await fs.rm(snapshotDir, { recursive: true, force: true });
  await fs.cp(path.join(benchRoot, '.cache'), snapshotDir, {
    recursive: true,
  });
}

async function restoreCache(snapshotDir) {
  const cacheDir = path.join(benchRoot, '.cache');
  await fs.rm(cacheDir, { recursive: true, force: true });
  await fs.cp(snapshotDir, cacheDir, { recursive: true });
}

function collectLogging(stats, output = {}) {
  if (stats.logging) {
    for (const [origin, logging] of Object.entries(stats.logging)) {
      output[origin] ??= [];
      const visit = (entries) => {
        for (const entry of entries ?? []) {
          if (entry.type === 'time') {
            const match = /^(.*): ([0-9.]+) ms$/.exec(entry.message);
            if (match) {
              output[origin].push({ name: match[1], ms: Number(match[2]) });
            }
          }
          visit(entry.children);
        }
      };
      visit(logging.entries);
    }
  }
  for (const child of stats.children ?? []) {
    collectLogging(child, output);
  }
  return output;
}

function phaseTimings(stats) {
  const logging = collectLogging(stats);
  const compilationEntries = logging['rspack.Compilation'] ?? [];
  const allCompilationTimings = new Map(
    compilationEntries.map(({ name, ms }) => [name, ms]),
  );
  const phases = Object.fromEntries(
    compilationPasses
      .filter((name) => allCompilationTimings.has(name))
      .map((name) => [name, allCompilationTimings.get(name)]),
  );
  const emitAssets = (logging['rspack.Compiler'] ?? []).find(
    ({ name }) => name === 'emitAssets',
  );
  if (emitAssets) phases['emit assets'] = emitAssets.ms;
  if (!Object.hasOwn(phases, 'build module graph')) {
    throw new Error(
      `Rspack stats did not expose pass timings; logging origins: ${Object.keys(logging).join(', ')}`,
    );
  }
  return phases;
}

async function runBuild(configPath, configMode) {
  await fs.rm(path.join(benchRoot, 'dist'), { recursive: true, force: true });
  const startedAt = performance.now();
  const { stdout, stderr } = await new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [cliPath, '--config', configPath, '--json'],
      {
        cwd: benchRoot,
        env: {
          ...process.env,
          RSPACK_LOADER_CACHE_BENCH_BABEL_LOADER: babelLoaderPath,
          RSPACK_LOADER_CACHE_MAKE_BENCH_MODE: configMode,
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`Rspack exited with ${code}\n${stdout}\n${stderr}`));
    });
  });
  const totalMs = performance.now() - startedAt;
  let stats;
  try {
    stats = JSON.parse(stdout);
  } catch (error) {
    throw new Error(`Failed to parse Rspack --json output\n${stdout}\n${stderr}`, {
      cause: error,
    });
  }
  const phases = phaseTimings(stats);
  return {
    totalMs,
    phases,
    unaccountedMs:
      totalMs - Object.values(phases).reduce((sum, value) => sum + value, 0),
  };
}

function summarizeRuns(runs) {
  const phaseNames = [...new Set(runs.flatMap(({ phases }) => Object.keys(phases)))];
  return {
    total: summarize(runs.map(({ totalMs }) => totalMs)),
    unaccounted: summarize(runs.map(({ unaccountedMs }) => unaccountedMs)),
    phases: Object.fromEntries(
      phaseNames.map((name) => [
        name,
        summarize(runs.map(({ phases }) => phases[name] ?? 0)),
      ]),
    ),
  };
}

async function benchmarkScenario({ name, complexity }) {
  const configPath = await prepareFixture(name);
  const snapshotDir = path.join(`${benchRoot}-snapshots`, name);
  const cold = [];
  const results = { persistMake: [], loaderOnly: [] };

  for (let iteration = 0; iteration < iterations; iteration++) {
    await fs.rm(path.join(benchRoot, '.cache'), {
      recursive: true,
      force: true,
    });
    cold.push(await runBuild(configPath, 'cold'));
    await snapshotCache(snapshotDir);

    const order =
      iteration % 2 === 0
        ? ['persistMake', 'loaderOnly']
        : ['loaderOnly', 'persistMake'];
    for (const mode of order) {
      await restoreCache(snapshotDir);
      await modes[mode].prepare();
      results[mode].push(
        await runBuild(configPath, modes[mode].configMode),
      );
    }
    console.log(
      chalk.gray(`  ${name}: finished iteration ${iteration + 1}/${iterations}`),
    );
  }

  await fs.rm(snapshotDir, { recursive: true, force: true });
  return {
    name,
    complexity,
    cold: summarizeRuns(cold),
    persistMake: summarizeRuns(results.persistMake),
    loaderOnly: summarizeRuns(results.loaderOnly),
    raw: { cold, ...results },
  };
}

function phaseRows(scenarios) {
  const rows = [];
  for (const scenario of scenarios) {
    const phaseNames = [
      ...new Set([
        ...Object.keys(scenario.persistMake.phases),
        ...Object.keys(scenario.loaderOnly.phases),
      ]),
    ];
    for (const phase of phaseNames) {
      const persist = scenario.persistMake.phases[phase]?.median ?? 0;
      const loader = scenario.loaderOnly.phases[phase]?.median ?? 0;
      rows.push(
        `| ${scenario.name} | ${phase} | ${formatMs(persist)} | ${formatMs(loader)} | ${formatDelta(loader, persist)} |`,
      );
    }
    const persistOutside = scenario.persistMake.unaccounted.median;
    const loaderOutside = scenario.loaderOnly.unaccounted.median;
    rows.push(
      `| ${scenario.name} | outside pass timers | ${formatMs(persistOutside)} | ${formatMs(loaderOutside)} | ${formatDelta(loaderOutside, persistOutside)} |`,
    );
  }
  return rows.join('\n');
}

function overallRows(scenarios) {
  return scenarios
    .map((scenario) => {
      const cold = scenario.cold.total.median;
      const persist = scenario.persistMake.total.median;
      const loader = scenario.loaderOnly.total.median;
      return `| ${scenario.name} | ${formatMs(cold)} | ${formatMs(persist)} | ${formatMs(loader)} | ${formatDelta(loader, persist)} |`;
    })
    .join('\n');
}

await fs.access(cliPath);
console.log(chalk.cyan(`Rspack: ${repoRoot}`));
console.log(chalk.cyan(`Iterations: ${iterations}`));
const startedAt = new Date();
const scenarios = [];
for (const scenario of scenarioDefinitions) {
  console.log(chalk.cyan(`Running ${scenario.name}...`));
  scenarios.push(await benchmarkScenario(scenario));
}
const finishedAt = new Date();
const resultFilename = `result-make-cache-${localTimestamp(finishedAt)}.md`;
const resultPath = path.resolve(
  process.env.RSPACK_LOADER_CACHE_MAKE_BENCH_RESULT_FILE ??
    path.join(projectRoot, resultFilename),
);
const commit = await new Promise((resolve, reject) => {
  const child = spawn('git', ['rev-parse', 'HEAD'], {
    cwd: repoRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  child.stdout.on('data', (chunk) => {
    stdout += chunk;
  });
  child.on('error', reject);
  child.on('close', (code) =>
    code === 0 ? resolve(stdout.trim()) : reject(new Error('git rev-parse failed')),
  );
});
const markdown = `# Persist make cache vs loader cache — ${finishedAt.toLocaleDateString('en-CA')}

Generated at ${finishedAt.toISOString()}.

Each iteration performs one cold build, snapshots the complete cache, and then
runs both warm modes from identical snapshots. Mode order alternates between
iterations. “Loader cache only” removes every top-level persistent-cache entry
except \`loader-cache\` and uses readonly cache mode before starting the measured
build. This keeps loader-cache persistence available without writing compilation
cache entries during the measurement.

## Environment

| Item | Value |
| --- | --- |
| Platform | ${process.platform} ${process.arch} |
| CPU | ${os.cpus()[0]?.model ?? 'unknown'} |
| Logical CPUs | ${os.cpus().length} |
| Node.js | ${process.version} |
| Rspack repository | \`${repoRoot}\` |
| Rspack commit | \`${commit}\` |
| Modules | ${manifest.moduleCount} |
| Iterations | ${iterations} |
| Benchmark duration | ${formatMs(finishedAt.getTime() - startedAt.getTime())} |

## Complete build median

The complete build is measured outside the CLI process and therefore includes
Node.js startup, configuration loading, compiler setup, compilation passes, and
asset emission. Positive delta means loader-cache-only took longer.

| Scenario | Cold populate | Persist cache in make | Loader cache only | Loader only vs persist |
| --- | ---: | ---: | ---: | ---: |
${overallRows(scenarios)}

## Compilation pass median

These timings come from Rspack's own \`rspack.Compilation\` pass logger. Cache
restore/save hooks are included in their corresponding pass. \`emit assets\`
comes from the compiler logger and runs after the compilation passes.

| Scenario | Phase | Persist cache in make | Loader cache only | Loader only vs persist |
| --- | --- | ---: | ---: | ---: |
${phaseRows(scenarios)}

## Raw results

\`unaccountedMs\` is complete process time minus all sequential compilation
passes and compiler asset emission. It includes process startup, configuration,
compiler creation, hook gaps, stats generation, and shutdown.

\`\`\`json
${JSON.stringify({ repoRoot, commit, iterations, scenarios }, null, 2)}
\`\`\`
`;
await fs.writeFile(resultPath, markdown);
console.log(chalk.bold.green(`Wrote ${resultPath}`));
