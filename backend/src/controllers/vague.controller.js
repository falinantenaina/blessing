import SalleModel from "../models/salle.model.js";
import VagueModel from "../models/vague.model.js";
import {
  asyncHandler,
  errorResponse,
  paginatedResponse,
  successResponse,
} from "../utils/response.js";

// Obtenir toutes les vagues
export const getVagues = asyncHandler(async (req, res) => {
  const filters = {
    statut: req.query.statut,
    niveau_id: req.query.niveau_id,
    enseignant_id: req.query.enseignant_id,
    salle_id: req.query.salle_id,
    search: req.query.search,
    page: req.query.page || 1,
    limit: req.query.limit || 10,
  };

  const result = await VagueModel.findAll(filters);

  return paginatedResponse(
    res,
    result.vagues,
    result.page,
    result.limit,
    result.total,
    "Liste des vagues récupérée avec succès",
  );
});

export const getInscriptions = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que la vague existe
    const vague = await VagueModel.getById(id);
    if (!vague) {
      return res.status(404).json({
        success: false,
        message: "Vague introuvable",
      });
    }

    // Récupérer les inscriptions
    const inscriptions = await VagueModel.getInscriptionsByVague(id);

    res.json({
      success: true,
      data: {
        vague_id: parseInt(id),
        vague_nom: vague.nom,
        total: inscriptions.length,
        inscriptions,
      },
    });
  } catch (error) {
    console.error("Erreur récupération inscriptions vague:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des inscriptions",
      error: error.message,
    });
  }
};

// Obtenir une vague par ID
export const getVagueById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const vague = await VagueModel.findById(id);

  if (!vague) {
    return errorResponse(res, "Vague introuvable", 404);
  }

  return successResponse(res, vague, "Vague récupérée avec succès");
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
    statut,
    remarques,
    horaires, // Array de { jour_id, horaire_id }
  } = req.body;

  // Vérifier les disponibilités pour chaque horaire
  if (horaires && horaires.length > 0) {
    for (const horaire of horaires) {
      // Vérifier la salle
      if (salle_id) {
        const salleDisponible = await SalleModel.checkDisponibilite(
          salle_id,
          horaire.jour_id,
          horaire.horaire_id,
        );

        if (!salleDisponible) {
          return errorResponse(
            res,
            `La salle est déjà occupée pour le créneau sélectionné`,
            409,
          );
        }
      }

      // Vérifier l'enseignant
      if (enseignant_id) {
        const enseignantDisponible =
          await VagueModel.checkEnseignantDisponibilite(
            enseignant_id,
            horaire.jour_id,
            horaire.horaire_id,
          );

        if (!enseignantDisponible) {
          return errorResponse(
            res,
            `L'enseignant est déjà occupé pour le créneau sélectionné`,
            409,
          );
        }
      }
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
    statut,
    remarques,
    horaires,
  });

  const vague = await VagueModel.findById(vagueId);

  return successResponse(res, vague, "Vague créée avec succès", 201);
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
    statut,
    remarques,
    horaires,
  } = req.body;

  const existingVague = await VagueModel.findById(id);
  if (!existingVague) {
    return errorResponse(res, "Vague introuvable", 404);
  }

  // Vérifier les disponibilités si horaires fournis
  if (horaires && horaires.length > 0) {
    for (const horaire of horaires) {
      if (salle_id) {
        const salleDisponible = await SalleModel.checkDisponibilite(
          salle_id,
          horaire.jour_id,
          horaire.horaire_id,
          id,
        );

        if (!salleDisponible) {
          return errorResponse(
            res,
            `La salle est déjà occupée pour le créneau sélectionné`,
            409,
          );
        }
      }

      if (enseignant_id) {
        const enseignantDisponible =
          await VagueModel.checkEnseignantDisponibilite(
            enseignant_id,
            horaire.jour_id,
            horaire.horaire_id,
            id,
          );

        if (!enseignantDisponible) {
          return errorResponse(
            res,
            `L'enseignant est déjà occupé pour le créneau sélectionné`,
            409,
          );
        }
      }
    }
  }

  const updateData = {};
  if (nom) updateData.nom = nom;
  if (niveau_id) updateData.niveau_id = niveau_id;
  if (enseignant_id !== undefined) updateData.enseignant_id = enseignant_id;
  if (salle_id !== undefined) updateData.salle_id = salle_id;
  if (date_debut) updateData.date_debut = date_debut;
  if (date_fin) updateData.date_fin = date_fin;
  if (statut) updateData.statut = statut;
  if (remarques !== undefined) updateData.remarques = remarques;
  if (horaires !== undefined) updateData.horaires = horaires;

  const updated = await VagueModel.update(id, updateData);

  if (!updated) {
    return errorResponse(res, "Erreur lors de la mise à jour", 400);
  }

  const vague = await VagueModel.findById(id);

  return successResponse(res, vague, "Vague mise à jour avec succès");
});

