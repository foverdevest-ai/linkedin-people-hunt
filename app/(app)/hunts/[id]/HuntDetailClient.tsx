"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button, buttonClass } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type HuntDetail = {
  id: string;
  name: string | null;
  inputUrl: string;
  status: string;
  prospects: Array<{
    id: string;
    fullName: string | null;
    normalizedProfileUrl: string;
    companyName: string | null;
    messagingStatus: string;
    score: number | null;
  }>;
  template: {
    id: string | null;
    name: string | null;
    body: string | null;
  };
  connection: {
    status: string;
    lastSeenAt: string | null;
    lastSyncAt: string | null;
  };
  progress: {
    currentPage: number;
    maxPages: number;
    blockingReason: string | null;
    lastAction: string | null;
    lastError: string | null;
    dailyCap: number;
    sentToday: number;
    counts: {
      total: number;
      queued: number;
      sent: number;
      replied: number;
      failed: number;
      skipped: number;
    };
  };
};

function formatDate(value: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString();
}

export function HuntDetailClient({ runId }: { runId: string }) {
  const [run, setRun] = useState<HuntDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch(`/api/hunts/${runId}`);
        const json = (await response.json()) as HuntDetail | { error?: string };
        if (!response.ok) {
          if (active) setError("error" in json ? json.error || "Failed to load run" : "Failed to load run");
          return;
        }
        if (active) {
          setRun(json as HuntDetail);
          setError(null);
        }
      } catch {
        if (active) setError("Failed to load run");
      }
    }

    load().catch(() => setError("Failed to load run"));
    const timer = window.setInterval(() => {
      load().catch(() => {});
    }, 5000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [runId]);

  if (error) {
    return <Card>{error}</Card>;
  }

  if (!run) {
    return <Card>Loading run...</Card>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="section-title">{run.name || "Untitled run"}</h1>
            <p className="text-sm text-muted">{run.inputUrl}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="info">{run.status}</Badge>
            <Link href={`/hunts/${run.id}/review`} className={buttonClass({ variant: "secondary" })}>
              Review
            </Link>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <form action={`/api/hunts/${run.id}/start`} method="post">
            <Button type="submit">Start</Button>
          </form>
          <form action={`/api/hunts/${run.id}/pause`} method="post">
            <Button type="submit" variant="secondary">
              Pause
            </Button>
          </form>
          <form action={`/api/hunts/${run.id}/resume`} method="post">
            <Button type="submit" variant="secondary">
              Resume
            </Button>
          </form>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold">Autopilot Status</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">LinkedIn connection</p>
            <p className="mt-2 text-sm text-slate-700">{run.connection.status}</p>
            <p className="mt-1 text-xs text-muted">Last seen: {formatDate(run.connection.lastSeenAt)}</p>
            <p className="mt-1 text-xs text-muted">Last sync: {formatDate(run.connection.lastSyncAt)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Message template</p>
            <p className="mt-2 text-sm font-semibold text-slate-700">{run.template.name || "Not configured"}</p>
            <p className="mt-2 whitespace-pre-wrap text-xs text-muted">{run.template.body || "-"}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <StatusCard label="Pages processed" value={`${run.progress.currentPage}/${run.progress.maxPages}`} />
          <StatusCard label="Queued to send" value={String(run.progress.counts.queued)} />
          <StatusCard label="Sent today cap" value={`${run.progress.sentToday}/${run.progress.dailyCap}`} />
          <StatusCard label="Imported" value={String(run.progress.counts.total)} />
          <StatusCard label="Replies" value={String(run.progress.counts.replied)} />
          <StatusCard label="Skipped" value={String(run.progress.counts.skipped)} />
        </div>
        {run.progress.blockingReason ? (
          <p className="mt-4 text-sm text-amber-700">Blocking reason: {run.progress.blockingReason}</p>
        ) : null}
        {run.progress.lastError ? <p className="mt-2 text-sm text-red-600">Last error: {run.progress.lastError}</p> : null}
        {run.progress.lastAction ? <p className="mt-2 text-sm text-muted">Last action: {run.progress.lastAction}</p> : null}
      </Card>

      <Card>
        <h2 className="text-xl font-semibold">Recent Prospects</h2>
        <div className="mt-3 space-y-2">
          {run.prospects.map((p) => (
            <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="font-semibold">{p.fullName || p.normalizedProfileUrl}</p>
              <p className="text-sm text-muted">{p.companyName || "Unknown company"}</p>
              <div className="mt-1 flex gap-2">
                <Badge variant="neutral">{p.messagingStatus}</Badge>
                <Badge variant="info">Score {p.score ?? 0}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-800">{value}</p>
    </div>
  );
}
