# Video reference implementation

The supplied 4:04 recording and screenshot guide informed this update. The recording does not supply a source asset pack, exact catalog/pricing, payment integration, custom editor rules or camera effects.

## Implemented

- 222 catalog entries across Activity, Classic, Flying, Surprise Gift, Relationship, Ultra Star, Fame, Privilege, Filters and Parcel. Existing Rose/Heart/Crown/Rocket IDs and prices remain compatible.
- Dark four-column gift drawer, recipient chips, horizontal category tabs, search, price sorting, selectable cards, quantity presets, total price and fixed warm-gold action footer. Room shows the first eight seats while the drawer is open.
- Quantity-aware, idempotent server transactions, balance updates, gift notifications, room animation and global broadcasts for transactions above 60,000 test coins.
- Ultra Star/Fame editor: label, message and color, saved per user and included in gift events. Save does not spend money; Send does.
- Server-validated level-41 Privilege eligibility.
- Parcel ownership, quantity, 30-day sample expiry, expired-item rejection and idempotent inventory decrement. Demo accounts can claim five sample Likes once. Regular accounts cannot claim demo inventory.
- White in-room profile sheet with gift wall, earned medals, follow, full profile, Send Gift, own-seat leave and microphone actions.
- Twelve-seat rooms, migration of saved eight-seat rooms, default Oasis teal theme for new rooms, plus icons, take/switch, permissioned lock/unlock, mute/removal controls and seat invitations with accept/decline. Existing saved themes are preserved.
- First-use gift-broadcast explainer and recharge availability/region/agreement/retry UI. Real recharge remains unavailable; the test wallet uses existing demo-credit limits.
- Two-column Live discovery with Follow/Live/Party navigation, Recommend/Megastar/Talent/NewStar filters, audio-room labels and active-room restore widget. Megastar sorts host level, Talent filters Music/Gaming, NewStar sorts ascending host level.
- In-room Star Tasks/Live Data panel: manual friend invite through the platform share UI, claimable daily tasks, today's sent/received gift value and live membership/seat counts. Room gift daily totals use Asia/Kolkata. Existing games, moderation and voice integrations remain in place.

## Deliberate limits

Gift artwork now uses a local illustration collection: editable SVG sources and optimized transparent PNGs for all 222 catalog entries. Shapes use satin pink, ivory, blue glass and brushed gold; there are no emoji glyphs in the gift renderer. Related gifts share illustration families, with dedicated compositions for specific subjects. These are original app assets, not extracted production Ola artwork. Test-coin prices are configured in `apps/api/src/gifts.ts`; they are not asserted to match the recording. Some truncated gift names were expanded into descriptive names. Numeric custom gift IDs from the video are replaced with usable design templates.

Gift delivery uses a restrained illustrated celebration card, with a short fade and float and a reduced-motion alternative. Filters are room gift effects, not face tracking or camera overlays. Surprise items send fixed-price collectible gifts; there is no invented chance-based prize pool or chest reward system. Exact source animations, original sounds and premium asset packs still need source files. Real payments and live voice require their service credentials; native device behavior is not established by web checks.

## Run and verify

Use Node 24.15+ and `npm run setup`. Enable `ENABLE_DEMO=true` for local guest access, then run `npm run dev` (API 4000, mobile web 8081, admin 5173). For a physical phone, set `EXPO_PUBLIC_API_URL` to the reachable API host.

Checks: `npm run check`, `npm test`, `npm run build`. The gift integration test verifies category coverage, unique IDs, level gating, custom designs, parcel access/expiry/idempotency, gift wall, seat bounds, invitation permissions, migration and persistence. Existing account, game, moderation and wallet tests also run.

Browser smoke: guest sign-in, join room, open drawer, choose Flower Envelope x5, send, verify balance drops from 500 to 450; open Ultra Star personalization; inspect profile and Parcel inventory. No real payments are taken.

## Gift design system

The drawer uses deep plum surfaces, warm gold selection/action accents, compact avatar recipient chips, consistent four-column cards, tabular prices, a selected-gift summary and an anchored footer. The room seat grid compacts while the drawer is open. Search clears when changing categories. Personalization uses named fields and four accessible finish swatches; each finish has a local rendered asset and follows the gift into its celebration.

Sources: `scripts/build-gift-art.mjs`, `apps/mobile/assets/gifts/`, `apps/mobile/giftAssets.ts`, `apps/mobile/GiftDrawer.tsx`, and `apps/mobile/GiftCelebration.tsx`. The SVG files are editable source; PNGs allow the same illustration to render on native and web without an SVG runtime dependency.

To rebuild artwork, use Node 24+ with the `sharp` package available and run `node scripts/build-gift-art.mjs`. If sharp is supplied by another installation, set `GIFT_SHARP_MODULE` to its absolute package path. Rebuilding writes only changed files and makes no network calls. No image-generation service is used.
