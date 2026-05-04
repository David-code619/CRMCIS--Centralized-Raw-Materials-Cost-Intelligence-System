import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

const JWT_SECRET = process.env.JWT_SECRET || "crmcis-secret-key-2024";

// --- PRISMA TIMEOUT HELPER ---
export const withTimeout = (promise, timeoutMs = 10000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Database operation timed out")),
        timeoutMs,
      ),
    ),
  ]);
};

// --- AUTHENTICATION MIDDLEWARE ---
export const authenticate = async (req, res, next) => {
  console.log(`[AUTH] Authenticating request to ${req.path}`);
  const authHeader = req.headers.authorization;
  const bearerToken =
    typeof authHeader === "string" &&
    authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : null;
  const token = bearerToken || req.cookies.token;

  if (!token) {
    console.log(`[AUTH] No token found for ${req.path}`);
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log(`[AUTH] Token verified for user ${decoded.id}, checking DB...`);
    // Verify user still exists in the database
    const user = await withTimeout(
      prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, role: true, branchId: true, email: true },
      }),
      5000,
    );

    if (!user) {
      console.log(`[AUTH] User ${decoded.id} not found in DB, clearing cookie`);
      clearAuthCookie(req, res);
      return res
        .status(401)
        .json({ error: "User no longer exists. Please log in again." });
    }
    console.log(`[AUTH] User ${user.email} authenticated successfully`);
    req.user = user;
    next();
  } catch (error) {
    if (error?.message === "Database operation timed out") {
      console.error(
        `[AUTH] Database timeout while authenticating ${req.path}; preserving session cookie`,
      );
      return res.status(503).json({ error: "Database busy" });
    }
    console.error(
      `[AUTH] Authentication error for ${req.path}:`,
      error.message,
    );
    if (!bearerToken) {
      clearAuthCookie(req, res);
    }
    res.status(401).json({
      error:
        error.message === "Database operation timed out"
          ? "Database busy"
          : "Invalid token",
    });
  }
};

export const authorize = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
};
