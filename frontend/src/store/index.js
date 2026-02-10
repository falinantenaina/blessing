import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// ────────────────────────────────────────────────
// Auth Store – persistant + sécurisé
// ────────────────────────────────────────────────
export const useAuthStore = create(
  persist(
    immer((set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // ─── Actions principales ─────────────────────────────
      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);

        set((state) => {
          state.user = user;
          state.accessToken = accessToken;
          state.refreshToken = refreshToken;
          state.isAuthenticated = true;
          state.isLoading = false;
          state.error = null;
        });
      },

      updateUser: (updatedUser) => {
        set((state) => {
          state.user = { ...state.user, ...updatedUser };
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error, isLoading: false }),

      logout: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      // Méthode utilitaire pour vérifier si token existe encore
      hasValidToken: () => {
        const { accessToken } = get();
        return !!accessToken;
      },
    })),
    {
      name: "blessing-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      version: 1,
      migrate: (persistedState, version) => {
        if (version === 0) {
          return persistedState;
        }
        return persistedState;
      },
    },
  ),
);

// ────────────────────────────────────────────────
// Vague (Classe / Groupe) Store
// ────────────────────────────────────────────────
export const useVagueStore = create(
  immer((set, get) => ({
    vagues: [],
    selectedVague: null,
    loading: false,
    error: null,

    filters: {
      statut: "",
      niveau_id: "",
      enseignant_id: "",
      salle_id: "",
      search: "",
    },

    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    },

    // ─── Actions ─────────────────────────────────────────
    setVagues: (vagues, total = null) =>
      set((state) => {
        state.vagues = vagues;
        if (total !== null) {
          state.pagination.total = total;
          state.pagination.totalPages = Math.ceil(
            total / state.pagination.limit,
          );
        }
      }),

    setSelectedVague: (vague) => set({ selectedVague: vague }),

    setFilters: (newFilters) =>
      set((state) => {
        state.filters = { ...state.filters, ...newFilters };
        state.pagination.page = 1;
      }),

    setPage: (page) =>
      set((state) => {
        state.pagination.page = Math.max(1, page);
      }),

    setLoading: (loading) => set({ loading }),

    setError: (error) => set({ error, loading: false }),

    clearFilters: () =>
      set({
        filters: {
          statut: "",
          niveau_id: "",
          enseignant_id: "",
          salle_id: "",
          search: "",
        },
        pagination: { ...get().pagination, page: 1 },
      }),

    reset: () =>
      set({
        vagues: [],
        selectedVague: null,
        loading: false,
        error: null,
        filters: {
          statut: "",
          niveau_id: "",
          enseignant_id: "",
          salle_id: "",
          search: "",
        },
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      }),
  })),
);

// ────────────────────────────────────────────────
// Niveau Store (plus simple)
// ────────────────────────────────────────────────
export const useNiveauStore = create(
  immer((set) => ({
    niveaux: [],
    loading: false,
    error: null,

    setNiveaux: (niveaux) => set({ niveaux, loading: false, error: null }),

    setLoading: (loading) => set({ loading }),

    setError: (error) => set({ error, loading: false }),

    addNiveau: (niveau) =>
      set((state) => {
        state.niveaux.push(niveau);
      }),

    updateNiveau: (updatedNiveau) =>
      set((state) => {
        const index = state.niveaux.findIndex((n) => n.id === updatedNiveau.id);
        if (index !== -1) {
          state.niveaux[index] = { ...state.niveaux[index], ...updatedNiveau };
        }
      }),

    removeNiveau: (id) =>
      set((state) => {
        state.niveaux = state.niveaux.filter((n) => n.id !== id);
      }),
  })),
);

// ────────────────────────────────────────────────
// Salle Store
//

export const useSalleStore = create(
  immer((set) => ({
    salles: [],
    loading: false,
    error: null,

    setSalles: (salles) => set({ salles, loading: false, error: null }),

    setLoading: (loading) => set({ loading }),

    setError: (error) => set({ error, loading: false }),

    addSalle: (salle) =>
      set((state) => {
        state.salle.push(salle);
      }),

    updateSalle: (updatedSalle) =>
      set((state) => {
        const index = state.salles.findIndex((n) => n.id === updatedSalle.id);
        if (index !== -1) {
          state.salles[index] = { ...state.salles[index], ...updatedSalle };
        }
      }),

    removeSalle: (id) =>
      set((state) => {
        state.salles = state.salles.filter((n) => n.id !== id);
      }),
  })),
);

// ────────────────────────────────────────────────
// Utilisateurs Store
// ────────────────────────────────────────────────
export const useUserStore = create(
  immer((set) => ({
    users: [],
    selectedUser: null,
    loading: false,
    error: null,

    setUsers: (users) => set({ users, loading: false }),

    setSelectedUser: (user) => set({ selectedUser: user }),

    setLoading: (loading) => set({ loading }),

    setError: (error) => set({ error, loading: false }),

    addUser: (user) =>
      set((state) => {
        state.users.push(user);
      }),

    updateUser: (updatedUser) =>
      set((state) => {
        const index = state.users.findIndex((u) => u.id === updatedUser.id);
        if (index !== -1) {
          state.users[index] = { ...state.users[index], ...updatedUser };
        }
      }),
  })),
);

// ────────────────────────────────────────────────
// Finance / Ecolages Store
// ────────────────────────────────────────────────
export const useFinanceStore = create(
  immer((set) => ({
    ecolages: [],
    selectedEcolage: null,
    stats: null,
    loading: false,
    error: null,

    setEcolages: (ecolages) => set({ ecolages, loading: false }),

    setSelectedEcolage: (ecolage) => set({ selectedEcolage: ecolage }),

    setStats: (stats) => set({ stats }),

    setLoading: (loading) => set({ loading }),

    setError: (error) => set({ error, loading: false }),

    addPaiementToEcolage: (ecolageId, paiement) =>
      set((state) => {
        const index = state.ecolages.findIndex((e) => e.id === ecolageId);
        if (index !== -1) {
          const ecolage = state.ecolages[index];
          state.ecolages[index] = {
            ...ecolage,
            montant_paye: ecolage.montant_paye + paiement.montant,
            montant_restant: ecolage.montant_restant - paiement.montant,
            statut:
              ecolage.montant_paye + paiement.montant >= ecolage.montant_total
                ? "paye"
                : ecolage.montant_paye + paiement.montant > 0
                  ? "partiel"
                  : "non_paye",
            paiements: [...(ecolage.paiements || []), paiement],
          };
        }
      }),
  })),
);
