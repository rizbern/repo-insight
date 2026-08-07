import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
    G,
    inputStyle,
    GlassCard,
    Button,
    CustomSelect
} from "../components/Theme";

const API = "http://localhost:3000/api/settings";

export default function Settings() {
    const { token, authFetch } = useAuth();

    const [settings, setSettings] = useState({
        repoPrefix: "",
        retentionDays: 90,
        defaultExpiryAction: "DELETE",
        preDeletionWarningDays: 7,
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (token) fetchSettings();
    }, [token]);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await authFetch(API);
            if (!res.ok) throw new Error();
            const data = await res.json();
            
            setSettings({
                repoPrefix: data.repoPrefix || "",
                retentionDays: data.retentionDays || 90,
                defaultExpiryAction: data.defaultExpiryAction || "DELETE",
                preDeletionWarningDays: data.preDeletionWarningDays || 7,
            });
        } catch {
            setMessage("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: name === "retentionDays" || name === "preDeletionWarningDays"
                    ? Number(value)
                    : value
        }));
    };

    const saveSettings = async () => {
        try {
            setLoading(true);
            const res = await authFetch(API, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings)
            });
            if (!res.ok) throw new Error();
            const updated = await res.json();
            
            setSettings({
                repoPrefix: updated.repoPrefix || "",
                retentionDays: updated.retentionDays || 90,
                defaultExpiryAction: updated.defaultExpiryAction || "DELETE",
                preDeletionWarningDays: updated.preDeletionWarningDays || 7,
            });
            setMessage("Settings updated successfully");
        } catch {
            setMessage("Failed updating settings");
        } finally {
            setLoading(false);
        }
    };

    const resetSettings = async () => {
        try {
            setLoading(true);
            const res = await authFetch(`${API}/reset`, { method: "POST" });
            if (!res.ok) throw new Error();
            const data = await res.json();
            
            setSettings({
                repoPrefix: data.repoPrefix || "",
                retentionDays: data.retentionDays || 90,
                defaultExpiryAction: data.defaultExpiryAction || "DELETE",
                preDeletionWarningDays: data.preDeletionWarningDays || 7,
            });
            setMessage("Settings reset successfully");
        } catch {
            setMessage("Failed resetting settings");
        } finally {
            setLoading(false);
        }
    };

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
                    WebkitTextFillColor: "transparent"
                }}
            >
                Settings
            </h1>
            <p style={{ color: G.ink3, margin: "0 0 28px", fontSize: 13 }}>
                Manage repository lifecycle configuration
            </p>

            {message && (
                <GlassCard
                    style={{
                        padding: "12px 16px",
                        marginBottom: 20,
                        fontSize: 13,
                        color: G.accent,
                        border: `1px solid ${G.accent}40`,
                        background: G.accentSoft
                    }}
                >
                    {message}
                </GlassCard>
            )}

            <GlassCard style={{ padding: 24, maxWidth: 650 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <SettingField label="Repository Prefix">
                        <input
                            style={inputStyle}
                            name="repoPrefix"
                            value={settings.repoPrefix}
                            onChange={handleChange}
                        />
                    </SettingField>

                    <SettingField label="Retention Days">
                        <input
                            style={inputStyle}
                            type="number"
                            name="retentionDays"
                            value={settings.retentionDays}
                            onChange={handleChange}
                        />
                    </SettingField>

                    <SettingField label="Default Expiry Action">
                        <CustomSelect
                            value={settings.defaultExpiryAction}
                            onChange={(value) =>
                                setSettings(prev => ({
                                    ...prev,
                                    defaultExpiryAction: value
                                }))
                            }
                            options={[
                                { value: "DELETE", label: "Delete" },
                                { value: "ARCHIVE", label: "Archive" }
                            ]}
                        />
                    </SettingField>

                    <SettingField label="Pre deletion warning days">
                        <input
                            style={inputStyle}
                            type="number"
                            name="preDeletionWarningDays"
                            value={settings.preDeletionWarningDays}
                            onChange={handleChange}
                        />
                    </SettingField>

                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
                        <Button onClick={resetSettings} variant="danger" disabled={loading}>
                            Reset Defaults
                        </Button>
                        <Button onClick={saveSettings} disabled={loading}>
                            {loading ? "Saving..." : "Save Settings"}
                        </Button>
                        <Button onClick={fetchSettings}>
                            Refresh
                        </Button>
                    </div>
                </div>
            </GlassCard>
        </>
    );
}

function SettingField({ label, children }) {
    return (
        <div>
            <label
                style={{
                    display: "block",
                    marginBottom: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    color: G.ink
                }}
            >
                {label}
            </label>
            {children}
        </div>
    );
}