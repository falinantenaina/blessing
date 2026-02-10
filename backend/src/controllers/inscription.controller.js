import EtudiantModel from "../models/etudiant.model.js";
import InscriptionModel from "../models/inscription.model.js";
import VagueModel from "../models/vague.model.js";
import {
  asyncHandler,
  errorResponse,
  successResponse,
} from "../utils/response.js";

// Créer une inscription complète par l'administration
export const createInscriptionComplete = asyncHandler(async (req, res) => {
  const {
    // Étudiant
    etudiant_nom,
    etudiant_prenom,
    etudiant_telephone,
    etudiant_email,
    // Vague
    vague_id,
    // Paiements / options admin
    methode_paiement,
    frais_inscription_paye,
    montant_ecolage_initial,
    livre1_paye,
    livre2_paye,
    remarques,
  } = req.body;

  // Validation des champs obligatoires
  if (!etudiant_nom || !etudiant_prenom || !etudiant_telephone || !vague_id) {
    return errorResponse(
      res,
      "Nom, prénom, téléphone et vague sont obligatoires",
      400,
    );
  }

  // Vérifier si l'étudiant existe déjà
  let etudiant = await EtudiantModel.findByTelephone(etudiant_telephone);
  let etudiantId;

  if (etudiant) {
    etudiantId = etudiant.id;
  } else {
    etudiantId = await EtudiantModel.create({
      nom: etudiant_nom,
      prenom: etudiant_prenom,
      telephone: etudiant_telephone,
      email: etudiant_email || null,
    });
  }

  // Vérifier si la vague existe et est disponible
  const vague = await VagueModel.findById(vague_id);
  if (!vague) return errorResponse(res, "Vague introuvable", 404);

  if (vague.statut !== "planifie" && vague.statut !== "en_cours") {
    return errorResponse(res, "Cette vague n'accepte plus d'inscriptions", 400);
  }

  if (vague.capacite_max && vague.nb_inscrits >= vague.capacite_max) {
    return errorResponse(res, "La vague est complète", 400);
  }

  // Vérifier si l'étudiant est déjà inscrit à cette vague
  const inscriptionExistante = await InscriptionModel.findByEtudiantAndVague(
    etudiantId,
    vague_id,
  );
  if (inscriptionExistante) {
    return errorResponse(res, "L'étudiant est déjà inscrit à cette vague", 409);
  }

  // Créer l'inscription complète
  const result = await InscriptionModel.createComplete({
    etudiant_id: etudiantId,
    vague_id,
    date_inscription: new Date().toISOString().split("T")[0],
    frais_inscription_paye: frais_inscription_paye || false,
    montant_ecolage_initial: montant_ecolage_initial || 0,
    livre1_paye: livre1_paye || false,
    livre2_paye: livre2_paye || false,
    remarques: remarques || "Inscription effectuée par l'administration",
  });

  // Ajouter le paiement initial si fourni
  if (montant_ecolage_initial && montant_ecolage_initial > 0) {
    await InscriptionModel.addPaiement({
      inscription_id: result.inscriptionId,
      type_paiement: "ecolage",
      montant: montant_ecolage_initial,
      date_paiement: new Date(),
      methode_paiement: methode_paiement,
      reference: "Paiement enregistré par admin",
      remarques: "Paiement initial par le secrétaire",
      utilisateur_id: req.user.id, // ID de l'admin
    });
  }

  // Récupérer les détails complets
  const inscription = await InscriptionModel.findById(result.inscriptionId);

  return successResponse(
    res,
    inscription,
    "Inscription complète créée par l'administration",
    201,
  );
});

// Obtenir les détails d'une inscription
export const getInscriptionDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const inscription = await InscriptionModel.findById(id);
  if (!inscription) return errorResponse(res, "Inscription introuvable", 404);

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

// Ajouter un paiement à une inscription
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

  if (!updated) return errorResponse(res, "Erreur lors de la mise à jour", 400);

  const inscription = await InscriptionModel.findById(inscriptionId);
  return successResponse(res, inscription, "Statut du livre mis à jour");
});

// Obtenir les statistiques des inscriptions
export const getInscriptionStats = asyncHandler(async (req, res) => {
  const filters = {
    date_debut: req.query.date_debut,
    date_fin: req.query.date_fin,
  };

  const stats = await InscriptionModel.getStats(filters);

  return successResponse(res, stats, "Statistiques récupérées");
});
