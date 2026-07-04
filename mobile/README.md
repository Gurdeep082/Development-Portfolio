# Gurdeep Portfolio Mobile

React Native app for the public portfolio and protected admin dashboard.

## Configure the API

Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to the deployed
Express server URL. For a physical phone during local development, use the
computer's LAN address, for example `http://192.168.1.20:5000`.

The API URL can also be changed from the Admin login screen.

## Run

```bash
npm start
```

## Build an installable Android APK

```bash
npx eas-cli login
npm run build:apk
```

The `preview` EAS profile produces an APK that can be installed directly.
Production Android and iOS builds use the `build:android` and `build:ios`
scripts.
