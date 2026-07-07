import { APP_NAME, DEFAULT_CURRENCY, DEFAULT_LANGUAGE } from "@/config/env";
import { routes } from "@/constants/routes";
import { endpoints } from "@/lib/api/endpoints";
import { getDirection } from "@/lib/i18n/direction";

export default function Home() {
  return (
    <div className="flex flex-1 bg-[linear-gradient(135deg,#f3f0ea_0%,#fffdf8_45%,#efe3cd_100%)]">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-16 sm:px-10 lg:px-12">
        <section className="grid gap-8 rounded-[2rem] border border-black/5 bg-white/85 p-8 shadow-[0_20px_80px_rgba(82,56,24,0.08)] backdrop-blur sm:p-10 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-6">
            <span className="inline-flex rounded-full bg-[#1c1917] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#f8e7c2]">
              Frontend Step 1 Ready
            </span>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
                {APP_NAME} foundation for a Saudi used auto parts storefront.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-stone-700">
                The frontend now has centralized environment reading, API utilities,
                auth/session helpers, route constants, and localization groundwork
                for English and Arabic with future RTL support.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-stone-700">
              <span className="rounded-full bg-stone-100 px-4 py-2">
                Default language: {DEFAULT_LANGUAGE}
              </span>
              <span className="rounded-full bg-stone-100 px-4 py-2">
                Currency: {DEFAULT_CURRENCY}
              </span>
              <span className="rounded-full bg-stone-100 px-4 py-2">
                Arabic direction: {getDirection("ar")}
              </span>
            </div>
          </div>
          <div className="rounded-[1.5rem] bg-stone-950 p-6 text-stone-100">
            <p className="text-sm uppercase tracking-[0.24em] text-[#f8e7c2]">
              Core paths
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="font-medium text-white">Public products</p>
                <p className="mt-1 break-all text-stone-300">{routes.public.products}</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="font-medium text-white">Products API</p>
                <p className="mt-1 break-all text-stone-300">{endpoints.public.products}</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="font-medium text-white">Admin dashboard</p>
                <p className="mt-1 break-all text-stone-300">{routes.admin.adminDashboard}</p>
              </div>
            </div>
          </div>
        </section>
        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.5rem] border border-black/5 bg-white p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">
              API
            </p>
            <h2 className="mt-3 text-xl font-semibold text-stone-950">
              Request and error handling
            </h2>
            <p className="mt-2 text-sm leading-7 text-stone-700">
              Shared helpers cover JSON, FormData uploads, PDF downloads,
              query-string building, envelope parsing, and normalized backend errors.
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-black/5 bg-white p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">
              Auth
            </p>
            <h2 className="mt-3 text-xl font-semibold text-stone-950">
              Customer and admin session groundwork
            </h2>
            <p className="mt-2 text-sm leading-7 text-stone-700">
              Session helpers and a client auth provider respect backend ownership,
              cookies, and future admin TOTP flow without storing secrets locally.
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-black/5 bg-white p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">
              Localization
            </p>
            <h2 className="mt-3 text-xl font-semibold text-stone-950">
              English now, Arabic-ready next
            </h2>
            <p className="mt-2 text-sm leading-7 text-stone-700">
              English remains the development default, while Arabic is supported as
              an RTL language for upcoming UI work.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}
