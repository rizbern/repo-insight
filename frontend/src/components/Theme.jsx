import { useState } from "react";

const DAY = 864e5;
export function daysUntil(iso) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / DAY);
}
export function daysSince(iso) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / DAY);
}
export function urgencyOf(days) {
  if (days < 0) return "overdue";
  if (days < 10) return "imminent";
  if (days <= 30) return "soon";
  return "safe";
}

export const G = {
  /* Deep space background layers */
  bg: "hsl(230, 30%, 4%)",
  bgMid: "hsl(230, 25%, 7%)",
  /* Glass fill — translucent white over dark */
  glass: "rgba(255, 255, 255, 0.055)",
  glassMid: "rgba(255, 255, 255, 0.08)",
  glassHover: "rgba(255, 255, 255, 0.10)",
  /* Glass borders */
  rim: "rgba(255, 255, 255, 0.12)",
  rimStrong: "rgba(255, 255, 255, 0.22)",
  /* Text */
  ink: "rgba(255, 255, 255, 0.94)",
  ink2: "rgba(255, 255, 255, 0.60)",
  ink3: "rgba(255, 255, 255, 0.35)",
  /* Apple-ish accent — electric blue-violet */
  accent: "hsl(220, 100%, 68%)",
  accentGlow: "hsla(220, 100%, 68%, 0.25)",
  accentSoft: "hsla(220, 100%, 68%, 0.12)",
  /* Urgency — shifted for dark mode legibility */
  safe: "hsl(152, 75%, 60%)",
  safeBg: "hsla(152, 75%, 60%, 0.12)",
  safeBorder: "hsla(152, 75%, 60%, 0.28)",
  soon: "hsl(38, 95%, 62%)",
  soonBg: "hsla(38, 95%, 62%, 0.12)",
  soonBorder: "hsla(38, 95%, 62%, 0.28)",
  imminent: "hsl(8, 90%, 68%)",
  imminentBg: "hsla(8, 90%, 68%, 0.12)",
  imminentBorder: "hsla(8, 90%, 68%, 0.28)",
  overdue: "hsl(355, 80%, 60%)",
  overdueBg: "hsla(355, 80%, 60%, 0.14)",
  /* Typography */
  sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  /* Geometry */
  radius: "12px",
  radiusLg: "18px",
  radiusFull: "9999px"
};

export const URGENCY_COLOR = {
  safe: G.safe,
  soon: G.soon,
  imminent: G.imminent,
  overdue: G.overdue
};

export const inputStyle = {
  fontFamily: G.sans,
  fontSize: 13,
  padding: "7px 12px",
  border: `1px solid ${G.rim}`,
  borderRadius: G.radiusFull,
  background: G.glass,
  color: G.ink,
  outline: "none",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  transition: "border-color 150ms ease, box-shadow 150ms ease"
};

export const thStyle = {
  textAlign: "left",
  fontFamily: G.mono,
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  color: G.ink3,
  padding: "12px 16px",
  borderBottom: `1px solid ${G.rim}`,
  background: "rgba(255,255,255,0.025)",
  whiteSpace: "nowrap"
};

export const tdStyle = {
  padding: "13px 16px",
  borderBottom: `1px solid rgba(255,255,255,0.06)`,
  verticalAlign: "middle"
};

