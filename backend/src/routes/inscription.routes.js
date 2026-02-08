import express from "express";
import {
  addPaiement,
  createInscriptionComplete,
  getInscriptionDetails,
  getInscriptionsByEtudiant,
  getInscriptionStats,
  updateLivreStatut,
} from "../controllers/inscription.controller.js";
import {
  authenticate,
  isAdminOrSecretaire,
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/public", createInscriptionComplete);

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes protégées (admin/secrétaire uniquement)
router.post("/direct", isAdminOrSecretaire, createInscriptionComplete);
router.get("/stats", isAdminOrSecretaire, getInscriptionStats);
router.get("/:id", getInscriptionDetails);
router.post("/paiements", isAdminOrSecretaire, addPaiement);
router.patch(
  "/:inscriptionId/livres/:numeroLivre",
  isAdminOrSecretaire,
  updateLivreStatut,
);

// Route accessible par les étudiants pour leurs propres inscriptions
router.get("/student/:id", getInscriptionsByEtudiant);

export default router;
