// lib/config.ts
//
// Where the Circle backend lives.
//
// Set it in a .env file at the root of the music app (restart Metro with
// `npx expo start -c` after changing it):
//
//   EXPO_PUBLIC_CIRCLE_API_URL=http://192.168.1.50:5000
//
// Use your PC's LAN IPv4 address (run `ipconfig` in PowerShell), NOT
// localhost: on a phone, "localhost" means the phone itself.
//
// When you move to production this is the only line that changes,
// e.g. https://circlenet.social

const raw = process.env.EXPO_PUBLIC_CIRCLE_API_URL ?? 'http://localhost:5000';

export const CIRCLE_API_URL = raw.replace(/\/+$/, '');