import ModalInscriptions from "@/components/ModalInscription";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Loading from "@/components/ui/Loading";
import Modal from "@/components/ui/Modal";
import { etudiantService, inscriptionService } from "@/services/api";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertCircle,
  BookMarked,
  BookOpen,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Eye,
  Filter,
  GraduationCap,
  Mail,
  Package,
  PackageCheck,
  Phone,
  Plus,
  Receipt,
  RefreshCw,
  Save,
  Search,
  Truck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const fmt = (n) => parseInt(n || 0).toLocaleString("fr-FR");

const StatusBadge = ({ statut }) => {
  const map = {
    actif: { variant: "success", label: "Actif" },
    en_attente: { variant: "warning", label: "En attente" },
    rejetee: { variant: "danger", label: "Rejeté" },
    abandonne: { variant: "danger", label: "Abandonné" },
  };
  const cfg = map[statut] || { variant: "default", label: statut || "N/A" };
  return (
    <Badge variant={cfg.variant} size="sm">
      {cfg.label}
    </Badge>
  );
};

// ─────────────────────────────────────────────
// TOOLTIP
// ─────────────────────────────────────────────
const Tooltip = ({ text, children, disabled = false }) => {
  if (!disabled) return children;
  return (
    <div className="relative group/tip w-full">
      {children}
      <div
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
                      opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150"
      >
        <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg max-w-52 text-center leading-snug">
          {text}
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// COMPOSANT SELECT SIMPLE
// ─────────────────────────────────────────────
const SimpleSelect = ({
  value,
  onChange,
  options,
  required,
  className = "",
}) => (
  <select
    value={value}
    onChange={onChange}
    required={required}
    className={`w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all ${className}`}
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

// ─────────────────────────────────────────────
// PILL FILTRE ACTIF
// ─────────────────────────────────────────────
const FilterPill = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 border border-primary-200 rounded-full text-xs font-medium">
    {label}
    <button
      onClick={onRemove}
      className="hover:text-primary-900 transition-colors"
    >
      <X className="w-3 h-3" />
    </button>
  </span>
);

// ─────────────────────────────────────────────
// CARTE ÉTUDIANT (MOBILE)
// ─────────────────────────────────────────────
const EtudiantCard = ({
  etudiant,
  onViewDetails,
  onAddPaiement,
  onManageLivraison,
}) => {
  const restant = parseInt(etudiant.montant_restant || 0);
  const fraisOk = etudiant.frais_inscription_paye;
  const coursOk = etudiant.livre_cours_paye === "paye";
  const coursLivre = etudiant.livre_cours_livre === "livre";
  const exoOk = etudiant.livre_exercices_paye === "paye";
  const exoLivre = etudiant.livre_exercices_livre === "livre";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {etudiant.prenom?.charAt(0)}
              {etudiant.nom?.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm leading-tight">
                {etudiant.nom} {etudiant.prenom}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">#{etudiant.id}</p>
            </div>
          </div>
          <StatusBadge statut={etudiant.statut_inscription} />
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Contact */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span>{etudiant.telephone || "—"}</span>
          </div>
          {etudiant.email && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate">{etudiant.email}</span>
            </div>
          )}
        </div>

        {/* Niveau / Vague */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-full font-medium">
            {etudiant.niveau_code}
          </span>
          <span className="text-gray-500 truncate">{etudiant.vague_nom}</span>
        </div>

        {/* Finance */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-0.5">Total</p>
            <p className="font-bold text-gray-900">
              {fmt(etudiant.montant_total)}
            </p>
          </div>
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <p className="text-green-600 mb-0.5">Payé</p>
            <p className="font-bold text-green-800">
              {fmt(etudiant.montant_paye)}
            </p>
          </div>
          <div
            className={`text-center p-2 rounded-lg ${restant > 0 ? "bg-orange-50" : "bg-green-50"}`}
          >
            <p
              className={`mb-0.5 ${restant > 0 ? "text-orange-600" : "text-green-600"}`}
            >
              Reste
            </p>
            <p
              className={`font-bold ${restant > 0 ? "text-orange-800" : "text-green-800"}`}
            >
              {fmt(restant)}
            </p>
          </div>
        </div>

        {/* Livres statuts */}
        <div className="flex gap-2">
          <div
            className={`flex-1 flex items-center gap-1.5 p-2 rounded-lg border text-xs ${coursOk ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
          >
            <BookOpen
              className={`w-3.5 h-3.5 ${coursOk ? "text-green-600" : "text-red-500"}`}
            />
            <span className={coursOk ? "text-green-700" : "text-red-600"}>
              Cours
            </span>
            {coursLivre ? (
              <PackageCheck className="w-3 h-3 text-green-600 ml-auto" />
            ) : (
              <Package className="w-3 h-3 text-gray-400 ml-auto" />
            )}
          </div>
          <div
            className={`flex-1 flex items-center gap-1.5 p-2 rounded-lg border text-xs ${exoOk ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
          >
            <BookMarked
              className={`w-3.5 h-3.5 ${exoOk ? "text-green-600" : "text-red-500"}`}
            />
            <span className={exoOk ? "text-green-700" : "text-red-600"}>
              Exo.
            </span>
            {exoLivre ? (
              <PackageCheck className="w-3 h-3 text-green-600 ml-auto" />
            ) : (
              <Package className="w-3 h-3 text-gray-400 ml-auto" />
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={() => onAddPaiement(etudiant)}
          title="Ajouter un paiement"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
        >
          <DollarSign className="w-3.5 h-3.5" /> Paiement
        </button>
        <button
          onClick={() => onManageLivraison(etudiant)}
          title="Gérer livraison"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
        >
          <Truck className="w-3.5 h-3.5" /> Livraison
        </button>
        <button
          onClick={() => onViewDetails(etudiant)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
        >
          <Eye className="w-3.5 h-3.5" /> Détails
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// MODAL AJOUT PAIEMENT
// ─────────────────────────────────────────────
const ModalAddPaiement = ({ isOpen, onClose, inscription, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type_paiement: "inscription",
    type_livre: "",
    montant: "",
    date_paiement: new Date().toISOString().split("T")[0],
    methode_paiement: "especes",
    reference_mvola: "",
    remarques: "",
  });

  useEffect(() => {
    if (isOpen && inscription) {
      // Auto-sélectionner le bon type au chargement
      const fraisPaye = inscription.frais_inscription_paye;
      const defaultType = fraisPaye ? "livre" : "inscription";
      const defaultMontant = fraisPaye
        ? ""
        : inscription.montant_frais_inscription || "";

      setFormData({
        type_paiement: defaultType,
        type_livre: "",
        montant: defaultMontant,
        date_paiement: new Date().toISOString().split("T")[0],
        methode_paiement: "especes",
        reference_mvola: "",
        remarques: "",
      });
    }
  }, [isOpen, inscription]);

  const handleTypePaiementChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      type_paiement: type,
      type_livre: type === "livre" ? prev.type_livre : "",
      montant:
        type === "inscription"
          ? inscription?.montant_frais_inscription || ""
          : "",
    }));
  };

  const handleTypeLivreChange = (typeLivre) => {
    setFormData((prev) => ({
      ...prev,
      type_livre: typeLivre,
      montant:
        typeLivre === "cours"
          ? inscription?.prix_livre_cours || ""
          : typeLivre === "exercices"
            ? inscription?.prix_livre_exercices || ""
            : "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await inscriptionService.addPaiement({
        inscription_id: inscription.inscription_id,
        ...formData,
        montant: parseFloat(formData.montant),
      });
      toast.success("Paiement enregistré avec succès");
      onSuccess();
      onClose();
      setFormData({
        type_paiement: "inscription",
        type_livre: "",
        montant: "",
        date_paiement: new Date().toISOString().split("T")[0],
        methode_paiement: "especes",
        reference_mvola: "",
        remarques: "",
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erreur lors de l'ajout du paiement",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!inscription) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <DollarSign className="w-5 h-5 text-green-700" />
          </div>
          <span className="text-xl font-bold text-gray-900">
            Enregistrer un paiement
          </span>
        </div>
      }
      size="2xl"
    >
      {/* Bannière si tout est déjà payé */}
      {inscription.frais_inscription_paye &&
        inscription.livre_cours_paye === "paye" &&
        inscription.livre_exercices_paye === "paye" && (
          <div className="mb-4 flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
            <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
            <div>
              <p className="font-semibold">Tout est réglé !</p>
              <p className="text-xs text-green-600 mt-0.5">
                Les frais d'inscription et les deux livres ont été entièrement
                payés.
              </p>
            </div>
          </div>
        )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Info étudiant */}
        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {inscription.prenom?.charAt(0)}
            {inscription.nom?.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">
              {inscription.nom} {inscription.prenom}
            </p>
            <p className="text-xs text-gray-500">
              Inscription #{inscription.inscription_id}
            </p>
          </div>
        </div>

        {/* Type paiement */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type de paiement *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(() => {
              const fraisPaye = inscription.frais_inscription_paye;
              const tousLivresPayes =
                inscription.livre_cours_paye === "paye" &&
                inscription.livre_exercices_paye === "paye";

              return [
                {
                  value: "inscription",
                  label: "Frais d'inscription",
                  icon: Receipt,
                  disabled: !!fraisPaye,
                  tooltip:
                    "Les frais d'inscription sont déjà entièrement payés",
                },
                {
                  value: "livre",
                  label: "Livre",
                  icon: BookOpen,
                  disabled: tousLivresPayes,
                  tooltip: "Les deux livres sont déjà payés",
                },
              ].map(({ value, label, icon: Icon, disabled, tooltip }) => (
                <Tooltip key={value} text={tooltip} disabled={disabled}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => !disabled && handleTypePaiementChange(value)}
                    className={`w-full flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all
                      ${
                        disabled
                          ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                          : formData.type_paiement === value
                            ? "border-primary-500 bg-primary-50 text-primary-700"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="flex-1 text-left">{label}</span>
                    {disabled && (
                      <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                    )}
                  </button>
                </Tooltip>
              ));
            })()}
          </div>
        </div>

        {/* Type livre */}
        {formData.type_paiement === "livre" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de livre *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  value: "cours",
                  label: "Cours",
                  price: inscription.prix_livre_cours,
                  icon: BookOpen,
                  disabled: inscription.livre_cours_paye === "paye",
                  tooltip: "Le livre de cours est déjà payé",
                },
                {
                  value: "exercices",
                  label: "Exercices",
                  price: inscription.prix_livre_exercices,
                  icon: BookMarked,
                  disabled: inscription.livre_exercices_paye === "paye",
                  tooltip: "Le livre d'exercices est déjà payé",
                },
              ].map(
                ({ value, label, price, icon: Icon, disabled, tooltip }) => (
                  <Tooltip key={value} text={tooltip} disabled={disabled}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => !disabled && handleTypeLivreChange(value)}
                      className={`w-full flex flex-col items-start gap-1 p-3 rounded-xl border text-sm transition-all
                      ${
                        disabled
                          ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                          : formData.type_livre === value
                            ? "border-purple-500 bg-purple-50 text-purple-700"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-medium w-full">
                        <Icon className="w-4 h-4" />
                        <span className="flex-1">{label}</span>
                        {disabled && (
                          <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                        )}
                      </div>
                      <span
                        className={`text-xs ${disabled ? "text-gray-300" : "opacity-70"}`}
                      >
                        {fmt(price)} Ar {disabled ? "· Payé" : ""}
                      </span>
                    </button>
                  </Tooltip>
                ),
              )}
            </div>

            {/* Alerte si les deux livres sont déjà payés (ne devrait pas arriver grâce au disabled sur "Livre") */}
            {inscription.livre_cours_paye === "paye" &&
              inscription.livre_exercices_paye === "paye" && (
                <div className="mt-2 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  Tous les livres ont été payés
                </div>
              )}
          </div>
        )}

        {/* Montant */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Montant (Ar) *
          </label>
          <Input
            type="number"
            value={formData.montant}
            onChange={(e) =>
              setFormData({ ...formData, montant: e.target.value })
            }
            required
            min="1"
            placeholder="0"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date *
          </label>
          <Input
            type="date"
            value={formData.date_paiement}
            onChange={(e) =>
              setFormData({ ...formData, date_paiement: e.target.value })
            }
            required
          />
        </div>

        {/* Méthode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Méthode *
          </label>
          <SimpleSelect
            value={formData.methode_paiement}
            onChange={(e) =>
              setFormData({ ...formData, methode_paiement: e.target.value })
            }
            required
            options={[
              { value: "especes", label: "Espèces" },
              { value: "mvola", label: "MVola" },
            ]}
          />
        </div>

        {formData.methode_paiement === "mvola" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Référence MVola *
            </label>
            <Input
              value={formData.reference_mvola}
              onChange={(e) =>
                setFormData({ ...formData, reference_mvola: e.target.value })
              }
              placeholder="Ex: 034XXXXXXX"
              required
            />
          </div>
        )}

        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />{" "}
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" /> Enregistrer
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ─────────────────────────────────────────────
// MODAL LIVRAISON
// ─────────────────────────────────────────────
const ModalLivraison = ({ isOpen, onClose, inscription, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [livreType, setLivreType] = useState("cours");
  const [action, setAction] = useState("");

  const handleAction = async () => {
    if (!action) return;
    setLoading(true);
    try {
      const updates =
        action === "payer"
          ? { statut_paiement: "paye" }
          : { statut_livraison: "livre" };
      await inscriptionService.updateLivreStatut(
        inscription.inscription_id,
        livreType,
        updates,
      );
      toast.success(
        action === "payer"
          ? "Livre marqué comme payé"
          : "Livre marqué comme livré",
      );
      onSuccess();
      onClose();
      setAction("");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erreur lors de la mise à jour",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!inscription) return null;

  const livre =
    livreType === "cours"
      ? {
          paye: inscription.livre_cours_paye === "paye",
          livre: inscription.livre_cours_livre === "livre",
        }
      : {
          paye: inscription.livre_exercices_paye === "paye",
          livre: inscription.livre_exercices_livre === "livre",
        };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestion des livres"
      size="lg"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {[
            {
              value: "cours",
              label: "Livre de cours",
              icon: BookOpen,
              color: "blue",
              paye: inscription.livre_cours_paye === "paye",
              livre: inscription.livre_cours_livre === "livre",
            },
            {
              value: "exercices",
              label: "Livre d'exercices",
              icon: BookMarked,
              color: "purple",
              paye: inscription.livre_exercices_paye === "paye",
              livre: inscription.livre_exercices_livre === "livre",
            },
          ].map(
            ({ value, label, icon: Icon, color, paye, livre: estLivre }) => {
              const toutTraite = paye && estLivre;
              return (
                <Tooltip
                  key={value}
                  text="Paiement et livraison déjà effectués"
                  disabled={toutTraite}
                >
                  <button
                    onClick={() => {
                      setLivreType(value);
                      setAction("");
                    }}
                    className={`relative w-full p-3 border-2 rounded-xl transition-all text-sm font-medium flex flex-col items-center gap-1.5
                    ${
                      livreType === value
                        ? `border-${color}-500 bg-${color}-50 text-${color}-700`
                        : toutTraite
                          ? "border-gray-100 bg-gray-50 text-gray-400"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                    {/* Badges statut miniatures */}
                    <div className="flex gap-1 mt-0.5">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${paye ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
                      >
                        {paye ? "Payé" : "Non payé"}
                      </span>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${estLivre ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-600"}`}
                      >
                        {estLivre ? "Livré" : "Non livré"}
                      </span>
                    </div>
                  </button>
                </Tooltip>
              );
            },
          )}
        </div>

        {/* Statut actuel */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Statut actuel
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <DollarSign className="w-4 h-4 text-gray-400" />
              Paiement
            </div>
            <Badge variant={livre.paye ? "success" : "danger"}>
              {livre.paye ? "Payé" : "Non payé"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Truck className="w-4 h-4 text-gray-400" />
              Livraison
            </div>
            <Badge variant={livre.livre ? "success" : "warning"}>
              {livre.livre ? "Livré" : "Non livré"}
            </Badge>
          </div>
        </div>

        {/* Actions disponibles */}
        <div className="space-y-2">
          {/* Marquer comme payé */}
          <Tooltip
            text="Ce livre est déjà marqué comme payé"
            disabled={livre.paye}
          >
            <button
              disabled={livre.paye}
              onClick={() => !livre.paye && setAction("payer")}
              className={`w-full p-3 rounded-xl border-2 text-left text-sm font-medium transition-all flex items-center gap-3
                ${
                  livre.paye
                    ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                    : action === "payer"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 text-gray-700 hover:border-green-300"
                }`}
            >
              <CheckCircle
                className={`w-4 h-4 shrink-0 ${livre.paye ? "text-green-400" : ""}`}
              />
              <span className="flex-1">Marquer comme payé</span>
              {livre.paye && (
                <span className="text-xs font-semibold text-green-500 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                  Déjà payé
                </span>
              )}
            </button>
          </Tooltip>

          {/* Marquer comme livré */}
          <Tooltip
            text="Ce livre est déjà marqué comme livré"
            disabled={livre.livre}
          >
            <button
              disabled={livre.livre}
              onClick={() => !livre.livre && setAction("livrer")}
              className={`w-full p-3 rounded-xl border-2 text-left text-sm font-medium transition-all flex items-center gap-3
                ${
                  livre.livre
                    ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                    : action === "livrer"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-700 hover:border-blue-300"
                }`}
            >
              <Truck
                className={`w-4 h-4 shrink-0 ${livre.livre ? "text-blue-400" : ""}`}
              />
              <span className="flex-1">Marquer comme livré</span>
              {livre.livre && (
                <span className="text-xs font-semibold text-blue-500 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                  Déjà livré
                </span>
              )}
            </button>
          </Tooltip>

          {/* Message tout traité */}
          {livre.paye && livre.livre && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-green-500" />
              Ce livre est entièrement traité
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Fermer
          </Button>
          {action && (
            <Button
              variant="primary"
              onClick={handleAction}
              className="flex-1"
              disabled={loading}
            >
              {loading ? "Traitement..." : "Confirmer"}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

// ─────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────
export default function ListeEtudiant() {
  const [etudiants, setEtudiants] = useState([]);
  const [fetchingEtudiants, setFetchingEtudiants] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Filtres étendus
  const [filters, setFilters] = useState({
    actif: "",
    frais_non_paye: false, // frais d'inscription non payés
    livre_non_paye: false, // au moins un livre non payé
    livre_non_livre: false, // au moins un livre non livré
  });

  const [selectedEtudiant, setSelectedEtudiant] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInscriptionModalOpen, setIsInscriptionModalOpen] = useState(false);
  const [isPaiementModalOpen, setIsPaiementModalOpen] = useState(false);
  const [isLivraisonModalOpen, setIsLivraisonModalOpen] = useState(false);
  const [selectedEtudiantForAction, setSelectedEtudiantForAction] =
    useState(null);
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
      const params = { page, search, limit: pagination.limit };
      if (filters.actif) params.actif = filters.actif === "true";
      if (filters.frais_non_paye) params.frais_inscription_paye = false;
      if (filters.livre_non_paye) params.livre_non_paye = true;
      if (filters.livre_non_livre) params.livre_non_livre = true;

      const res = await etudiantService.getWithDetails(params);
      setEtudiants(res.data || []);
      setPagination((prev) => ({
        ...prev,
        total: res.total || 0,
        page: res.page || 1,
        totalPages: Math.ceil((res.total || 0) / prev.limit),
      }));
    } catch (error) {
      toast.error("Erreur lors du chargement des étudiants");
    } finally {
      setFetchingEtudiants(false);
    }
  };

  const fetchEtudiantDetails = async (id) => {
    setLoadingDetail(true);
    try {
      const res = await etudiantService.getWithDetails(id);
      setSelectedEtudiant(res.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des détails");
      setSelectedEtudiant(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchEtudiants(1, searchTerm);
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(() => fetchEtudiants(1, searchTerm), 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const openModal = async (etudiant) => {
    setSelectedEtudiant(null);
    setIsModalOpen(true);
    setActiveTab("vagues");
    await fetchEtudiantDetails(etudiant.id);
  };

  const resetFilters = () => {
    setFilters({
      actif: "",
      frais_non_paye: false,
      livre_non_paye: false,
      livre_non_livre: false,
    });
    setSearchTerm("");
  };

  // Compte les filtres actifs
  const activeFilterCount = [
    filters.actif,
    filters.frais_non_paye,
    filters.livre_non_paye,
    filters.livre_non_livre,
  ].filter(Boolean).length;

  const toggleFilter = (key) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-600 rounded-xl shadow-lg shadow-primary-500/20 shrink-0">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Gestion des étudiants
                </h1>
                <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
                  {pagination.total} étudiant{pagination.total > 1 ? "s" : ""}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                Inscriptions, paiements et livraisons
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsInscriptionModalOpen(true)}
            variant="primary"
            className="w-full sm:w-auto shadow-lg shadow-primary-500/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle inscription
          </Button>
        </div>

        {/* ── BARRE RECHERCHE + FILTRES ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5">
            {/* Ligne principale */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Recherche */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, téléphone, email..."
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Bouton filtres */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  showFilters || activeFilterCount > 0
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                }`}
              >
                <Filter className="w-4 h-4" />
                Filtres
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Pills filtres actifs */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {filters.actif && (
                  <FilterPill
                    label={
                      filters.actif === "true"
                        ? "Actifs seulement"
                        : "Inactifs seulement"
                    }
                    onRemove={() => setFilters((p) => ({ ...p, actif: "" }))}
                  />
                )}
                {filters.frais_non_paye && (
                  <FilterPill
                    label="Frais non payés"
                    onRemove={() => toggleFilter("frais_non_paye")}
                  />
                )}
                {filters.livre_non_paye && (
                  <FilterPill
                    label="Livres non payés"
                    onRemove={() => toggleFilter("livre_non_paye")}
                  />
                )}
                {filters.livre_non_livre && (
                  <FilterPill
                    label="Livres non livrés"
                    onRemove={() => toggleFilter("livre_non_livre")}
                  />
                )}
                <button
                  onClick={resetFilters}
                  className="text-xs text-gray-500 hover:text-red-600 underline transition-colors"
                >
                  Tout effacer
                </button>
              </div>
            )}

            {/* Panneau filtres */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Statut */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Statut étudiant
                    </label>
                    <SimpleSelect
                      value={filters.actif}
                      onChange={(e) => {
                        setFilters({ ...filters, actif: e.target.value });
                        setPagination((prev) => ({ ...prev, page: 1 }));
                      }}
                      options={[
                        { value: "", label: "Tous" },
                        { value: "true", label: "Actifs" },
                        { value: "false", label: "Inactifs" },
                      ]}
                    />
                  </div>

                  {/* Frais non payés */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Paiement inscription
                    </label>
                    <button
                      onClick={() => toggleFilter("frais_non_paye")}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                        filters.frais_non_paye
                          ? "border-red-400 bg-red-50 text-red-700"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <XCircle
                        className={`w-4 h-4 ${filters.frais_non_paye ? "text-red-500" : "text-gray-400"}`}
                      />
                      Frais non payés
                    </button>
                  </div>

                  {/* Livres non payés */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Paiement livres
                    </label>
                    <button
                      onClick={() => toggleFilter("livre_non_paye")}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                        filters.livre_non_paye
                          ? "border-orange-400 bg-orange-50 text-orange-700"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <BookOpen
                        className={`w-4 h-4 ${filters.livre_non_paye ? "text-orange-500" : "text-gray-400"}`}
                      />
                      Livres non payés
                    </button>
                  </div>

                  {/* Livres non livrés */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Livraison
                    </label>
                    <button
                      onClick={() => toggleFilter("livre_non_livre")}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                        filters.livre_non_livre
                          ? "border-blue-400 bg-blue-50 text-blue-700"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <Truck
                        className={`w-4 h-4 ${filters.livre_non_livre ? "text-blue-500" : "text-gray-400"}`}
                      />
                      Non livrés
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={resetFilters}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Réinitialiser les filtres
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── LISTE ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* En-tête */}
          <div className="px-4 sm:px-6 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
              <Users className="w-4 h-4" />
              Liste des étudiants
            </div>
            <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
              {pagination.total} résultat{pagination.total > 1 ? "s" : ""}
            </span>
          </div>

          {/* Vue DESKTOP – Tableau */}
          <div className="hidden lg:block overflow-x-auto">
            {fetchingEtudiants ? (
              <div className="p-16 flex justify-center">
                <Loading message="Chargement des étudiants..." />
              </div>
            ) : etudiants.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="font-semibold text-gray-900 mb-1">
                  Aucun étudiant trouvé
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  {searchTerm || activeFilterCount > 0
                    ? "Essayez de modifier vos filtres"
                    : "Commencez par inscrire votre premier étudiant"}
                </p>
                <Button
                  variant="primary"
                  onClick={() => setIsInscriptionModalOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" /> Nouvelle inscription
                </Button>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    {[
                      "Étudiant",
                      "Contact",
                      "Inscription",
                      "Niveau / Vague",
                      "Finances",
                      "Livres",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {etudiants.map((e) => {
                    const restant = parseInt(e.montant_restant || 0);
                    return (
                      <tr
                        key={e.id}
                        className="hover:bg-gray-50/80 transition-colors group"
                      >
                        {/* Étudiant */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-primary-700">
                                {e.prenom?.charAt(0)}
                                {e.nom?.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 leading-tight">
                                {e.nom} {e.prenom}
                              </p>
                              <p className="text-xs text-gray-400">#{e.id}</p>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <Phone className="w-3 h-3 text-gray-400" />
                              {e.telephone || "—"}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Mail className="w-3 h-3 text-gray-400" />
                              <span className="truncate max-w-36">
                                {e.email || "—"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Inscription */}
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <StatusBadge statut={e.statut_inscription} />
                            <p className="text-xs text-gray-400">
                              {e.date_inscription
                                ? format(
                                    new Date(e.date_inscription),
                                    "dd/MM/yyyy",
                                    { locale: fr },
                                  )
                                : "—"}
                            </p>
                          </div>
                        </td>

                        {/* Niveau / Vague */}
                        <td className="px-4 py-3">
                          <span className="inline-block px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-full text-xs font-semibold mb-1">
                            {e.niveau_code}
                          </span>
                          <p className="text-xs text-gray-500">
                            {e.vague_nom || "—"}
                          </p>
                        </td>

                        {/* Finances */}
                        <td className="px-4 py-3">
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-gray-500">Frais</span>
                              <div className="flex items-center gap-1">
                                <span className="font-medium text-gray-700">
                                  {fmt(e.montant_frais_inscription)} Ar
                                </span>
                                {e.frais_inscription_paye ? (
                                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-green-600">Payé</span>
                              <span className="font-semibold text-green-700">
                                {fmt(e.montant_paye)} Ar
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span
                                className={
                                  restant > 0
                                    ? "text-orange-600"
                                    : "text-gray-400"
                                }
                              >
                                Reste
                              </span>
                              <span
                                className={`font-bold ${restant > 0 ? "text-orange-700" : "text-gray-400"}`}
                              >
                                {fmt(restant)} Ar
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Livres */}
                        <td className="px-4 py-3">
                          <div className="space-y-1.5">
                            {/* Cours */}
                            <div className="flex items-center gap-1.5 text-xs">
                              <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-gray-600">Cours</span>
                              {e.livre_cours_paye === "paye" ? (
                                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 text-red-400" />
                              )}
                              {e.livre_cours_livre === "livre" ? (
                                <PackageCheck className="w-3.5 h-3.5 text-green-500" />
                              ) : (
                                <Package className="w-3.5 h-3.5 text-gray-400" />
                              )}
                            </div>
                            {/* Exercices */}
                            <div className="flex items-center gap-1.5 text-xs">
                              <BookMarked className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-gray-600">Exo.</span>
                              {e.livre_exercices_paye === "paye" ? (
                                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 text-red-400" />
                              )}
                              {e.livre_exercices_livre === "livre" ? (
                                <PackageCheck className="w-3.5 h-3.5 text-green-500" />
                              ) : (
                                <Package className="w-3.5 h-3.5 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setSelectedEtudiantForAction(e);
                                setIsPaiementModalOpen(true);
                              }}
                              title="Ajouter un paiement"
                              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-green-700 hover:border-green-300 hover:bg-green-50 transition-all"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedEtudiantForAction(e);
                                setIsLivraisonModalOpen(true);
                              }}
                              title="Gérer livraison"
                              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50 transition-all"
                            >
                              <Truck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openModal(e)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-lg transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Détails
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Vue TABLET – grille 2 colonnes */}
          <div className="hidden sm:grid lg:hidden grid-cols-2 gap-4 p-4">
            {fetchingEtudiants ? (
              <div className="col-span-2 p-12 flex justify-center">
                <Loading message="Chargement..." />
              </div>
            ) : etudiants.length === 0 ? (
              <div className="col-span-2 p-12 text-center text-gray-500">
                Aucun étudiant trouvé
              </div>
            ) : (
              etudiants.map((e) => (
                <EtudiantCard
                  key={e.id}
                  etudiant={e}
                  onViewDetails={openModal}
                  onAddPaiement={(et) => {
                    setSelectedEtudiantForAction(et);
                    setIsPaiementModalOpen(true);
                  }}
                  onManageLivraison={(et) => {
                    setSelectedEtudiantForAction(et);
                    setIsLivraisonModalOpen(true);
                  }}
                />
              ))
            )}
          </div>

          {/* Vue MOBILE – 1 colonne */}
          <div className="sm:hidden space-y-3 p-3">
            {fetchingEtudiants ? (
              <div className="p-12 flex justify-center">
                <Loading message="Chargement..." />
              </div>
            ) : etudiants.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500 text-sm">Aucun étudiant trouvé</p>
                <button
                  onClick={() => setIsInscriptionModalOpen(true)}
                  className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-primary-600 text-white text-sm rounded-xl"
                >
                  <Plus className="w-4 h-4" /> Nouvelle inscription
                </button>
              </div>
            ) : (
              etudiants.map((e) => (
                <EtudiantCard
                  key={e.id}
                  etudiant={e}
                  onViewDetails={openModal}
                  onAddPaiement={(et) => {
                    setSelectedEtudiantForAction(et);
                    setIsPaiementModalOpen(true);
                  }}
                  onManageLivraison={(et) => {
                    setSelectedEtudiantForAction(et);
                    setIsLivraisonModalOpen(true);
                  }}
                />
              ))
            )}
          </div>

          {/* ── PAGINATION ── */}
          {!fetchingEtudiants && etudiants.length > 0 && (
            <div className="px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 order-2 sm:order-1 text-xs text-gray-600">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200">
                  {pagination.total > 0 ? (
                    <>
                      <span className="font-bold text-primary-600">
                        {(pagination.page - 1) * pagination.limit + 1}
                      </span>
                      <span className="text-gray-400">–</span>
                      <span className="font-bold text-primary-600">
                        {Math.min(
                          pagination.page * pagination.limit,
                          pagination.total,
                        )}
                      </span>
                      <span className="text-gray-400">sur</span>
                      <span className="font-bold text-gray-900">
                        {pagination.total}
                      </span>
                    </>
                  ) : (
                    <span>Aucun résultat</span>
                  )}
                </div>
                {/* Lignes par page */}
                <div className="hidden sm:flex items-center gap-1.5">
                  <span className="text-gray-500">Lignes :</span>
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
                    className="px-2 py-1 text-xs bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/20"
                  >
                    {[10, 25, 50, 100].map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1.5 order-1 sm:order-2">
                <button
                  onClick={() => {
                    setPagination((p) => ({ ...p, page: p.page - 1 }));
                    fetchEtudiants(pagination.page - 1, searchTerm);
                  }}
                  disabled={pagination.page <= 1}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Préc.
                </button>

                {/* Pages */}
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from(
                    { length: Math.min(5, pagination.totalPages) },
                    (_, i) => {
                      let page;
                      if (pagination.totalPages <= 5) page = i + 1;
                      else if (pagination.page <= 3) page = i + 1;
                      else if (pagination.page >= pagination.totalPages - 2)
                        page = pagination.totalPages - 4 + i;
                      else page = pagination.page - 2 + i;
                      return (
                        <button
                          key={page}
                          onClick={() => {
                            setPagination((p) => ({ ...p, page }));
                            fetchEtudiants(page, searchTerm);
                          }}
                          className={`w-8 h-8 text-xs font-medium rounded-lg transition-all ${
                            pagination.page === page
                              ? "bg-primary-600 text-white shadow-sm"
                              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    },
                  )}
                </div>

                <span className="sm:hidden text-xs text-gray-500 px-2">
                  Page {pagination.page}/{pagination.totalPages}
                </span>

                <button
                  onClick={() => {
                    setPagination((p) => ({ ...p, page: p.page + 1 }));
                    fetchEtudiants(pagination.page + 1, searchTerm);
                  }}
                  disabled={pagination.page >= pagination.totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Suiv. <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── MODALS ── */}
        <ModalInscriptions
          isOpen={isInscriptionModalOpen}
          onClose={() => setIsInscriptionModalOpen(false)}
          onSuccess={() => fetchEtudiants(pagination.page, searchTerm)}
        />

        <ModalAddPaiement
          isOpen={isPaiementModalOpen}
          onClose={() => {
            setIsPaiementModalOpen(false);
            setSelectedEtudiantForAction(null);
          }}
          inscription={selectedEtudiantForAction}
          onSuccess={() => {
            fetchEtudiants(pagination.page, searchTerm);
            if (selectedEtudiant) openModal(selectedEtudiant);
          }}
        />

        <ModalLivraison
          isOpen={isLivraisonModalOpen}
          onClose={() => {
            setIsLivraisonModalOpen(false);
            setSelectedEtudiantForAction(null);
          }}
          inscription={selectedEtudiantForAction}
          onSuccess={() => {
            fetchEtudiants(pagination.page, searchTerm);
            if (selectedEtudiant) openModal(selectedEtudiant);
          }}
        />

        {/* Modal détails étudiant */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={
            selectedEtudiant ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold shrink-0">
                  {selectedEtudiant.prenom?.charAt(0)}
                  {selectedEtudiant.nom?.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-900">
                    {selectedEtudiant.nom} {selectedEtudiant.prenom}
                  </p>
                  <p className="text-xs text-gray-500">
                    #{selectedEtudiant.id}
                  </p>
                </div>
              </div>
            ) : (
              "Détails étudiant"
            )
          }
          size="4xl"
        >
          {loadingDetail ? (
            <div className="p-16 flex justify-center">
              <Loading message="Chargement..." />
            </div>
          ) : selectedEtudiant ? (
            <div className="space-y-6">
              {/* Tabs */}
              <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
                {[
                  { key: "vagues", label: "Inscriptions", icon: GraduationCap },
                  { key: "paiements", label: "Paiements", icon: Receipt },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      activeTab === key
                        ? "bg-white text-primary-700 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>

              {/* Tab inscriptions */}
              {activeTab === "vagues" && (
                <div className="space-y-4">
                  {selectedEtudiant.inscriptions?.length > 0 ? (
                    selectedEtudiant.inscriptions.map((insc, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-200 rounded-xl overflow-hidden"
                      >
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-gray-500" />
                            <span className="font-semibold text-sm text-gray-900">
                              {insc.vague_nom}
                            </span>
                          </div>
                          <StatusBadge statut={insc.statut_inscription} />
                        </div>
                        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">
                              Niveau
                            </p>
                            <p className="font-semibold text-gray-900">
                              {insc.niveau_code}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">Date</p>
                            <p className="font-semibold text-gray-900">
                              {insc.date_inscription
                                ? format(
                                    new Date(insc.date_inscription),
                                    "dd/MM/yyyy",
                                    { locale: fr },
                                  )
                                : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">
                              Livres payés
                            </p>
                            <p className="font-semibold text-gray-900">
                              {insc.livres_payes}/2
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">
                              Livres livrés
                            </p>
                            <p className="font-semibold text-gray-900">
                              {insc.livres_livres}/2
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 bg-gray-50 rounded-xl">
                      <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">
                        Aucune inscription
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab paiements */}
              {activeTab === "paiements" && (
                <div className="space-y-4">
                  {selectedEtudiant.historique_paiements?.length > 0 ? (
                    <>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          {
                            label: "Payé",
                            value:
                              selectedEtudiant.finance?.resume?.montant_paye,
                            color: "green",
                          },
                          {
                            label: "Reste",
                            value:
                              selectedEtudiant.finance?.resume?.montant_restant,
                            color: "orange",
                          },
                          {
                            label: "Total dû",
                            value:
                              selectedEtudiant.finance?.resume?.montant_total,
                            color: "blue",
                          },
                        ].map(({ label, value, color }) => (
                          <div
                            key={label}
                            className={`p-3 sm:p-4 rounded-xl bg-${color}-50 border border-${color}-200`}
                          >
                            <p className={`text-xs text-${color}-700 mb-1`}>
                              {label}
                            </p>
                            <p
                              className={`text-lg sm:text-2xl font-bold text-${color}-800`}
                            >
                              {fmt(value)} Ar
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2">
                        {selectedEtudiant.historique_paiements.map((p, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-100 rounded-lg shrink-0">
                                <DollarSign className="w-4 h-4 text-green-700" />
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 text-sm">
                                  {fmt(p.montant)} Ar
                                </p>
                                <p className="text-xs text-gray-500">
                                  {p.methode_paiement} ·{" "}
                                  {p.type_frais || p.type_paiement}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-medium text-gray-700">
                                {format(
                                  new Date(p.date_paiement),
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
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-16 bg-gray-50 rounded-xl">
                      <DollarSign className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">
                        Aucun paiement enregistré
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Fermer
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Erreur de chargement</p>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
