import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Loading from "@/components/ui/Loading";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { inscriptionService, vagueService } from "@/services/api";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  BookMarked,
  CreditCard,
  DollarSign,
  FileText,
  GraduationCap,
  Landmark,
  Mail,
  Phone,
  RefreshCw,
  Save,
  School,
  Smartphone,
  User,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

export default function ModalInscriptions({ isOpen, onClose, onSuccess }) {
  const [vagues, setVagues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // ===========================
  // Formulaire inscription
  // ===========================
  const [form, setForm] = useState({
    etudiant_nom: "",
    etudiant_prenom: "",
    etudiant_telephone: "",
    etudiant_email: "",

    niveau_id: "",
    vague_id: "",

    methode_paiement: "especes",

    frais_inscription_paye: false,
    montant_ecolage_initial: 0,
    livre1_paye: false,
    livre2_paye: false,

    remarques: "",
  });

  // ===========================
  // Charger les vagues
  // ===========================
  useEffect(() => {
    async function fetchVagues() {
      if (!isOpen) return;

      setLoading(true);
      try {
        const res = await vagueService.getAll({ statut: "planifie" });
        setVagues(res.data?.vagues || res.data?.liste || res.data || []);
      } catch (err) {
        console.error(err);
        toast.error("Erreur lors du chargement des vagues");
      } finally {
        setLoading(false);
      }
    }

    fetchVagues();
  }, [isOpen]);

  // ===========================
  // Reset form
  // ===========================
  const resetForm = () => {
    setForm({
      etudiant_nom: "",
      etudiant_prenom: "",
      etudiant_telephone: "",
      etudiant_email: "",
      niveau_id: "",
      vague_id: "",
      methode_paiement: "especes",
      frais_inscription_paye: false,
      montant_ecolage_initial: 0,
      livre1_paye: false,
      livre2_paye: false,
      remarques: "",
    });
    setFormErrors({});
  };

  // ===========================
  // Liste unique des niveaux
  // ===========================
  const niveaux = Array.from(
    new Map(
      vagues.map((v) => [
        v.niveau_id,
        {
          id: v.niveau_id,
          nom: v.niveau_nom,
          code: v.niveau_code,
        },
      ]),
    ).values(),
  );

  // ===========================
  // Filtrer vagues selon niveau + planifiées
  // ===========================
  const vaguesFiltrees = vagues.filter(
    (v) =>
      v.statut === "planifie" && String(v.niveau_id) === String(form.niveau_id),
  );

  // ===========================
  // Vague sélectionnée
  // ===========================
  const selectedVague = vagues.find(
    (v) => String(v.id) === String(form.vague_id),
  );

  // ===========================
  // Validation formulaire
  // ===========================
  const validateForm = () => {
    const errors = {};

    if (!form.etudiant_nom.trim()) {
      errors.etudiant_nom = "Le nom est requis";
    }

    if (!form.etudiant_prenom.trim()) {
      errors.etudiant_prenom = "Le prénom est requis";
    }

    if (!form.etudiant_telephone.trim()) {
      errors.etudiant_telephone = "Le téléphone est requis";
    } else if (!/^[0-9+\-\s]{8,}$/.test(form.etudiant_telephone)) {
      errors.etudiant_telephone = "Numéro de téléphone invalide";
    }

    if (form.etudiant_email && !/\S+@\S+\.\S+/.test(form.etudiant_email)) {
      errors.etudiant_email = "Email invalide";
    }

    if (!form.niveau_id) {
      errors.niveau_id = "Le niveau est requis";
    }

    if (!form.vague_id) {
      errors.vague_id = "La vague est requise";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ===========================
  // Handle change
  // ===========================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // ===========================
  // Submit
  // ===========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs du formulaire");
      return;
    }

    setLoading(true);

    try {
      await inscriptionService.createComplete(form);

      toast.success("Inscription créée avec succès !");
      resetForm();
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || "Erreur lors de l'inscription",
      );
    } finally {
      setLoading(false);
    }
  };

  // ===========================
  // Options de paiement
  // ===========================
  const paiementOptions = [
    { value: "especes", label: "Espèces", icon: Wallet },
    { value: "carte", label: "Carte bancaire", icon: CreditCard },
    { value: "virement", label: "Virement", icon: Landmark },
    { value: "cheque", label: "Chèque", icon: FileText },
    { value: "mobile_money", label: "Mobile Money", icon: Smartphone },
  ];

  // ===========================
  // Render
  // ===========================
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-linear-to-br from-primary-500 to-primary-600 rounded-lg shadow-lg shadow-primary-500/20">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">
            Nouvelle inscription
          </span>
        </div>
      }
      size="4xl"
      className="backdrop-blur-sm"
    >
      {loading && vagues.length === 0 ? (
        <div className="py-16 flex justify-center">
          <Loading message="Chargement des vagues..." />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ===========================
              INFOS ÉTUDIANT
          =========================== */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <div className="p-1.5 bg-blue-50 rounded-lg">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">
                Informations de l'étudiant
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Nom <span className="text-red-500">*</span>
                </label>
                <Input
                  name="etudiant_nom"
                  value={form.etudiant_nom}
                  onChange={handleChange}
                  placeholder="Dupont"
                  error={formErrors.etudiant_nom}
                  className="rounded-xl border-gray-200 focus:ring-2 focus:ring-primary-500/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <Input
                  name="etudiant_prenom"
                  value={form.etudiant_prenom}
                  onChange={handleChange}
                  placeholder="Jean"
                  error={formErrors.etudiant_prenom}
                  className="rounded-xl border-gray-200 focus:ring-2 focus:ring-primary-500/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    name="etudiant_telephone"
                    value={form.etudiant_telephone}
                    onChange={handleChange}
                    placeholder="+261 34 12 345 67"
                    error={formErrors.etudiant_telephone}
                    className="pl-10 rounded-xl border-gray-200 focus:ring-2 focus:ring-primary-500/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    name="etudiant_email"
                    value={form.etudiant_email}
                    onChange={handleChange}
                    placeholder="jean.dupont@email.com"
                    error={formErrors.etudiant_email}
                    className="pl-10 rounded-xl border-gray-200 focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ===========================
              NIVEAU ET VAGUE
          =========================== */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <div className="p-1.5 bg-purple-50 rounded-lg">
                <BookMarked className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">
                Niveau et vague
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Niveau <span className="text-red-500">*</span>
                </label>
                <Select
                  name="niveau_id"
                  value={form.niveau_id}
                  required
                  onChange={(e) => {
                    setForm((prev) => ({
                      ...prev,
                      niveau_id: e.target.value,
                      vague_id: "",
                    }));
                    if (formErrors.niveau_id) {
                      setFormErrors((prev) => ({
                        ...prev,
                        niveau_id: undefined,
                      }));
                    }
                  }}
                  options={[
                    { value: "", label: "Sélectionner un niveau" },
                    ...niveaux.map((n) => ({
                      value: n.id,
                      label: `${n.nom} (${n.code})`,
                    })),
                  ]}
                  error={formErrors.niveau_id}
                  className="rounded-xl border-gray-200 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Vague <span className="text-red-500">*</span>
                </label>
                <Select
                  name="vague_id"
                  value={form.vague_id}
                  required
                  disabled={!form.niveau_id}
                  placeholder={
                    form.niveau_id
                      ? "Sélectionner une vague..."
                      : "Choisir d'abord un niveau"
                  }
                  onChange={handleChange}
                  options={[
                    { value: "", label: "Sélectionner une vague" },
                    ...vaguesFiltrees.map((v) => ({
                      value: v.id,
                      label: `${v.nom} - ${v.nb_inscrits || 0}/${v.capacite_max} places`,
                    })),
                  ]}
                  error={formErrors.vague_id}
                  className="rounded-xl border-gray-200 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>

            {/* Détails de la vague sélectionnée */}
            {selectedVague && (
              <div className="bg-linear-to-r from-gray-50 to-white p-5 rounded-xl border border-gray-200 mt-2">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-primary-100 rounded-lg">
                    <School className="w-4 h-4 text-primary-700" />
                  </div>
                  <h4 className="font-semibold text-gray-900">
                    Détails de la vague
                  </h4>
                  <Badge variant="success" size="sm" className="ml-2">
                    {selectedVague.nb_inscrits || 0}/
                    {selectedVague.capacite_max} places
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Niveau</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedVague.niveau_nom} ({selectedVague.niveau_code})
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Salle</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedVague.salle_nom || "Non assignée"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Enseignant</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedVague.enseignant_nom
                        ? `${selectedVague.enseignant_prenom || ""} ${selectedVague.enseignant_nom}`
                        : "Non assigné"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Horaires</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedVague.horaires_resume || "Non défini"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Date début</p>
                    <p className="text-sm font-medium text-gray-900">
                      {format(
                        new Date(selectedVague.date_debut),
                        "dd MMM yyyy",
                        { locale: fr },
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Date fin</p>
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(selectedVague.date_fin), "dd MMM yyyy", {
                        locale: fr,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ===========================
              PAIEMENT INITIAL
          =========================== */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <div className="p-1.5 bg-green-50 rounded-lg">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">
                Paiement initial
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Méthode de paiement
                </label>
                <Select
                  name="methode_paiement"
                  value={form.methode_paiement}
                  onChange={handleChange}
                  options={paiementOptions.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  }))}
                  className="rounded-xl border-gray-200 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Montant écolage initial
                </label>
                <div className="relative">
                  <p className="absolute left-3 top-1/3 -translate-y-1/2 w-4 h-4 text-gray-400">
                    Ar
                  </p>
                  <Input
                    name="montant_ecolage_initial"
                    type="number"
                    min="0"
                    value={form.montant_ecolage_initial}
                    onChange={handleChange}
                    placeholder="0"
                    className="pl-10 rounded-xl border-gray-200 focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  name="frais_inscription_paye"
                  checked={form.frais_inscription_paye}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Frais d'inscription payés
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  name="livre1_paye"
                  checked={form.livre1_paye}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Livre 1 payé
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  name="livre2_paye"
                  checked={form.livre2_paye}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Livre 2 payé
                </span>
              </label>
            </div>
          </div>

          {/* ===========================
              REMARQUES
          =========================== */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <div className="p-1.5 bg-gray-50 rounded-lg">
                <FileText className="w-4 h-4 text-gray-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">
                Remarques
              </h3>
            </div>

            <textarea
              name="remarques"
              value={form.remarques}
              onChange={handleChange}
              placeholder="Informations complémentaires (optionnel)..."
              rows={3}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
            />
          </div>

          {/* ===========================
              BOUTONS D'ACTION
          =========================== */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onClose();
              }}
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
                  Inscription en cours...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Créer l'inscription
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
