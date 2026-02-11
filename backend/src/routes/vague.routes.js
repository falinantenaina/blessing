import express from "express";
import {
  createVague,
  deleteVague,
  getEtudiantsByVague,
  getInscriptions,
  getPlanning,
  getPlanningEnseignant,
  getVagueById,
  getVagues,
  refreshInscritCount,
  updateVague,
} from "../controllers/vague.controller.js";
import {
  authenticate,
  isAdminOrSecretaire,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// ============================================
// ROUTES PUBLIQUES (sans authentification)
// ============================================

router.get("/", getVagues);
router.get("/planning", getPlanning);
router.get("/:id", getVagueById);

// ============================================
// ROUTES PROTÉGÉES (authentification requise)
// ============================================

// Toutes les routes suivantes nécessitent une authentification
router.use(authenticate);

// Routes générales (tous les utilisateurs authentifiés)
router.get("/enseignant/:enseignantId/planning", getPlanningEnseignant);

// ✅ NOUVEAU : Obtenir les inscriptions d'une vague (pour modal frontend)
// Accessible à tous les utilisateurs authentifiés
router.get("/:id/inscriptions", getInscriptions);

// ============================================
// ROUTES ADMIN/SECRÉTAIRE
// ============================================

// Création, modification, suppression (admin/secrétaire uniquement)
router.post("/", isAdminOrSecretaire, createVague);
router.put("/:id", isAdminOrSecretaire, updateVague);
router.delete("/:id", isAdminOrSecretaire, deleteVague);

// Liste des étudiants avec pagination et filtres
router.get("/:id/etudiants", isAdminOrSecretaire, getEtudiantsByVague);

// ✅ NOUVEAU : Recalculer manuellement le compteur d'inscrits
router.post("/:id/refresh-count", isAdminOrSecretaire, refreshInscritCount);

export default router;
