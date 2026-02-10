import { horaireService } from "@/services/api";
import { Edit, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Loading from "@/components/ui/Loading";
import Modal from "@/components/ui/Modal";

import toast from "react-hot-toast";

/* ✅ Libellés automatiques */
const LIBELLES = ["Matin", "Après-midi", "Soir"];

export default function Horaires() {
  const [horaires, setHoraires] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selectedHoraire, setSelectedHoraire] = useState(null);

  const [formLoading, setFormLoading] = useState(false);

  /* ✅ Form Data */
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
        toast.success("Horaire modifié avec succès ✅");
      } else {
        await horaireService.create(payload);
        toast.success("Horaire créé avec succès ✅");
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

      toast.success("Horaire supprimé ✅");
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
  // LOADING
  // =============================
  if (loading) {
    return <Loading fullScreen message="Chargement des horaires..." />;
  }

  // =============================
  // UI
  // =============================
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Horaires</h1>

        <Button variant="primary" onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvel horaire
        </Button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Libellé
              </th>

              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Début
              </th>

              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Fin
              </th>

              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Statut
              </th>

              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {horaires.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  Aucun horaire trouvé
                </td>
              </tr>
            ) : (
              horaires.map((horaire) => (
                <tr key={horaire.id} className="hover:bg-gray-50">
                  {/* Libellé */}
                  <td className="px-6 py-4 font-bold text-primary-600">
                    {horaire.libelle}
                  </td>

                  {/* Heures */}
                  <td className="px-6 py-4 text-center">
                    {horaire.heure_debut}
                  </td>

                  <td className="px-6 py-4 text-center">{horaire.heure_fin}</td>

                  {/* Statut */}
                  <td className="px-6 py-4 text-center">
                    <Badge variant={horaire.actif ? "success" : "danger"}>
                      {horaire.actif ? "Actif" : "Inactif"}
                    </Badge>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openModal(horaire)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-800"
                        onClick={() => handleDelete(horaire)}
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

      {/* MODAL */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={selectedHoraire ? "Modifier horaire" : "Nouvel horaire"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* DROPDOWN LIBELLE */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Libellé *
            </label>

            <select
              value={formData.libelle}
              onChange={(e) =>
                setFormData({ ...formData, libelle: e.target.value })
              }
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:outline-none
              ${
                errors.libelle
                  ? "border-red-500 focus:ring-red-200"
                  : "border-gray-300 focus:ring-primary-200"
              }`}
              required
            >
              <option value="">-- Choisir un libellé --</option>

              {LIBELLES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            {errors.libelle && (
              <p className="text-sm text-red-600">{errors.libelle}</p>
            )}
          </div>

          {/* HEURES */}
          <div className="grid grid-cols-2 gap-4">
            {/* Heure début */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Heure début *
              </label>
              <input
                type="time"
                value={formData.heure_debut}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    heure_debut: e.target.value,
                  })
                }
                className={`w-full border rounded-lg px-3 py-2
                ${errors.heure_debut ? "border-red-500" : "border-gray-300"}`}
                required
              />
              {errors.heure_debut && (
                <p className="text-sm text-red-600">{errors.heure_debut}</p>
              )}
            </div>

            {/* Heure fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Heure fin *
              </label>
              <input
                type="time"
                value={formData.heure_fin}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    heure_fin: e.target.value,
                  })
                }
                className={`w-full border rounded-lg px-3 py-2
                ${errors.heure_fin ? "border-red-500" : "border-gray-300"}`}
                required
              />
              {errors.heure_fin && (
                <p className="text-sm text-red-600">{errors.heure_fin}</p>
              )}
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={closeModal}>
              Annuler
            </Button>

            <Button type="submit" variant="primary" loading={formLoading}>
              <Save className="w-4 h-4 mr-2" />
              {selectedHoraire ? "Modifier" : "Créer"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
