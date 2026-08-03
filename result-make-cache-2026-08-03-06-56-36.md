# Persist make cache vs loader cache — 2026-08-03

Generated at 2026-08-03T06:56:36.114Z.

Each iteration performs one cold build, snapshots the complete cache, and then
runs both warm modes from identical snapshots. Mode order alternates between
iterations. “Loader cache only” removes every top-level persistent-cache entry
except `loader-cache` and uses readonly cache mode before starting the measured
build. This keeps loader-cache persistence available without writing compilation
cache entries during the measurement.

## Environment

| Item | Value |
| --- | --- |
| Platform | linux x64 |
| CPU | Intel(R) Xeon(R) Platinum 8336C CPU @ 2.30GHz |
| Logical CPUs | 32 |
| Node.js | v24.18.0 |
| Rspack repository | `/data00/home/jinzhixin/projects/bench/rspack-storage` |
| Rspack commit | `f80d5778d7f1c1d68093ffd1fd86717616c19067` |
| Modules | 1000 |
| Iterations | 5 |
| Benchmark duration | 80336.0 ms |

## Complete build median

The complete build is measured outside the CLI process and therefore includes
Node.js startup, configuration loading, compiler setup, compilation passes, and
asset emission. Positive delta means loader-cache-only took longer.

| Scenario | Cold populate | Persist cache in make | Loader cache only | Loader only vs persist |
| --- | ---: | ---: | ---: | ---: |
| backend-only | 996.8 ms | 455.2 ms | 432.3 ms | -5.0% |
| slow-loader | 12265.7 ms | 458.6 ms | 795.1 ms | +73.4% |

## Compilation pass median

These timings come from Rspack's own `rspack.Compilation` pass logger. Cache
restore/save hooks are included in their corresponding pass. `emit assets`
comes from the compiler logger and runs after the compilation passes.

| Scenario | Phase | Persist cache in make | Loader cache only | Loader only vs persist |
| --- | --- | ---: | ---: | ---: |
| backend-only | build module graph | 105.6 ms | 117.6 ms | +11.3% |
| backend-only | finish modules | 15.6 ms | 15.8 ms | +1.2% |
| backend-only | seal | 0.0 ms | 0.0 ms | -14.9% |
| backend-only | optimize dependencies | 2.5 ms | 2.8 ms | +11.0% |
| backend-only | build chunk graph | 17.7 ms | 18.1 ms | +2.1% |
| backend-only | optimize modules | 0.1 ms | 0.1 ms | -4.7% |
| backend-only | optimize chunks | 10.2 ms | 10.5 ms | +2.7% |
| backend-only | optimize tree | 0.0 ms | 0.0 ms | +37.1% |
| backend-only | optimize chunk modules | 0.0 ms | 0.0 ms | +33.3% |
| backend-only | module ids | 4.5 ms | 4.6 ms | +3.1% |
| backend-only | chunk ids | 0.5 ms | 0.6 ms | +34.5% |
| backend-only | assign runtime ids | 0.0 ms | 0.0 ms | +20.1% |
| backend-only | optimize code generation | 0.0 ms | 0.0 ms | +15.9% |
| backend-only | create module hashes | 11.5 ms | 11.5 ms | +0.2% |
| backend-only | code generation | 63.7 ms | 64.3 ms | +1.0% |
| backend-only | runtime requirements | 6.5 ms | 6.5 ms | -0.1% |
| backend-only | hashing | 8.0 ms | 9.1 ms | +13.8% |
| backend-only | create module assets | 0.2 ms | 0.2 ms | +14.7% |
| backend-only | create chunk assets | 10.5 ms | 10.8 ms | +3.0% |
| backend-only | process assets | 0.4 ms | 0.3 ms | -25.7% |
| backend-only | after process assets | 0.0 ms | 0.0 ms | -24.9% |
| backend-only | after seal | 0.0 ms | 0.0 ms | -3.8% |
| backend-only | emit assets | 7.9 ms | 9.3 ms | +17.7% |
| backend-only | outside pass timers | 183.5 ms | 151.0 ms | -17.7% |
| slow-loader | build module graph | 107.1 ms | 461.7 ms | +331.0% |
| slow-loader | finish modules | 14.7 ms | 15.4 ms | +5.1% |
| slow-loader | seal | 0.0 ms | 0.0 ms | +5.0% |
| slow-loader | optimize dependencies | 2.6 ms | 2.8 ms | +6.8% |
| slow-loader | build chunk graph | 16.8 ms | 17.0 ms | +1.3% |
| slow-loader | optimize modules | 0.1 ms | 0.1 ms | -14.0% |
| slow-loader | optimize chunks | 10.2 ms | 10.8 ms | +5.8% |
| slow-loader | optimize tree | 0.0 ms | 0.0 ms | -24.1% |
| slow-loader | optimize chunk modules | 0.0 ms | 0.0 ms | -4.9% |
| slow-loader | module ids | 4.2 ms | 4.4 ms | +5.6% |
| slow-loader | chunk ids | 0.5 ms | 0.7 ms | +36.3% |
| slow-loader | assign runtime ids | 0.0 ms | 0.0 ms | +17.9% |
| slow-loader | optimize code generation | 0.0 ms | 0.0 ms | +1.6% |
| slow-loader | create module hashes | 11.4 ms | 11.2 ms | -1.6% |
| slow-loader | code generation | 65.5 ms | 64.4 ms | -1.7% |
| slow-loader | runtime requirements | 6.4 ms | 6.6 ms | +2.7% |
| slow-loader | hashing | 7.3 ms | 7.7 ms | +6.3% |
| slow-loader | create module assets | 0.2 ms | 0.2 ms | -6.1% |
| slow-loader | create chunk assets | 9.8 ms | 10.0 ms | +2.7% |
| slow-loader | process assets | 0.3 ms | 0.3 ms | -12.7% |
| slow-loader | after process assets | 0.0 ms | 0.0 ms | -14.8% |
| slow-loader | after seal | 0.0 ms | 0.0 ms | +5.6% |
| slow-loader | emit assets | 22.2 ms | 22.0 ms | -0.7% |
| slow-loader | outside pass timers | 177.4 ms | 156.0 ms | -12.1% |

## Raw results

`unaccountedMs` is complete process time minus all sequential compilation
passes and compiler asset emission. It includes process startup, configuration,
compiler creation, hook gaps, stats generation, and shutdown.

