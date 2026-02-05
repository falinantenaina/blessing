import JourModel from "../models/jour.model.js";
import {
  asyncHandler,
  errorResponse,
  successResponse,
} from "../utils/response.js";

// Obtenir tous les jours
export const getJours = asyncHandler(async (req, res) => {
  const filters = {
    actif: req.query.actif,
  };

  const jours = await JourModel.findAll(filters);

  return successResponse(res, jours, "Liste des jours récupérée avec succès");
});

// Obtenir un jour par ID
export const getJourById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const jour = await JourModel.findById(id);

  if (!jour) {
    return errorResponse(res, "Jour introuvable", 404);
  }

  return successResponse(res, jour, "Jour récupéré avec succès");
});

// Mettre à jour un jour
export const updateJour = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nom, ordre, actif } = req.body;

  const existingJour = await JourModel.findById(id);
  if (!existingJour) {
    return errorResponse(res, "Jour introuvable", 404);
  }

  const updateData = {};
  if (nom) updateData.nom = nom;
  if (ordre !== undefined) updateData.ordre = ordre;
  if (actif !== undefined) updateData.actif = actif;

  const updated = await JourModel.update(id, updateData);

  if (!updated) {
    return errorResponse(res, "Erreur lors de la mise à jour", 400);
  }

  const jour = await JourModel.findById(id);

  return successResponse(res, jour, "Jour mis à jour avec succès");
});

// Obtenir les jours avec statistiques
export const getJoursWithStats = asyncHandler(async (req, res) => {
  const jours = await JourModel.getWithStats();

  return successResponse(
    res,
    jours,
    "Jours avec statistiques récupérés avec succès",
  );
});
