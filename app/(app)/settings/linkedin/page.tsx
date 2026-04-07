import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { LinkedInConnectPanel } from "./LinkedInConnectPanel";

export default async function SettingsLinkedInPage() {
  const session = await auth();
  const connection = session?.user?.id
    ? await prisma.linkedInConnection.findUnique({
        where: { userId_providerType: { userId: session.user.id, providerType: "browser_extension" } }
      })
    : null;

  return (
    <Card>
      <LinkedInConnectPanel
        initial={{
          status: connection?.status || "disconnected",
          lastSeenAt: connection?.lastSeenAt?.toISOString() || null,
          lastSyncAt: connection?.lastSyncAt?.toISOString() || null
        }}
      />
    </Card>
  );
}
