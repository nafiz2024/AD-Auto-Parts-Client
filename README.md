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

## Current Step 11 coverage

- Centralized validated public env reader
- Shared API request, upload, download, query, and error normalization utilities
- Centralized backend endpoint constants
- Frontend route constants for public, customer, and admin areas
- Auth/session helpers for customer/admin flows with cookie-based requests
- Runtime language provider with English/Arabic switching and RTL document updates
- Translation helper with nested-key lookup, English fallback, interpolation, missing-key safety, and localized backend-field selection helpers
- Public storefront layout with a two-row navbar and shared footer
- Admin shell with sidebar, topbar, protected entry routing, login, TOTP verification, and backend-aware dashboard routes
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
- Public contact page with support enquiry form, guest-safe submission, authenticated name/email prefill, validation handling, and Saudi-safe fallback contact details
- About page with used-parts positioning, inspection/support messaging, and storefront/contact CTAs
- Return policy page with compatibility responsibility, return review guidance, and refund-process copy that stays aligned with backend review workflows
- Terms and conditions page covering used-part condition, SAR pricing, single-item order placement, supported payment methods, delivery, and refunds
- Privacy policy placeholder page for support/account/order information handling
- Refreshed public not-found page with branding, storefront CTA, and support CTA
- Footer support/shop links updated for public support and policy pages
- Customer account area with orders, payments, invoices, notifications, enquiries, reviews, questions, returns, and profile foundations
- Admin auth flow wired to Better Auth email sign-in, backend session checks, admin role gating, sign-out, and TOTP verification
- Admin dashboard hydrated from available analytics, notifications, orders, payments, shipments, returns, enquiries, and products endpoints
- Admin product list route with backend-driven search, filtering, status actions, responsive table/card views, and pagination controls
- Admin add/edit product routes with shared form sections for product details, compatibility, condition, pricing, inventory, description, and visibility
- Admin product media management UI for upload, gallery display, set-primary, reorder, and delete flows using multipart `FormData`
- Admin categories route with backend-driven search, status filtering, responsive table/card views, right-side create/edit form, and confirmation dialogs
- Admin brands route with vehicle-brand and parts-brand tabs, responsive list views, right-side create/edit form, and confirmation dialogs
- Lightweight vehicle model management section under vehicle brands using backend-safe fields only

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
- Shared visible UI copy is progressively routed through the central dictionary instead of hardcoded page strings
- Dynamic backend content is localized only when Arabic companion fields such as `nameAr` or `name_ar` are present; otherwise English/base fields are used as safe fallbacks
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

## Static support pages

- `/contact` submits guest-safe support enquiries through the public enquiries endpoint
- `/about` explains the used-parts storefront positioning without unsupported claims
- `/return-policy` and `/terms` provide operational guidance that does not overstate legal promises or backend capabilities
- `/privacy-policy` is implemented as a lightweight placeholder because the footer now exposes it
- `app/not-found.js` uses the shared public layout and a branded 404 state

## Contact and settings behavior

- Public support pages use Saudi-safe fallback placeholders when live public settings are unavailable
- The frontend contract already exposes `GET /public/settings` and `POST /enquiries`
- This step does not assume undocumented backend field shapes; settings hydration is best-effort and non-blocking
- Contact enquiries do not create accounts, do not store message drafts locally, and do not include admin/internal fields

## Saudi and language context

- Currency remains SAR
- Country context remains Saudi Arabia / SA
- English remains the default language
- Arabic remains available and the new static/support labels include Arabic dictionary entries
- Footer and support contact placeholders use Saudi-safe phone, email, and location values

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

## Backend endpoints used by Step 7 support UI

- `GET /public/settings`
- `POST /enquiries`

## Admin auth and dashboard behavior

