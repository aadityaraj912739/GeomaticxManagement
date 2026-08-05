import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/registry.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

const authResponse = user => ({
  token: jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "8h" }),
  user: { id: user.id, name: user.name, email: user.email, role: user.role }
});

router.post("/login", async (req, res, next) => {
  try {
    const body = z.object({ email: z.string().email(), password: z.string().min(8) }).parse(req.body);
    const user = await User.findOne({ where: { email: body.email.toLowerCase(), active: true } });
    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) return res.status(401).json({ message: "Invalid credentials" });
    res.json(authResponse(user));
  } catch (e) { next(e); }
});
router.post("/register", async (req, res, next) => {
  try {
    const body = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(10) }).parse(req.body);
    const email = body.email.toLowerCase();
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ message: "An account with this email already exists" });
    const user = await User.create({
      name: body.name.trim(),
      email,
      passwordHash: await bcrypt.hash(body.password, 12),
      role: "EMPLOYEE",
      active: true
    });
    res.status(201).json(authResponse(user));
  } catch (e) { next(e); }
});
router.get("/me", authenticate, (req, res) => res.json(req.user));
export default router;
