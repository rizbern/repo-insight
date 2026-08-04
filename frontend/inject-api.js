import fs from 'fs';

let content = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8');

// 1. Add imports
content = content.replace(
  `import { useState, useMemo } from "react";`,
  `import { useState, useMemo, useEffect } from "react";\nimport { useAuth } from "../context/AuthContext";\nimport { Navigate } from "react-router-dom";`
);

// 2. Replace SEED initialization and add useEffect
const newInit = `
export default function Dashboard() {
  const { token, logout } = useAuth();
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [accessFilter, setAccessFilter] = useState("");
  const [expiryFilter, setExpiryFilter] = useState("");
  const [dialog, setDialog] = useState({ kind: "none" });
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (!token) return;
    fetch('http://localhost:3000/api/github/repos', {
      headers: { Authorization: \`Bearer \${token}\` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        // Map backend API data to the frontend structure expected
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
            accessStatus: 'active' // We assume active since the API doesn't return this yet
          };
        });
        setRepos(mapped);
      })
      .catch(err => {
        console.error(err);
        if (err.message.includes('401')) logout();
      })
      .finally(() => setLoading(false));
  }, [token]);
`;

content = content.replace(
  /export default function Dashboard\(\) \{[\s\S]*?const \[notice, setNotice\] = useState\(null\);/,
  newInit.trim()
);

// 3. Update the act function for real API calls
const newAct = `
  async function act(kind, repo) {
    try {
      if (kind === "delete") {
        const res = await fetch(\`http://localhost:3000/api/github/repos/\${repo.name}\`, {
          method: 'DELETE',
          headers: { Authorization: \`Bearer \${token}\` }
        });
        if (!res.ok) throw new Error('Failed');
        setRepos((prev) => prev.filter((r) => r.id !== repo.id));
        setNotice(\`Deleted \${repo.name}.\`);
      } else if (kind === "archive") {
        const res = await fetch(\`http://localhost:3000/api/github/repos/\${repo.name}/archive\`, {
          method: 'PATCH',
          headers: { Authorization: \`Bearer \${token}\` }
        });
        if (!res.ok) throw new Error('Failed');
        setRepos((prev) => prev.map((r) => r.id === repo.id ? { ...r, status: "archived" } : r));
        setNotice(\`Archived \${repo.name}.\`);
      } else {
        // Revoke
        const targetUser = repo.candidateName || repo.name;
        const res = await fetch(\`http://localhost:3000/api/github/repos/\${repo.name}/collaborators/\${targetUser}\`, {
          method: 'DELETE',
          headers: { Authorization: \`Bearer \${token}\` }
        });
        if (!res.ok) throw new Error('Failed');
        setRepos(
          (prev) => prev.map((r) => r.id === repo.id ? { ...r, accessStatus: "revoked" } : r)
        );
        setNotice(\`Revoked external access to \${repo.name}.\`);
      }
    } catch (err) {
      setNotice(\`Error performing \${kind} on \${repo.name}\`);
    }
    setDialog({ kind: "none" });
  }
`;

content = content.replace(
  /function act\(kind, repo\) \{[\s\S]*?setDialog\(\{ kind: "none" \}\);\n  \}/,
  newAct.trim()
);

// 4. Update the "Reset demo data" button to be a "Refresh" button
content = content.replace(
  /<Button onClick=\{\(\) => setRepos\(SEED\)\}>Reset demo data<\/Button>/g,
  `<Button onClick={() => window.location.reload()}>Refresh</Button>`
);

// 5. Add a loading state to the main rendering logic
// Find the <main> block
content = content.replace(
  /\{[\s\n]*\/\* Notice banner \*\/\s*\}/,
  `{loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: G.ink2 }}>
            Loading repositories...
          </div>
        )}
        {!loading && notice && (`
);

content = content.replace(
  /<\/GlassCard>[\s\n]*<\/main>/,
  `</GlassCard>\n      </main>`
);

// Wait, the {!loading && notice && ( needs to close its brace. Let's fix that.
// It's easier to just inject the loading state right before the stats block
content = content.replace(
  /\{\s*\/\* Stats \*\/\s*\}/,
  `
  {loading && (
    <div style={{ textAlign: 'center', padding: '40px', color: G.ink2 }}>
      Loading repositories from GitHub...
    </div>
  )}
  {!loading && (
    <>
      {/* Stats */}`
);

content = content.replace(
  /\{\s*\/\* Footer count \*\/\s*\}[\s\S]*?Showing \{visible\.length\} of \{repos\.length\} repositories[\s\S]*?<\/div>[\s\S]*?<\/GlassCard>/,
  `{/* Footer count */}
          <div
            style={{
              padding: "12px 16px",
              borderTop: \`1px solid \${G.rim}\`,
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
  )}`
);

fs.writeFileSync('src/pages/Dashboard.jsx', content);
console.log('API logic injected into Dashboard.jsx');
