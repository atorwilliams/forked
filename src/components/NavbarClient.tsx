"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";

type NavUser = {
  username: string | null;
  name: string | null;
  image: string | null;
};

export function NavbarClient({ user }: { user: NavUser | null }) {
  const pathname = usePathname();

  return (
    <header
      style={{
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        className="navbar-inner"
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 16px",
          height: 56,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "var(--text)",
            fontWeight: 600,
            fontSize: 18,
            textDecoration: "none",
          }}
        >
          <ForkIcon />
          Forked
        </Link>

        <nav style={{ display: "flex", gap: 4, marginLeft: 8 }}>
          <NavLink href="/explore" current={pathname} label="Explore" />
        </nav>

        <div className="navbar-search" style={{ flex: 1 }}>
          <SearchBox />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          {/* Mobile search icon */}
          <Link href="/search" className="navbar-search-mobile" style={{ display: "none", color: "var(--text-muted)", padding: 6 }} aria-label="Search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </Link>
          {user ? (
            <>
              <Link
                href="/new"
                style={{
                  background: "var(--accent)",
                  border: "none",
                  borderRadius: 6,
                  padding: "5px 14px",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> New recipe
              </Link>
              <UserMenu user={user} />
            </>
          ) : (
            <>
              <Link href="/login">
                <button
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    padding: "5px 16px",
                    color: "var(--text)",
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  Sign in
                </button>
              </Link>
              <Link href="/signup">
                <button
                  style={{
                    background: "var(--accent)",
                    border: "none",
                    borderRadius: 6,
                    padding: "5px 16px",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  Sign up
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function UserMenu({ user }: { user: NavUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          background: "none",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: "3px 10px 3px 4px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
        aria-label="User menu"
      >
        <div style={{ width: 26, height: 26, borderRadius: "50%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-tertiary)", flexShrink: 0 }}>
          {user.image ? (
            <img src={user.image} alt={user.name ?? "avatar"} width={26} height={26} style={{ borderRadius: "50%" }} />
          ) : (
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", userSelect: "none" }}>
              {(user.name ?? user.username ?? "?")[0].toUpperCase()}
            </span>
          )}
        </div>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {user.name ?? user.username}
        </span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ color: "var(--text-muted)", flexShrink: 0 }}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            minWidth: 180,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            zIndex: 100,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{user.name ?? user.username}</div>
            {user.username && (
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>@{user.username}</div>
            )}
          </div>

          <div style={{ padding: "4px 0" }}>
            {user.username && (
              <DropdownLink href={`/${user.username}`} label="Your profile" onClick={() => setOpen(false)} />
            )}
            <DropdownLink href="/settings" label="Settings" onClick={() => setOpen(false)} />
          </div>

          <div style={{ borderTop: "1px solid var(--border)", padding: "4px 0" }}>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                background: "none",
                border: "none",
                padding: "7px 14px",
                fontSize: 13,
                color: "#f85149",
                cursor: "pointer",
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DropdownLink({ href, label, onClick }: { href: string; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: "block",
        padding: "7px 14px",
        fontSize: 13,
        color: "var(--text)",
        textDecoration: "none",
      }}
    >
      {label}
    </Link>
  );
}

function NavLink({ href, current, label }: { href: string; current: string; label: string }) {
  const active = current.startsWith(href);
  return (
    <Link
      href={href}
      style={{
        padding: "4px 12px",
        borderRadius: 6,
        fontSize: 14,
        color: active ? "var(--text)" : "var(--text-muted)",
        background: active ? "var(--bg-tertiary)" : "transparent",
        textDecoration: "none",
        fontWeight: active ? 500 : 400,
      }}
    >
      {label}
    </Link>
  );
}

function ForkIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Left tine curves down to handle */}
      <path d="M7 2 L7 10 C7 15 12 16 12 16" />
      {/* Center tine */}
      <line x1="12" y1="2" x2="12" y2="14" />
      {/* Right tine curves down to handle */}
      <path d="M17 2 L17 10 C17 15 12 16 12 16" />
      {/* Handle */}
      <line x1="12" y1="16" x2="12" y2="22" />
    </svg>
  );
}

function SearchBox() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search recipes..."
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          padding: "5px 12px",
          color: "var(--text)",
          fontSize: 14,
          width: "100%",
          maxWidth: 280,
          outline: "none",
        }}
      />
    </form>
  );
}
