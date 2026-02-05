import express from 'express';
import {
  getSalles,
  getSalleById,
  createSalle,
  updateSalle,
  deleteSalle,
  getSalleOccupation,
  checkSalleDisponibilite,
  getSallesDisponibles,
  getSalleStats
} from '../controllers/salle.controller.js';
import { authenticate, isAdminOrSecretaire } from '../middleware/auth.middleware.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes publiques (lecture)
router.get('/', getSalles);
router.get('/stats', getSalleStats);
router.get('/disponibles', getSallesDisponibles);
router.get('/:id', getSalleById);
router.get('/:id/occupation', getSalleOccupation);
router.get('/:id/disponibilite', checkSalleDisponibilite);

// Routes protégées (admin/secrétaire uniquement)
router.post('/', isAdminOrSecretaire, createSalle);
router.put('/:id', isAdminOrSecretaire, updateSalle);
router.delete('/:id', isAdminOrSecretaire, deleteSalle);

export default router;
