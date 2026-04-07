import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireActorUser } from "@/lib/auth/current-user";

const createTemplateSchema = z.object({
  name: z.string().min(1).max(120),
  body: z.string().min(1),
  isDefault: z.boolean().default(false)
});

export async function GET() {
  try {
    const actor = await requireActorUser();
    const templates = await prisma.messageTemplate.findMany({
      where: { userId: actor.id },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }]
    });
    return NextResponse.json({ templates });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireActorUser();
    const parsed = createTemplateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
    }
    if (parsed.data.isDefault) {
      await prisma.messageTemplate.updateMany({
        where: { userId: actor.id },
        data: { isDefault: false }
      });
    }
    const template = await prisma.messageTemplate.create({
      data: {
        userId: actor.id,
        name: parsed.data.name,
        body: parsed.data.body,
        isDefault: parsed.data.isDefault
      }
    });
    return NextResponse.json(template);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
