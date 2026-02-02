import express from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import vagueRoutes from './vague.routes.js';
import inscriptionRoutes from './inscription.routes.js';
import niveauRoutes from './niveau.routes.js';
import financeRoutes from './finance.routes.js';
import referenceRoutes from './reference.routes.js';

const router = express.Router();

// Montage des routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/vagues', vagueRoutes);
router.use('/inscriptions', inscriptionRoutes);
router.use('/niveaux', niveauRoutes);
router.use('/finances', financeRoutes);
router.use('/reference', referenceRoutes);

// Route de test
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API en ligne',
    timestamp: new Date().toISOString()
  });
});

export default router;
