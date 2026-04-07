import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function requireActorUser() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) throw new Error("Unauthorized");
  return user;
}
