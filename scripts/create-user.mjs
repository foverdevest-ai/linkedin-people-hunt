import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const [, , email, password, name = "Internal Rep", role = "admin"] = process.argv;

if (!email || !password) {
  console.error("Usage: node scripts/create-user.mjs <email> <password> [name] [admin|rep]");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 10);

await prisma.user.upsert({
  where: { email },
  update: {
    name,
    passwordHash: hash,
    role: role === "rep" ? "rep" : "admin",
    isActive: true
  },
  create: {
    email,
    name,
    passwordHash: hash,
    role: role === "rep" ? "rep" : "admin",
    isActive: true
  }
});

console.log(`User created/updated: ${email}`);
await prisma.$disconnect();
