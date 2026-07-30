#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

const [jsonResultPath, rkyvResultPath, storageResultPath] =
  process.argv.slice(2);

if (!jsonResultPath || !rkyvResultPath || !storageResultPath) {
  throw new Error(
    'Usage: node compare-loader-cache-results.mjs <json-result> <rkyv-result> <storage-result>',
  );
}

const [jsonResult, rkyvResult, storageResult] = await Promise.all(
  [jsonResultPath, rkyvResultPath, storageResultPath].map(async (resultPath) =>
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

function row(name, jsonValue, rkyvValue, storageValue, unit = 'ms') {
  return {
    metric: name,
    json: `${jsonValue.toFixed(1)} ${unit}`,
    rkyv: `${rkyvValue.toFixed(1)} ${unit}`,
    rspackStorage: `${storageValue.toFixed(1)} ${unit}`,
    rkyvVsJson: `${percent(rkyvValue, jsonValue)}%`,
    storageVsJson: `${percent(storageValue, jsonValue)}%`,
  };
}

const jsonBackend = scenario(jsonResult, 'backend-only');
const rkyvBackend = scenario(rkyvResult, 'backend-only');
const storageBackend = scenario(storageResult, 'backend-only');
const jsonSlow = scenario(jsonResult, 'slow-loader');
const rkyvSlow = scenario(rkyvResult, 'slow-loader');
const storageSlow = scenario(storageResult, 'slow-loader');

console.log(`JSON: ${jsonResult.branch}`);
console.log(`rkyv: ${rkyvResult.branch}`);
console.log(`rspack_storage: ${storageResult.branch}`);
console.log(
  `modules: ${jsonResult.moduleCount}, iterations: ${jsonResult.iterations}`,
);
console.table([
  row(
    'backend cold write median',
    jsonBackend.write.median,
    rkyvBackend.write.median,
    storageBackend.write.median,
  ),
  row(
    'backend warm read median',
    jsonBackend.read.median,
    rkyvBackend.read.median,
    storageBackend.read.median,
  ),
  row(
    'slow loader cold median',
    jsonSlow.write.median,
    rkyvSlow.write.median,
    storageSlow.write.median,
  ),
  row(
    'slow loader warm median',
    jsonSlow.read.median,
    rkyvSlow.read.median,
    storageSlow.read.median,
  ),
  row(
    'cache bytes',
    jsonBackend.cache.bytes,
    rkyvBackend.cache.bytes,
    storageBackend.cache.bytes,
    'bytes',
  ),
  row(
    'cache files',
    jsonBackend.cache.files,
    rkyvBackend.cache.files,
    storageBackend.cache.files,
    'files',
  ),
]);
