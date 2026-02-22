import { pool } from '../config/database.js';

class FinanceModel {
  // Obtenir tous les écolages avec filtres
  static async getEcolages(filters = {}) {
    let query = `
      SELECT e.*,
             i.etudiant_id, i.vague_id, i.date_inscription,
             u.nom as etudiant_nom, u.prenom as etudiant_prenom, u.email as etudiant_email, u.telephone as etudiant_telephone,
             v.nom as vague_nom,
             n.code as niveau_code, n.nom as niveau_nom
      FROM ecolages e
      JOIN inscriptions i ON e.inscription_id = i.id
      JOIN utilisateurs u ON i.etudiant_id = u.id
      JOIN vagues v ON i.vague_id = v.id
      JOIN niveaux n ON v.niveau_id = n.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.statut) {
      query += ' AND e.statut = ?';
      params.push(filters.statut);
    }

    if (filters.etudiant_id) {
      query += ' AND i.etudiant_id = ?';
      params.push(filters.etudiant_id);
    }

    if (filters.vague_id) {
      query += ' AND i.vague_id = ?';
      params.push(filters.vague_id);
    }

    if (filters.niveau_id) {
      query += ' AND v.niveau_id = ?';
      params.push(filters.niveau_id);
    }

    if (filters.search) {
      query += ' AND (u.nom LIKE ? OR u.prenom LIKE ? OR u.email LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const offset = (page - 1) * limit;

    query += ' ORDER BY e.created_at DESC LIMIT ? OFFSET ?';
    params.push(String(limit), String(offset));

    const [rows] = await pool.execute(query, params);

    // Compter le total
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM ecolages e
      JOIN inscriptions i ON e.inscription_id = i.id
      JOIN utilisateurs u ON i.etudiant_id = u.id
      JOIN vagues v ON i.vague_id = v.id
      WHERE 1=1
    `;
    const countParams = [];

    if (filters.statut) {
      countQuery += ' AND e.statut = ?';
      countParams.push(filters.statut);
    }

    if (filters.etudiant_id) {
      countQuery += ' AND i.etudiant_id = ?';
      countParams.push(filters.etudiant_id);
    }

    if (filters.vague_id) {
      countQuery += ' AND i.vague_id = ?';
      countParams.push(filters.vague_id);
    }

    if (filters.search) {
      countQuery += ' AND (u.nom LIKE ? OR u.prenom LIKE ? OR u.email LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const [countResult] = await pool.execute(countQuery, countParams);

    return {
      ecolages: rows,
      total: countResult[0].total,
      page,
      limit
    };
  }

  // Obtenir un écolage par ID
  static async getEcolageById(id) {
    const [rows] = await pool.execute(
      `SELECT e.*,
              i.etudiant_id, i.vague_id, i.date_inscription,
              u.nom as etudiant_nom, u.prenom as etudiant_prenom, u.email as etudiant_email,
              v.nom as vague_nom,
              n.code as niveau_code, n.nom as niveau_nom,
              n.frais_inscription, n.frais_ecolage, n.frais_livre
       FROM ecolages e
       JOIN inscriptions i ON e.inscription_id = i.id
       JOIN utilisateurs u ON i.etudiant_id = u.id
       JOIN vagues v ON i.vague_id = v.id
       JOIN niveaux n ON v.niveau_id = n.id
       WHERE e.id = ?`,
      [id]
    );

    return rows[0];
  }

  // Obtenir les écolages d'un étudiant
  static async getEcolagesByEtudiant(etudiantId) {
    const [rows] = await pool.execute(
      `SELECT e.*,
              i.vague_id,
              v.nom as vague_nom, v.date_debut, v.date_fin,
              n.code as niveau_code, n.nom as niveau_nom
       FROM ecolages e
       JOIN inscriptions i ON e.inscription_id = i.id
       JOIN vagues v ON i.vague_id = v.id
       JOIN niveaux n ON v.niveau_id = n.id
       WHERE i.etudiant_id = ?
       ORDER BY e.created_at DESC`,
      [etudiantId]
    );

    return rows;
  }

  // Enregistrer un paiement avec transaction
  static async enregistrerPaiement(paiementData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      const {
        ecolage_id,
        montant,
        date_paiement,
        methode_paiement,
        reference = null,
        type_frais = 'ecolage',
        remarques = null,
        utilisateur_id
      } = paiementData;

      // Enregistrer le paiement
      const [paiementResult] = await connection.execute(
        `INSERT INTO paiements (ecolage_id, montant, date_paiement, methode_paiement, reference, type_frais, remarques, utilisateur_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [ecolage_id, montant, date_paiement, methode_paiement, reference, type_frais, remarques, utilisateur_id]
      );

      // Mettre à jour l'écolage
      await connection.execute(
        `UPDATE ecolages 
         SET montant_paye = montant_paye + ?,
             montant_restant = montant_restant - ?
         WHERE id = ?`,
        [montant, montant, ecolage_id]
      );

      // Mettre à jour les flags de paiement selon le type
      if (type_frais === 'inscription') {
        await connection.execute(
          'UPDATE ecolages SET frais_inscription_paye = TRUE WHERE id = ?',
          [ecolage_id]
        );
      } else if (type_frais === 'livre') {
        await connection.execute(
          'UPDATE ecolages SET frais_livre_paye = TRUE WHERE id = ?',
          [ecolage_id]
        );
      }

      // Récupérer l'écolage mis à jour pour déterminer le statut
      const [ecolage] = await connection.execute(
        'SELECT montant_total, montant_paye FROM ecolages WHERE id = ?',
        [ecolage_id]
      );

      let nouveauStatut = 'non_paye';
      if (ecolage[0].montant_paye >= ecolage[0].montant_total) {
        nouveauStatut = 'paye';
      } else if (ecolage[0].montant_paye > 0) {
        nouveauStatut = 'partiel';
      }

      await connection.execute(
        'UPDATE ecolages SET statut = ? WHERE id = ?',
        [nouveauStatut, ecolage_id]
      );

      await connection.commit();
      return paiementResult.insertId;

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Obtenir les paiements d'un écolage
  static async getPaiementsByEcolage(ecolageId) {
    const [rows] = await pool.execute(
      `SELECT p.*,
              u.nom as utilisateur_nom, u.prenom as utilisateur_prenom
       FROM paiements p
       LEFT JOIN utilisateurs u ON p.utilisateur_id = u.id
       WHERE p.ecolage_id = ?
       ORDER BY p.date_paiement DESC`,
      [ecolageId]
    );

    return rows;
  }

  // Annuler un paiement avec transaction
  static async annulerPaiement(paiementId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Récupérer les infos du paiement
      const [paiements] = await connection.execute(
        'SELECT ecolage_id, montant, type_frais FROM paiements WHERE id = ?',
        [paiementId]
      );

      if (paiements.length === 0) {
        throw new Error('Paiement introuvable');
      }

      const { ecolage_id, montant, type_frais } = paiements[0];

      // Mettre à jour l'écolage
      await connection.execute(
        `UPDATE ecolages 
         SET montant_paye = montant_paye - ?,
             montant_restant = montant_restant + ?
         WHERE id = ?`,
        [montant, montant, ecolage_id]
      );

      // Mettre à jour les flags de paiement selon le type
      if (type_frais === 'inscription') {
        await connection.execute(
          'UPDATE ecolages SET frais_inscription_paye = FALSE WHERE id = ?',
          [ecolage_id]
        );
      } else if (type_frais === 'livre') {
        await connection.execute(
          'UPDATE ecolages SET frais_livre_paye = FALSE WHERE id = ?',
          [ecolage_id]
        );
      }

      // Recalculer le statut
      const [ecolage] = await connection.execute(
        'SELECT montant_total, montant_paye FROM ecolages WHERE id = ?',
        [ecolage_id]
      );

      let nouveauStatut = 'non_paye';
      if (ecolage[0].montant_paye >= ecolage[0].montant_total) {
        nouveauStatut = 'paye';
      } else if (ecolage[0].montant_paye > 0) {
        nouveauStatut = 'partiel';
      }

      await connection.execute(
        'UPDATE ecolages SET statut = ? WHERE id = ?',
        [nouveauStatut, ecolage_id]
      );

      // Supprimer le paiement
      const [result] = await connection.execute(
        'DELETE FROM paiements WHERE id = ?',
        [paiementId]
      );

      await connection.commit();
      return result.affectedRows > 0;

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Obtenir les statistiques financières
  static async getStats(filters = {}) {
    let query = `
      SELECT 
        COUNT(DISTINCT e.id) as total_ecolages,
        SUM(e.montant_total) as montant_total_attendu,
        SUM(e.montant_paye) as montant_total_paye,
        SUM(e.montant_restant) as montant_total_restant,
        SUM(CASE WHEN e.statut = 'paye' THEN 1 ELSE 0 END) as nb_payes,
        SUM(CASE WHEN e.statut = 'partiel' THEN 1 ELSE 0 END) as nb_partiels,
        SUM(CASE WHEN e.statut = 'non_paye' THEN 1 ELSE 0 END) as nb_non_payes
      FROM ecolages e
      JOIN inscriptions i ON e.inscription_id = i.id
      WHERE 1=1
    `;

    const params = [];

    if (filters.date_debut) {
      query += ' AND e.created_at >= ?';
      params.push(filters.date_debut);
    }

    if (filters.date_fin) {
      query += ' AND e.created_at <= ?';
      params.push(filters.date_fin);
    }

    const [rows] = await pool.execute(query, params);
    return rows[0];
  }

  // Obtenir un rapport par période
  static async getRapport(filters = {}) {
    let query = `
      SELECT 
        DATE_FORMAT(p.date_paiement, '%Y-%m') as mois,
        COUNT(p.id) as nb_paiements,
        SUM(p.montant) as total_paiements,
        p.methode_paiement,
        COUNT(DISTINCT e.id) as nb_ecolages
      FROM paiements p
      JOIN ecolages e ON p.ecolage_id = e.id
      WHERE 1=1
    `;

    const params = [];

    if (filters.date_debut) {
      query += ' AND p.date_paiement >= ?';
      params.push(filters.date_debut);
    }

    if (filters.date_fin) {
      query += ' AND p.date_paiement <= ?';
      params.push(filters.date_fin);
    }

    query += ' GROUP BY mois, p.methode_paiement ORDER BY mois DESC';

    const [rows] = await pool.execute(query, params);
    return rows;
  }
}

export default FinanceModel;
