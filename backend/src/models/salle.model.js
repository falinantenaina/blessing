import { pool } from "../config/database.js";

class SalleModel {
  // Créer une salle
  static async create(salleData) {
    const { nom, ecole_id, capacite, equipements } = salleData;

    const [result] = await pool.execute(
      "INSERT INTO salles (nom, ecole_id, capacite, equipements) VALUES (?, ?, ?, ?)",
      [nom, ecole_id, capacite, equipements || null],
    );

    return result.insertId;
  }

  // Obtenir toutes les salles
  static async findAll(filters = {}) {
    let query = `
      SELECT s.*, e.nom as ecole_nom,
             (SELECT COUNT(DISTINCT v.id) 
              FROM vagues v 
              WHERE v.salle_id = s.id AND v.statut IN ('planifie', 'en_cours')) as nb_vagues_actives
      FROM salles s
      LEFT JOIN ecoles e ON s.ecole_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.actif !== undefined) {
      query += " AND s.actif = ?";
      params.push(filters.actif);
    }

    if (filters.ecole_id) {
      query += " AND s.ecole_id = ?";
      params.push(filters.ecole_id);
    }

    query += " ORDER BY s.nom";

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  // Trouver une salle par ID
  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT s.*, e.nom as ecole_nom
       FROM salles s
       LEFT JOIN ecoles e ON s.ecole_id = e.id
       WHERE s.id = ?`,
      [id],
    );
    return rows[0];
  }

  // Mettre à jour une salle
  static async update(id, salleData) {
    const fields = [];
    const values = [];

    Object.keys(salleData).forEach((key) => {
      if (salleData[key] !== undefined && key !== "id") {
        fields.push(`${key} = ?`);
        values.push(salleData[key]);
      }
    });

    if (fields.length === 0) return false;

    values.push(id);

    const [result] = await pool.execute(
      `UPDATE salles SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );

    return result.affectedRows > 0;
  }

  // Supprimer (soft delete)
  static async delete(id) {
    const [result] = await pool.execute(
      "UPDATE salles SET actif = FALSE WHERE id = ?",
      [id],
    );
    return result.affectedRows > 0;
  }

  // Obtenir l'occupation d'une salle
  static async getOccupation(salleId) {
    // Récupérer toutes les vagues actives dans cette salle avec leurs horaires
    const [vagues] = await pool.execute(
      `SELECT v.id, v.nom, v.statut,
              n.code as niveau_code,
              u.nom as enseignant_nom, u.prenom as enseignant_prenom
       FROM vagues v
       JOIN niveaux n ON v.niveau_id = n.id
       LEFT JOIN utilisateurs u ON v.enseignant_id = u.id
       WHERE v.salle_id = ? AND v.statut IN ('planifie', 'en_cours')`,
      [salleId],
    );

    // Pour chaque vague, récupérer ses horaires
    const vaguesAvecHoraires = await Promise.all(
      vagues.map(async (vague) => {
        const [horaires] = await pool.execute(
          `SELECT vh.*, 
                  j.nom as jour_nom, j.ordre as jour_ordre,
                  h.heure_debut, h.heure_fin, h.libelle as horaire_libelle
           FROM vague_horaires vh
           JOIN jours j ON vh.jour_id = j.id
           JOIN horaires h ON vh.horaire_id = h.id
           WHERE vh.vague_id = ?
           ORDER BY j.ordre, h.heure_debut`,
          [vague.id],
        );

        return {
          ...vague,
          horaires,
        };
      }),
    );

    // Récupérer tous les horaires possibles
    const [tousLesHoraires] = await pool.execute(
      "SELECT * FROM horaires WHERE actif = TRUE ORDER BY heure_debut",
    );

    const [tousLesJours] = await pool.execute(
      "SELECT * FROM jours WHERE actif = TRUE ORDER BY ordre",
    );

    // Créer une grille d'occupation
    const grille = {};
    tousLesJours.forEach((jour) => {
      grille[jour.nom] = {};
      tousLesHoraires.forEach((horaire) => {
        grille[jour.nom][horaire.id] = {
          libre: true,
          vague: null,
          horaire_libelle: horaire.libelle,
          heure_debut: horaire.heure_debut,
          heure_fin: horaire.heure_fin,
        };
      });
    });

    // Marquer les créneaux occupés
    vaguesAvecHoraires.forEach((vague) => {
      vague.horaires.forEach((horaire) => {
        if (
          grille[horaire.jour_nom] &&
          grille[horaire.jour_nom][horaire.horaire_id]
        ) {
          grille[horaire.jour_nom][horaire.horaire_id] = {
            libre: false,
            vague: {
              id: vague.id,
              nom: vague.nom,
              niveau_code: vague.niveau_code,
              enseignant: vague.enseignant_nom
                ? `${vague.enseignant_prenom} ${vague.enseignant_nom}`
                : null,
            },
            horaire_libelle: horaire.horaire_libelle,
            heure_debut: horaire.heure_debut,
            heure_fin: horaire.heure_fin,
          };
        }
      });
    });

    return {
      vagues: vaguesAvecHoraires,
      grille,
      jours: tousLesJours,
      horaires: tousLesHoraires,
    };
  }

  // Vérifier si une salle est disponible pour un créneau donné
  static async checkDisponibilite(
    salleId,
    jourId,
    horaireId,
    excludeVagueId = null,
  ) {
    let query = `
      SELECT COUNT(*) as count
      FROM vague_horaires vh
      JOIN vagues v ON vh.vague_id = v.id
      WHERE v.salle_id = ?
        AND vh.jour_id = ?
        AND vh.horaire_id = ?
        AND v.statut IN ('planifie', 'en_cours')
    `;

    const params = [salleId, jourId, horaireId];

    if (excludeVagueId) {
      query += " AND v.id != ?";
      params.push(excludeVagueId);
    }

    const [rows] = await pool.execute(query, params);

    return rows[0].count === 0;
  }

  // Obtenir les salles disponibles pour un créneau
  static async getSallesDisponibles(jourId, horaireId, capaciteMin = null) {
    let query = `
      SELECT s.*, e.nom as ecole_nom
      FROM salles s
      LEFT JOIN ecoles e ON s.ecole_id = e.id
      WHERE s.actif = TRUE
        AND s.id NOT IN (
          SELECT DISTINCT v.salle_id 
          FROM vagues v
          JOIN vague_horaires vh ON v.id = vh.vague_id
          WHERE vh.jour_id = ? 
            AND vh.horaire_id = ?
            AND v.statut IN ('planifie', 'en_cours')
            AND v.salle_id IS NOT NULL
        )
    `;

    const params = [jourId, horaireId];

    if (capaciteMin) {
      query += " AND s.capacite >= ?";
      params.push(capaciteMin);
    }

    query += " ORDER BY s.capacite, s.nom";

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  // Statistiques des salles
  static async getStats() {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_salles,
        SUM(capacite) as capacite_totale,
        AVG(capacite) as capacite_moyenne,
        COUNT(DISTINCT v.id) as total_vagues_actives
      FROM salles s
      LEFT JOIN vagues v ON s.id = v.salle_id AND v.statut IN ('planifie', 'en_cours')
      WHERE s.actif = TRUE
    `);

    return stats[0];
  }
}

export default SalleModel;
