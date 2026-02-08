import InscriptionModel from "../models/inscription.model.js";
import VagueModel from "../models/vague.model.js";
import {
  asyncHandler,
  errorResponse,
  successResponse,
} from "../utils/response.js";

// Créer une inscription complète (inscription directe)
export const createInscriptionComplete = asyncHandler(async (req, res) => {
  const {
    // Étudiant
    etudiant_nom,
    etudiant_prenom,
    etudiant_telephone,
    etudiant_email,
    // Vague
    vague_id,
    // Paiements
    frais_inscription_paye,
    montant_ecolage_initial,
    livre1_paye,
    livre2_paye,
    remarques,
  } = req.body;

  const userId = await UserModel.create({
    nom: etudiant_nom,
    prenom: etudiant_prenom,
    email: etudiant_email,
    telephone: etudiant_telephone,
    password,
  });

  // Vérifier si la vague existe et a de la place
  const vague = await VagueModel.findById(vague_id);
  if (!vague) {
    return errorResponse(res, "Vague introuvable", 404);
  }

  const capaciteDisponible = await VagueModel.checkCapacite(vague_id);
  if (!capaciteDisponible) {
    return errorResponse(
      res,
      "Cette vague a atteint sa capacité maximale",
      400,
    );
  }

  // Créer l'inscription complète
  const result = await InscriptionModel.createComplete({
    etudiant_nom,
    etudiant_prenom,
    etudiant_telephone,
    etudiant_email,
    etudiant_id,
    vague_id,
    date_inscription: new Date().toISOString().split("T")[0],
    frais_inscription_paye: frais_inscription_paye || false,
    montant_ecolage_initial: montant_ecolage_initial || 0,
    livre1_paye: livre1_paye || false,
    livre2_paye: livre2_paye || false,
    remarques,
  });

  const inscription = await InscriptionModel.findById(result.inscriptionId);

  return successResponse(
    res,
    inscription,
    "Inscription créée avec succès",
    201,
  );
});

// Obtenir les détails d'une inscription
export const getInscriptionDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const inscription = await InscriptionModel.findById(id);

  if (!inscription) {
    return errorResponse(res, "Inscription introuvable", 404);
  }

  return successResponse(
    res,
    inscription,
    "Détails de l'inscription récupérés",
  );
});

// Obtenir les inscriptions d'un étudiant
export const getInscriptionsByEtudiant = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const inscriptions = await InscriptionModel.findByEtudiant(id);

  return successResponse(
    res,
    inscriptions,
    "Inscriptions de l'étudiant récupérées",
  );
});

// Ajouter un paiement
export const addPaiement = asyncHandler(async (req, res) => {
  const {
    inscription_id,
    type_paiement,
    montant,
    date_paiement,
    methode_paiement,
    reference,
    remarques,
  } = req.body;

  const paiementId = await InscriptionModel.addPaiement({
    inscription_id,
    type_paiement,
    montant,
    date_paiement: date_paiement || new Date().toISOString().split("T")[0],
    methode_paiement,
    reference,
    remarques,
    utilisateur_id: req.user.id,
  });

  const inscription = await InscriptionModel.findById(inscription_id);

  return successResponse(
    res,
    inscription,
    "Paiement enregistré avec succès",
    201,
  );
});

// Mettre à jour le statut d'un livre
export const updateLivreStatut = asyncHandler(async (req, res) => {
  const { inscriptionId, numeroLivre } = req.params;
  const { statut_paiement, statut_livraison } = req.body;

  const updated = await InscriptionModel.updateLivreStatut(
    inscriptionId,
    numeroLivre,
    { statut_paiement, statut_livraison },
  );

  if (!updated) {
    return errorResponse(res, "Erreur lors de la mise à jour", 400);
  }

  const inscription = await InscriptionModel.findById(inscriptionId);

  return successResponse(res, inscription, "Statut du livre mis à jour");
});

// Obtenir les statistiques
export const getInscriptionStats = asyncHandler(async (req, res) => {
  const filters = {
    date_debut: req.query.date_debut,
    date_fin: req.query.date_fin,
  };

  const stats = await InscriptionModel.getStats(filters);

  return successResponse(res, stats, "Statistiques récupérées");
});
