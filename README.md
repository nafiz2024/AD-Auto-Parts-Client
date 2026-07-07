## AD Auto Parts Frontend

This repository contains the frontend foundation for AD Auto Parts, a Saudi Arabia focused used/second-hand auto parts e-commerce platform. It is a Next.js App Router application that will support both the customer storefront and the admin panel.

The backend is required and runs separately. This frontend is expected to talk only to the backend APIs and auth routes that are already available.

## Local setup

1. Install dependencies.
2. Ensure the frontend env files are present.
3. Start the development server.

```bash
npm run dev
```

Open `http://localhost:3000`.

## Backend dependency

- Backend app: `http://localhost:5000`
- Backend API base: `http://localhost:5000/api/v1`
- Backend auth base: `http://localhost:5000/api/auth`

## Required public env variables

These values are read from `.env.local` and documented in `.env.example`.

```env
NEXT_PUBLIC_APP_NAME="AD Auto Parts"
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_AUTH_BASE_URL=http://localhost:5000/api/auth
NEXT_PUBLIC_DEFAULT_CURRENCY=SAR
NEXT_PUBLIC_DEFAULT_COUNTRY=SA
NEXT_PUBLIC_DEFAULT_LANGUAGE=en
NEXT_PUBLIC_SUPPORTED_LANGUAGES=en,ar
NEXT_PUBLIC_DEFAULT_LOCALE=en-SA
NEXT_PUBLIC_SUPPORTED_LOCALES=en-SA,ar-SA
NEXT_PUBLIC_RTL_LANGUAGES=ar
```

Do not place backend secrets, database URLs, OAuth secrets, JWT secrets, TOTP secrets, or private keys in the frontend env files.

## Project foundation locations

- Environment reader: [src/config/env.js](src/config/env.js)
- API client and helpers: [src/lib/api](src/lib/api)
- Auth/session foundation: [src/lib/auth](src/lib/auth)
- Route constants: [src/constants/routes.js](src/constants/routes.js)
- Localization foundation: [src/lib/i18n](src/lib/i18n)
- Client auth provider: [src/providers/auth-provider.jsx](src/providers/auth-provider.jsx)

## Localization rules

- Development default language is English.
- Arabic is supported and must be treated as RTL.
- Final release is expected to switch the default language to Arabic later.
- Currency is SAR.
- Country is SA.

## Current Step 2 coverage

- Centralized validated public env reader
- Shared API request, upload, download, query, and error normalization utilities
- Centralized backend endpoint constants
- Frontend route constants for public, customer, and admin areas
- Auth/session helpers for customer/admin flows with cookie-based requests
- Runtime language provider with English/Arabic switching and RTL document updates
- Public storefront layout with a two-row navbar and shared footer
- Admin shell with sidebar, topbar, and dashboard placeholder routes
- Shared UI components for buttons, inputs, cards, alerts, badges, dialogs, toasts, loading states, and error states
- SAR money formatting helper for minor-unit prices

## Layout structure

- Public shell: `src/components/layout/public-*`
- Admin shell: `src/components/layout/admin-*`
- Shared UI components: `src/components/ui`
- Loading/error state components: `src/components/states`
- Runtime providers: `src/providers`

## Public navbar behavior

- Two-row storefront header inspired by the provided reference
- Main row includes logo, large search bar, language toggle, wishlist, cart placeholder, and account placeholder
- Second row includes categories trigger, main navigation links, and Saudi WhatsApp placeholder contact
- Mobile layout collapses into a slide-in menu

## Admin shell behavior

- Dark navy sidebar with red active item styling
- White topbar with search placeholder, View Store shortcut, notifications icon, and admin account placeholder
- Dashboard route is still a placeholder and does not claim real analytics data

## Language strategy

- English remains the development default
- Arabic is optional now
- Arabic switches document direction to RTL
- Final release can later move the default to Arabic through env configuration

## SAR formatting note

- Money helpers live in `src/lib/utils/money.js`
- `formatMoneyMinor` and `formatSarMinor` assume backend values may arrive in minor units
- Frontend display does not calculate authoritative totals

## Validation

- Lint: `npm run lint`
- Build: `npm run build`

## Next step

Step 3 can start wiring these shells and shared components into backend-connected public listing/detail pages and admin CRUD screens without rebuilding the UI foundation.
