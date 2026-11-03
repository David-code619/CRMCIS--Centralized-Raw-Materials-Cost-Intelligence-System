import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { setAuthCookie, clearAuthCookie } from "../lib/cookieUtils.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export { clearAuthCookie };

const JWT_SECRET = process.env.JWT_SECRET || "crmcis-secret-key-2024";

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email?.toLowerCase().trim();
  
  if (!normalizedEmail || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { branch: true },
  });

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  if (!user.isActive) {
    return res.status(403).json({
      error: "Account is deactivated. Please contact your administrator.",
    });
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: "24h" },
  );

  setAuthCookie(res, req, token);

  const userWithoutPassword = { ...user };
  delete userWithoutPassword.password;
  res.json({ ...userWithoutPassword, token });
});

export const logout = (req, res) => {
  clearAuthCookie(req, res);
  res.json({ message: "Logged out successfully" });
};

export const getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { branch: true },
  });
  if (!user) return res.status(404).json({ error: "User not found" });

  const userWithoutPassword = { ...user };
  delete userWithoutPassword.password;
  res.json(userWithoutPassword);
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: "New passwords do not match" });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const isPasswordValid = await bcrypt.compare(
    currentPassword,
    user.password,
  );
  if (!isPasswordValid) {
    return res.status(401).json({ error: "Invalid current password" });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashedPassword },
  });

  res.json({ message: "Password updated successfully" });
});
