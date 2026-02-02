import InscriptionModel from '../models/inscription.model.js';
import VagueModel from '../models/vague.model.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { asyncHandler } from '../utils/response.js';

// Inscrire un étudiant à une vague
export const inscrireEtudiant = asyncHandler(async (req, res) => {
  const { etudiant_id, vague_id, date_inscription, remarques } = req.body;

  // Vérifier si la vague existe
  const vague = await VagueModel.findById(vague_id);
  if (!vague) {
    return errorResponse(res, 'Vague introuvable', 404);
  }

  // Vérifier si l'étudiant est déjà inscrit
  const dejaInscrit = await InscriptionModel.isAlreadyEnrolled(etudiant_id, vague_id);
  if (dejaInscrit) {
    return errorResponse(res, 'Cet étudiant est déjà inscrit à cette vague', 409);
  }

  // Vérifier la capacité de la vague
  const capaciteDisponible = await VagueModel.checkCapacite(vague_id);
  if (!capaciteDisponible) {
    return errorResponse(res, 'Cette vague a atteint sa capacité maximale', 400);
  }

  // Créer l'inscription
  const inscriptionId = await InscriptionModel.create({
    etudiant_id,
    vague_id,
    date_inscription: date_inscription || new Date().toISOString().split('T')[0],
    remarques
  });

  const inscription = await InscriptionModel.findById(inscriptionId);

  return successResponse(res, inscription, 'Inscription créée avec succès', 201);
});

// Retirer un étudiant d'une vague
export const retirerEtudiant = asyncHandler(async (req, res) => {
  const { vagueId, etudiantId } = req.params;

  // Vérifier si l'inscription existe
  const inscription = await InscriptionModel.findByEtudiantAndVague(etudiantId, vagueId);
  if (!inscription) {
    return errorResponse(res, 'Inscription introuvable', 404);
  }

  // Supprimer l'inscription
  const deleted = await InscriptionModel.deleteByVagueAndEtudiant(vagueId, etudiantId);

  if (!deleted) {
    return errorResponse(res, 'Erreur lors de la suppression', 400);
  }

  return successResponse(res, null, 'Étudiant retiré de la vague avec succès');
});

// Obtenir les inscriptions d'un étudiant
export const getInscriptionsByEtudiant = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const inscriptions = await InscriptionModel.findByEtudiant(id);

  return successResponse(res, inscriptions, 'Inscriptions de l\'étudiant récupérées avec succès');
});

// Changer le statut d'une inscription
export const updateInscriptionStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { statut } = req.body;

  // Vérifier si l'inscription existe
  const inscription = await InscriptionModel.findById(id);
  if (!inscription) {
    return errorResponse(res, 'Inscription introuvable', 404);
  }

  const updated = await InscriptionModel.updateStatus(id, statut);

  if (!updated) {
    return errorResponse(res, 'Erreur lors de la mise à jour du statut', 400);
  }

  const updatedInscription = await InscriptionModel.findById(id);

  return successResponse(res, updatedInscription, 'Statut de l\'inscription mis à jour avec succès');
});

// Obtenir les statistiques d'inscriptions
export const getInscriptionStats = asyncHandler(async (req, res) => {
  const filters = {
    date_debut: req.query.date_debut,
    date_fin: req.query.date_fin
  };

  const stats = await InscriptionModel.getStats(filters);

  return successResponse(res, stats, 'Statistiques récupérées avec succès');
});
