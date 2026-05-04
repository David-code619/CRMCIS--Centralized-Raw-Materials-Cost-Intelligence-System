import { 
  getMaterialCatalog, 
  createMaterial, 
  updateMaterial, 
  deleteMaterial 
} from "../lib/materialService.js";
import { 
  getBranchMaterials, 
  addMaterialToBranch, 
  updateBranchMaterial, 
  deleteBranchMaterial,
  getGlobalBranchMaterialStats,
  getBranchMaterialBreakdown
} from "../lib/branchMaterialService.js";

// Catalog Controllers
export const getCatalog = async (req, res) => {
  try {
    const materials = await getMaterialCatalog(req.query, req.query);
    res.json(materials);
  } catch (error) {
    console.error("Failed to fetch materials:", error);
    res.status(500).json({ error: "Failed to fetch materials" });
  }
};

export const addMaterial = async (req, res) => {
  try {
    const material = await createMaterial(req.body);
    res.status(201).json(material);
  } catch (error) {
    console.error("Failed to create material:", error);
    res.status(500).json({ error: "Failed to create material" });
  }
};

export const editMaterial = async (req, res) => {
  try {
    const material = await updateMaterial(req.params.id, req.body);
    res.json(material);
  } catch (error) {
    console.error("Failed to update material:", error);
    res.status(500).json({ error: "Failed to update material" });
  }
};

export const removeMaterial = async (req, res) => {
  try {
    await deleteMaterial(req.params.id);
    res.status(204).end();
  } catch (error) {
    console.error("Failed to delete material:", error);
    res.status(500).json({ error: "Failed to delete material" });
  }
};

// Branch Material Controllers
export const getBranchStats = async (req, res) => {
  try {
    const stats = await getGlobalBranchMaterialStats(req.query);
    res.json(stats);
  } catch (error) {
    console.error("Error fetching global branch material stats:", error);
    res.status(500).json({ error: "Failed to fetch branch material stats" });
  }
};

export const getBreakdown = async (req, res) => {
  try {
    const breakdown = await getBranchMaterialBreakdown(req.params.materialId);
    res.json(breakdown);
  } catch (error) {
    console.error("Error fetching branch material breakdown:", error);
    res.status(500).json({ error: "Failed to fetch branch material breakdown" });
  }
};

export const listBranchMaterials = async (req, res) => {
  let { branchId } = req.query;
  if (req.user.role !== "SUPER_ADMIN") {
    branchId = req.user.branchId;
  }
  try {
    const materials = await getBranchMaterials(branchId, req.query, req.query);
    res.json(materials);
  } catch (error) {
    console.error("Failed to fetch branch materials:", error);
    res.status(500).json({ error: "Failed to fetch branch materials" });
  }
};

export const getSpecificBranchMaterials = async (req, res) => {
  let branchId = req.params.id;
  if (req.user.role !== "SUPER_ADMIN" && req.user.branchId !== branchId) {
    return res.status(403).json({ error: "Forbidden: You can only access your own branch's materials" });
  }
  try {
    const materials = await getBranchMaterials(branchId, req.query, req.query);
    res.json(materials);
  } catch (error) {
    console.error("Error fetching branch materials:", error);
    res.status(500).json({ error: "Failed to fetch branch materials" });
  }
};

export const linkMaterialToBranch = async (req, res) => {
  const data = { ...req.body };
  if (req.user.role !== "SUPER_ADMIN") {
    data.branchId = req.user.branchId;
  }
  try {
    const material = await addMaterialToBranch(data);
    res.status(201).json(material);
  } catch (error) {
    console.error("Failed to add material to branch:", error);
    res.status(500).json({ error: "Failed to add material to branch" });
  }
};

export const updateBranchLink = async (req, res) => {
  try {
    const material = await updateBranchMaterial(req.params.id, req.body);
    res.json(material);
  } catch (error) {
    console.error("Failed to update branch material:", error);
    res.status(500).json({ error: "Failed to update branch material" });
  }
};

export const deleteBranchLink = async (req, res) => {
  try {
    await deleteBranchMaterial(req.params.id);
    res.status(204).end();
  } catch (error) {
    console.error("Failed to delete branch material:", error);
    res.status(500).json({ error: "Failed to delete branch material" });
  }
};
