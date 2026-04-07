"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const next = nextPath || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: next
    });

    if (!result || result.error) {
      setError("Invalid credentials");
      setLoading(false);
      return;
    }

    window.location.href = next;
  }

  return (
    <Card className="mx-auto max-w-4xl p-6 md:p-8 motion-fade-up">
      <div className="mx-auto mb-8 w-fit text-center motion-fade-in motion-delay-1">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-800">
          <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-sky-500 align-middle" />
          Personeel.com
        </h1>
      </div>

      <Card className="mx-auto max-w-xl motion-fade-up motion-delay-2">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-800">Sign in to your account</h2>
        <p className="mt-2 text-sm text-muted">Use your internal Personeel.com account.</p>
        <div className="my-4 border-t border-dashed border-slate-300/80" />

        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Email</label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@personeel.com" />

        <label className="mb-2 mt-4 block text-xs font-semibold uppercase tracking-wider text-slate-500">Password</label>
        <div className="relative">
          <Input
            className="pr-12"
            placeholder="Enter your password"
            type={visible ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500"
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? "Hide" : "Show"}
          </button>
        </div>

        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

        <Button className="mt-5 w-full" onClick={submit} disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </Card>
    </Card>
  );
}
