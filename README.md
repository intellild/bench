# Loader cache storage benchmark

This repository compares the loader cache implementation that writes one JSON
file per entry with the implementation backed by `rspack_storage`.

It contains two Rspack submodules pinned to the implementations being compared:

| Directory | Source branch | Implementation |
| --- | --- | --- |
| `rspack-json` | `codex/loader-cache-json` | One JSON file per cache entry |
| `rspack-storage` | `codex/loader-cache-rspack-storage` | Dedicated `rspack_storage` instance |

## Execution flow

```text
Committed fixture
  copied to a temporary directory
       ↓
Cold build
  populate loader cache
       ↓
Remove compiler persistent cache
  retain loader cache only
       ↓
Warm build
  measure loader-cache reuse
       ↓
Compare JSON and rspack_storage results
```

Two fixture scenarios are committed:

- `backend-only`: a local identity JS loader that exposes storage read/write
  overhead.
- `slow-loader`: `babel-loader` processing generated JavaScript to measure
  complete cold and warm compilation performance.

## Clone and prepare

Clone this repository with its submodules:

```sh
git clone --recurse-submodules <benchmark-repository-url>
cd <benchmark-dir>
```

For an existing clone:

```sh
git submodule update --init --recursive
```

Install the benchmark's npm dependencies:

```sh
cd <benchmark-dir>
pnpm install --frozen-lockfile
```

Install dependencies and build both Rspack development CLIs:

```sh
cd <benchmark-dir>/rspack-json
pnpm install --frozen-lockfile
pnpm run build:cli:dev

cd <benchmark-dir>/rspack-storage
pnpm install --frozen-lockfile
pnpm run build:cli:dev
```

Storage/native-watcher tests are not required to run this benchmark.

## Run the comparison

JSON results are written to stdout; a short summary is written to stderr.

```sh
cd <benchmark-dir>

pnpm bench:json
pnpm bench:storage
pnpm compare
```

The generated runtime directory defaults to
`$TMPDIR/rspack-loader-cache-bench`. The second measurement recreates this
directory, so implementations never share cached data.

## Regenerate committed fixtures

The fixture generator defaults to 1,000 modules and 200 generated statements
per module in the slow-loader scenario:

```sh
pnpm generate
```

To change their size:

```sh
RSPACK_LOADER_CACHE_BENCH_MODULES=2000 \
RSPACK_LOADER_CACHE_BENCH_COMPLEXITY=400 \
pnpm generate
```

Commit `fixtures/manifest.json` and both generated fixture directories together
with generator changes. Generated source files contain a header warning against
manual edits.

## Runtime configuration

| Variable | Default | Meaning |
| --- | ---: | --- |
| `RSPACK_REPO` | required | Path to the Rspack submodule being measured |
| `RSPACK_LOADER_CACHE_BENCH_LABEL` | `unknown` | Label stored in result JSON |
| `RSPACK_LOADER_CACHE_BENCH_DIR` | OS temp directory | Runtime fixture, cache, and output directory |
| `RSPACK_LOADER_CACHE_BENCH_ITERATIONS` | `5` | Cold/warm measurement pairs |

For a quick smoke measurement, reduce the iteration count:

```sh
RSPACK_LOADER_CACHE_BENCH_ITERATIONS=2 \
pnpm bench:json
```

For stable comparisons, close other CPU- or disk-heavy processes, use the same
Rspack build profile for both implementations, and run both measurements on the
same filesystem.
