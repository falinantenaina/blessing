import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Loading from "@/components/ui/Loading";
import Modal from "@/components/ui/Modal";
import { niveauService } from "@/services/api";
import { formatCurrency } from "@/utils/helpers";
import { Edit, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function Niveaux() {
  const [niveaux, setNiveaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedNiveau, setSelectedNiveau] = useState(null);

  const [formData, setFormData] = useState({
    code: "",
    nom: "",
    description: "",
    frais_inscription: "",
    prix_livre_cours: "", // ✅ Nouveau
    prix_livre_exercices: "", // ✅ Nouveau
    duree_mois: "2",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadNiveaux();
  }, []);

  const loadNiveaux = async () => {
    setLoading(true);
    try {
      const response = await niveauService.getAll();
      setNiveaux(response.data || []);
    } catch (error) {
      console.error("Erreur chargement niveaux:", error);
      toast.error("Impossible de charger les niveaux");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.code.trim()) {
      newErrors.code = "Code requis";
    }

    if (!formData.nom.trim()) {
      newErrors.nom = "Nom requis";
    }

    if (
      formData.frais_inscription === "" ||
      parseFloat(formData.frais_inscription) < 0
    ) {
      newErrors.frais_inscription = "Montant invalide";
    }

    // ✅ Validation nouveaux champs
    if (
      formData.prix_livre_cours === "" ||
      parseFloat(formData.prix_livre_cours) < 0
    ) {
      newErrors.prix_livre_cours = "Montant invalide";
    }

    if (
      formData.prix_livre_exercices === "" ||
      parseFloat(formData.prix_livre_exercices) < 0
    ) {
      newErrors.prix_livre_exercices = "Montant invalide";
    }

    if (!formData.duree_mois || parseInt(formData.duree_mois) < 1) {
      newErrors.duree_mois = "Durée minimale : 1 mois";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs du formulaire");
      return;
    }

    setFormLoading(true);

    const payload = {
      code: formData.code.trim(),
      nom: formData.nom.trim(),
      description: formData.description.trim() || null,
      frais_inscription: parseFloat(formData.frais_inscription),
      prix_livre_cours: parseFloat(formData.prix_livre_cours),
      prix_livre_exercices: parseFloat(formData.prix_livre_exercices),
      duree_mois: parseInt(formData.duree_mois),
    };

    try {
      if (selectedNiveau) {
        await niveauService.update(selectedNiveau.id, payload);
        toast.success("Niveau modifié avec succès");
      } else {
        await niveauService.create(payload);
        toast.success("Niveau créé avec succès");
      }
      setShowModal(false);
      loadNiveaux();
      resetForm();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error.response?.data?.message || "Erreur lors de la sauvegarde",
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (niveau) => {
    if (
      !window.confirm(
        `Voulez-vous vraiment supprimer le niveau "${niveau.nom}" ?`,
      )
    ) {
      return;
    }

    try {
      await niveauService.delete(niveau.id);
      toast.success("Niveau supprimé avec succès");
      loadNiveaux();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error.response?.data?.message ||
          "Impossible de supprimer ce niveau (peut-être utilisé dans des vagues ?)",
      );
    }
  };

  const openModal = (niveau = null) => {
    if (niveau) {
      setSelectedNiveau(niveau);
      setFormData({
        code: niveau.code,
        nom: niveau.nom,
        description: niveau.description || "",
        frais_inscription: niveau.frais_inscription?.toString() || "0",
        prix_livre_cours: niveau.prix_livre_cours?.toString() || "0",
        prix_livre_exercices: niveau.prix_livre_exercices?.toString() || "0",
        duree_mois: niveau.duree_mois?.toString() || "2",
      });
    } else {
      resetForm();
    }
    setErrors({});
    setShowModal(true);
  };

  const resetForm = () => {
    setSelectedNiveau(null);
    setFormData({
      code: "",
      nom: "",
      description: "",
      frais_inscription: "",
      prix_livre_cours: "",
      prix_livre_exercices: "",
      duree_mois: "2",
    });
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
    setErrors({});
  };

  if (loading) {
    return <Loading fullScreen message="Chargement des niveaux..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Niveaux</h1>
        <Button variant="primary" onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau niveau
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Frais inscription
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Livre cours
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Livre exercices
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durée
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {niveaux.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    Aucun niveau trouvé
                  </td>
                </tr>
              ) : (
                niveaux.map((niveau) => {
                  const totalFrais =
                    (parseFloat(niveau.frais_inscription) || 0) +
                    (parseFloat(niveau.prix_livre_cours) || 0) +
                    (parseFloat(niveau.prix_livre_exercices) || 0);

                  return (
                    <tr
                      key={niveau.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-bold text-primary-600">
                          {niveau.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-gray-900">
                          {niveau.nom}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {niveau.description || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(niveau.frais_inscription)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-medium text-green-600">
                          {formatCurrency(niveau.prix_livre_cours)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-medium text-blue-600">
                          {formatCurrency(niveau.prix_livre_exercices)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-lg font-bold text-primary-600">
                          {formatCurrency(totalFrais)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-900">
                          {niveau.duree_mois} mois
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Badge variant={niveau.actif ? "success" : "danger"}>
                          {niveau.actif ? "Actif" : "Inactif"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openModal(niveau)}
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-800"
                            onClick={() => handleDelete(niveau)}
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
      </div>

      {/* Modal Ajout/Modification */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={selectedNiveau ? "Modifier le niveau" : "Nouveau niveau"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Code *"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              error={errors.code}
              placeholder="Ex: A1, A2, B1, etc."
              required
              maxLength={10}
            />
            <Input
              label="Nom du niveau *"
              value={formData.nom}
              onChange={(e) =>
                setFormData({ ...formData, nom: e.target.value })
              }
              error={errors.nom}
              placeholder="Ex: Niveau A1"
              required
            />
          </div>

          <Input
            label="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Optionnel : détails sur le niveau"
          />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">
              Tarification
            </h3>

            <Input
              label="Frais d'inscription *"
              type="number"
              step="0.01"
              min="0"
              value={formData.frais_inscription}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  frais_inscription: e.target.value,
                })
              }
              error={errors.frais_inscription}
              placeholder="0.00"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Prix livre de cours *"
                type="number"
                step="0.01"
                min="0"
                value={formData.prix_livre_cours}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    prix_livre_cours: e.target.value,
                  })
                }
                error={errors.prix_livre_cours}
                placeholder="0.00"
                required
              />

              <Input
                label="Prix livre d'exercices *"
                type="number"
                step="0.01"
                min="0"
                value={formData.prix_livre_exercices}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    prix_livre_exercices: e.target.value,
                  })
                }
                error={errors.prix_livre_exercices}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <Input
            label="Durée (mois) *"
            type="number"
            min="1"
            max="36"
            value={formData.duree_mois}
            onChange={(e) =>
              setFormData({ ...formData, duree_mois: e.target.value })
            }
            error={errors.duree_mois}
            required
          />

          {/* Résumé du total */}
          {(formData.frais_inscription ||
            formData.prix_livre_cours ||
            formData.prix_livre_exercices) && (
            <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Frais d'inscription :</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(
                      parseFloat(formData.frais_inscription) || 0,
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Livre de cours :</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(parseFloat(formData.prix_livre_cours) || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Livre d'exercices :</span>
                  <span className="font-medium text-blue-600">
                    {formatCurrency(
                      parseFloat(formData.prix_livre_exercices) || 0,
                    )}
                  </span>
                </div>
                <div className="pt-2 border-t border-primary-300 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Total des frais :
                  </span>
                  <span className="text-2xl font-bold text-primary-600">
                    {formatCurrency(
                      (parseFloat(formData.frais_inscription) || 0) +
                        (parseFloat(formData.prix_livre_cours) || 0) +
                        (parseFloat(formData.prix_livre_exercices) || 0),
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              disabled={formLoading}
            >
              Annuler
            </Button>
            <Button type="submit" variant="primary" loading={formLoading}>
              <Save className="w-4 h-4 mr-2" />
              {selectedNiveau ? "Enregistrer modifications" : "Créer le niveau"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
