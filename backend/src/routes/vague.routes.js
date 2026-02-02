import express from 'express';
import {
  getVagues,
  getVagueById,
  createVague,
  updateVague,
  deleteVague,
  updateVagueStatus,
  getVagueEtudiants,
  getPlanning
} from '../controllers/vague.controller.js';
import {
  createVagueValidator,
  updateVagueValidator,
  updateVagueStatusValidator,
  vagueIdValidator
} from '../validators/vague.validator.js';
import { authenticate, isAdminOrSecretaire } from '../middleware/auth.middleware.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes générales
router.get('/', getVagues);
router.get('/planning', getPlanning);
router.get('/:id', vagueIdValidator, getVagueById);
router.get('/:id/etudiants', vagueIdValidator, getVagueEtudiants);

// Routes protégées (admin/secrétaire uniquement)
router.post('/', isAdminOrSecretaire, createVagueValidator, createVague);
router.put('/:id', isAdminOrSecretaire, updateVagueValidator, updateVague);
router.delete('/:id', isAdminOrSecretaire, vagueIdValidator, deleteVague);
router.patch('/:id/statut', isAdminOrSecretaire, updateVagueStatusValidator, updateVagueStatus);

export default router;
