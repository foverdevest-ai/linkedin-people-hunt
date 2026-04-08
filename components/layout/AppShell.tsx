import Link from "next/link";
import { signOut } from "@/lib/auth";
import { getHubLinks } from "@/lib/hub/links";

const navLinkClass =
  "inline-flex items-center justify-center rounded-[var(--ds-radius-pill)] border border-[var(--ds-color-border-strong)] bg-[var(--ds-color-surface-glassStrong)] px-4 py-2 text-sm font-medium text-[var(--ds-color-brand-secondary)] shadow-[var(--ds-shadow-soft)] transition hover:bg-white/90";
const salesHubLinkClass =
  "inline-flex items-center justify-center rounded-[var(--ds-radius-pill)] border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-[var(--ds-shadow-soft)] transition hover:bg-slate-800";
const logoutButtonClass =
  "inline-flex items-center justify-center rounded-[var(--ds-radius-pill)] border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 shadow-[var(--ds-shadow-soft)] transition hover:bg-rose-100";

export function AppShell({ children }: { children: React.ReactNode }) {
  const hubLinks = getHubLinks();
  const currentAppKey = "people_hunt";
  const salesHubUrl = "https://saleshub.personeel.com";
  const appNav = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/hunts", label: "Hunts" },
    { href: "/replies", label: "Replies" },
    { href: "/settings/templates", label: "Templates" },
    { href: "/settings/linkedin", label: "LinkedIn Settings" }
  ] as const;

  return (
    <>
      <header className="container-shell pt-6 motion-fade-up">
        <div className="rounded-[var(--ds-radius-xl)] border border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.68),rgba(255,255,255,0.38))] px-5 py-4 shadow-[var(--ds-shadow-glass)] backdrop-blur-xl md:px-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-slate-800">
              <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-sky-500 align-middle" />
              LinkedIn People Hunt
            </Link>
            <nav className="flex flex-wrap items-center gap-3 text-sm">
              <a href={salesHubUrl} className={salesHubLinkClass}>
                Sales Hub
              </a>
              <div className="flex flex-wrap items-center gap-2 rounded-[var(--ds-radius-pill)] border border-white/80 bg-white/40 p-1">
                {hubLinks.map((link) => (
                  <a
                    key={link.key}
                    href={link.href}
                    className={`${navLinkClass} ${link.key === currentAppKey ? link.accentClass : ""}`}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2 rounded-[var(--ds-radius-pill)] border border-white/80 bg-white/40 p-1">
                {appNav.map((item) => (
                  <Link key={item.href} href={item.href} className={navLinkClass}>
                    {item.label}
                  </Link>
                ))}
              </div>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/login" });
                }}
              >
                <button className={logoutButtonClass} type="submit">
                  Log out
                </button>
              </form>
            </nav>
          </div>
        </div>
      </header>
      <main className="container-shell pb-10 pt-7 motion-fade-in motion-delay-1">{children}</main>
    </>
  );
}
