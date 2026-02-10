import express from "express";
import {
  createNiveau,
  deleteNiveau,
  getNiveauById,
  getNiveauStats,
  getNiveaux,
  updateNiveau,
} from "../controllers/niveau.controller.js";
import {
  authenticate,
  isAdminOrSecretaire,
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getNiveaux);

router.use(authenticate);

// Routes accessibles à tous les utilisateurs authentifiés

router.get("/stats", getNiveauStats);
router.get("/:id", getNiveauById);

// Routes protégées (admin/secrétaire uniquement)
router.post("/", isAdminOrSecretaire, createNiveau);
router.put("/:id", isAdminOrSecretaire, updateNiveau);
router.delete("/:id", isAdminOrSecretaire, deleteNiveau);

export default router;
