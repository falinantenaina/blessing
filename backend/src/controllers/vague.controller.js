import VagueModel from '../models/vague.model.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { asyncHandler } from '../utils/response.js';

// Obtenir toutes les vagues
export const getVagues = asyncHandler(async (req, res) => {
  const filters = {
    statut: req.query.statut,
    niveau_id: req.query.niveau_id,
    enseignant_id: req.query.enseignant_id,
    salle_id: req.query.salle_id,
    jour_id: req.query.jour_id,
    date_debut: req.query.date_debut,
    date_fin: req.query.date_fin,
    search: req.query.search,
    page: req.query.page || 1,
    limit: req.query.limit || 10
  };

  const result = await VagueModel.findAll(filters);

  return paginatedResponse(
    res,
    result.vagues,
    result.page,
    result.limit,
    result.total,
    'Liste des vagues récupérée avec succès'
  );
});

// Obtenir une vague par ID
export const getVagueById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const vague = await VagueModel.findById(id);

  if (!vague) {
    return errorResponse(res, 'Vague introuvable', 404);
  }

  return successResponse(res, vague, 'Vague récupérée avec succès');
});

// Créer une vague
export const createVague = asyncHandler(async (req, res) => {
  const {
    nom,
    niveau_id,
    enseignant_id,
    salle_id,
    date_debut,
    date_fin,
    horaire_id,
    jour_id,
    capacite_max,
    statut,
    remarques
  } = req.body;

  // Vérifier la disponibilité de la salle
  if (salle_id && horaire_id && jour_id) {
    const salleDisponible = await VagueModel.checkSalleDisponibilite(
      salle_id,
      jour_id,
      horaire_id
    );

    if (!salleDisponible) {
      return errorResponse(res, 'Cette salle est déjà occupée à cet horaire', 409);
    }
  }

  // Vérifier la disponibilité de l'enseignant
  if (enseignant_id && horaire_id && jour_id) {
    const enseignantDisponible = await VagueModel.checkEnseignantDisponibilite(
      enseignant_id,
      jour_id,
      horaire_id
    );

    if (!enseignantDisponible) {
      return errorResponse(res, 'Cet enseignant est déjà occupé à cet horaire', 409);
    }
  }

  // Créer la vague
  const vagueId = await VagueModel.create({
    nom,
    niveau_id,
    enseignant_id,
    salle_id,
    date_debut,
    date_fin,
    horaire_id,
    jour_id,
    capacite_max,
    statut,
    remarques
  });

  const vague = await VagueModel.findById(vagueId);

  return successResponse(res, vague, 'Vague créée avec succès', 201);
});

// Mettre à jour une vague
export const updateVague = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    nom,
    niveau_id,
    enseignant_id,
    salle_id,
    date_debut,
    date_fin,
    horaire_id,
    jour_id,
    capacite_max,
    statut,
    remarques
  } = req.body;

  // Vérifier si la vague existe
  const existingVague = await VagueModel.findById(id);
  if (!existingVague) {
    return errorResponse(res, 'Vague introuvable', 404);
  }

  // Vérifier la disponibilité de la salle si changement
  if (salle_id && horaire_id && jour_id) {
    const salleDisponible = await VagueModel.checkSalleDisponibilite(
      salle_id,
      jour_id,
      horaire_id,
      id
    );

    if (!salleDisponible) {
      return errorResponse(res, 'Cette salle est déjà occupée à cet horaire', 409);
    }
  }

  // Vérifier la disponibilité de l'enseignant si changement
  if (enseignant_id && horaire_id && jour_id) {
    const enseignantDisponible = await VagueModel.checkEnseignantDisponibilite(
      enseignant_id,
      jour_id,
      horaire_id,
      id
    );

    if (!enseignantDisponible) {
      return errorResponse(res, 'Cet enseignant est déjà occupé à cet horaire', 409);
    }
  }

  const updateData = {};
  if (nom) updateData.nom = nom;
  if (niveau_id) updateData.niveau_id = niveau_id;
  if (enseignant_id !== undefined) updateData.enseignant_id = enseignant_id;
  if (salle_id !== undefined) updateData.salle_id = salle_id;
  if (date_debut) updateData.date_debut = date_debut;
  if (date_fin) updateData.date_fin = date_fin;
  if (horaire_id !== undefined) updateData.horaire_id = horaire_id;
  if (jour_id !== undefined) updateData.jour_id = jour_id;
  if (capacite_max) updateData.capacite_max = capacite_max;
  if (statut) updateData.statut = statut;
  if (remarques !== undefined) updateData.remarques = remarques;

  const updated = await VagueModel.update(id, updateData);

  if (!updated) {
    return errorResponse(res, 'Erreur lors de la mise à jour', 400);
  }

  const vague = await VagueModel.findById(id);

  return successResponse(res, vague, 'Vague mise à jour avec succès');
});

// Supprimer une vague
export const deleteVague = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Vérifier si la vague existe
  const vague = await VagueModel.findById(id);
  if (!vague) {
    return errorResponse(res, 'Vague introuvable', 404);
  }

  // Vérifier s'il y a des inscriptions actives
  if (parseInt(vague.nb_inscrits) > 0) {
    return errorResponse(
      res,
      'Impossible de supprimer une vague avec des inscriptions actives',
      400
    );
  }

  const deleted = await VagueModel.delete(id);

  if (!deleted) {
    return errorResponse(res, 'Erreur lors de la suppression', 400);
  }

  return successResponse(res, null, 'Vague supprimée avec succès');
});

// Changer le statut d'une vague
export const updateVagueStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { statut } = req.body;

  // Vérifier si la vague existe
  const vague = await VagueModel.findById(id);
  if (!vague) {
    return errorResponse(res, 'Vague introuvable', 404);
  }

  const updated = await VagueModel.updateStatus(id, statut);

  if (!updated) {
    return errorResponse(res, 'Erreur lors de la mise à jour du statut', 400);
  }

  const updatedVague = await VagueModel.findById(id);

  return successResponse(res, updatedVague, 'Statut de la vague mis à jour avec succès');
});

// Obtenir les étudiants d'une vague
export const getVagueEtudiants = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Vérifier si la vague existe
  const vague = await VagueModel.findById(id);
  if (!vague) {
    return errorResponse(res, 'Vague introuvable', 404);
  }

  const etudiants = await VagueModel.getEtudiants(id);

  return successResponse(res, etudiants, 'Étudiants de la vague récupérés avec succès');
});

// Obtenir le planning
export const getPlanning = asyncHandler(async (req, res) => {
  const filters = {
    salle_id: req.query.salle_id,
    enseignant_id: req.query.enseignant_id
  };

  const planning = await VagueModel.getPlanning(filters);

  // Organiser le planning par jour et horaire
  const planningOrganise = {};

  planning.forEach(vague => {
    const jourNom = vague.jour_nom || 'Non défini';
    const horaireId = vague.horaire_id || 0;

    if (!planningOrganise[jourNom]) {
      planningOrganise[jourNom] = {};
    }

    if (!planningOrganise[jourNom][horaireId]) {
      planningOrganise[jourNom][horaireId] = [];
    }

    planningOrganise[jourNom][horaireId].push(vague);
  });

  return successResponse(res, {
    planning: planningOrganise,
    liste: planning
  }, 'Planning récupéré avec succès');
});
