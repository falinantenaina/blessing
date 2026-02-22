import { pool } from "../config/database.js";

class PaiementModel {
  // ─────────────────────────────────────────────
  // Lister tous les paiements avec pagination + filtres
  // ─────────────────────────────────────────────
  static async findAll(filters = {}) {
    const {
      search = "",
      page = 1,
      limit = 15,
      date_debut,
      date_fin,
      type_paiement,
      methode_paiement,
      avec_restant,
    } = filters;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];

    let query = `
      SELECT 
        p.id,
        p.inscription_id,
        p.type_paiement,
        p.type_livre,
        p.montant,
        p.date_paiement,
        p.methode_paiement,
        p.reference_mvola,
        p.remarques,
        p.created_at,
        e.nom    AS etudiant_nom,
        e.prenom AS etudiant_prenom,
        e.telephone AS etudiant_telephone,
        v.nom    AS vague_nom,
        n.code   AS niveau_code,
        u.nom    AS utilisateur_nom,
        u.prenom AS utilisateur_prenom
      FROM paiements p
      JOIN inscriptions i  ON p.inscription_id = i.id
      JOIN etudiants    e  ON i.etudiant_id     = e.id
      JOIN vagues       v  ON i.vague_id         = v.id
      JOIN niveaux      n  ON v.niveau_id         = n.id
      LEFT JOIN utilisateurs u ON p.utilisateur_id = u.id
      WHERE 1=1
    `;

