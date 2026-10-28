/**
 * Cookie Utilities for Authentication
 * 
 * Centralizes cookie configuration, setting, and clearing.
 * Prevents cyclic dependencies between middleware and controllers.
 */

export const getCookieMode = (req) => {
  const isSecureRequest =
    req.secure ||
    req.headers["x-forwarded-proto"] === "https" ||
    process.env.NODE_ENV === "production";
  return {
    secure: isSecureRequest,
    sameSite: isSecureRequest ? "none" : "lax",
  };
};

export const setAuthCookie = (res, req, token, maxAge = 24 * 60 * 60 * 1000) => {
  const mode = getCookieMode(req);
  res.cookie("token", token, {
    httpOnly: true,
    secure: mode.secure,
    sameSite: mode.sameSite,
    path: "/",
    maxAge,
  });
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

  // Also clear the alternative mode to avoid mismatches across environments/proxies.
  res.clearCookie("token", {
    httpOnly: true,
    secure: !mode.secure,
    sameSite: mode.sameSite === "none" ? "lax" : "none",
    path: "/",
  });
};
