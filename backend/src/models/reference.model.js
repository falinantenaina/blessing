import { pool } from '../config/database.js';

class ReferenceModel {
  // Salles
  static async getAllSalles() {
    const [rows] = await pool.execute(
      `SELECT s.*, e.nom as ecole_nom
       FROM salles s
       LEFT JOIN ecoles e ON s.ecole_id = e.id
       WHERE s.actif = TRUE
       ORDER BY s.nom`
    );
    return rows;
  }

  static async getSalleById(id) {
    const [rows] = await pool.execute(
      `SELECT s.*, e.nom as ecole_nom
       FROM salles s
       LEFT JOIN ecoles e ON s.ecole_id = e.id
       WHERE s.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async createSalle(salleData) {
    const { nom, ecole_id, capacite, equipements } = salleData;
    
    const [result] = await pool.execute(
      'INSERT INTO salles (nom, ecole_id, capacite, equipements) VALUES (?, ?, ?, ?)',
      [nom, ecole_id, capacite, equipements]
    );
    
    return result.insertId;
  }

  static async updateSalle(id, salleData) {
    const fields = [];
    const values = [];

    Object.keys(salleData).forEach(key => {
      if (salleData[key] !== undefined && key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(salleData[key]);
      }
    });

    if (fields.length === 0) return false;

    values.push(id);

    const [result] = await pool.execute(
      `UPDATE salles SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  static async deleteSalle(id) {
    // Soft delete
    const [result] = await pool.execute(
      'UPDATE salles SET actif = FALSE WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  // Horaires
  static async getAllHoraires() {
    const [rows] = await pool.execute(
      'SELECT * FROM horaires WHERE actif = TRUE ORDER BY heure_debut'
    );
    return rows;
  }

  static async getHoraireById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM horaires WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async createHoraire(horaireData) {
    const { heure_debut, heure_fin, libelle } = horaireData;
    
    const [result] = await pool.execute(
      'INSERT INTO horaires (heure_debut, heure_fin, libelle) VALUES (?, ?, ?)',
      [heure_debut, heure_fin, libelle]
    );
    
    return result.insertId;
  }

  static async updateHoraire(id, horaireData) {
    const fields = [];
    const values = [];

    Object.keys(horaireData).forEach(key => {
      if (horaireData[key] !== undefined && key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(horaireData[key]);
      }
    });

    if (fields.length === 0) return false;

    values.push(id);

    const [result] = await pool.execute(
      `UPDATE horaires SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  static async deleteHoraire(id) {
    const [result] = await pool.execute(
      'UPDATE horaires SET actif = FALSE WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  // Jours
  static async getAllJours() {
    const [rows] = await pool.execute(
      'SELECT * FROM jours WHERE actif = TRUE ORDER BY ordre'
    );
    return rows;
  }

  static async getJourById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM jours WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  // Écoles
  static async getAllEcoles() {
    const [rows] = await pool.execute(
      'SELECT * FROM ecoles WHERE actif = TRUE ORDER BY nom'
    );
    return rows;
  }

  static async getEcoleById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM ecoles WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async createEcole(ecoleData) {
    const { nom, adresse, telephone, email } = ecoleData;
    
    const [result] = await pool.execute(
      'INSERT INTO ecoles (nom, adresse, telephone, email) VALUES (?, ?, ?, ?)',
      [nom, adresse, telephone, email]
    );
    
    return result.insertId;
  }

  static async updateEcole(id, ecoleData) {
    const fields = [];
    const values = [];

    Object.keys(ecoleData).forEach(key => {
      if (ecoleData[key] !== undefined && key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(ecoleData[key]);
      }
    });

    if (fields.length === 0) return false;

    values.push(id);

    const [result] = await pool.execute(
      `UPDATE ecoles SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  static async deleteEcole(id) {
    const [result] = await pool.execute(
      'UPDATE ecoles SET actif = FALSE WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

export default ReferenceModel;
