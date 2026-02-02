import { pool } from '../config/database.js';

class InscriptionModel {
  // Créer une inscription avec transaction
  static async create(inscriptionData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      const {
        etudiant_id,
        vague_id,
        date_inscription,
        statut = 'actif',
        remarques = null
      } = inscriptionData;

      // Créer l'inscription
      const [inscriptionResult] = await connection.execute(
        `INSERT INTO inscriptions (etudiant_id, vague_id, date_inscription, statut, remarques)
         VALUES (?, ?, ?, ?, ?)`,
        [etudiant_id, vague_id, date_inscription, statut, remarques]
      );

      const inscriptionId = inscriptionResult.insertId;

      // Récupérer les frais du niveau
      const [niveauRows] = await connection.execute(
        `SELECT n.frais_inscription, n.frais_ecolage, n.frais_livre
         FROM vagues v
         JOIN niveaux n ON v.niveau_id = n.id
         WHERE v.id = ?`,
        [vague_id]
      );

      if (niveauRows.length === 0) {
        throw new Error('Vague ou niveau introuvable');
      }

      const { frais_inscription, frais_ecolage, frais_livre } = niveauRows[0];
      const montant_total = parseFloat(frais_inscription) + parseFloat(frais_ecolage) + parseFloat(frais_livre);

      // Créer l'écolage
      await connection.execute(
        `INSERT INTO ecolages (inscription_id, montant_total, montant_paye, montant_restant, statut)
         VALUES (?, ?, 0, ?, 'non_paye')`,
        [inscriptionId, montant_total, montant_total]
      );

      await connection.commit();
      return inscriptionId;

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Trouver une inscription par ID
  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT i.*,
              u.nom as etudiant_nom, u.prenom as etudiant_prenom, u.email as etudiant_email,
              v.nom as vague_nom,
              e.montant_total, e.montant_paye, e.montant_restant, e.statut as statut_paiement
       FROM inscriptions i
       JOIN utilisateurs u ON i.etudiant_id = u.id
       JOIN vagues v ON i.vague_id = v.id
       LEFT JOIN ecolages e ON i.id = e.inscription_id
       WHERE i.id = ?`,
      [id]
    );

    return rows[0];
  }

  // Trouver une inscription par étudiant et vague
  static async findByEtudiantAndVague(etudiantId, vagueId) {
    const [rows] = await pool.execute(
      `SELECT i.*
       FROM inscriptions i
       WHERE i.etudiant_id = ? AND i.vague_id = ?`,
      [etudiantId, vagueId]
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
              u.nom as enseignant_nom, u.prenom as enseignant_prenom,
              h.heure_debut, h.heure_fin,
              j.nom as jour_nom,
              e.montant_total, e.montant_paye, e.montant_restant, e.statut as statut_paiement
       FROM inscriptions i
       JOIN vagues v ON i.vague_id = v.id
       JOIN niveaux n ON v.niveau_id = n.id
       LEFT JOIN salles s ON v.salle_id = s.id
       LEFT JOIN utilisateurs u ON v.enseignant_id = u.id
       LEFT JOIN horaires h ON v.horaire_id = h.id
       LEFT JOIN jours j ON v.jour_id = j.id
       LEFT JOIN ecolages e ON i.id = e.inscription_id
       WHERE i.etudiant_id = ?
       ORDER BY i.date_inscription DESC`,
      [etudiantId]
    );

    return rows;
  }

  // Obtenir toutes les inscriptions d'une vague
  static async findByVague(vagueId) {
    const [rows] = await pool.execute(
      `SELECT i.*,
              u.id as etudiant_id, u.nom as etudiant_nom, u.prenom as etudiant_prenom, 
              u.email as etudiant_email, u.telephone as etudiant_telephone,
              e.montant_total, e.montant_paye, e.montant_restant, e.statut as statut_paiement
       FROM inscriptions i
       JOIN utilisateurs u ON i.etudiant_id = u.id
       LEFT JOIN ecolages e ON i.id = e.inscription_id
       WHERE i.vague_id = ?
       ORDER BY i.date_inscription DESC`,
      [vagueId]
    );

    return rows;
  }

  // Mettre à jour le statut d'une inscription
  static async updateStatus(id, statut) {
    const [result] = await pool.execute(
      'UPDATE inscriptions SET statut = ? WHERE id = ?',
      [statut, id]
    );

    return result.affectedRows > 0;
  }

  // Supprimer une inscription (soft delete en changeant le statut)
  static async deactivate(id) {
    const [result] = await pool.execute(
      'UPDATE inscriptions SET statut = "abandonne" WHERE id = ?',
      [id]
    );

    return result.affectedRows > 0;
  }

  // Supprimer une inscription par vague et étudiant
  static async deleteByVagueAndEtudiant(vagueId, etudiantId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Récupérer l'inscription
      const [inscriptions] = await connection.execute(
        'SELECT id FROM inscriptions WHERE vague_id = ? AND etudiant_id = ?',
        [vagueId, etudiantId]
      );

      if (inscriptions.length === 0) {
        throw new Error('Inscription introuvable');
      }

      const inscriptionId = inscriptions[0].id;

      // Supprimer les paiements associés
      await connection.execute(
        `DELETE p FROM paiements p
         JOIN ecolages e ON p.ecolage_id = e.id
         WHERE e.inscription_id = ?`,
        [inscriptionId]
      );

      // Supprimer l'écolage
      await connection.execute(
        'DELETE FROM ecolages WHERE inscription_id = ?',
        [inscriptionId]
      );

      // Supprimer l'inscription
      const [result] = await connection.execute(
        'DELETE FROM inscriptions WHERE id = ?',
        [inscriptionId]
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

  // Vérifier si un étudiant est déjà inscrit à une vague
  static async isAlreadyEnrolled(etudiantId, vagueId) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM inscriptions WHERE etudiant_id = ? AND vague_id = ?',
      [etudiantId, vagueId]
    );

    return rows[0].count > 0;
  }

  // Obtenir les statistiques d'inscriptions
  static async getStats(filters = {}) {
    let query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN i.statut = 'actif' THEN 1 ELSE 0 END) as actifs,
        SUM(CASE WHEN i.statut = 'abandonne' THEN 1 ELSE 0 END) as abandonnes,
        SUM(CASE WHEN i.statut = 'termine' THEN 1 ELSE 0 END) as termines
      FROM inscriptions i
      WHERE 1=1
    `;

    const params = [];

    if (filters.date_debut) {
      query += ' AND i.date_inscription >= ?';
      params.push(filters.date_debut);
    }

    if (filters.date_fin) {
      query += ' AND i.date_inscription <= ?';
      params.push(filters.date_fin);
    }

    const [rows] = await pool.execute(query, params);
    return rows[0];
  }
}

export default InscriptionModel;
