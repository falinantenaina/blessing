import express from "express";
import {
  addPaiement,
  createInscriptionComplete,
  getInscriptionDetails,
  getInscriptionsByEtudiant,
  getInscriptionStats,
  getPendingInscriptions,
  updateLivreStatut,
  validerInscription,
} from "../controllers/inscription.controller.js";
import {
  authenticate,
  isAdmin,
  isAdminOrSecretaire,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes protégées (admin/secrétaire uniquement)
router.post("/direct", isAdminOrSecretaire, createInscriptionComplete);
router.get("/stats", isAdminOrSecretaire, getInscriptionStats);
router.get("/pending", isAdminOrSecretaire, getPendingInscriptions);
router.get("/:id", getInscriptionDetails);
router.post("/paiements", isAdminOrSecretaire, addPaiement);
router.patch(
  "/:inscriptionId/livres/:typeLivre",
  isAdminOrSecretaire,
  updateLivreStatut,
);

// Route de validation (admin uniquement)
router.put("/:id/valider", isAdmin, validerInscription);

// Route accessible par les étudiants pour leurs propres inscriptions
router.get("/student/:id", getInscriptionsByEtudiant);

export default router;
