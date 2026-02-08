import EtudiantModel from "../models/etudiant.model.js";
import InscriptionModel from "../models/inscription.model.js";
import NiveauModel from "../models/niveau.model.js";
import VagueModel from "../models/vague.model.js";
import {
  asyncHandler,
  errorResponse,
  successResponse,
} from "../utils/response.js";

// Inscription publique (sans authentification)
export const inscriptionPublique = asyncHandler(async (req, res) => {
  const {
    nom,
    prenom,
    telephone,
    email,
    vague_id,
    montant_paye,
    reference_paiement,
    methode_paiement,
    remarques,
  } = req.body;

  // Validation des champs obligatoires
  if (!nom || !prenom || !telephone || !vague_id) {
    return errorResponse(
      res,
      "Les champs nom, prénom, téléphone et vague sont obligatoires",
      400,
    );
  }

  // Validation du téléphone (format Madagascar)
  const phoneRegex = /^(\+261|0)(32|33|34|37|38)\s?\d{2}\s?\d{3}\s?\d{2}$/;
  if (!phoneRegex.test(telephone.replace(/\s/g, ""))) {
    return errorResponse(res, "Le numéro de téléphone n'est pas valide", 400);
  }

  // Vérifier que la vague existe et est disponible
  const vague = await VagueModel.findById(vague_id);
  if (!vague) {
    return errorResponse(res, "Vague introuvable", 404);
  }

  if (vague.statut !== "planifie" && vague.statut !== "en_cours") {
    return errorResponse(res, "Cette vague n'accepte plus d'inscriptions", 400);
  }

  // Vérifier la capacité
  if (vague.capacite_max && vague.nb_inscrits >= vague.capacite_max) {
    return errorResponse(res, "La vague est complète", 400);
  }

  // Récupérer les informations du niveau pour les montants
  const niveau = await NiveauModel.findById(vague.niveau_id);
  if (!niveau) {
    return errorResponse(res, "Niveau introuvable", 404);
  }

  try {
    // Vérifier si l'étudiant existe déjà
    let etudiant = await EtudiantModel.findByTelephone(telephone);
    let etudiantId;

    if (etudiant) {
      // Étudiant existe déjà, utiliser son ID
      etudiantId = etudiant.id;
    } else {
      // Créer un nouveau étudiant
      etudiantId = await EtudiantModel.create({
        nom,
        prenom,
        telephone,
        email: email || null,
      });
    }

    // Vérifier si l'étudiant n'est pas déjà inscrit à cette vague
    const inscriptionExistante = await InscriptionModel.findByEtudiantAndVague(
      etudiantId,
      vague_id,
    );
    if (inscriptionExistante) {
      return errorResponse(res, "Vous êtes déjà inscrit à cette vague", 409);
    }

    // Créer l'inscription avec les informations de paiement
    const inscriptionData = {
      etudiant_id: etudiantId,
      vague_id: vague_id,
      frais_inscription_paye:
        montant_paye && montant_paye >= niveau.frais_inscription,
      montant_ecolage_initial: 0, // Aucun paiement d'écolage pour l'instant
      livre1_paye: false,
      livre2_paye: false,
      remarques: remarques || "Inscription publique",
    };

    const result = await InscriptionModel.createComplete(inscriptionData);

    // Ajouter le paiement si un montant est fourni
    if (montant_paye && montant_paye > 0) {
      await InscriptionModel.addPaiement({
        inscription_id: result.inscriptionId,
        type_paiement: "inscription",
        montant: montant_paye,
        date_paiement: new Date(),
        methode_paiement: methode_paiement || "mobile_money",
        reference: reference_paiement || "",
        remarques: "Paiement inscription publique",
      });
    }

    // Récupérer les détails complets de l'inscription
    const inscription = await InscriptionModel.findById(result.inscriptionId);

    return successResponse(
      res,
      {
        inscription_id: result.inscriptionId,
        etudiant_id: etudiantId,
        vague_nom: vague.nom,
        niveau: niveau.code,
        montant_total:
          niveau.frais_inscription +
          niveau.frais_ecolage +
          niveau.prix_livre * 2,
        montant_paye: montant_paye || 0,
        montant_restant:
          niveau.frais_inscription +
          niveau.frais_ecolage +
          niveau.prix_livre * 2 -
          (montant_paye || 0),
        statut: "en_attente", // En attente de confirmation/validation
        message:
          "Inscription effectuée avec succès ! Vous recevrez une confirmation par SMS/Email.",
      },
      "Inscription créée avec succès",
      201,
    );
  } catch (error) {
    console.error("Erreur lors de l'inscription publique:", error);
    return errorResponse(res, "Erreur lors de l'inscription", 500);
  }
});

// Obtenir les vagues disponibles pour inscription publique
export const getVaguesDisponibles = asyncHandler(async (req, res) => {
  const vagues = await VagueModel.findAll({
    statut: "planifie,en_cours",
    disponible_inscription: true,
  });

  // Enrichir avec les informations de niveau
  const vaguesAvecNiveau = await Promise.all(
    vagues.data.map(async (vague) => {
      const niveau = await NiveauModel.findById(vague.niveau_id);
      return {
        ...vague,
        frais_inscription: niveau.frais_inscription,
        frais_ecolage: niveau.frais_ecolage,
        prix_livre: niveau.prix_livre,
        montant_total:
          niveau.frais_inscription +
          niveau.frais_ecolage +
          niveau.prix_livre * 2,
        places_disponibles: vague.capacite_max - vague.nb_inscrits,
      };
    }),
  );

  return successResponse(
    res,
    vaguesAvecNiveau,
    "Vagues disponibles récupérées avec succès",
  );
});

// Vérifier le statut d'une inscription par téléphone
export const verifierInscription = asyncHandler(async (req, res) => {
  const { telephone } = req.params;

  const etudiant = await EtudiantModel.findByTelephone(telephone);
  if (!etudiant) {
    return errorResponse(res, "Aucune inscription trouvée pour ce numéro", 404);
  }

  const inscriptions = await InscriptionModel.findByEtudiant(etudiant.id);

  return successResponse(
    res,
    {
      etudiant: {
        nom: etudiant.nom,
        prenom: etudiant.prenom,
        telephone: etudiant.telephone,
      },
      inscriptions: inscriptions,
    },
    "Informations récupérées avec succès",
  );
});
