# Run 8 sanitized production observations

These retain all 100 browser results and all 100 feed/Home probe results. Account numbers are designated-test aliases; credentials, user/post identifiers and signed URLs are excluded. Browser reliability and HTTP probes ran concurrently, after the separate photo experiment.

```json
{
  "production_revision": "6996817cec6aaf865357e9fee6550abf27cdfd0f",
  "merge_and_deployment_receipts": [
    {
      "event": "merged",
      "pr": 334,
      "head": "b8fd31bb7fffc7bb47c8f435794126b33486c8e9",
      "merge": "73ce933a8a8c08b1d85238442e391affe7e57374",
      "at": "2026-11-03T04:37:57Z",
      "review": "https://github.com/aibraincoach/my-food-ai/pull/334#pullrequestreview-5747250164"
    },
    {
      "event": "production_ready",
      "pr": 334,
      "commit": "73ce933a8a8c08b1d85238442e391affe7e57374",
      "deployment": "dpl_EL4TzBgx3esANF6Rq5wekAA2TyBf",
      "health": 200,
      "at": "2026-11-03T04:38:35.019Z"
    },
    {
      "event": "merged",
      "pr": 335,
      "head": "5f0ea74cc024c6ee376790e003b409a8a69d99a2",
      "merge": "50af35864623a98603903d01a6bb59300ab66085",
      "at": "2026-11-03T04:38:37Z",
      "review": "https://github.com/aibraincoach/my-food-ai/pull/335#pullrequestreview-5747307452"
    },
    {
      "event": "production_ready",
      "pr": 335,
      "commit": "50af35864623a98603903d01a6bb59300ab66085",
      "deployment": "dpl_AZ28Acx3HJoyx1rbFqyWV7jwPmRV",
      "health": 200,
      "at": "2026-11-03T04:39:21.124Z"
    },
    {
      "event": "merged",
      "pr": 336,
      "head": "3ae247c9e7a9430970e53004235988673fe1bd7c",
      "merge": "6cc5ca462b1de812de2077536fc7023e5338bfd1",
      "at": "2026-11-03T04:39:23Z",
      "review": "https://github.com/aibraincoach/my-food-ai/pull/336#pullrequestreview-5747253352"
    },
    {
      "event": "production_ready",
      "pr": 336,
      "commit": "6cc5ca462b1de812de2077536fc7023e5338bfd1",
      "deployment": "dpl_BajcDKnYYUszRfpHV79na6FaJNmx",
      "health": 200,
      "at": "2026-11-03T04:40:11.309Z"
    },
    {
      "event": "merged",
      "pr": 337,
      "head": "6542ef8dbd0f7536e12434d92173e7b14dbaad31",
      "merge": "5fc9f9b624d681d3440f59350837b78e925b1ce6",
      "at": "2026-11-03T04:40:14Z",
      "review": "https://github.com/aibraincoach/my-food-ai/pull/337#pullrequestreview-5747256521"
    },
    {
      "event": "production_ready",
      "pr": 337,
      "commit": "5fc9f9b624d681d3440f59350837b78e925b1ce6",
      "deployment": "dpl_6izWwajJqMrdwk1J8Y7ADNfb9kWa",
      "health": 200,
      "at": "2026-11-03T04:40:47.325Z"
    },
    {
      "event": "merged",
      "pr": 338,
      "head": "2f27b38bf45270e425a37d2b099dfb0e7a51ae08",
      "merge": "a056db7e0cbbc921d34e61966c8287393bd67466",
      "at": "2026-11-03T04:40:49Z",
      "review": "https://github.com/aibraincoach/my-food-ai/pull/338#pullrequestreview-5747304548"
    },
    {
      "event": "production_ready",
      "pr": 338,
      "commit": "a056db7e0cbbc921d34e61966c8287393bd67466",
      "deployment": "dpl_EYhwGwArAYVBqJaZfK9D6Wq15irL",
      "health": 200,
      "at": "2026-11-03T04:41:22.506Z"
    },
    {
      "event": "migration",
      "migration": "0035_user_call_caps.sql",
      "at": "2026-11-03T04:41:23.795Z",
      "function": "public.user_hit"
    },
    {
      "event": "merged",
      "pr": 339,
      "head": "91b09132cf664eb73c4e99f0fd4a9ccf9f3a3fdf",
      "merge": "ac0b7871c5c2433e7a20494afe83e3264489861f",
      "at": "2026-11-03T04:41:25Z",
      "review": "https://github.com/aibraincoach/my-food-ai/pull/339#pullrequestreview-5747263811"
    },
    {
      "event": "production_ready",
      "pr": 339,
      "commit": "ac0b7871c5c2433e7a20494afe83e3264489861f",
      "deployment": "dpl_GgDykN8RhFRZeUhPJvLXkdxz2Cyd",
      "health": 200,
      "at": "2026-11-03T04:41:58.192Z"
    },
    {
      "event": "merged",
      "pr": 340,
      "head": "1118e0fc1d0af4866b4b7714c427e5fdd5b696de",
      "merge": "18f768e2688eff84d10d320f1a69f2ec24b8ab68",
      "at": "2026-11-03T04:42:00Z",
      "review": "https://github.com/aibraincoach/my-food-ai/pull/340#pullrequestreview-5747260011"
    },
    {
      "event": "production_ready",
      "pr": 340,
      "commit": "18f768e2688eff84d10d320f1a69f2ec24b8ab68",
      "deployment": "dpl_G6eyqjsXu7RQfok5JMDSmBzyGqgs",
      "health": 200,
      "at": "2026-11-03T04:42:28.169Z"
    },
    {
      "event": "merged",
      "pr": 341,
      "head": "f7805939ff91c606fdc7f3132d5fa11497d099ed",
      "merge": "8aee756cc2b48648962425e2efe85bb838f8254d",
      "at": "2026-11-03T04:42:30Z",
      "review": "https://github.com/aibraincoach/my-food-ai/pull/341#pullrequestreview-5747301941"
    },
    {
      "event": "production_ready",
      "pr": 341,
      "commit": "8aee756cc2b48648962425e2efe85bb838f8254d",
      "deployment": "dpl_BFJNiWPCt3FoZwdXqx1mnk8wPJxS",
      "health": 200,
      "at": "2026-11-03T04:43:03.405Z"
    },
    {
      "event": "merged",
      "pr": 342,
      "head": "4c3b827d9d4d73b9328d091d9b8b716b45d1dd1d",
      "merge": "3e4f23b592dcea80b4ad240169eb3fd6bfa064a6",
      "at": "2026-11-03T04:43:06Z",
      "review": "https://github.com/aibraincoach/my-food-ai/pull/342#pullrequestreview-5747290978"
    },
    {
      "event": "production_ready",
      "pr": 342,
      "commit": "3e4f23b592dcea80b4ad240169eb3fd6bfa064a6",
      "deployment": "dpl_3xZSVXVWtNB28nUxckLQ2Q4jRDg4",
      "health": 200,
      "at": "2026-11-03T04:43:40.339Z"
    },
    {
      "event": "merged",
      "pr": 343,
      "head": "e1e922bdbb0bb1d1b807bec733f485e4a43fb600",
      "merge": "6996817cec6aaf865357e9fee6550abf27cdfd0f",
      "at": "2026-11-03T04:52:24Z",
      "review": "https://github.com/aibraincoach/my-food-ai/pull/343#pullrequestreview-5747397043"
    },
    {
      "event": "production_ready",
      "pr": 343,
      "commit": "6996817cec6aaf865357e9fee6550abf27cdfd0f",
      "deployment": "dpl_5MSzBuvUASua8KwcQvjGEdcGJgnV",
      "health": 200,
      "at": "2026-11-03T04:52:51.012Z"
    }
  ],
  "feed_reads": {
    "at": "2026-11-03T05:03:27.508Z",
    "runs": 100,
    "account": 1,
    "postCount": 147,
    "passed": 100,
    "homePassed": 100,
    "firstFailure": null,
    "results": [
      {
        "run": 1,
        "apiMs": 1456.512804,
        "posts": 20,
        "failure": null,
        "homeMs": 799.993383,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 2,
        "apiMs": 2413.876557,
        "posts": 20,
        "failure": null,
        "homeMs": 1383.6479920000002,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 3,
        "apiMs": 1166.638344,
        "posts": 20,
        "failure": null,
        "homeMs": 596.1377479999992,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 4,
        "apiMs": 1437.7693949999993,
        "posts": 20,
        "failure": null,
        "homeMs": 678.3145660000009,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 5,
        "apiMs": 1115.551797,
        "posts": 20,
        "failure": null,
        "homeMs": 589.8271589999986,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 6,
        "apiMs": 1130.8452319999997,
        "posts": 20,
        "failure": null,
        "homeMs": 751.9234109999998,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 7,
        "apiMs": 1320.3522630000007,
        "posts": 20,
        "failure": null,
        "homeMs": 832.9318780000012,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 8,
        "apiMs": 1339.276750000001,
        "posts": 20,
        "failure": null,
        "homeMs": 742.8460840000007,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 9,
        "apiMs": 1333.2895190000017,
        "posts": 20,
        "failure": null,
        "homeMs": 568.9071680000015,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 10,
        "apiMs": 1149.4456019999998,
        "posts": 20,
        "failure": null,
        "homeMs": 609.1520839999976,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 11,
        "apiMs": 1140.312597,
        "posts": 20,
        "failure": null,
        "homeMs": 940.0415319999993,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 12,
        "apiMs": 1621.7082709999995,
        "posts": 20,
        "failure": null,
        "homeMs": 840.0675389999997,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 13,
        "apiMs": 1273.7260400000014,
        "posts": 20,
        "failure": null,
        "homeMs": 920.563729999998,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 14,
        "apiMs": 1015.9334400000007,
        "posts": 20,
        "failure": null,
        "homeMs": 1381.8843659999984,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 15,
        "apiMs": 1939.2190679999985,
        "posts": 20,
        "failure": null,
        "homeMs": 571.8449049999981,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 16,
        "apiMs": 910.3850120000061,
        "posts": 20,
        "failure": null,
        "homeMs": 776.6670509999967,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 17,
        "apiMs": 1006.3775170000008,
        "posts": 20,
        "failure": null,
        "homeMs": 979.8739710000009,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 18,
        "apiMs": 972.682550000005,
        "posts": 20,
        "failure": null,
        "homeMs": 910.8014879999973,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 19,
        "apiMs": 979.280055999996,
        "posts": 20,
        "failure": null,
        "homeMs": 651.9399779999949,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 20,
        "apiMs": 1454.0567840000003,
        "posts": 20,
        "failure": null,
        "homeMs": 912.6314339999954,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 21,
        "apiMs": 958.3115049999979,
        "posts": 20,
        "failure": null,
        "homeMs": 758.869875000004,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 22,
        "apiMs": 1259.4282749999984,
        "posts": 20,
        "failure": null,
        "homeMs": 777.1303679999983,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 23,
        "apiMs": 1149.234924000004,
        "posts": 20,
        "failure": null,
        "homeMs": 566.7983450000029,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 24,
        "apiMs": 1440.472974000004,
        "posts": 20,
        "failure": null,
        "homeMs": 749.7055889999974,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 25,
        "apiMs": 1313.2871599999999,
        "posts": 20,
        "failure": null,
        "homeMs": 662.0712159999966,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 26,
        "apiMs": 1360.3617000000013,
        "posts": 20,
        "failure": null,
        "homeMs": 942.0594759999949,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 27,
        "apiMs": 1149.654840999996,
        "posts": 20,
        "failure": null,
        "homeMs": 614.7126389999976,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 28,
        "apiMs": 1434.1480640000009,
        "posts": 20,
        "failure": null,
        "homeMs": 720.6442640000023,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 29,
        "apiMs": 1414.4422229999982,
        "posts": 20,
        "failure": null,
        "homeMs": 906.1365270000024,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 30,
        "apiMs": 991.1402800000069,
        "posts": 20,
        "failure": null,
        "homeMs": 888.5091479999974,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 31,
        "apiMs": 1156.0442689999982,
        "posts": 20,
        "failure": null,
        "homeMs": 1068.0767790000027,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 32,
        "apiMs": 915.8854879999999,
        "posts": 20,
        "failure": null,
        "homeMs": 839.7667020000081,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 33,
        "apiMs": 1401.0306920000003,
        "posts": 20,
        "failure": null,
        "homeMs": 922.2452359999879,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 34,
        "apiMs": 1200.2445529999968,
        "posts": 20,
        "failure": null,
        "homeMs": 614.3620809999993,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 35,
        "apiMs": 1354.8598639999982,
        "posts": 20,
        "failure": null,
        "homeMs": 853.3638729999948,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 36,
        "apiMs": 943.8040620000102,
        "posts": 20,
        "failure": null,
        "homeMs": 1287.3031699999992,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 37,
        "apiMs": 899.683578000011,
        "posts": 20,
        "failure": null,
        "homeMs": 643.8460829999967,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 38,
        "apiMs": 1381.4369299999962,
        "posts": 20,
        "failure": null,
        "homeMs": 774.7095879999979,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 39,
        "apiMs": 1068.572696000003,
        "posts": 20,
        "failure": null,
        "homeMs": 621.2557049999887,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 40,
        "apiMs": 1083.6695739999996,
        "posts": 20,
        "failure": null,
        "homeMs": 559.2045660000003,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 41,
        "apiMs": 1571.4671959999978,
        "posts": 20,
        "failure": null,
        "homeMs": 1033.4434990000009,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 42,
        "apiMs": 1056.8568300000043,
        "posts": 20,
        "failure": null,
        "homeMs": 774.4600690000079,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 43,
        "apiMs": 1543.047544999994,
        "posts": 20,
        "failure": null,
        "homeMs": 943.9058619999996,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 44,
        "apiMs": 1233.794041000001,
        "posts": 20,
        "failure": null,
        "homeMs": 747.6724459999969,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 45,
        "apiMs": 902.4959950000048,
        "posts": 20,
        "failure": null,
        "homeMs": 747.2767690000037,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 46,
        "apiMs": 1413.411752,
        "posts": 20,
        "failure": null,
        "homeMs": 532.1711849999992,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 47,
        "apiMs": 1449.313982000007,
        "posts": 20,
        "failure": null,
        "homeMs": 814.9824619999999,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 48,
        "apiMs": 1440.3792140000005,
        "posts": 20,
        "failure": null,
        "homeMs": 547.3840620000119,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 49,
        "apiMs": 1388.3231939999969,
        "posts": 20,
        "failure": null,
        "homeMs": 729.7327899999946,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 50,
        "apiMs": 1245.1605100000015,
        "posts": 20,
        "failure": null,
        "homeMs": 554.2196069999918,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 51,
        "apiMs": 1259.633112999989,
        "posts": 20,
        "failure": null,
        "homeMs": 698.2792440000048,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 52,
        "apiMs": 1504.855494000003,
        "posts": 20,
        "failure": null,
        "homeMs": 561.5924669999949,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 53,
        "apiMs": 1189.872596000001,
        "posts": 20,
        "failure": null,
        "homeMs": 586.933382999996,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 54,
        "apiMs": 1317.2488079999894,
        "posts": 20,
        "failure": null,
        "homeMs": 748.1825609999942,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 55,
        "apiMs": 1144.7080009999918,
        "posts": 20,
        "failure": null,
        "homeMs": 603.3176499999972,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 56,
        "apiMs": 1078.7464929999987,
        "posts": 20,
        "failure": null,
        "homeMs": 551.1157519999979,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 57,
        "apiMs": 1214.0372809999972,
        "posts": 20,
        "failure": null,
        "homeMs": 977.6843090000039,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 58,
        "apiMs": 1125.4639559999923,
        "posts": 20,
        "failure": null,
        "homeMs": 528.4202150000056,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 59,
        "apiMs": 1959.0879879999993,
        "posts": 20,
        "failure": null,
        "homeMs": 633.836724000008,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 60,
        "apiMs": 1003.4289410000056,
        "posts": 20,
        "failure": null,
        "homeMs": 810.1789010000066,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 61,
        "apiMs": 897.8703529999912,
        "posts": 20,
        "failure": null,
        "homeMs": 728.4418399999995,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 62,
        "apiMs": 1395.7176150000014,
        "posts": 20,
        "failure": null,
        "homeMs": 1029.0806140000059,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 63,
        "apiMs": 1544.0206580000086,
        "posts": 20,
        "failure": null,
        "homeMs": 529.760684000008,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 64,
        "apiMs": 1249.215956999993,
        "posts": 20,
        "failure": null,
        "homeMs": 629.9213960000052,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 65,
        "apiMs": 1057.9016610000108,
        "posts": 20,
        "failure": null,
        "homeMs": 601.1294280000147,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 66,
        "apiMs": 1072.3887849999883,
        "posts": 20,
        "failure": null,
        "homeMs": 541.638707999984,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 67,
        "apiMs": 857.5680780000112,
        "posts": 20,
        "failure": null,
        "homeMs": 1395.664454999991,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 68,
        "apiMs": 887.3048389999894,
        "posts": 20,
        "failure": null,
        "homeMs": 735.117946000013,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 69,
        "apiMs": 1166.5255450000113,
        "posts": 20,
        "failure": null,
        "homeMs": 749.8035080000118,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 70,
        "apiMs": 1113.6460110000044,
        "posts": 20,
        "failure": null,
        "homeMs": 709.3085950000095,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 71,
        "apiMs": 1103.8416509999952,
        "posts": 20,
        "failure": null,
        "homeMs": 636.1880249999813,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 72,
        "apiMs": 1123.2346539999999,
        "posts": 20,
        "failure": null,
        "homeMs": 650.7183479999949,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 73,
        "apiMs": 1207.102377000003,
        "posts": 20,
        "failure": null,
        "homeMs": 723.9848760000023,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 74,
        "apiMs": 1204.8529160000035,
        "posts": 20,
        "failure": null,
        "homeMs": 617.8260130000126,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 75,
        "apiMs": 1461.4838840000157,
        "posts": 20,
        "failure": null,
        "homeMs": 762.1686880000052,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 76,
        "apiMs": 1090.928035000019,
        "posts": 20,
        "failure": null,
        "homeMs": 532.4984619999886,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 77,
        "apiMs": 1018.718257999979,
        "posts": 20,
        "failure": null,
        "homeMs": 613.2958500000241,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 78,
        "apiMs": 1102.5544610000215,
        "posts": 20,
        "failure": null,
        "homeMs": 535.5926369999943,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 79,
        "apiMs": 1376.270411000005,
        "posts": 20,
        "failure": null,
        "homeMs": 633.2102899999882,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 80,
        "apiMs": 1426.3096070000029,
        "posts": 20,
        "failure": null,
        "homeMs": 649.834354999999,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 81,
        "apiMs": 1431.7312839999795,
        "posts": 20,
        "failure": null,
        "homeMs": 771.5117730000056,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 82,
        "apiMs": 1048.710735999979,
        "posts": 20,
        "failure": null,
        "homeMs": 509.6851659999811,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 83,
        "apiMs": 1313.5563580000016,
        "posts": 20,
        "failure": null,
        "homeMs": 501.6661909999966,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 84,
        "apiMs": 1000.3952049999789,
        "posts": 20,
        "failure": null,
        "homeMs": 559.5994840000058,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 85,
        "apiMs": 1275.3983850000077,
        "posts": 20,
        "failure": null,
        "homeMs": 598.9054870000109,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 86,
        "apiMs": 1096.0796740000078,
        "posts": 20,
        "failure": null,
        "homeMs": 872.5760369999916,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 87,
        "apiMs": 1677.8233379999874,
        "posts": 20,
        "failure": null,
        "homeMs": 844.9857400000037,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 88,
        "apiMs": 1242.0376150000084,
        "posts": 20,
        "failure": null,
        "homeMs": 635.2956319999939,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 89,
        "apiMs": 1073.1857380000001,
        "posts": 20,
        "failure": null,
        "homeMs": 885.5612919999985,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 90,
        "apiMs": 883.413189999992,
        "posts": 20,
        "failure": null,
        "homeMs": 918.7635449999943,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 91,
        "apiMs": 1014.7230500000005,
        "posts": 20,
        "failure": null,
        "homeMs": 830.6168960000214,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 92,
        "apiMs": 862.5305980000121,
        "posts": 20,
        "failure": null,
        "homeMs": 619.488559999998,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 93,
        "apiMs": 1254.3011959999858,
        "posts": 20,
        "failure": null,
        "homeMs": 597.4084179999772,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 94,
        "apiMs": 1163.1128929999832,
        "posts": 20,
        "failure": null,
        "homeMs": 619.5847590000194,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 95,
        "apiMs": 1890.4049020000093,
        "posts": 20,
        "failure": null,
        "homeMs": 545.4493969999894,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 96,
        "apiMs": 846.0239719999954,
        "posts": 20,
        "failure": null,
        "homeMs": 929.9815740000049,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 97,
        "apiMs": 1278.1180440000026,
        "posts": 20,
        "failure": null,
        "homeMs": 615.7109500000079,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 98,
        "apiMs": 1226.1175839999923,
        "posts": 20,
        "failure": null,
        "homeMs": 629.9487549999903,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 99,
        "apiMs": 942.4769929999893,
        "posts": 20,
        "failure": null,
        "homeMs": 715.9866209999891,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      },
      {
        "run": 100,
        "apiMs": 1006.4380370000144,
        "posts": 20,
        "failure": null,
        "homeMs": 961.7196380000096,
        "homeStatus": 200,
        "digest": false,
        "homeError": null
      }
    ]
  },
  "browser_openings": {
    "at": "2026-11-03T05:03:31.967Z",
    "account": 1,
    "profile": "Chromium1148 390x844 Asia/Jakarta unthrottled; clear HTTP cache before first, retain thereafter; full navigation plus1s settle",
    "runs": 100,
    "passed": 100,
    "rows": [
      {
        "opening": 1,
        "status": 200,
        "firstCardMs": 1084,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 2,
        "status": 200,
        "firstCardMs": 1600,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 3,
        "status": 200,
        "firstCardMs": 1034.1,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 4,
        "status": 200,
        "firstCardMs": 972,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 5,
        "status": 200,
        "firstCardMs": 827.6,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 6,
        "status": 200,
        "firstCardMs": 1196.3,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 7,
        "status": 200,
        "firstCardMs": 817,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 8,
        "status": 200,
        "firstCardMs": 861.8,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 9,
        "status": 200,
        "firstCardMs": 1225.2,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 10,
        "status": 200,
        "firstCardMs": 791.4,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 11,
        "status": 200,
        "firstCardMs": 861.8,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 12,
        "status": 200,
        "firstCardMs": 813.2,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 13,
        "status": 200,
        "firstCardMs": 951.1,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 14,
        "status": 200,
        "firstCardMs": 928.8,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 15,
        "status": 200,
        "firstCardMs": 850.8,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 16,
        "status": 200,
        "firstCardMs": 1610.1,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 17,
        "status": 200,
        "firstCardMs": 1026.6,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 18,
        "status": 200,
        "firstCardMs": 967.8,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 19,
        "status": 200,
        "firstCardMs": 959.9,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 20,
        "status": 200,
        "firstCardMs": 775.1,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 21,
        "status": 200,
        "firstCardMs": 1019.3,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 22,
        "status": 200,
        "firstCardMs": 1087.9,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 23,
        "status": 200,
        "firstCardMs": 1327.4,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 24,
        "status": 200,
        "firstCardMs": 1094.8,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 25,
        "status": 200,
        "firstCardMs": 990.9,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 26,
        "status": 200,
        "firstCardMs": 759.7,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 27,
        "status": 200,
        "firstCardMs": 1173.4,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 28,
        "status": 200,
        "firstCardMs": 847.5,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 29,
        "status": 200,
        "firstCardMs": 819.6,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 30,
        "status": 200,
        "firstCardMs": 886.3,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 31,
        "status": 200,
        "firstCardMs": 825.2,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 32,
        "status": 200,
        "firstCardMs": 1041.3,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 33,
        "status": 200,
        "firstCardMs": 805.9,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 34,
        "status": 200,
        "firstCardMs": 926.4,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 35,
        "status": 200,
        "firstCardMs": 1287.9,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 36,
        "status": 200,
        "firstCardMs": 1385.2,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 37,
        "status": 200,
        "firstCardMs": 1297.3,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 38,
        "status": 200,
        "firstCardMs": 814.1,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 39,
        "status": 200,
        "firstCardMs": 1199.8,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 40,
        "status": 200,
        "firstCardMs": 855.8,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 41,
        "status": 200,
        "firstCardMs": 765.1,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 42,
        "status": 200,
        "firstCardMs": 1097.6,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 43,
        "status": 200,
        "firstCardMs": 1238,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 44,
        "status": 200,
        "firstCardMs": 1222.8,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 45,
        "status": 200,
        "firstCardMs": 806.2,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 46,
        "status": 200,
        "firstCardMs": 1355,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 47,
        "status": 200,
        "firstCardMs": 1165.4,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 48,
        "status": 200,
        "firstCardMs": 1494.9,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 49,
        "status": 200,
        "firstCardMs": 823.6,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 50,
        "status": 200,
        "firstCardMs": 986.6,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 51,
        "status": 200,
        "firstCardMs": 797.4,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 52,
        "status": 200,
        "firstCardMs": 1189,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 53,
        "status": 200,
        "firstCardMs": 840.4,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 54,
        "status": 200,
        "firstCardMs": 846.4,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 55,
        "status": 200,
        "firstCardMs": 777,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 56,
        "status": 200,
        "firstCardMs": 762.4,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 57,
        "status": 200,
        "firstCardMs": 837.2,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 58,
        "status": 200,
        "firstCardMs": 904.9,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 59,
        "status": 200,
        "firstCardMs": 1646.7,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 60,
        "status": 200,
        "firstCardMs": 1218.5,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 61,
        "status": 200,
        "firstCardMs": 856.5,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 62,
        "status": 200,
        "firstCardMs": 752.9,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 63,
        "status": 200,
        "firstCardMs": 1175.5,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 64,
        "status": 200,
        "firstCardMs": 839.4,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 65,
        "status": 200,
        "firstCardMs": 782.4,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 66,
        "status": 200,
        "firstCardMs": 835,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 67,
        "status": 200,
        "firstCardMs": 1300.3,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 68,
        "status": 200,
        "firstCardMs": 1125.7,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 69,
        "status": 200,
        "firstCardMs": 857.5,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 70,
        "status": 200,
        "firstCardMs": 798.4,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 71,
        "status": 200,
        "firstCardMs": 773.2,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 72,
        "status": 200,
        "firstCardMs": 756,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 73,
        "status": 200,
        "firstCardMs": 1136.6,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 74,
        "status": 200,
        "firstCardMs": 762,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 75,
        "status": 200,
        "firstCardMs": 1039.6,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 76,
        "status": 200,
        "firstCardMs": 798.2,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 77,
        "status": 200,
        "firstCardMs": 820.3,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 78,
        "status": 200,
        "firstCardMs": 793.6,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 79,
        "status": 200,
        "firstCardMs": 886.5,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 80,
        "status": 200,
        "firstCardMs": 861,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 81,
        "status": 200,
        "firstCardMs": 1191.7,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 82,
        "status": 200,
        "firstCardMs": 816.7,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 83,
        "status": 200,
        "firstCardMs": 842.1,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 84,
        "status": 200,
        "firstCardMs": 978.6,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 85,
        "status": 200,
        "firstCardMs": 810.8,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 86,
        "status": 200,
        "firstCardMs": 1573.2,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 87,
        "status": 200,
        "firstCardMs": 1225.4,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 88,
        "status": 200,
        "firstCardMs": 1129.7,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 89,
        "status": 200,
        "firstCardMs": 944,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 90,
        "status": 200,
        "firstCardMs": 796.6,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 91,
        "status": 200,
        "firstCardMs": 1224.7,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 92,
        "status": 200,
        "firstCardMs": 1087.9,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 93,
        "status": 200,
        "firstCardMs": 1787.9,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 94,
        "status": 200,
        "firstCardMs": 782.4,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 95,
        "status": 200,
        "firstCardMs": 824.9,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 96,
        "status": 200,
        "firstCardMs": 1134.1,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 97,
        "status": 200,
        "firstCardMs": 755.7,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 98,
        "status": 200,
        "firstCardMs": 980.8,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 99,
        "status": 200,
        "firstCardMs": 757.9,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      },
      {
        "opening": 100,
        "status": 200,
        "firstCardMs": 764.7,
        "cards": 6,
        "digest": false,
        "pageErrors": 0,
        "signInRedirect": false,
        "passed": true
      }
    ]
  },
  "photo_observations": {
    "conditions": {
      "viewport": "390x844",
      "down": 1600000,
      "up": 750000,
      "latency": 150,
      "tick": "blocked",
      "nonRead": "blocked except storage URL signing",
      "settleAfterPhotoMs": 12000
    },
    "rows": [
      {
        "pair": 1,
        "mode": "cold",
        "status": 200,
        "card": 1573.3999996185303,
        "photo": {
          "ms": 1828.2999997138977,
          "naturalWidth": 512,
          "kind": "private-feed-route",
          "top": 239.390625
        },
        "bytes": {
          "supabase": 138965,
          "feed-photo": 16859,
          "app": 420224
        },
        "cards": 4
      },
      {
        "pair": 1,
        "mode": "warm",
        "status": 200,
        "card": 496.30000019073486,
        "photo": {
          "ms": 496.30000019073486,
          "naturalWidth": 512,
          "kind": "private-feed-route",
          "top": 239.390625
        },
        "bytes": {
          "supabase": 28950,
          "feed-photo": 0,
          "app": 17227
        },
        "cards": 4
      },
      {
        "pair": 2,
        "mode": "cold",
        "status": 200,
        "card": 1160.5999999046326,
        "photo": {
          "ms": 1590.7999997138977,
          "naturalWidth": 512,
          "kind": "private-feed-route",
          "top": 239.390625
        },
        "bytes": {
          "supabase": 27837,
          "feed-photo": 16835,
          "app": 412867
        },
        "cards": 4
      },
      {
        "pair": 2,
        "mode": "warm",
        "status": 200,
        "card": 493.09999990463257,
        "photo": {
          "ms": 493.09999990463257,
          "naturalWidth": 512,
          "kind": "private-feed-route",
          "top": 239.390625
        },
        "bytes": {
          "supabase": 28973,
          "feed-photo": 0,
          "app": 20514
        },
        "cards": 4
      },
      {
        "pair": 3,
        "mode": "cold",
        "status": 200,
        "card": 1474.8000001907349,
        "photo": {
          "ms": 1487,
          "naturalWidth": 512,
          "kind": "private-feed-route",
          "top": 239.390625
        },
        "bytes": {
          "supabase": 139015,
          "feed-photo": 16835,
          "app": 413477
        },
        "cards": 4
      },
      {
        "pair": 3,
        "mode": "warm",
        "status": 200,
        "card": 481.2999997138977,
        "photo": {
          "ms": 481.5,
          "naturalWidth": 512,
          "kind": "private-feed-route",
          "top": 239.390625
        },
        "bytes": {
          "supabase": 28958,
          "feed-photo": 0,
          "app": 20612
        },
        "cards": 4
      },
      {
        "pair": 4,
        "mode": "cold",
        "status": 200,
        "card": 1391.3000001907349,
        "photo": {
          "ms": 1501.7000002861023,
          "naturalWidth": 512,
          "kind": "private-feed-route",
          "top": 239.390625
        },
        "bytes": {
          "supabase": 27823,
          "feed-photo": 16835,
          "app": 420035
        },
        "cards": 4
      },
      {
        "pair": 4,
        "mode": "warm",
        "status": 200,
        "card": 507,
        "photo": {
          "ms": 507,
          "naturalWidth": 512,
          "kind": "private-feed-route",
          "top": 239.390625
        },
        "bytes": {
          "supabase": 28966,
          "feed-photo": 0,
          "app": 23820
        },
        "cards": 4
      },
      {
        "pair": 5,
        "mode": "cold",
        "status": 200,
        "card": 1402.3000001907349,
        "photo": {
          "ms": 1480.1999998092651,
          "naturalWidth": 512,
          "kind": "private-feed-route",
          "top": 239.390625
        },
        "bytes": {
          "supabase": 27867,
          "feed-photo": 16835,
          "app": 419499
        },
        "cards": 4
      },
      {
        "pair": 5,
        "mode": "warm",
        "status": 200,
        "card": 490.40000009536743,
        "photo": {
          "ms": 490.5,
          "naturalWidth": 512,
          "kind": "private-feed-route",
          "top": 239.390625
        },
        "bytes": {
          "supabase": 28982,
          "feed-photo": 0,
          "app": 17266
        },
        "cards": 4
      }
    ]
  },
  "tick_preview": [
    {
      "label": "preview",
      "run": 1,
      "gapMs": 1000,
      "measurement": "rapid repeated calls",
      "at": "2026-11-03T04:37:03.720Z",
      "status": 200,
      "headersMs": 723.6,
      "totalMs": 729.3,
      "queued": 2,
      "running": 0,
      "traffic": "low"
    },
    {
      "label": "preview",
      "run": 2,
      "gapMs": 1000,
      "measurement": "rapid repeated calls",
      "at": "2026-11-03T04:37:05.452Z",
      "status": 200,
      "headersMs": 337.7,
      "totalMs": 339.9,
      "queued": 2,
      "running": 0,
      "traffic": "low"
    },
    {
      "label": "preview",
      "run": 3,
      "gapMs": 1000,
      "measurement": "rapid repeated calls",
      "at": "2026-11-03T04:37:06.793Z",
      "status": 200,
      "headersMs": 205.3,
      "totalMs": 207.2,
      "queued": 2,
      "running": 0,
      "traffic": "low"
    },
    {
      "label": "preview",
      "run": 4,
      "gapMs": 1000,
      "measurement": "rapid repeated calls",
      "at": "2026-11-03T04:37:08.001Z",
      "status": 200,
      "headersMs": 250.3,
      "totalMs": 251.6,
      "queued": 2,
      "running": 0,
      "traffic": "low"
    },
    {
      "label": "preview",
      "run": 5,
      "gapMs": 1000,
      "measurement": "rapid repeated calls",
      "at": "2026-11-03T04:37:09.253Z",
      "status": 200,
      "headersMs": 208.1,
      "totalMs": 210.3,
      "queued": 2,
      "running": 0,
      "traffic": "low"
    },
    {
      "label": "preview",
      "run": 6,
      "gapMs": 1000,
      "measurement": "rapid repeated calls",
      "at": "2026-11-03T04:37:10.465Z",
      "status": 200,
      "headersMs": 151.5,
      "totalMs": 153.6,
      "queued": 2,
      "running": 0,
      "traffic": "low"
    }
  ],
  "tick_production": [
    {
      "label": "production",
      "run": 1,
      "gapMs": 1000,
      "measurement": "rapid repeated calls",
      "at": "2026-11-03T05:00:11.027Z",
      "status": 200,
      "headersMs": 316.4,
      "totalMs": 322.5,
      "queued": 0,
      "running": 0,
      "traffic": "low"
    },
    {
      "label": "production",
      "run": 2,
      "gapMs": 1000,
      "measurement": "rapid repeated calls",
      "at": "2026-11-03T05:00:12.355Z",
      "status": 200,
      "headersMs": 192.8,
      "totalMs": 195.1,
      "queued": 0,
      "running": 0,
      "traffic": "low"
    },
    {
      "label": "production",
      "run": 3,
      "gapMs": 1000,
      "measurement": "rapid repeated calls",
      "at": "2026-11-03T05:00:13.551Z",
      "status": 200,
      "headersMs": 280.8,
      "totalMs": 282.8,
      "queued": 0,
      "running": 0,
      "traffic": "low"
    },
    {
      "label": "production",
      "run": 4,
      "gapMs": 1000,
      "measurement": "rapid repeated calls",
      "at": "2026-11-03T05:00:14.835Z",
      "status": 200,
      "headersMs": 107.1,
      "totalMs": 109.5,
      "queued": 0,
      "running": 0,
      "traffic": "low"
    },
    {
      "label": "production",
      "run": 5,
      "gapMs": 1000,
      "measurement": "rapid repeated calls",
      "at": "2026-11-03T05:00:15.946Z",
      "status": 200,
      "headersMs": 124.9,
      "totalMs": 126.9,
      "queued": 0,
      "running": 0,
      "traffic": "low"
    },
    {
      "label": "production",
      "run": 6,
      "gapMs": 1000,
      "measurement": "rapid repeated calls",
      "at": "2026-11-03T05:00:17.075Z",
      "status": 200,
      "headersMs": 174.9,
      "totalMs": 176.2,
      "queued": 0,
      "running": 0,
      "traffic": "low"
    }
  ],
  "auth_hammer": {
    "summary": {
      "signups": {
        "request": 31,
        "status": 429,
        "code": "over_request_rate_limit"
      },
      "signins": {
        "request": 32,
        "status": 429,
        "code": "over_request_rate_limit"
      }
    },
    "cleanup": {
      "created": 31,
      "deleted": 31,
      "failures": 0
    }
  },
  "final_environment": {
    "at": "2026-11-03T05:05:37.588Z",
    "production": {
      "state": "READY",
      "sha": "6996817cec6aaf865357e9fee6550abf27cdfd0f",
      "deployment": "dpl_5MSzBuvUASua8KwcQvjGEdcGJgnV",
      "healthStatus": 200,
      "database": {
        "ok": true,
        "ms": 463
      },
      "model": {
        "ok": true,
        "ms": 669
      }
    },
    "hcaptchaVariableTargets": [
      "preview"
    ],
    "auth": {
      "captchaEnabled": false,
      "captchaProvider": "hcaptcha",
      "secretPresent": true,
      "autoConfirm": true,
      "beforeUserHook": false
    }
  },
  "invalid_upload_production": {
    "at": "2026-11-03T05:03:10.116Z",
    "results": [
      {
        "case": "negative-position",
        "status": 400,
        "validationMessage": true
      },
      {
        "case": "large-position",
        "status": 400,
        "validationMessage": true
      },
      {
        "case": "zero-width",
        "status": 400,
        "validationMessage": true
      },
      {
        "case": "duplicate-position",
        "status": 400,
        "validationMessage": true
      }
    ]
  }
}
```
