import { useEffect, useState, useCallback } from "react";
import { Plus, Eye, Trash2, Edit, AlertCircle, Search } from "lucide-react";
import {
  vagueService,
  niveauService,
  salleService,
  userService,
  jourService,
  horaireService,
} from "@/services/api";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Loading from "@/components/ui/Loading";
import Input from "@/components/ui/Input";
import {
  getStatusLabel,
  getStatusColor,
  formatShortDate,
} from "@/utils/helpers";
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

  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
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

  // Chargement des données
  const fetchData = useCallback(async () => {
    setTableLoading(true);
    try {
      const params = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      };

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

      // Gestion de la réponse paginée
      if (vaguesRes.data) {
        if (vaguesRes.data.vagues) {
          // Réponse paginée
          setVagues(vaguesRes.data.vagues || []);
          setPagination((prev) => ({
            ...prev,
            total: vaguesRes.data.pagination?.totalItems || 0,
            totalPages: vaguesRes.data.pagination?.totalPages || 0,
          }));
        } else if (vaguesRes.data.liste) {
          // Réponse simple avec liste
          setVagues(vaguesRes.data.liste || []);
        } else if (Array.isArray(vaguesRes.data)) {
          // Réponse directe en tableau
          setVagues(vaguesRes.data);
        }
      }

      setNiveaux(niveauxRes.data || []);
      setSalles(sallesRes.data || []);

      // Extraction des utilisateurs selon la structure de réponse
      const usersData = enseignantsRes.data?.users || enseignantsRes.data || [];
      setEnseignants(usersData);

      setJours(joursRes.data || []);
      setHoraires(horairesRes.data || []);
    } catch (error) {
      console.error("Erreur chargement données:", error);
      toast.error("Erreur lors de la récupération des données");
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

  // Ouverture du formulaire
  const openForm = (vague = null) => {
    if (vague) {
      setIsEditing(true);
      setSelectedVague(vague);
      setFormData({
        nom: vague.nom,
        niveau_id: vague.niveau_id?.toString() || "",
        enseignant_id: vague.enseignant_id?.toString() || "",
        salle_id: vague.salle_id?.toString() || "",
        date_debut: vague.date_debut,
        date_fin: vague.date_fin,
        statut: vague.statut || "planifie",
      });

      // Charger les horaires de la vague
      if (
        vague.horaires &&
        Array.isArray(vague.horaires) &&
        vague.horaires.length > 0
      ) {
        setSelectedSlots(
          vague.horaires.map((h) => ({
            jour_id: h.jour_id.toString(),
            horaire_id: h.horaire_id.toString(),
          })),
        );
      } else {
        setSelectedSlots([{ jour_id: "", horaire_id: "" }]);
      }
    } else {
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
    }

    setFormErrors({});
    setShowForm(true);
  };

  // Fermeture du formulaire
  const closeForm = () => {
    setShowForm(false);
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
    try {
      const response = await vagueService.getById(vague.id);
      setSelectedVague(response.data);
      setShowDetails(true);
    } catch (error) {
      console.error("Erreur chargement détails:", error);
      toast.error("Erreur lors du chargement des détails");
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
        <Button onClick={() => openForm()} variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Vague
        </Button>
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Rechercher une vague..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            icon={<Search className="w-4 h-4" />}
          />

          <Select
            placeholder="Statut"
            value={filters.statut}
            onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
            options={STATUS_OPTIONS}
          />

          <Select
            placeholder="Niveau"
            value={filters.niveau_id}
            onChange={(e) =>
              setFilters({ ...filters, niveau_id: e.target.value })
            }
            options={[
              { value: "", label: "Tous les niveaux" },
              ...niveaux.map((n) => ({ value: n.id.toString(), label: n.nom })),
            ]}
          />

          <Select
            placeholder="Enseignant"
            value={filters.enseignant_id}
            onChange={(e) =>
              setFilters({ ...filters, enseignant_id: e.target.value })
            }
            options={[
              { value: "", label: "Tous les enseignants" },
              ...enseignants.map((e) => ({
                value: e.id.toString(),
                label: `${e.prenom} ${e.nom}`,
              })),
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Planning
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
                        colSpan={9}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium">
                          Aucune vague trouvée
                        </p>
                        <p className="text-sm mt-1">
                          Créez votre première vague pour commencer
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
                          <div className="text-sm text-gray-500">
                            {vague.horaires?.length || 0} créneaux
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            {vague.niveau_code || vague.niveau_nom || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {vague.enseignant_prenom}{" "}
                            {vague.enseignant_nom || "Non assigné"}
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {vague.horaires?.map((h, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-[10px]"
                              >
                                {h.jour_nom} : {h.heure_debut?.substring(0, 5)}
                              </Badge>
                            ))}
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
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openForm(vague)}
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-800"
                              onClick={() => handleDelete(vague)}
                              title="Supprimer"
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
                    disabled={pagination.page === 1}
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
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

          {/* Emploi du temps - Mode Liste uniquement */}
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
                      className="p-2 text-red-500 hover:text-red-700 mb-1"
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
                  className="w-full"
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
            <Button type="button" variant="outline" onClick={closeForm}>
              Annuler
            </Button>
            <Button type="submit" variant="primary">
              {isEditing ? "Enregistrer les modifications" : "Créer la vague"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Détails */}
      <Modal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title="Détails de la vague"
        size="lg"
      >
        {selectedVague && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Nom</p>
                <p className="font-medium text-gray-900">{selectedVague.nom}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Niveau</p>
                <p className="font-medium text-gray-900">
                  {selectedVague.niveau_code} - {selectedVague.niveau_nom}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Enseignant</p>
                <p className="font-medium text-gray-900">
                  {selectedVague.enseignant_prenom}{" "}
                  {selectedVague.enseignant_nom || "Non assigné"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Salle</p>
                <p className="font-medium text-gray-900">
                  {selectedVague.salle_nom || "Non assignée"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Période</p>
                <p className="font-medium text-gray-900">
                  {formatShortDate(selectedVague.date_debut)} au{" "}
                  {formatShortDate(selectedVague.date_fin)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Remplissage</p>
                <p className="font-medium text-gray-900">
                  {selectedVague.nb_inscrits || 0} /{" "}
                  {selectedVague.capacite_max || "∞"} inscrits
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Statut</p>
                <Badge variant={getStatusColor(selectedVague.statut)}>
                  {getStatusLabel(selectedVague.statut)}
                </Badge>
              </div>
            </div>

            {selectedVague.horaires && selectedVague.horaires.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Emploi du temps
                </h4>
                <div className="space-y-2">
                  {selectedVague.horaires.map((horaire, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">
                          {horaire.jour_nom}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {horaire.heure_debut} - {horaire.heure_fin}
                      </div>
                      {horaire.libelle && (
                        <div className="text-xs text-gray-500">
                          ({horaire.libelle})
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
