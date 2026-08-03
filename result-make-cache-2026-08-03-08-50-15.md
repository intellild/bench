# Persist make cache vs loader cache — 2026-08-03

Generated at 2026-08-03T08:50:15.062Z.

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
| Benchmark duration | 64083.0 ms |

## Complete build median

The complete build is measured outside the CLI process and therefore includes
Node.js startup, configuration loading, compiler setup, compilation passes, and
asset emission. Positive delta means loader-cache-only took longer.

| Scenario | Cold populate | Persist cache in make | Loader cache only | Loader only vs persist |
| --- | ---: | ---: | ---: | ---: |
| backend-only | 419.4 ms | 184.2 ms | 174.7 ms | -5.1% |
| slow-loader | 11325.3 ms | 199.2 ms | 214.2 ms | +7.5% |

## Compilation pass median

These timings come from Rspack's own `rspack.Compilation` pass logger. Cache
restore/save hooks are included in their corresponding pass. `emit assets`
comes from the compiler logger and runs after the compilation passes.

| Scenario | Phase | Persist cache in make | Loader cache only | Loader only vs persist |
| --- | --- | ---: | ---: | ---: |
| backend-only | build module graph | 15.8 ms | 18.8 ms | +19.3% |
| backend-only | finish modules | 4.0 ms | 4.6 ms | +13.1% |
| backend-only | seal | 0.0 ms | 0.0 ms | -0.7% |
| backend-only | optimize dependencies | 0.8 ms | 0.9 ms | +7.6% |
| backend-only | build chunk graph | 2.8 ms | 2.9 ms | +4.3% |
| backend-only | optimize modules | 0.0 ms | 0.0 ms | -21.2% |
| backend-only | optimize chunks | 2.9 ms | 3.3 ms | +14.5% |
| backend-only | optimize tree | 0.0 ms | 0.0 ms | +2.1% |
| backend-only | optimize chunk modules | 0.0 ms | 0.0 ms | +0.5% |
| backend-only | module ids | 1.0 ms | 1.2 ms | +21.2% |
| backend-only | chunk ids | 0.3 ms | 0.3 ms | +7.7% |
| backend-only | assign runtime ids | 0.0 ms | 0.0 ms | -8.1% |
| backend-only | optimize code generation | 0.0 ms | 0.0 ms | -24.3% |
| backend-only | create module hashes | 1.7 ms | 1.8 ms | +2.6% |
| backend-only | code generation | 8.0 ms | 8.1 ms | +0.7% |
| backend-only | runtime requirements | 1.6 ms | 1.8 ms | +11.7% |
| backend-only | hashing | 0.9 ms | 1.0 ms | +5.4% |
| backend-only | create module assets | 0.0 ms | 0.0 ms | +38.4% |
| backend-only | create chunk assets | 2.3 ms | 2.4 ms | +4.3% |
| backend-only | process assets | 0.1 ms | 0.1 ms | -13.1% |
| backend-only | after process assets | 0.0 ms | 0.0 ms | +27.7% |
| backend-only | after seal | 0.0 ms | 0.0 ms | +6.5% |
| backend-only | emit assets | 3.6 ms | 3.7 ms | +2.1% |
| backend-only | outside pass timers | 138.5 ms | 124.0 ms | -10.5% |
| slow-loader | build module graph | 17.3 ms | 42.2 ms | +144.0% |
| slow-loader | finish modules | 3.8 ms | 4.7 ms | +24.0% |
| slow-loader | seal | 0.0 ms | 0.0 ms | +4.8% |
| slow-loader | optimize dependencies | 0.9 ms | 1.0 ms | +10.8% |
| slow-loader | build chunk graph | 2.5 ms | 2.9 ms | +15.0% |
| slow-loader | optimize modules | 0.0 ms | 0.0 ms | +13.8% |
| slow-loader | optimize chunks | 2.9 ms | 3.3 ms | +13.4% |
| slow-loader | optimize tree | 0.0 ms | 0.0 ms | +15.2% |
| slow-loader | optimize chunk modules | 0.0 ms | 0.0 ms | +8.7% |
| slow-loader | module ids | 0.8 ms | 1.1 ms | +26.3% |
| slow-loader | chunk ids | 0.3 ms | 0.3 ms | +28.7% |
| slow-loader | assign runtime ids | 0.0 ms | 0.0 ms | -13.6% |
| slow-loader | optimize code generation | 0.0 ms | 0.0 ms | -14.7% |
| slow-loader | create module hashes | 1.6 ms | 1.7 ms | +10.3% |
| slow-loader | code generation | 8.5 ms | 8.2 ms | -4.4% |
| slow-loader | runtime requirements | 1.8 ms | 1.6 ms | -7.2% |
| slow-loader | hashing | 1.0 ms | 1.0 ms | +9.4% |
| slow-loader | create module assets | 0.0 ms | 0.0 ms | -3.3% |
| slow-loader | create chunk assets | 2.4 ms | 2.3 ms | -2.4% |
| slow-loader | process assets | 0.2 ms | 0.1 ms | -10.8% |
| slow-loader | after process assets | 0.0 ms | 0.0 ms | +0.0% |
| slow-loader | after seal | 0.0 ms | 0.0 ms | -7.9% |
| slow-loader | emit assets | 17.9 ms | 18.7 ms | +4.9% |
| slow-loader | outside pass timers | 138.2 ms | 123.9 ms | -10.3% |

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
          "min": 396.97187399999984,
          "median": 419.3507139999997,
          "mean": 420.9030085999999,
          "max": 458.0109560000001
        },
        "unaccounted": {
          "min": 143.0216740000002,
          "median": 150.9819349999998,
          "mean": 153.84184839999992,
          "max": 167.29842599999998
        },
        "phases": {
          "build module graph": {
            "min": 213.105386,
            "median": 222.125802,
            "mean": 234.93836619999996,
            "max": 282.985988
          },
          "finish modules": {
            "min": 3.91346,
            "median": 4.23098,
            "mean": 4.2207472,
            "max": 4.500909
          },
          "seal": {
            "min": 0.003589,
            "median": 0.003744,
            "mean": 0.0041562000000000005,
            "max": 0.00545
          },
          "optimize dependencies": {
            "min": 0.713028,
            "median": 0.889121,
            "mean": 0.8961151999999999,
            "max": 1.138102
          },
          "build chunk graph": {
            "min": 2.71707,
            "median": 2.798429,
            "mean": 2.8249471999999995,
            "max": 2.951904
          },
          "optimize modules": {
            "min": 0.005107,
            "median": 0.005539,
            "mean": 0.0058008,
            "max": 0.0071
          },
          "optimize chunks": {
            "min": 2.337141,
            "median": 2.924882,
            "mean": 2.8816772,
            "max": 3.441224
          },
          "optimize tree": {
            "min": 0.002477,
            "median": 0.003059,
            "mean": 0.0030066,
            "max": 0.003446
          },
          "optimize chunk modules": {
            "min": 0.004037,
            "median": 0.004185,
            "mean": 0.004325999999999999,
            "max": 0.004914
          },
          "module ids": {
            "min": 0.938189,
            "median": 1.259097,
            "mean": 1.2448668,
            "max": 1.452812
          },
          "chunk ids": {
            "min": 0.229126,
            "median": 0.251083,
            "mean": 0.2907824,
            "max": 0.395956
          },
          "assign runtime ids": {
            "min": 0.002724,
            "median": 0.00289,
            "mean": 0.002968,
            "max": 0.00326
          },
          "optimize code generation": {
            "min": 0.001681,
            "median": 0.002232,
            "mean": 0.0022052,
            "max": 0.002686
          },
          "create module hashes": {
            "min": 1.54893,
            "median": 1.809256,
            "mean": 1.7916250000000002,
            "max": 1.994389
          },
          "code generation": {
            "min": 7.765147,
            "median": 8.233073,
            "mean": 8.1834422,
            "max": 8.434161
          },
          "runtime requirements": {
            "min": 1.569913,
            "median": 1.680463,
            "mean": 1.6710256,
            "max": 1.784569
          },
          "hashing": {
            "min": 0.779473,
            "median": 0.942714,
            "mean": 1.0423316,
            "max": 1.296803
          },
          "create module assets": {
            "min": 0.025816,
            "median": 0.033901,
            "mean": 0.035290600000000005,
            "max": 0.044923
          },
          "create chunk assets": {
            "min": 2.199636,
            "median": 2.337095,
            "mean": 2.3319254000000003,
            "max": 2.508313
          },
          "process assets": {
            "min": 0.189936,
            "median": 0.221825,
            "mean": 0.21465459999999997,
            "max": 0.234054
          },
          "after process assets": {
            "min": 0.002541,
            "median": 0.002735,
            "mean": 0.0028804,
            "max": 0.003716
          },
          "after seal": {
            "min": 0.002194,
            "median": 0.002315,
            "mean": 0.0025672,
            "max": 0.003078
          },
          "emit assets": {
            "min": 4.176706,
            "median": 4.441705,
            "mean": 4.4654526,
            "max": 4.708498
          }
        }
      },
      "persistMake": {
        "total": {
          "min": 180.85525800000005,
          "median": 184.15965600000004,
          "mean": 184.14469179999998,
          "max": 188.44169600000032
        },
        "unaccounted": {
          "min": 135.06470599999957,
          "median": 138.51585500000004,
          "mean": 137.7669924,
          "max": 139.99778000000032
        },
        "phases": {
          "build module graph": {
            "min": 15.057714,
            "median": 15.767761,
            "mean": 15.780951399999998,
            "max": 16.388729
          },
          "finish modules": {
            "min": 3.666831,
            "median": 4.022774,
            "mean": 3.9542637999999997,
            "max": 4.133407
          },
          "seal": {
            "min": 0.003244,
            "median": 0.003539,
            "mean": 0.0035876000000000007,
            "max": 0.003922
          },
          "optimize dependencies": {
            "min": 0.747511,
            "median": 0.844097,
            "mean": 0.9432798,
            "max": 1.445674
          },
          "build chunk graph": {
            "min": 2.589713,
            "median": 2.794431,
            "mean": 2.8362969999999996,
            "max": 3.259029
          },
          "optimize modules": {
            "min": 0.00461,
            "median": 0.006337,
            "mean": 0.006056799999999999,
            "max": 0.006896
          },
          "optimize chunks": {
            "min": 2.232874,
            "median": 2.904938,
            "mean": 3.0826027999999996,
            "max": 3.957146
          },
          "optimize tree": {
            "min": 0.003006,
            "median": 0.00329,
            "mean": 0.0033956,
            "max": 0.003849
          },
          "optimize chunk modules": {
            "min": 0.003746,
            "median": 0.003974,
            "mean": 0.004263,
            "max": 0.004942
          },
          "module ids": {
            "min": 0.790814,
            "median": 0.969228,
            "mean": 1.0027176,
            "max": 1.2597
          },
          "chunk ids": {
            "min": 0.223523,
            "median": 0.254126,
            "mean": 0.2565306,
            "max": 0.301297
          },
          "assign runtime ids": {
            "min": 0.002451,
            "median": 0.003093,
            "mean": 0.0029158,
            "max": 0.003128
          },
          "optimize code generation": {
            "min": 0.00193,
            "median": 0.002648,
            "mean": 0.0025902,
            "max": 0.003114
          },
          "create module hashes": {
            "min": 1.518077,
            "median": 1.708971,
            "mean": 1.775433,
            "max": 2.067458
          },
          "code generation": {
            "min": 7.876268,
            "median": 8.032728,
            "mean": 8.1654708,
            "max": 8.560878
          },
          "runtime requirements": {
            "min": 1.397708,
            "median": 1.613536,
            "mean": 1.5869192,
            "max": 1.736096
          },
          "hashing": {
            "min": 0.792213,
            "median": 0.93649,
            "mean": 0.9192486000000001,
            "max": 0.997078
          },
          "create module assets": {
            "min": 0.029021,
            "median": 0.031834,
            "mean": 0.0329648,
            "max": 0.042177
          },
          "create chunk assets": {
            "min": 2.137745,
            "median": 2.29763,
            "mean": 2.2613624,
            "max": 2.419965
          },
          "process assets": {
            "min": 0.135327,
            "median": 0.149807,
            "mean": 0.147736,
            "max": 0.159647
          },
          "after process assets": {
            "min": 0.002538,
            "median": 0.002742,
            "mean": 0.0028607999999999997,
            "max": 0.003544
          },
          "after seal": {
            "min": 0.001917,
            "median": 0.002381,
            "mean": 0.0040264,
            "max": 0.011084
          },
          "emit assets": {
            "min": 3.286677,
            "median": 3.582755,
            "mean": 3.6022254000000005,
            "max": 3.786497
          }
        }
      },
      "loaderOnly": {
        "total": {
          "min": 170.09594299999992,
          "median": 174.69950900000003,
          "mean": 174.12783440000004,
          "max": 177.57412000000022
        },
        "unaccounted": {
          "min": 118.97481199999991,
          "median": 123.98381700000024,
          "mean": 122.67049560000007,
          "max": 125.80729099999994
        },
        "phases": {
          "build module graph": {
            "min": 18.497355,
            "median": 18.807765,
            "mean": 19.372424000000002,
            "max": 21.9222
          },
          "finish modules": {
            "min": 4.447644,
            "median": 4.550172,
            "mean": 4.600493800000001,
            "max": 4.792448
          },
          "seal": {
            "min": 0.003423,
            "median": 0.003514,
            "mean": 0.0036677999999999997,
            "max": 0.004105
          },
          "optimize dependencies": {
            "min": 0.750309,
            "median": 0.908359,
            "mean": 0.9199852,
            "max": 1.053427
          },
          "build chunk graph": {
            "min": 2.734294,
            "median": 2.915718,
            "mean": 2.9141504,
            "max": 3.063695
          },
          "optimize modules": {
            "min": 0.004366,
            "median": 0.004991,
            "mean": 0.0050584,
            "max": 0.005572
          },
          "optimize chunks": {
            "min": 2.576634,
            "median": 3.32538,
            "mean": 3.1443673999999997,
            "max": 3.484725
          },
          "optimize tree": {
            "min": 0.002618,
            "median": 0.003359,
            "mean": 0.0032386,
            "max": 0.003651
          },
          "optimize chunk modules": {
            "min": 0.003878,
            "median": 0.003992,
            "mean": 0.0041668,
            "max": 0.004587
          },
          "module ids": {
            "min": 0.967253,
            "median": 1.175092,
            "mean": 1.2361179999999998,
            "max": 1.716208
          },
          "chunk ids": {
            "min": 0.261301,
            "median": 0.273611,
            "mean": 0.3124384,
            "max": 0.414573
          },
          "assign runtime ids": {
            "min": 0.002337,
            "median": 0.002841,
            "mean": 0.0028274,
            "max": 0.003111
          },
          "optimize code generation": {
            "min": 0.001652,
            "median": 0.002004,
            "mean": 0.0019476,
            "max": 0.002095
          },
          "create module hashes": {
            "min": 1.661627,
            "median": 1.752864,
            "mean": 1.7665061999999998,
            "max": 1.874645
          },
          "code generation": {
            "min": 7.931134,
            "median": 8.089313,
            "mean": 8.080526600000002,
            "max": 8.21047
          },
          "runtime requirements": {
            "min": 1.607977,
            "median": 1.80176,
            "mean": 1.8287714000000002,
            "max": 2.152048
          },
          "hashing": {
            "min": 0.933759,
            "median": 0.986735,
            "mean": 0.9818187999999999,
            "max": 1.035345
          },
          "create module assets": {
            "min": 0.031142,
            "median": 0.044055,
            "mean": 0.039590400000000005,
            "max": 0.045031
          },
          "create chunk assets": {
            "min": 2.260115,
            "median": 2.395809,
            "mean": 2.4081212,
            "max": 2.628622
          },
          "process assets": {
            "min": 0.110683,
            "median": 0.130209,
            "mean": 0.1270068,
            "max": 0.139889
          },
          "after process assets": {
            "min": 0.002408,
            "median": 0.003502,
            "mean": 0.003727,
            "max": 0.006589
          },
          "after seal": {
            "min": 0.002084,
            "median": 0.002535,
            "mean": 0.002499,
            "max": 0.00295
          },
          "emit assets": {
            "min": 3.601284,
            "median": 3.65725,
            "mean": 3.6978876,
            "max": 3.851632
          }
        }
      },
      "raw": {
        "cold": [
          {
            "totalMs": 409.29699,
            "phases": {
              "build module graph": 221.723831,
              "finish modules": 4.276438,
              "seal": 0.003744,
              "optimize dependencies": 0.832117,
              "build chunk graph": 2.88581,
              "optimize modules": 0.0071,
              "optimize chunks": 2.337141,
              "optimize tree": 0.003059,
              "optimize chunk modules": 0.004068,
              "module ids": 1.33483,
              "chunk ids": 0.331555,
              "assign runtime ids": 0.002724,
              "optimize code generation": 0.002412,
              "create module hashes": 1.54893,
              "code generation": 7.765147,
              "runtime requirements": 1.569913,
              "hashing": 0.779473,
              "create module assets": 0.025816,
              "create chunk assets": 2.199636,
              "process assets": 0.221825,
              "after process assets": 0.002735,
              "after seal": 0.002194,
              "emit assets": 4.441705
            },
            "unaccountedMs": 156.99478699999992
          },
          {
            "totalMs": 396.97187399999984,
            "phases": {
              "build module graph": 213.105386,
              "finish modules": 3.91346,
              "seal": 0.003674,
              "optimize dependencies": 0.908208,
              "build chunk graph": 2.771523,
              "optimize modules": 0.005189,
              "optimize chunks": 3.441224,
              "optimize tree": 0.00288,
              "optimize chunk modules": 0.004185,
              "module ids": 1.259097,
              "chunk ids": 0.229126,
              "assign runtime ids": 0.003141,
              "optimize code generation": 0.002232,
              "create module hashes": 1.981082,
              "code generation": 8.390717,
              "runtime requirements": 1.728056,
              "hashing": 0.913091,
              "create module assets": 0.044923,
              "create chunk assets": 2.508313,
              "process assets": 0.196388,
              "after process assets": 0.002585,
              "after seal": 0.002315,
              "emit assets": 4.573144
            },
            "unaccountedMs": 150.9819349999998
          },
          {
            "totalMs": 458.0109560000001,
            "phases": {
              "build module graph": 282.985988,
              "finish modules": 4.181949,
              "seal": 0.004324,
              "optimize dependencies": 1.138102,
              "build chunk graph": 2.798429,
              "optimize modules": 0.005539,
              "optimize chunks": 2.481502,
              "optimize tree": 0.002477,
              "optimize chunk modules": 0.004037,
              "module ids": 1.239406,
              "chunk ids": 0.251083,
              "assign runtime ids": 0.00326,
              "optimize code generation": 0.002686,
              "create module hashes": 1.809256,
              "code generation": 8.233073,
              "runtime requirements": 1.784569,
              "hashing": 1.279577,
              "create module assets": 0.032485,
              "create chunk assets": 2.337095,
              "process assets": 0.23107,
              "after process assets": 0.003716,
              "after seal": 0.002953,
              "emit assets": 4.176706
            },
            "unaccountedMs": 143.0216740000002
          },
          {
            "totalMs": 419.3507139999997,
            "phases": {
              "build module graph": 234.750824,
              "finish modules": 4.500909,
              "seal": 0.00545,
              "optimize dependencies": 0.889121,
              "build chunk graph": 2.951904,
              "optimize modules": 0.006069,
              "optimize chunks": 2.924882,
              "optimize tree": 0.003446,
              "optimize chunk modules": 0.004426,
              "module ids": 1.452812,
              "chunk ids": 0.395956,
              "assign runtime ids": 0.002825,
              "optimize code generation": 0.002015,
              "create module hashes": 1.994389,
              "code generation": 8.434161,
              "runtime requirements": 1.592127,
              "hashing": 1.296803,
              "create module assets": 0.039328,
              "create chunk assets": 2.242392,
              "process assets": 0.234054,
              "after process assets": 0.002825,
              "after seal": 0.003078,
              "emit assets": 4.708498
            },
            "unaccountedMs": 150.91241999999966
          },
          {
            "totalMs": 420.884509,
            "phases": {
              "build module graph": 222.125802,
              "finish modules": 4.23098,
              "seal": 0.003589,
              "optimize dependencies": 0.713028,
              "build chunk graph": 2.71707,
              "optimize modules": 0.005107,
              "optimize chunks": 3.223637,
              "optimize tree": 0.003171,
              "optimize chunk modules": 0.004914,
              "module ids": 0.938189,
              "chunk ids": 0.246192,
              "assign runtime ids": 0.00289,
              "optimize code generation": 0.001681,
              "create module hashes": 1.624468,
              "code generation": 8.094113,
              "runtime requirements": 1.680463,
              "hashing": 0.942714,
              "create module assets": 0.033901,
              "create chunk assets": 2.372191,
              "process assets": 0.189936,
              "after process assets": 0.002541,
              "after seal": 0.002296,
              "emit assets": 4.42721
            },
            "unaccountedMs": 167.29842599999998
          }
        ],
        "persistMake": [
          {
            "totalMs": 184.15965600000004,
            "phases": {
              "build module graph": 16.388729,
              "finish modules": 4.031783,
              "seal": 0.003913,
              "optimize dependencies": 0.747511,
              "build chunk graph": 2.794431,
              "optimize modules": 0.005721,
              "optimize chunks": 2.520291,
              "optimize tree": 0.003006,
              "optimize chunk modules": 0.004942,
              "module ids": 0.864975,
              "chunk ids": 0.257865,
              "assign runtime ids": 0.003128,
              "optimize code generation": 0.002648,
              "create module hashes": 1.690446,
              "code generation": 8.032728,
              "runtime requirements": 1.397708,
              "hashing": 0.792213,
              "create module assets": 0.029021,
              "create chunk assets": 2.144218,
              "process assets": 0.149807,
              "after process assets": 0.002538,
              "after seal": 0.002516,
              "emit assets": 3.773663
            },
            "unaccountedMs": 138.51585500000004
          },
          {
            "totalMs": 185.06531299999983,
            "phases": {
              "build module graph": 15.057714,
              "finish modules": 4.022774,
              "seal": 0.003922,
              "optimize dependencies": 0.827914,
              "build chunk graph": 3.259029,
              "optimize modules": 0.006337,
              "optimize chunks": 3.957146,
              "optimize tree": 0.003849,
              "optimize chunk modules": 0.004762,
              "module ids": 0.969228,
              "chunk ids": 0.254126,
              "assign runtime ids": 0.003093,
              "optimize code generation": 0.002571,
              "create module hashes": 1.708971,
              "code generation": 7.876268,
              "runtime requirements": 1.722502,
              "hashing": 0.905708,
              "create module assets": 0.032676,
              "create chunk assets": 2.137745,
              "process assets": 0.159647,
              "after process assets": 0.003544,
              "after seal": 0.002381,
              "emit assets": 3.286677
            },
            "unaccountedMs": 138.85672899999986
          },
          {
            "totalMs": 182.20153599999958,
            "phases": {
              "build module graph": 16.090549,
              "finish modules": 3.916524,
              "seal": 0.003539,
              "optimize dependencies": 0.844097,
              "build chunk graph": 2.684504,
              "optimize modules": 0.006896,
              "optimize chunks": 2.904938,
              "optimize tree": 0.00329,
              "optimize chunk modules": 0.003891,
              "module ids": 1.128871,
              "chunk ids": 0.245842,
              "assign runtime ids": 0.002792,
              "optimize code generation": 0.002688,
              "create module hashes": 1.892213,
              "code generation": 8.560878,
              "runtime requirements": 1.613536,
              "hashing": 0.93649,
              "create module assets": 0.042177,
              "create chunk assets": 2.29763,
              "process assets": 0.155055,
              "after process assets": 0.002849,
              "after seal": 0.011084,
              "emit assets": 3.786497
            },
            "unaccountedMs": 135.06470599999957
          },
          {
            "totalMs": 180.85525800000005,
            "phases": {
              "build module graph": 15.600004,
              "finish modules": 3.666831,
              "seal": 0.003244,
              "optimize dependencies": 0.851203,
              "build chunk graph": 2.853808,
              "optimize modules": 0.00672,
              "optimize chunks": 2.232874,
              "optimize tree": 0.003629,
              "optimize chunk modules": 0.003974,
              "module ids": 0.790814,
              "chunk ids": 0.301297,
              "assign runtime ids": 0.003115,
              "optimize code generation": 0.003114,
              "create module hashes": 1.518077,
              "code generation": 8.01,
              "runtime requirements": 1.464754,
              "hashing": 0.964754,
              "create module assets": 0.031834,
              "create chunk assets": 2.419965,
              "process assets": 0.138844,
              "after process assets": 0.002742,
              "after seal": 0.002234,
              "emit assets": 3.581535
            },
            "unaccountedMs": 136.39989200000005
          },
          {
            "totalMs": 188.44169600000032,
            "phases": {
              "build module graph": 15.767761,
              "finish modules": 4.133407,
              "seal": 0.00332,
              "optimize dependencies": 1.445674,
              "build chunk graph": 2.589713,
              "optimize modules": 0.00461,
              "optimize chunks": 3.797765,
              "optimize tree": 0.003204,
              "optimize chunk modules": 0.003746,
              "module ids": 1.2597,
              "chunk ids": 0.223523,
              "assign runtime ids": 0.002451,
              "optimize code generation": 0.00193,
              "create module hashes": 2.067458,
              "code generation": 8.34748,
              "runtime requirements": 1.736096,
              "hashing": 0.997078,
              "create module assets": 0.029116,
              "create chunk assets": 2.307254,
              "process assets": 0.135327,
              "after process assets": 0.002631,
              "after seal": 0.001917,
              "emit assets": 3.582755
            },
            "unaccountedMs": 139.99778000000032
          }
        ],
        "loaderOnly": [
          {
            "totalMs": 170.09594299999992,
            "phases": {
              "build module graph": 18.744972,
              "finish modules": 4.672626,
              "seal": 0.003423,
              "optimize dependencies": 0.908359,
              "build chunk graph": 2.915718,
              "optimize modules": 0.004991,
              "optimize chunks": 3.32538,
              "optimize tree": 0.003114,
              "optimize chunk modules": 0.003992,
              "module ids": 0.967253,
              "chunk ids": 0.261301,
              "assign runtime ids": 0.003026,
              "optimize code generation": 0.002004,
              "create module hashes": 1.752864,
              "code generation": 8.21047,
              "runtime requirements": 2.152048,
              "hashing": 1.015094,
              "create module assets": 0.044935,
              "create chunk assets": 2.358456,
              "process assets": 0.121366,
              "after process assets": 0.002408,
              "after seal": 0.002535,
              "emit assets": 3.644796
            },
            "unaccountedMs": 118.97481199999991
          },
          {
            "totalMs": 174.69950900000003,
            "phases": {
              "build module graph": 18.497355,
              "finish modules": 4.539579,
              "seal": 0.003444,
              "optimize dependencies": 1.038442,
              "build chunk graph": 3.063695,
              "optimize modules": 0.00545,
              "optimize chunks": 2.976791,
              "optimize tree": 0.003359,
              "optimize chunk modules": 0.004587,
              "module ids": 1.248468,
              "chunk ids": 0.263127,
              "assign runtime ids": 0.003111,
              "optimize code generation": 0.002064,
              "create module hashes": 1.853705,
              "code generation": 7.931134,
              "runtime requirements": 1.80176,
              "hashing": 1.035345,
              "create module assets": 0.045031,
              "create chunk assets": 2.395809,
              "process assets": 0.139889,
              "after process assets": 0.002523,
              "after seal": 0.002567,
              "emit assets": 3.734476
            },
            "unaccountedMs": 124.10779800000005
          },
          {
            "totalMs": 171.90286400000014,
            "phases": {
              "build module graph": 18.889828,
              "finish modules": 4.792448,
              "seal": 0.004105,
              "optimize dependencies": 1.053427,
              "build chunk graph": 3.029189,
              "optimize modules": 0.005572,
              "optimize chunks": 3.484725,
              "optimize tree": 0.003651,
              "optimize chunk modules": 0.003878,
              "module ids": 1.073569,
              "chunk ids": 0.273611,
              "assign runtime ids": 0.002822,
              "optimize code generation": 0.002095,
              "create module hashes": 1.874645,
              "code generation": 7.991574,
              "runtime requirements": 1.607977,
              "hashing": 0.933759,
              "create module assets": 0.031142,
              "create chunk assets": 2.628622,
              "process assets": 0.130209,
              "after process assets": 0.003613,
              "after seal": 0.002359,
              "emit assets": 3.601284
            },
            "unaccountedMs": 120.47876000000014
          },
          {
            "totalMs": 177.57412000000022,
            "phases": {
              "build module graph": 21.9222,
              "finish modules": 4.550172,
              "seal": 0.003514,
              "optimize dependencies": 0.750309,
              "build chunk graph": 2.734294,
              "optimize modules": 0.004913,
              "optimize chunks": 2.576634,
              "optimize tree": 0.002618,
              "optimize chunk modules": 0.003935,
              "module ids": 1.716208,
              "chunk ids": 0.414573,
              "assign runtime ids": 0.002841,
              "optimize code generation": 0.001652,
              "create module hashes": 1.68969,
              "code generation": 8.180142,
              "runtime requirements": 1.822891,
              "hashing": 0.986735,
              "create module assets": 0.032789,
              "create chunk assets": 2.397604,
              "process assets": 0.132887,
              "after process assets": 0.003502,
              "after seal": 0.00295,
              "emit assets": 3.65725
            },
            "unaccountedMs": 123.98381700000024
          },
          {
            "totalMs": 176.36673599999995,
            "phases": {
              "build module graph": 18.807765,
              "finish modules": 4.447644,
              "seal": 0.003853,
              "optimize dependencies": 0.849389,
              "build chunk graph": 2.827856,
              "optimize modules": 0.004366,
              "optimize chunks": 3.358307,
              "optimize tree": 0.003451,
              "optimize chunk modules": 0.004442,
              "module ids": 1.175092,
              "chunk ids": 0.34958,
              "assign runtime ids": 0.002337,
              "optimize code generation": 0.001923,
              "create module hashes": 1.661627,
              "code generation": 8.089313,
              "runtime requirements": 1.759181,
              "hashing": 0.938161,
              "create module assets": 0.044055,
              "create chunk assets": 2.260115,
              "process assets": 0.110683,
              "after process assets": 0.006589,
              "after seal": 0.002084,
              "emit assets": 3.851632
            },
            "unaccountedMs": 125.80729099999994
          }
        ]
      }
    },
    {
      "name": "slow-loader",
      "complexity": 200,
      "cold": {
        "total": {
          "min": 11206.674841,
          "median": 11325.250200999999,
          "mean": 11328.3434222,
          "max": 11449.018712000005
        },
        "unaccounted": {
          "min": 191.35447699999895,
          "median": 194.73284900000363,
          "mean": 200.19969539999838,
          "max": 223.48523800000112
        },
        "phases": {
          "build module graph": {
            "min": 10967.481506,
            "median": 11079.787564,
            "mean": 11080.023877200001,
            "max": 11178.371313
          },
          "finish modules": {
            "min": 3.250211,
            "median": 3.926417,
            "mean": 4.0815534,
            "max": 5.156176
          },
          "seal": {
            "min": 0.003722,
            "median": 0.004632,
            "mean": 0.005088400000000001,
            "max": 0.007743
          },
          "optimize dependencies": {
            "min": 0.887753,
            "median": 0.921018,
            "mean": 0.9731470000000002,
            "max": 1.099034
          },
          "build chunk graph": {
            "min": 2.576059,
            "median": 2.811769,
            "mean": 2.7779271999999997,
            "max": 2.920776
          },
          "optimize modules": {
            "min": 0.005024,
            "median": 0.005246,
            "mean": 0.0057150000000000005,
            "max": 0.007351
          },
          "optimize chunks": {
            "min": 2.484259,
            "median": 2.658232,
            "mean": 2.8788644,
            "max": 3.498285
          },
          "optimize tree": {
            "min": 0.002238,
            "median": 0.002683,
            "mean": 0.0026626,
            "max": 0.003008
          },
          "optimize chunk modules": {
            "min": 0.003593,
            "median": 0.003909,
            "mean": 0.0039602,
            "max": 0.004477
          },
          "module ids": {
            "min": 0.720926,
            "median": 0.832469,
            "mean": 0.8929104000000001,
            "max": 1.063781
          },
          "chunk ids": {
            "min": 0.240841,
            "median": 0.27646,
            "mean": 0.30785640000000003,
            "max": 0.431894
          },
          "assign runtime ids": {
            "min": 0.002502,
            "median": 0.002949,
            "mean": 0.003073,
            "max": 0.003988
          },
          "optimize code generation": {
            "min": 0.001557,
            "median": 0.002197,
            "mean": 0.0022288000000000004,
            "max": 0.002992
          },
          "create module hashes": {
            "min": 1.566311,
            "median": 1.726962,
            "mean": 1.8161176,
            "max": 2.329593
          },
          "code generation": {
            "min": 8.075472,
            "median": 8.571139,
            "mean": 8.8201558,
            "max": 10.548368
          },
          "runtime requirements": {
            "min": 1.464539,
            "median": 1.648607,
            "mean": 1.6497448000000001,
            "max": 1.822824
          },
          "hashing": {
            "min": 0.955921,
            "median": 1.083806,
            "mean": 1.0788168,
            "max": 1.212502
          },
          "create module assets": {
            "min": 0.027954,
            "median": 0.030725,
            "mean": 0.0324218,
            "max": 0.040438
          },
          "create chunk assets": {
            "min": 2.274904,
            "median": 2.421721,
            "mean": 2.4224457999999998,
            "max": 2.63347
          },
          "process assets": {
            "min": 0.218178,
            "median": 0.247944,
            "mean": 0.253927,
            "max": 0.288342
          },
          "after process assets": {
            "min": 0.002473,
            "median": 0.003675,
            "mean": 0.0050866,
            "max": 0.011849
          },
          "after seal": {
            "min": 0.002558,
            "median": 0.002723,
            "mean": 0.0027462,
            "max": 0.002945
          },
          "emit assets": {
            "min": 19.613045,
            "median": 19.809679,
            "mean": 20.1034004,
            "max": 21.043753
          }
        }
      },
      "persistMake": {
        "total": {
          "min": 196.5520819999947,
          "median": 199.1738150000001,
          "mean": 202.61256259999828,
          "max": 215.90167199999996
        },
        "unaccounted": {
          "min": 135.47580999999468,
          "median": 138.2424390000001,
          "mean": 139.94884819999828,
          "max": 149.65586899999994
        },
        "phases": {
          "build module graph": {
            "min": 16.675807,
            "median": 17.312781,
            "mean": 17.442798600000003,
            "max": 18.411931
          },
          "finish modules": {
            "min": 3.394557,
            "median": 3.776631,
            "mean": 3.7268966,
            "max": 3.952594
          },
          "seal": {
            "min": 0.002917,
            "median": 0.003475,
            "mean": 0.0036119999999999998,
            "max": 0.004634
          },
          "optimize dependencies": {
            "min": 0.811148,
            "median": 0.873993,
            "mean": 0.8903625999999999,
            "max": 0.969019
          },
          "build chunk graph": {
            "min": 2.453228,
            "median": 2.503374,
            "mean": 2.6376052000000003,
            "max": 2.954228
          },
          "optimize modules": {
            "min": 0.004296,
            "median": 0.005769,
            "mean": 0.0055192,
            "max": 0.006103
          },
          "optimize chunks": {
            "min": 2.381685,
            "median": 2.873082,
            "mean": 2.7913484000000004,
            "max": 3.255072
          },
          "optimize tree": {
            "min": 0.002646,
            "median": 0.002671,
            "mean": 0.0029413999999999994,
            "max": 0.003927
          },
          "optimize chunk modules": {
            "min": 0.003421,
            "median": 0.00395,
            "mean": 0.0041681999999999995,
            "max": 0.005846
          },
          "module ids": {
            "min": 0.731562,
            "median": 0.840977,
            "mean": 0.8175656,
            "max": 0.892185
          },
          "chunk ids": {
            "min": 0.255624,
            "median": 0.271232,
            "mean": 0.3008486,
            "max": 0.364533
          },
          "assign runtime ids": {
            "min": 0.002477,
            "median": 0.003107,
            "mean": 0.003055,
            "max": 0.003915
          },
          "optimize code generation": {
            "min": 0.001605,
            "median": 0.002036,
            "mean": 0.0019796,
            "max": 0.002517
          },
          "create module hashes": {
            "min": 1.433319,
            "median": 1.58006,
            "mean": 1.5853370000000002,
            "max": 1.77787
          },
          "code generation": {
            "min": 8.187622,
            "median": 8.530341,
            "mean": 8.5471182,
            "max": 8.881933
          },
          "runtime requirements": {
            "min": 1.616422,
            "median": 1.751394,
            "mean": 1.7287408,
            "max": 1.817081
          },
          "hashing": {
            "min": 0.930277,
            "median": 0.955948,
            "mean": 1.0581796,
            "max": 1.440908
          },
          "create module assets": {
            "min": 0.028066,
            "median": 0.03073,
            "mean": 0.032451600000000004,
            "max": 0.040284
          },
          "create chunk assets": {
            "min": 2.354213,
            "median": 2.396471,
            "mean": 2.4916456,
            "max": 2.731061
          },
          "process assets": {
            "min": 0.134256,
            "median": 0.159905,
            "mean": 0.15763179999999996,
            "max": 0.184621
          },
          "after process assets": {
            "min": 0.003056,
            "median": 0.003123,
            "mean": 0.0042232,
            "max": 0.007239
          },
          "after seal": {
            "min": 0.002213,
            "median": 0.002675,
            "mean": 0.0027708,
            "max": 0.003309
          },
          "emit assets": {
            "min": 17.318544,
            "median": 17.855248,
            "mean": 18.4269148,
            "max": 19.757026
          }
        }
      },
      "loaderOnly": {
        "total": {
          "min": 210.35248699999647,
          "median": 214.1578840000002,
          "mean": 215.15215979999886,
          "max": 221.65755299999728
        },
        "unaccounted": {
          "min": 120.75300799999646,
          "median": 123.9473959999996,
          "mean": 125.27033979999885,
          "max": 131.3124869999973
        },
        "phases": {
          "build module graph": {
            "min": 41.029682,
            "median": 42.239273,
            "mean": 42.3514948,
            "max": 43.285089
          },
          "finish modules": {
            "min": 4.527857,
            "median": 4.682028,
            "mean": 4.7418128,
            "max": 5.084783
          },
          "seal": {
            "min": 0.00342,
            "median": 0.003643,
            "mean": 0.0036004,
            "max": 0.003697
          },
          "optimize dependencies": {
            "min": 0.784978,
            "median": 0.9684,
            "mean": 0.9831356,
            "max": 1.163972
          },
          "build chunk graph": {
            "min": 2.782696,
            "median": 2.878657,
            "mean": 2.9600994,
            "max": 3.277289
          },
          "optimize modules": {
            "min": 0.005117,
            "median": 0.006567,
            "mean": 0.0074854000000000006,
            "max": 0.011046
          },
          "optimize chunks": {
            "min": 2.491143,
            "median": 3.258014,
            "mean": 3.2362268,
            "max": 3.69367
          },
          "optimize tree": {
            "min": 0.002615,
            "median": 0.003078,
            "mean": 0.0031216,
            "max": 0.003966
          },
          "optimize chunk modules": {
            "min": 0.003787,
            "median": 0.004293,
            "mean": 0.0045547999999999995,
            "max": 0.005504
          },
          "module ids": {
            "min": 0.762703,
            "median": 1.061918,
            "mean": 1.0180868,
            "max": 1.130044
          },
          "chunk ids": {
            "min": 0.258054,
            "median": 0.349107,
            "mean": 0.3284538,
            "max": 0.385688
          },
          "assign runtime ids": {
            "min": 0.002388,
            "median": 0.002685,
            "mean": 0.002736,
            "max": 0.003
          },
          "optimize code generation": {
            "min": 0.001565,
            "median": 0.001737,
            "mean": 0.0018586000000000002,
            "max": 0.002576
          },
          "create module hashes": {
            "min": 1.647873,
            "median": 1.742156,
            "mean": 1.7360465999999999,
            "max": 1.861566
          },
          "code generation": {
            "min": 8.128853,
            "median": 8.151396,
            "mean": 8.2708488,
            "max": 8.58019
          },
          "runtime requirements": {
            "min": 1.533729,
            "median": 1.625591,
            "mean": 1.6389952,
            "max": 1.763705
          },
          "hashing": {
            "min": 0.905227,
            "median": 1.046245,
            "mean": 1.0290143999999999,
            "max": 1.130144
          },
          "create module assets": {
            "min": 0.028145,
            "median": 0.029712,
            "mean": 0.0312332,
            "max": 0.03891
          },
          "create chunk assets": {
            "min": 2.208326,
            "median": 2.33965,
            "mean": 2.3987486,
            "max": 2.639403
          },
          "process assets": {
            "min": 0.129776,
            "median": 0.142563,
            "mean": 0.1461646,
            "max": 0.178684
          },
          "after process assets": {
            "min": 0.002444,
            "median": 0.003124,
            "mean": 0.003644,
            "max": 0.006696
          },
          "after seal": {
            "min": 0.001995,
            "median": 0.002465,
            "mean": 0.0025036,
            "max": 0.003227
          },
          "emit assets": {
            "min": 18.108654,
            "median": 18.737406,
            "mean": 18.9819542,
            "max": 19.941851
          }
        }
      },
      "raw": {
        "cold": [
          {
            "totalMs": 11206.674841,
            "phases": {
              "build module graph": 10967.481506,
              "finish modules": 4.316736,
              "seal": 0.003722,
              "optimize dependencies": 0.892856,
              "build chunk graph": 2.811769,
              "optimize modules": 0.007351,
              "optimize chunks": 3.114103,
              "optimize tree": 0.002611,
              "optimize chunk modules": 0.003593,
              "module ids": 1.056983,
              "chunk ids": 0.345962,
              "assign runtime ids": 0.003125,
              "optimize code generation": 0.001557,
              "create module hashes": 1.726962,
              "code generation": 8.571139,
              "runtime requirements": 1.464539,
              "hashing": 1.139466,
              "create module assets": 0.027985,
              "create chunk assets": 2.309625,
              "process assets": 0.247944,
              "after process assets": 0.003675,
              "after seal": 0.002558,
              "emit assets": 19.784597
            },
            "unaccountedMs": 191.35447699999895
          },
          {
            "totalMs": 11251.934067000002,
            "phases": {
              "build module graph": 11010.682,
              "finish modules": 3.250211,
              "seal": 0.007743,
              "optimize dependencies": 0.921018,
              "build chunk graph": 2.662164,
              "optimize modules": 0.005024,
              "optimize chunks": 2.639443,
              "optimize tree": 0.002773,
              "optimize chunk modules": 0.004148,
              "module ids": 0.790393,
              "chunk ids": 0.27646,
              "assign runtime ids": 0.003988,
              "optimize code generation": 0.002821,
              "create module hashes": 2.329593,
              "code generation": 8.582484,
              "runtime requirements": 1.648607,
              "hashing": 1.002389,
              "create module assets": 0.030725,
              "create chunk assets": 2.274904,
              "process assets": 0.268337,
              "after process assets": 0.003417,
              "after seal": 0.002897,
              "emit assets": 19.809679
            },
            "unaccountedMs": 194.73284900000363
          },
          {
            "totalMs": 11325.250200999999,
            "phases": {
              "build module graph": 11079.787564,
              "finish modules": 3.926417,
              "seal": 0.005008,
              "optimize dependencies": 0.887753,
              "build chunk graph": 2.918868,
              "optimize modules": 0.005246,
              "optimize chunks": 3.498285,
              "optimize tree": 0.002683,
              "optimize chunk modules": 0.003674,
              "module ids": 1.063781,
              "chunk ids": 0.240841,
              "assign runtime ids": 0.002949,
              "optimize code generation": 0.002992,
              "create module hashes": 1.87864,
              "code generation": 8.323316,
              "runtime requirements": 1.530154,
              "hashing": 0.955921,
              "create module assets": 0.027954,
              "create chunk assets": 2.472509,
              "process assets": 0.246834,
              "after process assets": 0.004019,
              "after seal": 0.002945,
              "emit assets": 19.613045
            },
            "unaccountedMs": 197.8488029999953
          },
          {
            "totalMs": 11449.018712000005,
            "phases": {
              "build module graph": 11178.371313,
              "finish modules": 3.758227,
              "seal": 0.004337,
              "optimize dependencies": 1.099034,
              "build chunk graph": 2.576059,
              "optimize modules": 0.005162,
              "optimize chunks": 2.484259,
              "optimize tree": 0.002238,
              "optimize chunk modules": 0.003909,
              "module ids": 0.720926,
              "chunk ids": 0.244125,
              "assign runtime ids": 0.002801,
              "optimize code generation": 0.001577,
              "create module hashes": 1.579082,
              "code generation": 8.075472,
              "runtime requirements": 1.7826,
              "hashing": 1.083806,
              "create module assets": 0.040438,
              "create chunk assets": 2.421721,
              "process assets": 0.218178,
              "after process assets": 0.011849,
              "after seal": 0.002608,
              "emit assets": 21.043753
            },
            "unaccountedMs": 223.48523800000112
          },
          {
            "totalMs": 11408.839289999996,
            "phases": {
              "build module graph": 11163.797003,
              "finish modules": 5.156176,
              "seal": 0.004632,
              "optimize dependencies": 1.065074,
              "build chunk graph": 2.920776,
              "optimize modules": 0.005792,
              "optimize chunks": 2.658232,
              "optimize tree": 0.003008,
              "optimize chunk modules": 0.004477,
              "module ids": 0.832469,
              "chunk ids": 0.431894,
              "assign runtime ids": 0.002502,
              "optimize code generation": 0.002197,
              "create module hashes": 1.566311,
              "code generation": 10.548368,
              "runtime requirements": 1.822824,
              "hashing": 1.212502,
              "create module assets": 0.035007,
              "create chunk assets": 2.63347,
              "process assets": 0.288342,
              "after process assets": 0.002473,
              "after seal": 0.002723,
              "emit assets": 20.265928
            },
            "unaccountedMs": 193.5771099999929
          }
        ],
        "persistMake": [
          {
            "totalMs": 199.1738150000001,
            "phases": {
              "build module graph": 16.675807,
              "finish modules": 3.952594,
              "seal": 0.002917,
              "optimize dependencies": 0.969019,
              "build chunk graph": 2.775281,
              "optimize modules": 0.005999,
              "optimize chunks": 2.873082,
              "optimize tree": 0.003927,
              "optimize chunk modules": 0.005846,
              "module ids": 0.881913,
              "chunk ids": 0.271232,
              "assign runtime ids": 0.003107,
              "optimize code generation": 0.002101,
              "create module hashes": 1.58006,
              "code generation": 8.279888,
              "runtime requirements": 1.616422,
              "hashing": 0.949817,
              "create module assets": 0.029837,
              "create chunk assets": 2.354213,
              "process assets": 0.159905,
              "after process assets": 0.007239,
              "after seal": 0.003309,
              "emit assets": 17.527861
            },
            "unaccountedMs": 138.2424390000001
          },
          {
            "totalMs": 203.6436450000001,
            "phases": {
              "build module graph": 17.312781,
              "finish modules": 3.394557,
              "seal": 0.003322,
              "optimize dependencies": 0.873993,
              "build chunk graph": 2.503374,
              "optimize modules": 0.005769,
              "optimize chunks": 2.508739,
              "optimize tree": 0.002671,
              "optimize chunk modules": 0.00395,
              "module ids": 0.731562,
              "chunk ids": 0.341959,
              "assign runtime ids": 0.002477,
              "optimize code generation": 0.002517,
              "create module hashes": 1.77787,
              "code generation": 8.530341,
              "runtime requirements": 1.662726,
              "hashing": 1.013948,
              "create module assets": 0.03073,
              "create chunk assets": 2.731061,
              "process assets": 0.160519,
              "after process assets": 0.0046,
              "after seal": 0.003282,
              "emit assets": 19.675895
            },
            "unaccountedMs": 140.36500200000012
          },
          {
            "totalMs": 215.90167199999996,
            "phases": {
              "build module graph": 18.411931,
              "finish modules": 3.68019,
              "seal": 0.003712,
              "optimize dependencies": 0.84631,
              "build chunk graph": 2.501915,
              "optimize modules": 0.006103,
              "optimize chunks": 3.255072,
              "optimize tree": 0.002646,
              "optimize chunk modules": 0.003982,
              "module ids": 0.892185,
              "chunk ids": 0.270895,
              "assign runtime ids": 0.003915,
              "optimize code generation": 0.002036,
              "create module hashes": 1.665534,
              "code generation": 8.855807,
              "runtime requirements": 1.796081,
              "hashing": 1.440908,
              "create module assets": 0.040284,
              "create chunk assets": 2.618877,
              "process assets": 0.184621,
              "after process assets": 0.003098,
              "after seal": 0.002675,
              "emit assets": 19.757026
            },
            "unaccountedMs": 149.65586899999994
          },
          {
            "totalMs": 197.7915989999965,
            "phases": {
              "build module graph": 17.696942,
              "finish modules": 3.830511,
              "seal": 0.004634,
              "optimize dependencies": 0.951343,
              "build chunk graph": 2.954228,
              "optimize modules": 0.005429,
              "optimize chunks": 2.938164,
              "optimize tree": 0.002808,
              "optimize chunk modules": 0.003642,
              "module ids": 0.741191,
              "chunk ids": 0.364533,
              "assign runtime ids": 0.002518,
              "optimize code generation": 0.001639,
              "create module hashes": 1.469902,
              "code generation": 8.187622,
              "runtime requirements": 1.817081,
              "hashing": 0.955948,
              "create module assets": 0.028066,
              "create chunk assets": 2.357606,
              "process assets": 0.148858,
              "after process assets": 0.003056,
              "after seal": 0.002213,
              "emit assets": 17.318544
            },
            "unaccountedMs": 136.0051209999965
          },
          {
            "totalMs": 196.5520819999947,
            "phases": {
              "build module graph": 17.116532,
              "finish modules": 3.776631,
              "seal": 0.003475,
              "optimize dependencies": 0.811148,
              "build chunk graph": 2.453228,
              "optimize modules": 0.004296,
              "optimize chunks": 2.381685,
              "optimize tree": 0.002655,
              "optimize chunk modules": 0.003421,
              "module ids": 0.840977,
              "chunk ids": 0.255624,
              "assign runtime ids": 0.003258,
              "optimize code generation": 0.001605,
              "create module hashes": 1.433319,
              "code generation": 8.881933,
              "runtime requirements": 1.751394,
              "hashing": 0.930277,
              "create module assets": 0.033341,
              "create chunk assets": 2.396471,
              "process assets": 0.134256,
              "after process assets": 0.003123,
              "after seal": 0.002375,
              "emit assets": 17.855248
            },
            "unaccountedMs": 135.47580999999468
          }
        ],
        "loaderOnly": [
          {
            "totalMs": 213.5140709999996,
            "phases": {
              "build module graph": 43.285089,
              "finish modules": 4.818285,
              "seal": 0.00342,
              "optimize dependencies": 0.784978,
              "build chunk graph": 2.782696,
              "optimize modules": 0.009542,
              "optimize chunks": 3.258014,
              "optimize tree": 0.002729,
              "optimize chunk modules": 0.004293,
              "module ids": 0.762703,
              "chunk ids": 0.258054,
              "assign runtime ids": 0.002989,
              "optimize code generation": 0.001774,
              "create module hashes": 1.764911,
              "code generation": 8.128853,
              "runtime requirements": 1.533729,
              "hashing": 0.974296,
              "create module assets": 0.03891,
              "create chunk assets": 2.639403,
              "process assets": 0.129908,
              "after process assets": 0.002444,
              "after seal": 0.002308,
              "emit assets": 18.377347
            },
            "unaccountedMs": 123.9473959999996
          },
          {
            "totalMs": 216.07880400000067,
            "phases": {
              "build module graph": 42.029362,
              "finish modules": 4.596111,
              "seal": 0.003643,
              "optimize dependencies": 0.850959,
              "build chunk graph": 2.878657,
              "optimize modules": 0.005155,
              "optimize chunks": 3.69367,
              "optimize tree": 0.003078,
              "optimize chunk modules": 0.004151,
              "module ids": 1.061918,
              "chunk ids": 0.349107,
              "assign runtime ids": 0.002388,
              "optimize code generation": 0.001737,
              "create module hashes": 1.663727,
              "code generation": 8.58019,
              "runtime requirements": 1.625591,
              "hashing": 0.905227,
              "create module assets": 0.029712,
              "create chunk assets": 2.255633,
              "process assets": 0.129776,
              "after process assets": 0.002459,
              "after seal": 0.002523,
              "emit assets": 18.737406
            },
            "unaccountedMs": 126.66662400000067
          },
          {
            "totalMs": 221.65755299999728,
            "phases": {
              "build module graph": 41.029682,
              "finish modules": 4.527857,
              "seal": 0.003646,
              "optimize dependencies": 1.147369,
              "build chunk graph": 3.007217,
              "optimize modules": 0.006567,
              "optimize chunks": 3.522565,
              "optimize tree": 0.003966,
              "optimize chunk modules": 0.005039,
              "module ids": 1.078572,
              "chunk ids": 0.385688,
              "assign runtime ids": 0.002685,
              "optimize code generation": 0.001641,
              "create module hashes": 1.861566,
              "code generation": 8.356504,
              "runtime requirements": 1.763705,
              "hashing": 1.130144,
              "create module assets": 0.030001,
              "create chunk assets": 2.550731,
              "process assets": 0.178684,
              "after process assets": 0.003497,
              "after seal": 0.003227,
              "emit assets": 19.744513
            },
            "unaccountedMs": 131.3124869999973
          },
          {
            "totalMs": 214.1578840000002,
            "phases": {
              "build module graph": 43.174068,
              "finish modules": 4.682028,
              "seal": 0.003596,
              "optimize dependencies": 0.9684,
              "build chunk graph": 2.854638,
              "optimize modules": 0.011046,
              "optimize chunks": 2.491143,
              "optimize tree": 0.00322,
              "optimize chunk modules": 0.005504,
              "module ids": 1.057197,
              "chunk ids": 0.272955,
              "assign runtime ids": 0.002618,
              "optimize code generation": 0.002576,
              "create module hashes": 1.647873,
              "code generation": 8.137301,
              "runtime requirements": 1.660635,
              "hashing": 1.046245,
              "create module assets": 0.028145,
              "create chunk assets": 2.33965,
              "process assets": 0.149892,
              "after process assets": 0.003124,
              "after seal": 0.001995,
              "emit assets": 19.941851
            },
            "unaccountedMs": 123.6721840000002
          },
          {
            "totalMs": 210.35248699999647,
            "phases": {
              "build module graph": 42.239273,
              "finish modules": 5.084783,
              "seal": 0.003697,
              "optimize dependencies": 1.163972,
              "build chunk graph": 3.277289,
              "optimize modules": 0.005117,
              "optimize chunks": 3.215742,
              "optimize tree": 0.002615,
              "optimize chunk modules": 0.003787,
              "module ids": 1.130044,
              "chunk ids": 0.376465,
              "assign runtime ids": 0.003,
              "optimize code generation": 0.001565,
              "create module hashes": 1.742156,
              "code generation": 8.151396,
              "runtime requirements": 1.611316,
              "hashing": 1.08916,
              "create module assets": 0.029398,
              "create chunk assets": 2.208326,
              "process assets": 0.142563,
              "after process assets": 0.006696,
              "after seal": 0.002465,
              "emit assets": 18.108654
            },
            "unaccountedMs": 120.75300799999646
          }
        ]
      }
    }
  ]
}
```
