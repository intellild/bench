#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

const [jsonResultPath, storageResultPath] = process.argv.slice(2);

if (!jsonResultPath || !storageResultPath) {
  throw new Error(
    'Usage: node compare-loader-cache-results.mjs <json-result> <storage-result>',
  );
}

const [jsonResult, storageResult] = await Promise.all(
  [jsonResultPath, storageResultPath].map(async (resultPath) =>
    JSON.parse(await fs.readFile(path.resolve(resultPath), 'utf8')),
  ),
);

function scenario(result, name) {
  const value = result.scenarios.find((item) => item.name === name);
  if (!value) {
    throw new Error(`${result.branch} result does not contain ${name}`);
  }
  return value;
}

function percent(value, baseline) {
  return ((value / baseline - 1) * 100).toFixed(1);
}

function row(name, jsonValue, storageValue, unit = 'ms') {
  return {
    metric: name,
    json: `${jsonValue.toFixed(1)} ${unit}`,
    rspackStorage: `${storageValue.toFixed(1)} ${unit}`,
    storageVsJson: `${percent(storageValue, jsonValue)}%`,
  };
}

const jsonBackend = scenario(jsonResult, 'backend-only');
const storageBackend = scenario(storageResult, 'backend-only');
const jsonSlow = scenario(jsonResult, 'slow-loader');
const storageSlow = scenario(storageResult, 'slow-loader');

console.log(`JSON: ${jsonResult.branch}`);
console.log(`rspack_storage: ${storageResult.branch}`);
console.log(
  `modules: ${jsonResult.moduleCount}, iterations: ${jsonResult.iterations}`,
);
console.table([
  row(
    'backend cold write median',
    jsonBackend.write.median,
    storageBackend.write.median,
  ),
  row(
    'backend warm read median',
    jsonBackend.read.median,
    storageBackend.read.median,
  ),
  row('slow loader cold median', jsonSlow.write.median, storageSlow.write.median),
  row('slow loader warm median', jsonSlow.read.median, storageSlow.read.median),
  row(
    'cache bytes',
    jsonBackend.cache.bytes,
    storageBackend.cache.bytes,
    'bytes',
  ),
  row(
    'cache files',
    jsonBackend.cache.files,
    storageBackend.cache.files,
    'files',
  ),
]);
