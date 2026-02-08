import { useEffect, useState } from "react";
import { Plus, Eye, Trash2, Calendar, Edit, AlertCircle } from "lucide-react";
import {
  vagueService,
  niveauService,
  referenceService,
  userService,
} from "@/services/api";
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
import { getStatusLabel, getStatusColor } from "@/utils/helpers";
import toast from "react-hot-toast";

export default function Vagues() {
  const [vagues, setVagues] = useState([]);
  const [niveaux, setNiveaux] = useState([]);
  const [salles, setSalles] = useState([]);
  const [enseignants, setEnseignants] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedVague, setSelectedVague] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [vagueDetails, setVagueDetails] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [vagueToDelete, setVagueToDelete] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    statut: "",
    niveau_id: "",
    enseignant_id: "",
    search: "",
  });

  const [formData, setFormData] = useState({
    nom: "",
    niveau_id: "",
    enseignant_id: "",
    salle_id: "",
    date_debut: "",
    date_fin: "",
    capacite_max: "",
    statut: "planifie",
    horaires: [],
  });

  const [newCrenau, setNewCrenau] = useState({
    heure_debut: "",
    heure_fin: "",
  });

  useEffect(() => {
    loadData();
  }, [currentPage, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vaguesRes, niveauxRes, sallesRes, enseignantsRes] =
        await Promise.all([
          vagueService.getAll({ page: currentPage, limit: 10, ...filters }),
          niveauService.getAll(),
          referenceService.getSalles(),
          userService.getProfesseurs(),
        ]);

      setVagues(vaguesRes.data.vagues || vaguesRes.data || []);
      setNiveaux(niveauxRes.data.niveaux || niveauxRes.data || []);
      setSalles(sallesRes.data.salles || sallesRes.data || []);
      setEnseignants(enseignantsRes.data.users || enseignantsRes.data || []);

      if (vaguesRes.data.total && vaguesRes.data.limit) {
        setTotalPages(Math.ceil(vaguesRes.data.total / vaguesRes.data.limit));
      }
    } catch (error) {
      console.error("Erreur chargement:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (vague = null) => {
    if (vague) {
      setSelectedVague(vague);
      setFormData({
        nom: vague.nom || "",
        niveau_id: vague.niveau_id || "",
        enseignant_id: vague.enseignant_id || "",
        salle_id: vague.salle_id || "",
        date_debut: vague.date_debut ? vague.date_debut.split("T")[0] : "",
        date_fin: vague.date_fin ? vague.date_fin.split("T")[0] : "",
        capacite_max: vague.capacite_max || "",
        statut: vague.statut || "planifie",
        horaires: vague.horaires || [],
      });
    } else {
      setSelectedVague(null);
      setFormData({
        nom: "",
        niveau_id: "",
        enseignant_id: "",
        salle_id: "",
        date_debut: "",
        date_fin: "",
        capacite_max: "",
        statut: "planifie",
        horaires: [],
      });
    }
    setNewCrenau({ heure_debut: "", heure_fin: "" });
    setShowModal(true);
  };

  const addCrenau = () => {
    if (!newCrenau.heure_debut || !newCrenau.heure_fin) {
      toast.error("Veuillez saisir l'heure de début et de fin");
      return;
    }
    if (newCrenau.heure_debut >= newCrenau.heure_fin) {
      toast.error("L'heure de fin doit être après l'heure de début");
      return;
    }
    setFormData({
      ...formData,
      horaires: [...formData.horaires, { ...newCrenau }],
    });
    setNewCrenau({ heure_debut: "", heure_fin: "" });
    toast.success("Créneau ajouté");
  };

  const removeCrenau = (index) => {
    setFormData({
      ...formData,
      horaires: formData.horaires.filter((_, i) => i !== index),
    });
    toast.success("Créneau supprimé");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.horaires.length === 0) {
      toast.error("Veuillez ajouter au moins un créneau horaire");
      return;
    }
    if (formData.date_debut && formData.date_fin) {
      if (new Date(formData.date_debut) >= new Date(formData.date_fin)) {
        toast.error("La date de fin doit être après la date de début");
        return;
      }
    }

    const dataToSubmit = {
      nom: formData.nom,
      niveau_id: parseInt(formData.niveau_id),
      enseignant_id: formData.enseignant_id
        ? parseInt(formData.enseignant_id)
        : null,
      salle_id: formData.salle_id ? parseInt(formData.salle_id) : null,
      date_debut: formData.date_debut,
      date_fin: formData.date_fin,
      capacite_max: parseInt(formData.capacite_max) || 0,
      statut: formData.statut,
      horaires: formData.horaires.map((h) => ({
        heure_debut: h.heure_debut,
        heure_fin: h.heure_fin,
      })),
    };

    try {
      setLoading(true);
      if (selectedVague) {
        await vagueService.update(selectedVague.id, dataToSubmit);
        toast.success("Vague mise à jour avec succès");
      } else {
        await vagueService.create(dataToSubmit);
        toast.success("Vague créée avec succès");
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error("Erreur serveur:", error.response?.data);
      toast.error(
        error.response?.data?.message || "Erreur lors de l'enregistrement",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (vague) => {
    try {
      const response = await vagueService.getById(vague.id);
      setVagueDetails(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error("Impossible de charger les détails");
    }
  };

  const handleDeleteClick = (vague) => {
    setVagueToDelete(vague);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!vagueToDelete) return;
    try {
      setLoading(true);
      await vagueService.delete(vagueToDelete.id);
      toast.success("Vague supprimée avec succès");
      setShowDeleteModal(false);
      setVagueToDelete(null);
      loadData();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Impossible de supprimer cette vague",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ statut: "", niveau_id: "", enseignant_id: "", search: "" });
    setCurrentPage(1);
  };

  if (loading && vagues.length === 0) return <Loading fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50/70 px-5 py-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[#0a3d5c] tracking-tight">
          Vagues
        </h1>
        <Button
          onClick={() => handleOpenModal()}
          className="bg-[#0a3d5c] hover:bg-[#0a3d5c] text-white shadow-md shadow-[#1e90ff]/20"
        >
          <Plus className="w-5 h-5 mr-2" /> Nouvelle vague
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200/80 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <Input
            placeholder="Rechercher par nom..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="border-gray-300 focus:border-[#1e90ff] focus:ring-[#1e90ff]/30"
          />
          <Select
            value={filters.statut}
            onChange={(e) => handleFilterChange("statut", e.target.value)}
            options={[
              { value: "", label: "Tous les statuts" },
              { value: "planifie", label: "Planifié" },
              { value: "en_cours", label: "En cours" },
              { value: "termine", label: "Terminé" },
              { value: "annule", label: "Annulé" },
            ]}
          />
          <Select
            value={filters.niveau_id}
            onChange={(e) => handleFilterChange("niveau_id", e.target.value)}
            options={[
              { value: "", label: "Tous les niveaux" },
              ...niveaux.map((n) => ({ value: n.id, label: n.code })),
            ]}
          />
          <Select
            value={filters.enseignant_id}
            onChange={(e) =>
              handleFilterChange("enseignant_id", e.target.value)
            }
            options={[
              { value: "", label: "Tous les enseignants" },
              ...enseignants.map((e) => ({
                value: e.id,
                label: `${e.prenom} ${e.nom}`,
              })),
            ]}
          />
        </div>

        {(filters.search ||
          filters.statut ||
          filters.niveau_id ||
          filters.enseignant_id) && (
          <div className="mt-5">
            <Button
              variant="ghost"
              onClick={clearFilters}
              size="sm"
              className="text-[#0a3d5c] hover:text-[#0a3d5c] hover:bg-[#1e90ff]/10"
            >
              Réinitialiser les filtres
            </Button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200/80 overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/80">
            <TableHead className="text-[#0a3d5c] font-semibold">Nom</TableHead>
            <TableHead className="text-[#0a3d5c] font-semibold">
              Niveau
            </TableHead>
            <TableHead className="text-[#0a3d5c] font-semibold">
              Enseignant
            </TableHead>
            <TableHead className="text-[#0a3d5c] font-semibold">
              Salle
            </TableHead>
            <TableHead className="text-[#0a3d5c] font-semibold">
              Période
            </TableHead>
            <TableHead className="text-[#0a3d5c] font-semibold">
              Horaires
            </TableHead>
            <TableHead className="text-[#0a3d5c] font-semibold">
              Statut
            </TableHead>
            <TableHead className="text-[#0a3d5c] font-semibold">
              Inscrits
            </TableHead>
            <TableHead className="text-right text-[#0a3d5c] font-semibold">
              Actions
            </TableHead>
          </TableHeader>
          <TableBody>
            {vagues.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-16">
                  <div className="flex flex-col items-center gap-4">
                    <AlertCircle className="w-14 h-14 text-gray-400" />
                    <p className="text-gray-600 text-lg font-medium">
                      Aucune vague trouvée
                    </p>
                    <Button
                      onClick={() => handleOpenModal()}
                      className="border-[#1e90ff] text-[#1e90ff] hover:bg-[#1e90ff]/10"
                    >
                      Créer une vague
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              vagues.map((vague) => (
                <TableRow
                  key={vague.id}
                  className="hover:bg-gray-50/60 transition-colors"
                >
                  <TableCell className="font-medium text-gray-900">
                    {vague.nom}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-[#00b894]/10 text-[#00b894] border-[#00b894]/30">
                      {vague.niveau_code}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {vague.enseignant_nom
                      ? `${vague.enseignant_prenom} ${vague.enseignant_nom}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {vague.salle_nom || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {vague.date_debut
                      ? new Date(vague.date_debut).toLocaleDateString("fr-FR")
                      : "—"}
                    {" → "}
                    {vague.date_fin
                      ? new Date(vague.date_fin).toLocaleDateString("fr-FR")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full">
                      {vague.horaires?.length || 0} créneau(x)
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(vague.statut)}>
                      {getStatusLabel(vague.statut)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        vague.nb_inscrits >= vague.capacite_max
                          ? "text-red-700 font-semibold"
                          : "text-gray-800 font-medium"
                      }
                    >
                      {vague.nb_inscrits || 0} / {vague.capacite_max}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleViewDetails(vague)}
                        className="p-2 text-[#1e90ff] hover:bg-[#1e90ff]/10 rounded-lg transition-colors"
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenModal(vague)}
                        className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(vague)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                        disabled={vague.nb_inscrits > 0}
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50/60">
            <div className="text-sm text-gray-600">
              Page {currentPage} sur {totalPages}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                size="sm"
                className="border-gray-300 hover:border-[#1e90ff] hover:text-[#1e90ff]"
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                size="sm"
                className="border-gray-300 hover:border-[#1e90ff] hover:text-[#1e90ff]"
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedVague ? "Modifier la vague" : "Nouvelle vague"}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Nom de la vague"
            placeholder="Ex: Groupe A - Mathématiques"
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            required
            className="border-gray-300 focus:border-[#1e90ff] focus:ring-[#1e90ff]/30"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              label="Niveau"
              value={formData.niveau_id}
              onChange={(e) =>
                setFormData({ ...formData, niveau_id: e.target.value })
              }
              options={niveaux.map((n) => ({
                value: n.id,
                label: `${n.code} - ${n.nom}`,
              }))}
              required
            />
            <Select
              label="Enseignant"
              value={formData.enseignant_id}
              onChange={(e) =>
                setFormData({ ...formData, enseignant_id: e.target.value })
              }
              options={enseignants.map((e) => ({
                value: e.id,
                label: `${e.prenom} ${e.nom}`,
              }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Date début"
              type="date"
              value={formData.date_debut}
              onChange={(e) =>
                setFormData({ ...formData, date_debut: e.target.value })
              }
              required
            />
            <Input
              label="Date fin"
              type="date"
              value={formData.date_fin}
              onChange={(e) =>
                setFormData({ ...formData, date_fin: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Select
              label="Salle"
              value={formData.salle_id}
              onChange={(e) =>
                setFormData({ ...formData, salle_id: e.target.value })
              }
              options={salles.map((s) => ({ value: s.id, label: s.nom }))}
            />
            <Input
              label="Capacité Max"
              type="number"
              placeholder="Ex: 25"
              value={formData.capacite_max}
              onChange={(e) =>
                setFormData({ ...formData, capacite_max: e.target.value })
              }
              required
            />
            <Select
              label="Statut"
              value={formData.statut}
              onChange={(e) =>
                setFormData({ ...formData, statut: e.target.value })
              }
              options={[
                { value: "planifie", label: "Planifié" },
                { value: "en_cours", label: "En cours" },
                { value: "termine", label: "Terminé" },
                { value: "annule", label: "Annulé" },
              ]}
            />
          </div>

          <div className="bg-gray-50/60 p-6 rounded-xl border border-gray-200/80">
            <h3 className="text-base font-semibold text-[#0a3d5c] mb-5 tracking-wide">
              Créneaux horaires
            </h3>

            <div className="flex flex-col sm:flex-row gap-4 items-end mb-6">
              <div className="flex-1 w-full sm:w-auto">
                <Input
                  label="Heure début"
                  type="time"
                  value={newCrenau.heure_debut}
                  onChange={(e) =>
                    setNewCrenau({ ...newCrenau, heure_debut: e.target.value })
                  }
                />
              </div>
              <div className="flex-1 w-full sm:w-auto">
                <Input
                  label="Heure fin"
                  type="time"
                  value={newCrenau.heure_fin}
                  onChange={(e) =>
                    setNewCrenau({ ...newCrenau, heure_fin: e.target.value })
                  }
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={addCrenau}
                className="border-[#00b894] text-[#00b894] hover:bg-[#00b894]/10 whitespace-nowrap"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </Button>
            </div>

            <div className="space-y-3">
              {formData.horaires.map((h, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:border-[#00b894]/40 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#00b894]"></div>
                    <span className="font-medium text-gray-800">
                      {h.heure_debut} — {h.heure_fin}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCrenau(idx)}
                    className="text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}

              {formData.horaires.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-xl bg-white/40">
                  <Calendar className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600 font-medium">
                    Aucun créneau horaire défini
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    Ajoutez au moins un créneau pour valider la vague
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#1e90ff] hover:bg-[#0c7ae6] text-white shadow-md shadow-[#1e90ff]/20"
            >
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Détails de la vague"
        size="lg"
      >
        {vagueDetails && (
          <div className="space-y-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">
                  Nom
                </p>
                <p className="mt-1 text-lg font-semibold text-[#0a3d5c]">
                  {vagueDetails.nom}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">
                  Niveau
                </p>
                <p className="mt-1 text-lg font-semibold text-[#00b894]">
                  {vagueDetails.niveau_code}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">
                  Enseignant
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {vagueDetails.enseignant_nom
                    ? `${vagueDetails.enseignant_prenom} ${vagueDetails.enseignant_nom}`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">
                  Salle
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {vagueDetails.salle_nom || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">
                  Statut
                </p>
                <div className="mt-1">
                  <Badge className={getStatusColor(vagueDetails.statut)}>
                    {getStatusLabel(vagueDetails.statut)}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">
                  Remplissage
                </p>
                <p className="mt-1 font-semibold text-gray-900">
                  {vagueDetails.nb_inscrits || 0} / {vagueDetails.capacite_max}{" "}
                  élèves
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">
                  Période
                </p>
                <p className="mt-1 text-sm text-gray-700">
                  Du{" "}
                  {vagueDetails.date_debut
                    ? new Date(vagueDetails.date_debut).toLocaleDateString(
                        "fr-FR",
                      )
                    : "—"}
                  <br />
                  Au{" "}
                  {vagueDetails.date_fin
                    ? new Date(vagueDetails.date_fin).toLocaleDateString(
                        "fr-FR",
                      )
                    : "—"}
                </p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h4 className="font-semibold text-[#0a3d5c] mb-4">Horaires</h4>
              {vagueDetails.horaires?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {vagueDetails.horaires.map((h, i) => (
                    <div
                      key={i}
                      className="bg-[#00b894]/10 text-[#006d5a] p-4 rounded-lg font-medium border border-[#00b894]/30 flex items-center justify-center gap-3 shadow-sm"
                    >
                      <Calendar size={18} />
                      {h.heure_debut} → {h.heure_fin}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-6 italic">
                  Aucun horaire défini
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmer la suppression"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <p className="text-sm text-red-800">
              Êtes-vous sûr de vouloir supprimer la vague "{vagueToDelete?.nom}"
              ?
            </p>
          </div>
          <p className="text-sm text-gray-600">
            Cette action est irréversible.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowDeleteModal(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={confirmDelete}
              disabled={loading}
            >
              {loading ? "Suppression..." : "Supprimer"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
