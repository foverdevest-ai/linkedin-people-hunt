import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function RepliesPage() {
  const replied = await prisma.huntProspect.findMany({
    where: { messagingStatus: "replied" },
    orderBy: { repliedAt: "desc" },
    take: 200
  });

  return (
    <Card>
      <h1 className="section-title">Replies Queue</h1>
      <p className="mt-2 text-sm text-muted">Only replied people can be pushed to Salesforce.</p>
      <div className="mt-5 space-y-3">
        {replied.map((person) => (
          <div key={person.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-800">{person.fullName || "Unknown person"}</p>
                <p className="text-sm text-muted">{person.companyName || "Unknown company"}</p>
                <p className="mt-1 text-sm">{person.replySnippet || "No snippet yet."}</p>
                <Badge className="mt-2" variant="info">
                  Replied
                </Badge>
              </div>
              <form action={`/api/prospects/${person.id}/push-salesforce`} method="post">
                <Button type="submit">Push to Salesforce</Button>
              </form>
            </div>
          </div>
        ))}
        {replied.length === 0 ? <p className="text-sm text-muted">No replies yet.</p> : null}
      </div>
    </Card>
  );
}
