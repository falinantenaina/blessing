import express from 'express';
import {
  getSalles,
  getSalleById,
  createSalle,
  updateSalle,
  deleteSalle,
  getHoraires,
  getHoraireById,
  createHoraire,
  updateHoraire,
  deleteHoraire,
  getJours,
  getJourById,
  getEcoles,
  getEcoleById,
  createEcole,
  updateEcole,
  deleteEcole
} from '../controllers/reference.controller.js';
import { authenticate, isAdminOrSecretaire } from '../middleware/auth.middleware.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// ===== SALLES =====
router.get('/salles', getSalles);
router.get('/salles/:id', getSalleById);
router.post('/salles', isAdminOrSecretaire, createSalle);
router.put('/salles/:id', isAdminOrSecretaire, updateSalle);
router.delete('/salles/:id', isAdminOrSecretaire, deleteSalle);

// ===== HORAIRES =====
router.get('/horaires', getHoraires);
router.get('/horaires/:id', getHoraireById);
router.post('/horaires', isAdminOrSecretaire, createHoraire);
router.put('/horaires/:id', isAdminOrSecretaire, updateHoraire);
router.delete('/horaires/:id', isAdminOrSecretaire, deleteHoraire);

// ===== JOURS =====
router.get('/jours', getJours);
router.get('/jours/:id', getJourById);

// ===== ÉCOLES =====
router.get('/ecoles', getEcoles);
router.get('/ecoles/:id', getEcoleById);
router.post('/ecoles', isAdminOrSecretaire, createEcole);
router.put('/ecoles/:id', isAdminOrSecretaire, updateEcole);
router.delete('/ecoles/:id', isAdminOrSecretaire, deleteEcole);

export default router;
