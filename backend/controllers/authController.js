import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";

const JWT_SECRET = process.env.JWT_SECRET || "crmcis-secret-key-2024";

const getCookieMode = (req) => {
  const isSecureRequest =
    req.secure ||
    req.headers["x-forwarded-proto"] === "https" ||
    process.env.NODE_ENV === "production";
  return {
    secure: isSecureRequest,
    sameSite: isSecureRequest ? "none" : "lax",
  };
};


export const clearAuthCookie = (req, res) => {
  const mode = getCookieMode(req);

  // Clear using the mode for this request.
  res.clearCookie("token", {
    httpOnly: true,
    secure: mode.secure,
    sameSite: mode.sameSite,
    path: "/",
  });

  // Also clear the other common mode to avoid mismatches across deployments/config changes.
  res.clearCookie("token", {
    httpOnly: true,
    secure: !mode.secure,
    sameSite: mode.sameSite === "none" ? "lax" : "none",
    path: "/",
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const normalizedEmail = email?.toLowerCase().trim();
    console.log(`Login attempt for: ${normalizedEmail}`);
    if (!normalizedEmail || !password) {
      console.log(`Login failed: Missing email or password`);
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { branch: true },
    });

    if (!user) {
      console.log(`Login failed: User not found for ${normalizedEmail}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log(`Login failed: Invalid password for ${normalizedEmail}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.isActive) {
      console.log(`Login failed: Account deactivated for ${normalizedEmail}`);
      return res
        .status(403)
        .json({
          error: "Account is deactivated. Please contact your administrator.",
        });
    }
    console.log(`Login successful for: ${normalizedEmail}, role: ${user.role}`);
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

    const { secure: cookieSecure, sameSite: cookieSameSite } = getCookieMode(req);
    res.cookie("token", token, {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: cookieSameSite,
      path: "/",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;
    res.json({ ...userWithoutPassword, token });
  } catch (error) {
    console.error(`Login error:`, error);
    res.status(500).json({ error: "Authentication failed" });
  }
};

export const logout = (req, res) => {
  clearAuthCookie(req, res);
  res.json({ message: "Logged out successfully" });
};

export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { branch: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;
    res.json(userWithoutPassword);
  } catch (_error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  try {
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
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Failed to update password" });
  }
};
