#!/usr/bin/env zx

import os from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { $, chalk } from 'zx';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
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
    label: 'rspack-storage',
    title: 'rspack_storage',
    repo: path.join(projectRoot, 'rspack-storage'),
  },
];

if (process.argv.includes('--help')) {
  console.log(`Usage: pnpm benchmark

Runs the JSON and rspack_storage benchmarks sequentially and writes
result-YYYY-MM-DD.md in the benchmark repository.

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
  const output = await $({
    cwd: repo,
    quiet: true,
  })`git ${args}`;
  return output.stdout.trim();
}

async function runImplementation(implementation) {
  console.log(chalk.cyan(`Running ${implementation.title} benchmark...`));
  const output = await $({
    cwd: projectRoot,
    env: {
      ...process.env,
      RSPACK_REPO: implementation.repo,
      RSPACK_LOADER_CACHE_BENCH_LABEL: implementation.label,
    },
    quiet: true,
  })`${process.execPath} ${benchmarkScript}`;
  const result = JSON.parse(output.stdout);

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

function summaryRows(jsonRun, storageRun) {
  const rows = [];
  for (const scenarioDefinition of manifest.scenarios) {
    const jsonScenario = findScenario(
      jsonRun.result,
      scenarioDefinition.name,
    );
    const storageScenario = findScenario(
      storageRun.result,
      scenarioDefinition.name,
    );
    for (const [phase, title] of [
      ['write', 'Cold write'],
      ['read', 'Warm read'],
    ]) {
      const jsonValue = jsonScenario[phase].median;
      const storageValue = storageScenario[phase].median;
      rows.push(
        `| ${scenarioDefinition.name} | ${title} | ${formatMs(jsonValue)} | ${formatMs(storageValue)} | ${formatDelta(storageValue, jsonValue)} |`,
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

const runs = [];
for (const implementation of implementations) {
  runs.push(await runImplementation(implementation));
}

const finishedAt = new Date();
const [jsonRun, storageRun] = runs;
const resultFilename = `result-${localDate(finishedAt)}.md`;
const resultPath = path.join(projectRoot, resultFilename);
const cpu = os.cpus()[0]?.model ?? 'unknown';
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
| JSON commit | \`${jsonRun.commit}\` (${jsonRun.branch || 'detached'}) |
| rspack_storage commit | \`${storageRun.commit}\` (${storageRun.branch || 'detached'}) |

## Median summary

Positive values in the final column mean that \`rspack_storage\` took longer
than the JSON implementation.

| Scenario | Phase | JSON | rspack_storage | Storage vs JSON |
| --- | --- | ---: | ---: | ---: |
${summaryRows(jsonRun, storageRun)}

## Loader cache speedup

Speedup is cold-write median divided by warm-read median.

| Scenario | Implementation | Speedup |
| --- | --- | ---: |
${speedupRows(runs)}

## Detailed timings

| Scenario | Implementation | Phase | Min | Median | Mean | Max |
| --- | --- | --- | ---: | ---: | ---: | ---: |
${detailRows(runs)}

## Cache footprint

| Scenario | Implementation | Files | Size |
| --- | --- | ---: | ---: |
${cacheRows(runs)}

## Raw results

<details>
<summary>JSON</summary>

\`\`\`json
${JSON.stringify(jsonRun.result, null, 2)}
\`\`\`

</details>

<details>
<summary>rspack_storage</summary>

\`\`\`json
${JSON.stringify(storageRun.result, null, 2)}
\`\`\`

</details>
`;

await fs.writeFile(resultPath, markdown);
console.log(chalk.bold.green(`Wrote ${resultFilename}`));
