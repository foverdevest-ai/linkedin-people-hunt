import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SettingsLinkedInPage() {
  const session = await auth();
  const connection = session?.user?.id
    ? await prisma.linkedInConnection.findUnique({
        where: { userId_providerType: { userId: session.user.id, providerType: "browser_extension" } }
      })
    : null;

  return (
    <Card>
      <h1 className="section-title">LinkedIn Connection</h1>
      <p className="mt-2 text-sm text-muted">Connect via Chrome extension handshake.</p>
      <div className="mt-4 flex gap-2">
        <Badge variant={connection?.status === "connected" ? "success" : "warning"}>
          {connection?.status || "disconnected"}
        </Badge>
        <Badge variant="neutral">Last seen: {connection?.lastSeenAt?.toLocaleString() || "-"}</Badge>
        <Badge variant="neutral">Last sync: {connection?.lastSyncAt?.toLocaleString() || "-"}</Badge>
      </div>
    </Card>
  );
}
