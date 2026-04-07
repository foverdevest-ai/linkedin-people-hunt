import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-800">{value}</p>
    </Card>
  );
}

export default async function DashboardPage() {
  const [runCount, prospectCount, eligible, sent, replies, pushed, skippedSf] = await Promise.all([
    prisma.huntRun.count(),
    prisma.huntProspect.count(),
    prisma.huntProspect.count({ where: { messagingStatus: "queued" } }),
    prisma.huntProspect.count({ where: { messagingStatus: "sent" } }),
    prisma.huntProspect.count({ where: { messagingStatus: "replied" } }),
    prisma.huntProspect.count({ where: { messagingStatus: "pushed_to_salesforce" } }),
    prisma.huntProspect.count({ where: { messagingStatus: "skipped_existing_salesforce" } })
  ]);

  const perUser = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      _count: { select: { prospects: true, huntRuns: true } }
    },
    orderBy: { name: "asc" }
  });

  return (
    <div className="space-y-6">
      <h1 className="section-title">Activation Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Hunt runs" value={runCount} />
        <Stat label="Imported people" value={prospectCount} />
        <Stat label="Eligible to send" value={eligible} />
        <Stat label="Sent" value={sent} />
        <Stat label="Replies" value={replies} />
        <Stat label="Pushed to Salesforce" value={pushed} />
        <Stat label="Skipped existing Salesforce" value={skippedSf} />
      </div>
      <Card>
        <h2 className="text-xl font-semibold text-slate-800">Per user</h2>
        <div className="mt-4 space-y-2">
          {perUser.map((row) => (
            <div key={row.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
              <p className="font-semibold">{row.name}</p>
              <div className="flex gap-2">
                <Badge variant="info">Runs {row._count.huntRuns}</Badge>
                <Badge variant="neutral">Prospects {row._count.prospects}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
