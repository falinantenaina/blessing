import PaiementModel from "../models/paiement.model.js";
import {
  asyncHandler,
  errorResponse,
  paginatedResponse,
  successResponse,
} from "../utils/response.js";

export const getAllPaiements = asyncHandler(async (req, res) => {
  const filters = {
    search: req.query.search || "",
    page: req.query.page || 1,
    limit: req.query.limit || 15,
    date_debut: req.query.date_debut || null,
    date_fin: req.query.date_fin || null,
    type_paiement: req.query.type_paiement || null,
    methode_paiement: req.query.methode_paiement || null,
    avec_restant: req.query.avec_restant === "true",
  };

  const result = await PaiementModel.findAll(filters);

  return paginatedResponse(
    res,
    result.paiements,
    result.page,
    result.limit,
    result.total,
    "Paiements récupérés",
  );
});

export const getPaiementStats = asyncHandler(async (req, res) => {
  const filters = {
    date_debut: req.query.date_debut || null,
    date_fin: req.query.date_fin || null,
  };

  const stats = await PaiementModel.getStats(filters);

  return successResponse(res, stats, "Statistiques récupérées");
});

export const searchInscriptions = asyncHandler(async (req, res) => {
  const { search } = req.query;

  if (!search || search.length < 2) {
    return successResponse(res, [], "Aucun résultat");
  }

  const results = await PaiementModel.searchInscriptions(search);

  return successResponse(res, results, "Résultats de recherche");
});

export const getPaiementById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const paiement = await PaiementModel.findById(id);
  if (!paiement) return errorResponse(res, "Paiement introuvable", 404);

  return successResponse(res, paiement, "Paiement récupéré");
});
