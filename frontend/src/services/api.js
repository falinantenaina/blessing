// services/api.js - Version améliorée adaptée au backend
import axios from "../config/axios";

// ============================================
// AUTHENTICATION SERVICES
// ============================================
export const authService = {
  login: async (email, password) => {
    const response = await axios.post("/auth/login", { email, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await axios.post("/auth/register", userData);
    return response.data;
  },

  logout: async () => {
    const response = await axios.post("/auth/logout");
    return response.data;
  },

  getProfile: async () => {
    const response = await axios.get("/auth/me");
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await axios.put("/auth/profile", userData);
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await axios.put("/auth/change-password", {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};

// ============================================
// VAGUES SERVICES
// ============================================
/* export const vagueService = {
  getAll: async (params = {}) => {
    const response = await axios.get("/vagues", { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await axios.get(`/vagues/${id}`);
    return response.data;
  },

  create: async (vagueData) => {
    const response = await axios.post("/vagues", vagueData);
    return response.data;
  },

  update: async (id, vagueData) => {
    const response = await axios.put(`/vagues/${id}`, vagueData);
    return response.data;
  },

  delete: async (id) => {
    const response = await axios.delete(`/vagues/${id}`);
    return response.data;
  },

  getPlanning: async (filters = {}) => {
    const response = await axios.get("/vagues/planning", { params: filters });
    return response.data;
  },

  getPlanningEnseignant: async (enseignantId) => {
    const response = await axios.get(
      `/vagues/planning/enseignant/${enseignantId}`,
    );
    return response.data;
  },

  checkCapacite: async (id) => {
    const response = await axios.get(`/vagues/${id}/capacite`);
    return response.data;
  },
}; */

export const vagueService = {
  /**
   * Récupérer toutes les vagues avec filtres
   */
  getAll: async (params = {}) => {
    const response = await axios.get("/vagues", { params });
    return response.data;
  },

  /**
   * Récupérer une vague par ID (avec inscriptions incluses)
   */
  getById: async (id) => {
    const response = await axios.get(`/vagues/${id}`);
    return response.data;
  },

  /**
   * ✅ NOUVEAU : Récupérer les inscriptions d'une vague
   */
  getInscriptions: async (id) => {
    const response = await axios.get(`/vagues/${id}/etudiants`);
    return response.data;
  },

  /**
   * Créer une nouvelle vague
   */
  create: async (vagueData) => {
    const response = await axios.post("/vagues", vagueData);
    return response.data;
  },

  /**
   * Modifier une vague
   */
  update: async (id, vagueData) => {
    const response = await axios.put(`/vagues/${id}`, vagueData);
    return response.data;
  },

  /**
   * Supprimer une vague
   */
  delete: async (id) => {
    const response = await axios.delete(`/vagues/${id}`);
    return response.data;
  },

  /**
   * ✅ NOUVEAU : Recalculer le nombre d'inscrits
   */
  refreshInscritCount: async (id) => {
    const response = await axios.post(`/vagues/${id}/refresh-count`);
    return response.data;
  },

  /**
   * Récupérer le planning
   */
  getPlanning: async (filters = {}) => {
    const response = await axios.get("/vagues/planning", { params: filters });
    return response.data;
  },

  /**
   * Récupérer le planning d'un enseignant
   */
  getPlanningEnseignant: async (enseignantId) => {
    const response = await axios.get(
      `/vagues/planning/enseignant/${enseignantId}`,
    );
    return response.data;
  },

  /**
   * Vérifier la capacité d'une vague
   */
  checkCapacite: async (id) => {
    const response = await axios.get(`/vagues/${id}/capacite`);
    return response.data;
  },
};
// ============================================
// NIVEAUX SERVICES (ENDPOINT CORRIGÉ)
// ============================================
export const niveauService = {
  getAll: async (params = {}) => {
    const response = await axios.get("/niveaux", { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await axios.get(`/niveaux/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await axios.post("/niveaux", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await axios.put(`/niveaux/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await axios.delete(`/niveaux/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await axios.get("/niveaux/stats");
    return response.data;
  },
};

// ============================================
// SALLES SERVICES (ENDPOINT CORRIGÉ)
// ============================================
export const salleService = {
  getAll: async (params = {}) => {
    const response = await axios.get("/salles", { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await axios.get(`/salles/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await axios.post("/salles", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await axios.put(`/salles/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await axios.delete(`/salles/${id}`);
    return response.data;
  },

  getOccupation: async (id) => {
    const response = await axios.get(`/salles/${id}/occupation`);
    return response.data;
  },

  checkDisponibilite: async (id, params) => {
    const response = await axios.get(`/salles/${id}/disponibilite`, { params });
    return response.data;
  },

  getDisponibles: async (params) => {
    const response = await axios.get("/salles/disponibles", { params });
    return response.data;
  },

  getStats: async () => {
    const response = await axios.get("/salles/stats");
    return response.data;
  },
};

// ============================================
// JOURS SERVICES (ENDPOINT CORRIGÉ)
// ============================================
export const jourService = {
  getAll: async (params = {}) => {
    const response = await axios.get("/jours", { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await axios.get(`/jours/${id}`);
    return response.data;
  },

  update: async (id, data) => {
    const response = await axios.put(`/jours/${id}`, data);
    return response.data;
  },

  getWithStats: async () => {
    const response = await axios.get("/jours/stats");
    return response.data;
  },
};

// ============================================
// HORAIRES SERVICES (ENDPOINT CORRIGÉ)
// ============================================
export const horaireService = {
  getAll: async (params = {}) => {
    const response = await axios.get("/horaires", { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await axios.get(`/horaires/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await axios.post("/horaires", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await axios.put(`/horaires/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await axios.delete(`/horaires/${id}`);
    return response.data;
  },

  getDisponibles: async (params) => {
    const response = await axios.get("/horaires/disponibles", { params });
    return response.data;
  },
};

// ============================================
// USERS SERVICES
// ============================================
export const userService = {
  getAll: async (params = {}) => {
    const response = await axios.get("/users" /* { params } */);
    return response.data;
  },

  getById: async (id) => {
    const response = await axios.get(`/users/${id}`);
    return response.data;
  },

  create: async (userData) => {
    const response = await axios.post("/users", userData);
    return response.data;
  },

  update: async (id, userData) => {
    const response = await axios.put(`/users/${id}`, userData);
    return response.data;
  },

  delete: async (id) => {
    const response = await axios.delete(`/users/${id}`);
    return response.data;
  },

  toggleActive: async (id) => {
    const response = await axios.patch(`/users/${id}/toggle-active`);
    return response.data;
  },

  getStats: async () => {
    const response = await axios.get("/users/stats");
    return response.data;
  },

  getProfesseurs: async () => {
    const response = await axios.get("/users/professeurs");
    return response.data;
  },

  getAvailableTeachers: async (params) => {
    const response = await axios.get("/users/available-teachers", { params });
    return response.data;
  },
};

// ============================================
// INSCRIPTIONS SERVICES
// ============================================
/* export const inscriptionService = {
  createComplete: async (data) => {
    const response = await axios.post("/inscriptions/direct", data);
    return response.data;
  },

  getById: async (id) => {
    const response = await axios.get(`/inscriptions/${id}`);
    return response.data;
  },

  getByEtudiant: async (etudiantId) => {
    const response = await axios.get(`/inscriptions/etudiant/${etudiantId}`);
    return response.data;
  },

  addPaiement: async (data) => {
    const response = await axios.post("/inscriptions/paiements", data);
    return response.data;
  },

  updateLivreStatut: async (inscriptionId, numeroLivre, data) => {
    const response = await axios.put(
      `/inscriptions/${inscriptionId}/livres/${numeroLivre}`,
      data,
    );
    return response.data;
  },

  getStats: async (params = {}) => {
    const response = await axios.get("/inscriptions/stats", { params });
    return response.data;
  },
}; */
export const inscriptionService = {
  // ✅ Création inscription complète par admin (validée directement)
  createComplete: async (data) => {
    const response = await axios.post("/inscriptions/direct", data);
    return response.data;
  },

  // ✅ Récupérer inscription par ID
  getById: async (id) => {
    const response = await axios.get(`/inscriptions/${id}`);
    return response.data;
  },

  // ✅ Récupérer inscriptions d'un étudiant
  getByEtudiant: async (etudiantId) => {
    const response = await axios.get(`/inscriptions/student/${etudiantId}`);
    return response.data;
  },

  // ✅ NOUVEAU : Récupérer les inscriptions en attente de validation
  getPendingValidation: async (params = {}) => {
    const response = await axios.get("/inscriptions/pending", { params });
    return response.data;
  },

  // ✅ NOUVEAU : Valider ou rejeter une inscription
  validerInscription: async (inscriptionId, data) => {
    const response = await axios.put(
      `/inscriptions/${inscriptionId}/valider`,
      data,
    );
    return response.data;
  },

  // ✅ Ajouter un paiement
  addPaiement: async (data) => {
    const response = await axios.post("/inscriptions/paiements", data);
    return response.data;
  },

  // ✅ Modifier le statut d'un livre
  updateLivreStatut: async (inscriptionId, typeLivre, data) => {
    const response = await axios.patch(
      `/inscriptions/${inscriptionId}/livres/${typeLivre}`,
      data,
    );
    return response.data;
  },

  // ✅ Statistiques
  getStats: async (params = {}) => {
    const response = await axios.get("/inscriptions/stats", { params });
    return response.data;
  },
};
// ============================================
// FINANCE / ECOLAGES SERVICES
// ============================================
export const financeService = {
  getEcolages: async (params = {}) => {
    const response = await axios.get("/finance/ecolages", { params });
    return response.data;
  },

  getEcolageById: async (id) => {
    const response = await axios.get(`/finance/ecolages/${id}`);
    return response.data;
  },

  enregistrerPaiement: async (data) => {
    const response = await axios.post("/finance/paiements", data);
    return response.data;
  },

  getEcolagesByEtudiant: async (etudiantId) => {
    const response = await axios.get(
      `/finance/ecolages/etudiant/${etudiantId}`,
    );
    return response.data;
  },

  annulerPaiement: async (paiementId) => {
    const response = await axios.delete(`/finance/paiements/${paiementId}`);
    return response.data;
  },

  getStats: async (params = {}) => {
    const response = await axios.get("/finance/stats", { params });
    return response.data;
  },

  getRapport: async (params = {}) => {
    const response = await axios.get("/finance/rapport", { params });
    return response.data;
  },
};

// ============================================
// ECOLES SERVICES (depuis reference_controller)
// ============================================
export const ecoleService = {
  getAll: async () => {
    const response = await axios.get("/reference/ecoles");
    return response.data;
  },

  getById: async (id) => {
    const response = await axios.get(`/reference/ecoles/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await axios.post("/reference/ecoles", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await axios.put(`/reference/ecoles/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await axios.delete(`/reference/ecoles/${id}`);
    return response.data;
  },
};

// ============================================
// SERVICE DE RÉFÉRENCE (MAINTENU POUR COMPATIBILITÉ)
// ============================================
export const referenceService = {
  // Niveaux
  getNiveaux: async () => niveauService.getAll(),
  createNiveau: async (data) => niveauService.create(data),
  updateNiveau: async (id, data) => niveauService.update(id, data),
  deleteNiveau: async (id) => niveauService.delete(id),

  // Salles
  getSalles: async () => salleService.getAll(),
  createSalle: async (data) => salleService.create(data),
  updateSalle: async (id, data) => salleService.update(id, data),
  deleteSalle: async (id) => salleService.delete(id),

  // Jours
  getJours: async () => jourService.getAll(),

  // Horaires
  getHoraires: async () => horaireService.getAll(),
  createHoraire: async (data) => horaireService.create(data),
  updateHoraire: async (id, data) => horaireService.update(id, data),
  deleteHoraire: async (id) => horaireService.delete(id),

  // Écoles
  getEcoles: async () => ecoleService.getAll(),
  createEcole: async (data) => ecoleService.create(data),
  updateEcole: async (id, data) => ecoleService.update(id, data),
  deleteEcole: async (id) => ecoleService.delete(id),
};

export const etudiantService = {
  // ✅ Liste paginée basique
  async getAll(params = {}) {
    const response = await axios.get("/etudiants", { params });
    return response.data;
  },

  // ✅ Liste détaillée avec paiements, livres, inscriptions
  async getWithDetails(params = {}) {
    const response = await axios.get("/etudiants/details", { params });
    return response.data;
  },

  // ✅ Détails d'un étudiant
  async getById(id) {
    const response = await axios.get(`/etudiants/${id}`);
    return response.data;
  },

  // ✅ Création
  async create(data) {
    const response = await axios.post("/etudiants", data);
    return response.data;
  },

  // ✅ Mise à jour
  async update(id, data) {
    const response = await axios.put(`/etudiants/${id}`, data);
    return response.data;
  },

  // ✅ Désactiver (delete logique)
  async deactivate(id) {
    const response = await axios.delete(`/etudiants/${id}`);
    return response.data;
  },

  // ✅ Alias delete pour compatibilité Etudiants.jsx
  async delete(id) {
    const response = await axios.delete(`/etudiants/${id}`);
    return response.data;
  },

  // ✅ Toggle actif/inactif
  async toggle(id) {
    const response = await axios.patch(`/etudiants/${id}/toggle`);
    return response.data;
  },

  // ✅ Stats
  async getStats() {
    const response = await axios.get("/etudiants/stats");
    return response.data;
  },
};

export default {
  authService,
  vagueService,
  niveauService,
  salleService,
  jourService,
  horaireService,
  etudiantService,
  userService,
  inscriptionService,
  financeService,
  ecoleService,
  referenceService,
};
