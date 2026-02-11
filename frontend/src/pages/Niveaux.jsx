import { useEffect, useState } from "react";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  GraduationCap,
  BookOpen,
  DollarSign,
  Calendar,
  FileText,
  AlertCircle,
  ChevronRight,
  Layers,
  Bookmark
} from "lucide-react";
import { niveauService } from "@/services/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Loading from "@/components/ui/Loading";
import { formatCurrency } from "@/utils/helpers";
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
    frais_ecolage: "",
    frais_livre: "",
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

    if (
      formData.frais_ecolage === "" ||
      parseFloat(formData.frais_ecolage) < 0
    ) {
      newErrors.frais_ecolage = "Montant invalide";
    }

    if (formData.frais_livre === "" || parseFloat(formData.frais_livre) < 0) {
      newErrors.frais_livre = "Montant invalide";
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
      frais_ecolage: parseFloat(formData.frais_ecolage),
      frais_livre: parseFloat(formData.frais_livre),
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
        frais_ecolage: niveau.frais_ecolage?.toString() || "0",
        frais_livre: niveau.frais_livre?.toString() || "0",
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
      frais_ecolage: "",
      frais_livre: "",
      duree_mois: "2",
    });
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
    setErrors({});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <Loading fullScreen message="Chargement des niveaux..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-screen mx-auto space-y-8">
        {/* Header avec effet de verre */}
        <div className="relative">
          <div className="absolute inset-0 bg-linear-to-r from-primary-600/10 via-primary-400/5 to-transparent rounded-3xl blur-xl" />
          <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border border-gray-100/80 shadow-sm">
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Listes des niveaux 
                  </h1>
                </div>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Gérez les niveaux d'études et leurs frais associés
                </p>
              </div>
            </div>
            <Button
              onClick={() => openModal()}
              variant="primary"
              className="shadow-lg shadow-primary-500/20 hover:shadow-xl transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau niveau
            </Button>
          </div>
        </div>

        {/* Tableau des niveaux */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-gray-400" />
                Liste des niveaux
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {niveaux.length} enregistrement{niveaux.length > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Niveau
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Frais inscription
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Frais écolage
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Frais livre
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Durée
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {niveaux.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-16 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center">
                        <div className="p-4 bg-gray-100 rounded-full mb-4">
                          <GraduationCap className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-lg font-medium text-gray-900">
                          Aucun niveau trouvé
                        </p>
                        <p className="text-sm text-gray-500 mt-1 max-w-md">
                          Commencez par créer votre premier niveau académique
                        </p>
                        <Button
                          variant="primary"
                          onClick={() => openModal()}
                          className="mt-4"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Créer un niveau
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  niveaux.map((niveau, index) => {
                    const totalFrais =
                      (parseFloat(niveau.frais_inscription) || 0) +
                      (parseFloat(niveau.frais_ecolage) || 0) +
                      (parseFloat(niveau.frais_livre) || 0);

                    return (
                      <tr
                        key={niveau.id}
                        className="hover:bg-gray-50/80 transition-colors group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mr-3 ${
                              niveau.actif 
                                ? 'bg-linear-to-br from-primary-100 to-primary-50' 
                                : 'bg-gray-100'
                            }`}>
                              <span className={`text-sm font-bold ${
                                niveau.actif ? 'text-primary-700' : 'text-gray-500'
                              }`}>
                                {niveau.code}
                              </span>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {niveau.nom}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                Code: {niveau.code}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {niveau.description || (
                              <span className="text-gray-400 italic">
                                Aucune description
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">
                              {formatCurrency(niveau.frais_inscription)}
                            </span>
                            <span className="text-xs text-gray-500 mt-0.5">
                              {niveau.frais_inscription > 0 ? "Payant" : "Gratuit"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(niveau.frais_ecolage)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(niveau.frais_livre)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-lg font-bold text-primary-600">
                              {formatCurrency(totalFrais)}
                            </span>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center">
                            <div className="bg-gray-100 rounded-full px-3 py-1">
                              <span className="text-sm font-medium text-gray-700">
                                {niveau.duree_mois} mois
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <Badge 
                            variant={niveau.actif ? "success" : "danger"}
                            className="px-3 py-1.5 text-xs font-medium"
                          >
                            {niveau.actif ? "Actif" : "Inactif"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openModal(niveau)}
                              title="Modifier"
                              className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-600 hover:text-red-600 hover:bg-red-50"
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
          
          {/* Pied de tableau */}
          {niveaux.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{niveaux.length}</span> niveau{niveaux.length > 1 ? "x" : ""} au total
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Ajout/Modification */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-linear-to-br from-primary-500 to-primary-600 rounded-lg shadow-lg shadow-primary-500/20">
              {selectedNiveau ? (
                <Edit className="w-5 h-5 text-white" />
              ) : (
                <GraduationCap className="w-5 h-5 text-white" />
              )}
            </div>
            <span className="text-xl font-bold text-gray-900">
              {selectedNiveau ? "Modifier le niveau" : "Créer un niveau"}
            </span>
          </div>
        }
        size="lg"
        className="backdrop-blur-sm"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations principales */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <div className="p-1.5 bg-primary-50 rounded-lg">
                <FileText className="w-4 h-4 text-primary-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">
                Informations générales
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Code <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  error={errors.code}
                  placeholder="Ex: L1, L2, M1, etc."
                  required
                  maxLength={10}
                  className="rounded-xl border-gray-200 focus:ring-2 focus:ring-primary-500/20 font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Nom du niveau <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.nom}
                  onChange={(e) =>
                    setFormData({ ...formData, nom: e.target.value })
                  }
                  error={errors.nom}
                  placeholder="Ex: Licence 1"
                  required
                  className="rounded-xl border-gray-200 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optionnel : description détaillée du niveau..."
                rows={3}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
              />
            </div>
          </div>

          {/* Frais */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <div className="p-1.5 bg-green-50 rounded-lg">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">
                Frais et tarifs
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Frais inscription <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {formatCurrency(0).charAt(0)}
                  </span>
                  <Input
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
                    className="pl-8 rounded-xl border-gray-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Frais écolage <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {formatCurrency(0).charAt(0)}
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.frais_ecolage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        frais_ecolage: e.target.value,
                      })
                    }
                    error={errors.frais_ecolage}
                    placeholder="0.00"
                    required
                    className="pl-8 rounded-xl border-gray-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Frais livres <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {formatCurrency(0).charAt(0)}
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.frais_livre}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        frais_livre: e.target.value,
                      })
                    }
                    error={errors.frais_livre}
                    placeholder="0.00"
                    required
                    className="pl-8 rounded-xl border-gray-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Durée */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <div className="p-1.5 bg-purple-50 rounded-lg">
                <Calendar className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">
                Durée du programme
              </h3>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Durée (mois) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  max="36"
                  value={formData.duree_mois}
                  onChange={(e) =>
                    setFormData({ ...formData, duree_mois: e.target.value })
                  }
                  error={errors.duree_mois}
                  required
                  className="rounded-xl border-gray-200 max-w-xs"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                  mois
                </span>
              </div>
            </div>
          </div>

          {/* Résumé du total */}
          {(formData.frais_inscription ||
            formData.frais_ecolage ||
            formData.frais_livre) && (
            <div className="bg-linear-to-r from-primary-50 to-blue-50 p-6 rounded-xl border border-primary-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <DollarSign className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Total des frais du programme
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Inscription + Écolage + Livres
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-primary-600">
                    {formatCurrency(
                      (parseFloat(formData.frais_inscription) || 0) +
                        (parseFloat(formData.frais_ecolage) || 0) +
                        (parseFloat(formData.frais_livre) || 0),
                    )}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    Soit {formatCurrency(
                      ((parseFloat(formData.frais_inscription) || 0) +
                        (parseFloat(formData.frais_ecolage) || 0) +
                        (parseFloat(formData.frais_livre) || 0)) / 
                        (parseInt(formData.duree_mois) || 1)
                    )}/mois
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              disabled={formLoading}
              className="px-6 rounded-xl border-gray-200 hover:bg-gray-50"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              loading={formLoading}
              className="px-8 rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-xl"
            >
              <Save className="w-4 h-4 mr-2" />
              {selectedNiveau ? "Enregistrer les modifications" : "Créer le niveau"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}