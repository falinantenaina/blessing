import { pool } from "../config/database.js";

class EtudiantModel {
  // Créer un étudiant
  static async create(etudiantData) {
    const { nom, prenom, telephone, email = null } = etudiantData;

    const [result] = await pool.execute(
      `INSERT INTO etudiants (nom, prenom, telephone, email)
       VALUES (?, ?, ?, ?)`,
      [nom, prenom, telephone, email],
    );

    return result.insertId;
  }

  // Trouver un étudiant par ID
  static async findById(id) {
    const [rows] = await pool.execute("SELECT * FROM etudiants WHERE id = ?", [
      id,
    ]);
    return rows[0];
  }

  // Trouver un étudiant par téléphone
  static async findByTelephone(telephone) {
    const [rows] = await pool.execute(
      "SELECT * FROM etudiants WHERE telephone = ?",
      [telephone],
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
      query += " AND e.actif = ?";
      params.push(filters.actif);
    }

    if (filters.search) {
      query += " AND (e.nom LIKE ? OR e.prenom LIKE ? OR e.telephone LIKE ?)";
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += " GROUP BY e.id";

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const offset = (page - 1) * limit;

    query += " ORDER BY e.created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [rows] = await pool.execute(query, params);

    // Compter le total
    let countQuery = "SELECT COUNT(*) as total FROM etudiants e WHERE 1=1";
    const countParams = [];

    if (filters.actif !== undefined) {
      countQuery += " AND e.actif = ?";
      countParams.push(filters.actif);
    }

    if (filters.search) {
      countQuery +=
        " AND (e.nom LIKE ? OR e.prenom LIKE ? OR e.telephone LIKE ?)";
      const searchTerm = `%${filters.search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const [countResult] = await pool.execute(countQuery, countParams);

    return {
      etudiants: rows,
      total: countResult[0].total,
      page,
      limit,
    };
  }

  // Mettre à jour un étudiant
  static async update(id, etudiantData) {
    const fields = [];
    const values = [];

    Object.keys(etudiantData).forEach((key) => {
      if (etudiantData[key] !== undefined && key !== "id") {
        fields.push(`${key} = ?`);
        values.push(etudiantData[key]);
      }
    });

    if (fields.length === 0) {
      return false;
    }

    values.push(id);

    const [result] = await pool.execute(
      `UPDATE etudiants SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );

    return result.affectedRows > 0;
  }

  // Désactiver un étudiant
  static async deactivate(id) {
    const [result] = await pool.execute(
      "UPDATE etudiants SET actif = FALSE WHERE id = ?",
      [id],
    );

    return result.affectedRows > 0;
  }

  // Activer/désactiver
  static async toggleActive(id) {
    const [result] = await pool.execute(
      "UPDATE etudiants SET actif = NOT actif WHERE id = ?",
      [id],
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

  // Obtenir tous les étudiants avec détails complets (niveau, paiement, livres)
  static async findAllWithDetails(filters = {}) {
    let query = `
    SELECT 
      e.id,
      e.nom,
      e.prenom,
      e.telephone,
      e.email,
      e.actif,
      -- Dernière inscription (la plus récente)
      i.id as inscription_id,
      i.statut_inscription,
      i.date_inscription,
      i.frais_inscription_paye,
      -- Niveau
      n.id as niveau_id,
      n.code as niveau_code,
      n.nom as niveau_nom,
      n.frais_inscription as montant_frais_inscription,
      -- Vague
      v.id as vague_id,
      v.nom as vague_nom,
      -- Livres
      lc.prix as prix_livre_cours,
      lc.statut_paiement as livre_cours_paye,
      lc.statut_livraison as livre_cours_livre,
      le.prix as prix_livre_exercices,
      le.statut_paiement as livre_exercices_paye,
      le.statut_livraison as livre_exercices_livre,
      -- Montants
      COALESCE((
        SELECT SUM(p.montant) FROM paiements p WHERE p.inscription_id = i.id
      ), 0) as montant_paye,
      (COALESCE(n.frais_inscription,0) + COALESCE(lc.prix,0) + COALESCE(le.prix,0)) as montant_total
    FROM etudiants e
    LEFT JOIN inscriptions i ON i.id = (
      SELECT id FROM inscriptions 
      WHERE etudiant_id = e.id 
      ORDER BY date_inscription DESC 
      LIMIT 1
    )
    LEFT JOIN vagues v ON i.vague_id = v.id
    LEFT JOIN niveaux n ON v.niveau_id = n.id
    LEFT JOIN livres lc ON lc.inscription_id = i.id AND lc.type_livre = 'cours'
    LEFT JOIN livres le ON le.inscription_id = i.id AND le.type_livre = 'exercices'
    WHERE 1=1
  `;
    const params = [];

    if (filters.actif !== undefined && filters.actif !== "") {
      query += " AND e.actif = ?";
      params.push(filters.actif);
    }
    if (filters.niveau_id) {
      query += " AND n.id = ?";
      params.push(filters.niveau_id);
    }
    if (filters.statut_inscription) {
      query += " AND i.statut_inscription = ?";
      params.push(filters.statut_inscription);
    }
    if (filters.search) {
      query += " AND (e.nom LIKE ? OR e.prenom LIKE ? OR e.telephone LIKE ?)";
      const s = `%${filters.search}%`;
      params.push(s, s, s);
    }

    // Count
    const countBase = query.replace(
      /SELECT[\s\S]+?FROM etudiants/,
      "SELECT COUNT(DISTINCT e.id) as total FROM etudiants",
    );
    const [countResult] = await pool.execute(countBase, params);

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const offset = (page - 1) * limit;

    query += " ORDER BY e.nom ASC, e.prenom ASC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [rows] = await pool.execute(query, params);

    return {
      etudiants: rows.map((et) => ({
        ...et,
        montant_restant:
          parseFloat(et.montant_total || 0) - parseFloat(et.montant_paye || 0),
      })),
      total: countResult[0].total,
      page,
      limit,
    };
  }
}

export default EtudiantModel;
