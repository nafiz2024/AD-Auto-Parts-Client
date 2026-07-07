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
- Runtime providers: [src/providers](src/providers)
- Homepage feature: [src/features/home](src/features/home)

## Current Step 6 coverage

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
- Homepage landing page with hero, compatibility finder preview, categories, product sections, vehicle brands, CTA, why-choose-us, how-it-works, reviews preview, and recently-viewed placeholder
- Storefront shop page with filter sidebar, sorting, grid/list view toggle, pagination, and Buy Now focused product cards
- Search results page with query-driven hero, suggestions, filters, sorting, pagination, and no-results support CTA
- Category detail pages that reuse the shared storefront listing experience
- Route-level loading states for shop, search, and category listing pages
- Product detail route with backend-first product loading
- Product gallery with safe image fallbacks and thumbnail selection
- Compatibility summary, condition summary, specifications, delivery/return, and reviews preview sections
- Related products using the shared storefront product card
- Buy Now remains single-item checkout only with product identifier plus `qty=1`
- Single-item checkout route with backend product reload, checkout form state, delivery estimate requests, and idempotent order submission
- Order success route with order number summary and safe next-step messaging
- Track order page with authenticated order-detail lookup fallback and safe public messaging when a public tracking endpoint is not exposed in the current frontend contract

## Layout structure

- Public shell: `src/components/layout/public-*`
- Admin shell: `src/components/layout/admin-*`
- Shared UI components: `src/components/ui`
- Loading/error state components: `src/components/states`
- Runtime providers: `src/providers`
- Storefront listing feature: `src/features/listing`

## Public navbar behavior

- Two-row storefront header inspired by the provided reference
- Main row includes logo, large search bar, language toggle, wishlist, cart placeholder, and account placeholder
- Top utility row includes inspected parts, delivery, customer support, and support shortcuts
- Second row includes categories trigger, main navigation links, and Saudi WhatsApp placeholder contact
- Mobile layout collapses into a slide-in menu

## Homepage sections

- Hero section
- Compatibility finder preview
- Shop by category
- Featured parts
- Latest arrivals
- Shop by vehicle brand
- Help CTA
- Why choose us
- How it works
- Customer reviews preview
- Recently viewed placeholder

## API endpoints used by the homepage

- `GET /categories`
- `GET /products`
- `GET /vehicle-brands`

When those endpoints return empty local data, the homepage shows clearly labeled preview content so the UI can still be reviewed during development.

## Language strategy

- English remains the development default
- Arabic is optional now
- Arabic switches document direction to RTL
- Final release can later move the default to Arabic through env configuration

## SAR formatting note

- Money helpers live in `src/lib/utils/money.js`
- `formatMoneyMinor` and `formatSarMinor` assume backend values may arrive in minor units
- Frontend display does not calculate authoritative totals

## Buy Now rule

- The homepage does not implement a cart system
- Product cards use `Buy Now` and `View Details`
- `Buy Now` routes to a single-item checkout placeholder, never to a cart flow
- The product details page also routes only to single-item checkout and does not create cart state
- The checkout flow does not create or persist cart state; it submits one product only

## Checkout behavior

- Checkout expects `productId` plus `qty=1` in the URL
- Product, stock, price, delivery fee, and total are always reloaded or confirmed by the backend
- Delivery estimate is requested from the backend and shown as informational until order placement confirms the final total
- Supported payment methods in the UI are `COD` and `Manual Advance Payment`
- No external payment gateway, card form, or multi-item cart logic is implemented

## Validation

- Lint: `npm run lint`
- Build: `npm run build`

## Listing behavior

- `GET /products` is used as the primary backend source for shop, category, and search pages
- Safe backend filters currently used by the frontend include `q`, `page`, `limit`, `sort`, `year`, `minPriceMinor`, `maxPriceMinor`, `availability`, `position`, and supported condition values
- When the local backend returns no products or empty taxonomy collections, the storefront falls back to clearly labeled preview content so the Step 4 UI can still be reviewed
- Wishlist buttons are visual placeholders only
- Product cards continue to use `Buy Now` and `View Details`; no cart workflow has been introduced

## Backend endpoints used by checkout/order UI

- `GET /products/:id`
- `GET /delivery-zones`
- `GET /delivery-estimate`
- `POST /customer/checkout`
- `GET /customer/orders/:orderNumber`

## Next step

Step 7 can expand customer account order pages, manual payment proof submission UI, and richer public order tracking if a dedicated public tracking endpoint is exposed by the backend contract.
