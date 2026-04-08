"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Template = {
  id: string;
  name: string;
  body: string;
  isDefault: boolean;
};

export default function SettingsTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadTemplates() {
      const response = await fetch("/api/settings/templates");
      const json = (await response.json()) as { templates?: Template[]; error?: string };
      if (!response.ok) {
        setMessage(json.error || "Failed to load templates.");
        return;
      }
      setTemplates(json.templates || []);
      if (json.templates?.length === 0) {
        setIsDefault(true);
      }
    }

    loadTemplates().catch(() => setMessage("Failed to load templates."));
  }, []);

  async function createTemplate() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/settings/templates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, body, isDefault })
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(json.error || "Failed to create template.");
        return;
      }
      setName("");
      setBody("");
      setIsDefault(false);
      setMessage("Template saved.");
      const refreshed = await fetch("/api/settings/templates");
      const refreshedJson = (await refreshed.json()) as { templates?: Template[] };
      setTemplates(refreshedJson.templates || []);
    } catch {
      setMessage("Failed to create template.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="max-w-3xl">
        <h1 className="section-title">Message Templates</h1>
        <p className="mt-2 text-sm text-muted">Create reusable LinkedIn outreach messages for autopilot runs.</p>

        <label className="mb-2 mt-6 block text-xs font-semibold uppercase tracking-wider text-slate-500">Template name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="CEO outreach - direct intro" />

        <label className="mb-2 mt-4 block text-xs font-semibold uppercase tracking-wider text-slate-500">Message body</label>
        <textarea
          className="min-h-[140px] w-full rounded-[var(--ds-radius-lg)] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-[var(--ds-shadow-soft)] outline-none transition focus:border-sky-400"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Hi {{firstName}}, I came across your profile and wanted to reach out..."
        />

        <label className="mt-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
          Make this my default template
        </label>

        {message ? <p className="mt-3 text-sm text-muted">{message}</p> : null}
        <Button className="mt-5" onClick={createTemplate} disabled={busy || !name.trim() || !body.trim()}>
          {busy ? "Saving..." : "Save template"}
        </Button>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold">Saved Templates</h2>
        <div className="mt-4 space-y-3">
          {templates.length === 0 ? (
            <p className="text-sm text-muted">No templates yet. Create one above to unlock autopilot hunt creation.</p>
          ) : (
            templates.map((template) => (
              <div key={template.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-800">{template.name}</p>
                  {template.isDefault ? <span className="text-xs font-semibold uppercase tracking-wider text-sky-600">Default</span> : null}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{template.body}</p>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
