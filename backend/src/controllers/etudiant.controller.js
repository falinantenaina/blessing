import EtudiantModel from "../models/etudiant.model.js";
import InscriptionModel from "../models/inscription.model.js";
import FinanceModel from "../models/finance.model.js";
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

  return paginatedResponse(
    res,
    result.etudiants,
    result.page,
    result.limit,
    result.total,
    "Liste des étudiants récupérée avec succès",
  );
});

// ===== NOUVEAU: Obtenir un étudiant avec TOUS LES DÉTAILS (VERSION ROBUSTE) =====
export const getEtudiantComplet = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Récupérer les infos de base de l'étudiant
    const etudiant = await EtudiantModel.findById(id);
    if (!etudiant) {
      return errorResponse(res, "Étudiant introuvable", 404);
    }

    console.log("✅ Étudiant trouvé:", etudiant.id);

    // 2. Récupérer toutes les inscriptions (avec gestion d'erreur)
    let inscriptions = [];
    try {
      inscriptions = await InscriptionModel.findByEtudiant(id);
      console.log("✅ Inscriptions trouvées:", inscriptions.length);
    } catch (error) {
      console.error("⚠️ Erreur inscriptions:", error.message);
      // Continue même si les inscriptions échouent
    }

    // 3. Récupérer tous les écolages (avec gestion d'erreur)
    let ecolagesAvecPaiements = [];
    try {
      // Vérifier si la méthode existe
      if (typeof FinanceModel.getEcolagesByEtudiant === 'function') {
        const ecolages = await FinanceModel.getEcolagesByEtudiant(id);
        console.log("✅ Écolages trouvés:", ecolages.length);

        // Pour chaque écolage, récupérer les paiements
        ecolagesAvecPaiements = await Promise.all(
          ecolages.map(async (ecolage) => {
            try {
              const paiements = await FinanceModel.getPaiementsByEcolage(ecolage.id);
              return {
                ...ecolage,
                paiements: paiements || [],
              };
            } catch (err) {
              console.error(`⚠️ Erreur paiements écolage ${ecolage.id}:`, err.message);
              return {
                ...ecolage,
                paiements: [],
              };
            }
          })
        );
      } else {
        console.warn("⚠️ FinanceModel.getEcolagesByEtudiant n'existe pas");
      }
    } catch (error) {
      console.error("⚠️ Erreur écolages:", error.message);
      // Continue même si les écolages échouent
    }

    // 4. Calculer les statistiques financières globales
    const statsFinancieres = {
      total_a_payer: 0,
      total_paye: 0,
      total_restant: 0,
      nombre_ecolages: ecolagesAvecPaiements.length,
      ecolages_payes: 0,
      ecolages_partiels: 0,
      ecolages_non_payes: 0,
    };

    ecolagesAvecPaiements.forEach((ecolage) => {
      statsFinancieres.total_a_payer += parseFloat(ecolage.montant_total || 0);
      statsFinancieres.total_paye += parseFloat(ecolage.montant_paye || 0);
      statsFinancieres.total_restant += parseFloat(ecolage.montant_restant || 0);

      if (ecolage.statut === "paye") statsFinancieres.ecolages_payes++;
      else if (ecolage.statut === "partiel") statsFinancieres.ecolages_partiels++;
      else statsFinancieres.ecolages_non_payes++;
    });

    // 5. Calculer les statistiques des livres
    const statsLivres = {
      total_livres: inscriptions.length * 2, // 2 livres par inscription
      livres_payes: 0,
      livres_non_payes: 0,
      livres_recus: 0,
      livres_non_recus: 0,
    };

    inscriptions.forEach((insc) => {
      // Livre 1
      if (insc.livre1_paye) statsLivres.livres_payes++;
      else statsLivres.livres_non_payes++;

      if (insc.livre1_recu) statsLivres.livres_recus++;
      else statsLivres.livres_non_recus++;

      // Livre 2
      if (insc.livre2_paye) statsLivres.livres_payes++;
      else statsLivres.livres_non_payes++;

      if (insc.livre2_recu) statsLivres.livres_recus++;
      else statsLivres.livres_non_recus++;
    });

    // 6. Organiser les vagues avec leurs détails
    const vaguesDetails = inscriptions.map((insc) => ({
      inscription_id: insc.id,
      vague_id: insc.vague_id,
      vague_nom: insc.vague_nom || "Vague sans nom",
      niveau_nom: insc.niveau_nom || "N/A",
      niveau_code: insc.niveau_code || "N/A",
      salle_nom: insc.salle_nom || "N/A",
      enseignant_nom: insc.enseignant_nom || "N/A",
      horaires_resume: insc.horaires_resume || "Non défini",
      date_inscription: insc.date_inscription,
      statut_inscription: insc.statut || "actif",

      // Détails des livres
      livres: {
        livre1: {
          paye: Boolean(insc.livre1_paye),
          recu: Boolean(insc.livre1_recu),
          date_paiement: insc.livre1_date_paiement || null,
          date_reception: insc.livre1_date_reception || null,
        },
        livre2: {
          paye: Boolean(insc.livre2_paye),
          recu: Boolean(insc.livre2_recu),
          date_paiement: insc.livre2_date_paiement || null,
          date_reception: insc.livre2_date_reception || null,
        },
      },

      // Frais d'inscription
      frais_inscription_paye: Boolean(insc.frais_inscription_paye),

      remarques: insc.remarques || null,
    }));

    // 7. Construire la réponse complète
    const etudiantComplet = {
      // Informations de base
      id: etudiant.id,
      nom: etudiant.nom,
      prenom: etudiant.prenom,
      nom_complet: `${etudiant.nom} ${etudiant.prenom}`,
      telephone: etudiant.telephone,
      email: etudiant.email || null,
      actif: Boolean(etudiant.actif),
      date_creation: etudiant.date_creation || etudiant.created_at,
      remarques_generales: etudiant.remarques || null,

      // Statistiques générales
      statistiques: {
        nombre_inscriptions: inscriptions.length,
        inscriptions_actives: inscriptions.filter((i) => i.statut === "actif").length,
        inscriptions_terminees: inscriptions.filter((i) => i.statut === "termine").length,
        inscriptions_abandonnees: inscriptions.filter((i) => i.statut === "abandonne").length,

        finance: statsFinancieres,
        livres: statsLivres,
      },

      // Vagues et inscriptions
      vagues: vaguesDetails,

      // Détails financiers
      finance: {
        ecolages: ecolagesAvecPaiements,
        resume: {
          montant_total: statsFinancieres.total_a_payer,
          montant_paye: statsFinancieres.total_paye,
          montant_restant: statsFinancieres.total_restant,
          pourcentage_paye:
            statsFinancieres.total_a_payer > 0
              ? ((statsFinancieres.total_paye / statsFinancieres.total_a_payer) * 100).toFixed(2)
              : "0.00",
        },
      },

      // Historique des paiements (tous les paiements de tous les écolages)
      historique_paiements: ecolagesAvecPaiements
        .flatMap((ecolage) =>
          (ecolage.paiements || []).map((p) => ({
            ...p,
            vague_nom: inscriptions.find((i) => i.id === ecolage.inscription_id)?.vague_nom || "N/A",
            ecolage_id: ecolage.id,
          }))
        )
        .sort((a, b) => new Date(b.date_paiement) - new Date(a.date_paiement)),
    };

    console.log("✅ Réponse construite avec succès");

    return successResponse(
      res,
      etudiantComplet,
      "Détails complets de l'étudiant récupérés avec succès"
    );
  } catch (error) {
    console.error("❌ ERREUR COMPLÈTE:", error);
    console.error("Stack:", error.stack);
    return errorResponse(
      res,
      `Erreur lors de la récupération des détails: ${error.message}`,
      500
    );
  }
});

// Obtenir un étudiant par ID (version simplifiée)
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