// Supprimer une vague
export const deleteVague = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const vague = await VagueModel.findById(id);
  if (!vague) {
    return errorResponse(res, "Vague introuvable", 404);
  }

  if (parseInt(vague.nb_inscrits) > 0) {
    return errorResponse(
      res,
      "Impossible de supprimer une vague avec des inscriptions actives",
      400,
    );
  }

  const deleted = await VagueModel.delete(id);

  if (!deleted) {
    return errorResponse(res, "Erreur lors de la suppression", 400);
  }

  return successResponse(res, null, "Vague supprimée avec succès");
});

// Obtenir le planning
export const getPlanning = asyncHandler(async (req, res) => {
  const filters = {
    salle_id: req.query.salle_id,
    enseignant_id: req.query.enseignant_id,
  };

  const planning = await VagueModel.getPlanning(filters);

  return successResponse(res, planning, "Planning récupéré avec succès");
});

// Obtenir le planning d'un enseignant
export const getPlanningEnseignant = asyncHandler(async (req, res) => {
  const { enseignantId } = req.params;

  const planning = await VagueModel.getPlanning({
    enseignant_id: enseignantId,
  });

  // Organiser par jour de la semaine
  const planningParJour = {};

  planning.forEach((vague) => {
    vague.horaires.forEach((horaire) => {
      const jour = horaire.jour_nom;
      if (!planningParJour[jour]) {
        planningParJour[jour] = [];
      }

      planningParJour[jour].push({
        vague_id: vague.id,
        vague_nom: vague.nom,
        niveau: vague.niveau_code,
        salle: vague.salle_nom,
        heure_debut: horaire.heure_debut,
        heure_fin: horaire.heure_fin,
        nb_inscrits: vague.nb_inscrits,
        capacite_max: vague.capacite_max,
        statut: vague.statut,
      });
    });
  });

  // Trier les horaires par heure de début pour chaque jour
  Object.keys(planningParJour).forEach((jour) => {
    planningParJour[jour].sort((a, b) =>
      a.heure_debut.localeCompare(b.heure_debut),
    );
  });

  return successResponse(
    res,
    {
      enseignant_id: enseignantId,
      planning_par_jour: planningParJour,
      total_vagues: planning.length,
    },
    "Planning de l'enseignant récupéré avec succès",
  );
});

// Obtenier la liste des étudiants inscripts à une vague
export const getEtudiantsByVague = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const filters = {
    statut_inscription: req.query.statut_inscription, // actif | abandonne | termine | suspendu
    statut_ecolage: req.query.statut_ecolage, // non_paye | partiel | paye
    search: req.query.search,
    page: req.query.page || 1,
    limit: req.query.limit || 20,
  };

  const result = await VagueModel.getEtudiants(id, filters);

  if (!result) {
    return errorResponse(res, "Vague introuvable", 404);
  }

  return paginatedResponse(
    res,
    result.etudiants,
    result.page,
    result.limit,
    result.total,
    `Liste des étudiants de la vague "${result.vague.nom}" récupérée avec succès`,
  );
});
