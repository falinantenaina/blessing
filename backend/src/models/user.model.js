import bcrypt from "bcryptjs";
import { pool } from "../config/database.js";

class UserModel {
  // Créer un utilisateur
  static async create(userData) {
    const {
      nom,
      prenom,
      email,
      telephone,
      password,
      role = "etudiant",
      google_id = null,
      photo_url = null,
    } = userData;

    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const [result] = await pool.execute(
      `INSERT INTO utilisateurs (nom, prenom, email, telephone, password, role, google_id, photo_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nom,
        prenom,
        email || null,
        telephone,
        hashedPassword,
        role,
        google_id || null,
        photo_url || null,
      ],
    );

    return result.insertId;
  }

  // Trouver un utilisateur par email
  static async findByEmail(email) {
    const [rows] = await pool.execute(
      "SELECT * FROM utilisateurs WHERE email = ?",
      [email],
    );
    return rows[0];
  }

  // Trouver un utilisateur par ID
  static async findById(id) {
    const [rows] = await pool.execute(
      "SELECT id, nom, prenom, email, telephone, role, photo_url, actif, created_at FROM utilisateurs WHERE id = ?",
      [id],
    );
    return rows[0];
  }

  // Trouver un utilisateur par Google ID
  static async findByGoogleId(googleId) {
    const [rows] = await pool.execute(
      "SELECT * FROM utilisateurs WHERE google_id = ?",
      [googleId],
    );
    return rows[0];
  }

  // Obtenir tous les utilisateurs avec filtres
  static async findAll(filters = {}) {
    let query = `
      SELECT id, nom, prenom, email, telephone, role, photo_url, actif, created_at
      FROM utilisateurs
      WHERE 1=1
    `;
    const params = [];

    if (filters.role) {
      query += " AND role = ?";
      params.push(filters.role);
    }

    if (filters.actif !== undefined) {
      query += " AND actif = ?";
      params.push(filters.actif);
    }

    if (filters.search) {
      query += " AND (nom LIKE ? OR prenom LIKE ? OR email LIKE ?)";
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const offset = (page - 1) * limit;

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(String(limit), String(offset));

    const [rows] = await pool.execute(query, params);

    // Compter le total
    let countQuery = "SELECT COUNT(*) as total FROM utilisateurs WHERE 1=1";
    const countParams = [];

    if (filters.role) {
      countQuery += " AND role = ?";
      countParams.push(filters.role);
    }

    if (filters.actif !== undefined) {
      countQuery += " AND actif = ?";
      countParams.push(filters.actif);
    }

    if (filters.search) {
      countQuery += " AND (nom LIKE ? OR prenom LIKE ? OR email LIKE ?)";
      const searchTerm = `%${filters.search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const [countResult] = await pool.execute(countQuery, countParams);

    return {
      users: rows,
      total: countResult[0].total,
      page,
      limit,
    };
  }

  // Mettre à jour un utilisateur
  static async update(id, userData) {
    const fields = [];
    const values = [];

    Object.keys(userData).forEach((key) => {
      if (userData[key] !== undefined && key !== "password" && key !== "id") {
        fields.push(`${key} = ?`);
        values.push(userData[key]);
      }
    });

    if (fields.length === 0) {
      return false;
    }

    values.push(id);

    const [result] = await pool.execute(
      `UPDATE utilisateurs SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );

    return result.affectedRows > 0;
  }

  // Mettre à jour le mot de passe
  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const [result] = await pool.execute(
      "UPDATE utilisateurs SET password = ? WHERE id = ?",
      [hashedPassword, id],
    );

    return result.affectedRows > 0;
  }

  // Désactiver un utilisateur (soft delete)
  static async deactivate(id) {
    const [result] = await pool.execute(
      "UPDATE utilisateurs SET actif = FALSE WHERE id = ?",
      [id],
    );

    return result.affectedRows > 0;
  }

  // Activer/désactiver un utilisateur
  static async toggleActive(id) {
    const [result] = await pool.execute(
      "UPDATE utilisateurs SET actif = NOT actif WHERE id = ?",
      [id],
    );

    return result.affectedRows > 0;
  }

  // Supprimer un utilisateur (hard delete - à utiliser avec précaution)
  static async delete(id) {
    const [result] = await pool.execute(
      "DELETE FROM utilisateurs WHERE id = ?",
      [id],
    );

    return result.affectedRows > 0;
  }

  // Enregistrer le refresh token
  static async saveRefreshToken(id, refreshToken) {
    const [result] = await pool.execute(
      "UPDATE utilisateurs SET refresh_token = ? WHERE id = ?",
      [refreshToken, id],
    );

    return result.affectedRows > 0;
  }

  // Supprimer le refresh token
  static async removeRefreshToken(id) {
    const [result] = await pool.execute(
      "UPDATE utilisateurs SET refresh_token = NULL WHERE id = ?",
      [id],
    );

    return result.affectedRows > 0;
  }

  // Vérifier le refresh token
  static async verifyRefreshToken(id, refreshToken) {
    const [rows] = await pool.execute(
      "SELECT refresh_token FROM utilisateurs WHERE id = ? AND refresh_token = ?",
      [id, refreshToken],
    );

    return rows.length > 0;
  }

  // Vérifier le mot de passe
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Obtenir les statistiques
  static async getStats() {
    const [stats] = await pool.execute(`
      SELECT 
        role,
        COUNT(*) as total,
        SUM(CASE WHEN actif = TRUE THEN 1 ELSE 0 END) as actifs,
        SUM(CASE WHEN actif = FALSE THEN 1 ELSE 0 END) as inactifs
      FROM utilisateurs
      GROUP BY role
    `);

    return stats;
  }

  // Obtenir les enseignants disponibles
  static async getAvailableTeachers(jourId, horaireId, excludeVagueId = null) {
    let query = `
      SELECT DISTINCT u.id, u.nom, u.prenom, u.email, u.telephone
      FROM utilisateurs u
      WHERE u.role = 'enseignant' 
        AND u.actif = TRUE
        AND u.id NOT IN (
          SELECT v.enseignant_id 
          FROM vagues v
          WHERE v.jour_id = ? 
            AND v.horaire_id = ?
            AND v.statut IN ('planifie', 'en_cours')
    `;

    const params = [jourId, horaireId];

    if (excludeVagueId) {
      query += " AND v.id != ?";
      params.push(excludeVagueId);
    }

    query += ")";

    const [rows] = await pool.execute(query, params);
    return rows;
  }
}

export default UserModel;
