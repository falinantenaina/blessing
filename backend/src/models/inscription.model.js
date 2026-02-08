import { pool } from "../config/database.js";

class InscriptionModel {
  // Créer une inscription complète (étudiant + inscription + écolage + livres)
  static async createComplete(inscriptionData) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const {
        // Données étudiant
        etudiant_nom,
        etudiant_prenom,
        etudiant_telephone,
        etudiant_email = null,
        etudiant_id = null,
        // Données inscription
        vague_id,
        date_inscription,
        remarques = null,
        // Paiement initial
        frais_inscription_paye = false,
        montant_ecolage_initial = 0,
        livre1_paye = false,
        livre2_paye = false,
      } = inscriptionData;

      let finalEtudiantId = etudiant_id;

      // Créer l'étudiant si nouveau
      if (!etudiant_id) {
        const [etudiantResult] = await connection.execute(
          `INSERT INTO etudiants (nom, prenom, telephone, email)
           VALUES (?, ?, ?, ?)`,
          [etudiant_nom, etudiant_prenom, etudiant_telephone, etudiant_email],
        );
        finalEtudiantId = etudiantResult.insertId;
      }

      // Créer l'inscription
      const [inscriptionResult] = await connection.execute(
        `INSERT INTO inscriptions (etudiant_id, vague_id, remarques)
         VALUES (?, ?, ?)`,
        [finalEtudiantId, vague_id, remarques],
      );

      const inscriptionId = inscriptionResult.insertId;

      // Récupérer les frais du niveau
      const [niveauRows] = await connection.execute(
        `SELECT n.frais_inscription, n.frais_ecolage, n.frais_livre
         FROM vagues v
         JOIN niveaux n ON v.niveau_id = n.id
         WHERE v.id = ?`,
        [vague_id],
      );

      if (niveauRows.length === 0) {
        throw new Error("Vague ou niveau introuvable");
      }

      const { frais_inscription, frais_ecolage, frais_livre } = niveauRows[0];

      // Calculer montants
      const montant_total_ecolage =
        parseInt(frais_inscription) + parseInt(frais_ecolage);
      const montant_paye_ecolage =
        (frais_inscription_paye ? parseInt(frais_inscription) : 0) +
        parseInt(montant_ecolage_initial);
      const montant_restant = montant_total_ecolage - montant_paye_ecolage;

      let statut_ecolage = "non_paye";
      if (montant_paye_ecolage >= montant_total_ecolage) {
        statut_ecolage = "paye";
      } else if (montant_paye_ecolage > 0) {
        statut_ecolage = "partiel";
      }

      // Créer l'écolage
      await connection.execute(
        `INSERT INTO ecolages (inscription_id, montant_total, montant_paye, montant_restant, frais_inscription_paye, statut)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          inscriptionId,
          montant_total_ecolage,
          montant_paye_ecolage,
          montant_restant,
          frais_inscription_paye,
          statut_ecolage,
        ],
      );

      // Créer les 2 livres
      for (let i = 1; i <= 2; i++) {
        const livre_paye = i === 1 ? livre1_paye : livre2_paye;
        await connection.execute(
          `INSERT INTO livres (inscription_id, numero_livre, prix, statut_paiement, statut_livraison)
           VALUES (?, ?, ?, ?, 'non_livre')`,
          [inscriptionId, i, frais_livre, livre_paye ? "paye" : "non_paye"],
        );
      }

      // Enregistrer paiements si effectués
      if (frais_inscription_paye) {
        await connection.execute(
          `INSERT INTO paiements (inscription_id, type_paiement, montant, date_paiement, methode_paiement)
           VALUES (?, 'inscription', ?, ?, 'especes')`,
          [inscriptionId, frais_inscription, date_inscription],
        );
      }

      if (montant_ecolage_initial > 0) {
        await connection.execute(
          `INSERT INTO paiements (inscription_id, type_paiement, montant, date_paiement, methode_paiement)
           VALUES (?, 'ecolage', ?, ?, 'especes')`,
          [inscriptionId, montant_ecolage_initial, date_inscription],
        );
      }

      if (livre1_paye) {
        await connection.execute(
          `INSERT INTO paiements (inscription_id, type_paiement, montant, date_paiement, methode_paiement, remarques)
           VALUES (?, 'livre', ?, ?, 'especes', 'Livre 1')`,
          [inscriptionId, frais_livre, date_inscription],
        );
      }

      if (livre2_paye) {
        await connection.execute(
          `INSERT INTO paiements (inscription_id, type_paiement, montant, date_paiement, methode_paiement, remarques)
           VALUES (?, 'livre', ?, ?, 'especes', 'Livre 2')`,
          [inscriptionId, frais_livre, date_inscription],
        );
      }

      await connection.commit();
      return { inscriptionId, etudiantId: finalEtudiantId };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Trouver une inscription par ID avec détails complets
  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT i.*,
              e.nom as etudiant_nom, e.prenom as etudiant_prenom, 
              e.email as etudiant_email, e.telephone as etudiant_telephone,
              v.nom as vague_nom, v.date_debut, v.date_fin,
              n.code as niveau_code, n.nom as niveau_nom,
              ec.montant_total, ec.montant_paye, ec.montant_restant, 
              ec.frais_inscription_paye, ec.statut
       FROM inscriptions i
       JOIN etudiants e ON i.etudiant_id = e.id
       JOIN vagues v ON i.vague_id = v.id
       JOIN niveaux n ON v.niveau_id = n.id
       LEFT JOIN ecolages ec ON i.id = ec.inscription_id
       WHERE i.id = ?`,
      [id],
    );

