import FinanceModel from "../models/finance.model.js";
import {
  asyncHandler,
  errorResponse,
  paginatedResponse,
  successResponse,
} from "../utils/response.js";

// Obtenir tous les écolages
export const getEcolages = asyncHandler(async (req, res) => {
  const filters = {
    statut: req.query.statut,
    etudiant_id: req.query.etudiant_id,
    vague_id: req.query.vague_id,
    niveau_id: req.query.niveau_id,
    search: req.query.search,
    page: req.query.page || 1,
    limit: req.query.limit || 10,
  };

  const result = await FinanceModel.getEcolages(filters);

  return paginatedResponse(
    res,
    result.ecolages,
    result.page,
    result.limit,
    result.total,
    "Liste des écolages récupérée avec succès",
  );
});

// Obtenir un écolage par ID
export const getEcolageById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const ecolage = await FinanceModel.getEcolageById(id);

  if (!ecolage) {
    return errorResponse(res, "Écolage introuvable", 404);
  }

  // Récupérer les paiements associés
  const paiements = await FinanceModel.getPaiementsByEcolage(id);

  return successResponse(
    res,
    {
      ...ecolage,
      paiements,
    },
    "Écolage récupéré avec succès",
  );
});

// Obtenir les écolages d'un étudiant
export const getEcolagesByEtudiant = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const ecolages = await FinanceModel.getEcolagesByEtudiant(id);

  // Pour chaque écolage, récupérer les paiements
  const ecolagesAvecPaiements = await Promise.all(
    ecolages.map(async (ecolage) => {
      const paiements = await FinanceModel.getPaiementsByEcolage(ecolage.id);
      return {
        ...ecolage,
        paiements,
      };
    }),
  );

  return successResponse(
    res,
    ecolagesAvecPaiements,
    "Écolages de l'étudiant récupérés avec succès",
  );
});

// Enregistrer un paiement
export const enregistrerPaiement = asyncHandler(async (req, res) => {
  const {
    ecolage_id,
    montant,
    date_paiement,
    methode_paiement,
    reference,
    type_frais,
    remarques,
  } = req.body;

  // Vérifier si l'écolage existe
  const ecolage = await FinanceModel.getEcolageById(ecolage_id);
  if (!ecolage) {
    return errorResponse(res, "Écolage introuvable", 404);
  }

  // Vérifier que le montant ne dépasse pas le montant restant
  if (parseFloat(montant) > parseFloat(ecolage.montant_restant)) {
    return errorResponse(
      res,
      "Le montant du paiement ne peut pas dépasser le montant restant",
      400,
    );
  }

  // Enregistrer le paiement
  const paiementId = await FinanceModel.enregistrerPaiement({
    ecolage_id,
    montant,
    date_paiement: date_paiement || new Date().toISOString().split("T")[0],
    methode_paiement,
    reference,
    type_frais: type_frais || "ecolage",
    remarques,
    utilisateur_id: req.user.id,
  });

  // Récupérer l'écolage mis à jour
  const ecolageUpdated = await FinanceModel.getEcolageById(ecolage_id);
  const paiements = await FinanceModel.getPaiementsByEcolage(ecolage_id);

  return successResponse(
    res,
    {
      paiement_id: paiementId,
      ecolage: ecolageUpdated,
      paiements,
    },
    "Paiement enregistré avec succès",
    201,
  );
});

// Annuler un paiement
export const annulerPaiement = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const annule = await FinanceModel.annulerPaiement(id);

    if (!annule) {
      return errorResponse(res, "Erreur lors de l'annulation du paiement", 400);
    }

    return successResponse(res, null, "Paiement annulé avec succès");
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
});

// Obtenir les statistiques financières
export const getFinanceStats = asyncHandler(async (req, res) => {
  const filters = {
    date_debut: req.query.date_debut,
    date_fin: req.query.date_fin,
  };

  const stats = await FinanceModel.getStats(filters);

  return successResponse(
    res,
    stats,
    "Statistiques financières récupérées avec succès",
  );
});

// Obtenir un rapport par période
export const getRapportFinancier = asyncHandler(async (req, res) => {
  const filters = {
    date_debut: req.query.date_debut,
    date_fin: req.query.date_fin,
  };

  const rapport = await FinanceModel.getRapport(filters);

  // Calculer les totaux
  const totaux = rapport.reduce(
    (acc, item) => {
      acc.nb_paiements += parseInt(item.nb_paiements);
      acc.total_paiements += parseFloat(item.total_paiements);
      return acc;
    },
    { nb_paiements: 0, total_paiements: 0 },
  );

  return successResponse(
    res,
    {
      rapport,
      totaux,
    },
    "Rapport financier généré avec succès",
  );
});
