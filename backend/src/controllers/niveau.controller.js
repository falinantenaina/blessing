import NiveauModel from '../models/niveau.model.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { asyncHandler } from '../utils/response.js';

// Obtenir tous les niveaux
export const getNiveaux = asyncHandler(async (req, res) => {
  const filters = {
    actif: req.query.actif,
    search: req.query.search
  };

  const niveaux = await NiveauModel.findAll(filters);

  return successResponse(res, niveaux, 'Liste des niveaux récupérée avec succès');
});

// Obtenir les statistiques des niveaux
export const getNiveauStats = asyncHandler(async (req, res) => {
  const stats = await NiveauModel.getStats();

  return successResponse(res, stats, 'Statistiques des niveaux récupérées avec succès');
});

// Obtenir un niveau par ID
export const getNiveauById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const niveau = await NiveauModel.findById(id);

  if (!niveau) {
    return errorResponse(res, 'Niveau introuvable', 404);
  }

  return successResponse(res, niveau, 'Niveau récupéré avec succès');
});

// Créer un niveau
export const createNiveau = asyncHandler(async (req, res) => {
  const {
    code,
    nom,
    description,
    frais_inscription,
    frais_ecolage,
    frais_livre,
    duree_mois
  } = req.body;

  // Vérifier si le code existe déjà
  const existingNiveau = await NiveauModel.findByCode(code);
  if (existingNiveau) {
    return errorResponse(res, 'Ce code de niveau est déjà utilisé', 409);
  }

  // Créer le niveau
  const niveauId = await NiveauModel.create({
    code,
    nom,
    description,
    frais_inscription,
    frais_ecolage,
    frais_livre,
    duree_mois
  });

  const niveau = await NiveauModel.findById(niveauId);

  return successResponse(res, niveau, 'Niveau créé avec succès', 201);
});

// Mettre à jour un niveau
export const updateNiveau = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    code,
    nom,
    description,
    frais_inscription,
    frais_ecolage,
    frais_livre,
    duree_mois,
    actif
  } = req.body;

  // Vérifier si le niveau existe
  const existingNiveau = await NiveauModel.findById(id);
  if (!existingNiveau) {
    return errorResponse(res, 'Niveau introuvable', 404);
  }

  // Vérifier si le nouveau code est déjà utilisé par un autre niveau
  if (code && code !== existingNiveau.code) {
    const codeNiveau = await NiveauModel.findByCode(code);
    if (codeNiveau) {
      return errorResponse(res, 'Ce code de niveau est déjà utilisé', 409);
    }
  }

  const updateData = {};
  if (code) updateData.code = code;
  if (nom) updateData.nom = nom;
  if (description !== undefined) updateData.description = description;
  if (frais_inscription !== undefined) updateData.frais_inscription = frais_inscription;
  if (frais_ecolage !== undefined) updateData.frais_ecolage = frais_ecolage;
  if (frais_livre !== undefined) updateData.frais_livre = frais_livre;
  if (duree_mois) updateData.duree_mois = duree_mois;
  if (actif !== undefined) updateData.actif = actif;

  const updated = await NiveauModel.update(id, updateData);

  if (!updated) {
    return errorResponse(res, 'Erreur lors de la mise à jour', 400);
  }

  const niveau = await NiveauModel.findById(id);

  return successResponse(res, niveau, 'Niveau mis à jour avec succès');
});

// Supprimer un niveau
export const deleteNiveau = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Vérifier si le niveau existe
  const niveau = await NiveauModel.findById(id);
  if (!niveau) {
    return errorResponse(res, 'Niveau introuvable', 404);
  }

  try {
    const deleted = await NiveauModel.delete(id);

    if (!deleted) {
      return errorResponse(res, 'Erreur lors de la suppression', 400);
    }

    return successResponse(res, null, 'Niveau supprimé avec succès');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
});