    if (rows.length === 0) return null;

    // Récupérer les livres
    const [livres] = await pool.execute(
      "SELECT * FROM livres WHERE inscription_id = ? ORDER BY numero_livre",
      [id],
    );

    // Récupérer les paiements
    const [paiements] = await pool.execute(
      "SELECT * FROM paiements WHERE inscription_id = ? ORDER BY date_paiement DESC",
      [id],
    );

    return {
      ...rows[0],
      livres,
      paiements,
    };
  }

  // Vérifier si un étudiant est déjà inscrit à une vague
  static async findByEtudiantAndVague(etudiantId, vagueId) {
    const [rows] = await pool.execute(
      "SELECT * FROM inscriptions WHERE etudiant_id = ? AND vague_id = ?",
      [etudiantId, vagueId],
    );
    return rows[0];
  }

  // Obtenir toutes les inscriptions d'un étudiant
  static async findByEtudiant(etudiantId) {
    const [rows] = await pool.execute(
      `SELECT i.*,
              v.nom as vague_nom, v.date_debut, v.date_fin, v.statut as vague_statut,
              n.code as niveau_code, n.nom as niveau_nom,
              s.nom as salle_nom,
              ec.montant_total, ec.montant_paye, ec.montant_restant, ec.statut,
              (SELECT COUNT(*) FROM livres WHERE inscription_id = i.id AND statut_paiement = 'paye') as livres_payes,
              (SELECT COUNT(*) FROM livres WHERE inscription_id = i.id AND statut_livraison = 'livre') as livres_livres
       FROM inscriptions i
       JOIN vagues v ON i.vague_id = v.id
       JOIN niveaux n ON v.niveau_id = n.id
       LEFT JOIN salles s ON v.salle_id = s.id
       LEFT JOIN ecolages ec ON i.id = ec.inscription_id
       WHERE i.etudiant_id = ?
       ORDER BY i.date_inscription DESC`,
      [etudiantId],
    );

    return rows;
  }

  // Ajouter un paiement
  static async addPaiement(paiementData) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const {
        inscription_id,
        type_paiement,
        montant,
        date_paiement,
        methode_paiement,
        reference = null,
        remarques = null,
        utilisateur_id = null,
      } = paiementData;

      // Enregistrer le paiement
      const [paiementResult] = await connection.execute(
        `INSERT INTO paiements (inscription_id, type_paiement, montant, date_paiement, methode_paiement, reference, remarques, utilisateur_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          inscription_id,
          type_paiement,
          montant,
          date_paiement,
          methode_paiement,
          reference,
          remarques,
          utilisateur_id,
        ],
      );

      // Mettre à jour selon le type
      if (type_paiement === "inscription" || type_paiement === "ecolage") {
        await connection.execute(
          `UPDATE ecolages 
           SET montant_paye = montant_paye + ?,
               montant_restant = montant_restant - ?
           WHERE inscription_id = ?`,
          [montant, montant, inscription_id],
        );

        if (type_paiement === "inscription") {
          await connection.execute(
            "UPDATE ecolages SET frais_inscription_paye = TRUE WHERE inscription_id = ?",
            [inscription_id],
          );
        }

        // Recalculer le statut
        const [ecolage] = await connection.execute(
          "SELECT montant_total, montant_paye FROM ecolages WHERE inscription_id = ?",
          [inscription_id],
        );

        let statut = "non_paye";
        if (ecolage[0].montant_paye >= ecolage[0].montant_total) {
          statut = "paye";
        } else if (ecolage[0].montant_paye > 0) {
          statut = "partiel";
        }

        await connection.execute(
          "UPDATE ecolages SET statut = ? WHERE inscription_id = ?",
          [statut, inscription_id],
        );
      }

      await connection.commit();
      return paiementResult.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Mettre à jour le statut d'un livre
  static async updateLivreStatut(inscriptionId, numeroLivre, statuts) {
    const fields = [];
    const values = [];

    if (statuts.statut_paiement !== undefined) {
      fields.push("statut_paiement = ?");
      values.push(statuts.statut_paiement);
      if (statuts.statut_paiement === "paye") {
        fields.push("date_paiement = ?");
        values.push(new Date());
      }
    }

    if (statuts.statut_livraison !== undefined) {
      fields.push("statut_livraison = ?");
      values.push(statuts.statut_livraison);
      if (statuts.statut_livraison === "livre") {
        fields.push("date_livraison = ?");
        values.push(new Date());
      }
    }

    if (fields.length === 0) return false;

    values.push(inscriptionId, numeroLivre);

    const [result] = await pool.execute(
      `UPDATE livres SET ${fields.join(", ")} WHERE inscription_id = ? AND numero_livre = ?`,
      values,
    );

    return result.affectedRows > 0;
  }

  // Statistiques
  static async getStats(filters = {}) {
    let query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN i.statut = 'actif' THEN 1 ELSE 0 END) as actifs,
        SUM(CASE WHEN i.statut = 'abandonne' THEN 1 ELSE 0 END) as abandonnes
      FROM inscriptions i
      WHERE 1=1
    `;

    const params = [];

    if (filters.date_debut) {
      query += " AND i.date_inscription >= ?";
      params.push(filters.date_debut);
    }

    if (filters.date_fin) {
      query += " AND i.date_inscription <= ?";
      params.push(filters.date_fin);
    }

    const [rows] = await pool.execute(query, params);
    return rows[0];
  }
}

export default InscriptionModel;
