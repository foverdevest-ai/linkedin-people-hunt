import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";

export default async function SettingsSalesforcePage() {
  const session = await auth();
  const user = session?.user?.id
    ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { salesforceOwnerId: true } })
    : null;

  return (
    <Card>
      <h1 className="section-title">Salesforce Settings</h1>
      <p className="mt-2 text-sm text-muted">
        Salesforce ownership uses your mapped OwnerId. Current mapping: {user?.salesforceOwnerId || "not set"}.
      </p>
      <p className="mt-3 text-sm text-muted">LeadSource is always forced to LinkedIn for manual pushes from replies queue.</p>
    </Card>
  );
}
