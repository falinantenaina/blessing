import express from "express";
import {
  getAllPaiements,
  getPaiementById,
  getPaiementStats,
  searchInscriptions,
} from "../controllers/paiement.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// GET /api/paiements/stats          → statistiques financières
router.get("/stats", getPaiementStats);

// GET /api/paiements/search-inscriptions?search=xxx → recherche pour le modal
router.get("/search-inscriptions", searchInscriptions);

// GET /api/paiements                → liste paginée avec filtres
router.get("/", getAllPaiements);

// GET /api/paiements/:id            → détail d'un paiement
router.get("/:id", getPaiementById);

export default router;
