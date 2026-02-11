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
    reference_mvola,
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

  // Validation pour mvola
  if (methode_paiement === "mvola" && !reference_mvola) {
    return errorResponse(
      res,
      "La référence MVola est requise pour ce mode de paiement",
      400,
    );
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
      etudiantId = etudiant.id;
    } else {
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

    // Déterminer les paiements effectués
    const frais_inscription_paye =
      montant_paye && montant_paye >= niveau.frais_inscription;
    const montantRestant = montant_paye ? parseFloat(montant_paye) : 0;

    // Créer l'inscription avec statut EN ATTENTE
    const inscriptionData = {
      etudiant_id: etudiantId,
      vague_id: vague_id,
      frais_inscription_paye,
      livre_cours_paye: false,
      livre_exercices_paye: false,
      methode_paiement: methode_paiement || "especes",
      reference_mvola: reference_mvola || null,
      remarques: remarques || "Inscription publique en attente de validation",
      statut_inscription: "en_attente", // EN ATTENTE DE VALIDATION PAR L'ADMIN
    };

    const result = await InscriptionModel.createComplete(inscriptionData);

    // Calculer le montant total
    const montant_total =
      parseFloat(niveau.frais_inscription) +
      parseFloat(niveau.prix_livre_cours) +
      parseFloat(niveau.prix_livre_exercices);

    return successResponse(
      res,
      {
        inscription_id: result.inscriptionId,
        etudiant_id: etudiantId,
        vague_nom: vague.nom,
        niveau: niveau.code,
        montant_total,
        montant_paye: montant_paye || 0,
        montant_restant: montant_total - (montant_paye || 0),
        statut: "en_attente",
        message:
          "Inscription enregistrée ! Elle sera validée par un administrateur sous peu. Vous recevrez une confirmation par SMS/Email.",
      },
      "Inscription créée avec succès",
      201,
    );
  } catch (error) {
    console.error("Erreur lors de l'inscription publique:", error);
    return errorResponse(
      res,
      error.message || "Erreur lors de l'inscription",
      500,
    );
  }
});

// Obtenir les vagues disponibles pour inscription publique
export const getVaguesDisponibles = asyncHandler(async (req, res) => {
  const vagues = await VagueModel.findAll({
    statut: "planifie,en_cours",
    page: 1,
    limit: 100,
  });

  // Enrichir avec les informations de niveau
  const vaguesAvecNiveau = await Promise.all(
    vagues.vagues.map(async (vague) => {
      const niveau = await NiveauModel.findById(vague.niveau_id);
      return {
        ...vague,
        frais_inscription: niveau.frais_inscription,
        prix_livre_cours: niveau.prix_livre_cours,
        prix_livre_exercices: niveau.prix_livre_exercices,
        montant_total:
          parseFloat(niveau.frais_inscription) +
          parseFloat(niveau.prix_livre_cours) +
          parseFloat(niveau.prix_livre_exercices),
        places_disponibles: vague.capacite_max - vague.nb_inscrits,
      };
    }),
  );

  // Filtrer uniquement les vagues avec places disponibles
  const vaguesDisponibles = vaguesAvecNiveau.filter(
    (v) => v.places_disponibles > 0,
  );

  return successResponse(
    res,
    vaguesDisponibles,
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
      inscriptions: inscriptions.map((i) => ({
        ...i,
        statut_libelle: getStatutLibelle(i.statut_inscription),
      })),
    },
    "Informations récupérées avec succès",
  );
});

// Fonction helper pour le libellé du statut
function getStatutLibelle(statut) {
  const libelles = {
    en_attente: "En attente de validation",
    validee: "Validée",
    rejetee: "Rejetée",
    actif: "Active",
    abandonne: "Abandonnée",
    termine: "Terminée",
    suspendu: "Suspendue",
  };
  return libelles[statut] || statut;
}
