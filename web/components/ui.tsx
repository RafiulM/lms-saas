import type { ReactNode } from "react";
import type { Tone } from "@/lib/types";

export type IconName =
  | "home"
  | "calendar"
  | "file"
  | "chart"
  | "users"
  | "megaphone"
  | "settings"
  | "arrow"
  | "chevron"
  | "close"
  | "menu"
  | "bell"
  | "download"
  | "plus"
  | "school"
  | "user"
  | "logout"
  | "grid"
  | "check";

export function Icon({ name, className = "icon" }: { name: IconName; className?: string }) {
  return (
    <svg className={className} aria-hidden="true">
      <use href={`#icon-${name}`} />
    </svg>
  );
}

export function Sprite() {
  return (
    <svg className="svg-sprite" aria-hidden="true">
      <symbol id="icon-home" viewBox="0 0 24 24"><path d="m4 10 8-6 8 6v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9Z"/><path d="M9 20v-6h6v6"/></symbol>
      <symbol id="icon-calendar" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16M8 14h2M14 14h2M8 17h2"/></symbol>
      <symbol id="icon-file" viewBox="0 0 24 24"><path d="M7 4h10a2 2 0 0 1 2 2v14H5V6a2 2 0 0 1 2-2Z"/><path d="M9 4.5V3h6v1.5M8.5 10h7M8.5 14h7M8.5 18H12"/></symbol>
      <symbol id="icon-chart" viewBox="0 0 24 24"><path d="M5 20V10M12 20V4M19 20v-7M3 20h18"/></symbol>
      <symbol id="icon-users" viewBox="0 0 24 24"><path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM16 4.5a3.5 3.5 0 0 1 0 6.8M16 15h1.5a3.5 3.5 0 0 1 3.5 3.5V20"/></symbol>
      <symbol id="icon-megaphone" viewBox="0 0 24 24"><path d="M4 12h3l9-5v10l-9-5H4v5h2v-5"/><path d="M16 10.2c1.1.35 1.9 1.02 1.9 1.8s-.8 1.45-1.9 1.8M19 8.5c1.55.85 2.5 2.05 2.5 3.5s-.95 2.65-2.5 3.5"/></symbol>
      <symbol id="icon-settings" viewBox="0 0 24 24"><path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"/><path d="m19.4 15 .1.1a1.8 1.8 0 0 1-2.55 2.55l-.1-.1a1.8 1.8 0 0 0-3.07 1.27v.28a1.8 1.8 0 0 1-3.6 0v-.28a1.8 1.8 0 0 0-3.07-1.27l-.1.1a1.8 1.8 0 1 1-2.55-2.55l.1-.1A1.8 1.8 0 0 0 3.3 12H3a1.8 1.8 0 0 1 0-3.6h.3A1.8 1.8 0 0 0 4.57 5.3l-.1-.1a1.8 1.8 0 1 1 2.55-2.55l.1.1A1.8 1.8 0 0 0 10.2 1.5v-.2a1.8 1.8 0 0 1 3.6 0v.2a1.8 1.8 0 0 0 3.07 1.27l.1-.1a1.8 1.8 0 1 1 2.55 2.55l-.1.1A1.8 1.8 0 0 0 20.7 8.4h.3a1.8 1.8 0 0 1 0 3.6h-.3A1.8 1.8 0 0 0 19.4 15Z"/></symbol>
      <symbol id="icon-arrow" viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6"/></symbol>
      <symbol id="icon-chevron" viewBox="0 0 24 24"><path d="m7 10 5 5 5-5"/></symbol>
      <symbol id="icon-close" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></symbol>
      <symbol id="icon-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>
      <symbol id="icon-bell" viewBox="0 0 24 24"><path d="M18 9.5a6 6 0 0 0-12 0c0 7-3 7-3 8.5h18c0-1.5-3-1.5-3-8.5ZM10 21h4"/></symbol>
      <symbol id="icon-download" viewBox="0 0 24 24"><path d="M12 4v11M8 11l4 4 4-4M5 20h14"/></symbol>
      <symbol id="icon-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
      <symbol id="icon-school" viewBox="0 0 24 24"><path d="M4 20V8l8-4 8 4v12"/><path d="M9 20v-5h6v5M8 10h.01M12 10h.01M16 10h.01"/></symbol>
      <symbol id="icon-user" viewBox="0 0 24 24"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0"/></symbol>
      <symbol id="icon-logout" viewBox="0 0 24 24"><path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4M14 16l4-4-4-4M9 12h9"/></symbol>
      <symbol id="icon-grid" viewBox="0 0 24 24"><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4"/></symbol>
      <symbol id="icon-check" viewBox="0 0 24 24"><path d="m5 12 4.5 4.5L19 7"/></symbol>
    </svg>
  );
}

const avatarTones: Record<string, string> = {
  rust: "avatar-rust",
  blue: "avatar-blue",
  yellow: "avatar-yellow",
  green: "avatar-green",
  profile: "avatar-profile",
};

export function Avatar({ initials, tone = "rust", className = "" }: { initials: string; tone?: keyof typeof avatarTones; className?: string }) {
  return <span className={`avatar ${avatarTones[tone]} ${className}`.trim()}>{initials}</span>;
}

const pillTones: Record<string, string> = {
  current: "current-pill",
  upcoming: "upcoming-pill",
  done: "done-pill",
};

export function StatusPill({ tone = "current", children }: { tone?: keyof typeof pillTones; children: ReactNode }) {
  return <span className={`status-pill ${pillTones[tone]}`}>{children}</span>;
}

const metricIcons: Record<Tone, IconName> = { teal: "file", purple: "chart", coral: "users", blue: "file", orange: "file" };
const metricDots: Record<Tone, string> = { teal: "orange", purple: "purple", coral: "coral", blue: "blue", orange: "orange" };
const metricWidths: Record<Tone, string> = { teal: "68%", purple: "86%", coral: "78%", blue: "54%", orange: "62%" };

export function MetricCard({
  tone = "teal",
  label,
  value,
  detail,
  trend,
  trendTone = "positive",
}: {
  tone?: Tone;
  label: string;
  value: ReactNode;
  detail: string;
  trend?: string;
  trendTone?: "positive" | "neutral";
}) {
  return (
    <article className={`metric-card metric-${tone}`}>
      <div className="metric-topline">
        <span className="metric-icon"><Icon name={metricIcons[tone]} /></span>
        {trend ? <span className={`metric-trend ${trendTone}`}>{trend}</span> : null}
      </div>
      <p className="metric-label">{label}</p>
      <p className="metric-number">{value}</p>
      <div className="metric-footer"><span className={`mini-dot dot-${metricDots[tone]}`}></span>{detail}</div>
      <div className={`metric-progress ${tone}-progress`}><span style={{ width: metricWidths[tone] }}></span></div>
    </article>
  );
}

export function PageIntro({
  kicker,
  title,
  subtitle,
  actions,
}: {
  kicker: string;
  title: ReactNode;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <section className="page-intro app-page-intro">
      <div>
        <p className="eyebrow"><span className="eyebrow-dot"></span>{kicker}</p>
        <h1>{title}</h1>
        <p className="page-subtitle">{subtitle}</p>
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </section>
  );
}

export function PageActions({ children }: { children: ReactNode }) {
  return <div className="page-actions">{children}</div>;
}
