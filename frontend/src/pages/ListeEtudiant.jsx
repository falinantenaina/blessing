import Loading from "@/components/ui/Loading";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { etudiantService } from "@/services/api";
import {
  Phone,
  Mail,
  GraduationCap,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  BookOpen,
  User,
  Building,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  MapPin,
  CreditCard,
  Receipt,
  FileText,
  Download,
  Printer,
  Filter,
  X,
  Users,
  Home,
  Award,
  RefreshCw,
  ChevronDown,
  Plus,
  Save,
  School,
  BookMarked,
  Wallet,
  CreditCard as CreditCardIcon,
  Landmark,
  Smartphone,
  CheckSquare,
  Square,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { inscriptionService, vagueService } from "@/services/api";
import ModalInscriptions from "../components/modalInscription";

// Composant StatCard compact pour le modal
const CompactStatCard = ({
  title,
  value,
  icon: Icon,
  color = "primary",
  subtitle,
}) => {
  const colors = {
    primary: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      icon: "text-blue-600",
      border: "border-blue-200",
    },
    green: {
      bg: "bg-green-50",
      text: "text-green-700",
      icon: "text-green-600",
      border: "border-green-200",
    },
    orange: {
      bg: "bg-orange-50",
      text: "text-orange-700",
      icon: "text-orange-600",
      border: "border-orange-200",
    },
    purple: {
      bg: "bg-purple-50",
      text: "text-purple-700",
      icon: "text-purple-600",
      border: "border-purple-200",
    },
    red: {
      bg: "bg-red-50",
      text: "text-red-700",
      icon: "text-red-600",
      border: "border-red-200",
    },
  };

  return (
    <div
      className={`${colors[color].bg} p-4 sm:p-5 rounded-xl border ${colors[color].border} hover:shadow-md transition-all`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">
            {title}
          </p>
          <p className={`text-xl sm:text-2xl font-bold ${colors[color].text}`}>
            {value}
          </p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div
          className={`p-2 rounded-lg ${colors[color].bg} ${colors[color].border} border`}
        >
          <Icon className={`w-5 h-5 ${colors[color].icon}`} />
        </div>
      </div>
    </div>
  );
};

// Composant de carte étudiant pour mobile
const EtudiantCard = ({ etudiant, onViewDetails }) => (
  <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-linear-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
          {etudiant.prenom?.charAt(0)}
          {etudiant.nom?.charAt(0)}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">
            {etudiant.nom} {etudiant.prenom}
          </h3>
          <p className="text-xs text-gray-500">#{etudiant.id}</p>
        </div>
      </div>
      <Badge variant={etudiant.actif ? "success" : "danger"} size="sm">
        {etudiant.actif ? "Actif" : "Inactif"}
      </Badge>
    </div>

    <div className="space-y-2 mb-4">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Phone className="w-4 h-4 text-gray-400" />
        <span className="truncate">
          {etudiant.telephone || "Non renseigné"}
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Mail className="w-4 h-4 text-gray-400" />
        <span className="truncate">{etudiant.email || "Non renseigné"}</span>
      </div>
    </div>

    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
      <div className="flex items-center gap-2">
        <span className="bg-blue-100 px-3 py-1 rounded-full text-xs font-medium text-blue-700">
          {etudiant.nb_inscriptions || 0} inscription(s)
        </span>
      </div>
      <Button
        size="sm"
        variant="primary"
        onClick={() => onViewDetails(etudiant)}
        className="shadow-sm"
      >
        <Eye className="w-4 h-4 mr-1" />
        Détails
      </Button>
    </div>
  </div>
);

// Composant Modal d'inscription
const ModalInscription = ({ isOpen, onClose, onSuccess }) => {
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

    if (isOpen) {
      fetchVagues();
    }
  }, [isOpen]);

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

  // Options de paiement
  const paiementOptions = [
    { value: "especes", label: "Espèces", icon: Wallet },
    { value: "carte", label: "Carte bancaire", icon: CreditCardIcon },
    { value: "virement", label: "Virement", icon: Landmark },
    { value: "cheque", label: "Chèque", icon: FileText },
    { value: "mobile_money", label: "Mobile Money", icon: Smartphone },
  ];

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
                className="rounded-xl border-gray-200"
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
                className="rounded-xl border-gray-200"
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
                  className="pl-10 rounded-xl border-gray-200"
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
                  className="pl-10 rounded-xl border-gray-200"
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
                }}
                options={[
                  { value: "", label: "Sélectionner un niveau" },
                  ...niveaux.map((n) => ({
                    value: n.id,
                    label: `${n.nom} (${n.code})`,
                  })),
                ]}
                error={formErrors.niveau_id}
                className="rounded-xl border-gray-200"
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
                className="rounded-xl border-gray-200"
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    {format(new Date(selectedVague.date_debut), "dd MMM yyyy", {
                      locale: fr,
                    })}
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
                className="rounded-xl border-gray-200"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Montant écolage initial
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  name="montant_ecolage_initial"
                  type="number"
                  min="0"
                  value={form.montant_ecolage_initial}
                  onChange={handleChange}
                  placeholder="0"
                  className="pl-10 rounded-xl border-gray-200"
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
            <h3 className="text-base font-semibold text-gray-900">Remarques</h3>
          </div>

          <textarea
            name="remarques"
            value={form.remarques}
            onChange={handleChange}
            placeholder="Informations complémentaires..."
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
    </Modal>
  );
};