export function CustomSelect({ value, onChange, options, ariaLabel }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = options.find(o => o.value === value)?.label || options[0]?.label || "Select";

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {isOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 40 }}
          onClick={() => setIsOpen(false)}
        />
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={ariaLabel}
        style={{
          ...inputStyle,
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          minWidth: 140,
          justifyContent: "space-between"
        }}
      >
        <span style={{ color: value ? G.ink : G.ink3 }}>{selectedLabel}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 50,
            background: "rgba(18, 20, 38, 0.88)",
            border: `1px solid ${G.rimStrong}`,
            borderRadius: 8,
            backdropFilter: "blur(40px) saturate(200%)",
            WebkitBackdropFilter: "blur(40px) saturate(200%)",
            boxShadow: "0 12px 24px rgba(0,0,0,0.4)",
            overflow: "hidden",
            padding: 4,
            minWidth: "100%",
            whiteSpace: "nowrap"
          }}
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              style={{
                padding: "8px 12px",
                fontSize: 13,
                fontFamily: G.sans,
                color: opt.value === value ? G.accent : G.ink,
                background: opt.value === value ? G.accentSoft : "transparent",
                borderRadius: 4,
                cursor: "pointer",
                transition: "background 100ms ease"
              }}
              onMouseEnter={(e) => {
                if (opt.value !== value) e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              }}
              onMouseLeave={(e) => {
                if (opt.value !== value) e.currentTarget.style.background = "transparent";
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function GlassCard({ children, style }) {
  return (
    <div
      style={{
        background: G.glass,
        border: `1px solid ${G.rim}`,
        borderRadius: G.radius,
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        boxShadow: "0 2px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.10)",
        ...style
      }}
    >
      {children}
    </div>
  );
}

export function LifecycleBar({ repo }) {
  const left = daysUntil(repo.scheduledDeletionAt);
  const elapsed = daysSince(repo.repoCreatedAt);
  const total = elapsed + Math.max(left, 0);
  const consumed = total > 0 ? Math.min((elapsed / total) * 100, 100) : 100;
  const urgency = urgencyOf(left);
  const color = URGENCY_COLOR[urgency];
  const label = left < 0 ? `${Math.abs(left)}d overdue` : left === 0 ? "expires today" : `${left}d left`;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 132 }}>
      <div
        role="progressbar"
        aria-valuenow={Math.round(consumed)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Retention window: ${label}`}
        style={{
          position: "relative",
          height: 5,
          background: "rgba(255,255,255,0.10)",
          borderRadius: 99,
          overflow: "hidden"
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "0 auto 0 0",
            width: `${consumed}%`,
            background: `linear-gradient(90deg, ${color}cc, ${color})`,
            borderRadius: 99,
            boxShadow: `0 0 8px ${color}80`,
            transition: "width 380ms cubic-bezier(0.4,0,0.2,1)"
          }}
        />
      </div>
      <span
        style={{
          fontFamily: G.mono,
          fontSize: 11,
          fontWeight: 500,
          color,
          textShadow: `0 0 10px ${color}60`,
          letterSpacing: "0.02em"
        }}
      >
        {label}
      </span>
    </div>
  );
}

export function Tag({ text, bg, fg, border, dot, glow }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontFamily: G.mono,
        fontSize: 11,
        fontWeight: 500,
        padding: "3px 8px",
        borderRadius: G.radiusFull,
        background: bg,
        color: fg,
        border: `1px solid ${border}`,
        whiteSpace: "nowrap",
        letterSpacing: "0.02em",
        boxShadow: glow ? `0 0 12px ${glow}` : void 0,
        backdropFilter: "blur(8px)"
      }}
    >
      {dot && (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "currentColor",
            boxShadow: `0 0 6px currentColor`
          }}
        />
      )}
      {text}
    </span>
  );
}

export function StatusTag({ status }) {
  return status === "live" ? (
    <Tag text="Live" bg={G.safeBg} fg={G.safe} border={G.safeBorder} dot glow={G.safeBg} />
  ) : (
    <Tag text="Archived" bg="rgba(255,255,255,0.06)" fg={G.ink3} border={G.rim} dot />
  );
}

export function AccessTag({ status }) {
  return status === "revoked" ? (
    <Tag text="Revoked" bg={G.soonBg} fg={G.soon} border={G.soonBorder} />
  ) : (
    <Tag text="Active" bg={G.accentSoft} fg={G.accent} border={`${G.accent}40`} glow={G.accentGlow} />
  );
}

export function Stat({ value, label, alert }) {
  return (
    <div
      style={{
        background: alert ? G.imminentBg : G.glass,
        border: `1px solid ${alert ? G.imminentBorder : G.rim}`,
        borderRadius: G.radius,
        padding: "14px 16px",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: alert
          ? `0 0 24px ${G.imminentBg}, inset 0 1px 0 rgba(255,255,255,0.08)`
          : "inset 0 1px 0 rgba(255,255,255,0.08)",
        transition: "box-shadow 200ms ease"
      }}
    >
      <div
        style={{
          fontFamily: G.mono,
          fontSize: 26,
          fontWeight: 600,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          color: alert ? G.imminent : G.ink,
          textShadow: alert ? `0 0 20px ${G.imminent}60` : void 0
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 11,
          color: alert ? G.imminent : G.ink3,
          marginTop: 3,
          letterSpacing: "0.02em",
          fontWeight: 500
        }}
      >
        {label}
      </div>
    </div>
  );
}

export function Button({ children, onClick, variant = "default", small, disabled }) {
  const base = {
    fontFamily: G.sans,
    fontSize: small ? 12 : 13,
    fontWeight: 500,
    padding: small ? "4px 10px" : "7px 14px",
    borderRadius: G.radiusFull,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.35 : 1,
    border: `1px solid ${G.rim}`,
    background: G.glass,
    color: G.ink,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    transition: "background 150ms ease, border-color 150ms ease, box-shadow 150ms ease",
    letterSpacing: "0.01em",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10)"
  };
  const variants = {
    default: {},
    primary: {
      background: `linear-gradient(135deg, hsl(220,100%,65%), hsl(255,90%,68%))`,
      color: "#fff",
      borderColor: "transparent",
      boxShadow: `0 0 20px ${G.accentGlow}, inset 0 1px 0 rgba(255,255,255,0.25)`
    },
    danger: {
      color: G.imminent,
      borderColor: G.imminentBorder
    },
    dangerSolid: {
      background: `linear-gradient(135deg, hsl(8,90%,60%), hsl(355,85%,55%))`,
      color: "#fff",
      borderColor: "transparent",
      boxShadow: `0 0 18px ${G.imminentBg}`
    }
  };
  return (
    <button style={{ ...base, ...variants[variant] }} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function Modal({ children }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(5, 6, 15, 0.72)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "grid",
        placeItems: "center",
        padding: 16,
        zIndex: 50
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          background: "rgba(18, 20, 38, 0.88)",
          border: `1px solid ${G.rimStrong}`,
          borderRadius: G.radiusLg,
          width: "min(520px, 100%)",
          maxHeight: "86vh",
          overflowY: "auto",
          backdropFilter: "blur(40px) saturate(200%)",
          WebkitBackdropFilter: "blur(40px) saturate(200%)",
          boxShadow: "0 32px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.15)"
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, body, confirmLabel, danger, onConfirm, onCancel }) {
  return (
    <Modal>
      <div style={{ padding: "24px 24px 12px" }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: G.ink }}>{title}</h2>
      </div>
      <div style={{ padding: "0 24px 16px", fontSize: 13, color: G.ink2 }}>{body}</div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 24px 24px" }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant={danger ? "dangerSolid" : "primary"} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
