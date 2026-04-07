"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function NewHuntPage() {
  const [name, setName] = useState("");
  const [inputUrl, setInputUrl] = useState("");
  const [autopilot, setAutopilot] = useState(true);
  const [maxPages, setMaxPages] = useState(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function create() {
    setBusy(true);
    setError(null);
    const response = await fetch("/api/hunts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, inputUrl, autopilot, maxPages })
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
      <p className="mt-2 text-sm text-muted">Paste a LinkedIn people search results URL.</p>

      <label className="mb-2 mt-6 block text-xs font-semibold uppercase tracking-wider text-slate-500">Run name</label>
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="NL HR leaders - week 14" />

      <label className="mb-2 mt-4 block text-xs font-semibold uppercase tracking-wider text-slate-500">LinkedIn search URL</label>
      <Input
        value={inputUrl}
        onChange={(e) => setInputUrl(e.target.value)}
        placeholder="https://www.linkedin.com/search/results/people/?..."
      />

      <label className="mb-2 mt-4 block text-xs font-semibold uppercase tracking-wider text-slate-500">Max pages</label>
      <Input type="number" min={1} max={50} value={maxPages} onChange={(e) => setMaxPages(Number(e.target.value))} />

      <label className="mt-4 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={autopilot} onChange={(e) => setAutopilot(e.target.checked)} />
        Autopilot send after eligibility checks
      </label>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <Button className="mt-6" onClick={create} disabled={busy}>
        {busy ? "Creating..." : "Create run"}
      </Button>
    </Card>
  );
}