export default function ListeEtudiant() {
  const [etudiants, setEtudiants] = useState([]);
  const [fetchingEtudiants, setFetchingEtudiants] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    actif: "",
    niveau: "",
  });

  const [selectedEtudiant, setSelectedEtudiant] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInscriptionModalOpen, setIsInscriptionModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("vagues");

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const fetchEtudiants = async (page = 1, search = "") => {
    setFetchingEtudiants(true);
    try {
      const params = {
        page,
        search,
        limit: pagination.limit,
      };

      if (filters.actif) params.actif = filters.actif === "true";

      const res = await etudiantService.getAll(params);

      setEtudiants(res.data || []);
      setPagination((prev) => ({
        ...prev,
        total: res.total || 0,
        page: res.page || 1,
        totalPages: Math.ceil((res.total || 0) / prev.limit),
      }));
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des étudiants");
    } finally {
      setFetchingEtudiants(false);
    }
  };

  const fetchEtudiantDetails = async (id) => {
    setLoadingDetail(true);
    try {
      const res = await etudiantService.getComplet(id);
      setSelectedEtudiant(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des détails");
      setSelectedEtudiant(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchEtudiants(1, "");
  }, [filters]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchEtudiants(1, searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const openModal = async (etudiant) => {
    setSelectedEtudiant(null);
    setIsModalOpen(true);
    setActiveTab("vagues");
    await fetchEtudiantDetails(etudiant.id);
  };

  const openInscriptionModal = () => {
    setIsInscriptionModalOpen(true);
  };

  const resetFilters = () => {
    setFilters({ actif: "", niveau: "" });
    setSearchTerm("");
  };

  const handleInscriptionSuccess = () => {
    fetchEtudiants(1, searchTerm);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
        {/* HEADER */}
        <div className="relative">
          <div className="absolute inset-0 bg-linear-to-r from-primary-600/10 via-primary-400/5 to-transparent rounded-2xl sm:rounded-3xl blur-xl" />

          <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl border border-gray-100/80 shadow-sm">
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="p-2 sm:p-3 bg-linear-to-br from-primary-500 to-primary-600 rounded-lg sm:rounded-xl shadow-lg shadow-primary-500/20 shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
              </div>

              <div className="min-w-0 flex-1 sm:flex-initial">
                <div className="flex items-center flex-wrap gap-2">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent truncate">
                    Gestion des étudiants
                  </h1>
                  <Badge
                    variant="primary"
                    className="text-xs sm:text-sm whitespace-nowrap"
                  >
                    {pagination.total} étudiant{pagination.total > 1 ? "s" : ""}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 flex items-center gap-1 sm:gap-2">
                  <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate">
                    Gérez les inscriptions et les profils étudiants
                  </span>
                </p>
              </div>
            </div>

            <Button
              onClick={openInscriptionModal}
              variant="primary"
              className="w-full sm:w-auto shadow-lg shadow-primary-500/20 hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 mr-1.5 sm:mr-2 shrink-0" />
              <span className="truncate">Nouvelle inscription</span>
            </Button>
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
                  placeholder="Rechercher un étudiant (nom, prénom, email, téléphone...)"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-lg sm:rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
            </div>

            {/* Panneau de filtres */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Statut
                    </label>
                    <Select
                      value={filters.actif}
                      onChange={(e) => {
                        setFilters({ ...filters, actif: e.target.value });
                        setPagination((prev) => ({ ...prev, page: 1 }));
                      }}
                      options={[
                        { value: "", label: "Tous les statuts" },
                        { value: "true", label: "Actifs" },
                        { value: "false", label: "Inactifs" },
                      ]}
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

        {/* LISTE DES ÉTUDIANTS */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-100/80 shadow-sm overflow-hidden">
          {/* En-tête de la liste */}
          <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Liste des étudiants
                </h2>
              </div>
              <span className="text-xs text-gray-500 bg-white px-3 py-1.5 rounded-full border border-gray-200">
                {pagination.total} résultat{pagination.total > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Vue Desktop - Tableau */}
          <div className="hidden md:block overflow-x-auto">
            {fetchingEtudiants ? (
              <div className="p-12 flex justify-center">
                <Loading message="Chargement des étudiants..." />
              </div>
            ) : etudiants.length === 0 ? (
              <div className="p-12 text-center">
                <div className="p-4 bg-gray-100 rounded-full inline-flex mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Aucun étudiant trouvé
                </p>
                <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                  {searchTerm || filters.actif
                    ? "Essayez de modifier vos filtres de recherche"
                    : "Commencez par inscrire votre premier étudiant"}
                </p>
                <Button
                  variant="primary"
                  onClick={openInscriptionModal}
                  className="shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle inscription
                </Button>
              </div>
            ) : (
              <>
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Étudiant
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Inscriptions
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
                    {etudiants.map((etudiant) => (
                      <tr
                        key={etudiant.id}
                        className="hover:bg-gray-50/80 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-linear-to-br from-primary-100 to-primary-50 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-primary-700">
                                {etudiant.prenom?.charAt(0)}
                                {etudiant.nom?.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {etudiant.nom} {etudiant.prenom}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                #{etudiant.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span>{etudiant.telephone || "—"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="truncate max-w-50">
                                {etudiant.email || "—"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant="primary" className="px-3 py-1.5">
                            {etudiant.nb_inscriptions || 0}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge
                            variant={etudiant.actif ? "success" : "danger"}
                            className="px-3 py-1.5"
                          >
                            {etudiant.actif ? "Actif" : "Inactif"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => openModal(etudiant)}
                            className="shadow-sm opacity-80 group-hover:opacity-100 transition-opacity"
                          >
                            <Eye className="w-4 h-4 mr-1.5" />
                            Détails
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {/* Pagination améliorée */}
                <div className="p-4 sm:p-6 bg-linear-to-b from-gray-50/50 to-white border-t border-gray-100">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Informations de pagination */}
                    <div className="flex items-center gap-3 order-2 sm:order-1">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <span className="text-xs font-medium text-gray-700">
                          {pagination.total > 0 ? (
                            <>
                              <span className="text-primary-600 font-bold">
                                {(pagination.page - 1) * pagination.limit + 1}
                              </span>
                              <span className="text-gray-400 mx-1">-</span>
                              <span className="text-primary-600 font-bold">
                                {Math.min(
                                  pagination.page * pagination.limit,
                                  pagination.total,
                                )}
                              </span>
                              <span className="text-gray-400 mx-1">sur</span>
                              <span className="text-gray-900 font-bold">
                                {pagination.total}
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-500">
                              Aucun résultat
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Indicateur de chargement */}
                      {fetchingEtudiants && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
                          <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse delay-150" />
                          <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse delay-300" />
                        </div>
                      )}
                    </div>

                    {/* Contrôles de pagination */}
                    <div className="flex items-center gap-2 order-1 sm:order-2">
                      {/* Sélecteur de limite par page */}
                      <div className="hidden sm:flex items-center gap-2 mr-2">
                        <span className="text-xs text-gray-500">Lignes:</span>
                        <select
                          value={pagination.limit}
                          onChange={(e) => {
                            setPagination((prev) => ({
                              ...prev,
                              limit: parseInt(e.target.value),
                              page: 1,
                            }));
                            fetchEtudiants(1, searchTerm);
                          }}
                          className="px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                        >
                          {[10, 25, 50, 100].map((limit) => (
                            <option key={limit} value={limit}>
                              {limit}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Bouton première page */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchEtudiants(1, searchTerm)}
                        disabled={pagination.page === 1 || fetchingEtudiants}
                        className="hidden sm:flex border-gray-200 hover:bg-white disabled:opacity-40"
                        title="Première page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <ChevronLeft className="w-4 h-4 -ml-2" />
                      </Button>

                      {/* Bouton précédent */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          fetchEtudiants(pagination.page - 1, searchTerm)
                        }
                        disabled={pagination.page === 1 || fetchingEtudiants}
                        className="border-gray-200 hover:bg-white disabled:opacity-40"
                        title="Page précédente"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden sm:inline ml-1">Précédent</span>
                      </Button>

                      {/* Numéros de page - Desktop */}
                      <div className="hidden md:flex items-center gap-1">
                        {Array.from(
                          { length: Math.min(7, pagination.totalPages) },
                          (_, i) => {
                            let pageNum;
                            if (pagination.totalPages <= 7) {
                              pageNum = i + 1;
                            } else if (pagination.page <= 4) {
                              pageNum = i + 1;
                            } else if (
                              pagination.page >=
                              pagination.totalPages - 3
                            ) {
                              pageNum = pagination.totalPages - 6 + i;
                            } else {
                              pageNum = pagination.page - 3 + i;
                            }

                            // Afficher les ellipses
                            if (i === 0 && pageNum > 1) {
                              return (
                                <div
                                  key="ellipsis-start"
                                  className="flex items-center"
                                >
                                  <button
                                    onClick={() =>
                                      fetchEtudiants(1, searchTerm)
                                    }
                                    className="min-w-9 h-9 px-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all"
                                    title="Page 1"
                                  >
                                    1
                                  </button>
                                  <span className="px-1 text-gray-400">
                                    ...
                                  </span>
                                </div>
                              );
                            }

                            if (i === 6 && pageNum < pagination.totalPages) {
                              return (
                                <div
                                  key="ellipsis-end"
                                  className="flex items-center"
                                >
                                  <span className="px-1 text-gray-400">
                                    ...
                                  </span>
                                  <button
                                    onClick={() =>
                                      fetchEtudiants(
                                        pagination.totalPages,
                                        searchTerm,
                                      )
                                    }
                                    className="min-w-9 h-9 px-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all"
                                    title={`Page ${pagination.totalPages}`}
                                  >
                                    {pagination.totalPages}
                                  </button>
                                </div>
                              );
                            }

                            return (
                              <button
                                key={pageNum}
                                onClick={() =>
                                  fetchEtudiants(pageNum, searchTerm)
                                }
                                disabled={fetchingEtudiants}
                                className={`
                min-w-9 h-9 px-2 rounded-lg text-sm font-medium transition-all
                ${
                  pagination.page === pageNum
                    ? "bg-primary-500 text-white shadow-md shadow-primary-500/20 hover:bg-primary-600"
                    : "text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                }
              `}
                                title={`Page ${pageNum}`}
                              >
                                {pageNum}
                              </button>
                            );
                          },
                        )}
                      </div>

                      {/* Numéros de page - Mobile (simplifiés) */}
                      <div className="flex md:hidden items-center gap-1 px-2">
                        <span className="text-sm font-medium text-gray-900">
                          {pagination.page}
                        </span>
                        <span className="text-xs text-gray-400">/</span>
                        <span className="text-xs text-gray-600">
                          {pagination.totalPages}
                        </span>
                      </div>

                      {/* Bouton suivant */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          fetchEtudiants(pagination.page + 1, searchTerm)
                        }
                        disabled={
                          pagination.page === pagination.totalPages ||
                          fetchingEtudiants
                        }
                        className="border-gray-200 hover:bg-white disabled:opacity-40"
                        title="Page suivante"
                      >
                        <span className="hidden sm:inline mr-1">Suivant</span>
                        <ChevronRight className="w-4 h-4" />
                      </Button>

                      {/* Bouton dernière page */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          fetchEtudiants(pagination.totalPages, searchTerm)
                        }
                        disabled={
                          pagination.page === pagination.totalPages ||
                          fetchingEtudiants
                        }
                        className="hidden sm:flex border-gray-200 hover:bg-white disabled:opacity-40"
                        title="Dernière page"
                      >
                        <ChevronRight className="w-4 h-4" />
                        <ChevronRight className="w-4 h-4 -ml-2" />
                      </Button>

                      {/* Sélecteur de limite - Mobile */}
                      <div className="flex sm:hidden items-center gap-2 ml-2">
                        <select
                          value={pagination.limit}
                          onChange={(e) => {
                            setPagination((prev) => ({
                              ...prev,
                              limit: parseInt(e.target.value),
                              page: 1,
                            }));
                            fetchEtudiants(1, searchTerm);
                          }}
                          className="px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                        >
                          {[10, 25, 50].map((limit) => (
                            <option key={limit} value={limit}>
                              {limit}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Barre de progression de la page */}
                  {pagination.totalPages > 1 && (
                    <div className="mt-4 pt-3 border-t border-gray-200/50">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          Page {pagination.page} sur {pagination.totalPages}
                        </span>
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-300"
                            style={{
                              width: `${(pagination.page / pagination.totalPages) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Vue Mobile - Cartes */}
          <div className="md:hidden">
            {fetchingEtudiants ? (
              <div className="p-8 flex justify-center">
                <Loading message="Chargement..." />
              </div>
            ) : etudiants.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">Aucun étudiant trouvé</p>
                <Button
                  variant="primary"
                  onClick={openInscriptionModal}
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle inscription
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                <div className="p-4 space-y-4">
                  {etudiants.map((etudiant) => (
                    <EtudiantCard
                      key={etudiant.id}
                      etudiant={etudiant}
                      onViewDetails={openModal}
                    />
                  ))}
                </div>

                {/* Pagination mobile simplifiée */}
                <div className="p-4 bg-gray-50/50 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-600">
                      Page {pagination.page} / {pagination.totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          fetchEtudiants(pagination.page - 1, searchTerm)
                        }
                        // disabled={pagination.page === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          fetchEtudiants(pagination.page + 1, searchTerm)
                        }
                        // disabled={pagination.page === pagination.totalPages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DÉTAILS ÉTUDIANT */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-linear-to-br from-primary-500 to-primary-600 rounded-lg shadow-lg shadow-primary-500/20">
              <User className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Profil étudiant
            </span>
          </div>
        }
        size="4xl"
        className="backdrop-blur-sm"
      >
        {loadingDetail ? (
          <div className="py-16 flex justify-center">
            <Loading message="Chargement du profil..." />
          </div>
        ) : selectedEtudiant ? (
          <div className="space-y-6">
            {/* EN-TÊTE DU PROFIL */}
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-primary-600 to-primary-800">
              <div className="absolute inset-0 bg-black/20" />
              <div className="relative p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30">
                      <span className="text-2xl sm:text-3xl font-bold text-white">
                        {selectedEtudiant.prenom?.charAt(0)}
                        {selectedEtudiant.nom?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                        {selectedEtudiant.nom_complet}
                      </h2>
                      <div className="flex flex-wrap gap-3">
                        <Badge
                          variant="white"
                          className="bg-white/20 text-white border-white/30"
                        >
                          <User className="w-3 h-3 mr-1" />
                          Étudiant
                        </Badge>
                        <Badge
                          variant={
                            selectedEtudiant.actif ? "success" : "danger"
                          }
                          className="border-white/30"
                        >
                          {selectedEtudiant.actif ? "Actif" : "Inactif"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  <div className="flex items-center gap-3 text-white/90">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm truncate">
                      {selectedEtudiant.email || "Email non renseigné"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-white/90">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">
                      {selectedEtudiant.telephone || "Téléphone non renseigné"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-white/90">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm truncate">
                      {selectedEtudiant.adresse || "Adresse non renseignée"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* STATS RAPIDES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <CompactStatCard
                title="Total payé"
                value={`${parseInt(selectedEtudiant.finance?.resume?.montant_paye || 0).toLocaleString()} Ar`}
                icon={DollarSign}
                color="green"
                subtitle="Frais d'inscription"
              />
              <CompactStatCard
                title="Reste à payer"
                value={`${parseInt(selectedEtudiant.finance?.resume?.montant_restant || 0).toLocaleString()} Ar`}
                icon={AlertCircle}
                color="orange"
                subtitle="Écolage + livres"
              />
              <CompactStatCard
                title="Livres"
                value={`${selectedEtudiant.statistiques?.livres?.livres_payes || 0} / ${selectedEtudiant.statistiques?.livres?.total_livres || 0}`}
                icon={BookOpen}
                color="purple"
                subtitle="Payés / Total"
              />
            </div>

            {/* TABS */}
            <div className="border-b border-gray-200">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTab("vagues")}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${
                    activeTab === "vagues"
                      ? "bg-primary-50 text-primary-700 border-b-2 border-primary-600"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <GraduationCap className="w-4 h-4 inline mr-2" />
                  Vagues et livres
                </button>
                <button
                  onClick={() => setActiveTab("paiements")}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${
                    activeTab === "paiements"
                      ? "bg-primary-50 text-primary-700 border-b-2 border-primary-600"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Receipt className="w-4 h-4 inline mr-2" />
                  Historique des paiements
                </button>
              </div>
            </div>

            {/* CONTENU DES TABS */}
            <div className="min-h-100 max-h-100 overflow-y-auto pr-1">
              {/* TAB VAGUES */}
              {activeTab === "vagues" && (
                <div className="space-y-4">
                  {selectedEtudiant.vagues?.length > 0 ? (
                    selectedEtudiant.vagues.map((vague) => (
                      <Card
                        key={vague.inscription_id}
                        className="border border-gray-200 hover:border-primary-200 transition-all"
                      >
                        <div className="p-5">
                          {/* En-tête vague */}
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-primary-100 rounded-lg">
                                <GraduationCap className="w-5 h-5 text-primary-700" />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 text-lg">
                                  {vague.vague_nom}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  {vague.niveau_nom} • {vague.niveau_code}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant={
                                vague.statut_inscription === "actif"
                                  ? "success"
                                  : vague.statut_inscription === "termine"
                                    ? "primary"
                                    : "danger"
                              }
                              className="px-3 py-1.5"
                            >
                              {vague.statut_inscription}
                            </Badge>
                          </div>

                          {/* Grille informations */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex items-center gap-2 text-gray-600 mb-1">
                                <Building className="w-4 h-4" />
                                <span className="text-xs font-medium">
                                  Salle
                                </span>
                              </div>
                              <p className="font-medium text-gray-900">
                                {vague.salle_nom || "Non assignée"}
                              </p>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex items-center gap-2 text-gray-600 mb-1">
                                <User className="w-4 h-4" />
                                <span className="text-xs font-medium">
                                  Enseignant
                                </span>
                              </div>
                              <p className="font-medium text-gray-900">
                                {vague.enseignant_nom || "Non assigné"}
                              </p>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex items-center gap-2 text-gray-600 mb-1">
                                <Clock className="w-4 h-4" />
                                <span className="text-xs font-medium">
                                  Horaires
                                </span>
                              </div>
                              <p className="font-medium text-gray-900">
                                {vague.horaires_resume || "—"}
                              </p>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex items-center gap-2 text-gray-600 mb-1">
                                <Calendar className="w-4 h-4" />
                                <span className="text-xs font-medium">
                                  Inscription
                                </span>
                              </div>
                              <p className="font-medium text-gray-900">
                                {vague.date_inscription
                                  ? format(
                                      new Date(vague.date_inscription),
                                      "dd MMM yyyy",
                                      { locale: fr },
                                    )
                                  : "—"}
                              </p>
                            </div>
                          </div>

                          {/* Statut des livres */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                              <BookOpen className="w-4 h-4 text-gray-600" />
                              <span className="text-xs font-semibold uppercase text-gray-600">
                                Livres
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {[1, 2].map((num) => (
                                <div
                                  key={num}
                                  className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200"
                                >
                                  <span className="text-sm font-medium">
                                    Livre {num}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {vague.livres?.[`livre${num}`]?.paye ? (
                                      <>
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                        <span className="text-sm text-green-700 font-medium">
                                          Payé
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="w-4 h-4 text-red-500" />
                                        <span className="text-sm text-red-600">
                                          Non payé
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-16 bg-gray-50 rounded-xl">
                      <div className="p-4 bg-gray-100 rounded-full inline-flex mx-auto mb-4">
                        <BookOpen className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 font-medium mb-2">
                        Aucune inscription
                      </p>
                      <p className="text-sm text-gray-500">
                        Cet étudiant n'est inscrit à aucune vague
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB PAIEMENTS */}
              {activeTab === "paiements" && (
                <div className="space-y-4">
                  {selectedEtudiant.historique_paiements?.length > 0 ? (
                    <>
                      {/* Résumé financier */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <p className="text-xs text-green-700 mb-1">
                            Total payé
                          </p>
                          <p className="text-2xl font-bold text-green-800">
                            {parseInt(
                              selectedEtudiant.finance?.resume?.montant_paye ||
                                0,
                            ).toLocaleString()}{" "}
                            Ar
                          </p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                          <p className="text-xs text-orange-700 mb-1">
                            Reste à payer
                          </p>
                          <p className="text-2xl font-bold text-orange-800">
                            {parseInt(
                              selectedEtudiant.finance?.resume
                                ?.montant_restant || 0,
                            ).toLocaleString()}{" "}
                            Ar
                          </p>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <p className="text-xs text-blue-700 mb-1">Total dû</p>
                          <p className="text-2xl font-bold text-blue-800">
                            {parseInt(
                              selectedEtudiant.finance?.resume?.montant_total ||
                                0,
                            ).toLocaleString()}{" "}
                            Ar
                          </p>
                        </div>
                      </div>

                      {/* Liste des paiements */}
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-gray-600" />
                        Historique des transactions
                      </h4>

                      <div className="space-y-3">
                        {selectedEtudiant.historique_paiements.map(
                          (paiement, idx) => (
                            <div
                              key={idx}
                              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-start gap-3 mb-2 sm:mb-0">
                                <div className="p-2 bg-green-100 rounded-lg">
                                  <DollarSign className="w-4 h-4 text-green-700" />
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900">
                                    {parseInt(
                                      paiement.montant || 0,
                                    ).toLocaleString()}{" "}
                                    Ar
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {paiement.vague_nom ||
                                      "Vague non spécifiée"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
                                <div className="text-right">
                                  <p className="text-sm text-gray-600">
                                    {paiement.methode_paiement ||
                                      "Méthode non spécifiée"}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {paiement.type_frais || "Frais"}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium text-gray-900">
                                    {format(
                                      new Date(paiement.date_paiement),
                                      "dd MMM yyyy",
                                      { locale: fr },
                                    )}
                                  </p>
                                  <Badge
                                    variant="success"
                                    size="sm"
                                    className="mt-1"
                                  >
                                    Payé
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-16 bg-gray-50 rounded-xl">
                      <div className="p-4 bg-gray-100 rounded-full inline-flex mx-auto mb-4">
                        <DollarSign className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 font-medium mb-2">
                        Aucun paiement enregistré
                      </p>
                      <p className="text-sm text-gray-500">
                        Cet étudiant n'a effectué aucun paiement
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* BOUTONS D'ACTION */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto"
              >
                Fermer
              </Button>
              <Button
                variant="primary"
                className="w-full sm:w-auto shadow-lg shadow-primary-500/20"
                onClick={() => {
                  setIsModalOpen(false);
                  // Ouvrir modal de mise à jour
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Mettre à jour
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="p-4 bg-red-50 rounded-full inline-flex mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-gray-900 font-medium mb-2">
              Erreur de chargement
            </p>
            <p className="text-sm text-gray-500">
              Impossible de charger les informations de l'étudiant
            </p>
          </div>
        )}
      </Modal>

      {/* MODAL INSCRIPTION */}
      <ModalInscriptions
        isOpen={isInscriptionModalOpen}
        onClose={() => setIsInscriptionModalOpen(false)}
        onSuccess={handleInscriptionSuccess}
      />
    </div>
  );
}
