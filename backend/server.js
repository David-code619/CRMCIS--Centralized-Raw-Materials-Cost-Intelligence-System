import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from 'cors';
import apiRoutes from "./routes/index.js";


const PORT = process.env.PORT || 3000;

const allowedFrontendUrl = (() => {
  const url = process.env.FRONTEND_URL;
  if (!url) return "https://crmcis.vercel.app";
  return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
})();

const app = express();

// Trust proxy headers so req.secure works correctly behind Render and other HTTPS proxies
app.set('trust proxy', 1);

console.log(`Allowed frontend origin: ${allowedFrontendUrl}`);
const isProd = process.env.NODE_ENV === "production";

app.use(
  cors({
    // When sending cookies (credentials: true), we must NOT use '*' for ACAO.
    // Restrict to known frontend origins; fall back to reflecting the request origin in dev.
    origin: (origin, callback) => {
      const allowlist = new Set([
        allowedFrontendUrl,
        "http://localhost:5173",
      ]);

      // same-origin / server-to-server / curl (no Origin header)
      if (!origin) return callback(null, true);

      if (allowlist.has(origin)) return callback(null, true);

      return callback(new Error(`CORS blocked origin: ${origin}`), false);
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
  // API Routes
  app.use("/api", apiRoutes);

  // Health and Ping at root for compatibility
  app.get("/health", (req, res) => res.redirect("/api/system/health"));
  app.get("/ping", (req, res) => res.redirect("/api/system/ping"));

  // Vite middleware for development

// Global error handler
app.use((err, req, res, next) => {
  console.error(`[Unhandled Error] ${req.method} ${req.path}:`, err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err instanceof Error ? err.message : String(err),
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
