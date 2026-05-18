import { prisma } from "../lib/prisma.js";

export const createBranch = async (req, res) => {
  if (req.user.role !== "SUPER_ADMIN") {
    return res
      .status(403)
      .json({ error: "Forbidden: Only Super Admins can create branches" });
  }

  try {
    const { name, location, contactInfo } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Branch name is required" });
    }

    const branch = await prisma.branch.create({
      data: { name, location, contactInfo },
    });

    res.status(201).json(branch);
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({ error: "A branch with this name already exists" });
    }
    console.error("Failed to create branch:", error);
    res.status(500).json({ error: "Failed to create branch" });
  }
};

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
