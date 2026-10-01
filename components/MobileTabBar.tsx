"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type IconProps = { active: boolean };

function Icon({ children, active }: { children: React.ReactNode; active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.1 : 1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

const HomeIcon = ({ active }: IconProps) => (
  <Icon active={active}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h5v-6h4v6h5V10" /></Icon>
);
const GlobeIcon = ({ active }: IconProps) => (
  <Icon active={active}><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" /></Icon>
);
const EyeIcon = ({ active }: IconProps) => (
  <Icon active={active}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Icon>
);
const MailIcon = ({ active }: IconProps) => (
  <Icon active={active}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></Icon>
);
const UserIcon = ({ active }: IconProps) => (
  <Icon active={active}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></Icon>
);

const TABS = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/regions", label: "Regions", Icon: GlobeIcon },
  { href: "/off-lens", label: "Off-Lens", Icon: EyeIcon },
  { href: "/digest", label: "Digest", Icon: MailIcon },
  { href: "/account", label: "Account", Icon: UserIcon },
];

// Ground News-style bottom navigation. Phones only -- desktop keeps the
// top header + drawer.
export default function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur"
      style={{
        background: "var(--overlay)",
        borderColor: "var(--border)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <ul className="grid grid-cols-5">
        {TABS.map(({ href, label, Icon: TabIcon }) => {
          const active = href === "/" ? pathname === "/" || pathname.startsWith("/story") : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center justify-center gap-0.5 py-2"
                style={{ color: active ? "var(--brand-soft)" : "var(--text-on-ink-dim)" }}
              >
                <TabIcon active={active} />
                <span className="text-[0.62rem] font-medium tracking-wide">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
