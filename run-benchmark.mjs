#!/usr/bin/env zx

import os from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { chalk } from 'zx';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const execFileAsync = promisify(execFile);
const benchmarkScript = path.join(projectRoot, 'bench-loader-cache.mjs');
const manifest = JSON.parse(
  await fs.readFile(path.join(projectRoot, 'fixtures/manifest.json'), 'utf8'),
);
const startedAt = new Date();
const implementations = [
  {
    label: 'json',
    title: 'JSON',
    repo: path.join(projectRoot, 'rspack-json'),
  },
  {
    label: 'rkyv',
    title: 'rkyv',
    repo: path.join(projectRoot, 'rspack-rkyv'),
  },
  {
    label: 'single-loader',
    title: 'single_loader',
    repo: path.join(projectRoot, 'rspack-single-loader'),
  },
  {
    label: 'rspack-storage',
    title: 'rspack_storage',
    repo: path.join(projectRoot, 'rspack-storage'),
  },
];

if (process.argv.includes('--help')) {
  console.log(`Usage: pnpm benchmark

Runs the JSON, rkyv, single_loader, and rspack_storage benchmarks sequentially and writes
result-YYYY-MM-DD-HH-mm-ss.md in the benchmark repository.

Environment:
  RSPACK_LOADER_CACHE_BENCH_DIR        Runtime fixture and cache directory
  RSPACK_LOADER_CACHE_BENCH_ITERATIONS Cold/warm measurement pairs`);
  process.exit(0);
}

function localDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function localTimestamp(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${localDate(date)}-${hours}-${minutes}-${seconds}`;
}

function formatMs(value) {
  return `${value.toFixed(1)} ms`;
}

function formatBytes(value) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KiB`;
  return `${(value / 1024 ** 2).toFixed(1)} MiB`;
}

function formatDelta(value, baseline) {
  if (baseline === 0) return 'n/a';
  const delta = (value / baseline - 1) * 100;
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`;
}

function findScenario(result, name) {
  const scenario = result.scenarios.find((item) => item.name === name);
  if (!scenario) {
    throw new Error(`${result.branch} result does not contain ${name}`);
  }
  return scenario;
}

async function gitValue(repo, ...args) {
  const output = await execFileAsync('git', args, {
    cwd: repo,
  });
  return output.stdout.trim();
}

async function runImplementation(implementation) {
  console.log(chalk.cyan(`Running ${implementation.title} benchmark...`));
  const resultPath = path.join(
    os.tmpdir(),
    `rspack-loader-cache-result-${process.pid}-${implementation.label}.json`,
  );
  let output;
  let result;
  try {
    output = await execFileAsync(process.execPath, [benchmarkScript], {
      cwd: projectRoot,
      env: {
        ...process.env,
        RSPACK_REPO: implementation.repo,
        RSPACK_LOADER_CACHE_BENCH_LABEL: implementation.label,
        RSPACK_LOADER_CACHE_BENCH_RESULT_FILE: resultPath,
      },
      maxBuffer: 1024 * 1024,
    });
    result = JSON.parse(await fs.readFile(resultPath, 'utf8'));
  } finally {
    await fs.rm(resultPath, { force: true });
  }

  console.log(chalk.green(`Finished ${implementation.title}`));
  if (output.stderr.trim()) {
    console.log(output.stderr.trim());
  }

  return {
    ...implementation,
    commit: await gitValue(implementation.repo, 'rev-parse', 'HEAD'),
    branch: await gitValue(
      implementation.repo,
      'branch',
      '--show-current',
    ),
    result,
  };
}

function summaryRows(runs) {
  const comparisons = runs.slice(1);
  const rows = [];
  for (const scenarioDefinition of manifest.scenarios) {
    const scenarios = runs.map((run) =>
      findScenario(run.result, scenarioDefinition.name),
    );
    for (const [phase, title] of [
      ['write', 'Cold write'],
      ['read', 'Warm read'],
    ]) {
      const values = scenarios.map((scenario) => scenario[phase].median);
      rows.push(
        `| ${scenarioDefinition.name} | ${title} | ${values.map(formatMs).join(' | ')} | ${comparisons.map((_, index) => formatDelta(values[index + 1], values[0])).join(' | ')} |`,
      );
    }
  }
  return rows.join('\n');
}

function detailRows(runs) {
  const rows = [];
  for (const run of runs) {
    for (const scenario of run.result.scenarios) {
      for (const [phase, title] of [
        ['write', 'Cold write'],
        ['read', 'Warm read'],
      ]) {
        const values = scenario[phase];
        rows.push(
          `| ${scenario.name} | ${run.title} | ${title} | ${formatMs(values.min)} | ${formatMs(values.median)} | ${formatMs(values.mean)} | ${formatMs(values.max)} |`,
        );
      }
    }
  }
  return rows.join('\n');
}

function cacheRows(runs) {
  return runs
    .flatMap((run) =>
      run.result.scenarios.map(
        (scenario) =>
          `| ${scenario.name} | ${run.title} | ${scenario.cache.files} | ${formatBytes(scenario.cache.bytes)} |`,
      ),
    )
    .join('\n');
}

function speedupRows(runs) {
  return runs
    .flatMap((run) =>
      run.result.scenarios.map((scenario) => {
        const speedup = scenario.write.median / scenario.read.median;
        return `| ${scenario.name} | ${run.title} | ${speedup.toFixed(2)}x |`;
      }),
    )
    .join('\n');
}

function instrumentationRows(runs) {
  return runs
    .flatMap((run) =>
      run.result.scenarios.flatMap((scenario) => {
        if (!scenario.instrumentation) return [];
        return [
          ['Cold write', scenario.instrumentation.write],
          ['Warm read', scenario.instrumentation.read],
        ].map(
          ([phase, metrics]) =>
            `| ${scenario.name} | ${run.title} | ${phase} | ${metrics.jsYields} | ${metrics.hits} | ${metrics.misses} | ${(metrics.hashNanos / 1e6).toFixed(3)} ms | ${(metrics.deserializeNanos / 1e6).toFixed(3)} ms | ${metrics.readFiles} | ${formatBytes(metrics.readBytes)} |`,
        );
      }),
    )
    .join('\n');
}

const runs = [];
for (const implementation of implementations) {
  runs.push(await runImplementation(implementation));
}

const finishedAt = new Date();
const jsonRun = runs[0];
const resultFilename = `result-${localTimestamp(finishedAt)}.md`;
const resultPath = path.join(projectRoot, resultFilename);
const cpu = os.cpus()[0]?.model ?? 'unknown';
const commitRows = runs
  .map(
    (run) =>
      `| ${run.title} commit | \`${run.commit}\` (${run.branch || 'detached'}) |`,
  )
  .join('\n');
