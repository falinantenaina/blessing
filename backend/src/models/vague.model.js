import { pool } from '../config/database.js';

class VagueModel {
  // Créer une vague
  static async create(vagueData) {
    const {
      nom,
      niveau_id,
      enseignant_id,
      salle_id,
      date_debut,
      date_fin,
      horaire_id,
      jour_id,
      capacite_max = 20,
      statut = 'planifie',
      remarques = null
    } = vagueData;

    const [result] = await pool.execute(
      `INSERT INTO vagues (nom, niveau_id, enseignant_id, salle_id, date_debut, date_fin, 
       horaire_id, jour_id, capacite_max, statut, remarques)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nom, niveau_id, enseignant_id, salle_id, date_debut, date_fin, 
       horaire_id, jour_id, capacite_max, statut, remarques]
    );

    return result.insertId;
  }

  // Trouver une vague par ID avec détails complets
  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT v.*,
              n.code as niveau_code, n.nom as niveau_nom,
              u.nom as enseignant_nom, u.prenom as enseignant_prenom,
              s.nom as salle_nom, s.capacite as salle_capacite,
              h.heure_debut, h.heure_fin, h.libelle as horaire_libelle,
              j.nom as jour_nom,
              (SELECT COUNT(*) FROM inscriptions WHERE vague_id = v.id AND statut = 'actif') as nb_inscrits
       FROM vagues v
       LEFT JOIN niveaux n ON v.niveau_id = n.id
       LEFT JOIN utilisateurs u ON v.enseignant_id = u.id
       LEFT JOIN salles s ON v.salle_id = s.id
       LEFT JOIN horaires h ON v.horaire_id = h.id
       LEFT JOIN jours j ON v.jour_id = j.id
       WHERE v.id = ?`,
      [id]
    );

    return rows[0];
  }

