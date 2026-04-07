"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false
    });
    if (!result || result.error) {
      setError("Invalid credentials");
      setLoading(false);
      return;
    }
    window.location.href = "/dashboard";
  }

  return (
    <Card className="mx-auto mt-10 max-w-xl p-6 md:p-8 motion-fade-up">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-800">LinkedIn People Hunt Login</h1>
      <p className="mt-2 text-sm text-muted">Use your internal Personeel.com account.</p>
      <label className="mb-2 mt-5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Email</label>
      <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@personeel.com" />
      <label className="mb-2 mt-4 block text-xs font-semibold uppercase tracking-wider text-slate-500">Password</label>
      <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      <Button className="mt-5 w-full" onClick={submit} disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </Button>
    </Card>
  );
}
