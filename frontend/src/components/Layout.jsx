import { NavLink, Outlet } from "react-router-dom";
import { G } from "./Theme";

function NavItem({ to, label, disabled }) {
  if (disabled) {
    return (
      <span
        style={{
          padding: "9px 12px",
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 400,
          background: "transparent",
          color: G.ink2,
          border: "1px solid transparent",
          cursor: "not-allowed",
          opacity: 0.5,
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </span>
    );
  }

  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        padding: "9px 12px",
        borderRadius: 10,
        fontSize: 13,
        fontWeight: isActive ? 500 : 400,
        background: isActive ? `linear-gradient(135deg, ${G.accentSoft}, rgba(139,92,246,0.10))` : "transparent",
        color: isActive ? G.accent : G.ink2,
        border: isActive ? `1px solid ${G.accent}30` : "1px solid transparent",
        cursor: "pointer",
        transition: "background 150ms ease, color 150ms ease",
        letterSpacing: "0.01em",
        boxShadow: isActive ? `inset 0 1px 0 rgba(255,255,255,0.06)` : undefined,
        textDecoration: "none"
      })}
    >
      {label}
    </NavLink>
  );
}

export function Layout() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "210px 1fr",
        minHeight: "100vh",
        fontFamily: G.sans,
        fontSize: 14,
        color: G.ink,
        background: G.bg,
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* ── Ambient light orbs (background atmosphere) ── */}
      <div aria-hidden="true" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {/* Deep blue orb top-left */}
        <div style={{
          position: "absolute",
          top: "-15%",
          left: "-10%",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle, hsla(220,100%,55%,0.18) 0%, transparent 65%)"
        }} />
        {/* Violet orb top-right */}
        <div style={{
          position: "absolute",
          top: "-5%",
          right: "-8%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, hsla(270,80%,55%,0.14) 0%, transparent 65%)"
        }} />
        {/* Teal orb bottom-right */}
        <div style={{
          position: "absolute",
          bottom: "-10%",
          right: "10%",
          width: 450,
          height: 450,
          borderRadius: "50%",
          background: "radial-gradient(circle, hsla(170,80%,50%,0.10) 0%, transparent 65%)"
        }} />
      </div>

      {/* ── Sidebar ── */}
      <aside
        style={{
          position: "relative",
          zIndex: 1,
          background: "rgba(255,255,255,0.04)",
          borderRight: `1px solid ${G.rim}`,
          backdropFilter: "blur(40px) saturate(160%)",
          WebkitBackdropFilter: "blur(40px) saturate(160%)",
          padding: "28px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 32
        }}
      >
        {/* Brand */}
        <div>
          <div
            style={{
              fontFamily: G.mono,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.05em",
              color: G.ink,
              background: `linear-gradient(135deg, ${G.accent}, hsl(270,90%,72%))`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}
          >
            repo-manager
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <NavItem to="/" label="Repositories" />
          <NavItem to="/audit" label="Audit log" />
          <NavItem to="/settings" label="Settings" disabled />
        </nav>
      </aside>

      {/* ── Main ── */}
      <main style={{ padding: "36px 40px", maxWidth: 1440, position: "relative", zIndex: 1, width: "100%", boxSizing: "border-box" }}>
        <Outlet />
      </main>
    </div>
  );
}
