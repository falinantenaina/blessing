import express from "express";
import {
  getVaguesDisponibles,
  inscriptionPublique,
  verifierInscription,
} from "../controllers/inscription-publique.controller.js";

const router = express.Router();

router.get("/vagues-disponibles", getVaguesDisponibles);

// Inscription publique
router.post("/inscrire", inscriptionPublique);

// Status

router.get("/verifier/:telephone", verifierInscription);

export default router;
