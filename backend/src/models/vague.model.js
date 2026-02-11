import { pool } from "../config/database.js";

class VagueModel {
  // Créer une vague avec horaires multiples
  static async create(vagueData) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const {
        nom,
        niveau_id,
        enseignant_id,
        salle_id,
        date_debut,
        date_fin,
        statut = "planifie",
        remarques = null,
        horaires = [], // Array de { jour_id, horaire_id }
      } = vagueData;

      // Récupérer la capacité de la salle
      let capacite_max = 20; // Par défaut
      if (salle_id) {
        const [salleRows] = await connection.execute(
          "SELECT capacite FROM salles WHERE id = ?",
          [salle_id],
        );
        if (salleRows.length > 0) {
          capacite_max = salleRows[0].capacite;
        }
      }

      // Créer la vague
      const [result] = await connection.execute(
        `INSERT INTO vagues (nom, niveau_id, enseignant_id, salle_id, date_debut, date_fin, capacite_max, statut, remarques)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          nom,
          niveau_id,
          enseignant_id,
          salle_id,
          date_debut,
          date_fin,
          capacite_max,
          statut,
          remarques,
        ],
      );

      const vagueId = result.insertId;

      // Ajouter les horaires
      if (horaires && horaires.length > 0) {
        for (const horaire of horaires) {
          await connection.execute(
            `INSERT INTO vague_horaires (vague_id, jour_id, horaire_id)
             VALUES (?, ?, ?)`,
            [vagueId, horaire.jour_id, horaire.horaire_id],
          );
        }
      }

      await connection.commit();
      return vagueId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Trouver une vague par ID avec tous les détails
  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT v.*,
              n.code as niveau_code, n.nom as niveau_nom,
              u.nom as enseignant_nom, u.prenom as enseignant_prenom,
              s.nom as salle_nom, s.capacite as salle_capacite,
              (SELECT COUNT(*) FROM inscriptions WHERE vague_id = v.id AND statut = 'actif') as nb_inscrits
       FROM vagues v
       LEFT JOIN niveaux n ON v.niveau_id = n.id
       LEFT JOIN utilisateurs u ON v.enseignant_id = u.id
       LEFT JOIN salles s ON v.salle_id = s.id
       WHERE v.id = ?`,
      [id],
    );

    if (rows.length === 0) return null;

    // Récupérer les horaires de la vague
    const [horaires] = await pool.execute(
      `SELECT vh.*, 
              j.nom as jour_nom, j.ordre as jour_ordre,
              h.heure_debut, h.heure_fin, h.libelle as horaire_libelle
       FROM vague_horaires vh
       JOIN jours j ON vh.jour_id = j.id
       JOIN horaires h ON vh.horaire_id = h.id
       WHERE vh.vague_id = ?
       ORDER BY j.ordre, h.heure_debut`,
      [id],
    );

