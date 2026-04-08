"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Template = {
  id: string;
  name: string;
  body: string;
  isDefault: boolean;
};

type ConnectionState = {
  status: "disconnected" | "connecting" | "connected" | "stale" | "error";
  lastSeenAt: string | null;
  lastSyncAt: string | null;
};

export default function NewHuntPage() {
  const [name, setName] = useState("");
  const [inputUrl, setInputUrl] = useState("");
  const [messageTemplateId, setMessageTemplateId] = useState("");
  const [autopilot, setAutopilot] = useState(true);
  const [maxPages, setMaxPages] = useState(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [connection, setConnection] = useState<ConnectionState | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadPrerequisites() {
      const [templatesResponse, connectionResponse] = await Promise.all([
        fetch("/api/settings/templates"),
        fetch("/api/settings/linkedin/connection")
      ]);

      const templatesJson = (await templatesResponse.json()) as { templates?: Template[] };
      const connectionJson = (await connectionResponse.json()) as ConnectionState;
      const templateList = templatesJson.templates || [];
      setTemplates(templateList);
      setConnection(connectionJson);

      const initialTemplate = templateList.find((template) => template.isDefault) || templateList[0];
      if (initialTemplate) {
        setMessageTemplateId(initialTemplate.id);
      }
    }

    loadPrerequisites().catch(() => setError("Failed to load hunt prerequisites."));
  }, []);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === messageTemplateId) || null,
    [messageTemplateId, templates]
  );

  const canCreate = connection?.status === "connected" && Boolean(messageTemplateId);

  async function create() {
    setBusy(true);
    setError(null);
    const response = await fetch("/api/hunts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, inputUrl, messageTemplateId, autopilot, maxPages })
    });
    if (!response.ok) {
      setError((await response.json()).error || "Failed to create run");
      setBusy(false);
      return;
    }
    const json = (await response.json()) as { id: string };
    router.push(`/hunts/${json.id}`);
  }

  return (
    <Card className="max-w-2xl">
      <h1 className="section-title">Create Hunt Run</h1>
      <p className="mt-2 text-sm text-muted">
        Paste a LinkedIn people-search URL or a single LinkedIn profile URL.
      </p>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">LinkedIn status</p>
        <p className="mt-2 text-sm text-slate-700">
          {connection ? `Current status: ${connection.status}` : "Loading LinkedIn connection..."}
        </p>
        {connection?.status !== "connected" ? (
          <p className="mt-2 text-sm text-amber-700">
            Connect your LinkedIn session before creating an autopilot run.{" "}
            <Link href="/settings/linkedin" className="font-semibold text-[var(--ds-color-brand-link)]">
              Open LinkedIn Settings
            </Link>
          </p>
        ) : null}
      </div>

      <label className="mb-2 mt-6 block text-xs font-semibold uppercase tracking-wider text-slate-500">Run name</label>
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="NL HR leaders - week 14" />

      <label className="mb-2 mt-4 block text-xs font-semibold uppercase tracking-wider text-slate-500">LinkedIn URL</label>
      <Input
        value={inputUrl}
        onChange={(e) => setInputUrl(e.target.value)}
        placeholder="https://www.linkedin.com/search/results/people/?... or https://www.linkedin.com/in/..."
      />

      <label className="mb-2 mt-4 block text-xs font-semibold uppercase tracking-wider text-slate-500">Max pages</label>
      <Input type="number" min={1} max={50} value={maxPages} onChange={(e) => setMaxPages(Number(e.target.value))} />

      <label className="mb-2 mt-4 block text-xs font-semibold uppercase tracking-wider text-slate-500">Message template</label>
      <select
        className="w-full rounded-[var(--ds-radius-lg)] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-[var(--ds-shadow-soft)] outline-none transition focus:border-sky-400"
        value={messageTemplateId}
        onChange={(e) => setMessageTemplateId(e.target.value)}
      >
        <option value="">Select a template</option>
        {templates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.name}
          </option>
        ))}
      </select>
      {templates.length === 0 ? (
        <p className="mt-2 text-sm text-amber-700">
          Create a message template first.{" "}
          <Link href="/settings/templates" className="font-semibold text-[var(--ds-color-brand-link)]">
            Open Templates
          </Link>
        </p>
      ) : null}
      {selectedTemplate ? <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{selectedTemplate.body}</p> : null}

      <label className="mt-4 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={autopilot} onChange={(e) => setAutopilot(e.target.checked)} />
        Autopilot send after eligibility checks
      </label>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <Button className="mt-6" onClick={create} disabled={busy || !canCreate || !inputUrl.trim()}>
        {busy ? "Creating..." : "Create run"}
      </Button>
    </Card>
  );
}
