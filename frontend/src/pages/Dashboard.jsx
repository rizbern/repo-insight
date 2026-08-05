import { useState, useMemo, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import {
  G,
  URGENCY_COLOR,
  inputStyle,
  thStyle,
  tdStyle,
  CustomSelect,
  GlassCard,
  LifecycleBar,
  StatusTag,
  AccessTag,
  Stat,
  Button,
  Modal,
  ConfirmDialog,
  daysUntil,
  urgencyOf
} from "../components/Theme";

function DeleteDialog({ repo, onConfirm, onCancel }) {
  const [typed, setTyped] = useState("");
  const matches = typed === repo.name;
  return (
    <Modal>
      <div style={{ padding: "24px 24px 12px" }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px", color: G.ink }}>
          Delete {repo.name}?
        </h2>
      </div>
      <div style={{ padding: "0 24px 16px" }}>
        <div
          style={{
            background: G.imminentBg,
            border: `1px solid ${G.imminentBorder}`,
            borderLeft: `3px solid ${G.imminent}`,
            borderRadius: 8,
            padding: 12,
            fontSize: 13,
            color: G.imminent,
            marginBottom: 16,
            backdropFilter: "blur(8px)"
          }}
        >
          This permanently removes the repository from GitHub, including all of{" "}
          {repo.candidateName ?? "the candidate"}&rsquo;s submitted code and history. GitHub
          provides no way to undo it.
        </div>
        <p style={{ fontSize: 13, marginTop: 0, color: G.ink2 }}>
          If you might need to review this code later, archive it instead — the code stays
          readable and write access is removed.
        </p>
        <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6, color: G.ink }}>
          Type <span style={{ fontFamily: G.mono, color: G.accent }}>{repo.name}</span> to confirm
        </label>
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          style={{
            fontFamily: G.mono,
            fontSize: 13,
            padding: "8px 12px",
            border: `1px solid ${matches ? G.safeBorder : G.rim}`,
            borderRadius: 8,
            width: "100%",
            boxSizing: "border-box",
            background: "rgba(255,255,255,0.06)",
            color: G.ink,
            outline: "none",
            transition: "border-color 200ms ease"
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 24px 24px" }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="dangerSolid" onClick={onConfirm} disabled={!matches}>
          Delete repository
        </Button>
      </div>
    </Modal>
  );
}

export default function Dashboard() {
  const { token, logout, user, authFetch } = useAuth();
  const [repos, setRepos] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [accessFilter, setAccessFilter] = useState("");
  const [dialog, setDialog] = useState({ kind: "none" });
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (!token || !user?.githubUsername) return;
    authFetch(`http://localhost:3000/api/github/repos?org=${user.githubUsername}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        const mapped = data.map(repo => {
          return {
            id: repo.name,
            name: repo.name,
            htmlUrl: repo.htmlUrl,
            role: repo.parsed?.role || null,
            candidateName: repo.parsed?.candidateName || null,
            nameParsed: !!repo.parsed?.isTestRepo,
            repoCreatedAt: repo.createdAt,
            scheduledDeletionAt: new Date(new Date(repo.createdAt).getTime() + 90 * 86400000).toISOString(),
            status: repo.archived ? 'archived' : 'live',
            accessStatus: 'active'
          };
        });
        setRepos(mapped);
      })
      .catch(err => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [token, user?.githubUsername, authFetch]);

  useEffect(() => {
    if (!token) return;

    setNotificationsLoading(true);
    authFetch(`http://localhost:3000/api/notifications?unread=true`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch notifications');
        return res.json();
      })
      .then(data => setNotifications(data))
      .catch(err => {
        console.error(err);
      })
      .finally(() => setNotificationsLoading(false));
  }, [token, authFetch]);

  const visible = useMemo(() => {
    return repos.filter((r) => {
      if (search) {
        const q = search.toLowerCase();
        const hit = r.name.toLowerCase().includes(q) || (r.candidateName ?? "").toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (statusFilter && r.status !== statusFilter) return false;
      if (accessFilter && r.accessStatus !== accessFilter) return false;
      return true;
    }).sort((a, b) => daysUntil(a.scheduledDeletionAt) - daysUntil(b.scheduledDeletionAt));
  }, [repos, search, statusFilter, accessFilter]);

  const stats = useMemo(() => {
    const live = repos.filter((r) => r.status === "live").length;
    const archived = repos.filter((r) => r.status === "archived").length;
    const revoked = repos.filter((r) => r.accessStatus === "revoked").length;
    const soon = repos.filter((r) => {
      const d = daysUntil(r.scheduledDeletionAt);
      return d >= 0 && d < 10;
    }).length;
    const overdue = repos.filter((r) => daysUntil(r.scheduledDeletionAt) < 0).length;
    return { total: repos.length, live, archived, revoked, soon, overdue };
  }, [repos]);

  async function act(kind, repo) {
    try {
      if (kind === "delete") {
        const res = await authFetch(`http://localhost:3000/api/github/repos/${repo.name}?org=${user.githubUsername}`, {
          method: 'DELETE'
        });
        if (!res.ok) throw new Error('Failed');
        setRepos((prev) => prev.filter((r) => r.id !== repo.id));
        setNotice(`Deleted ${repo.name}.`);
      } else if (kind === "archive") {
        const res = await authFetch(`http://localhost:3000/api/github/repos/${repo.name}/archive?org=${user.githubUsername}`, {
          method: 'PATCH'
        });
        if (!res.ok) throw new Error('Failed');
        setRepos((prev) => prev.map((r) => r.id === repo.id ? { ...r, status: "archived" } : r));
        setNotice(`Archived ${repo.name}.`);
      } else if (kind === "unarchive") {
        const res = await authFetch(`http://localhost:3000/api/github/repos/${repo.name}/unarchive?org=${user.githubUsername}`, {
          method: 'PATCH'
        });
        if (!res.ok) throw new Error('Failed');
        setRepos((prev) => prev.map((r) => r.id === repo.id ? { ...r, status: "live" } : r));
        setNotice(`Unarchived ${repo.name}.`);
      } else if (kind === "revoke") {
        const targetUser = repo.candidateName || repo.name;
        const res = await authFetch(`http://localhost:3000/api/github/repos/${repo.name}/collaborators/${targetUser}?org=${user.githubUsername}`, {
          method: 'DELETE'
        });
        if (!res.ok) throw new Error('Failed');
        setRepos(
          (prev) => prev.map((r) => r.id === repo.id ? { ...r, accessStatus: "revoked" } : r)
        );
        setNotice(`Revoked external access to ${repo.name}.`);
      } else if (kind === "grant") {
        const targetUser = repo.candidateName || repo.name;
        const res = await authFetch(`http://localhost:3000/api/github/repos/${repo.name}/collaborators/${targetUser}?org=${user.githubUsername}`, {
          method: 'PUT'
        });
        if (!res.ok) throw new Error('Failed');
        setRepos(
          (prev) => prev.map((r) => r.id === repo.id ? { ...r, accessStatus: "active" } : r)
        );
        setNotice(`Granted external access to ${repo.name}.`);
      }
    } catch (err) {
      setNotice(`Error performing ${kind} on ${repo.name}`);
    }
    setDialog({ kind: "none" });
  }

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
        Repositories
      </h1>
      <p style={{ color: G.ink3, margin: "0 0 28px", fontSize: 13, letterSpacing: "0.01em" }}>
        view of all repos
      </p>

      {notice && (
        <GlassCard
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 16px",
            fontSize: 13,
            marginBottom: 20,
            border: `1px solid ${G.accent}40`,
            background: G.accentSoft
          }}
        >
          <span role="status" style={{ flex: 1, color: G.accent }}>{notice}</span>
          <Button small onClick={() => setNotice(null)}>Dismiss</Button>
        </GlassCard>
      )}

      {!notificationsLoading && (
        <GlassCard style={{ marginBottom: 20, border: `1px solid ${G.soonBorder}`, background: G.soonBg }}>
          <div style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: G.ink }}>Deletion warning panel</div>
              <div style={{ marginTop: 4, color: G.ink2, fontSize: 13 }}>
                {notifications.length > 0
                  ? `${notifications.length} repos are 7 days or less from auto-deletion.`
                  : 'No retention warnings for the next 7 days.'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button small onClick={() => setNotificationsOpen((open) => !open)}>
                {notificationsOpen ? 'Collapse' : 'Expand'}
              </Button>
              <Button small onClick={async () => {
                const res = await authFetch('http://localhost:3000/api/notifications/read-all', { method: 'PATCH' });
                if (res.ok) setNotifications([]);
              }}>
                Mark all read
              </Button>
              <Button small onClick={() => window.location.reload()}>
                Refresh
              </Button>
            </div>
          </div>

          {notificationsOpen && (
            <div style={{ maxHeight: 320, overflowY: 'auto', padding: '0 18px 16px' }}>
              {notifications.length > 0 ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  {notifications.map((notification) => {
                    const repo = repos.find((r) => r.name === notification.repoName);
                    const candidateName = repo?.candidateName ?? 'Unknown candidate';
                    const daysMatch = notification.message.match(/in (\d+) day/);
                    const daysLeft = daysMatch ? Number(daysMatch[1]) : notification.message.includes('today') ? 0 : null;

                    return (
                      <div
                        key={notification.id}
                        style={{
                          padding: '16px',
                          borderRadius: 16,
                          background: 'rgba(10, 12, 32, 0.92)',
                          border: `1px solid rgba(255,255,255,0.08)`,
                          boxShadow: `0 8px 24px rgba(0,0,0,0.14)`
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: G.ink }}>{notification.repoName}</div>
                            <div style={{ marginTop: 5, fontSize: 12, color: G.ink2 }}>{candidateName}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: G.imminent }}>
                              {daysLeft === 0 ? 'Today' : `${daysLeft ?? '7'}d left`}
                            </div>
                            <div style={{ fontSize: 11, color: G.ink3, marginTop: 4 }}>
                              Auto-delete warning
                            </div>
                          </div>
                        </div>
                        <div style={{ marginTop: 14, fontSize: 12, color: G.ink2, lineHeight: 1.7 }}>
                          {notification.message}
                        </div>
                        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 11, color: G.ink3 }}>{new Date(notification.createdAt).toLocaleDateString()}</span>
                          <Button small onClick={() => window.open(`https://github.com/${user.githubUsername}/${notification.repoName}`, '_blank')}>
                            View repo
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '18px 0 22px', color: G.ink3, fontSize: 13 }}>
                  No repos are currently in the 7-day deletion warning window. The panel is still visible so managers can see the retention state at a glance.
                </div>
              )}
            </div>
          )}
        </GlassCard>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: G.ink2 }}>
          Loading repositories from GitHub...
        </div>
      )}
      
      {!loading && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 10,
              marginBottom: 24
            }}
          >
            <Stat value={stats.total} label="Tracked" />
            <Stat value={stats.live} label="Live" />
            <Stat value={stats.archived} label="Archived" />
            <Stat value={stats.revoked} label="Access revoked" />
            <Stat value={stats.soon} label="Expiring in 7 days" alert={stats.soon > 0} />
            <Stat value={stats.overdue} label="Past deletion date" alert={stats.overdue > 0} />
          </div>

          <GlassCard style={{ overflow: "hidden" }}>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
                padding: "14px 16px",
                borderBottom: `1px solid ${G.rim}`,
                background: "rgba(255,255,255,0.025)"
              }}
            >
              <input
                style={{ ...inputStyle, minWidth: 220 }}
                placeholder="Search candidate or repo name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search repositories"
              />
              <CustomSelect
                value={statusFilter}
                onChange={setStatusFilter}
                ariaLabel="Filter by status"
                options={[
                  { value: "", label: "All statuses" },
                  { value: "live", label: "Live" },
                  { value: "archived", label: "Archived" }
                ]}
              />
              <CustomSelect
                value={accessFilter}
                onChange={setAccessFilter}
                ariaLabel="Filter by access"
                options={[
                  { value: "", label: "All access" },
                  { value: "active", label: "Access active" },
                  { value: "revoked", label: "Access revoked" }
                ]}
              />
              <div style={{ flex: 1 }} />
              <Button onClick={() => window.location.reload()}>Refresh</Button>
            </div>

            {visible.length === 0 ? (
              <div style={{ padding: "56px 24px", textAlign: "center", color: G.ink3 }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: G.ink, marginBottom: 8 }}>
                  No repositories match
                </div>
                <p style={{ fontSize: 13, maxWidth: "42ch", margin: "0 auto 20px", color: G.ink3 }}>
                  Clear the filters to see everything being tracked.
                </p>
                <Button
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("");
                    setAccessFilter("");
                  }}
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Repository</th>
                      <th style={thStyle}>Candidate</th>
                      <th style={thStyle}>Role</th>
                      <th style={thStyle}>Created</th>
                      <th style={thStyle}>Retention</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Access</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((repo, idx) => {
                      const urgency = urgencyOf(daysUntil(repo.scheduledDeletionAt));
                      return (
                        <tr
                          key={repo.id}
                          style={{
                            background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.018)",
                            transition: "background 100ms ease"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.055)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.018)"}
                        >
                          <td style={{ ...tdStyle, position: "relative", paddingLeft: 20 }}>
                            {(urgency === "overdue" || urgency === "imminent") && (
                              <span
                                style={{
                                  position: "absolute",
                                  left: 0,
                                  top: "20%",
                                  bottom: "20%",
                                  width: 3,
                                  borderRadius: 99,
                                  background: URGENCY_COLOR[urgency],
                                  boxShadow: `0 0 8px ${URGENCY_COLOR[urgency]}`
                                }}
                              />
                            )}
                            <a
                              href={repo.htmlUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                fontFamily: G.mono,
                                fontSize: 12,
                                fontWeight: 500,
                                color: G.accent,
                                textDecoration: "none",
                                letterSpacing: "0.01em"
                              }}
                            >
                              {repo.name}
                            </a>
                          </td>
                          <td style={tdStyle}>
                            {repo.nameParsed && repo.candidateName ? (
                              <span style={{ fontWeight: 500, color: G.ink }}>{repo.candidateName}</span>
                            ) : (
                              <span
                                title="Repo name didn't match the expected pattern"
                                style={{ fontFamily: G.mono, fontSize: 11, color: G.ink3 }}
                              >
                                not parsed
                              </span>
                            )}
                          </td>
                          <td
                            style={{
                              ...tdStyle,
                              fontFamily: G.mono,
                              fontSize: 12,
                              color: G.ink3,
                              letterSpacing: "0.02em"
                            }}
                          >
                            {repo.role ?? "\u2014"}
                          </td>
                          <td
                            style={{
                              ...tdStyle,
                              fontFamily: G.mono,
                              fontSize: 12,
                              color: G.ink3,
                              letterSpacing: "0.02em"
                            }}
                          >
                            {repo.repoCreatedAt.slice(0, 10)}
                          </td>
                          <td style={tdStyle}>
                            <LifecycleBar repo={repo} />
                          </td>
                          <td style={tdStyle}>
                            <StatusTag status={repo.status} />
                          </td>
                          <td style={tdStyle}>
                            <AccessTag status={repo.accessStatus} />
                          </td>
                          <td style={tdStyle}>
                            <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }}>
                              {repo.accessStatus === "revoked" ? (
                                <Button
                                  small
                                  onClick={() => setDialog({ kind: "grant", repo })}
                                >
                                  Grant
                                </Button>
                              ) : (
                                <Button
                                  small
                                  onClick={() => setDialog({ kind: "revoke", repo })}
                                >
                                  Revoke
                                </Button>
                              )}
                              {repo.status === "archived" ? (
                                <Button
                                  small
                                  onClick={() => setDialog({ kind: "unarchive", repo })}
                                >
                                  Unarchive
                                </Button>
                              ) : (
                                <Button
                                  small
                                  onClick={() => setDialog({ kind: "archive", repo })}
                                >
                                  Archive
                                </Button>
                              )}
                              <Button
                                small
                                variant="danger"
                                onClick={() => setDialog({ kind: "delete", repo })}
                              >
                                Delete
                              </Button>
                            </div>
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
              Showing {visible.length} of {repos.length} repositories
            </div>
          </GlassCard>
        </>
      )}

      {dialog.kind === "delete" && (
        <DeleteDialog
          repo={dialog.repo}
          onCancel={() => setDialog({ kind: "none" })}
          onConfirm={() => act("delete", dialog.repo)}
        />
      )}
      {dialog.kind === "archive" && (
        <ConfirmDialog
          title={`Archive ${dialog.repo.name}?`}
          body={<p style={{ marginTop: 0, color: G.ink2 }}>
            The code stays readable and write access is removed. You can unarchive it on GitHub
            later. This does not change the scheduled deletion date.
          </p>}
          confirmLabel="Archive repository"
          onCancel={() => setDialog({ kind: "none" })}
          onConfirm={() => act("archive", dialog.repo)}
        />
      )}
      {dialog.kind === "unarchive" && (
        <ConfirmDialog
          title={`Unarchive ${dialog.repo.name}?`}
          body={<p style={{ marginTop: 0, color: G.ink2 }}>
            This will restore the repository to an active state.
          </p>}
          confirmLabel="Unarchive repository"
          onCancel={() => setDialog({ kind: "none" })}
          onConfirm={() => act("unarchive", dialog.repo)}
        />
      )}
      {dialog.kind === "revoke" && (
        <ConfirmDialog
          title="Revoke external access?"
          body={<p style={{ marginTop: 0, color: G.ink2 }}>
            Removes every outside collaborator from{" "}
            <span style={{ fontFamily: G.mono, color: G.accent }}>{dialog.repo.name}</span>.
            Organization members keep their access. The repository and its code are not affected,
            and the deletion countdown continues unchanged.
          </p>}
          confirmLabel="Revoke access"
          danger
          onCancel={() => setDialog({ kind: "none" })}
          onConfirm={() => act("revoke", dialog.repo)}
        />
      )}
      {dialog.kind === "grant" && (
        <ConfirmDialog
          title="Grant external access?"
          body={<p style={{ marginTop: 0, color: G.ink2 }}>
            Grants the outside collaborator write access to{" "}
            <span style={{ fontFamily: G.mono, color: G.accent }}>{dialog.repo.name}</span>.
          </p>}
          confirmLabel="Grant access"
          onCancel={() => setDialog({ kind: "none" })}
          onConfirm={() => act("grant", dialog.repo)}
        />
      )}
    </>
  );
}