import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  G,
  thStyle,
  tdStyle,
  GlassCard,
  Tag,
  Button
} from "../components/Theme";

function ActionTag({ type }) {
  // Color coding for different audit actions
  if (type.includes("DELETE") || type.includes("REMOVED")) {
    return <Tag text={type} bg={G.soonBg} fg={G.soon} border={G.soonBorder} />;
  }
  if (type.includes("UPDATED") || type.includes("CREATED")) {
    return <Tag text={type} bg={G.safeBg} fg={G.safe} border={G.safeBorder} />;
  }
  if (type === "LOGIN") {
    return <Tag text={type} bg={G.accentSoft} fg={G.accent} border={`${G.accent}40`} />;
  }
  return <Tag text={type} bg="rgba(255,255,255,0.06)" fg={G.ink} border={G.rim} />;
}

export default function AuditLog() {
  const { token, logout } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = () => {
    setLoading(true);
    fetch(`http://localhost:3000/api/audit/logs`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch audit logs');
        return res.json();
      })
      .then(data => {
        setLogs(data.data || []);
        setError(null);
      })
      .catch(err => {
        console.error(err);
        setError("Could not load audit logs. Please try again.");
        if (err.message.includes('401')) logout();
      })
      .finally(() => setLoading(false));
  };

  const exportCsv = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/audit/export`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to export CSV');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'audit-export.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("Could not export CSV. Please try again.");
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchLogs();
  }, [token]);

  return (
    <>
      <h1
        style={{
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          margin: "0 0 4px",
          background: `linear-gradient(135deg, ${G.ink} 60%, ${G.accent})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text"
        }}
      >
        Audit Log
      </h1>
      <p style={{ color: G.ink3, margin: "0 0 28px", fontSize: 13, letterSpacing: "0.01em" }}>
        A record of system actions and lifecycle events.
      </p>

      {error && (
        <GlassCard
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 16px",
            fontSize: 13,
            marginBottom: 20,
            border: `1px solid ${G.imminent}40`,
            background: G.imminentBg
          }}
        >
          <span role="status" style={{ flex: 1, color: G.imminent }}>{error}</span>
          <Button small onClick={() => setError(null)}>Dismiss</Button>
        </GlassCard>
      )}

      <GlassCard style={{ overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            padding: "14px 16px",
            borderBottom: `1px solid ${G.rim}`,
            background: "rgba(255,255,255,0.025)"
          }}
        >
          <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: G.ink }}>
            Recent Activity
          </div>
          <Button onClick={exportCsv} disabled={loading || logs.length === 0}>
            Export CSV
          </Button>
          <Button onClick={fetchLogs} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {loading && logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 24px', color: G.ink2 }}>
            Loading audit history...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: "56px 24px", textAlign: "center", color: G.ink3 }}>
            <div style={{ fontSize: 15, fontWeight: 500, color: G.ink, marginBottom: 8 }}>
              No audit logs found
            </div>
            <p style={{ fontSize: 13, maxWidth: "42ch", margin: "0 auto", color: G.ink3 }}>
              Actions taken in the dashboard will appear here.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Date & Time</th>
                  <th style={thStyle}>Actor</th>
                  <th style={thStyle}>Action</th>
                  <th style={thStyle}>Target</th>
                  <th style={thStyle}>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => {
                  const date = new Date(log.createdAt);
                  return (
                    <tr
                      key={log.id}
                      style={{
                        background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.018)",
                        transition: "background 100ms ease"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.055)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.018)"}
                    >
                      <td
                        style={{
                          ...tdStyle,
                          fontFamily: G.mono,
                          fontSize: 12,
                          color: G.ink3,
                          letterSpacing: "0.02em"
                        }}
                      >
                        {date.toLocaleString()}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 500, color: G.ink }}>
                        {log.actor}
                      </td>
                      <td style={tdStyle}>
                        <ActionTag type={log.actionType} />
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          fontFamily: G.mono,
                          fontSize: 12,
                          color: G.accent,
                          letterSpacing: "0.01em"
                        }}
                      >
                        {log.targetRepo ?? "\u2014"}
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          fontFamily: G.mono,
                          fontSize: 12,
                          color: G.ink2,
                          maxWidth: 250,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}
                        title={log.metadata ? JSON.stringify(log.metadata) : log.ipAddress}
                      >
                        {log.metadata ? (
                          <span style={{ opacity: 0.8 }}>{JSON.stringify(log.metadata)}</span>
                        ) : log.ipAddress ? (
                          <span>IP: {log.ipAddress}</span>
                        ) : (
                          "\u2014"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div
          style={{
            padding: "12px 16px",
            borderTop: `1px solid ${G.rim}`,
            fontSize: 12,
            color: G.ink3,
            fontFamily: G.mono,
            letterSpacing: "0.03em",
            background: "rgba(255,255,255,0.018)"
          }}
        >
          Showing {logs.length} events
        </div>
      </GlassCard>
    </>
  );
}