    return {
      ...rows[0],
      horaires,
    };
  }

  // Obtenir toutes les vagues avec filtres
  static async findAll(filters = {}) {
    let query = `
      SELECT v.*,
             n.code as niveau_code, n.nom as niveau_nom,
             u.nom as enseignant_nom, u.prenom as enseignant_prenom,
             s.nom as salle_nom,
             (SELECT COUNT(*) FROM inscriptions WHERE vague_id = v.id AND statut = 'actif') as nb_inscrits
      FROM vagues v
      LEFT JOIN niveaux n ON v.niveau_id = n.id
      LEFT JOIN utilisateurs u ON v.enseignant_id = u.id
      LEFT JOIN salles s ON v.salle_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.statut) {
      query += " AND v.statut = ?";
      params.push(filters.statut);
    }

    if (filters.niveau_id) {
      query += " AND v.niveau_id = ?";
      params.push(filters.niveau_id);
    }

    if (filters.enseignant_id) {
      query += " AND v.enseignant_id = ?";
      params.push(filters.enseignant_id);
    }

    if (filters.salle_id) {
      query += " AND v.salle_id = ?";
      params.push(filters.salle_id);
    }

    if (filters.search) {
      query += " AND v.nom LIKE ?";
      params.push(`%${filters.search}%`);
    }

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const offset = (page - 1) * limit;

    query += " ORDER BY v.date_debut DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [rows] = await pool.execute(query, params);

    // Pour chaque vague, récupérer un résumé des horaires
    const vaguesAvecHoraires = await Promise.all(
      rows.map(async (vague) => {
        const [horaires] = await pool.execute(
          `SELECT j.nom as jour_nom, h.heure_debut, h.heure_fin
           FROM vague_horaires vh
           JOIN jours j ON vh.jour_id = j.id
           JOIN horaires h ON vh.horaire_id = h.id
           WHERE vh.vague_id = ?
           ORDER BY j.ordre, h.heure_debut`,
          [vague.id],
        );

        return {
          ...vague,
          horaires_resume: horaires
            .map((h) => `${h.jour_nom} ${h.heure_debut}-${h.heure_fin}`)
            .join(", "),
        };
      }),
    );

    // Compter le total
    let countQuery = "SELECT COUNT(*) as total FROM vagues v WHERE 1=1";
    const countParams = [];

    if (filters.statut) {
      countQuery += " AND v.statut = ?";
      countParams.push(filters.statut);
    }

    if (filters.niveau_id) {
      countQuery += " AND v.niveau_id = ?";
      countParams.push(filters.niveau_id);
    }

    if (filters.search) {
      countQuery += " AND v.nom LIKE ?";
      countParams.push(`%${filters.search}%`);
    }

    const [countResult] = await pool.execute(countQuery, countParams);

    return {
      vagues: vaguesAvecHoraires,
      total: countResult[0].total,
      page,
      limit,
    };
  }

  // Mettre à jour une vague
  static async update(id, vagueData) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const { horaires, ...vagueFields } = vagueData;

      // Si la salle change, mettre à jour la capacité
      if (vagueFields.salle_id) {
        const [salleRows] = await connection.execute(
          "SELECT capacite FROM salles WHERE id = ?",
          [vagueFields.salle_id],
        );
        if (salleRows.length > 0) {
          vagueFields.capacite_max = salleRows[0].capacite;
        }
      }

      // Mettre à jour les champs de la vague
      const fields = [];
      const values = [];

      Object.keys(vagueFields).forEach((key) => {
        if (vagueFields[key] !== undefined && key !== "id") {
          fields.push(`${key} = ?`);
          values.push(vagueFields[key]);
        }
      });

      if (fields.length > 0) {
        values.push(id);
        await connection.execute(
          `UPDATE vagues SET ${fields.join(", ")} WHERE id = ?`,
          values,
        );
      }

      // Mettre à jour les horaires si fournis
      if (horaires !== undefined) {
        // Supprimer les anciens horaires
        await connection.execute(
          "DELETE FROM vague_horaires WHERE vague_id = ?",
          [id],
        );

        // Ajouter les nouveaux
        if (horaires.length > 0) {
          for (const horaire of horaires) {
            await connection.execute(
              `INSERT INTO vague_horaires (vague_id, jour_id, horaire_id)
               VALUES (?, ?, ?)`,
              [id, horaire.jour_id, horaire.horaire_id],
            );
          }
        }
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Supprimer une vague
  static async delete(id) {
    const [result] = await pool.execute("DELETE FROM vagues WHERE id = ?", [
      id,
    ]);

    return result.affectedRows > 0;
  }

  // Vérifier la disponibilité d'un enseignant
  static async checkEnseignantDisponibilite(
    enseignantId,
    jourId,
    horaireId,
    excludeVagueId = null,
  ) {
    let query = `
      SELECT COUNT(*) as count
      FROM vague_horaires vh
      JOIN vagues v ON vh.vague_id = v.id
      WHERE v.enseignant_id = ?
        AND vh.jour_id = ?
        AND vh.horaire_id = ?
        AND v.statut IN ('planifie', 'en_cours')
    `;

    const params = [enseignantId, jourId, horaireId];

    if (excludeVagueId) {
      query += " AND v.id != ?";
      params.push(excludeVagueId);
    }

    const [rows] = await pool.execute(query, params);

    return rows[0].count === 0;
  }

  // Vérifier la capacité d'une vague
  static async checkCapacite(vagueId) {
    const [rows] = await pool.execute(
      `SELECT v.capacite_max,
              (SELECT COUNT(*) FROM inscriptions WHERE vague_id = v.id AND statut = 'actif') as nb_inscrits
       FROM vagues v
       WHERE v.id = ?`,
      [vagueId],
    );

    if (rows.length === 0) return false;

    return rows[0].nb_inscrits < rows[0].capacite_max;
  }

  // Obtenir le planning complet
  static async getPlanning(filters = {}) {
    let query = `
      SELECT v.id, v.nom, v.statut, v.capacite_max,
             n.code as niveau_code,
             u.nom as enseignant_nom, u.prenom as enseignant_prenom,
             s.nom as salle_nom,
             (SELECT COUNT(*) FROM inscriptions WHERE vague_id = v.id AND statut = 'actif') as nb_inscrits
      FROM vagues v
      LEFT JOIN niveaux n ON v.niveau_id = n.id
      LEFT JOIN utilisateurs u ON v.enseignant_id = u.id
      LEFT JOIN salles s ON v.salle_id = s.id
      WHERE v.statut IN ('planifie', 'en_cours')
    `;

    const params = [];

    if (filters.salle_id) {
      query += " AND v.salle_id = ?";
      params.push(filters.salle_id);
    }

    if (filters.enseignant_id) {
      query += " AND v.enseignant_id = ?";
      params.push(filters.enseignant_id);
    }

    const [vagues] = await pool.execute(query, params);

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

    return vaguesAvecHoraires;
  }

  //Obtenir la liste des étudiants inscripts à une vague

  static async getEtudiants(vagueId, filters = {}) {
    // Vérifier que la vague existe
    const [vagueRows] = await pool.execute(
      `SELECT v.id, v.nom, v.capacite_max, v.statut,
              n.code as niveau_code, n.nom as niveau_nom,
              (SELECT COUNT(*) FROM inscriptions WHERE vague_id = v.id AND statut = 'actif') as nb_inscrits
       FROM vagues v
       LEFT JOIN niveaux n ON v.niveau_id = n.id
       WHERE v.id = ?`,
      [vagueId],
    );

    if (vagueRows.length === 0) return null;

    // Construire la requête des étudiants
    let query = `
      SELECT 
        e.id as etudiant_id,
        e.nom,
        e.prenom,
        e.telephone,
        e.email,
        e.photo_url,
        i.id as inscription_id,
        i.statut as inscription_statut,
        i.date_inscription,
        i.remarques,
        ec.montant_total,
        ec.montant_paye,
        ec.montant_restant,
        ec.frais_inscription_paye,
        ec.statut as statut_ecolage,
        (SELECT COUNT(*) FROM livres l WHERE l.inscription_id = i.id AND l.statut_paiement = 'paye') as livres_payes,
        (SELECT COUNT(*) FROM livres l WHERE l.inscription_id = i.id AND l.statut_livraison = 'livre') as livres_livres
      FROM inscriptions i
      JOIN etudiants e ON i.etudiant_id = e.id
      LEFT JOIN ecolages ec ON i.id = ec.inscription_id
      WHERE i.vague_id = ?
    `;
    const params = [vagueId];

    // Filtre par statut d'inscription
    if (filters.statut_inscription) {
      query += " AND i.statut = ?";
      params.push(filters.statut_inscription);
    }

    // Filtre par statut de paiement
    if (filters.statut_ecolage) {
      query += " AND ec.statut = ?";
      params.push(filters.statut_ecolage);
    }

    // Recherche par nom, prénom ou téléphone
    if (filters.search) {
      query += " AND (e.nom LIKE ? OR e.prenom LIKE ? OR e.telephone LIKE ?)";
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Compter le total avant pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM inscriptions i
      JOIN etudiants e ON i.etudiant_id = e.id
      LEFT JOIN ecolages ec ON i.id = ec.inscription_id
      WHERE i.vague_id = ?
    `;
    const countParams = [vagueId];

    if (filters.statut_inscription) {
      countQuery += " AND i.statut = ?";
      countParams.push(filters.statut_inscription);
    }
    if (filters.statut_ecolage) {
      countQuery += " AND ec.statut = ?";
      countParams.push(filters.statut_ecolage);
    }
    if (filters.search) {
      countQuery +=
        " AND (e.nom LIKE ? OR e.prenom LIKE ? OR e.telephone LIKE ?)";
      const searchTerm = `%${filters.search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const offset = (page - 1) * limit;

    query += " ORDER BY e.nom ASC, e.prenom ASC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [etudiants] = await pool.execute(query, params);

    return {
      vague: vagueRows[0],
      etudiants,
      total,
      page,
      limit,
    };
  }
  async getInscriptionsByVague(vagueId) {
    const query = `
      SELECT 
        i.id,
        i.etudiant_id,
        i.date_inscription,
        i.statut_inscription,
        i.frais_inscription_paye,
        i.montant_total,
        i.montant_paye,
        i.montant_restant,
        
        -- Informations étudiant
        e.nom as etudiant_nom,
        e.prenom as etudiant_prenom,
        e.telephone as etudiant_telephone,
        e.email as etudiant_email,
        
        -- Informations livres
        (SELECT COUNT(*) FROM livres WHERE inscription_id = i.id AND statut_paiement = 'paye') as nb_livres_payes,
        (SELECT COUNT(*) FROM livres WHERE inscription_id = i.id) as nb_livres_total
        
      FROM inscriptions i
      INNER JOIN etudiants e ON i.etudiant_id = e.id
      WHERE i.vague_id = ?
        AND i.statut_inscription IN ('actif', 'en_attente')
      ORDER BY i.date_inscription DESC
    `;

    const [inscriptions] = await pool.execute(query, [vagueId]);
    return inscriptions;
  }

  async updateNbInscrits(vagueId) {
    const query = `
      UPDATE vagues v
      SET v.nb_inscrits = (
        SELECT COUNT(*)
        FROM inscriptions i
        WHERE i.vague_id = v.id
          AND i.statut_inscription IN ('actif', 'en_attente')
      )
      WHERE v.id = ?
    `;

    await pool.execute(query, [vagueId]);
  }

  async getByIdWithInscriptions(id) {
    // Récupérer la vague
    const [vagues] = await pool.execute(
      `SELECT 
        v.*,
        n.code as niveau_code,
        n.nom as niveau_nom,
        s.nom as salle_nom,
        s.capacite as capacite_max,
        u.nom as enseignant_nom,
        u.prenom as enseignant_prenom
      FROM vagues v
      LEFT JOIN niveaux n ON v.niveau_id = n.id
      LEFT JOIN salles s ON v.salle_id = s.id
      LEFT JOIN users u ON v.enseignant_id = u.id
      WHERE v.id = ?`,
      [id],
    );

    if (vagues.length === 0) {
      return null;
    }

    const vague = vagues[0];

    // Récupérer les horaires
    const [horaires] = await pool.execute(
      `SELECT 
        vh.id,
        vh.jour_id,
        vh.horaire_id,
        j.nom as jour_nom,
        h.heure_debut,
        h.heure_fin,
        h.libelle
      FROM vagues_horaires vh
      INNER JOIN jours j ON vh.jour_id = j.id
      INNER JOIN horaires h ON vh.horaire_id = h.id
      WHERE vh.vague_id = ?
      ORDER BY j.ordre, h.heure_debut`,
      [id],
    );

    vague.horaires = horaires;

    const inscriptions = await this.getInscriptionsByVague(id);
    vague.inscriptions = inscriptions;

    vague.nb_inscrits = inscriptions.length;

    return vague;
  }

  async getAll(filters = {}) {
    let query = `
      SELECT 
        v.*,
        n.code as niveau_code,
        n.nom as niveau_nom,
        s.nom as salle_nom,
        s.capacite as capacite_max,
        u.nom as enseignant_nom,
        u.prenom as enseignant_prenom,
        -- ✅ CORRECTION : Calculer nb_inscrits en temps réel
        (SELECT COUNT(*) 
         FROM inscriptions i 
         WHERE i.vague_id = v.id 
           AND i.statut_inscription IN ('actif', 'en_attente')
        ) as nb_inscrits
      FROM vagues v
      LEFT JOIN niveaux n ON v.niveau_id = n.id
      LEFT JOIN salles s ON v.salle_id = s.id
      LEFT JOIN users u ON v.enseignant_id = u.id
      WHERE 1=1
    `;

    const params = [];

    // Filtres
    if (filters.statut) {
      query += " AND v.statut = ?";
      params.push(filters.statut);
    }

    if (filters.niveau_id) {
      query += " AND v.niveau_id = ?";
      params.push(filters.niveau_id);
    }

    if (filters.enseignant_id) {
      query += " AND v.enseignant_id = ?";
      params.push(filters.enseignant_id);
    }

    if (filters.salle_id) {
      query += " AND v.salle_id = ?";
      params.push(filters.salle_id);
    }

    if (filters.search) {
      query += " AND v.nom LIKE ?";
      params.push(`%${filters.search}%`);
    }

    query += " ORDER BY v.date_debut DESC";

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const offset = (page - 1) * limit;

    const [countResult] = await pool.execute(
      query.replace("SELECT v.*, n.code", "SELECT COUNT(*) as total"),
      params,
    );

    query += " LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [vagues] = await pool.execute(query, params);

    // Récupérer les horaires pour chaque vague
    for (const vague of vagues) {
      const [horaires] = await pool.execute(
        `SELECT 
          vh.id,
          vh.jour_id,
          vh.horaire_id,
          j.nom as jour_nom,
          h.heure_debut,
          h.heure_fin,
          h.libelle
        FROM vagues_horaires vh
        INNER JOIN jours j ON vh.jour_id = j.id
        INNER JOIN horaires h ON vh.horaire_id = h.id
        WHERE vh.vague_id = ?
        ORDER BY j.ordre, h.heure_debut`,
        [vague.id],
      );

      vague.horaires = horaires;

      // Créer un résumé des horaires
      if (horaires.length > 0) {
        vague.horaires_resume = horaires
          .map((h) => `${h.jour_nom} ${h.heure_debut?.substring(0, 5)}`)
          .join(", ");
      }
    }

    return {
      vagues,
      pagination: {
        page,
        limit,
        totalItems: countResult[0]?.total || 0,
        totalPages: Math.ceil((countResult[0]?.total || 0) / limit),
      },
    };
  }
}

export default VagueModel;
