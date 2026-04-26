# Tehreer — Agent Instructions

> Read this file **before** making any changes to this codebase.
> For the full implementation plan, see the persistent artifact in the Antigravity brain store (conversation `1ce6f0e6-4f0a-4828-bbcc-e240b75d0db3`).

---

## What is Tehreer?

**Tehreer** (تحریر) is a mobile PDF reading app for Urdu readers. Users can:

1. Read PDFs — no login required
2. Tap a word or select a phrase/sentence/paragraph → get its contextual Urdu meaning — no login required
3. Summarise from page 1 to page X — no login required
4. Personal dictionary — save words and their meanings; **login required only for this**
5. User authentication — optional; sign-in is prompted only when the user tries to save a word

This repo is the **frontend only** (React Native / Expo). The backend is a separate service maintained independently. All LLM inference, PDF text extraction, and user data storage happen on the server. Agents must not build or scaffold any backend code here.

---

## Stack at a Glance

| Layer | Technology |
|---|---|
| Framework | React Native 0.81 + Expo SDK 54 |
| Router | expo-router v6 (file-based) |
| Language | TypeScript |
| Styling | StyleSheet API (no Tailwind, no styled-components) |
| State | Zustand |
| API Client | axios (see `services/api.ts`) |
| PDF Rendering | react-native-pdf |
| Urdu Font | Noto Nastaliq Urdu (loaded via expo-font on startup) |
| Auth Storage | expo-secure-store (JWT tokens only) |

---

## Critical Rules — Read Before Every Task

### 1. RTL is non-negotiable
- All Urdu text must use the `UrduText` component (`components/ui/UrduText.tsx`).
- Never use a raw `<Text>` for Urdu content.
- Every container holding Urdu text needs `writingDirection: 'rtl'` and `textAlign: 'right'`.

### 2. No client-side NLP
- Do not split, tokenise, or process Urdu strings on the client.
- Word boundaries in Urdu include ZWNJ (U+200C) and ZWJ (U+200D) — standard `split(' ')` is wrong.
- Delegate all text analysis to the backend API.

### 3. API is the source of truth
- All data lives on the server. There is no local SQLite, no offline cache.
- All API calls go through `services/api.ts` (axios instance with auth interceptors).
- The base URL is set via the environment variable `EXPO_PUBLIC_API_BASE_URL`.

### 4. Minimalistic design
- No decorative elements unless they serve a functional purpose.
- Follow the colour palette and spacing scale defined in `constants/theme.ts`.
- Do not add third-party UI component libraries without consulting the plan.

### 5. Font must be loaded before render
- `app/_layout.tsx` loads Noto Nastaliq Urdu with `expo-font` and blocks rendering until complete.
- Do not render any Urdu UI elements before `fontsLoaded` is true.

---

## Project Structure (Key Files)

```
app/
  _layout.tsx              Root layout — auth guard + font loading
  (auth)/login.tsx         Login screen
  (auth)/register.tsx      Register screen
  (app)/_layout.tsx        Bottom tab navigator
  (app)/library.tsx        PDF list + upload
  (app)/dictionary.tsx     Personal dictionary
  (app)/profile.tsx        User profile / logout
  (app)/reader/[id].tsx    PDF reader (dynamic route by document_id)
  (app)/reader/components/
    PdfViewer.tsx           Wraps react-native-pdf
    SelectionOverlay.tsx    Gesture layer — tap/long-press for word/phrase selection
    MeaningDrawer.tsx       Bottom sheet: selected text + Urdu meaning + "Add to Dictionary"
    SummaryModal.tsx        Page-range summary UI (SSE stream)

components/ui/
  UrduText.tsx             ← USE THIS for all Urdu text
  Button.tsx
  Card.tsx

services/
  api.ts                   axios instance (reads EXPO_PUBLIC_API_BASE_URL)
  auth.service.ts          login, register, refresh token
  pdf.service.ts           upload, list, stream PDFs
  meaning.service.ts       word/phrase meaning + summary (SSE)
  dictionary.service.ts    personal dictionary CRUD

store/
  auth.store.ts            { user, accessToken, isAuthenticated }
  reader.store.ts          { currentDocId, currentPage, pendingSelection }
  dictionary.store.ts      { entries[] }

constants/
  theme.ts                 Colour palette, spacing, typography
  fonts.ts                 Font family name constants
  api.ts                   Base URL helper
```

---

## API Endpoints Summary

All endpoints require `Authorization: Bearer <access_token>` except auth routes.

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Get tokens |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/pdfs/upload` | Upload a PDF |
| GET | `/pdfs/` | List user's PDFs |
| GET | `/pdfs/{id}/file` | Stream PDF file |
| DELETE | `/pdfs/{id}` | Delete PDF |
| POST | `/meaning` | Get contextual word/phrase meaning |
| POST | `/summary` | Stream page-range summary (SSE) |
| POST | `/dictionary` | Save word to personal dictionary |
| GET | `/dictionary` | List saved words |
| DELETE | `/dictionary/{id}` | Remove word |

Full request/response shapes are in the implementation plan (`§5 API Contract`).

---

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server
npx expo start

# Run on Android
npx expo start --android

# Run on iOS (macOS only)
npx expo start --ios

# Lint
npm run lint
```

Set `EXPO_PUBLIC_API_BASE_URL` in a `.env` file at the project root before running:

```
EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:8000
```

---

## Current Build Phase

> **Phase 1 — Foundation** (in progress)
> Goal: user can register → log in → upload a PDF → read it page by page.

Check the implementation plan `§4 Feature Phases` for the full checklist and exit criteria for each phase. Mark tasks as complete (`[x]`) in the plan when done.

---

## What Agents Should NOT Do

- ❌ Build, scaffold, or modify any backend code
- ❌ Add a login wall or auth guard that blocks app access
- ❌ Add SQLite or any offline-first storage
- ❌ Use Tailwind CSS or external UI libraries not listed in the stack
- ❌ Perform Urdu text tokenisation on the client
- ❌ Render Urdu strings with raw `<Text>` — always use `UrduText`
- ❌ Hardcode the API base URL — always read from `EXPO_PUBLIC_API_BASE_URL`
- ❌ Add social login (Google, Apple) — deferred to post-MVP
