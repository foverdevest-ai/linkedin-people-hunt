import { User } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { verifyExtensionSessionToken } from "@/lib/auth/extension-token";

async function getSessionUser() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

async function getExtensionUser(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  const payload = verifyExtensionSessionToken(token);
  if (!payload) return null;
  return prisma.user.findUnique({ where: { id: payload.userId } });
}

export async function requireActorOrExtensionUser(request: Request): Promise<User> {
  const sessionUser = await getSessionUser();
  if (sessionUser?.isActive) return sessionUser;
  const extensionUser = await getExtensionUser(request);
  if (extensionUser?.isActive) return extensionUser;
  throw new Error("Unauthorized");
}
