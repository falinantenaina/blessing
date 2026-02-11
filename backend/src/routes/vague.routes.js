import express from "express";
import {
  createVague,
  deleteVague,
  getEtudiantsByVague,
  getPlanning,
  getPlanningEnseignant,
  getVagueById,
  getVagues,
  updateVague,
} from "../controllers/vague.controller.js";
import {
  authenticate,
  isAdminOrSecretaire,
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getVagues);
router.get("/planning", getPlanning);
router.get("/:id", getVagueById);

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes générales

// Planning d'un enseignant
router.get("/enseignant/:enseignantId/planning", getPlanningEnseignant);

// Routes protégées (admin/secrétaire uniquement)
router.post("/", isAdminOrSecretaire, createVague);
router.put("/:id", isAdminOrSecretaire, updateVague);
router.delete("/:id", isAdminOrSecretaire, deleteVague);
// Routes étudiants inscrits
router.get("/:id/etudiants", isAdminOrSecretaire, getEtudiantsByVague);

export default router;
