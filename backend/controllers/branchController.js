import { prisma } from "../lib/prisma.js";

export const getBranches = async (req, res) => {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: { name: "asc" },
    });
    res.json(branches);
  } catch (error) {
    console.error("Failed to fetch branches:", error);
    res.status(500).json({ error: "Failed to fetch branches" });
  }
};
