import SalleModel from "../models/salle.model.js";
import {
  asyncHandler,
  errorResponse,
  successResponse,
} from "../utils/response.js";

// Obtenir toutes les salles
export const getSalles = asyncHandler(async (req, res) => {
  const filters = {
    actif: req.query.actif,
    ecole_id: req.query.ecole_id,
  };

  const salles = await SalleModel.findAll(filters);

  return successResponse(res, salles, "Liste des salles récupérée avec succès");
});

// Obtenir une salle par ID
export const getSalleById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const salle = await SalleModel.findById(id);

  if (!salle) {
    return errorResponse(res, "Salle introuvable", 404);
  }

  return successResponse(res, salle, "Salle récupérée avec succès");
});

// Créer une salle
export const createSalle = asyncHandler(async (req, res) => {
  const { nom, ecole_id, capacite, equipements } = req.body;

  const salleId = await SalleModel.create({
    nom,
    ecole_id,
    capacite,
    equipements,
  });

  const salle = await SalleModel.findById(salleId);

  return successResponse(res, salle, "Salle créée avec succès", 201);
});

// Mettre à jour une salle
export const updateSalle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nom, ecole_id, capacite, equipements, actif } = req.body;

  const existingSalle = await SalleModel.findById(id);
  if (!existingSalle) {
    return errorResponse(res, "Salle introuvable", 404);
  }

  const updateData = {};
  if (nom) updateData.nom = nom;
  if (ecole_id !== undefined) updateData.ecole_id = ecole_id;
  if (capacite) updateData.capacite = capacite;
  if (equipements !== undefined) updateData.equipements = equipements;
  if (actif !== undefined) updateData.actif = actif;

  const updated = await SalleModel.update(id, updateData);

  if (!updated) {
    return errorResponse(res, "Erreur lors de la mise à jour", 400);
  }

  const salle = await SalleModel.findById(id);

  return successResponse(res, salle, "Salle mise à jour avec succès");
});

// Supprimer une salle
export const deleteSalle = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const salle = await SalleModel.findById(id);
  if (!salle) {
    return errorResponse(res, "Salle introuvable", 404);
  }

  const deleted = await SalleModel.delete(id);

  if (!deleted) {
    return errorResponse(res, "Erreur lors de la suppression", 400);
  }

  return successResponse(res, null, "Salle supprimée avec succès");
});

// Obtenir l'occupation d'une salle
export const getSalleOccupation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const salle = await SalleModel.findById(id);
  if (!salle) {
    return errorResponse(res, "Salle introuvable", 404);
  }

  const occupation = await SalleModel.getOccupation(id);

  return successResponse(
    res,
    {
      salle,
      ...occupation,
    },
    "Occupation de la salle récupérée avec succès",
  );
});

// Vérifier la disponibilité d'une salle
export const checkSalleDisponibilite = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { jour_id, horaire_id, exclude_vague_id } = req.query;

  if (!jour_id || !horaire_id) {
    return errorResponse(
      res,
      "Les paramètres jour_id et horaire_id sont requis",
      400,
    );
  }

  const disponible = await SalleModel.checkDisponibilite(
    id,
    jour_id,
    horaire_id,
    exclude_vague_id || null,
  );

  return successResponse(
    res,
    {
      disponible,
      salle_id: id,
      jour_id,
      horaire_id,
    },
    disponible ? "Salle disponible" : "Salle occupée",
  );
});

// Obtenir les salles disponibles pour un créneau
export const getSallesDisponibles = asyncHandler(async (req, res) => {
  const { jour_id, horaire_id, capacite_min } = req.query;

  if (!jour_id || !horaire_id) {
    return errorResponse(
      res,
      "Les paramètres jour_id et horaire_id sont requis",
      400,
    );
  }

  const salles = await SalleModel.getSallesDisponibles(
    jour_id,
    horaire_id,
    capacite_min || null,
  );

  return successResponse(
    res,
    salles,
    "Salles disponibles récupérées avec succès",
  );
});

// Obtenir les statistiques des salles
export const getSalleStats = asyncHandler(async (req, res) => {
  const stats = await SalleModel.getStats();

  return successResponse(
    res,
    stats,
    "Statistiques des salles récupérées avec succès",
  );
});
