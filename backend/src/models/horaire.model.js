import { pool } from "../config/database.js";

class HoraireModel {
  // Créer un horaire
  static async create(horaireData) {
    const { heure_debut, heure_fin, libelle } = horaireData;

    const [result] = await pool.execute(
      "INSERT INTO horaires (heure_debut, heure_fin, libelle) VALUES (?, ?, ?)",
      [heure_debut, heure_fin, libelle],
    );

    return result.insertId;
  }

  // Obtenir tous les horaires
  static async findAll(filters = {}) {
    let query = "SELECT * FROM horaires WHERE 1=1";
    const params = [];

    if (filters.actif !== undefined) {
      query += " AND actif = ?";
      params.push(filters.actif === "true" ? 1 : 0);
    }

    query += " ORDER BY heure_debut";

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  // Trouver un horaire par ID
  static async findById(id) {
    const [rows] = await pool.execute("SELECT * FROM horaires WHERE id = ?", [
      id,
    ]);
    return rows[0];
  }

  // Mettre à jour un horaire
  static async update(id, horaireData) {
    const fields = [];
    const values = [];

    Object.keys(horaireData).forEach((key) => {
      if (horaireData[key] !== undefined && key !== "id") {
        fields.push(`${key} = ?`);
        values.push(horaireData[key]);
      }
    });

    if (fields.length === 0) return false;

    values.push(id);

    const [result] = await pool.execute(
      `UPDATE horaires SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );

    return result.affectedRows > 0;
  }

  // Supprimer (soft delete)
  static async delete(id) {
    const [result] = await pool.execute("DELETE from horaires WHERE id = ?", [
      id,
    ]);

    return result.affectedRows > 0;
  }

  // Vérifier si l'horaire est utilisé
  static async isUsed(id) {
    const [rows] = await pool.execute(
      "SELECT COUNT(*) as count FROM vague_horaires WHERE horaire_id = ?",
      [id],
    );

    return rows[0].count > 0;
  }

  // Obtenir les horaires disponibles pour un jour et une salle
  static async getDisponibles(jourId, salleId, excludeVagueId = null) {
    let query = `
      SELECT h.* 
      FROM horaires h
      WHERE h.actif = TRUE
        AND h.id NOT IN (
          SELECT vh.horaire_id 
          FROM vague_horaires vh
          JOIN vagues v ON vh.vague_id = v.id
          WHERE vh.jour_id = ?
            AND v.salle_id = ?
            AND v.statut IN ('planifie', 'en_cours')
    `;

    const params = [jourId, salleId];

    if (excludeVagueId) {
      query += " AND v.id != ?";
      params.push(excludeVagueId);
    }

    query += ") ORDER BY h.heure_debut";

    const [rows] = await pool.execute(query, params);
    return rows;
  }
}

export default HoraireModel;
