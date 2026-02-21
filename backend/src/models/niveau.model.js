import { pool } from "../config/database.js";

class NiveauModel {
  // Créer un niveau
  static async create(niveauData) {
    const {
      code,
      nom,
      description = null,
      frais_inscription = 0,
      frais_ecolage = 0,
      frais_livre = 0,
      duree_mois = 2,
    } = niveauData;

    const [result] = await pool.execute(
      `INSERT INTO niveaux (code, nom, description, frais_inscription, frais_ecolage, frais_livre, duree_mois)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        code,
        nom,
        description,
        frais_inscription,
        frais_ecolage,
        frais_livre,
        duree_mois,
      ],
    );

    return result.insertId;
  }

  // Trouver un niveau par ID
  static async findById(id) {
    const [rows] = await pool.execute("SELECT * FROM niveaux WHERE id = ?", [
      id,
    ]);

    return rows[0];
  }

  // Trouver un niveau par code
  static async findByCode(code) {
    const [rows] = await pool.execute("SELECT * FROM niveaux WHERE code = ?", [
      code,
    ]);

    return rows[0];
  }

  // Obtenir tous les niveaux
  static async findAll(filters = {}) {
    let query = "SELECT * FROM niveaux WHERE 1=1";
    const params = [];

    if (filters.actif !== undefined) {
      query += " AND actif = ?";
      params.push(filters.actif);
    }

    if (filters.search) {
      query += " AND (code LIKE ? OR nom LIKE ?)";
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += " ORDER BY code";

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  // Mettre à jour un niveau
  static async update(id, niveauData) {
    const fields = [];
    const values = [];

    Object.keys(niveauData).forEach((key) => {
      if (niveauData[key] !== undefined && key !== "id") {
        fields.push(`${key} = ?`);
        values.push(niveauData[key]);
      }
    });

    if (fields.length === 0) {
      return false;
    }

    values.push(id);

    const [result] = await pool.execute(
      `UPDATE niveaux SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );

    return result.affectedRows > 0;
  }

  // Supprimer un niveau (vérifier d'abord s'il n'est pas utilisé)
  static async delete(id) {
    // Vérifier si le niveau est utilisé dans des vagues
    const [vagues] = await pool.execute(
      "SELECT COUNT(*) as count FROM vagues WHERE niveau_id = ?",
      [id],
    );

    if (vagues[0].count > 0) {
      throw new Error(
        "Ce niveau est utilisé dans des vagues et ne peut pas être supprimé",
      );
    }

    const [result] = await pool.execute("DELETE FROM niveaux WHERE id = ?", [
      id,
    ]);

    return result.affectedRows > 0;
  }

  // Obtenir les statistiques des niveaux
  static async getStats() {
    const [rows] = await pool.execute(`
      SELECT 
        n.id,
        n.code,
        n.nom,
        n.frais_inscription,
        n.prix_livre_cours,
        n.prix_livre_exercices,
        COUNT(DISTINCT v.id) as nb_vagues,
        COUNT(DISTINCT i.etudiant_id) as nb_etudiants,
        SUM(CASE WHEN v.statut = 'en_cours' THEN 1 ELSE 0 END) as vagues_en_cours
      FROM niveaux n
      LEFT JOIN vagues v ON n.id = v.niveau_id
      LEFT JOIN inscriptions i ON v.id = i.vague_id AND i.statut_inscription = 'actif'
      WHERE n.actif = TRUE
      GROUP BY n.id
      ORDER BY n.code
    `);

    return rows;
  }

  // Calculer le coût total pour un niveau
  static async getTotalCost(id) {
    const [rows] = await pool.execute(
      "SELECT (frais_inscription + frais_ecolage + frais_livre) as total FROM niveaux WHERE id = ?",
      [id],
    );

    return rows[0]?.total || 0;
  }
}

export default NiveauModel;
