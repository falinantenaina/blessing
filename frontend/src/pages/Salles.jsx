import { useEffect, useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Building,
  Users,
  Monitor,
  Wifi,
  Coffee,
  Mic2,
  Video,
  AlertCircle,
  CheckCircle,
  XCircle,
  Home,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  X,
  Download,
  RefreshCw,
  MoreVertical,
  MapPin,
  Grid,
  List,
  Settings,
  Info,
  ClipboardList,
} from "lucide-react";
import { referenceService } from "@/services/api";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Loading from "@/components/ui/Loading";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { formatShortDate } from "@/utils/helpers";
import toast from "react-hot-toast";

// Icônes d'équipements
const EQUIPEMENT_ICONS = {
  Projecteur: Video,
  Climatisation: Wifi,
  Clim: Wifi,
  WiFi: Wifi,
  Micro: Mic2,
  Sonorisation: Mic2,
  Tableau: Monitor,
  Écran: Monitor,
  Café: Coffee,
  Défaut: Home,
};

// Composant de carte salle pour mobile
const SalleCard = ({ salle, onEdit, onDelete, onViewDetails }) => {
  const getEquipementIcon = (equipement) => {
    const Icon = EQUIPEMENT_ICONS[equipement] || Home;
    return <Icon className="w-3 h-3" />;
  };

  const equipementsList =
    salle.equipements?.split(",").map((e) => e.trim()) || [];

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              salle.actif
                ? "bg-linear-to-br from-primary-100 to-primary-50"
                : "bg-gray-100"
            }`}
          >
            <Building
              className={`w-5 h-5 ${salle.actif ? "text-primary-600" : "text-gray-500"}`}
            />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              {salle.nom}
              {!salle.actif && (
                <Badge variant="danger" size="sm">
                  Inactif
                </Badge>
              )}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {salle.ecole_nom || "École non assignée"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(salle)}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Modifier"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(salle.id)}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4 text-gray-400" />
            <span>Capacité</span>
          </div>
          <span className="font-medium text-gray-900">
            {salle.capacite} personnes
          </span>
        </div>

        {equipementsList.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Monitor className="w-4 h-4 text-gray-400" />
              <span>Équipements</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {equipementsList.slice(0, 3).map((eq, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-700"
                >
                  {getEquipementIcon(eq)}
                  {eq}
                </span>
              ))}
              {equipementsList.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-700">
                  +{equipementsList.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatShortDate(salle.created_at)}
          </span>
          <Badge variant={salle.actif ? "success" : "danger"} size="sm">
            {salle.actif ? "Actif" : "Inactif"}
          </Badge>
        </div>
      </div>
    </div>
  );
};
export default function Salles() {
  const [salles, setSalles] = useState([]);
  const [ecoles, setEcoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("table"); // 'table' ou 'grid'
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // États modaux
  const [showModal, setShowModal] = useState(false);
  const [selectedSalle, setSelectedSalle] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [salleDetails, setSalleDetails] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Filtres
  const [filters, setFilters] = useState({
    ecole_id: "",
    actif: "",
    capacite_min: "",
    capacite_max: "",
  });

  // Formulaire
  const [formData, setFormData] = useState({
    nom: "",
    ecole_id: "",
    capacite: 20,
    equipements: "",
    actif: true,
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Filtrer les salles côté client
    let filtered = salles;

    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.ecole_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.equipements?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (filters.ecole_id) {
      filtered = filtered.filter(
        (s) => s.ecole_id?.toString() === filters.ecole_id,
      );
    }

    if (filters.actif !== "") {
      filtered = filtered.filter((s) => s.actif === (filters.actif === "true"));
    }

    if (filters.capacite_min) {
      filtered = filtered.filter(
        (s) => s.capacite >= parseInt(filters.capacite_min),
      );
    }

    if (filters.capacite_max) {
      filtered = filtered.filter(
        (s) => s.capacite <= parseInt(filters.capacite_max),
      );
    }

    // Mettre à jour la pagination
    setPagination((prev) => ({
      ...prev,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / prev.limit),
    }));
  }, [searchTerm, filters, salles]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sallesRes, ecolesRes] = await Promise.all([
        referenceService.getSalles(),
        referenceService.getEcoles(),
      ]);

      setSalles(sallesRes.data || []);
      setEcoles(ecolesRes.data || []);
    } catch (error) {
      console.error("Erreur chargement salles:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.nom.trim()) {
      errors.nom = "Le nom de la salle est requis";
    }

    if (!formData.capacite || formData.capacite < 1) {
      errors.capacite = "La capacité doit être d'au moins 1 personne";
    }

    if (formData.capacite > 1000) {
      errors.capacite = "La capacité ne peut pas dépasser 1000 personnes";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenModal = (salle = null) => {
    if (salle) {
      setSelectedSalle(salle);
      setFormData({
        nom: salle.nom || "",
        ecole_id: salle.ecole_id?.toString() || "",
        capacite: salle.capacite || 20,
        equipements: salle.equipements || "",
        actif: salle.actif ?? true,
      });
    } else {
      setSelectedSalle(null);
      setFormData({
        nom: "",
        ecole_id: ecoles[0]?.id?.toString() || "",
        capacite: 20,
        equipements: "",
        actif: true,
      });
    }
    setFormErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs du formulaire");
      return;
    }

    setLoading(true);

    try {
      if (selectedSalle) {
        await referenceService.updateSalle(selectedSalle.id, formData);
        toast.success("Salle modifiée avec succès");
      } else {
        await referenceService.createSalle(formData);
        toast.success("Salle créée avec succès");
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error("Erreur sauvegarde salle:", error);
      toast.error(
        error.response?.data?.message || "Erreur lors de l'enregistrement",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await referenceService.deleteSalle(id);
      toast.success("Salle supprimée avec succès");
      loadData();
      setShowConfirmDelete(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Erreur suppression salle:", error);
      toast.error(
        error.response?.data?.message || "Erreur lors de la suppression",
      );
    } finally {
      setLoading(false);
    }
  };

  const openConfirmDelete = (id) => {
    setDeleteId(id);
    setShowConfirmDelete(true);
  };

  const handleViewDetails = async (salle) => {
    setSalleDetails(salle);
    setShowDetailsModal(true);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setFilters({
      ecole_id: "",
      actif: "",
      capacite_min: "",
      capacite_max: "",
    });
  };

  // Calcul des statistiques
  const stats = {
    total: salles.length,
    actives: salles.filter((s) => s.actif).length,
    capacite_totale: salles.reduce((acc, s) => acc + (s.capacite || 0), 0),
    ecoles: new Set(salles.map((s) => s.ecole_id)).size,
  };

  // Pagination
  const paginatedSalles = salles
    .filter((s) => {
      if (searchTerm) {
        return (
          s.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.ecole_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.equipements?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return true;
    })
    .filter((s) => {
      if (filters.ecole_id) return s.ecole_id?.toString() === filters.ecole_id;
      return true;
    })
    .filter((s) => {
      if (filters.actif !== "") return s.actif === (filters.actif === "true");
      return true;
    })
    .filter((s) => {
      if (filters.capacite_min)
        return s.capacite >= parseInt(filters.capacite_min);
      return true;
    })
    .filter((s) => {
      if (filters.capacite_max)
        return s.capacite <= parseInt(filters.capacite_max);
      return true;
    })
    .slice(
      (pagination.page - 1) * pagination.limit,
      pagination.page * pagination.limit,
    );

  if (loading && salles.length === 0) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <Loading fullScreen message="Chargement des salles..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
      <div className="max-w-screen mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
        {/* HEADER */}
        <div className="relative">
          <div className="absolute inset-0 bg-linear-to-r from-primary-600/10 via-primary-400/5 to-transparent rounded-2xl sm:rounded-3xl blur-xl" />

          <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl border border-gray-100/80 shadow-sm">
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">

              <div className="min-w-0 flex-1 sm:flex-initial">
                <div className="flex items-center flex-wrap gap-2">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent truncate">
                    Gestion des salles
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 flex items-center gap-1 sm:gap-2">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate">
                    Gérez les salles de cours et leurs équipements
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                onClick={() => handleOpenModal()}
                variant="primary"
                className="w-full sm:w-auto shadow-lg shadow-primary-500/20 hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 mr-1.5 sm:mr-2 shrink-0" />
                <span className="truncate">Nouvelle salle</span>
              </Button>
            </div>
          </div>
        </div>

        {/* BARRE DE RECHERCHE ET FILTRES */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-100/80 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Recherche */}
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Rechercher une salle (nom, école, équipements...)"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-lg sm:rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Vue et filtres */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`border-gray-200 ${showFilters ? "bg-primary-50 border-primary-200" : ""}`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">Filtres</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={loadData}
                  className="border-gray-200"
                  title="Rafraîchir"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Panneau de filtres */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      École
                    </label>
                    <Select
                      value={filters.ecole_id}
                      onChange={(e) =>
                        setFilters({ ...filters, ecole_id: e.target.value })
                      }
                      options={[
                        { value: "", label: "Toutes les écoles" },
                        ...ecoles.map((e) => ({
                          value: e.id.toString(),
                          label: e.nom,
                        })),
                      ]}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Capacité min.
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={filters.capacite_min}
                      onChange={(e) =>
                        setFilters({ ...filters, capacite_min: e.target.value })
                      }
                      placeholder="0"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Capacité max.
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={filters.capacite_max}
                      onChange={(e) =>
                        setFilters({ ...filters, capacite_max: e.target.value })
                      }
                      placeholder="1000"
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Réinitialiser
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CONTENU PRINCIPAL */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-100/80 shadow-sm overflow-hidden">
          {/* En-tête de la liste */}
          <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  {viewMode === "table"
                    ? "Liste des salles"
                    : "Salles disponibles"}
                </h2>
              </div>
              <span className="text-xs text-gray-500 bg-white px-3 py-1.5 rounded-full border border-gray-200">
                {pagination.total} résultat{pagination.total > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Vue Tableau (Desktop) */}
          {viewMode === "table" ? (
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableHead>Salle</TableHead>
                  <TableHead>École</TableHead>
                  <TableHead>Capacité</TableHead>
                  <TableHead>Équipements</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableHeader>
                <TableBody>
                  {paginatedSalles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center">
                          <div className="p-3 bg-gray-100 rounded-full mb-3">
                            <Building className="w-6 h-6 text-gray-400" />
                          </div>
                          <p className="text-gray-600 font-medium">
                            Aucune salle trouvée
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {searchTerm || Object.values(filters).some(Boolean)
                              ? "Essayez de modifier vos filtres"
                              : "Commencez par créer une salle"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedSalles.map((salle) => (
                      <TableRow
                        key={salle.id}
                        className="hover:bg-gray-50/80 transition-colors group"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                salle.actif
                                  ? "bg-linear-to-br from-primary-100 to-primary-50"
                                  : "bg-gray-100"
                              }`}
                            >
                              <Building
                                className={`w-5 h-5 ${salle.actif ? "text-primary-600" : "text-gray-500"}`}
                              />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {salle.nom}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                ID: #{salle.id}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-700">
                            {salle.ecole_nom || "-"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {salle.capacite}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-50">
                            {salle.equipements ? (
                              salle.equipements.split(",").map((eq, idx) => {
                                const Icon =
                                  EQUIPEMENT_ICONS[eq.trim()] || Home;
                                return (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-700"
                                    title={eq.trim()}
                                  >
                                    <Icon className="w-3 h-3" />
                                    <span className="hidden lg:inline">
                                      {eq.trim()}
                                    </span>
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={salle.actif ? "success" : "danger"}
                            className="px-3 py-1.5"
                          >
                            {salle.actif ? "Actif" : "Inactif"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {formatShortDate(salle.created_at)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleViewDetails(salle)}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Voir détails"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenModal(salle)}
                              className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openConfirmDelete(salle.id)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            /* Vue Grille (Desktop) */
            <div className="hidden md:block p-6">
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedSalles.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <Building className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">Aucune salle trouvée</p>
                  </div>
                ) : (
                  paginatedSalles.map((salle) => (
                    <SalleCard
                      key={salle.id}
                      salle={salle}
                      onEdit={handleOpenModal}
                      onDelete={openConfirmDelete}
                      onViewDetails={handleViewDetails}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Vue Mobile (Toujours en cartes) */}
          <div className="md:hidden">
            <div className="p-4 space-y-4">
              {paginatedSalles.length === 0 ? (
                <div className="text-center py-12">
                  <Building className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Aucune salle trouvée</p>
                </div>
              ) : (
                paginatedSalles.map((salle) => (
                  <SalleCard
                    key={salle.id}
                    salle={salle}
                    onEdit={handleOpenModal}
                    onDelete={openConfirmDelete}
                    onViewDetails={handleViewDetails}
                  />
                ))
              )}
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50/50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
                  Affichage <span className="font-medium">1</span> –{" "}
                  <span className="font-medium">
                    {Math.min(pagination.limit, pagination.total)}
                  </span>{" "}
                  sur <span className="font-medium">{pagination.total}</span>{" "}
                  salle(s)
                </p>

                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page - 1,
                      }))
                    }
                    disabled={pagination.page === 1}
                    className="border-gray-200"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  <div className="flex items-center gap-1 px-2">
                    {Array.from(
                      { length: Math.min(5, pagination.totalPages) },
                      (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (
                          pagination.page >=
                          pagination.totalPages - 2
                        ) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }
                        return (
                          <button
                            key={i}
                            onClick={() =>
                              setPagination((prev) => ({
                                ...prev,
                                page: pageNum,
                              }))
                            }
                            className={`min-w-8 h-8 px-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                              pagination.page === pageNum
                                ? "bg-primary-500 text-white shadow-md shadow-primary-500/20"
                                : "text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      },
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page + 1,
                      }))
                    }
                    disabled={pagination.page === pagination.totalPages}
                    className="border-gray-200"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL AJOUT/MODIFICATION */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-linear-to-br from-primary-500 to-primary-600 rounded-lg shadow-lg shadow-primary-500/20">
              {selectedSalle ? (
                <Edit className="w-5 h-5 text-white" />
              ) : (
                <Building className="w-5 h-5 text-white" />
              )}
            </div>
            <span className="text-xl font-bold text-gray-900">
              {selectedSalle ? "Modifier la salle" : "Nouvelle salle"}
            </span>
          </div>
        }
        size="lg"
        className="backdrop-blur-sm"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations générales */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <div className="p-1.5 bg-primary-50 rounded-lg">
                <Info className="w-4 h-4 text-primary-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">
                Informations générales
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Nom de la salle <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.nom}
                  onChange={(e) =>
                    setFormData({ ...formData, nom: e.target.value })
                  }
                  placeholder="Ex: Salle A101"
                  error={formErrors.nom}
                  className="rounded-xl border-gray-200 focus:ring-2 focus:ring-primary-500/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  École
                </label>
                <Select
                  value={formData.ecole_id}
                  onChange={(e) =>
                    setFormData({ ...formData, ecole_id: e.target.value })
                  }
                  options={ecoles.map((e) => ({
                    value: e.id.toString(),
                    label: e.nom,
                  }))}
                  placeholder="Sélectionner une école"
                  className="rounded-xl border-gray-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Capacité <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="number"
                    min="1"
                    max="1000"
                    value={formData.capacite}
                    onChange={(e) =>
                      setFormData({ ...formData, capacite: e.target.value })
                    }
                    className="pl-10 rounded-xl border-gray-200"
                    error={formErrors.capacite}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Statut
                </label>
                <Select
                  value={formData.actif ? "true" : "false"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      actif: e.target.value === "true",
                    })
                  }
                  options={[
                    { value: "true", label: "Actif" },
                    { value: "false", label: "Inactif" },
                  ]}
                  className="rounded-xl border-gray-200"
                />
              </div>
            </div>
          </div>

          {/* Équipements */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <div className="p-1.5 bg-purple-50 rounded-lg">
                <Settings className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">
                Équipements
              </h3>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Liste des équipements
              </label>
              <textarea
                value={formData.equipements}
                onChange={(e) =>
                  setFormData({ ...formData, equipements: e.target.value })
                }
                placeholder="Séparez les équipements par des virgules. Ex: Projecteur, Climatisation, WiFi"
                rows={3}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
              />
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Suggestion: Projecteur, Climatisation, WiFi, Micro, Tableau
                blanc
              </p>
            </div>

            {/* Prévisualisation des équipements */}
            {formData.equipements && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs font-medium text-gray-600 mb-2">
                  Aperçu des équipements :
                </p>
                <div className="flex flex-wrap gap-2">
                  {formData.equipements.split(",").map((eq, idx) => {
                    const Icon = EQUIPEMENT_ICONS[eq.trim()] || Home;
                    return (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-xs text-gray-700"
                      >
                        <Icon className="w-3 h-3" />
                        {eq.trim()}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
              className="w-full sm:w-auto px-6 rounded-xl border-gray-200 hover:bg-gray-50"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full sm:w-auto px-8 rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-xl"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  {selectedSalle ? (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Créer
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL DÉTAILS */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-linear-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
              <Info className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Détails de la salle
            </span>
          </div>
        }
        size="lg"
        className="backdrop-blur-sm"
      >
        {salleDetails && (
          <div className="space-y-6">
            {/* En-tête */}
            <div className="bg-linear-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                    salleDetails.actif
                      ? "bg-linear-to-br from-primary-500 to-primary-600"
                      : "bg-gray-400"
                  }`}
                >
                  <Building className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    {salleDetails.nom}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant={salleDetails.actif ? "success" : "danger"}>
                      {salleDetails.actif ? "Actif" : "Inactif"}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      #{salleDetails.id}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Grille d'informations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    École
                  </p>
                  <p className="text-lg font-medium text-gray-900">
                    {salleDetails.ecole_nom || "Non assignée"}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Capacité
                  </p>
                  <p className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-500" />
                    {salleDetails.capacite} personnes
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Date de création
                  </p>
                  <p className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    {formatShortDate(salleDetails.created_at)}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Dernière modification
                  </p>
                  <p className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    {formatShortDate(salleDetails.updated_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Équipements */}
            {salleDetails.equipements && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Équipements
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex flex-wrap gap-2">
                    {salleDetails.equipements.split(",").map((eq, idx) => {
                      const Icon = EQUIPEMENT_ICONS[eq.trim()] || Home;
                      return (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 text-sm text-gray-700"
                        >
                          <Icon className="w-4 h-4 text-gray-600" />
                          {eq.trim()}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setShowDetailsModal(false)}
                className="w-full sm:w-auto"
              >
                Fermer
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setShowDetailsModal(false);
                  handleOpenModal(salleDetails);
                }}
                className="w-full sm:w-auto"
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL CONFIRMATION SUPPRESSION */}
      <Modal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-linear-to-br from-red-500 to-red-600 rounded-lg shadow-lg shadow-red-500/20">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Confirmer la suppression
            </span>
          </div>
        }
        size="sm"
        className="backdrop-blur-sm"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="p-3 bg-red-50 rounded-full inline-flex mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-gray-700 mb-2">
              Êtes-vous sûr de vouloir supprimer cette salle ?
            </p>
            <p className="text-sm text-gray-500">
              Cette action est irréversible.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDelete(false)}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={() => handleDelete(deleteId)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
