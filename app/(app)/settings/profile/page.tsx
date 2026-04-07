import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function SettingsProfilePage() {
  const session = await auth();
  const user = session?.user?.id
    ? await prisma.user.findUnique({ where: { id: session.user.id } })
    : null;

  return (
    <Card className="max-w-2xl">
      <h1 className="section-title">Profile Settings</h1>
      <form action="/api/settings/profile" method="post" className="mt-5 space-y-4">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Name</label>
          <Input name="name" defaultValue={user?.name || ""} />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Salesforce Owner Id</label>
          <Input name="salesforceOwnerId" defaultValue={user?.salesforceOwnerId || ""} />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Signup tracking code</label>
          <Input name="signupTrackingCode" defaultValue={user?.signupTrackingCode || ""} />
        </div>
        <Button type="submit">Save profile</Button>
      </form>
    </Card>
  );
}
