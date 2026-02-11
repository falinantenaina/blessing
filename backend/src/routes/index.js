import express from "express";
import authRoutes from "./auth.routes.js";
import financeRoutes from "./finance.routes.js";
import horaireRoutes from "./horaire.routes.js";
import inscriptionPubliqueRoutes from "./inscription-publique.route.js";
import inscriptionRoutes from "./inscription.routes.js";
import jourRoutes from "./jour.routes.js";
import niveauRoutes from "./niveau.routes.js";
import referenceRoutes from "./reference.routes.js";
import salleRoutes from "./salle.routes.js";
import userRoutes from "./user.routes.js";
import etudianRoutes from "./etudiant.routes.js";
import vagueRoutes from "./vague.routes.js";

const router = express.Router();

// Montage des routes
router.use("/auth", authRoutes);
router.use("/inscriptions-publiques", inscriptionPubliqueRoutes);

router.use("/users", userRoutes);
router.use("/salles", salleRoutes);
router.use("/vagues", vagueRoutes);
router.use("/inscriptions", inscriptionRoutes);
router.use("/niveaux", niveauRoutes);
router.use("/finances", financeRoutes);
router.use("/reference", referenceRoutes);
router.use("/horaires", horaireRoutes);
router.use("/jours", jourRoutes);
router.use("/etudiants", etudianRoutes);

// Route de test
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API en ligne",
    timestamp: new Date().toISOString(),
  });
});

export default router;
