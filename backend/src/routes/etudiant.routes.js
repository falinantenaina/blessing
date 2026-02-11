import express from "express";
import {
  createEtudiant,
  deleteEtudiant,
  getEtudiantById,
  getEtudiants,
  getEtudiantStats,
  getEtudiantsWithDetails,
  toggleEtudiantActive,
  updateEtudiant,
} from "../controllers/etudiant.controller.js";
import {
  authenticate,
  isAdminOrSecretaire,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes protégées (admin/secrétaire uniquement)
router.get("/", isAdminOrSecretaire, getEtudiants);
router.get("/stats", isAdminOrSecretaire, getEtudiantStats);
router.get("/details", isAdminOrSecretaire, getEtudiantsWithDetails);

router.get("/:id", isAdminOrSecretaire, getEtudiantById);
router.post("/", isAdminOrSecretaire, createEtudiant);
router.put("/:id", isAdminOrSecretaire, updateEtudiant);
router.delete("/:id", isAdminOrSecretaire, deleteEtudiant);
router.patch("/:id/toggle", isAdminOrSecretaire, toggleEtudiantActive);

export default router;
