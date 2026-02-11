import { Edit, Plus, RefreshCcw, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { etudiantService } from "@/services/api";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Loading from "@/components/ui/Loading";
import Modal from "@/components/ui/Modal";

import toast from "react-hot-toast";

export default function Etudiants() {
  const [etudiants, setEtudiants] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formLoading, setFormLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [selectedEtudiant, setSelectedEtudiant] = useState(null);

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
  });

  const [errors, setErrors] = useState({});

  // =============================
  // Load étudiants
  // =============================
  useEffect(() => {
    loadEtudiants();
  }, []);

  const loadEtudiants = async () => {
    setLoading(true);

    try {
      const response = await etudiantService.getAll();

      // ⚠️ PaginatedResponse renvoie response.data.data
      setEtudiants(response.data.data || []);
    } catch (error) {
      console.error("Erreur chargement étudiants:", error);
      toast.error("Impossible de charger les étudiants");
    } finally {
      setLoading(false);
    }
  };

  // =============================
  // Validation form
  // =============================
  const validateForm = () => {
    const newErrors = {};

    if (!formData.nom.trim()) {
      newErrors.nom = "Nom requis";
    }

    if (!formData.prenom.trim()) {
      newErrors.prenom = "Prénom requis";
    }

    if (!formData.telephone.trim()) {
      newErrors.telephone = "Téléphone requis";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // =============================
  // Submit
  // =============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs");
      return;
    }

    setFormLoading(true);

    const payload = {
      nom: formData.nom.trim(),
      prenom: formData.prenom.trim(),
      telephone: formData.telephone.trim(),
      email: formData.email.trim() || null,
    };

    try {
      if (selectedEtudiant) {
        await etudiantService.update(selectedEtudiant.id, payload);
        toast.success("Étudiant modifié avec succès ");
      } else {
        await etudiantService.create(payload);
        toast.success("Étudiant créé avec succès ");
      }

      setShowModal(false);
      resetForm();
      loadEtudiants();
    } catch (error) {
      console.error("Erreur sauvegarde:", error);

      toast.error(
        error.response?.data?.message || "Erreur lors de la sauvegarde",
      );
    } finally {
      setFormLoading(false);
    }
  };

  // =============================
  // Delete (désactiver)
  // =============================
  const handleDelete = async (etudiant) => {
    if (
      !window.confirm(
        `Voulez-vous vraiment désactiver ${etudiant.nom} ${etudiant.prenom} ?`,
      )
    ) {
      return;
    }

    try {
      await etudiantService.delete(etudiant.id);

      toast.success("Étudiant désactivé avec succès ");

      loadEtudiants();
    } catch (error) {
      console.error("Erreur désactivation:", error);

      toast.error(
        error.response?.data?.message ||
          "Impossible de désactiver cet étudiant",
      );
    }
  };

  // =============================
  // Toggle actif/inactif
  // =============================
  const handleToggle = async (etudiant) => {
    try {
      await etudiantService.toggle(etudiant.id);

      toast.success("Statut modifié avec succès ");

      loadEtudiants();
    } catch (error) {
      console.error("Erreur toggle:", error);

      toast.error(
        error.response?.data?.message || "Erreur lors du changement de statut",
      );
    }
  };

  // =============================
  // Modal open
  // =============================
  const openModal = (etudiant = null) => {
    if (etudiant) {
      setSelectedEtudiant(etudiant);

      setFormData({
        nom: etudiant.nom,
        prenom: etudiant.prenom,
        telephone: etudiant.telephone,
        email: etudiant.email || "",
      });
    } else {
      resetForm();
    }

    setErrors({});
    setShowModal(true);
  };

  // =============================
  // Reset
  // =============================
  const resetForm = () => {
    setSelectedEtudiant(null);

    setFormData({
      nom: "",
      prenom: "",
      telephone: "",
      email: "",
    });
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
    setErrors({});
  };

  // =============================
  // Loading
  // =============================
  if (loading) {
    return <Loading fullScreen message="Chargement des étudiants..." />;
  }

  // =============================
  // Render
  // =============================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Étudiants</h1>

        <div className="flex gap-2">
          <Button variant="outline" onClick={loadEtudiants}>
            <RefreshCcw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>

          <Button variant="primary" onClick={() => openModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvel étudiant
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Téléphone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Statut
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {etudiants.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    Aucun étudiant trouvé
                  </td>
                </tr>
              ) : (
                etudiants.map((etudiant) => (
                  <tr key={etudiant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {etudiant.nom} {etudiant.prenom}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {etudiant.telephone}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {etudiant.email || "-"}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <Badge variant={etudiant.actif ? "success" : "danger"}>
                        {etudiant.actif ? "Actif" : "Inactif"}
                      </Badge>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openModal(etudiant)}
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggle(etudiant)}
                          title="Activer/Désactiver"
                        >
                          <RefreshCcw className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleDelete(etudiant)}
                          title="Désactiver"
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
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={selectedEtudiant ? "Modifier étudiant" : "Nouvel étudiant"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Nom *"
              value={formData.nom}
              onChange={(e) =>
                setFormData({ ...formData, nom: e.target.value })
              }
              error={errors.nom}
              required
            />

            <Input
              label="Prénom *"
              value={formData.prenom}
              onChange={(e) =>
                setFormData({ ...formData, prenom: e.target.value })
              }
              error={errors.prenom}
              required
            />
          </div>

          <Input
            label="Téléphone *"
            value={formData.telephone}
            onChange={(e) =>
              setFormData({ ...formData, telephone: e.target.value })
            }
            error={errors.telephone}
            required
          />

          <Input
            label="Email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />

          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={closeModal}>
              Annuler
            </Button>

            <Button type="submit" variant="primary" loading={formLoading}>
              <Save className="w-4 h-4 mr-2" />
              {selectedEtudiant ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
