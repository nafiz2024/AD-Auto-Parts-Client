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

## Current Step 17 coverage

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
- Homepage landing page with hero, compatibility finder preview, backend-fed categories/product sections/vehicle brands, CTA, why-choose-us, and recently-viewed placeholder
- Storefront shop page with filter sidebar, sorting, grid/list view toggle, pagination, and Buy Now focused product cards
- Search results page with query-driven hero, backend-fed filters, sorting, pagination, and no-results support CTA
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
- Public product reviews section with backend review loading, rating summary, verified-buyer badge support, load-more pagination, guarded review submission, and moderation-safe success states
- Public product Q&A section with backend question loading, approved answer display, load-more pagination, guarded question submission, and moderation-safe success states
- Customer invoice list and invoice preview routes with backend-driven PDF download handling
- Customer reviews page with backend-owned review records, status badges, guarded edit/delete actions, loading/error/empty states, and product links
- Customer questions page with backend-owned question records, answer visibility, guarded edit/delete actions, loading/error/empty states, and product links
- Admin auth flow wired to Better Auth email sign-in, backend session checks, admin role gating, sign-out, and TOTP verification
- Admin dashboard hydrated from available analytics, notifications, orders, payments, shipments, returns, enquiries, and products endpoints
- Admin product list route with backend-driven search, filtering, status actions, responsive table/card views, and pagination controls
- Admin add/edit product routes with shared form sections for product details, compatibility, condition, pricing, inventory, description, and visibility
- Admin product media management UI for upload, gallery display, set-primary, reorder, and delete flows using multipart `FormData`
- Admin categories route with backend-driven search, status filtering, responsive table/card views, right-side create/edit form, and confirmation dialogs
- Admin brands route with vehicle-brand and parts-brand tabs, responsive list views, right-side create/edit form, and confirmation dialogs
- Lightweight vehicle model management section under vehicle brands using backend-safe fields only
- Admin orders list route with backend-driven filters, status tabs, responsive list views, pagination, cancel-order confirmation, and links into payment/shipment workflow screens
- Admin order detail route with ordered items, timeline, customer and vehicle summaries, payment summary, admin notes, invoice creation, shipment creation, and guarded status transitions
- Admin invoice list and invoice preview routes with backend-safe download handling plus backend-confirmed void support when advertised by the API response
- Admin manual payments route with backend-driven filtering, detail review, proof-link display, and approve/reject status actions
- Admin shipments route with backend-driven filtering, shipment detail review, courier context, and guarded shipment status updates
- Admin customers route with backend-driven search, status/date filtering, responsive list views, protected detail drawer, pagination, and backend-confirmed customer status actions
- Admin enquiries route with backend-driven search, status/date filtering, responsive list views, protected detail drawer, reply/status update form, and optional manual-enquiry creation when the backend exposes it
- Admin settings route with backend-driven settings load, tabbed sections, dirty-state handling, discard confirmation, backend-confirmed save flow, and protected delivery/payment/policy configuration
- Admin reviews route with protected moderation table/cards, status/rating/product/date filters, review detail drawer, confirmation flows, and backend-confirmed publish/reject/hide/delete actions
- Admin product questions route with protected moderation table/cards, status/product/answered/date filters, question detail drawer, answer form, confirmation flows, and backend-confirmed publish/reject/hide/delete actions

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
- When the backend returns no products or empty taxonomy collections, the storefront now shows real empty states instead of fake preview inventory
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

## Backend endpoints used by Step 12 admin workflow UI

- `GET /admin/orders`
- `GET /admin/orders/:orderNumber`
- `PATCH /admin/orders/:orderNumber`
- `POST /admin/orders/:orderNumber/cancel` if supported by the backend contract
- `GET /admin/payments`
- `PATCH /admin/payments/:paymentId`
- `GET /admin/shipments`
- `POST /admin/shipments`
- `PATCH /admin/shipments/:shipmentId`
- `GET /admin/couriers`
- `POST /admin/invoices`

## Backend endpoints used by Step 13 admin customers and enquiries UI

