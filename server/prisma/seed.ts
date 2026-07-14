import { PrismaClient, Role } from "@prisma/client";
import { hashValue } from "../src/lib/bcrypt";

const prisma = new PrismaClient();

async function main() {
  const DEFAULT_PASSWORD = "Password@123";

  const hashedPassword = await hashValue(DEFAULT_PASSWORD);

  // ---------------------------
  // Admin
  // ---------------------------
  await prisma.user.upsert({
    where: {
      email: "admin@expenseflow.com",
    },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@expenseflow.com",
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  // ---------------------------
  // Senior Manager
  // ---------------------------
  const seniorManager = await prisma.user.upsert({
    where: {
      email: "senior@expenseflow.com",
    },
    update: {},
    create: {
      name: "Senior Manager",
      email: "senior@expenseflow.com",
      password: hashedPassword,
      role: Role.SENIOR_MANAGER,
    },
  });

  // ---------------------------
  // Manager
  // ---------------------------
  const manager = await prisma.user.upsert({
    where: {
      email: "manager@expenseflow.com",
    },
    update: {},
    create: {
      name: "Finance Manager",
      email: "manager@expenseflow.com",
      password: hashedPassword,
      role: Role.MANAGER,
      reportsToId: seniorManager.id,
    },
  });

  // ---------------------------
  // Employee
  // ---------------------------
  await prisma.user.upsert({
    where: {
      email: "employee@expenseflow.com",
    },
    update: {},
    create: {
      name: "John Employee",
      email: "employee@expenseflow.com",
      password: hashedPassword,
      role: Role.EMPLOYEE,
      reportsToId: manager.id,
    },
  });

  console.log("✅ Seed completed successfully");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
