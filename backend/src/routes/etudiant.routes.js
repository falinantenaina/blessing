import express from 'express';
import * as etudiantController from '../controllers/etudiant.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/:id/complet', etudiantController.getEtudiantComplet);

router.get('/stats', etudiantController.getEtudiantStats);

router.get('/', etudiantController.getEtudiants);
router.get('/:id', etudiantController.getEtudiantById);
router.post('/', etudiantController.createEtudiant);
router.put('/:id', etudiantController.updateEtudiant);
router.delete('/:id', etudiantController.deleteEtudiant);
router.patch('/:id/toggle', etudiantController.toggleEtudiantActive);

export default router;