- `GET /admin/customers`
- `GET /admin/customers/:customerId`
- `PATCH /admin/customers/:customerId` for backend-supported status changes only
- `GET /admin/enquiries`
- `GET /admin/enquiries/:enquiryId`
- `PATCH /admin/enquiries/:enquiryId`
- `POST /admin/enquiries` only when the backend advertises manual enquiry creation support

## Backend endpoints used by Step 14 admin settings UI

- `GET /admin/settings`
- `PATCH /admin/settings`
- `GET /public/settings` continues to support storefront contact/support hydration

## Backend endpoints used by Step 15 invoice UI

- `GET /customer/invoices`
- `GET /customer/invoices/:invoiceNumber/pdf`
- `GET /admin/invoices`
- `POST /admin/invoices`
- Backend-provided secure admin invoice PDF/action paths are used only when the response advertises them; the frontend does not invent admin download or void routes

## Backend endpoints used by Step 16 reviews and Q&A UI

- `GET /reviews`
- `GET /product-questions`
- `GET /customer/reviews`
- `POST /customer/reviews`
- `PATCH /customer/reviews/:reviewId`
- `DELETE /customer/reviews/:reviewId` when the backend advertises support
- `GET /customer/product-questions`
- `POST /customer/product-questions`
- `PATCH /customer/product-questions/:questionId`
- `DELETE /customer/product-questions/:questionId` when the backend advertises support
- `GET /admin/reviews`
- `GET /admin/reviews/:reviewId`
- `PATCH /admin/reviews/:reviewId` or backend-advertised moderation action paths
- `DELETE /admin/reviews/:reviewId` when the backend advertises support
- `GET /admin/questions`
- `GET /admin/questions/:questionId`
- `PATCH /admin/questions/:questionId` or backend-advertised moderation/answer action paths
- `DELETE /admin/questions/:questionId` when the backend advertises support

## Step 15 invoice behavior

- `/account/invoices` lists customer invoice records and supports invoice preview plus authenticated PDF download
- `/account/invoices/[invoiceNumber]` renders a customer-safe invoice preview using backend-authored invoice values only
- `/admin/invoices` stays behind the existing authenticated admin, active-account, and TOTP-complete access flow
- `/admin/invoices/[invoiceNumber]` renders an admin invoice preview using backend-safe invoice data and only shows void/download actions when the backend advertises support
- Customer and admin order detail screens now surface invoice actions through route constants instead of exposing raw PDF/storage paths
- PDF downloads use the shared API client with credentials, Blob handling, `Content-Disposition` filename support, JSON-error detection, and safe fallback filenames
- Invoice totals, delivery fees, discounts, tax/VAT, payment status, and invoice status remain backend-authored; the frontend does not calculate authoritative invoice totals
- Arabic support covers static invoice/document labels while dynamic backend values remain unchanged unless Arabic-specific fields are provided

## Step 16 reviews and Q&A behavior

- `/products/[id]` now loads public reviews and public product questions from backend endpoints and defensively hides non-public or moderation-only entries in the UI
- Public review cards show backend-approved reviewer display names, rating, title/comment, created date, verified-buyer badge only when provided, loading/error/empty states, and load-more pagination
- Public Q&A cards show backend-approved customer names, question text, optional vehicle context, approved answers, loading/error/empty states, and load-more pagination
- Product review and question forms require the current auth state when the backend requires it, prevent double-submit, surface backend field errors, and show pending-moderation messaging instead of claiming immediate public publication
- `/account/reviews` and `/account/questions` are wired into the customer sidebar and render backend-owned customer-only records with status badges, product links, and guarded edit/delete actions when advertised by the API
- `/admin/reviews` and `/admin/questions` stay behind admin auth, active-account rules, and mandatory TOTP, and do not claim moderation success until the backend confirms the mutation
- Admin moderation drawers show only normalized safe fields, keep moderation/internal notes inside protected admin routes, and use confirmation dialogs for destructive or state-changing actions
- English remains the default language, Arabic labels are available, and the review/Q&A screens remain responsive and RTL-safe without introducing cart behavior or storing sensitive moderation data in localStorage

## Step 17 API integration audit

