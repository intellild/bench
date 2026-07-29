#!/usr/bin/env node

import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const babelLoaderPath = require.resolve('babel-loader');
const repoRootValue = process.env.RSPACK_REPO;
if (!repoRootValue) {
  throw new Error('RSPACK_REPO must point to an Rspack checkout');
}
const repoRoot = path.resolve(repoRootValue);
const cliPath = path.join(repoRoot, 'packages/rspack-cli/bin/rspack.js');
const benchRoot =
  process.env.RSPACK_LOADER_CACHE_BENCH_DIR ??
  path.join(os.tmpdir(), 'rspack-loader-cache-bench');
const iterations = readPositiveInteger(
  'RSPACK_LOADER_CACHE_BENCH_ITERATIONS',
  5,
);
const manifest = JSON.parse(
  await fs.readFile(path.join(projectRoot, 'fixtures/manifest.json'), 'utf8'),
);

function readPositiveInteger(name, fallback) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

async function prepareFixture(name) {
  const source = path.join(projectRoot, 'fixtures', name);
  await fs.rm(benchRoot, { recursive: true, force: true });
  await fs.cp(source, benchRoot, { recursive: true });

  const reliableTime = new Date(Date.now() - 10_000);
  const srcDir = path.join(benchRoot, 'src');
  const files = await fs.readdir(srcDir);
  await Promise.all(
    files.map((filename) =>
      fs.utimes(path.join(srcDir, filename), reliableTime, reliableTime),
    ),
  );
}

async function clearCompilerCache() {
  const cacheDir = path.join(benchRoot, '.cache');
  let entries;
  try {
    entries = await fs.readdir(cacheDir);
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
  await Promise.all(
    entries
      .filter((entry) => entry !== 'loader-cache')
      .map((entry) =>
        fs.rm(path.join(cacheDir, entry), { recursive: true, force: true }),
      ),
  );
}

async function cacheStats() {
  const root = path.join(benchRoot, '.cache', 'loader-cache');

  async function visit(directory) {
    let entries;
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (error.code === 'ENOENT') return { files: 0, bytes: 0 };
      throw error;
    }
    const children = await Promise.all(
      entries.map(async (entry) => {
        const target = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          return visit(target);
        }
        return { files: 1, bytes: (await fs.stat(target)).size };
      }),
    );
    return children.reduce(
      (total, child) => ({
        files: total.files + child.files,
        bytes: total.bytes + child.bytes,
      }),
      { files: 0, bytes: 0 },
    );
  }

  return visit(root);
}

async function runBuild() {
  await fs.rm(path.join(benchRoot, 'dist'), { recursive: true, force: true });
  const start = performance.now();

  await new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [cliPath, '--config', path.join(benchRoot, 'rspack.config.cjs')],
      {
        cwd: benchRoot,
        env: {
          ...process.env,
          RSPACK_LOADER_CACHE_BENCH_BABEL_LOADER: babelLoaderPath,
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
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `Rspack exited with ${code}\n${stdout.trim()}\n${stderr.trim()}`,
          ),
        );
      }
    });
  });

  return { elapsedMs: performance.now() - start };
}

function summarize(values) {
  const sorted = values.toSorted((a, b) => a - b);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return {
    min: sorted[0],
    median: sorted[Math.floor(sorted.length / 2)],
    mean,
    max: sorted.at(-1),
  };
}

function formatMs(value) {
  return `${value.toFixed(1)} ms`;
}

async function benchmarkScenario({ name, complexity }) {
  const writes = [];
  const reads = [];
  let stats;

  await prepareFixture(name);
  for (let iteration = 0; iteration < iterations; iteration++) {
    await fs.rm(path.join(benchRoot, '.cache'), {
      recursive: true,
      force: true,
    });
    const write = await runBuild();
    stats = await cacheStats();
    if (stats.files === 0 || stats.bytes === 0) {
      throw new Error(`${name} cold write did not create loader cache data`);
    }
    writes.push(write.elapsedMs);

    await clearCompilerCache();
    const read = await runBuild();
    reads.push(read.elapsedMs);
  }

  return {
    name,
    complexity,
    write: summarize(writes),
    read: summarize(reads),
    cache: stats,
  };
}

await fs.access(cliPath);
const scenarios = [];
for (const scenario of manifest.scenarios) {
  scenarios.push(await benchmarkScenario(scenario));
}
const backendOnly = scenarios.find(({ name }) => name === 'backend-only');
const slowLoader = scenarios.find(({ name }) => name === 'slow-loader');

console.log(
  JSON.stringify(
    {
      branch: process.env.RSPACK_LOADER_CACHE_BENCH_LABEL ?? 'unknown',
      moduleCount: manifest.moduleCount,
      iterations,
      scenarios,
    },
    null,
    2,
  ),
);
console.error(
  [
    `${process.env.RSPACK_LOADER_CACHE_BENCH_LABEL ?? 'unknown'}:`,
    `backend write ${formatMs(backendOnly.write.median)},`,
    `backend read ${formatMs(backendOnly.read.median)},`,
    `slow cold ${formatMs(slowLoader.write.median)},`,
    `slow warm ${formatMs(slowLoader.read.median)},`,
    `${backendOnly.cache.files} files / ${backendOnly.cache.bytes} bytes`,
  ].join(' '),
);
