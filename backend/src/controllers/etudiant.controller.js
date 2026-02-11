import EtudiantModel from "../models/etudiant.model.js";
import {
  asyncHandler,
  errorResponse,
  paginatedResponse,
  successResponse,
} from "../utils/response.js";

// Obtenir tous les étudiants
export const getEtudiants = asyncHandler(async (req, res) => {
  const filters = {
    actif: req.query.actif,
    search: req.query.search,
    page: req.query.page || 1,
    limit: req.query.limit || 10,
  };

  const result = await EtudiantModel.findAll(filters);

  console.log(result);

  return paginatedResponse(
    res,
    result.etudiants,
    result.page,
    result.limit,
    result.total,
    "Liste des étudiants récupérée avec succès",
  );
});

// Obtenir un étudiant par ID
export const getEtudiantById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const etudiant = await EtudiantModel.findById(id);

  if (!etudiant) {
    return errorResponse(res, "Étudiant introuvable", 404);
  }

  return successResponse(res, etudiant, "Étudiant récupéré avec succès");
});

// Créer un étudiant
export const createEtudiant = asyncHandler(async (req, res) => {
  const { nom, prenom, telephone, email } = req.body;

  // Vérifier si le téléphone existe déjà
  const existing = await EtudiantModel.findByTelephone(telephone);
  if (existing) {
    return errorResponse(
      res,
      "Un étudiant avec ce numéro de téléphone existe déjà",
      409,
    );
  }

  const etudiantId = await EtudiantModel.create({
    nom,
    prenom,
    telephone,
    email,
  });

  const etudiant = await EtudiantModel.findById(etudiantId);

  return successResponse(res, etudiant, "Étudiant créé avec succès", 201);
});

// Mettre à jour un étudiant
export const updateEtudiant = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nom, prenom, telephone, email, actif } = req.body;

  const existingEtudiant = await EtudiantModel.findById(id);
  if (!existingEtudiant) {
    return errorResponse(res, "Étudiant introuvable", 404);
  }

  // Vérifier si le nouveau téléphone existe déjà (si modifié)
  if (telephone && telephone !== existingEtudiant.telephone) {
    const existing = await EtudiantModel.findByTelephone(telephone);
    if (existing) {
      return errorResponse(
        res,
        "Un étudiant avec ce numéro de téléphone existe déjà",
        409,
      );
    }
  }

  const updateData = {};
  if (nom) updateData.nom = nom;
  if (prenom) updateData.prenom = prenom;
  if (telephone) updateData.telephone = telephone;
  if (email !== undefined) updateData.email = email;
  if (actif !== undefined) updateData.actif = actif;

  const updated = await EtudiantModel.update(id, updateData);

  if (!updated) {
    return errorResponse(res, "Erreur lors de la mise à jour", 400);
  }

  const etudiant = await EtudiantModel.findById(id);

  return successResponse(res, etudiant, "Étudiant mis à jour avec succès");
});

// Désactiver un étudiant
export const deleteEtudiant = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const etudiant = await EtudiantModel.findById(id);
  if (!etudiant) {
    return errorResponse(res, "Étudiant introuvable", 404);
  }

  const deleted = await EtudiantModel.deactivate(id);

  if (!deleted) {
    return errorResponse(res, "Erreur lors de la désactivation", 400);
  }

  return successResponse(res, null, "Étudiant désactivé avec succès");
});

// Activer/Désactiver un étudiant
export const toggleEtudiantActive = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const etudiant = await EtudiantModel.findById(id);
  if (!etudiant) {
    return errorResponse(res, "Étudiant introuvable", 404);
  }

  const toggled = await EtudiantModel.toggleActive(id);

  if (!toggled) {
    return errorResponse(res, "Erreur lors du changement de statut", 400);
  }

  const updatedEtudiant = await EtudiantModel.findById(id);

  return successResponse(
    res,
    updatedEtudiant,
    `Étudiant ${updatedEtudiant.actif ? "activé" : "désactivé"} avec succès`,
  );
});

// Obtenir les statistiques
export const getEtudiantStats = asyncHandler(async (req, res) => {
  const stats = await EtudiantModel.getStats();

  return successResponse(
    res,
    stats,
    "Statistiques des étudiants récupérées avec succès",
  );
});

// Obtenir tous les étudiants avec détails (niveau, paiements, livres)
export const getEtudiantsWithDetails = asyncHandler(async (req, res) => {
  const filters = {
    actif: req.query.actif,
    search: req.query.search,
    niveau_id: req.query.niveau_id,
    statut_inscription: req.query.statut_inscription,
    page: req.query.page || 1,
    limit: req.query.limit || 20,
  };

  const result = await EtudiantModel.findAllWithDetails(filters);

  return paginatedResponse(
    res,
    result.etudiants,
    result.page,
    result.limit,
    result.total,
    "Liste détaillée des étudiants récupérée avec succès",
  );
});
