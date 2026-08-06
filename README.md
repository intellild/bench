# Loader cache storage benchmark

This repository compares whole-chain JSON/rkyv loader caches, a single-loader
result cache, and the implementation backed by `rspack_storage`.

It contains four Rspack submodules pinned to the implementations being compared:

| Directory | Source branch | Implementation |
| --- | --- | --- |
| `rspack-json` | `codex/loader-cache-json` | One JSON file per cache entry |
| `rspack-rkyv` | `codex/loader-cache-rkyv` | One rkyv file per cache entry |
| `rspack-single-loader` | `codex/loader-cache-single-loader` | Rust-side cache for each loader result, keyed by input source and options |
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
Compare JSON, rkyv, single-loader, and rspack_storage results
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

Install dependencies and build all four Rspack development CLIs:

```sh
cd <benchmark-dir>/rspack-json
pnpm install --frozen-lockfile
pnpm run build:cli:dev

cd <benchmark-dir>/rspack-rkyv
pnpm install --frozen-lockfile
pnpm run build:cli:dev

cd <benchmark-dir>/rspack-single-loader
pnpm install --frozen-lockfile
pnpm run build:cli:dev

cd <benchmark-dir>/rspack-storage
pnpm install --frozen-lockfile
pnpm run build:cli:dev
```

Storage/native-watcher tests are not required to run this benchmark.

## Run the comparison

Run all four implementations and write a dated Markdown report:

```sh
cd <benchmark-dir>

pnpm benchmark
```

The command writes `result-YYYY-MM-DD-HH-mm-ss.md` with:

- environment and pinned submodule commits;
- median comparison and rkyv/single-loader/`rspack_storage` percentage deltas from JSON;
- min, median, mean, and max timings;
- cold-to-warm speedup;
- cache file count and size;
- raw JSON results.

To run or compare implementations manually:

```sh
pnpm bench:json
pnpm bench:rkyv
pnpm bench:single-loader
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

The zx runner forwards these variables to both implementations. For a quick
dated smoke report, reduce the iteration count:

```sh
RSPACK_LOADER_CACHE_BENCH_ITERATIONS=2 \
pnpm benchmark
```

For stable comparisons, close other CPU- or disk-heavy processes, use the same
Rspack build profile for both implementations, and run both measurements on the
same filesystem.

## Compare persistent make cache with loader cache only

Run the standalone full-build comparison against `rspack-storage`:

```sh
pnpm benchmark:make-cache
```

For every iteration, the script runs a cold build and snapshots its complete
cache. It then restores that same snapshot for two complete warm builds:

1. keep the complete persistent cache, including the cached make artifacts;
2. remove compilation persistent-cache entries, switch persistence to readonly,
   and retain only `loader-cache`.

The order of the two warm builds alternates between iterations. The generated
`result-make-cache-YYYY-MM-DD-HH-mm-ss.md` report contains external whole-process
time and every Rspack compilation pass reported by the internal pass logger,
including `build module graph` (make), optimization, code generation, asset
creation, processing, and emission. A residual row preserves startup,
configuration, persistent-cache load/flush, stats generation, and shutdown time
that is included in the complete build but outside those pass timers.

Use another checkout or run a smaller smoke benchmark with:

```sh
RSPACK_REPO=<path-to-rspack-checkout> \
RSPACK_LOADER_CACHE_MAKE_BENCH_ITERATIONS=2 \
RSPACK_LOADER_CACHE_MAKE_BENCH_SCENARIO=slow-loader \
pnpm benchmark:make-cache
```

The script is self-contained; it creates the temporary stats configuration and
cache snapshots itself. The selected Rspack checkout must already have its
development CLI built.
