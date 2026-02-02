import express from 'express';
import {
  getNiveaux,
  getNiveauStats,
  getNiveauById,
  createNiveau,
  updateNiveau,
  deleteNiveau
} from '../controllers/niveau.controller.js';
import { authenticate, isAdminOrSecretaire } from '../middleware/auth.middleware.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes accessibles à tous les utilisateurs authentifiés
router.get('/', getNiveaux);
router.get('/stats', getNiveauStats);
router.get('/:id', getNiveauById);

// Routes protégées (admin/secrétaire uniquement)
router.post('/', isAdminOrSecretaire, createNiveau);
router.put('/:id', isAdminOrSecretaire, updateNiveau);
router.delete('/:id', isAdminOrSecretaire, deleteNiveau);

export default router;
