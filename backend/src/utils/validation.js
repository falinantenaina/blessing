import { validationResult } from 'express-validator';

// Middleware pour gérer les erreurs de validation
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg
      }))
    });
  }
  
  next();
};

// Fonction pour valider les IDs
export const isValidId = (value) => {
  return Number.isInteger(Number(value)) && Number(value) > 0;
};

// Fonction pour valider les emails
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Fonction pour valider les numéros de téléphone
export const isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
};

// Fonction pour valider les dates
export const isValidDate = (date) => {
  const timestamp = Date.parse(date);
  return !isNaN(timestamp);
};

// Fonction pour sanitizer les inputs
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Supprimer < et >
    .substring(0, 1000); // Limiter la longueur
};
