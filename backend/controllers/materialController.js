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
import { asyncHandler } from "../middleware/asyncHandler.js";

// Global Catalog Controllers
export const getCatalog = asyncHandler(async (req, res) => {
  const materials = await getMaterialCatalog(req.filters, req.pagination);
  res.json(materials);
});

export const addMaterial = asyncHandler(async (req, res) => {
  const material = await createMaterial(req.body);
  res.status(201).json(material);
});

export const editMaterial = asyncHandler(async (req, res) => {
  const material = await updateMaterial(req.params.id, req.body);
  res.json(material);
});

export const removeMaterial = asyncHandler(async (req, res) => {
  await deleteMaterial(req.params.id);
  res.status(204).end();
});

// Branch Material Controllers
export const getBranchStats = asyncHandler(async (req, res) => {
  const stats = await getGlobalBranchMaterialStats(req.filters || req.query);
  res.json(stats);
});

export const getBreakdown = asyncHandler(async (req, res) => {
  const breakdown = await getBranchMaterialBreakdown(req.params.materialId);
  res.json(breakdown);
});

export const listBranchMaterials = asyncHandler(async (req, res) => {
  const materials = await getBranchMaterials(req.filters, req.pagination);
  res.json(materials);
});

export const getSpecificBranchMaterials = asyncHandler(async (req, res) => {
  const branchId = req.params.id;
  if (req.user.role !== "SUPER_ADMIN" && req.user.branchId !== branchId) {
    return res.status(403).json({ error: "Forbidden: You can only access your own branch's materials" });
  }

  const materials = await getBranchMaterials(branchId, req.filters, req.pagination);
  res.json(materials);
});

export const linkMaterialToBranch = asyncHandler(async (req, res) => {
  const data = { 
    ...req.body, 
    branchId: req.branchId || req.body.branchId 
  };
  const material = await addMaterialToBranch(data);
  res.status(201).json(material);
});

export const updateBranchLink = asyncHandler(async (req, res) => {
  const material = await updateBranchMaterial(req.params.id, req.body);
  res.json(material);
});

export const deleteBranchLink = asyncHandler(async (req, res) => {
  await deleteBranchMaterial(req.params.id);
  res.status(204).end();
});
