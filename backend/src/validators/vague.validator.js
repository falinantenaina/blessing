import { body, param } from 'express-validator';
import { handleValidationErrors } from '../utils/validation.js';

export const createVagueValidator = [
  body('nom')
    .trim()
    .notEmpty()
    .withMessage('Le nom de la vague est requis')
    .isLength({ min: 3, max: 255 })
    .withMessage('Le nom doit contenir entre 3 et 255 caractères'),
  
  body('niveau_id')
    .notEmpty()
    .withMessage('Le niveau est requis')
    .isInt({ min: 1 })
    .withMessage('ID de niveau invalide'),
  
  body('enseignant_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID d\'enseignant invalide'),
  
  body('salle_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de salle invalide'),
  
  body('date_debut')
    .notEmpty()
    .withMessage('La date de début est requise')
    .isDate()
    .withMessage('Date de début invalide'),
  
  body('date_fin')
    .notEmpty()
    .withMessage('La date de fin est requise')
    .isDate()
    .withMessage('Date de fin invalide')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.date_debut)) {
        throw new Error('La date de fin doit être après la date de début');
      }
      return true;
    }),
  
  body('horaire_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID d\'horaire invalide'),
  
  body('jour_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de jour invalide'),
  
  body('capacite_max')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La capacité doit être entre 1 et 100'),
  
  body('statut')
    .optional()
    .isIn(['planifie', 'en_cours', 'termine', 'annule'])
    .withMessage('Statut invalide'),
  
  handleValidationErrors
];

export const updateVagueValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de vague invalide'),
  
  body('nom')
    .optional()
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Le nom doit contenir entre 3 et 255 caractères'),
  
  body('niveau_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de niveau invalide'),
  
  body('enseignant_id')
    .optional({ nullable: true })
    .custom((value) => value === null || (Number.isInteger(Number(value)) && Number(value) > 0))
    .withMessage('ID d\'enseignant invalide'),
  
  body('salle_id')
    .optional({ nullable: true })
    .custom((value) => value === null || (Number.isInteger(Number(value)) && Number(value) > 0))
    .withMessage('ID de salle invalide'),
  
  body('date_debut')
    .optional()
    .isDate()
    .withMessage('Date de début invalide'),
  
  body('date_fin')
    .optional()
    .isDate()
    .withMessage('Date de fin invalide'),
  
  body('capacite_max')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La capacité doit être entre 1 et 100'),
  
  body('statut')
    .optional()
    .isIn(['planifie', 'en_cours', 'termine', 'annule'])
    .withMessage('Statut invalide'),
  
  handleValidationErrors
];

export const updateVagueStatusValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de vague invalide'),
  
  body('statut')
    .notEmpty()
    .withMessage('Le statut est requis')
    .isIn(['planifie', 'en_cours', 'termine', 'annule'])
    .withMessage('Statut invalide'),
  
  handleValidationErrors
];

export const vagueIdValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de vague invalide'),
  
  handleValidationErrors
];
