import express from 'express';
import {
  inscrireEtudiant,
  retirerEtudiant,
  getInscriptionsByEtudiant,
  updateInscriptionStatus,
  getInscriptionStats
} from '../controllers/inscription.controller.js';
import { authenticate, isAdminOrSecretaire } from '../middleware/auth.middleware.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes protégées (admin/secrétaire uniquement)
router.post('/', isAdminOrSecretaire, inscrireEtudiant);
router.delete('/:vagueId/:etudiantId', isAdminOrSecretaire, retirerEtudiant);
router.patch('/:id/statut', isAdminOrSecretaire, updateInscriptionStatus);
router.get('/stats', isAdminOrSecretaire, getInscriptionStats);

// Route accessible par les étudiants pour leurs propres inscriptions
router.get('/student/:id', getInscriptionsByEtudiant);

export default router;
