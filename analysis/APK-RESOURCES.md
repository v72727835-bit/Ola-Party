# Ola Party 5.54.0 — resource decode findings

Method: JADX 1.5.1 resource decode (`--no-src`) of `com.live.party.apk` from the supplied XAPK. No source decompilation, no runtime, no network. Layout and string names indicate which UI areas exist; they do NOT prove behaviour, rules, prices or regional availability. Party App stays an independent implementation: no code, images or branding were copied.

## Package facts
- Package `com.live.party`, v5.54.0 (3585), minSdk 23, targetSdk 35, 14 store locales (incl. hi, ar, es, id, ja, ko, ms, pt, ru, th, tr, ur, vi).
- Single launcher activity `com.yy.hiyo.MainActivity`; the app is a YY "hiyo" framework with screens built mostly in code. 3,950 layout files, 8,203 strings.
- Permissions point to: microphone + foreground microphone service, camera, contacts, location, calendar, media read, notifications, overlay (float window), Google Play Billing, several vendor push channels (Huawei, Xiaomi, Oppo).
- Login/identity SDK hints: Facebook, Google, Zalo.

## UI areas by layout count (indicative)
| Area | Layouts | Party App status |
| --- | --- | --- |
| Games (many room games, chess, among-us style seats) | 442 | only tic-tac-toe |
| Chat / DM / sessions | 370 | text DM + room chat |
| Discover / search / recommend | 223 | basic room search |
| Voice room / channel | 159 | implemented |
| Seats / mic queue / "pick me" | 150 | 8 seats, no mic queue |
| PK / battle | 130 | gift-score PK |
| Profile | 125 | basic |
| Gifts | 122 | catalog + send |
| Social feed (BBS/square) | 114 | basic posts |
| Family / agency | 102 | basic families |
| Wallet / recharge / VIP | 90 | demo wallet, VIP catalog |
| Themes / decorations / entrance / badges | 81 | none |
| Login / account security | 75 | email/password only |
| Ranking | 67 | weekly ranking |
| Tasks / check-in / lucky bag | 22 | daily reward |

## Tabs/labels seen in strings
Home areas: Party, Live, Chat, Games, Family, Square, Following, Explore, Mine, Rank, Messages.

## Visual notes (reference only)
Reference primary colors are bright green `#86ff3e` and yellow `#ffdd00`. Party App keeps its own purple identity on purpose.

## Gaps this suggests for Party App (priority order)
1. Mic queue / "pick me" flow and seat requests.
2. Entrance effects, avatar frames, badges (decorations engine).
3. More room games beyond tic-tac-toe.
4. Social login (Google) and phone OTP.
5. Lucky bag / family activities, richer tasks.
6. Home tabs split: Party / Live / Games / Family / Square.

Not established: exact UI, flows, prices, game rules, backend protocol (`lpf_*.proto` files exist in the APK but were not analysed).
