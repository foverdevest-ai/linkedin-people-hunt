import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button, buttonClass } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function HuntDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = await prisma.huntRun.findUnique({
    where: { id },
    include: {
      prospects: {
        orderBy: { createdAt: "desc" },
        take: 20
      }
    }
  });
  if (!run) notFound();

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between">
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
        <div className="mt-4 flex gap-3">
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