  // Obtenir toutes les vagues avec filtres
  static async findAll(filters = {}) {
    let query = `
      SELECT v.*,
             n.code as niveau_code, n.nom as niveau_nom,
             u.nom as enseignant_nom, u.prenom as enseignant_prenom,
             s.nom as salle_nom,
             h.heure_debut, h.heure_fin,
             j.nom as jour_nom,
             (SELECT COUNT(*) FROM inscriptions WHERE vague_id = v.id AND statut = 'actif') as nb_inscrits
      FROM vagues v
      LEFT JOIN niveaux n ON v.niveau_id = n.id
      LEFT JOIN utilisateurs u ON v.enseignant_id = u.id
      LEFT JOIN salles s ON v.salle_id = s.id
      LEFT JOIN horaires h ON v.horaire_id = h.id
      LEFT JOIN jours j ON v.jour_id = j.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.statut) {
      query += ' AND v.statut = ?';
      params.push(filters.statut);
    }

    if (filters.niveau_id) {
      query += ' AND v.niveau_id = ?';
      params.push(filters.niveau_id);
    }

    if (filters.enseignant_id) {
      query += ' AND v.enseignant_id = ?';
      params.push(filters.enseignant_id);
    }

    if (filters.salle_id) {
      query += ' AND v.salle_id = ?';
      params.push(filters.salle_id);
    }

    if (filters.jour_id) {
      query += ' AND v.jour_id = ?';
      params.push(filters.jour_id);
    }

    if (filters.date_debut) {
      query += ' AND v.date_debut >= ?';
      params.push(filters.date_debut);
    }

    if (filters.date_fin) {
      query += ' AND v.date_fin <= ?';
      params.push(filters.date_fin);
    }

    if (filters.search) {
      query += ' AND v.nom LIKE ?';
      params.push(`%${filters.search}%`);
    }

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const offset = (page - 1) * limit;

    query += ' ORDER BY v.date_debut DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.execute(query, params);

    // Compter le total
    let countQuery = 'SELECT COUNT(*) as total FROM vagues v WHERE 1=1';
    const countParams = [];

    if (filters.statut) {
      countQuery += ' AND v.statut = ?';
      countParams.push(filters.statut);
    }

    if (filters.niveau_id) {
      countQuery += ' AND v.niveau_id = ?';
      countParams.push(filters.niveau_id);
    }

    if (filters.enseignant_id) {
      countQuery += ' AND v.enseignant_id = ?';
      countParams.push(filters.enseignant_id);
    }

    if (filters.salle_id) {
      countQuery += ' AND v.salle_id = ?';
      countParams.push(filters.salle_id);
    }

    if (filters.search) {
      countQuery += ' AND v.nom LIKE ?';
      countParams.push(`%${filters.search}%`);
    }

    const [countResult] = await pool.execute(countQuery, countParams);

    return {
      vagues: rows,
      total: countResult[0].total,
      page,
      limit
    };
  }

  // Mettre à jour une vague
  static async update(id, vagueData) {
    const fields = [];
    const values = [];

    Object.keys(vagueData).forEach(key => {
      if (vagueData[key] !== undefined && key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(vagueData[key]);
      }
    });

    if (fields.length === 0) {
      return false;
    }

    values.push(id);

    const [result] = await pool.execute(
      `UPDATE vagues SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  // Supprimer une vague
  static async delete(id) {
    const [result] = await pool.execute(
      'DELETE FROM vagues WHERE id = ?',
      [id]
    );

    return result.affectedRows > 0;
  }

  // Changer le statut d'une vague
  static async updateStatus(id, statut) {
    const [result] = await pool.execute(
      'UPDATE vagues SET statut = ? WHERE id = ?',
      [statut, id]
    );

    return result.affectedRows > 0;
  }

  // Vérifier la disponibilité d'une salle
  static async checkSalleDisponibilite(salleId, jourId, horaireId, excludeVagueId = null) {
    let query = `
      SELECT COUNT(*) as count
      FROM vagues
      WHERE salle_id = ?
        AND jour_id = ?
        AND horaire_id = ?
        AND statut IN ('planifie', 'en_cours')
    `;

    const params = [salleId, jourId, horaireId];

    if (excludeVagueId) {
      query += ' AND id != ?';
      params.push(excludeVagueId);
    }

    const [rows] = await pool.execute(query, params);

    return rows[0].count === 0;
  }

  // Vérifier la disponibilité d'un enseignant
  static async checkEnseignantDisponibilite(enseignantId, jourId, horaireId, excludeVagueId = null) {
    let query = `
      SELECT COUNT(*) as count
      FROM vagues
      WHERE enseignant_id = ?
        AND jour_id = ?
        AND horaire_id = ?
        AND statut IN ('planifie', 'en_cours')
    `;

    const params = [enseignantId, jourId, horaireId];

    if (excludeVagueId) {
      query += ' AND id != ?';
      params.push(excludeVagueId);
    }

    const [rows] = await pool.execute(query, params);

    return rows[0].count === 0;
  }

  // Obtenir les étudiants d'une vague
  static async getEtudiants(vagueId) {
    const [rows] = await pool.execute(
      `SELECT u.id, u.nom, u.prenom, u.email, u.telephone, u.photo_url,
              i.date_inscription, i.statut as statut_inscription,
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

  // Obtenir le planning hebdomadaire
  static async getPlanning(filters = {}) {
    let query = `
      SELECT v.id, v.nom, v.statut,
             n.code as niveau_code,
             u.nom as enseignant_nom, u.prenom as enseignant_prenom,
             s.nom as salle_nom,
             h.id as horaire_id, h.heure_debut, h.heure_fin, h.libelle as horaire_libelle,
             j.id as jour_id, j.nom as jour_nom, j.ordre as jour_ordre,
             (SELECT COUNT(*) FROM inscriptions WHERE vague_id = v.id AND statut = 'actif') as nb_inscrits,
             v.capacite_max
      FROM vagues v
      LEFT JOIN niveaux n ON v.niveau_id = n.id
      LEFT JOIN utilisateurs u ON v.enseignant_id = u.id
      LEFT JOIN salles s ON v.salle_id = s.id
      LEFT JOIN horaires h ON v.horaire_id = h.id
      LEFT JOIN jours j ON v.jour_id = j.id
      WHERE v.statut IN ('planifie', 'en_cours')
    `;

    const params = [];

    if (filters.salle_id) {
      query += ' AND v.salle_id = ?';
      params.push(filters.salle_id);
    }

    if (filters.enseignant_id) {
      query += ' AND v.enseignant_id = ?';
      params.push(filters.enseignant_id);
    }

    query += ' ORDER BY j.ordre, h.heure_debut';

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  // Vérifier la capacité d'une vague
  static async checkCapacite(vagueId) {
    const [rows] = await pool.execute(
      `SELECT v.capacite_max,
              (SELECT COUNT(*) FROM inscriptions WHERE vague_id = v.id AND statut = 'actif') as nb_inscrits
       FROM vagues v
       WHERE v.id = ?`,
      [vagueId]
    );

    if (rows.length === 0) return false;

    return rows[0].nb_inscrits < rows[0].capacite_max;
  }
}

export default VagueModel;
