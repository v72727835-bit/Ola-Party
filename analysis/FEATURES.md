# Feature coverage and remaining work

Reference parity is **unverified for all rows** until the actual reference app's screens and flows can be observed. Listed implementations are Party App design choices, not recovered backend rules.

| Area | Party App implementation | Remaining boundary |
| --- | --- | --- |
| Account | Email/password registration and login, expiring bearer sessions, logout | SMS OTP, Google/Apple/social identity providers, account recovery, account deletion/export |
| Profile | Edit profile, follow/unfollow, block/unblock, report | Media upload pipeline, discovery/privacy verification with reference |
| Rooms | Search/filter, create/join/leave, eight seats, owner seat locks/mute/kick, room password | Cross-device/native validation; original room modes and capacity rules |
| Voice | LiveKit token authorization, seat-dependent publish grants, revoke on leave/moderation; local server setup | Native SDK/build validation, real microphone and two-person media testing, hosted TLS/TURN |
| Chat | Persisted room messages and DMs, authenticated Socket.IO events | Push notifications, read receipts, attachments, moderation at scale |
| Gifts and wallet | Gift catalog, server-priced coin deduction/diamond ledger, idempotency, demo credits and daily tasks | Store-verified billing, payment refunds, withdrawal/KYC rules, financial reconciliation |
| Community | Posts/likes/comments, families/join, event RSVP, rankings | Complete family/agency roles, event management, fan-club rules and original screens |
| Games and PK | Original server-authoritative tic-tac-toe and timed room PK scoring | Original game catalog/rules/assets, media PK, matchmaker and production fairness |
| VIP and store | Browsable catalog with unavailable-purchase explanation | Entitlements, checkout, receipt validation, renewal and avatar decoration engine |
| Admin | Stats, rooms, users disable/restore, reports resolve/dismiss, ledger | Production bootstrap admin, audit trails, granular operator roles |
| Infrastructure | Local single-process Node/TypeScript API with atomic JSON snapshots | Transactional production DB/migrations, backups, horizontal scaling, Redis/pubsub, monitoring, abuse controls |
| Android/iOS | Expo React Native TypeScript source plus web preview | Signed native build, device tests, store listing/signing, foreground/background audio permissions |
| Other original functions | Candidate package names are retained in inventory | Music sharing/licensing, karaoke, video/live streaming, effects, agencies, original promotions/region flags require further evidence and implementation |

No real recharge, withdrawal, subscription, voice call, APK release, production deployment or complete reference parity should be described as verified unless a later test report explicitly establishes it.
