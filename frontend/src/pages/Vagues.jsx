import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Loading from "@/components/ui/Loading";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import {
  horaireService,
  inscriptionService,
  jourService,
  niveauService,
  salleService,
  userService,
  vagueService,
} from "@/services/api";
import {
  formatShortDate,
  getStatusColor,
  getStatusLabel,
} from "@/utils/helpers";
import {
  AlertCircle,
  Calendar,
  Clock,
  Edit,
  Eye,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

const STATUS_OPTIONS = [
  { value: "", label: "Tous les statuts" },
  { value: "planifie", label: "Planifié" },
  { value: "en_cours", label: "En cours" },
  { value: "termine", label: "Terminé" },
  { value: "annule", label: "Annulé" },
];

export default function Vagues() {
  // États
  const [vagues, setVagues] = useState([]);
  const [niveaux, setNiveaux] = useState([]);
  const [salles, setSalles] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [jours, setJours] = useState([]);
  const [horaires, setHoraires] = useState([]);
  const [inscrits, setInscrits] = useState([]);

  

  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false); // AJOUTÉ
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedVague, setSelectedVague] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Filtres
  const [filters, setFilters] = useState({
    statut: "",
    niveau_id: "",
    enseignant_id: "",
    salle_id: "",
    search: "",
  });

  // Formulaire
  const [formData, setFormData] = useState({
    nom: "",
    niveau_id: "",
    enseignant_id: "",
    salle_id: "",
    date_debut: "",
    date_fin: "",
    statut: "planifie",
  });

  // Créneaux horaires en mode liste
  const [selectedSlots, setSelectedSlots] = useState([
    { jour_id: "", horaire_id: "" },
  ]);
  const [formErrors, setFormErrors] = useState({});

  // Chargement des données initiales
  const fetchData = useCallback(async () => {
    setTableLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      // Ajouter les filtres seulement s'ils sont définis
      if (filters.statut) params.statut = filters.statut;
      if (filters.niveau_id) params.niveau_id = filters.niveau_id;
      if (filters.enseignant_id) params.enseignant_id = filters.enseignant_id;
      if (filters.salle_id) params.salle_id = filters.salle_id;
      if (filters.search) params.search = filters.search;

      const [
        vaguesRes,
        niveauxRes,
        sallesRes,
        enseignantsRes,
        joursRes,
        horairesRes,
      ] = await Promise.all([
        vagueService.getAll(params),
        niveauService.getAll(),
        salleService.getAll({ actif: true }),
        userService.getAll({ role: "enseignant", actif: true }),
        jourService.getAll({ actif: true }),
        horaireService.getAll({ actif: true }),
      ]);

      // Gestion de la réponse paginée pour les vagues
      if (vaguesRes.data) {
        if (vaguesRes.data.vagues) {
          setVagues(vaguesRes.data.vagues || []);
          setPagination((prev) => ({
            ...prev,
            total: vaguesRes.data.pagination?.totalItems || 0,
            totalPages: vaguesRes.data.pagination?.totalPages || 0,
          }));
        } else if (vaguesRes.data.liste) {
          setVagues(vaguesRes.data.liste || []);
          setPagination((prev) => ({
            ...prev,
            total: vaguesRes.data.liste.length,
            totalPages: 1,
          }));
        } else if (Array.isArray(vaguesRes.data)) {
          setVagues(vaguesRes.data);
          setPagination((prev) => ({
            ...prev,
            total: vaguesRes.data.length,
            totalPages: 1,
          }));
        }
      }

      // Gestion des niveaux
      if (niveauxRes.data) {
        const niveauxData = Array.isArray(niveauxRes.data)
          ? niveauxRes.data
          : niveauxRes.data.liste || niveauxRes.data.niveaux || [];
        setNiveaux(niveauxData);
      }

      // Gestion des salles
      if (sallesRes.data) {
        const sallesData = Array.isArray(sallesRes.data)
          ? sallesRes.data
          : sallesRes.data.liste || sallesRes.data.salles || [];
        setSalles(sallesData);
      }

      // Gestion des enseignants
      if (enseignantsRes.data) {
        const enseignantsData =
          enseignantsRes.data.users ||
          enseignantsRes.data.liste ||
          (Array.isArray(enseignantsRes.data) ? enseignantsRes.data : []);
        setEnseignants(enseignantsData);
      }

      // Gestion des jours
      if (joursRes.data) {
        const joursData = Array.isArray(joursRes.data)
          ? joursRes.data
          : joursRes.data.liste || joursRes.data.jours || [];
        setJours(joursData);
      }

      // Gestion des horaires
      if (horairesRes.data) {
        const horairesData = Array.isArray(horairesRes.data)
          ? horairesRes.data
          : horairesRes.data.liste || horairesRes.data.horaires || [];
        setHoraires(horairesData);
      }
    } catch (error) {
      console.error("Erreur chargement données:", error);
      toast.error(
        error.response?.data?.message ||
          "Erreur lors de la récupération des données",
      );
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Gestion des créneaux horaires - Mode Liste
  const addSlot = () =>
    setSelectedSlots([...selectedSlots, { jour_id: "", horaire_id: "" }]);

  const removeSlot = (index) => {
    if (selectedSlots.length > 1) {
      setSelectedSlots(selectedSlots.filter((_, i) => i !== index));
    }
  };

  const updateSlot = (index, field, value) => {
    const newSlots = [...selectedSlots];
    newSlots[index][field] = value;
    setSelectedSlots(newSlots);
  };

  // Récupère les slots valides
  const getValidSlots = () => {
    return selectedSlots.filter((s) => s.jour_id && s.horaire_id);
  };

  // Validation du formulaire
  const validateForm = () => {
    const errors = {};

    if (!formData.nom.trim()) {
      errors.nom = "Le nom est requis";
    }

    if (!formData.niveau_id) {
      errors.niveau_id = "Le niveau est requis";
    }

    if (!formData.date_debut) {
      errors.date_debut = "La date de début est requise";
    }

    if (!formData.date_fin) {
      errors.date_fin = "La date de fin est requise";
    }

    if (formData.date_debut && formData.date_fin) {
      if (new Date(formData.date_fin) <= new Date(formData.date_debut)) {
        errors.date_fin = "La date de fin doit être après la date de début";
      }
    }

    const validSlots = getValidSlots();
    if (validSlots.length === 0) {
      errors.horaires = "Sélectionnez au moins un créneau horaire";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };


  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs du formulaire");
      return;
    }

    const validSlots = getValidSlots();
    const payload = {
      nom: formData.nom.trim(),
      niveau_id: parseInt(formData.niveau_id),
      enseignant_id: formData.enseignant_id
        ? parseInt(formData.enseignant_id)
        : null,
      salle_id: formData.salle_id ? parseInt(formData.salle_id) : null,
      date_debut: formData.date_debut,
      date_fin: formData.date_fin,
      statut: formData.statut,
      horaires: validSlots.map((slot) => ({
        jour_id: parseInt(slot.jour_id),
        horaire_id: parseInt(slot.horaire_id),
      })),
    };

    try {
      if (isEditing && selectedVague) {
        await vagueService.update(selectedVague.id, payload);
        toast.success("Vague modifiée avec succès");
      } else {
        await vagueService.create(payload);
        toast.success("Vague créée avec succès");
      }

      closeForm();
      fetchData();
    } catch (error) {
      console.error("Erreur soumission:", error);
      toast.error(
        error.response?.data?.message || "Erreur lors de l'enregistrement",
      );
    }
  };

  // Ouverture du formulaire - VERSION CORRIGÉE
  const openForm = async (vague = null) => {
    if (vague) {
      setIsEditing(true);
      setSelectedVague(vague);
      setShowForm(true); // Ouvrir le modal immédiatement
      setFormLoading(true); // Activer le loading

      try {
        // Charger les détails complets de la vague
        const response = await vagueService.getById(vague.id);
        const vagueDetails = response.data;

        // Remplir le formulaire avec les données
        setFormData({
          nom: vagueDetails.nom || "",
          niveau_id: vagueDetails.niveau_id?.toString() || "",
          enseignant_id: vagueDetails.enseignant_id?.toString() || "",
          salle_id: vagueDetails.salle_id?.toString() || "",
          date_debut: vagueDetails.date_debut || "",
          date_fin: vagueDetails.date_fin || "",
          statut: vagueDetails.statut || "planifie",
        });

        // Charger les horaires
        if (
          vagueDetails.horaires &&
          Array.isArray(vagueDetails.horaires) &&
          vagueDetails.horaires.length > 0
        ) {
          setSelectedSlots(
            vagueDetails.horaires.map((h) => ({
              jour_id: h.jour_id?.toString() || "",
              horaire_id: h.horaire_id?.toString() || "",
            })),
          );
        } else {
          setSelectedSlots([{ jour_id: "", horaire_id: "" }]);
        }

        setFormErrors({});
      } catch (error) {
        console.error("Erreur chargement vague pour édition:", error);
        toast.error("Erreur lors du chargement des données de la vague");

        // Fallback sur les données de base
        setFormData({
          nom: vague.nom || "",
          niveau_id: vague.niveau_id?.toString() || "",
          enseignant_id: vague.enseignant_id?.toString() || "",
          salle_id: vague.salle_id?.toString() || "",
          date_debut: vague.date_debut || "",
          date_fin: vague.date_fin || "",
          statut: vague.statut || "planifie",
        });

        // Essayer avec les horaires de base si disponibles
        if (
          vague.horaires &&
          Array.isArray(vague.horaires) &&
          vague.horaires.length > 0
        ) {
          setSelectedSlots(
            vague.horaires.map((h) => ({
              jour_id: h.jour_id?.toString() || "",
              horaire_id: h.horaire_id?.toString() || "",
            })),
          );
        } else {
          setSelectedSlots([{ jour_id: "", horaire_id: "" }]);
        }

        setFormErrors({});
      } finally {
        setFormLoading(false); // Désactiver le loading
      }
    } else {
      // Mode création
      setIsEditing(false);
      setSelectedVague(null);
      setFormData({
        nom: "",
        niveau_id: "",
        enseignant_id: "",
        salle_id: "",
        date_debut: "",
        date_fin: "",
        statut: "planifie",
      });
      setSelectedSlots([{ jour_id: "", horaire_id: "" }]);
      setFormErrors({});
      setShowForm(true);
    }
  };

  // Fermeture du formulaire
  const closeForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setSelectedVague(null);
    setFormLoading(false);
    setFormData({
      nom: "",
      niveau_id: "",
      enseignant_id: "",
      salle_id: "",
      date_debut: "",
      date_fin: "",
      statut: "planifie",
    });
    setSelectedSlots([{ jour_id: "", horaire_id: "" }]);
    setFormErrors({});
  };

  // Suppression
  const handleDelete = async (vague) => {
    if (vague.nb_inscrits > 0) {
      toast.error("Impossible de supprimer une vague avec des inscriptions");
      return;
    }

    if (
      !window.confirm(
        `Voulez-vous vraiment supprimer la vague "${vague.nom}" ?`,
      )
    ) {
      return;
    }

    try {
      await vagueService.delete(vague.id);
      toast.success("Vague supprimée avec succès");
      fetchData();
    } catch (error) {
      console.error("Erreur suppression:", error);
      toast.error(
        error.response?.data?.message || "Erreur lors de la suppression",
      );
    }
  };

  // Affichage des détails
  const viewDetails = async (vague) => {
    setDetailsLoading(true);
    setShowDetails(true); // Ouvrir le modal immédiatement
    
    try {
      // Charger les détails de la vague
      const vagueResponse = await vagueService.getById(vague.id);
      const vagueDetails = vagueResponse.data;

      // Charger la liste des inscrits
      let inscritsList = [];
      if (inscriptionService && inscriptionService.getAll) {
        try {
          const inscritsResponse = await inscriptionService.getAll({
            vague_id: vague.id,
          });

          // Gérer différents formats de réponse
          if (inscritsResponse.data) {
            inscritsList = Array.isArray(inscritsResponse.data)
              ? inscritsResponse.data
              : inscritsResponse.data.inscriptions ||
                inscritsResponse.data.liste ||
                [];
          }
        } catch (error) {
          console.error("Erreur chargement inscrits:", error);
        }
      }

      setSelectedVague(vagueDetails);
      setInscrits(inscritsList);
    } catch (error) {
      console.error("Erreur chargement détails:", error);
      toast.error("Erreur lors du chargement des détails");
      setShowDetails(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Changement de page
  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  if (loading) return <Loading fullScreen message="Chargement des vagues..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Vagues</h1>
        <Button onClick={() => openForm()} variant="primary" className="cursor-pointer">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Vague
        </Button>
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Rechercher une vague..."
            value={filters.search}
            onChange={(e) => {
              setFilters({ ...filters, search: e.target.value });
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            icon={<Search className="w-4 h-4" />}
          />

          <Select
            placeholder="Statut"
            value={filters.statut}
            onChange={(e) => {
              setFilters({ ...filters, statut: e.target.value });
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            options={STATUS_OPTIONS}
          />

          <Select
            placeholder="Niveau"
            value={filters.niveau_id}
            onChange={(e) => {
              setFilters({ ...filters, niveau_id: e.target.value });
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            options={[
              { value: "", label: "Tous les niveaux" },
              ...niveaux.map((n) => ({ value: n.id.toString(), label: n.nom })),
            ]}
          />
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {tableLoading ? (
          <Loading message="Chargement..." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vague
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Niveau
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enseignant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Salle
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remplissage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Période
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vagues.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium">
                          Aucune vague trouvée
                        </p>
                        <p className="text-sm mt-1">
                          {filters.search ||
                          filters.statut ||
                          filters.niveau_id ||
                          filters.enseignant_id
                            ? "Essayez de modifier vos filtres"
                            : "Créez votre première vague pour commencer"}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    vagues.map((vague) => (
                      <tr
                        key={vague.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {vague.nom}
                          </div>
                          {/* <div className="text-sm text-gray-500">
                            {vague.horaires?.length || 0} créneaux
                          </div> */}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            {vague.niveau_code || vague.niveau_nom || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {vague.enseignant_prenom && vague.enseignant_nom
                              ? `${vague.enseignant_prenom} ${vague.enseignant_nom}`
                              : "Non assigné"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {vague.salle_nom || "Non assignée"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {vague.nb_inscrits || 0}
                            </span>
                            <span className="text-sm text-gray-500">/</span>
                            <span className="text-sm text-gray-500">
                              {vague.capacite_max || "∞"}
                            </span>
                          </div>
                          {vague.capacite_max && (
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                              <div
                                className="bg-primary-600 h-1.5 rounded-full"
                                style={{
                                  width: `${Math.min(
                                    ((vague.nb_inscrits || 0) /
                                      vague.capacite_max) *
                                      100,
                                    100,
                                  )}%`,
                                }}
                              />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatShortDate(vague.date_debut)}
                          </div>
                          <div className="text-sm text-gray-500">
                            au {formatShortDate(vague.date_fin)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <Badge variant={getStatusColor(vague.statut)}>
                            {getStatusLabel(vague.statut)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewDetails(vague)}
                              title="Voir détails"
                              className="cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openForm(vague)}
                              title="Modifier"
                              className="cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-800 cursor-pointer"
                              onClick={() => handleDelete(vague)}
                              title="Supprimer"
                              disabled={vague.nb_inscrits > 0}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page {pagination.page} sur {pagination.totalPages} (
                  {pagination.total} vagues)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1} className="cursor-pointer"
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="cursor-pointer"
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Formulaire */}
      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={isEditing ? "Modifier la vague" : "Créer une vague"}
        size="xl"
      >
        {formLoading ? (
          <div className="py-12">
            <Loading message="Chargement des données..." />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations générales */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Informations générales
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nom de la vague"
                  value={formData.nom}
                  onChange={(e) =>
                    setFormData({ ...formData, nom: e.target.value })
                  }
                  error={formErrors.nom}
                  placeholder="Ex: Vague L1 - Janvier 2026"
                  required
                />

                <Select
                  label="Niveau"
                  value={formData.niveau_id}
                  onChange={(e) =>
                    setFormData({ ...formData, niveau_id: e.target.value })
                  }
                  options={niveaux.map((n) => ({
                    value: n.id.toString(),
                    label: `${n.code} - ${n.nom}`,
                  }))}
                  error={formErrors.niveau_id}
                  placeholder="Sélectionner un niveau"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Salle"
                  value={formData.salle_id}
                  onChange={(e) =>
                    setFormData({ ...formData, salle_id: e.target.value })
                  }
                  options={[
                    { value: "", label: "Aucune salle" },
                    ...salles.map((s) => ({
                      value: s.id.toString(),
                      label: `${s.nom} (Cap: ${s.capacite})`,
                    })),
                  ]}
                  placeholder="Sélectionner une salle"
                />

                <Select
                  label="Enseignant"
                  value={formData.enseignant_id}
                  onChange={(e) =>
                    setFormData({ ...formData, enseignant_id: e.target.value })
                  }
                  options={[
                    { value: "", label: "Aucun enseignant" },
                    ...enseignants.map((e) => ({
                      value: e.id.toString(),
                      label: `${e.prenom} ${e.nom}`,
                    })),
                  ]}
                  placeholder="Sélectionner un enseignant"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Date de début"
                  type="date"
                  value={formData.date_debut}
                  onChange={(e) =>
                    setFormData({ ...formData, date_debut: e.target.value })
                  }
                  error={formErrors.date_debut}
                  required
                />

                <Input
                  label="Date de fin"
                  type="date"
                  value={formData.date_fin}
                  onChange={(e) =>
                    setFormData({ ...formData, date_fin: e.target.value })
                  }
                  error={formErrors.date_fin}
                  required
                />

                <Select
                  label="Statut"
                  value={formData.statut}
                  onChange={(e) =>
                    setFormData({ ...formData, statut: e.target.value })
                  }
                  options={STATUS_OPTIONS.filter((opt) => opt.value !== "")}
                  required
                />
              </div>
            </div>

            {/* Emploi du temps */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Emploi du temps
                </h3>
                {formErrors.horaires && (
                  <span className="text-sm text-red-600">
                    {formErrors.horaires}
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600">
                Ajoutez les créneaux horaires un par un
              </p>

              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="space-y-3">
                  {selectedSlots.map((slot, index) => (
                    <div
                      key={index}
                      className="flex gap-3 items-end bg-white p-3 rounded-lg border"
                    >
                      <div className="flex-1">
                        <Select
                          label="Jour"
                          value={slot.jour_id}
                          onChange={(e) =>
                            updateSlot(index, "jour_id", e.target.value)
                          }
                          options={[
                            { value: "", label: "Sélectionner un jour" },
                            ...jours.map((j) => ({
                              value: j.id.toString(),
                              label: j.nom,
                            })),
                          ]}
                          error={
                            !slot.jour_id && formErrors.horaires
                              ? "Jour requis"
                              : undefined
                          }
                          required
                        />
                      </div>
                      <div className="flex-1">
                        <Select
                          label="Horaire"
                          value={slot.horaire_id}
                          onChange={(e) =>
                            updateSlot(index, "horaire_id", e.target.value)
                          }
                          options={[
                            { value: "", label: "Sélectionner un horaire" },
                            ...horaires.map((h) => ({
                              value: h.id.toString(),
                              label: `${h.heure_debut?.substring(0, 5)} - ${h.heure_fin?.substring(0, 5)} ${h.libelle ? `(${h.libelle})` : ""}`,
                            })),
                          ]}
                          error={
                            !slot.horaire_id && formErrors.horaires
                              ? "Horaire requis"
                              : undefined
                          }
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSlot(index)}
                        className="p-2 text-red-500 hover:text-red-700 mb-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        disabled={selectedSlots.length <= 1}
                        title="Supprimer ce créneau"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addSlot}
                    className="w-full cursor-pointer"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Ajouter un créneau
                  </Button>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                {getValidSlots().length} créneau(x) configuré(s)
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={closeForm} className="cursor-pointer">
                Annuler
              </Button>
              <Button type="submit" variant="primary" className="cursor-pointer">
                {isEditing ? "Enregistrer les modifications" : "Créer la vague"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Détails */}
      {/* Modal Détails */}
      <Modal
        isOpen={showDetails}
        onClose={() => {
          setShowDetails(false);
          setInscrits([]);
        }}
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-linear-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Détails de la vague
            </span>
          </div>
        }
        size="xl"
        className="backdrop-blur-sm"
      >
        {detailsLoading ? (
          <div className="py-16">
            <Loading message="Chargement des détails..." />
          </div>
        ) : selectedVague ? (
          <div className="space-y-8">
            {/* Informations générales */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <div className="p-1.5 bg-blue-50 rounded-lg">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">
                  Informations générales
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Nom
                  </p>
                  <p className="font-semibold text-gray-900">
                    {selectedVague.nom}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Niveau
                  </p>
                  <p className="font-semibold text-gray-900">
                    {selectedVague.niveau_code} - {selectedVague.niveau_nom}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Enseignant
                  </p>
                  <p className="font-semibold text-gray-900">
                    {selectedVague.enseignant_prenom &&
                    selectedVague.enseignant_nom
                      ? `${selectedVague.enseignant_prenom} ${selectedVague.enseignant_nom}`
                      : "Non assigné"}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Salle
                  </p>
                  <p className="font-semibold text-gray-900">
                    {selectedVague.salle_nom || "Non assignée"}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Période
                  </p>
                  <p className="font-semibold text-gray-900">
                    {formatShortDate(selectedVague.date_debut)} →{" "}
                    {formatShortDate(selectedVague.date_fin)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Remplissage
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">
                      {selectedVague.nb_inscrits || 0} /{" "}
                      {selectedVague.capacite_max || "∞"}
                    </span>
                    {selectedVague.capacite_max && (
                      <div className="flex-1 max-w-25">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-linear-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                            style={{
                              width: `${Math.min(
                                ((selectedVague.nb_inscrits || 0) /
                                  selectedVague.capacite_max) *
                                  100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl md:col-span-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Statut
                  </p>
                  <Badge
                    variant={getStatusColor(selectedVague.statut)}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium"
                  >
                    {getStatusLabel(selectedVague.statut)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Emploi du temps */}
            {selectedVague.horaires && selectedVague.horaires.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <div className="p-1.5 bg-blue-50 rounded-lg">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Emploi du temps
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedVague.horaires.map((horaire, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-4 bg-linear-to-r from-gray-50 to-white rounded-xl border border-gray-100"
                    >
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {horaire.jour_nom}
                        </p>
                        <p className="text-sm text-gray-600">
                          {horaire.heure_debut?.substring(0, 5)} -{" "}
                          {horaire.heure_fin?.substring(0, 5)}
                          {horaire.libelle && (
                            <span className="ml-2 text-xs text-gray-500">
                              ({horaire.libelle})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}