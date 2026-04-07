import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow
} from "@/components/ui/data-table";

export const dynamic = "force-dynamic";

export default async function HuntsPage() {
  const hunts = await prisma.huntRun.findMany({
    include: { _count: { select: { prospects: true } } },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="section-title">Hunt Runs</h1>
        <Link href="/hunts/new" className={buttonClass({ variant: "primary" })}>
          New Hunt
        </Link>
      </div>
      <DataTable className="table-surface">
        <DataTableHead>
          <DataTableRow>
            <DataTableHeaderCell>Run</DataTableHeaderCell>
            <DataTableHeaderCell>Status</DataTableHeaderCell>
            <DataTableHeaderCell>Autopilot</DataTableHeaderCell>
            <DataTableHeaderCell>Prospects</DataTableHeaderCell>
            <DataTableHeaderCell>Created</DataTableHeaderCell>
          </DataTableRow>
        </DataTableHead>
        <DataTableBody>
          {hunts.map((run) => (
            <DataTableRow key={run.id}>
              <DataTableCell>
                <Link href={`/hunts/${run.id}`} className="font-semibold text-[var(--ds-color-brand-link)]">
                  {run.name || "Untitled run"}
                </Link>
                <p className="text-xs text-muted">{run.inputUrl}</p>
              </DataTableCell>
              <DataTableCell>{run.status}</DataTableCell>
              <DataTableCell>{run.autopilot ? "On" : "Off"}</DataTableCell>
              <DataTableCell>{run._count.prospects}</DataTableCell>
              <DataTableCell>{run.createdAt.toLocaleString()}</DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
    </Card>
  );
}
