import { pool } from '../config/database.js';

class EtudiantModel {
  // Créer un étudiant
  static async create(etudiantData) {
    const { nom, prenom, telephone, email = null } = etudiantData;

    const [result] = await pool.execute(
      `INSERT INTO etudiants (nom, prenom, telephone, email)
       VALUES (?, ?, ?, ?)`,
      [nom, prenom, telephone, email]
    );

    return result.insertId;
  }

  // Trouver un étudiant par ID
  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM etudiants WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  // Trouver un étudiant par téléphone
  static async findByTelephone(telephone) {
    const [rows] = await pool.execute(
      'SELECT * FROM etudiants WHERE telephone = ?',
      [telephone]
    );
    return rows[0];
  }

  // Obtenir tous les étudiants avec filtres
  static async findAll(filters = {}) {
    let query = `
      SELECT e.*,
             COUNT(DISTINCT i.id) as nb_inscriptions,
             COUNT(DISTINCT CASE WHEN i.statut = 'actif' THEN i.id END) as nb_inscriptions_actives
      FROM etudiants e
      LEFT JOIN inscriptions i ON e.id = i.etudiant_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.actif !== undefined) {
      query += ' AND e.actif = ?';
      params.push(filters.actif);
    }

    if (filters.search) {
      query += ' AND (e.nom LIKE ? OR e.prenom LIKE ? OR e.telephone LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' GROUP BY e.id';

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const offset = (page - 1) * limit;

    query += ' ORDER BY e.created_at DESC LIMIT ? OFFSET ?';
    params.push(String(limit), String(offset));

    const [rows] = await pool.execute(query, params);

    // Compter le total
    let countQuery = 'SELECT COUNT(*) as total FROM etudiants e WHERE 1=1';
    const countParams = [];

    if (filters.actif !== undefined) {
      countQuery += ' AND e.actif = ?';
      countParams.push(filters.actif);
    }

    if (filters.search) {
      countQuery += ' AND (e.nom LIKE ? OR e.prenom LIKE ? OR e.telephone LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const [countResult] = await pool.execute(countQuery, countParams);

    return {
      etudiants: rows,
      total: countResult[0].total,
      page,
      limit
    };
  }

  // Mettre à jour un étudiant
  static async update(id, etudiantData) {
    const fields = [];
    const values = [];

    Object.keys(etudiantData).forEach(key => {
      if (etudiantData[key] !== undefined && key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(etudiantData[key]);
      }
    });

    if (fields.length === 0) {
      return false;
    }

    values.push(id);

    const [result] = await pool.execute(
      `UPDATE etudiants SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  // Désactiver un étudiant
  static async deactivate(id) {
    const [result] = await pool.execute(
      'UPDATE etudiants SET actif = FALSE WHERE id = ?',
      [id]
    );

    return result.affectedRows > 0;
  }

  // Activer/désactiver
  static async toggleActive(id) {
    const [result] = await pool.execute(
      'UPDATE etudiants SET actif = NOT actif WHERE id = ?',
      [id]
    );

    return result.affectedRows > 0;
  }

  // Obtenir les statistiques
  static async getStats() {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN actif = TRUE THEN 1 ELSE 0 END) as actifs,
        SUM(CASE WHEN actif = FALSE THEN 1 ELSE 0 END) as inactifs
      FROM etudiants
    `);

    return stats[0];
  }
}

export default EtudiantModel;
