import jwt from "jsonwebtoken";
import { User } from "../models/registry.js";

export async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ message: "Authentication required" });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(payload.sub, { attributes: { exclude: ["passwordHash"] } });
    if (!user?.active) return res.status(401).json({ message: "Account unavailable" });
    req.user = user;
    next();
  } catch { res.status(401).json({ message: "Invalid or expired token" }); }
}
export const allow = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ message: "Insufficient permission" });