- `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_AUTH_BASE_URL` remain centralized in public env config and are consumed through the shared config reader instead of being hardcoded inside components
- The shared API client continues to own credentials, timeout handling, validation error mapping, safe blob/PDF downloads, and request normalization for storefront, customer, and admin features
- Public catalog/settings `GET` requests now include the current frontend language through `Accept-Language` plus `?lang=` using the persisted language cookie/local value, while English remains the default fallback
- Homepage, shop, category, and search pages no longer fall back to fake preview products/categories/brands when live backend endpoints fail or return empty results
- Real production public pages now rely on backend APIs or explicit empty/deferred states rather than rendering mock business inventory
- Public support settings still use safe fallback contact details only when `GET /public/settings` is unavailable, and the compatibility tools route remains an intentional deferred placeholder
- Customer and admin routes continue to depend on backend-owned auth, role, active-account, ownership, and TOTP checks without frontend-only bypasses
- Remaining deferred items are limited to intentionally non-business placeholders such as recently viewed, compatibility tools, and testimonial content that does not map to a live backend feed yet

## Admin customers and enquiries behavior

- `/admin/customers` stays behind the existing authenticated admin session, active-account checks, and TOTP-complete access flow
- Customer filters sync through the URL for search, status, date range, page, and selected-customer drawer state
- Customer detail stays in a protected drawer and only shows normalized public-safe admin fields such as contact info, order summaries, recent orders, and recent enquiries when returned by the backend
- Customer activate/deactivate/block actions require explicit confirmation and only refresh the UI after backend success
- `/admin/enquiries` stays behind the same authenticated admin plus TOTP-complete access rules
- Enquiry filters sync through the URL for search, status, date range, page, and selected-enquiry drawer state
- Enquiry detail shows normalized contact, vehicle, message, safe attachment preview, reply history, and backend-advertised admin options only
- Enquiry reply and status updates submit only non-empty supported fields and refresh the detail/list after the backend confirms the mutation
- Manual enquiry creation appears only when the backend advertises support for it
- Export buttons remain placeholders until the backend confirms a download contract

## Admin settings behavior

- `/admin/settings` stays behind the existing authenticated admin session, active-account checks, and TOTP-complete access flow
- Settings are loaded from the protected admin settings endpoint and edited through tabbed sections for general, contact, delivery, payments, social media, policies, and admin profile
- Save is disabled until there are real unsaved changes and the UI only resets the dirty state after the backend confirms the update
- A discard confirmation dialog restores the last backend-confirmed settings snapshot instead of silently throwing edits away
- Currency stays SAR and country stays SA in the form experience
- Arabic settings fields are supported alongside English content where public-facing text may be localized
- Logo/favicon upload remains a deferred placeholder because the current frontend endpoint contract does not expose a dedicated settings media upload route
- Admin profile actions remain conservative and avoid inventing unsupported password or secret-management flows

## Security notes for Step 10 through Step 14

- Admin product routes continue to depend on the existing authenticated session, admin role checks, active-account checks, and TOTP completion
- Product, category, brand, and vehicle-model mutations use the shared API client with credentials instead of bypassing backend auth
- Order, payment, shipment, invoice, and admin-note actions continue to depend on the existing authenticated admin session plus TOTP-complete access
- Customer and enquiry screens do not expose password, session, TOTP, payment-proof path, or private-auth fields in the UI
- Customer and enquiry mutations wait for backend confirmation before the interface claims success
- Customer detail and admin-only enquiry notes remain inside protected admin routes and are not reused on public pages
- Settings updates do not store admin secrets in localStorage, do not expose payment credentials, and do not invent unsupported gateway configuration fields
- Settings save payloads stay limited to allowlisted business/contact/delivery/payment/social/policy fields and wait for backend confirmation before the UI reports success
- The frontend does not store admin secrets, TOTP values, or manual session cookies
- Upload validation is light on the client and limited to JPEG, PNG, and WebP; the backend remains the final validator
- Category and brand media fields remain placeholders until explicit backend media support exists, which avoids submitting unsupported fields

## Next step

Step 18 can focus on responsive/RTL polish, broader manual backend verification, and lightweight coverage tests for the audited API flows.

## Validation

- Lint: `npm run lint`
- Build: `npm run build`

There is currently no `npm test` script configured in `package.json`.
