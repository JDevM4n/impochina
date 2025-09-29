// sourcing/api/src/auth.js
import jwt from "jsonwebtoken";

// Config por env
const STRATEGY = (process.env.AUTH_STRATEGY || "optional").toLowerCase(); // "jwt" | "optional"
const ALG = process.env.JWT_ALG || "HS256";
const SECRET = process.env.JWT_SECRET || "mysecretkey"; // debe coincidir con SECRET_KEY del micro de login

function parseBearer(req) {
  const h = req.headers?.authorization || "";
  if (!h.startsWith("Bearer ")) return null;
  return h.slice(7);
}

export function getUserFromAuth(req) {
  try {
    const token = parseBearer(req);
    if (!token) return null;
    const decoded = jwt.verify(token, SECRET, { algorithms: [ALG] });

    // Tu login pone 'username' en el payload
    const username = decoded?.username;
    if (!username) return null;

    return { id: String(username), name: String(username) };
  } catch (_e) {
    return null;
  }
}

export function requireAuth(req, res, next) {
  const u = getUserFromAuth(req);
  if (!u) return res.status(401).json({ error: "invalid_or_missing_token" });
  req.user = u;
  next();
}

export function optionalAuth(req, _res, next) {
  const u = getUserFromAuth(req);
  if (u) req.user = u;
  next();
}

// Este es el que importas en index.js
export const maybeRequireAuth = STRATEGY === "jwt" ? requireAuth : optionalAuth;
