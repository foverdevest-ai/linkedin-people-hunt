import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow
} from "@/components/ui/data-table";

export const dynamic = "force-dynamic";

export default async function HuntReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = await prisma.huntRun.findUnique({
    where: { id },
    include: {
      prospects: {
        orderBy: [{ messagingStatus: "asc" }, { score: "desc" }]
      }
    }
  });
  if (!run) notFound();

  return (
    <Card>
      <h1 className="section-title">Review Prospects</h1>
      <p className="mt-2 text-sm text-muted">Run: {run.name || run.id}</p>
      <DataTable className="table-surface mt-5">
        <DataTableHead>
          <DataTableRow>
            <DataTableHeaderCell>Person</DataTableHeaderCell>
            <DataTableHeaderCell>Company</DataTableHeaderCell>
            <DataTableHeaderCell>Status</DataTableHeaderCell>
            <DataTableHeaderCell>Score</DataTableHeaderCell>
            <DataTableHeaderCell>Skip reason</DataTableHeaderCell>
          </DataTableRow>
        </DataTableHead>
        <DataTableBody>
          {run.prospects.map((prospect) => (
            <DataTableRow key={prospect.id}>
              <DataTableCell>
                <p className="font-semibold">{prospect.fullName || "Unknown"}</p>
                <a href={prospect.normalizedProfileUrl} className="text-xs text-[var(--ds-color-brand-link)]" target="_blank" rel="noreferrer">
                  Profile
                </a>
              </DataTableCell>
              <DataTableCell>{prospect.companyName || "Unknown"}</DataTableCell>
              <DataTableCell>
                <Badge variant="neutral">{prospect.messagingStatus}</Badge>
              </DataTableCell>
              <DataTableCell>{prospect.score ?? 0}</DataTableCell>
              <DataTableCell>{prospect.skipReason || "-"}</DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
    </Card>
  );
}
