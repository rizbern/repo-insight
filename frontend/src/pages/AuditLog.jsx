import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  G,
  thStyle,
  tdStyle,
  GlassCard,
  Tag,
  Button,
  CustomSelect,
  inputStyle
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

function formatMetadata(actionType, metadata, ipAddress) {
  if (!metadata) {
    return ipAddress ? `IP: ${ipAddress}` : "\u2014";
  }
  try {
    switch (actionType) {
      case 'CONFIG_UPDATED':
<<<<<<< HEAD
        return metadata.changes
=======
        return metadata.changes 
>>>>>>> 1c05dafd7307ac1a5fb91daf47f31a5ff31d992a
          ? `Changes: ${Object.keys(metadata.changes).map(k => `${k}=${metadata.changes[k]}`).join(', ')}`
          : 'Config updated';
      case 'OVERRIDE_CREATED':
        const date = metadata.overrideDeletionDate ? new Date(metadata.overrideDeletionDate).toLocaleDateString() : '';
        return `Date: ${date}${metadata.reason ? `, Reason: ${metadata.reason}` : ''}`;
      case 'OVERRIDE_REMOVED':
        const prev = metadata.previousDate ? new Date(metadata.previousDate).toLocaleDateString() : '';
        return `Previous date: ${prev}`;
      case 'COLLABORATOR_REMOVED':
        return metadata.targetUsers ? `Removed: ${metadata.targetUsers.join(', ')}` : (metadata.targetUser ? `Removed: ${metadata.targetUser}` : 'Collaborators removed');
      case 'COLLABORATOR_ADDED':
        return metadata.targetUser ? `Added: ${metadata.targetUser}` : 'Collaborator added';
      default:
        return Object.entries(metadata).map(([k, v]) => `${k}: ${v}`).join(', ');
    }
  } catch (e) {
    return JSON.stringify(metadata);
  }
}

export default function AuditLog() {
  const { token, logout } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [actorFilter, setActorFilter] = useState("");
  const [actionTypeFilter, setActionTypeFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  const fetchLogs = () => {
    setLoading(true);

    const params = new URLSearchParams();
    if (actorFilter) params.append("actor", actorFilter);
    if (actionTypeFilter) params.append("actionType", actionTypeFilter);
    if (startDateFilter) params.append("startDate", startDateFilter);
    if (endDateFilter) params.append("endDate", endDateFilter);

    fetch(`http://localhost:3000/api/audit/logs?${params.toString()}`, {
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
  }, [token, actorFilter, actionTypeFilter, startDateFilter, endDateFilter]);

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

      <GlassCard style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
            padding: "14px 16px",
            borderBottom: `1px solid ${G.rim}`,
            background: "rgba(255,255,255,0.025)",
            borderTopLeftRadius: G.radius,
            borderTopRightRadius: G.radius
          }}
        >
          <input
            style={{ ...inputStyle, minWidth: 150 }}
            placeholder="Filter by actor"
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
          />
          <CustomSelect
            value={actionTypeFilter}
            onChange={setActionTypeFilter}
            ariaLabel="Filter by action"
            options={[
              { value: "", label: "All actions" },
              { value: "CONFIG_UPDATED", label: "Config Updated" },
              { value: "REPO_ARCHIVED", label: "Archived" },
              { value: "REPO_UNARCHIVED", label: "Unarchived" },
              { value: "REPO_DELETED", label: "Deleted" },
              { value: "OVERRIDE_CREATED", label: "Override Added" },
              { value: "COLLABORATOR_ADDED", label: "Access Granted" },
              { value: "COLLABORATOR_REMOVED", label: "Access Revoked" },
              { value: "LOGIN", label: "Login" }
            ]}
          />
          <input
            type="date"
            style={{ ...inputStyle, minWidth: 140 }}
            value={startDateFilter}
            onChange={(e) => setStartDateFilter(e.target.value)}
            title="Start date"
          />
          <span style={{ color: G.ink3, fontSize: 13 }}>to</span>
          <input
            type="date"
            style={{ ...inputStyle, minWidth: 140 }}
            value={endDateFilter}
            onChange={(e) => setEndDateFilter(e.target.value)}
            title="End date"
          />
          <div style={{ flex: 1 }} />
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
                        title={formatMetadata(log.actionType, log.metadata, log.ipAddress)}
                      >
                        <span style={{ opacity: 0.8 }}>
                          {formatMetadata(log.actionType, log.metadata, log.ipAddress)}
                        </span>
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
            background: "rgba(255,255,255,0.018)",
            borderBottomLeftRadius: G.radius,
            borderBottomRightRadius: G.radius
          }}
        >
          Showing {logs.length} events
        </div>
      </GlassCard>
    </>
  );
}
