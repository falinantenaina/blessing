import express from "express";
import {
  getJourById,
  getJours,
  getJoursWithStats,
  updateJour,
} from "../controllers/jour.controller.js";
import {
  authenticate,
  isAdminOrSecretaire,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes publiques (lecture)
router.get("/", getJours);
router.get("/stats", getJoursWithStats);
router.get("/:id", getJourById);

// Routes protégées (admin/secrétaire uniquement)
router.put("/:id", isAdminOrSecretaire, updateJour);

export default router;