- `/admin/login` uses backend email sign-in and refreshes the current session before allowing admin access
- `/admin/totp` verifies the backend TOTP challenge and does not store TOTP codes, sessions, or cookies manually
- `/admin` redirects to login, TOTP, or dashboard depending on the live session state
- `/admin/dashboard` stays protected behind authenticated admin plus TOTP-complete access checks
- Sidebar logout uses the backend sign-out flow and then returns to `/admin/login`

## Admin product management behavior

- `/admin/products` loads product inventory from the admin API with allowlisted query params for search, category, condition, stock, status, sort, and page
- `/admin/products/new` creates a product with shared admin form sections and backend field-error mapping
- `/admin/products/[productId]` loads and updates product details, supports guarded publish/unpublish, archive, and mark-sold actions, and includes media management
- Product media upload uses `FormData` through the shared API client and does not set manual JSON `Content-Type`
- Media UI hides unsupported local filesystem details and relies on backend-confirmed responses before updating destructive state

## Admin category management behavior

- `/admin/categories` loads categories from the admin API with allowlisted query params for search, status, sort, and page
- Category create/edit uses a right-side admin form and maps backend field validation errors back to the relevant inputs
- Category status changes and delete actions require confirmation and do not optimistically remove or mutate UI before the backend confirms
- Category image upload is intentionally left as a deferred placeholder because the current frontend endpoint contract does not expose category media routes

## Admin brand and vehicle model behavior

- `/admin/brands` manages both vehicle brands and parts brands through a tabbed admin experience with preserved filter state in the URL
- Brand create/edit uses the shared authenticated admin API client and maps backend field validation errors into the drawer form
- Brand delete and activate/deactivate actions require confirmation and only refresh the UI after backend success
- Brand logo upload is intentionally left as a deferred placeholder because the current frontend endpoint contract does not expose brand media routes
- Vehicle model management is implemented as a lightweight section inside the vehicle brand tab using the existing admin vehicle model endpoint and only safe, backend-aligned fields

## Backend endpoints used by Step 10 and Step 11 admin UI

- `GET /admin/products`
- `POST /admin/products`
- `GET /admin/products/:productId`
- `PATCH /admin/products/:productId`
- `POST /admin/products/:productId/media`
- `DELETE /admin/products/:productId/media/:mediaId` if supported by the backend contract
- `PATCH /admin/products/:productId/media/:mediaId` for primary-image updates if supported by the backend contract
- `PATCH /admin/products/:productId/media` for reorder updates if supported by the backend contract
- `GET /admin/categories`
- `POST /admin/categories`
- `PATCH /admin/categories/:categoryId`
- `DELETE /admin/categories/:categoryId` if supported by the backend contract
- `GET /admin/vehicle-brands`
- `POST /admin/vehicle-brands`
- `PATCH /admin/vehicle-brands/:brandId`
- `DELETE /admin/vehicle-brands/:brandId` if supported by the backend contract
- `GET /admin/vehicle-models`
- `POST /admin/vehicle-models`
- `PATCH /admin/vehicle-models/:modelId`
- `DELETE /admin/vehicle-models/:modelId` if supported by the backend contract
- `GET /admin/parts-brands`
- `POST /admin/parts-brands`
- `PATCH /admin/parts-brands/:brandId`
- `DELETE /admin/parts-brands/:brandId` if supported by the backend contract

## Security notes for Step 10 and Step 11

- Admin product routes continue to depend on the existing authenticated session, admin role checks, active-account checks, and TOTP completion
- Product, category, brand, and vehicle-model mutations use the shared API client with credentials instead of bypassing backend auth
- The frontend does not store admin secrets, TOTP values, or manual session cookies
- Upload validation is light on the client and limited to JPEG, PNG, and WebP; the backend remains the final validator
- Category and brand media fields remain placeholders until explicit backend media support exists, which avoids submitting unsupported fields

## Next step

Step 12 can expand deeper admin order/payment operations, richer catalog-specific backend DTO alignment, or dedicated media support for categories and brands if those backend routes become explicit.

## Validation

- Lint: `npm run lint`
- Build: `npm run build`

There is currently no `npm test` script configured in `package.json`.