const implementationHeaders = runs.map((run) => run.title).join(' | ');
const deltaHeaders = runs
  .slice(1)
  .map((run) => `${run.title} vs JSON`)
  .join(' | ');
const summaryAlignments = runs.map(() => '---:').join(' | ');
const deltaAlignments = runs
  .slice(1)
  .map(() => '---:')
  .join(' | ');
const rawResults = runs
  .map(
    (run) => `<details>
<summary>${run.title}</summary>

\`\`\`json
${JSON.stringify(run.result, null, 2)}
\`\`\`

</details>`,
  )
  .join('\n\n');
const markdown = `# Loader cache storage benchmark — ${localDate(finishedAt)}

Generated at ${finishedAt.toISOString()}.

## Environment

| Item | Value |
| --- | --- |
| Platform | ${process.platform} ${process.arch} |
| CPU | ${cpu} |
| Logical CPUs | ${os.cpus().length} |
| Node.js | ${process.version} |
| Modules | ${manifest.moduleCount} |
| Iterations | ${jsonRun.result.iterations} |
| Duration | ${formatMs(finishedAt.getTime() - startedAt.getTime())} |
${commitRows}

## Median summary

Positive delta values mean that the implementation took longer than JSON.

| Scenario | Phase | ${implementationHeaders} | ${deltaHeaders} |
| --- | --- | ${summaryAlignments} | ${deltaAlignments} |
${summaryRows(runs)}

## Loader cache speedup

Speedup is cold-write median divided by warm-read median.

| Scenario | Implementation | Speedup |
| --- | --- | ---: |
${speedupRows(runs)}

## Single-loader internal metrics

These counters are emitted by implementations that support the benchmark
instrumentation. Times and counts are medians across the benchmark iterations.

| Scenario | Implementation | Phase | JS yields | Rust hits | Rust misses | Hash time | Deserialize time | Files read | Bytes read |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${instrumentationRows(runs)}

## Detailed timings

| Scenario | Implementation | Phase | Min | Median | Mean | Max |
| --- | --- | --- | ---: | ---: | ---: | ---: |
${detailRows(runs)}

## Cache footprint

| Scenario | Implementation | Files | Size |
| --- | --- | ---: | ---: |
${cacheRows(runs)}

## Raw results

${rawResults}
`;

await fs.writeFile(resultPath, markdown);
console.log(chalk.bold.green(`Wrote ${resultFilename}`));
