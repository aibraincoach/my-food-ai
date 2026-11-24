# Capture error display codes

The 26 known route/helper errors below retain their exact existing English. The server boundary attaches a stable message_code without changing error text, status or operational code. Eight existing reviewed keys are reused; 18 PM Japanese drafts received a second model reading, including the leftovers terminology correction.

| Display code | Exact English |
| --- | --- |
| route_b57f3ec3ba46 | Drink operation not found. |
| route_56080fee81fd | Drinks could not be checked. You can still post the photo. |
| route_e431cb5e4a79 | Photo draft not found. |
| route_df3e655d054f | Signing upload URLs failed. |
| route_90f611283783 | That food could not be logged. |
| route_68e3d124f8a5 | The drink operation could not be confirmed. Your selection is kept. |
| route_07c3267907ee | The drinks could not be posted. Your photo was kept. |
| route_35d40f66fffa | The meal could not be logged. |
| error_0795a0b4a0a6 | The meal could not be saved. |
| route_55f1bddd8582 | The pack photo or portion could not be saved. |
| route_24ead72d486b | The pending copy could not be removed. |
| route_f9138625bc22 | The photo could not be attached. |
| route_1841fc578710 | The photo could not be unmarked. |
| route_e1c684489cf3 | The photo upload could not be completed. Your draft was kept; try again. |
| route_7b5714a8578a | The saved drink could not be confirmed. Your selection is kept. |
| uploadExpired | The upload draft expired. Your photos were kept; try again. |
| route_26d8c2e230c5 | This drink intent changed. |
| route_10c2e5d8b96a | This drink post was removed. |
| route_73da0d100358 | This drink selection changed. Start a new drink post. |
| route_cd303598164e | This pending drink was removed. |
| route_9837648cf759 | This photo has already been checked. |
| route_1108dcdbb205 | This photo is being checked. |
| transcriptionFailed | Transcription could not be completed. |
| route_ac137d59993d | Transcription is busy. Please try again. |
| route_e3e80626edf3 | Wait for this meal to be ready. |
| route_e4b3b1ea79cb | You have made a lot of requests this hour. Try again later. |

The finite server boundary table matches known app error sentences emitted by the existing helpers. It does not parse user/model stored text. Every other runtime database/provider detail receives unknownFailure: “Something went wrong. Try again.” / 「問題が発生しました。もう一度お試しください。」. The client never stores the raw sentence. This neutral line also replaces the previous false-cause wording for migrated legacy draft messages. Actual transport failures retain their existing network/size wording.
