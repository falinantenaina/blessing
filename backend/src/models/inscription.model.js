import { pool } from "../config/database.js";

class InscriptionModel {
  // Créer une inscription complète (étudiant + inscription + livres)
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
        livre_cours_paye = false,
        livre_exercices_paye = false,
        methode_paiement = "especes",
        reference_mvola = null,
        // Statut (en_attente pour inscription publique, validee pour admin)
        statut_inscription = "en_attente",
        validee_par = null,
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
        `INSERT INTO inscriptions (etudiant_id, vague_id, statut_inscription, frais_inscription_paye, validee_par, remarques)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          finalEtudiantId,
          vague_id,
          statut_inscription,
          frais_inscription_paye,
          validee_par,
          remarques,
        ],
      );

      const inscriptionId = inscriptionResult.insertId;

      // Récupérer les prix des livres du niveau
      const [niveauRows] = await connection.execute(
        `SELECT n.frais_inscription, n.prix_livre_cours, n.prix_livre_exercices
         FROM vagues v
         JOIN niveaux n ON v.niveau_id = n.id
         WHERE v.id = ?`,
        [vague_id],
      );

      if (niveauRows.length === 0) {
        throw new Error("Vague ou niveau introuvable");
      }

      const { frais_inscription, prix_livre_cours, prix_livre_exercices } =
        niveauRows[0];

      // Créer les 2 livres (cours et exercices)
      await connection.execute(
        `INSERT INTO livres (inscription_id, type_livre, prix, statut_paiement, statut_livraison)
         VALUES (?, 'cours', ?, ?, 'non_livre')`,
        [
          inscriptionId,
          prix_livre_cours,
          livre_cours_paye ? "paye" : "non_paye",
        ],
      );

      await connection.execute(
        `INSERT INTO livres (inscription_id, type_livre, prix, statut_paiement, statut_livraison)
         VALUES (?, 'exercices', ?, ?, 'non_livre')`,
        [
          inscriptionId,
          prix_livre_exercices,
          livre_exercices_paye ? "paye" : "non_paye",
        ],
      );

      // Enregistrer les paiements si effectués
      const dateInscription =
        date_inscription || new Date().toISOString().split("T")[0];

      if (frais_inscription_paye) {
        // Validation pour mvola
        if (methode_paiement === "mvola" && !reference_mvola) {
          throw new Error(
            "La référence MVola est requise pour ce mode de paiement",
          );
        }

        await connection.execute(
          `INSERT INTO paiements (inscription_id, type_paiement, montant, date_paiement, methode_paiement, reference_mvola)
           VALUES (?, 'inscription', ?, ?, ?, ?)`,
          [
            inscriptionId,
            frais_inscription,
            dateInscription,
            methode_paiement,
            reference_mvola,
          ],
        );
      }

      if (livre_cours_paye) {
        if (methode_paiement === "mvola" && !reference_mvola) {
          throw new Error(
            "La référence MVola est requise pour ce mode de paiement",
          );
        }

        await connection.execute(
          `INSERT INTO paiements (inscription_id, type_paiement, type_livre, montant, date_paiement, methode_paiement, reference_mvola, remarques)
           VALUES (?, 'livre', 'cours', ?, ?, ?, ?, 'Livre de cours')`,
          [
            inscriptionId,
            prix_livre_cours,
            dateInscription,
            methode_paiement,
            reference_mvola,
          ],
        );
      }

      if (livre_exercices_paye) {
        if (methode_paiement === "mvola" && !reference_mvola) {
          throw new Error(
            "La référence MVola est requise pour ce mode de paiement",
          );
        }

        await connection.execute(
          `INSERT INTO paiements (inscription_id, type_paiement, type_livre, montant, date_paiement, methode_paiement, reference_mvola, remarques)
           VALUES (?, 'livre', 'exercices', ?, ?, ?, ?, 'Livre d\\'exercices')`,
          [
            inscriptionId,
            prix_livre_exercices,
            dateInscription,
            methode_paiement,
            reference_mvola,
          ],
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

  // Valider une inscription (par admin)
  static async validerInscription(inscriptionId, adminId, statut = "validee") {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [result] = await connection.execute(
        `UPDATE inscriptions 
         SET statut_inscription = ?,
             date_validation = NOW(),
             validee_par = ?
         WHERE id = ? AND statut_inscription = 'en_attente'`,
        [statut, adminId, inscriptionId],
      );

      if (result.affectedRows === 0) {
        throw new Error("Inscription introuvable ou déjà traitée");
      }

      // Si validée, changer le statut à 'actif'
      if (statut === "validee") {
        await connection.execute(
          `UPDATE inscriptions SET statut_inscription = 'actif' WHERE id = ?`,
          [inscriptionId],
        );
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Trouver une inscription par ID avec tous les détails
  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT i.*,
              e.nom as etudiant_nom, e.prenom as etudiant_prenom, 
              e.email as etudiant_email, e.telephone as etudiant_telephone,
              v.nom as vague_nom, v.date_debut, v.date_fin,
              n.code as niveau_code, n.nom as niveau_nom, n.frais_inscription,
              admin.nom as validee_par_nom, admin.prenom as validee_par_prenom
       FROM inscriptions i
       JOIN etudiants e ON i.etudiant_id = e.id
       JOIN vagues v ON i.vague_id = v.id
       JOIN niveaux n ON v.niveau_id = n.id
       LEFT JOIN utilisateurs admin ON i.validee_par = admin.id
       WHERE i.id = ?`,
      [id],
    );

    if (rows.length === 0) return null;

    // Récupérer les livres
    const [livres] = await pool.execute(
      "SELECT * FROM livres WHERE inscription_id = ? ORDER BY type_livre",
      [id],
    );

    // Récupérer les paiements
    const [paiements] = await pool.execute(
      `SELECT p.*, u.nom as utilisateur_nom, u.prenom as utilisateur_prenom
       FROM paiements p
       LEFT JOIN utilisateurs u ON p.utilisateur_id = u.id
       WHERE p.inscription_id = ? 
       ORDER BY p.date_paiement DESC`,
      [id],
    );

    // Calculer les montants
    const montant_total =
      parseFloat(rows[0].frais_inscription) +
      livres.reduce((sum, livre) => sum + parseFloat(livre.prix), 0);
    const montant_paye = paiements.reduce(
      (sum, p) => sum + parseFloat(p.montant),
      0,
    );

    return {
      ...rows[0],
      livres,
      paiements,
      montant_total,
      montant_paye,
      montant_restant: montant_total - montant_paye,
    };
  }

  // Obtenir les inscriptions en attente de validation
  static async findPendingValidation(filters = {}) {
    let query = `
      SELECT i.*,
             e.nom as etudiant_nom, e.prenom as etudiant_prenom, 
             e.telephone as etudiant_telephone,
             v.nom as vague_nom,
             n.code as niveau_code, n.frais_inscription
      FROM inscriptions i
      JOIN etudiants e ON i.etudiant_id = e.id
      JOIN vagues v ON i.vague_id = v.id
      JOIN niveaux n ON v.niveau_id = n.id
      WHERE i.statut_inscription = 'en_attente'
    `;
    const params = [];

    if (filters.search) {
      query += " AND (e.nom LIKE ? OR e.prenom LIKE ? OR e.telephone LIKE ?)";
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const offset = (page - 1) * limit;

    query += " ORDER BY i.date_inscription DESC LIMIT ? OFFSET ?";
    params.push(String(limit), String(offset));

    const [rows] = await pool.execute(query, params);

    // Compter le total
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM inscriptions i
      JOIN etudiants e ON i.etudiant_id = e.id
      WHERE i.statut_inscription = 'en_attente'
    `;
    const countParams = [];

    if (filters.search) {
      countQuery +=
        " AND (e.nom LIKE ? OR e.prenom LIKE ? OR e.telephone LIKE ?)";
      const searchTerm = `%${filters.search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const [countResult] = await pool.execute(countQuery, countParams);

    return {
      inscriptions: rows,
      total: countResult[0].total,
      page,
      limit,
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
              n.code as niveau_code, n.nom as niveau_nom, n.frais_inscription,
              s.nom as salle_nom,
              (SELECT COUNT(*) FROM livres WHERE inscription_id = i.id AND statut_paiement = 'paye') as livres_payes,
              (SELECT COUNT(*) FROM livres WHERE inscription_id = i.id AND statut_livraison = 'livre') as livres_livres
       FROM inscriptions i
       JOIN vagues v ON i.vague_id = v.id
       JOIN niveaux n ON v.niveau_id = n.id
       LEFT JOIN salles s ON v.salle_id = s.id
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
        type_livre,
        montant,
        date_paiement,
        methode_paiement,
        reference_mvola = null,
        remarques = null,
        utilisateur_id = null,
      } = paiementData;

      // Validation pour mvola
      if (methode_paiement === "mvola" && !reference_mvola) {
        throw new Error(
          "La référence MVola est requise pour ce mode de paiement",
        );
      }

      // Validation pour livre
      if (type_paiement === "livre" && !type_livre) {
        throw new Error(
          "Le type de livre est requis pour un paiement de livre",
        );
      }

      if (type_paiement === "inscription") {
        const [rows] = await connection.execute(
          `SELECT n.frais_inscription,
                  COALESCE(SUM(p.montant), 0) as total_deja_paye
           FROM inscriptions i
           JOIN vagues v ON i.vague_id = v.id
           JOIN niveaux n ON v.niveau_id = n.id
           LEFT JOIN paiements p ON p.inscription_id = i.id AND p.type_paiement = 'inscription'
           WHERE i.id = ?
           GROUP BY i.id, n.frais_inscription`,
          [inscription_id],
        );

        if (rows.length === 0) throw new Error("Inscription introuvable");

        const { frais_inscription, total_deja_paye } = rows[0];
        const restant =
          parseFloat(frais_inscription) - parseFloat(total_deja_paye);

        // Se baser uniquement sur le restant calculé, pas sur le flag booléen
        if (restant <= 0) {
          throw new Error(
            "Les frais d'inscription ont déjà été entièrement payés",
          );
        }

        if (parseFloat(montant) > restant) {
          throw new Error(
            `Montant trop élevé. Restant dû : ${restant.toLocaleString("fr-FR")} Ar`,
          );
        }
      }

      if (type_paiement === "livre") {
        const [rows] = await connection.execute(
          `SELECT l.statut_paiement, l.prix,
            COALESCE(SUM(p.montant), 0) as total_deja_paye
     FROM livres l
     LEFT JOIN paiements p ON p.inscription_id = l.inscription_id 
                           AND p.type_paiement = 'livre' 
                           AND p.type_livre = l.type_livre
     WHERE l.inscription_id = ? AND l.type_livre = ?
     GROUP BY l.id, l.statut_paiement, l.prix`,
          [inscription_id, type_livre],
        );

        if (rows.length === 0) {
          throw new Error(
            `Livre de ${type_livre} introuvable pour cette inscription`,
          );
        }

        const { statut_paiement, prix, total_deja_paye } = rows[0];

        if (statut_paiement === "paye") {
          throw new Error(
            `Le livre de ${type_livre} a déjà été entièrement payé`,
          );
        }

        const restant = parseFloat(prix) - parseFloat(total_deja_paye);

        if (parseFloat(montant) > restant) {
          throw new Error(
            `Montant trop élevé. Restant dû pour le livre de ${type_livre} : ${restant.toLocaleString("fr-FR")} Ar`,
          );
        }
      }

      // Enregistrer le paiement
      const [paiementResult] = await connection.execute(
        `INSERT INTO paiements (inscription_id, type_paiement, type_livre, montant, date_paiement, methode_paiement, reference_mvola, remarques, utilisateur_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          inscription_id,
          type_paiement,
          type_livre,
          montant,
          date_paiement,
          methode_paiement,
          reference_mvola,
          remarques,
          utilisateur_id,
        ],
      );

      // Mettre à jour selon le type de paiement, seulement si le solde est atteint
      if (type_paiement === "inscription") {
        const [totaux] = await connection.execute(
          `SELECT COALESCE(SUM(p.montant), 0) as total_paye, n.frais_inscription
           FROM inscriptions i
           JOIN vagues v ON i.vague_id = v.id
           JOIN niveaux n ON v.niveau_id = n.id
           LEFT JOIN paiements p ON p.inscription_id = i.id AND p.type_paiement = 'inscription'
           WHERE i.id = ?
           GROUP BY i.id, n.frais_inscription`,
          [inscription_id],
        );
        const totalPaye = parseFloat(totaux[0].total_paye);
        const fraisTotal = parseFloat(totaux[0].frais_inscription);

        if (totalPaye >= fraisTotal) {
          await connection.execute(
            `UPDATE inscriptions SET frais_inscription_paye = TRUE WHERE id = ?`,
            [inscription_id],
          );
        }
      } else if (type_paiement === "livre") {
        const [totaux] = await connection.execute(
          `SELECT COALESCE(SUM(p.montant), 0) as total_paye, l.prix
           FROM livres l
           LEFT JOIN paiements p ON p.inscription_id = l.inscription_id
                                 AND p.type_paiement = 'livre'
                                 AND p.type_livre = l.type_livre
           WHERE l.inscription_id = ? AND l.type_livre = ?
           GROUP BY l.id, l.prix`,
          [inscription_id, type_livre],
        );
        const totalPaye = parseFloat(totaux[0].total_paye);
        const prix = parseFloat(totaux[0].prix);

        if (totalPaye >= prix) {
          await connection.execute(
            `UPDATE livres 
             SET statut_paiement = 'paye', date_paiement = ?
             WHERE inscription_id = ? AND type_livre = ?`,
            [date_paiement, inscription_id, type_livre],
          );
        }
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
  static async updateLivreStatut(inscriptionId, typeLivre, statuts) {
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

    values.push(inscriptionId, typeLivre);

    const [result] = await pool.execute(
      `UPDATE livres SET ${fields.join(", ")} WHERE inscription_id = ? AND type_livre = ?`,
      values,
    );

    return result.affectedRows > 0;
  }

  // Statistiques
  static async getStats(filters = {}) {
    let query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN i.statut_inscription = 'en_attente' THEN 1 ELSE 0 END) as en_attente,
        SUM(CASE WHEN i.statut_inscription = 'validee' THEN 1 ELSE 0 END) as validees,
        SUM(CASE WHEN i.statut_inscription = 'actif' THEN 1 ELSE 0 END) as actifs,
        SUM(CASE WHEN i.statut_inscription = 'rejetee' THEN 1 ELSE 0 END) as rejetees,
        SUM(CASE WHEN i.statut_inscription = 'abandonne' THEN 1 ELSE 0 END) as abandonnes
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
