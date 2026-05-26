import "server-only";
import { prisma } from "@/lib/db";
import { DEFAULT_AVAILABILITY } from "@/lib/availability";

export const getOrCreateAvailability = async (userId: string) => {
  const existing = await prisma.availability.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.availability.create({
    data: {
      userId,
      weeklyHours: DEFAULT_AVAILABILITY.weeklyHours,
      skipHolidays: DEFAULT_AVAILABILITY.skipHolidays,
    },
  });
};
