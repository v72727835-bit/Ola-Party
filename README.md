# Party App

React Native (Expo) social voice rooms app with a TypeScript Node backend.

## Download the latest Android APK

Scan this QR code with your phone, or open the link below. It always points to the newest build.

<img src="docs/apk-download-qr.png" alt="QR code to download the latest Party App APK" width="220">

**[Download party-app.apk](https://github.com/v72727835-bit/Ola-Party/releases/download/latest-apk/party-app.apk)**

The APK is built automatically by GitHub Actions (`.github/workflows/android-apk.yml`) on every push to `main` that changes `apps/mobile`, and can also be started by hand from the Actions tab ("Android APK" → "Run workflow"). When installing, Android may ask you to allow installs from your browser ("Install unknown apps").

## Project layout

- `apps/mobile`: Expo app (Party App)
- `apps/api`: Express + Socket.IO API
- `apps/admin`: admin console (React + Vite)

## Commands

```bash
npm run setup   # install all apps
npm run dev     # run api, mobile and admin
npm run check   # type checks
npm test        # api tests
```