    // Recherche texte
    if (search) {
      query += ` AND (
        e.nom            LIKE ? OR
        e.prenom         LIKE ? OR
        e.telephone      LIKE ? OR
        p.reference_mvola LIKE ?
      )`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    // Période
    if (date_debut) {
      query += " AND p.date_paiement >= ?";
      params.push(date_debut);
    }
    if (date_fin) {
      query += " AND p.date_paiement <= ?";
      params.push(date_fin);
    }

    // Type de paiement
    if (type_paiement) {
      query += " AND p.type_paiement = ?";
      params.push(type_paiement);
    }

    // Méthode de paiement
    if (methode_paiement) {
      query += " AND p.methode_paiement = ?";
      params.push(methode_paiement);
    }

    // Uniquement les inscriptions avec solde restant
    if (avec_restant) {
      query += `
        AND i.id IN (
          SELECT ins.id
          FROM inscriptions ins
          JOIN vagues  vv ON ins.vague_id  = vv.id
          JOIN niveaux nn ON vv.niveau_id  = nn.id
          WHERE (
            SELECT COALESCE(SUM(pp.montant), 0)
            FROM paiements pp
            WHERE pp.inscription_id = ins.id
          ) < (
            nn.frais_inscription +
            COALESCE((SELECT l.prix FROM livres l WHERE l.inscription_id = ins.id AND l.type_livre = 'cours'    LIMIT 1), 0) +
            COALESCE((SELECT l.prix FROM livres l WHERE l.inscription_id = ins.id AND l.type_livre = 'exercices' LIMIT 1), 0)
          )
        )
      `;
    }

    // Compter le total
    const countQuery = `SELECT COUNT(*) AS total FROM (${query}) AS sub`;
    const [countRows] = await pool.execute(countQuery, params);
    const total = countRows[0].total;

    // Pagination + tri
    query +=
      " ORDER BY p.date_paiement DESC, p.created_at DESC LIMIT ? OFFSET ?";
    params.push(String(limit), String(offset));

    const [rows] = await pool.execute(query, params);

    return {
      paiements: rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  }

  // ─────────────────────────────────────────────
  // Statistiques globales (ou filtrées par période)
  // ─────────────────────────────────────────────
  static async getStats(filters = {}) {
    const { date_debut, date_fin } = filters;
    const params = [];

    let whereClause = "WHERE 1=1";
    if (date_debut) {
      whereClause += " AND p.date_paiement >= ?";
      params.push(date_debut);
    }
    if (date_fin) {
      whereClause += " AND p.date_paiement <= ?";
      params.push(date_fin);
    }

    // Totaux paiements
    const [statsRows] = await pool.execute(
      `SELECT
        COUNT(*)                                                          AS nb_paiements,
        COALESCE(SUM(p.montant), 0)                                       AS total_paye,
        COALESCE(SUM(CASE WHEN p.methode_paiement = 'especes' THEN p.montant ELSE 0 END), 0) AS total_especes,
        COALESCE(SUM(CASE WHEN p.methode_paiement = 'mvola'   THEN p.montant ELSE 0 END), 0) AS total_mvola,
        COUNT(CASE WHEN p.methode_paiement = 'especes' THEN 1 END)        AS nb_especes,
        COUNT(CASE WHEN p.methode_paiement = 'mvola'   THEN 1 END)        AS nb_mvola,
        COUNT(CASE WHEN p.type_paiement = 'inscription' THEN 1 END)       AS nb_inscription,
        COUNT(CASE WHEN p.type_paiement = 'livre'       THEN 1 END)       AS nb_livre
       FROM paiements p
       ${whereClause}`,
      params,
    );

    // Total restant dû (toutes inscriptions actives, non filtré par date)
    const [restantRows] = await pool.execute(
      `SELECT
        COUNT(DISTINCT i.id) AS nb_inscriptions_non_soldees,
        COALESCE(SUM(
          (n.frais_inscription
            + COALESCE((SELECT l.prix FROM livres l WHERE l.inscription_id = i.id AND l.type_livre = 'cours'     LIMIT 1), 0)
            + COALESCE((SELECT l.prix FROM livres l WHERE l.inscription_id = i.id AND l.type_livre = 'exercices' LIMIT 1), 0))
          - COALESCE((SELECT SUM(pp.montant) FROM paiements pp WHERE pp.inscription_id = i.id), 0)
        ), 0) AS total_restant
       FROM inscriptions i
       JOIN vagues  v ON i.vague_id  = v.id
       JOIN niveaux n ON v.niveau_id = n.id
       WHERE i.statut_inscription IN ('actif', 'en_attente')
         AND (
           (n.frais_inscription
             + COALESCE((SELECT l.prix FROM livres l WHERE l.inscription_id = i.id AND l.type_livre = 'cours'     LIMIT 1), 0)
             + COALESCE((SELECT l.prix FROM livres l WHERE l.inscription_id = i.id AND l.type_livre = 'exercices' LIMIT 1), 0))
           > COALESCE((SELECT SUM(pp.montant) FROM paiements pp WHERE pp.inscription_id = i.id), 0)
         )`,
    );

    return {
      ...statsRows[0],
      ...restantRows[0],
    };
  }

  // ─────────────────────────────────────────────
  // Recherche d'inscriptions pour le modal
  // ─────────────────────────────────────────────
  static async searchInscriptions(search = "") {
    const s = `%${search}%`;

    const [rows] = await pool.execute(
      `SELECT
        i.id                  AS inscription_id,
        i.frais_inscription_paye,
        i.statut_inscription,
        e.nom                 AS etudiant_nom,
        e.prenom              AS etudiant_prenom,
        e.telephone           AS etudiant_telephone,
        v.nom                 AS vague_nom,
        n.code                AS niveau_code,
        n.frais_inscription   AS montant_frais_inscription,
        n.prix_livre_cours,
        n.prix_livre_exercices,
        COALESCE(lc.statut_paiement, 'non_paye')  AS livre_cours_paye,
        COALESCE(le2.statut_paiement, 'non_paye') AS livre_exercices_paye,
        (
          n.frais_inscription
          + COALESCE(lc.prix, 0)
          + COALESCE(le2.prix, 0)
        ) AS montant_total,
        COALESCE((SELECT SUM(pp.montant) FROM paiements pp WHERE pp.inscription_id = i.id), 0) AS montant_paye,
        (
          n.frais_inscription
          + COALESCE(lc.prix, 0)
          + COALESCE(le2.prix, 0)
          - COALESCE((SELECT SUM(pp.montant) FROM paiements pp WHERE pp.inscription_id = i.id), 0)
        ) AS montant_restant
       FROM inscriptions i
       JOIN etudiants e ON i.etudiant_id = e.id
       JOIN vagues    v ON i.vague_id    = v.id
       JOIN niveaux   n ON v.niveau_id   = n.id
       LEFT JOIN livres lc  ON lc.inscription_id = i.id AND lc.type_livre = 'cours'
       LEFT JOIN livres le2 ON le2.inscription_id = i.id AND le2.type_livre = 'exercices'
       WHERE i.statut_inscription IN ('actif', 'en_attente')
         AND (e.nom LIKE ? OR e.prenom LIKE ? OR e.telephone LIKE ?)
       ORDER BY e.nom, e.prenom
       LIMIT 10`,
      [s, s, s],
    );

    return rows;
  }

  // ─────────────────────────────────────────────
  // Trouver un paiement par ID
  // ─────────────────────────────────────────────
  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT p.*, e.nom AS etudiant_nom, e.prenom AS etudiant_prenom,
              v.nom AS vague_nom, n.code AS niveau_code
       FROM paiements p
       JOIN inscriptions i ON p.inscription_id = i.id
       JOIN etudiants    e ON i.etudiant_id     = e.id
       JOIN vagues       v ON i.vague_id         = v.id
       JOIN niveaux      n ON v.niveau_id         = n.id
       WHERE p.id = ?`,
      [id],
    );
    return rows[0] || null;
  }
}

export default PaiementModel;
