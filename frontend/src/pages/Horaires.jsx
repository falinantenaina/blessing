import { horaireService } from "@/services/api";
import {
  Edit,
  Plus,
  Save,
  Trash2,
  Clock,
  AlertCircle,
  Calendar,
  Sun,
  Sunset,
  Moon,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Loading from "@/components/ui/Loading";
import Modal from "@/components/ui/Modal";

import toast from "react-hot-toast";

/*  Libellés automatiques avec icônes */
const LIBELLES = [
  { value: "Matin", icon: Sun, color: "amber" },
  { value: "Après-midi", icon: Sunset, color: "orange" },
  { value: "Soir", icon: Moon, color: "indigo" },
];

export default function Horaires() {
  const [horaires, setHoraires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedHoraire, setSelectedHoraire] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  /*  Form Data */
  const [formData, setFormData] = useState({
    libelle: "",
    heure_debut: "",
    heure_fin: "",
  });

  const [errors, setErrors] = useState({});

  // =============================
  // LOAD HORAIRES
  // =============================
  useEffect(() => {
    loadHoraires();
  }, []);

  const loadHoraires = async () => {
    setLoading(true);
    try {
      const response = await horaireService.getAll();
      setHoraires(response.data || []);
    } catch (error) {
      toast.error("Impossible de charger les horaires");
    } finally {
      setLoading(false);
    }
  };

  // =============================
  // VALIDATION
  // =============================
  const validateForm = () => {
    const newErrors = {};

    if (!formData.libelle) {
      newErrors.libelle = "Libellé requis";
    }

    if (!formData.heure_debut) {
      newErrors.heure_debut = "Heure début requise";
    }

    if (!formData.heure_fin) {
      newErrors.heure_fin = "Heure fin requise";
    }

    if (
      formData.heure_debut &&
      formData.heure_fin &&
      formData.heure_debut >= formData.heure_fin
    ) {
      newErrors.heure_fin = "L'heure de fin doit être après l'heure de début";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // =============================
  // SUBMIT CREATE / UPDATE
  // =============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs");
      return;
    }

    setFormLoading(true);

    const payload = {
      libelle: formData.libelle,
      heure_debut: formData.heure_debut,
      heure_fin: formData.heure_fin,
    };

    try {
      if (selectedHoraire) {
        await horaireService.update(selectedHoraire.id, payload);
        toast.success("Horaire modifié avec succès ");
      } else {
        await horaireService.create(payload);
        toast.success("Horaire créé avec succès ");
      }

      closeModal();
      loadHoraires();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erreur lors de l'enregistrement",
      );
    } finally {
      setFormLoading(false);
    }
  };

  // =============================
  // DELETE
  // =============================
  const handleDelete = async (horaire) => {
    if (!window.confirm(`Supprimer "${horaire.libelle}" ?`)) return;

    try {
      const response = await horaireService.delete(horaire.id);

      if (response?.success === false) {
        toast.error(response.message || "Suppression refusée");
        return;
      }

      toast.success("Horaire supprimé ");
      loadHoraires();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Impossible de supprimer cet horaire",
      );
    }
  };

  // =============================
  // MODAL OPEN
  // =============================
  const openModal = (horaire = null) => {
    if (horaire) {
      setSelectedHoraire(horaire);
      setFormData({
        libelle: horaire.libelle || "",
        heure_debut: horaire.heure_debut,
        heure_fin: horaire.heure_fin,
      });
    } else {
      resetForm();
    }

    setErrors({});
    setShowModal(true);
  };

  const resetForm = () => {
    setSelectedHoraire(null);
    setFormData({
      libelle: "",
      heure_debut: "",
      heure_fin: "",
    });
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
    setErrors({});
  };

  // =============================
  // HELPER POUR ICÔNE
  // =============================
  const getLibelleIcon = (libelle) => {
    const found = LIBELLES.find((l) => l.value === libelle);
    return found || { icon: Clock, color: "gray" };
  };

  // =============================
  // LOADING
  // =============================
  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <Loading fullScreen message="Chargement des horaires..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
      <div className="max-w-screen mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
        {/* HEADER avec effet de verre */}
        <div className="relative">
          <div className="absolute inset-0 bg-linear-to-r from-primary-600/10 via-primary-400/5 to-transparent rounded-2xl sm:rounded-3xl blur-xl" />
          <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl border border-gray-100/80 shadow-sm">
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="min-w-0 flex-1 sm:flex-initial">
                <div className="flex items-center flex-wrap gap-2">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent truncate">
                    Gestion des horaires
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 flex items-center gap-1 sm:gap-2">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate">
                    Gérez les créneaux horaires des cours
                  </span>
                </p>
              </div>
            </div>
            <Button
              onClick={() => openModal()}
              variant="primary"
              className="w-full sm:w-auto shadow-lg shadow-primary-500/20 hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 mr-1.5 sm:mr-2 shrink-0" />
              <span className="truncate">Nouvel horaire</span>
            </Button>
          </div>
        </div>

        {/* TABLEAU RESPONSIVE */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl border border-gray-100/80 shadow-sm overflow-hidden">
          {/* Vue Desktop - Tableau */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Libellé
                  </th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Horaire
                  </th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {horaires.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center">
                        <div className="p-4 bg-gray-100 rounded-full mb-4">
                          <Clock className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-lg font-medium text-gray-900">
                          Aucun horaire trouvé
                        </p>
                        <p className="text-sm text-gray-500 mt-1 max-w-md">
                          Commencez par créer votre premier créneau horaire
                        </p>
                        <Button
                          variant="primary"
                          onClick={() => openModal()}
                          className="mt-4"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Créer un horaire
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  horaires.map((horaire) => {
                    const { icon: Icon, color } = getLibelleIcon(
                      horaire.libelle,
                    );
                    return (
                      <tr
                        key={horaire.id}
                        className="hover:bg-gray-50/80 transition-colors group"
                      >
                        <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-${color}-100`}>
                              <Icon className={`w-4 h-4 text-${color}-600`} />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {horaire.libelle}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {horaire.heure_debut} - {horaire.heure_fin}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-center">
                          <div className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg">
                            <span className="text-sm font-medium text-gray-900">
                              {horaire.heure_debut}
                            </span>
                            <ChevronRight className="w-3 h-3 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {horaire.heure_fin}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-center">
                          <Badge
                            variant={horaire.actif ? "success" : "danger"}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium"
                          >
                            {horaire.actif ? "Actif" : "Inactif"}
                          </Badge>
                        </td>
                        <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openModal(horaire)}
                              title="Modifier"
                              className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDelete(horaire)}
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Vue Mobile - Cartes */}
          <div className="md:hidden divide-y divide-gray-100">
            {horaires.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <div className="flex flex-col items-center py-8">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <Clock className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium text-gray-900">
                    Aucun horaire trouvé
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Commencez par créer votre premier créneau horaire
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => openModal()}
                    className="mt-4"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Créer un horaire
                  </Button>
                </div>
              </div>
            ) : (
              horaires.map((horaire) => {
                const { icon: Icon, color } = getLibelleIcon(horaire.libelle);
                return (
                  <div
                    key={horaire.id}
                    className="p-4 hover:bg-gray-50/80 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg bg-${color}-100`}>
                          <Icon className={`w-5 h-5 text-${color}-600`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {horaire.libelle}
                          </h3>
                          <Badge
                            variant={horaire.actif ? "success" : "danger"}
                            className="mt-1 inline-flex text-xs"
                          >
                            {horaire.actif ? "Actif" : "Inactif"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openModal(horaire)}
                          className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(horaire)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg ml-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Horaire</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {horaire.heure_debut}
                        </span>
                        <ChevronRight className="w-3 h-3 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {horaire.heure_fin}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Pied de liste mobile */}
            {horaires.length > 0 && (
              <div className="p-4 bg-gray-50/50 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center">
                  {horaires.length} horaire{horaires.length > 1 ? "s" : ""} au
                  total
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL RESPONSIVE */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-linear-to-br from-primary-500 to-primary-600 rounded-lg shadow-lg shadow-primary-500/20 shrink-0">
              {selectedHoraire ? (
                <Edit className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              ) : (
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              )}
            </div>
            <span className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 truncate">
              {selectedHoraire ? "Modifier l'horaire" : "Nouvel horaire"}
            </span>
          </div>
        }
        size="md"
        className="backdrop-blur-sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* DROPDOWN LIBELLE AVEC ICÔNES */}
          <div className="space-y-1.5 sm:space-y-2">
            <label className="block text-xs sm:text-sm font-medium text-gray-700">
              Libellé <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <select
                value={formData.libelle}
                onChange={(e) =>
                  setFormData({ ...formData, libelle: e.target.value })
                }
                className={`w-full appearance-none border rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-white focus:ring-2 focus:outline-none transition-all
                ${
                  errors.libelle
                    ? "border-red-500 focus:ring-red-200"
                    : "border-gray-200 focus:ring-primary-500/20 focus:border-primary-500"
                }`}
                required
              >
                <option value="">-- Choisir un libellé --</option>
                {LIBELLES.map(({ value, icon: Icon, color }) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 rotate-90" />
              </div>
            </div>

            {errors.libelle && (
              <p className="text-xs sm:text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                {errors.libelle}
              </p>
            )}
          </div>

          {/* HEURES - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Heure début */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700">
                Heure début <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={formData.heure_debut}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      heure_debut: e.target.value,
                    })
                  }
                  className={`w-full border rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-white focus:ring-2 focus:outline-none transition-all
                  ${
                    errors.heure_debut
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-200 focus:ring-primary-500/20 focus:border-primary-500"
                  }`}
                  required
                />
              </div>
              {errors.heure_debut && (
                <p className="text-xs sm:text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  {errors.heure_debut}
                </p>
              )}
            </div>

            {/* Heure fin */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700">
                Heure fin <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={formData.heure_fin}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      heure_fin: e.target.value,
                    })
                  }
                  className={`w-full border rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-white focus:ring-2 focus:outline-none transition-all
                  ${
                    errors.heure_fin
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-200 focus:ring-primary-500/20 focus:border-primary-500"
                  }`}
                  required
                />
              </div>
              {errors.heure_fin && (
                <p className="text-xs sm:text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  {errors.heure_fin}
                </p>
              )}
            </div>
          </div>

          {/* Aperçu de l'horaire */}
          {formData.heure_debut &&
            formData.heure_fin &&
            !errors.heure_debut &&
            !errors.heure_fin && (
              <div className="bg-linear-to-r from-primary-50 to-blue-50 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-primary-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-white rounded-lg shadow-sm">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-700">
                        Horaire sélectionné
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-sm sm:text-base font-semibold text-gray-900">
                      {formData.heure_debut}
                    </span>
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                    <span className="text-sm sm:text-base font-semibold text-gray-900">
                      {formData.heure_fin}
                    </span>
                  </div>
                </div>
              </div>
            )}

          {/* BUTTONS - Responsive */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              disabled={formLoading}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 rounded-lg sm:rounded-xl border-gray-200 hover:bg-gray-50 text-sm sm:text-base"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={formLoading}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 rounded-lg sm:rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-xl text-sm sm:text-base"
            >
              <Save className="w-4 h-4 mr-1.5 sm:mr-2 shrink-0" />
              <span className="truncate">
                {selectedHoraire ? "Modifier" : "Créer"}
              </span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
