"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "stale" | "error";

type ConnectionState = {
  status: ConnectionStatus;
  lastSeenAt: string | null;
  lastSyncAt: string | null;
};

type Props = {
  initial: ConnectionState;
};

function formatDate(value: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString();
}

function badgeVariant(status: ConnectionStatus): "success" | "warning" | "danger" | "neutral" {
  if (status === "connected") return "success";
  if (status === "error") return "danger";
  if (status === "connecting" || status === "stale") return "warning";
  return "neutral";
}

export function LinkedInConnectPanel({ initial }: Props) {
  const [connection, setConnection] = useState<ConnectionState>(initial);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  async function refreshConnection() {
    const response = await fetch("/api/settings/linkedin/connection", { method: "GET" });
    if (!response.ok) return;
    const json = (await response.json()) as ConnectionState;
    setConnection(json);
  }

  useEffect(() => {
    if (connection.status !== "connecting") return;
    const timer = window.setInterval(() => {
      refreshConnection().catch(() => {});
    }, 3000);
    return () => window.clearInterval(timer);
  }, [connection.status]);

  const tokenPreview = useMemo(() => {
    if (!token) return "";
    if (token.length <= 20) return token;
    return `${token.slice(0, 10)}...${token.slice(-10)}`;
  }, [token]);

  async function startConnection() {
    setBusy(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/extension/handshake/start", { method: "POST" });
      const json = (await response.json()) as { token?: string; expiresAt?: string; error?: string };
      if (!response.ok || !json.token || !json.expiresAt) {
        setFeedback(json.error || "Failed to start connection.");
        return;
      }

      setToken(json.token);
      setExpiresAt(json.expiresAt);
      setConnection((current) => ({ ...current, status: "connecting" }));

      try {
        await navigator.clipboard.writeText(json.token);
        setFeedback("Handshake token copied. Open the extension popup and click Complete Connection.");
      } catch {
        setFeedback("Handshake created. Copy token and complete connection in extension popup.");
      }

      await refreshConnection();
    } catch {
      setFeedback("Failed to start connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="section-title">LinkedIn Connection</h1>
      <p className="mt-2 text-sm text-muted">Connect via Chrome extension handshake.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant={badgeVariant(connection.status)}>{connection.status}</Badge>
        <Badge variant="neutral">Last seen: {formatDate(connection.lastSeenAt)}</Badge>
        <Badge variant="neutral">Last sync: {formatDate(connection.lastSyncAt)}</Badge>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button onClick={startConnection} disabled={busy}>
          {busy ? "Starting..." : "Connect LinkedIn"}
        </Button>
        <Button onClick={() => refreshConnection()} variant="secondary">
          Refresh status
        </Button>
      </div>

      {feedback ? <p className="mt-3 text-sm text-muted">{feedback}</p> : null}

      {token ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Current handshake token</p>
          <p className="mt-2 break-all font-mono text-xs text-slate-700">{tokenPreview}</p>
          <p className="mt-2 text-xs text-muted">Expires: {formatDate(expiresAt)}</p>
        </div>
      ) : null}
    </div>
  );
}