```json
{
  "repoRoot": "/data00/home/jinzhixin/projects/bench/rspack-storage",
  "commit": "f80d5778d7f1c1d68093ffd1fd86717616c19067",
  "iterations": 5,
  "scenarios": [
    {
      "name": "backend-only",
      "complexity": 1,
      "cold": {
        "total": {
          "min": 990.1891209999994,
          "median": 996.7977060000003,
          "mean": 1105.7878289999994,
          "max": 1541.607008
        },
        "unaccounted": {
          "min": 200.6564910000003,
          "median": 207.45088699999928,
          "mean": 298.84073819999946,
          "max": 666.496501
        },
        "phases": {
          "build module graph": {
            "min": 619.773868,
            "median": 630.016293,
            "mean": 637.954669,
            "max": 680.177915
          },
          "finish modules": {
            "min": 15.033635,
            "median": 15.334315,
            "mean": 16.721462,
            "max": 22.651485
          },
          "seal": {
            "min": 0.035856,
            "median": 0.054117,
            "mean": 0.0496916,
            "max": 0.064192
          },
          "optimize dependencies": {
            "min": 2.37094,
            "median": 2.422822,
            "mean": 2.8250728,
            "max": 4.325101
          },
          "build chunk graph": {
            "min": 16.910654,
            "median": 17.330046,
            "mean": 19.026139399999998,
            "max": 25.824991
          },
          "optimize modules": {
            "min": 0.049858,
            "median": 0.057935,
            "mean": 0.0681648,
            "max": 0.097356
          },
          "optimize chunks": {
            "min": 9.834255,
            "median": 10.506428,
            "mean": 10.5188706,
            "max": 11.394086
          },
          "optimize tree": {
            "min": 0.029056,
            "median": 0.030649,
            "mean": 0.036864799999999996,
            "max": 0.050369
          },
          "optimize chunk modules": {
            "min": 0.01739,
            "median": 0.019268,
            "mean": 0.020767,
            "max": 0.024974
          },
          "module ids": {
            "min": 4.218946,
            "median": 4.424977,
            "mean": 4.520496400000001,
            "max": 4.972391
          },
          "chunk ids": {
            "min": 0.42816,
            "median": 0.54167,
            "mean": 0.5028156,
            "max": 0.546048
          },
          "assign runtime ids": {
            "min": 0.021837,
            "median": 0.024348,
            "mean": 0.0272224,
            "max": 0.03547
          },
          "optimize code generation": {
            "min": 0.009898,
            "median": 0.011559,
            "mean": 0.0122664,
            "max": 0.01507
          },
          "create module hashes": {
            "min": 11.090495,
            "median": 11.895487,
            "mean": 12.473954599999999,
            "max": 15.924759
          },
          "code generation": {
            "min": 62.63635,
            "median": 64.240769,
            "mean": 64.9066054,
            "max": 70.097044
          },
          "runtime requirements": {
            "min": 6.60846,
            "median": 7.392483,
            "mean": 7.2954186,
            "max": 8.063524
          },
          "hashing": {
            "min": 7.320404,
            "median": 10.013827,
            "mean": 9.3095424,
            "max": 11.195668
          },
          "create module assets": {
            "min": 0.204337,
            "median": 0.237788,
            "mean": 0.241901,
            "max": 0.292325
          },
          "create chunk assets": {
            "min": 10.059104,
            "median": 10.265475,
            "mean": 10.373061400000001,
            "max": 10.737368
          },
          "process assets": {
            "min": 0.36373,
            "median": 0.437586,
            "mean": 0.42833180000000004,
            "max": 0.472266
          },
          "after process assets": {
            "min": 0.017958,
            "median": 0.021628,
            "mean": 0.021065800000000003,
            "max": 0.025079
          },
          "after seal": {
            "min": 0.014213,
            "median": 0.018749,
            "mean": 0.0180528,
            "max": 0.021743
          },
          "emit assets": {
            "min": 7.865448,
            "median": 10.235142,
            "mean": 9.594654199999999,
            "max": 10.77173
          }
        }
      },
      "persistMake": {
        "total": {
          "min": 444.58941400000003,
          "median": 455.185735,
          "mean": 460.20659939999985,
          "max": 481.31621000000086
        },
        "unaccounted": {
          "min": 175.44894400000004,
          "median": 183.50251400000002,
          "mean": 184.96985719999984,
          "max": 198.6855359999986
        },
        "phases": {
          "build module graph": {
            "min": 98.474275,
            "median": 105.608538,
            "mean": 109.87525679999999,
            "max": 133.119681
          },
          "finish modules": {
            "min": 14.808885,
            "median": 15.583104,
            "mean": 15.914515799999998,
            "max": 17.882064
          },
          "seal": {
            "min": 0.033062,
            "median": 0.046108,
            "mean": 0.047495600000000006,
            "max": 0.05913
          },
          "optimize dependencies": {
            "min": 2.3884,
            "median": 2.505967,
            "mean": 2.9428326,
            "max": 3.811228
          },
          "build chunk graph": {
            "min": 16.926235,
            "median": 17.72432,
            "mean": 17.8876124,
            "max": 18.679672
          },
          "optimize modules": {
            "min": 0.046449,
            "median": 0.059914,
            "mean": 0.06091739999999999,
            "max": 0.07514
          },
          "optimize chunks": {
            "min": 9.528878,
            "median": 10.208868,
            "mean": 10.3488652,
            "max": 11.386358
          },
          "optimize tree": {
            "min": 0.0318,
            "median": 0.033115,
            "mean": 0.035376399999999995,
            "max": 0.046211
          },
          "optimize chunk modules": {
            "min": 0.01817,
            "median": 0.018376,
            "mean": 0.019694999999999997,
            "max": 0.025275
          },
          "module ids": {
            "min": 4.260336,
            "median": 4.459627,
            "mean": 4.408078199999999,
            "max": 4.512354
          },
          "chunk ids": {
            "min": 0.463964,
            "median": 0.470839,
            "mean": 0.5056444,
            "max": 0.584345
          },
          "assign runtime ids": {
            "min": 0.020966,
            "median": 0.023806,
            "mean": 0.025220399999999997,
            "max": 0.03266
          },
          "optimize code generation": {
            "min": 0.009082,
            "median": 0.010562,
            "mean": 0.0113952,
            "max": 0.01477
          },
          "create module hashes": {
            "min": 11.300496,
            "median": 11.522154,
            "mean": 12.6354778,
            "max": 16.983756
          },
          "code generation": {
            "min": 61.012905,
            "median": 63.72611,
            "mean": 65.2432774,
            "max": 69.624155
          },
          "runtime requirements": {
            "min": 6.217519,
            "median": 6.541358,
            "mean": 6.6500596000000005,
            "max": 7.268864
          },
          "hashing": {
            "min": 7.382438,
            "median": 7.982615,
            "mean": 9.074311400000001,
            "max": 11.389956
          },
          "create module assets": {
            "min": 0.188232,
            "median": 0.193026,
            "mean": 0.19777139999999999,
            "max": 0.215838
          },
          "create chunk assets": {
            "min": 9.566313,
            "median": 10.510748,
            "mean": 10.485252,
            "max": 11.106296
          },
          "process assets": {
            "min": 0.312514,
            "median": 0.386762,
            "mean": 0.38302240000000004,
            "max": 0.469669
          },
          "after process assets": {
            "min": 0.016752,
            "median": 0.023734,
            "mean": 0.023963400000000003,
            "max": 0.031886
          },
          "after seal": {
            "min": 0.014972,
            "median": 0.019371,
            "mean": 0.0196272,
            "max": 0.02446
          },
          "emit assets": {
            "min": 7.629785,
            "median": 7.899455,
            "mean": 8.4410742,
            "max": 9.655108
          }
        }
      },
      "loaderOnly": {
        "total": {
          "min": 425.95742099999916,
          "median": 432.3370789999999,
          "mean": 434.7416059999996,
          "max": 449.9958939999997
        },
        "unaccounted": {
          "min": 148.61332799999911,
          "median": 150.99999699999967,
          "mean": 151.8384281999996,
          "max": 157.25597999999968
        },
        "phases": {
          "build module graph": {
            "min": 112.087015,
            "median": 117.591977,
            "mean": 116.6267746,
            "max": 120.090847
          },
          "finish modules": {
            "min": 15.427513,
            "median": 15.771555,
            "mean": 16.2385028,
            "max": 18.316736
          },
          "seal": {
            "min": 0.034253,
            "median": 0.039233,
            "mean": 0.0461716,
            "max": 0.063579
          },
          "optimize dependencies": {
            "min": 2.41083,
            "median": 2.781748,
            "mean": 2.7360852,
            "max": 2.977715
          },
          "build chunk graph": {
            "min": 17.128832,
            "median": 18.096856,
            "mean": 18.5724746,
            "max": 21.463296
          },
          "optimize modules": {
            "min": 0.046934,
            "median": 0.05711,
            "mean": 0.058421999999999995,
            "max": 0.074069
          },
          "optimize chunks": {
            "min": 10.119186,
            "median": 10.487523,
            "mean": 10.722054400000001,
            "max": 11.850177
          },
          "optimize tree": {
            "min": 0.030953,
            "median": 0.045408,
            "mean": 0.040917800000000004,
            "max": 0.049569
          },
          "optimize chunk modules": {
            "min": 0.018404,
            "median": 0.024488,
            "mean": 0.022329,
            "max": 0.025038
          },
          "module ids": {
            "min": 4.320785,
            "median": 4.598099,
            "mean": 4.5425472000000005,
            "max": 4.74361
          },
          "chunk ids": {
            "min": 0.47192,
            "median": 0.633262,
            "mean": 0.6192296,
            "max": 0.693472
          },
          "assign runtime ids": {
            "min": 0.02146,
            "median": 0.028586,
            "mean": 0.029904800000000002,
            "max": 0.037905
          },
          "optimize code generation": {
            "min": 0.010028,
            "median": 0.012238,
            "mean": 0.0123874,
            "max": 0.015618
          },
          "create module hashes": {
            "min": 11.15857,
            "median": 11.546313,
            "mean": 11.513300599999999,
            "max": 11.983268
          },
          "code generation": {
            "min": 63.610606,
            "median": 64.342841,
            "mean": 64.8559116,
            "max": 68.000927
          },
          "runtime requirements": {
            "min": 6.416778,
            "median": 6.533604,
            "mean": 6.6800598,
            "max": 7.028695
          },
          "hashing": {
            "min": 7.379792,
            "median": 9.082057,
            "mean": 9.2982056,
            "max": 11.348873
          },
          "create module assets": {
            "min": 0.202775,
            "median": 0.221422,
            "mean": 0.25936380000000003,
            "max": 0.423121
          },
          "create chunk assets": {
            "min": 9.458246,
            "median": 10.825607,
            "mean": 10.9464712,
            "max": 13.537139
          },
          "process assets": {
            "min": 0.261132,
            "median": 0.287505,
            "mean": 0.2904794,
            "max": 0.314808
          },
          "after process assets": {
            "min": 0.013851,
            "median": 0.017816,
            "mean": 0.018917,
            "max": 0.02675
          },
          "after seal": {
            "min": 0.013024,
            "median": 0.018643,
            "mean": 0.01701,
            "max": 0.020484
          },
          "emit assets": {
            "min": 7.646432,
            "median": 9.294938,
            "mean": 8.7556578,
            "max": 9.700877
          }
        }
      },
      "raw": {
        "cold": [
          {
            "totalMs": 1541.607008,
            "phases": {
              "build module graph": 680.177915,
              "finish modules": 22.651485,
              "seal": 0.054117,
              "optimize dependencies": 4.325101,
              "build chunk graph": 25.824991,
              "optimize modules": 0.057935,
              "optimize chunks": 11.394086,
              "optimize tree": 0.029241,
              "optimize chunk modules": 0.01739,
              "module ids": 4.972391,
              "chunk ids": 0.452431,
              "assign runtime ids": 0.021837,
              "optimize code generation": 0.009898,
              "create module hashes": 15.924759,
              "code generation": 70.097044,
              "runtime requirements": 8.063524,
              "hashing": 10.013827,
              "create module assets": 0.249784,
              "create chunk assets": 10.059104,
              "process assets": 0.437586,
              "after process assets": 0.021721,
              "after seal": 0.019198,
              "emit assets": 10.235142
            },
            "unaccountedMs": 666.496501
          },
          {
            "totalMs": 996.7977060000003,
            "phases": {
              "build module graph": 632.966955,
              "finish modules": 15.454639,
              "seal": 0.064192,
              "optimize dependencies": 2.607033,
              "build chunk graph": 17.938958,
              "optimize modules": 0.097356,
              "optimize chunks": 10.71764,
              "optimize tree": 0.050369,
              "optimize chunk modules": 0.024974,
              "module ids": 4.735676,
              "chunk ids": 0.545769,
              "assign runtime ids": 0.03547,
              "optimize code generation": 0.01507,
              "create module hashes": 11.895487,
              "code generation": 64.881943,
              "runtime requirements": 7.392483,
              "hashing": 7.320404,
              "create module assets": 0.237788,
              "create chunk assets": 10.213448,
              "process assets": 0.40868,
              "after process assets": 0.021628,
              "after seal": 0.018749,
              "emit assets": 8.496504
            },
            "unaccountedMs": 200.6564910000003
          },
          {
            "totalMs": 990.1891209999994,
            "phases": {
              "build module graph": 619.773868,
              "finish modules": 15.033635,
              "seal": 0.035856,
              "optimize dependencies": 2.37094,
              "build chunk graph": 16.910654,
              "optimize modules": 0.049858,
              "optimize chunks": 10.506428,
              "optimize tree": 0.030649,
              "optimize chunk modules": 0.01764,
              "module ids": 4.250492,
              "chunk ids": 0.546048,
              "assign runtime ids": 0.023653,
              "optimize code generation": 0.01145,
              "create module hashes": 11.562918,
              "code generation": 64.240769,
              "runtime requirements": 7.741605,
              "hashing": 7.546704,
              "create module assets": 0.204337,
              "create chunk assets": 10.589912,
              "process assets": 0.472266,
              "after process assets": 0.025079,
              "after seal": 0.021743,
              "emit assets": 10.77173
            },
            "unaccountedMs": 207.45088699999928
          },
          {
            "totalMs": 992.0106119999991,
            "phases": {
              "build module graph": 626.838314,
              "finish modules": 15.334315,
              "seal": 0.055466,
              "optimize dependencies": 2.399468,
              "build chunk graph": 17.330046,
              "optimize modules": 0.084426,
              "optimize chunks": 10.141944,
              "optimize tree": 0.045009,
              "optimize chunk modules": 0.024563,
              "module ids": 4.218946,
              "chunk ids": 0.54167,
              "assign runtime ids": 0.030804,
              "optimize code generation": 0.013355,
              "create module hashes": 11.090495,
              "code generation": 62.63635,
              "runtime requirements": 6.60846,
              "hashing": 10.471109,
              "create module assets": 0.225271,
              "create chunk assets": 10.265475,
              "process assets": 0.36373,
              "after process assets": 0.017958,
              "after seal": 0.014213,
              "emit assets": 7.865448
            },
            "unaccountedMs": 205.3937769999991
          },
          {
            "totalMs": 1008.3346979999988,
            "phases": {
              "build module graph": 630.016293,
              "finish modules": 15.133236,
              "seal": 0.038827,
              "optimize dependencies": 2.422822,
              "build chunk graph": 17.126048,
              "optimize modules": 0.051249,
              "optimize chunks": 9.834255,
              "optimize tree": 0.029056,
              "optimize chunk modules": 0.019268,
              "module ids": 4.424977,
              "chunk ids": 0.42816,
              "assign runtime ids": 0.024348,
              "optimize code generation": 0.011559,
              "create module hashes": 11.896114,
              "code generation": 62.676921,
              "runtime requirements": 6.671021,
              "hashing": 11.195668,
              "create module assets": 0.292325,
              "create chunk assets": 10.737368,
              "process assets": 0.459397,
              "after process assets": 0.018943,
              "after seal": 0.016361,
              "emit assets": 10.604447
            },
            "unaccountedMs": 214.2060349999988
          }
        ],
        "persistMake": [
          {
            "totalMs": 455.185735,
            "phases": {
              "build module graph": 108.526519,
              "finish modules": 17.882064,
              "seal": 0.05913,
              "optimize dependencies": 3.811228,
              "build chunk graph": 18.615878,
              "optimize modules": 0.07514,
              "optimize chunks": 10.463377,
              "optimize tree": 0.046211,
              "optimize chunk modules": 0.025275,
              "module ids": 4.465909,
              "chunk ids": 0.584345,
              "assign runtime ids": 0.03266,
              "optimize code generation": 0.01477,
              "create module hashes": 11.522154,
              "code generation": 69.017845,
              "runtime requirements": 6.508752,
              "hashing": 7.382438,
              "create module assets": 0.1917,
              "create chunk assets": 10.510748,
              "process assets": 0.312514,
              "after process assets": 0.018054,
              "after seal": 0.014972,
              "emit assets": 9.655108
            },
            "unaccountedMs": 175.44894400000004
          },
          {
            "totalMs": 449.8050039999998,
            "phases": {
              "build module graph": 98.474275,
              "finish modules": 15.583104,
              "seal": 0.057437,
              "optimize dependencies": 2.505967,
              "build chunk graph": 17.491957,
              "optimize modules": 0.067328,
              "optimize chunks": 10.208868,
              "optimize tree": 0.033115,
              "optimize chunk modules": 0.018429,
              "module ids": 4.342165,
              "chunk ids": 0.470839,
              "assign runtime ids": 0.023806,
              "optimize code generation": 0.010562,
              "create module hashes": 16.983756,
              "code generation": 69.624155,
              "runtime requirements": 6.541358,
              "hashing": 7.644355,
              "create module assets": 0.200061,
              "create chunk assets": 10.880742,
              "process assets": 0.430411,
              "after process assets": 0.031886,
              "after seal": 0.02446,
              "emit assets": 9.209805
            },
            "unaccountedMs": 178.94616299999984
          },
          {
            "totalMs": 444.58941400000003,
            "phases": {
              "build module graph": 103.647271,
              "finish modules": 14.808885,
              "seal": 0.033062,
              "optimize dependencies": 2.456067,
              "build chunk graph": 16.926235,
              "optimize modules": 0.046449,
              "optimize chunks": 9.528878,
              "optimize tree": 0.03346,
              "optimize chunk modules": 0.018376,
              "module ids": 4.459627,
              "chunk ids": 0.544492,
              "assign runtime ids": 0.020966,
              "optimize code generation": 0.009621,
              "create module hashes": 11.303919,
              "code generation": 61.012905,
              "runtime requirements": 7.268864,
              "hashing": 10.972193,
              "create module assets": 0.188232,
              "create chunk assets": 9.566313,
              "process assets": 0.386762,
              "after process assets": 0.023734,
              "after seal": 0.019371,
              "emit assets": 7.811218
            },
            "unaccountedMs": 183.50251400000002
          },
          {
            "totalMs": 470.1366339999986,
            "phases": {
              "build module graph": 105.608538,
              "finish modules": 15.778679,
              "seal": 0.041741,
              "optimize dependencies": 3.552501,
              "build chunk graph": 17.72432,
              "optimize modules": 0.059914,
              "optimize chunks": 11.386358,
              "optimize tree": 0.032296,
              "optimize chunk modules": 0.01817,
              "module ids": 4.512354,
              "chunk ids": 0.464582,
              "assign runtime ids": 0.027113,
              "optimize code generation": 0.012941,
              "create module hashes": 12.067064,
              "code generation": 62.835372,
              "runtime requirements": 6.217519,
              "hashing": 11.389956,
              "create module assets": 0.193026,
              "create chunk assets": 11.106296,
              "process assets": 0.469669,
              "after process assets": 0.029391,
              "after seal": 0.023843,
              "emit assets": 7.899455
            },
            "unaccountedMs": 198.6855359999986
          },
          {
            "totalMs": 481.31621000000086,
            "phases": {
              "build module graph": 133.119681,
              "finish modules": 15.519847,
              "seal": 0.046108,
              "optimize dependencies": 2.3884,
              "build chunk graph": 18.679672,
              "optimize modules": 0.055756,
              "optimize chunks": 10.156845,
              "optimize tree": 0.0318,
              "optimize chunk modules": 0.018225,
              "module ids": 4.260336,
              "chunk ids": 0.463964,
              "assign runtime ids": 0.021557,
              "optimize code generation": 0.009082,
              "create module hashes": 11.300496,
              "code generation": 63.72611,
              "runtime requirements": 6.713805,
              "hashing": 7.982615,
              "create module assets": 0.215838,
              "create chunk assets": 10.362161,
              "process assets": 0.315756,
              "after process assets": 0.016752,
              "after seal": 0.01549,
              "emit assets": 7.629785
            },
            "unaccountedMs": 188.26612900000077
          }
        ],
        "loaderOnly": [
          {
            "totalMs": 428.96213999999964,
            "phases": {
              "build module graph": 112.087015,
              "finish modules": 15.452634,
              "seal": 0.063579,
              "optimize dependencies": 2.977715,
              "build chunk graph": 18.096856,
              "optimize modules": 0.074069,
              "optimize chunks": 10.487523,
              "optimize tree": 0.049569,
              "optimize chunk modules": 0.025038,
              "module ids": 4.598099,
              "chunk ids": 0.47192,
              "assign runtime ids": 0.037905,
              "optimize code generation": 0.010028,
              "create module hashes": 11.271025,
              "code generation": 64.342841,
              "runtime requirements": 7.028695,
              "hashing": 11.348873,
              "create module assets": 0.202775,
              "create chunk assets": 11.178181,
              "process assets": 0.287505,
              "after process assets": 0.02675,
              "after seal": 0.020484,
              "emit assets": 7.823064
            },
            "unaccountedMs": 150.99999699999967
          },
          {
            "totalMs": 432.3370789999999,
            "phases": {
              "build module graph": 118.239373,
              "finish modules": 15.771555,
              "seal": 0.038945,
              "optimize dependencies": 2.41083,
              "build chunk graph": 17.128832,
              "optimize modules": 0.05711,
              "optimize chunks": 10.267654,
              "optimize tree": 0.030953,
              "optimize chunk modules": 0.018983,
              "module ids": 4.644551,
              "chunk ids": 0.693472,
              "assign runtime ids": 0.034258,
              "optimize code generation": 0.015618,
              "create module hashes": 11.983268,
              "code generation": 63.610606,
              "runtime requirements": 6.462856,
              "hashing": 7.379792,
              "create module assets": 0.211241,
              "create chunk assets": 10.825607,
              "process assets": 0.261132,
              "after process assets": 0.013851,
              "after seal": 0.01376,
              "emit assets": 9.700877
            },
            "unaccountedMs": 152.521955
          },
          {
            "totalMs": 425.95742099999916,
            "phases": {
              "build module graph": 115.124661,
              "finish modules": 16.224076,
              "seal": 0.039233,
              "optimize dependencies": 2.781748,
              "build chunk graph": 17.508301,
              "optimize modules": 0.046934,
              "optimize chunks": 10.119186,
              "optimize tree": 0.046061,
              "optimize chunk modules": 0.024732,
              "module ids": 4.320785,
              "chunk ids": 0.607973,
              "assign runtime ids": 0.02146,
              "optimize code generation": 0.01103,
              "create module hashes": 11.546313,
              "code generation": 63.684603,
              "runtime requirements": 6.533604,
              "hashing": 9.082057,
              "create module assets": 0.221422,
              "create chunk assets": 9.733183,
              "process assets": 0.314808,
              "after process assets": 0.020302,
              "after seal": 0.018643,
              "emit assets": 9.312978
            },
            "unaccountedMs": 148.61332799999911
          },
          {
            "totalMs": 436.4554959999996,
            "phases": {
              "build module graph": 117.591977,
              "finish modules": 18.316736,
              "seal": 0.054848,
              "optimize dependencies": 2.631362,
              "build chunk graph": 18.665088,
              "optimize modules": 0.057623,
              "optimize chunks": 10.885732,
              "optimize tree": 0.032598,
              "optimize chunk modules": 0.018404,
              "module ids": 4.405691,
              "chunk ids": 0.633262,
              "assign runtime ids": 0.028586,
              "optimize code generation": 0.012238,
              "create module hashes": 11.607327,
              "code generation": 68.000927,
              "runtime requirements": 6.958366,
              "hashing": 7.452017,
              "create module assets": 0.23826,
              "create chunk assets": 9.458246,
              "process assets": 0.281499,
              "after process assets": 0.015866,
              "after seal": 0.013024,
              "emit assets": 9.294938
            },
            "unaccountedMs": 149.8008809999996
          },
          {
            "totalMs": 449.9958939999997,
            "phases": {
              "build module graph": 120.090847,
              "finish modules": 15.427513,
              "seal": 0.034253,
              "optimize dependencies": 2.878771,
              "build chunk graph": 21.463296,
              "optimize modules": 0.056374,
              "optimize chunks": 11.850177,
              "optimize tree": 0.045408,
              "optimize chunk modules": 0.024488,
              "module ids": 4.74361,
              "chunk ids": 0.689521,
              "assign runtime ids": 0.027315,
              "optimize code generation": 0.013023,
              "create module hashes": 11.15857,
              "code generation": 64.640581,
              "runtime requirements": 6.416778,
              "hashing": 11.228289,
              "create module assets": 0.423121,
              "create chunk assets": 13.537139,
              "process assets": 0.307453,
              "after process assets": 0.017816,
              "after seal": 0.019139,
              "emit assets": 7.646432
            },
            "unaccountedMs": 157.25597999999968
          }
        ]
      }
    },
    {
      "name": "slow-loader",
      "complexity": 200,
      "cold": {
        "total": {
          "min": 11847.075104000003,
          "median": 12265.650933,
          "mean": 12329.175802600004,
          "max": 12734.946367000011
        },
        "unaccounted": {
          "min": 242.33106900000166,
          "median": 253.56973599999947,
          "mean": 253.08125780000336,
          "max": 267.24540000001434
        },
        "phases": {
          "build module graph": {
            "min": 11428.341226,
            "median": 11841.435602,
            "mean": 11901.599844,
            "max": 12293.176968
          },
          "finish modules": {
            "min": 14.182128,
            "median": 15.316276,
            "mean": 15.1774136,
            "max": 16.348798
          },
          "seal": {
            "min": 0.038054,
            "median": 0.043166,
            "mean": 0.0453176,
            "max": 0.057832
          },
          "optimize dependencies": {
            "min": 2.324134,
            "median": 2.530125,
            "mean": 2.5038362,
            "max": 2.692318
          },
          "build chunk graph": {
            "min": 16.287105,
            "median": 16.63577,
            "mean": 16.877928400000002,
            "max": 17.540606
          },
          "optimize modules": {
            "min": 0.051024,
            "median": 0.055375,
            "mean": 0.0562496,
            "max": 0.066025
          },
          "optimize chunks": {
            "min": 9.621411,
            "median": 10.200806,
            "mean": 10.1480088,
            "max": 10.478145
          },
          "optimize tree": {
            "min": 0.026488,
            "median": 0.028983,
            "mean": 0.0315088,
            "max": 0.038711
          },
          "optimize chunk modules": {
            "min": 0.018256,
            "median": 0.019482,
            "mean": 0.0213688,
            "max": 0.025463
          },
          "module ids": {
            "min": 3.806905,
            "median": 4.069044,
            "mean": 4.010383,
            "max": 4.189277
          },
          "chunk ids": {
            "min": 0.397828,
            "median": 0.466312,
            "mean": 0.4807996,
            "max": 0.627305
          },
          "assign runtime ids": {
            "min": 0.019717,
            "median": 0.02389,
            "mean": 0.025602399999999997,
            "max": 0.034522
          },
          "optimize code generation": {
            "min": 0.009369,
            "median": 0.010345,
            "mean": 0.0104314,
            "max": 0.012606
          },
          "create module hashes": {
            "min": 10.683589,
            "median": 11.185906,
            "mean": 11.441787599999998,
            "max": 12.591793
          },
          "code generation": {
            "min": 62.571401,
            "median": 64.393414,
            "mean": 64.5886878,
            "max": 67.061787
          },
          "runtime requirements": {
            "min": 6.245883,
            "median": 6.393157,
            "mean": 6.5096236,
            "max": 6.975735
          },
          "hashing": {
            "min": 7.222869,
            "median": 7.819966,
            "mean": 7.738735199999999,
            "max": 8.106513
          },
          "create module assets": {
            "min": 0.185755,
            "median": 0.208222,
            "mean": 0.2070084,
            "max": 0.234939
          },
          "create chunk assets": {
            "min": 9.985596,
            "median": 10.573573,
            "mean": 10.5305994,
            "max": 10.881665
          },
          "process assets": {
            "min": 0.390118,
            "median": 0.42097,
            "mean": 0.4238014,
            "max": 0.450577
          },
          "after process assets": {
            "min": 0.01975,
            "median": 0.020508,
            "mean": 0.021528,
            "max": 0.026281
          },
          "after seal": {
            "min": 0.014411,
            "median": 0.016553,
            "mean": 0.0180996,
            "max": 0.024839
          },
          "emit assets": {
            "min": 21.785019,
            "median": 22.635678,
            "mean": 23.6259816,
            "max": 26.337083
          }
        }
      },
      "persistMake": {
        "total": {
          "min": 454.75287100000423,
          "median": 458.5906019999966,
          "mean": 459.48580100000106,
          "max": 468.1496000000043
        },
        "unaccounted": {
          "min": 172.62823399999985,
          "median": 177.3901279999966,
          "mean": 178.7621728000011,
          "max": 185.5911240000005
        },
        "phases": {
          "build module graph": {
            "min": 103.829081,
            "median": 107.143291,
            "mean": 107.1209556,
            "max": 109.694031
          },
          "finish modules": {
            "min": 14.107999,
            "median": 14.655172,
            "mean": 14.730318,
            "max": 15.558446
          },
          "seal": {
            "min": 0.034998,
            "median": 0.039531,
            "mean": 0.0399362,
            "max": 0.046542
          },
          "optimize dependencies": {
            "min": 2.437558,
            "median": 2.61918,
            "mean": 2.6969898,
            "max": 3.072228
          },
          "build chunk graph": {
            "min": 16.544707,
            "median": 16.788991,
            "mean": 16.7641822,
            "max": 16.954966
          },
          "optimize modules": {
            "min": 0.052801,
            "median": 0.061515,
            "mean": 0.060432,
            "max": 0.064788
          },
          "optimize chunks": {
            "min": 9.829128,
            "median": 10.222995,
            "mean": 10.2571646,
            "max": 10.626209
          },
          "optimize tree": {
            "min": 0.029481,
            "median": 0.041447,
            "mean": 0.0389224,
            "max": 0.046898
          },
          "optimize chunk modules": {
            "min": 0.018099,
            "median": 0.021214,
            "mean": 0.0208732,
            "max": 0.022758
          },
          "module ids": {
            "min": 4.016799,
            "median": 4.194222,
            "mean": 4.1747971999999995,
            "max": 4.251881
          },
          "chunk ids": {
            "min": 0.418516,
            "median": 0.482857,
            "mean": 0.47401160000000003,
            "max": 0.539806
          },
          "assign runtime ids": {
            "min": 0.02367,
            "median": 0.024144,
            "mean": 0.0252602,
            "max": 0.028023
          },
          "optimize code generation": {
            "min": 0.010278,
            "median": 0.012489,
            "mean": 0.012034600000000001,
            "max": 0.013615
          },
          "create module hashes": {
            "min": 10.855138,
            "median": 11.359047,
            "mean": 11.572567800000002,
            "max": 12.6966
          },
          "code generation": {
            "min": 64.009149,
            "median": 65.542203,
            "mean": 65.7111762,
            "max": 67.870235
          },
          "runtime requirements": {
            "min": 6.239723,
            "median": 6.411243,
            "mean": 6.796562799999999,
            "max": 8.417513
          },
          "hashing": {
            "min": 7.098679,
            "median": 7.273336,
            "mean": 7.6635881999999995,
            "max": 9.045685
          },
          "create module assets": {
            "min": 0.192706,
            "median": 0.223768,
            "mean": 0.2305876,
            "max": 0.307893
          },
          "create chunk assets": {
            "min": 9.627914,
            "median": 9.756533,
            "mean": 10.001878000000001,
            "max": 10.557003
          },
          "process assets": {
            "min": 0.31099,
            "median": 0.320642,
            "mean": 0.3281368,
            "max": 0.349635
          },
          "after process assets": {
            "min": 0.018343,
            "median": 0.018818,
            "mean": 0.0216982,
            "max": 0.031124
          },
          "after seal": {
            "min": 0.015346,
            "median": 0.016168,
            "mean": 0.0164644,
            "max": 0.018114
          },
          "emit assets": {
            "min": 21.330812,
            "median": 22.19364,
            "mean": 21.9650906,
            "max": 22.547737
          }
        }
      },
      "loaderOnly": {
        "total": {
          "min": 781.2341520000045,
          "median": 795.1306960000002,
          "mean": 795.2457024000003,
          "max": 809.4847270000027
        },
        "unaccounted": {
          "min": 150.71713499999157,
          "median": 155.9549710000024,
          "mean": 155.91250820000033,
          "max": 160.9205470000045
        },
        "phases": {
          "build module graph": {
            "min": 447.673073,
            "median": 461.746011,
            "mean": 464.62758220000006,
            "max": 483.218769
          },
          "finish modules": {
            "min": 15.125449,
            "median": 15.409304,
            "mean": 15.474730600000001,
            "max": 15.858983
          },
          "seal": {
            "min": 0.032729,
            "median": 0.041488,
            "mean": 0.0406662,
            "max": 0.050143
          },
          "optimize dependencies": {
            "min": 2.59695,
            "median": 2.797398,
            "mean": 2.7976187999999995,
            "max": 3.0048
          },
          "build chunk graph": {
            "min": 16.450832,
            "median": 17.013989,
            "mean": 16.972544799999998,
            "max": 17.845088
          },
          "optimize modules": {
            "min": 0.050286,
            "median": 0.052899,
            "mean": 0.057497,
            "max": 0.068935
          },
          "optimize chunks": {
            "min": 10.382848,
            "median": 10.819358,
            "mean": 10.76854,
            "max": 11.118072
          },
          "optimize tree": {
            "min": 0.027417,
            "median": 0.031475,
            "mean": 0.0326074,
            "max": 0.04046
          },
          "optimize chunk modules": {
            "min": 0.019507,
            "median": 0.020182,
            "mean": 0.020532,
            "max": 0.02248
          },
          "module ids": {
            "min": 4.32318,
            "median": 4.429246,
            "mean": 4.527978200000001,
            "max": 5.037131
          },
          "chunk ids": {
            "min": 0.569498,
            "median": 0.658212,
            "mean": 0.6476812000000001,
            "max": 0.690694
          },
          "assign runtime ids": {
            "min": 0.022705,
            "median": 0.028462,
            "mean": 0.027537,
            "max": 0.033208
          },
          "optimize code generation": {
            "min": 0.00941,
            "median": 0.012693,
            "mean": 0.012432599999999999,
            "max": 0.014327
          },
          "create module hashes": {
            "min": 10.395084,
            "median": 11.177161,
            "mean": 11.9951464,
            "max": 16.310828
          },
          "code generation": {
            "min": 62.948587,
            "median": 64.422442,
            "mean": 64.0340012,
            "max": 64.889372
          },
          "runtime requirements": {
            "min": 6.133866,
            "median": 6.582872,
            "mean": 6.5144268,
            "max": 6.923871
          },
          "hashing": {
            "min": 7.197966,
            "median": 7.733235,
            "mean": 7.6082404,
            "max": 7.864811
          },
          "create module assets": {
            "min": 0.204836,
            "median": 0.210024,
            "mean": 0.2127634,
            "max": 0.22623
          },
          "create chunk assets": {
            "min": 9.613951,
            "median": 10.020911,
            "mean": 10.0943896,
            "max": 10.54737
          },
          "process assets": {
            "min": 0.263606,
            "median": 0.280054,
            "mean": 0.28470840000000003,
            "max": 0.318754
          },
          "after process assets": {
            "min": 0.01552,
            "median": 0.016028,
            "mean": 0.0170002,
            "max": 0.02013
          },
          "after seal": {
            "min": 0.014689,
            "median": 0.017081,
            "mean": 0.016990799999999997,
            "max": 0.019121
          },
          "emit assets": {
            "min": 21.353118,
            "median": 22.03062,
            "mean": 22.547579,
            "max": 25.581324
          }
        }
      },
      "raw": {
        "cold": [
          {
            "totalMs": 12703.663877,
            "phases": {
              "build module graph": 12272.646254,
              "finish modules": 16.348798,
              "seal": 0.042494,
              "optimize dependencies": 2.530125,
              "build chunk graph": 16.287105,
              "optimize modules": 0.051024,
              "optimize chunks": 10.478145,
              "optimize tree": 0.027818,
              "optimize chunk modules": 0.019131,
              "module ids": 4.069044,
              "chunk ids": 0.426314,
              "assign runtime ids": 0.021619,
              "optimize code generation": 0.010345,
              "create module hashes": 11.621934,
              "code generation": 62.571401,
              "runtime requirements": 6.975735,
              "hashing": 7.840498,
              "create module assets": 0.211649,
              "create chunk assets": 10.674094,
              "process assets": 0.450453,
              "after process assets": 0.020473,
              "after seal": 0.014411,
              "emit assets": 26.337083
            },
            "unaccountedMs": 253.98793000000296
          },
          {
            "totalMs": 12265.650933,
            "phases": {
              "build module graph": 11841.435602,
              "finish modules": 14.365713,
              "seal": 0.045042,
              "optimize dependencies": 2.391852,
              "build chunk graph": 16.63577,
              "optimize modules": 0.051046,
              "optimize chunks": 10.440309,
              "optimize tree": 0.026488,
              "optimize chunk modules": 0.025463,
              "module ids": 3.835515,
              "chunk ids": 0.466312,
              "assign runtime ids": 0.019717,
              "optimize code generation": 0.009452,
              "create module hashes": 11.125716,
              "code generation": 63.407367,
              "runtime requirements": 6.393157,
              "hashing": 8.106513,
              "create module assets": 0.234939,
              "create chunk assets": 9.985596,
              "process assets": 0.406889,
              "after process assets": 0.020508,
              "after seal": 0.016553,
              "emit assets": 22.635678
            },
            "unaccountedMs": 253.56973599999947
          },
          {
            "totalMs": 12094.542732000002,
            "phases": {
              "build module graph": 11672.39917,
              "finish modules": 15.316276,
              "seal": 0.057832,
              "optimize dependencies": 2.580752,
              "build chunk graph": 17.540606,
              "optimize modules": 0.066025,
              "optimize chunks": 9.999373,
              "optimize tree": 0.038711,
              "optimize chunk modules": 0.024512,
              "module ids": 4.151174,
              "chunk ids": 0.627305,
              "assign runtime ids": 0.028264,
              "optimize code generation": 0.012606,
              "create module hashes": 11.185906,
              "code generation": 65.50947,
              "runtime requirements": 6.543229,
              "hashing": 7.222869,
              "create module assets": 0.208222,
              "create chunk assets": 10.538069,
              "process assets": 0.390118,
              "after process assets": 0.026281,
              "after seal": 0.018789,
              "emit assets": 21.785019
            },
            "unaccountedMs": 248.2721539999984
          },
          {
            "totalMs": 11847.075104000003,
            "phases": {
              "build module graph": 11428.341226,
              "finish modules": 14.182128,
              "seal": 0.038054,
              "optimize dependencies": 2.324134,
              "build chunk graph": 17.483517,
              "optimize modules": 0.055375,
              "optimize chunks": 9.621411,
              "optimize tree": 0.028983,
              "optimize chunk modules": 0.018256,
              "module ids": 4.189277,
              "chunk ids": 0.486239,
              "assign runtime ids": 0.02389,
              "optimize code generation": 0.010385,
              "create module hashes": 12.591793,
              "code generation": 67.061787,
              "runtime requirements": 6.390114,
              "hashing": 7.819966,
              "create module assets": 0.185755,
              "create chunk assets": 10.881665,
              "process assets": 0.42097,
              "after process assets": 0.020628,
              "after seal": 0.024839,
              "emit assets": 22.543643
            },
            "unaccountedMs": 242.33106900000166
          },
          {
            "totalMs": 12734.946367000011,
            "phases": {
              "build module graph": 12293.176968,
              "finish modules": 15.674153,
              "seal": 0.043166,
              "optimize dependencies": 2.692318,
              "build chunk graph": 16.442644,
              "optimize modules": 0.057778,
              "optimize chunks": 10.200806,
              "optimize tree": 0.035544,
              "optimize chunk modules": 0.019482,
              "module ids": 3.806905,
              "chunk ids": 0.397828,
              "assign runtime ids": 0.034522,
              "optimize code generation": 0.009369,
              "create module hashes": 10.683589,
              "code generation": 64.393414,
              "runtime requirements": 6.245883,
              "hashing": 7.70383,
              "create module assets": 0.194477,
              "create chunk assets": 10.573573,
              "process assets": 0.450577,
              "after process assets": 0.01975,
              "after seal": 0.015906,
              "emit assets": 24.828485
            },
            "unaccountedMs": 267.24540000001434
          }
        ],
        "persistMake": [
          {
            "totalMs": 455.14563199999975,
            "phases": {
              "build module graph": 107.143291,
              "finish modules": 14.655172,
              "seal": 0.039588,
              "optimize dependencies": 2.437558,
              "build chunk graph": 16.798705,
              "optimize modules": 0.063845,
              "optimize chunks": 10.511636,
              "optimize tree": 0.04371,
              "optimize chunk modules": 0.021214,
              "module ids": 4.243179,
              "chunk ids": 0.495412,
              "assign runtime ids": 0.026792,
              "optimize code generation": 0.012489,
              "create module hashes": 11.932246,
              "code generation": 66.596431,
              "runtime requirements": 6.66497,
              "hashing": 7.273336,
              "create module assets": 0.307893,
              "create chunk assets": 10.347474,
              "process assets": 0.320209,
              "after process assets": 0.018343,
              "after seal": 0.016168,
              "emit assets": 22.547737
            },
            "unaccountedMs": 172.62823399999985
          },
          {
            "totalMs": 458.5906019999966,
            "phases": {
              "build module graph": 106.938904,
              "finish modules": 15.558446,
              "seal": 0.039022,
              "optimize dependencies": 3.072228,
              "build chunk graph": 16.954966,
              "optimize modules": 0.064788,
              "optimize chunks": 10.095855,
              "optimize tree": 0.041447,
              "optimize chunk modules": 0.022525,
              "module ids": 4.251881,
              "chunk ids": 0.482857,
              "assign runtime ids": 0.028023,
              "optimize code generation": 0.013615,
              "create module hashes": 11.359047,
              "code generation": 64.537863,
              "runtime requirements": 6.239723,
              "hashing": 9.045685,
              "create module assets": 0.192706,
              "create chunk assets": 9.720466,
              "process assets": 0.31099,
              "after process assets": 0.018818,
              "after seal": 0.016979,
              "emit assets": 22.19364
            },
            "unaccountedMs": 177.3901279999966
          },
          {
            "totalMs": 460.79030000000057,
            "phases": {
              "build module graph": 103.829081,
              "finish modules": 14.783817,
              "seal": 0.046542,
              "optimize dependencies": 2.61918,
              "build chunk graph": 16.788991,
              "optimize modules": 0.061515,
              "optimize chunks": 10.626209,
              "optimize tree": 0.046898,
              "optimize chunk modules": 0.022758,
              "module ids": 4.194222,
              "chunk ids": 0.433467,
              "assign runtime ids": 0.023672,
              "optimize code generation": 0.010278,
              "create module hashes": 11.019808,
              "code generation": 64.009149,
              "runtime requirements": 6.249365,
              "hashing": 7.727934,
              "create module assets": 0.223768,
              "create chunk assets": 9.756533,
              "process assets": 0.349635,
              "after process assets": 0.018661,
              "after seal": 0.015715,
              "emit assets": 22.341978
            },
            "unaccountedMs": 185.5911240000005
          },
          {
            "totalMs": 454.75287100000423,
            "phases": {
              "build module graph": 107.999471,
              "finish modules": 14.107999,
              "seal": 0.034998,
              "optimize dependencies": 2.608804,
              "build chunk graph": 16.544707,
              "optimize modules": 0.052801,
              "optimize chunks": 9.829128,
              "optimize tree": 0.029481,
              "optimize chunk modules": 0.018099,
              "module ids": 4.167905,
              "chunk ids": 0.418516,
              "assign runtime ids": 0.02367,
              "optimize code generation": 0.012666,
              "create module hashes": 10.855138,
              "code generation": 67.870235,
              "runtime requirements": 6.411243,
              "hashing": 7.172307,
              "create module assets": 0.231021,
              "create chunk assets": 9.627914,
              "process assets": 0.320642,
              "after process assets": 0.031124,
              "after seal": 0.015346,
              "emit assets": 21.330812
            },
            "unaccountedMs": 175.03884400000425
          },
          {
            "totalMs": 468.1496000000043,
            "phases": {
              "build module graph": 109.694031,
              "finish modules": 14.546156,
              "seal": 0.039531,
              "optimize dependencies": 2.747179,
              "build chunk graph": 16.733542,
              "optimize modules": 0.059211,
              "optimize chunks": 10.222995,
              "optimize tree": 0.033076,
              "optimize chunk modules": 0.01977,
              "module ids": 4.016799,
              "chunk ids": 0.539806,
              "assign runtime ids": 0.024144,
              "optimize code generation": 0.011125,
              "create module hashes": 12.6966,
              "code generation": 65.542203,
              "runtime requirements": 8.417513,
              "hashing": 7.098679,
              "create module assets": 0.19755,
              "create chunk assets": 10.557003,
              "process assets": 0.339208,
              "after process assets": 0.021545,
              "after seal": 0.018114,
              "emit assets": 21.411286
            },
            "unaccountedMs": 183.1625340000043
          }
        ],
        "loaderOnly": [
          {
            "totalMs": 808.2991820000025,
            "phases": {
              "build module graph": 473.284593,
              "finish modules": 15.858983,
              "seal": 0.041488,
              "optimize dependencies": 2.648089,
              "build chunk graph": 16.450832,
              "optimize modules": 0.064921,
              "optimize chunks": 11.118072,
              "optimize tree": 0.04046,
              "optimize chunk modules": 0.02248,
              "module ids": 4.429246,
              "chunk ids": 0.665612,
              "assign runtime ids": 0.033208,
              "optimize code generation": 0.014327,
              "create module hashes": 16.310828,
              "code generation": 64.422442,
              "runtime requirements": 6.582872,
              "hashing": 7.449838,
              "create module assets": 0.207661,
              "create chunk assets": 10.020911,
              "process assets": 0.318754,
              "after process assets": 0.017774,
              "after seal": 0.014689,
              "emit assets": 22.326131
            },
            "unaccountedMs": 155.9549710000024
          },
          {
            "totalMs": 795.1306960000002,
            "phases": {
              "build module graph": 461.746011,
              "finish modules": 15.223912,
              "seal": 0.032729,
              "optimize dependencies": 2.940857,
              "build chunk graph": 17.845088,
              "optimize modules": 0.050286,
              "optimize chunks": 11.111719,
              "optimize tree": 0.027417,
              "optimize chunk modules": 0.019967,
              "module ids": 5.037131,
              "chunk ids": 0.658212,
              "assign runtime ids": 0.028574,
              "optimize code generation": 0.013589,
              "create module hashes": 10.722451,
              "code generation": 62.948587,
              "runtime requirements": 6.251068,
              "hashing": 7.864811,
              "create module assets": 0.215066,
              "create chunk assets": 10.54737,
              "process assets": 0.280054,
              "after process assets": 0.016028,
              "after seal": 0.017081,
              "emit assets": 25.581324
            },
            "unaccountedMs": 155.95136400000013
          },
          {
            "totalMs": 809.4847270000027,
            "phases": {
              "build module graph": 483.218769,
              "finish modules": 15.125449,
              "seal": 0.050143,
              "optimize dependencies": 2.797398,
              "build chunk graph": 16.499997,
              "optimize modules": 0.052899,
              "optimize chunks": 10.410703,
              "optimize tree": 0.031378,
              "optimize chunk modules": 0.020524,
              "module ids": 4.463655,
              "chunk ids": 0.569498,
              "assign runtime ids": 0.022705,
              "optimize code generation": 0.00941,
              "create module hashes": 11.177161,
              "code generation": 63.271039,
              "runtime requirements": 6.133866,
              "hashing": 7.197966,
              "create module assets": 0.204836,
              "create chunk assets": 9.859338,
              "process assets": 0.286898,
              "after process assets": 0.015549,
              "after seal": 0.016402,
              "emit assets": 22.03062
            },
            "unaccountedMs": 156.01852400000303
          },
          {
            "totalMs": 782.0797549999916,
            "phases": {
              "build module graph": 457.215465,
              "finish modules": 15.756005,
              "seal": 0.041693,
              "optimize dependencies": 2.59695,
              "build chunk graph": 17.052818,
              "optimize modules": 0.068935,
              "optimize chunks": 10.382848,
              "optimize tree": 0.031475,
              "optimize chunk modules": 0.019507,
              "module ids": 4.386679,
              "chunk ids": 0.690694,
              "assign runtime ids": 0.024736,
              "optimize code generation": 0.012144,
              "create module hashes": 11.370208,
              "code generation": 64.638566,
              "runtime requirements": 6.923871,
              "hashing": 7.733235,
              "create module assets": 0.22623,
              "create chunk assets": 10.430378,
              "process assets": 0.27423,
              "after process assets": 0.02013,
              "after seal": 0.019121,
              "emit assets": 21.446702
            },
            "unaccountedMs": 150.71713499999157
          },
          {
            "totalMs": 781.2341520000045,
            "phases": {
              "build module graph": 447.673073,
              "finish modules": 15.409304,
              "seal": 0.037278,
              "optimize dependencies": 3.0048,
              "build chunk graph": 17.013989,
              "optimize modules": 0.050444,
              "optimize chunks": 10.819358,
              "optimize tree": 0.032307,
              "optimize chunk modules": 0.020182,
              "module ids": 4.32318,
              "chunk ids": 0.65439,
              "assign runtime ids": 0.028462,
              "optimize code generation": 0.012693,
              "create module hashes": 10.395084,
              "code generation": 64.889372,
              "runtime requirements": 6.680457,
              "hashing": 7.795352,
              "create module assets": 0.210024,
              "create chunk assets": 9.613951,
              "process assets": 0.263606,
              "after process assets": 0.01552,
              "after seal": 0.017661,
              "emit assets": 21.353118
            },
            "unaccountedMs": 160.9205470000045
          }
        ]
      }
    }
  ]
}
```
