import { pool } from "../config/database.js";

class JourModel {
  // Obtenir tous les jours
  static async findAll(filters = {}) {
    let query = "SELECT * FROM jours WHERE 1=1";
    const params = [];

    if (filters.actif !== undefined) {
      query += " AND actif = ?";
      params.push(filters.actif === "true" ? 1 : 0);
    }

    query += " ORDER BY ordre";

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  // Trouver un jour par ID
  static async findById(id) {
    const [rows] = await pool.execute("SELECT * FROM jours WHERE id = ?", [id]);
    return rows[0];
  }

  // Mettre à jour un jour
  static async update(id, jourData) {
    const fields = [];
    const values = [];

    Object.keys(jourData).forEach((key) => {
      if (jourData[key] !== undefined && key !== "id") {
        fields.push(`${key} = ?`);
        values.push(jourData[key]);
      }
    });

    if (fields.length === 0) return false;

    values.push(id);

    const [result] = await pool.execute(
      `UPDATE jours SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );

    return result.affectedRows > 0;
  }

  // Vérifier si le jour est utilisé
  static async isUsed(id) {
    const [rows] = await pool.execute(
      "SELECT COUNT(*) as count FROM vague_horaires WHERE jour_id = ?",
      [id],
    );

    return rows[0].count > 0;
  }

  // Obtenir les jours avec statistiques d'utilisation
  static async getWithStats() {
    const [rows] = await pool.execute(`
      SELECT j.*,
             COUNT(DISTINCT vh.vague_id) as nb_vagues
      FROM jours j
      LEFT JOIN vague_horaires vh ON j.id = vh.jour_id
      LEFT JOIN vagues v ON vh.vague_id = v.id AND v.statut IN ('planifie', 'en_cours')
      GROUP BY j.id
      ORDER BY j.ordre
    `);

    return rows;
  }
}

export default JourModel;
