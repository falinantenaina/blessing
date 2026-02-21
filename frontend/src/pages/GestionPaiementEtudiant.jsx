import Button from "@/components/ui/Button";
import Loading from "@/components/ui/Loading";
import Modal from "@/components/ui/Modal";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  BookMarked,
  BookOpen,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Filter,
  GraduationCap,
  Phone,
  Plus,
  Receipt,
  RefreshCw,
  Save,
  Search,
  Smartphone,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { inscriptionService, paiementService } from "../services/api";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const fmt = (n) => parseInt(n || 0).toLocaleString("fr-FR");
const fmtDec = (n) =>
  parseFloat(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 0 });

const TYPE_LABELS = {
  inscription: { label: "Inscription", color: "blue", icon: GraduationCap },
  livre: { label: "Livre", color: "purple", icon: BookOpen },
};

const METHODE_LABELS = {
  especes: { label: "Espèces", icon: Wallet },
  mvola: { label: "MVola", icon: Smartphone },
};

const LIVRE_LABELS = {
  cours: "Cours",
  exercices: "Exercices",
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
// FILTRE PILL
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
// STAT CARD
// ─────────────────────────────────────────────
const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "blue",
  trend,
}) => {
  const colors = {
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: "text-blue-600",
      text: "text-blue-800",
      iconBg: "bg-blue-100",
    },
    green: {
      bg: "bg-green-50",
      border: "border-green-200",
      icon: "text-green-600",
      text: "text-green-800",
      iconBg: "bg-green-100",
    },
    orange: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      icon: "text-orange-600",
      text: "text-orange-800",
      iconBg: "bg-orange-100",
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      icon: "text-purple-600",
      text: "text-purple-800",
      iconBg: "bg-purple-100",
    },
  };
  const c = colors[color];
  return (
    <div
      className={`${c.bg} ${c.border} border rounded-2xl p-4 sm:p-5 hover:shadow-md transition-all duration-200`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 ${c.iconBg} rounded-xl`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? "text-green-600" : "text-red-500"}`}
          >
            {trend >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className={`text-2xl font-bold ${c.text} leading-tight`}>{value}</p>
      <p className="text-xs font-semibold text-gray-600 mt-1">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  );
};

// ─────────────────────────────────────────────
// CARTE PAIEMENT (MOBILE)
// ─────────────────────────────────────────────
const PaiementCard = ({ paiement }) => {
  const typeCfg = TYPE_LABELS[paiement.type_paiement] || {
    label: paiement.type_paiement,
    color: "blue",
    icon: Receipt,
  };
  const TypeIcon = typeCfg.icon;
  const methodeCfg = METHODE_LABELS[paiement.methode_paiement] || {
    label: paiement.methode_paiement,
    icon: Wallet,
  };
  const MethodeIcon = methodeCfg.icon;

  const colorMap = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl border ${colorMap[typeCfg.color] || colorMap.blue}`}
          >
            <TypeIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">
              {typeCfg.label}
              {paiement.type_livre && (
                <span className="ml-1.5 text-xs font-normal text-gray-500">
                  · {LIVRE_LABELS[paiement.type_livre] || paiement.type_livre}
                </span>
              )}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {paiement.date_paiement
                ? format(new Date(paiement.date_paiement), "dd MMM yyyy", {
                    locale: fr,
                  })
                : "—"}
            </p>
          </div>
        </div>
        <p className="text-lg font-bold text-gray-900">
          {fmt(paiement.montant)}{" "}
          <span className="text-xs font-normal text-gray-400">Ar</span>
        </p>
      </div>

      {/* Étudiant */}
      <div className="flex items-center gap-2 mb-3 py-2 px-3 bg-gray-50 rounded-lg">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {paiement.etudiant_prenom?.charAt(0)}
          {paiement.etudiant_nom?.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-800 truncate">
            {paiement.etudiant_nom} {paiement.etudiant_prenom}
          </p>
          {paiement.etudiant_telephone && (
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {paiement.etudiant_telephone}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <MethodeIcon className="w-3.5 h-3.5 text-gray-400" />
          {methodeCfg.label}
          {paiement.reference_mvola && (
            <span className="text-gray-400">· {paiement.reference_mvola}</span>
          )}
        </div>
        <span className="text-xs text-gray-400">
          {paiement.vague_nom || "—"}
        </span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// SIMPLE SELECT
// ─────────────────────────────────────────────
const SimpleSelect = ({
  value,
  onChange,
  options,
  className = "",
  disabled = false,
}) => (
  <select
    value={value}
    onChange={onChange}
    disabled={disabled}
    className={`w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all disabled:bg-gray-50 disabled:text-gray-400 ${className}`}
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value} disabled={opt.disabled}>
        {opt.label}
      </option>
    ))}
  </select>
);

// ─────────────────────────────────────────────
// MODAL AJOUT PAIEMENT
// ─────────────────────────────────────────────
const ModalAddPaiement = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [searchInscription, setSearchInscription] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedInscription, setSelectedInscription] = useState(null);
  const [formData, setFormData] = useState({
    type_paiement: "inscription",
    type_livre: "",
    montant: "",
    date_paiement: new Date().toISOString().split("T")[0],
    methode_paiement: "especes",
    reference_mvola: "",
    remarques: "",
  });

  // Recherche étudiant/inscription
  useEffect(() => {
    if (!searchInscription || searchInscription.length < 2) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        // Réponse backend : { success, message, data: [...] }
        const res = await paiementService.searchInscriptions({
          search: searchInscription,
        });
        setSearchResults(res.data || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [searchInscription]);

  const selectInscription = (insc) => {
    setSelectedInscription(insc);
    setSearchResults([]);
    setSearchInscription(
      `${insc.etudiant_nom} ${insc.etudiant_prenom} — ${insc.vague_nom}`,
    );
    // Auto-sélectionner le bon type
    const fraisPaye = insc.frais_inscription_paye;
    setFormData((prev) => ({
      ...prev,
      type_paiement: fraisPaye ? "livre" : "inscription",
      montant: fraisPaye ? "" : insc.montant_frais_inscription || "",
      type_livre: "",
    }));
  };

  const handleTypePaiementChange = (type) => {
    if (!selectedInscription) return;
    setFormData((prev) => ({
      ...prev,
      type_paiement: type,
      type_livre: "",
      montant:
        type === "inscription"
          ? selectedInscription.montant_frais_inscription || ""
          : "",
    }));
  };

  const handleTypeLivreChange = (typeLivre) => {
    if (!selectedInscription) return;
    setFormData((prev) => ({
      ...prev,
      type_livre: typeLivre,
      montant:
        typeLivre === "cours"
          ? selectedInscription.prix_livre_cours || ""
          : typeLivre === "exercices"
            ? selectedInscription.prix_livre_exercices || ""
            : "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInscription) {
      toast.error("Veuillez sélectionner une inscription");
      return;
    }
    setLoading(true);
    try {
      await inscriptionService.addPaiement({
        inscription_id: selectedInscription.inscription_id,
        ...formData,
        montant: parseFloat(formData.montant),
      });
      toast.success("Paiement enregistré avec succès");
      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erreur lors de l'ajout du paiement",
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedInscription(null);
    setSearchInscription("");
    setSearchResults([]);
    setFormData({
      type_paiement: "inscription",
      type_livre: "",
      montant: "",
      date_paiement: new Date().toISOString().split("T")[0],
      methode_paiement: "especes",
      reference_mvola: "",
      remarques: "",
    });
  };

  const fraisPaye = selectedInscription?.frais_inscription_paye;
  const coursPayé = selectedInscription?.livre_cours_paye === "paye";
  const exoPayé = selectedInscription?.livre_exercices_paye === "paye";
  const tousLivresPayes = coursPayé && exoPayé;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        resetForm();
      }}
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <DollarSign className="w-5 h-5 text-green-700" />
          </div>
          <span className="text-xl font-bold text-gray-900">
            Nouveau paiement
          </span>
        </div>
      }
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── Recherche inscription ── */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Étudiant / Inscription <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchInscription}
              onChange={(e) => {
                setSearchInscription(e.target.value);
                setSelectedInscription(null);
              }}
              placeholder="Rechercher par nom, téléphone..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
            {searching && (
              <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
            )}
          </div>

          {/* Résultats recherche */}
          {searchResults.length > 0 && (
            <div className="mt-1 border border-gray-200 rounded-xl overflow-hidden shadow-lg bg-white z-20 relative">
              {searchResults.map((insc, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectInscription(insc)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left border-b border-gray-100 last:border-0 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {insc.etudiant_prenom?.charAt(0)}
                    {insc.etudiant_nom?.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {insc.etudiant_nom} {insc.etudiant_prenom}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {insc.vague_nom} · {insc.niveau_code}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      insc.montant_restant > 0
                        ? "bg-orange-50 text-orange-700 border border-orange-200"
                        : "bg-green-50 text-green-700 border border-green-200"
                    }`}
                  >
                    {insc.montant_restant > 0
                      ? `Reste ${fmt(insc.montant_restant)} Ar`
                      : "Soldé"}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Carte inscription sélectionnée */}
          {selectedInscription && (
            <div className="mt-2 p-3 bg-primary-50 border border-primary-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {selectedInscription.etudiant_prenom?.charAt(0)}
                  {selectedInscription.etudiant_nom?.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-primary-900 text-sm">
                    {selectedInscription.etudiant_nom}{" "}
                    {selectedInscription.etudiant_prenom}
                  </p>
                  <p className="text-xs text-primary-600">
                    {selectedInscription.vague_nom} · Reste :{" "}
                    {fmt(selectedInscription.montant_restant)} Ar
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedInscription(null);
                  setSearchInscription("");
                }}
                className="text-primary-400 hover:text-primary-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* ── Type paiement ── */}
        {selectedInscription && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Type de paiement *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
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
              ))}
            </div>
          </div>
        )}

        {/* ── Type livre ── */}
        {selectedInscription && formData.type_paiement === "livre" && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Type de livre *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  value: "cours",
                  label: "Cours",
                  price: selectedInscription.prix_livre_cours,
                  icon: BookOpen,
                  disabled: coursPayé,
                  tooltip: "Le livre de cours est déjà payé",
                },
                {
                  value: "exercices",
                  label: "Exercices",
                  price: selectedInscription.prix_livre_exercices,
                  icon: BookMarked,
                  disabled: exoPayé,
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
                        {fmt(price)} Ar{disabled ? " · Payé" : ""}
                      </span>
                    </button>
                  </Tooltip>
                ),
              )}
            </div>
          </div>
        )}

        {/* ── Montant ── */}
        {selectedInscription && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Montant (Ar) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={formData.montant}
                    onChange={(e) =>
                      setFormData({ ...formData, montant: e.target.value })
                    }
                    required
                    min="1"
                    placeholder="0"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date_paiement}
                  onChange={(e) =>
                    setFormData({ ...formData, date_paiement: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Méthode *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "especes", label: "Espèces", icon: Wallet },
                  { value: "mvola", label: "MVola", icon: Smartphone },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, methode_paiement: value })
                    }
                    className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                      formData.methode_paiement === value
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {formData.methode_paiement === "mvola" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Référence MVola *
                </label>
                <input
                  type="text"
                  value={formData.reference_mvola}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reference_mvola: e.target.value,
                    })
                  }
                  placeholder="Ex: 034XXXXXXX"
                  required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Remarques
              </label>
              <textarea
                value={formData.remarques}
                onChange={(e) =>
                  setFormData({ ...formData, remarques: e.target.value })
                }
                rows={2}
                placeholder="Remarques optionnelles..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
              />
            </div>
          </>
        )}

        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="flex-1"
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={loading || !selectedInscription}
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
// PAGE PRINCIPALE
// ─────────────────────────────────────────────
export default function GestionPaiements() {
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [filters, setFilters] = useState({
    date_debut: "",
    date_fin: "",
    type_paiement: "", // "inscription" | "livre" | ""
    methode_paiement: "", // "especes" | "mvola" | ""
    avec_restant: false, // uniquement les inscriptions avec montant restant
  });

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
  });

  // ── Chargement ──
  const fetchPaiements = async (page = 1, search = "") => {
    setLoading(true);
    try {
      // Construire les params en nettoyant les valeurs vides
      const params = { page, limit: pagination.limit };
      if (search) params.search = search;
      if (filters.date_debut) params.date_debut = filters.date_debut;
      if (filters.date_fin) params.date_fin = filters.date_fin;
      if (filters.type_paiement) params.type_paiement = filters.type_paiement;
      if (filters.methode_paiement)
        params.methode_paiement = filters.methode_paiement;
      if (filters.avec_restant) params.avec_restant = true;

      // Réponse backend : { success, message, data: [...], page, limit, total }
      const res = await paiementService.getAll(params);
      setPaiements(res.data || []);
      setPagination((prev) => ({
        ...prev,
        total: res.total || 0,
        page: res.page || 1,
        totalPages: Math.ceil((res.total || 0) / prev.limit),
      }));
    } catch {
      toast.error("Erreur lors du chargement des paiements");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = {};
      if (filters.date_debut) params.date_debut = filters.date_debut;
      if (filters.date_fin) params.date_fin = filters.date_fin;

      // Réponse backend : { success, message, data: { total_paye, total_restant, nb_paiements, ... } }
      const res = await paiementService.getStats(params);
      setStats(res.data || null);
    } catch {
      // silencieux — les stats ne bloquent pas l'affichage
    }
  };

  useEffect(() => {
    fetchPaiements(1, searchTerm);
    fetchStats();
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(() => fetchPaiements(1, searchTerm), 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const resetFilters = () => {
    setFilters({
      date_debut: "",
      date_fin: "",
      type_paiement: "",
      methode_paiement: "",
      avec_restant: false,
    });
    setSearchTerm("");
  };

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const activeFilterCount = [
    filters.date_debut,
    filters.date_fin,
    filters.type_paiement,
    filters.methode_paiement,
    filters.avec_restant,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-600 rounded-xl shadow-lg shadow-green-500/20 shrink-0">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Gestion des paiements
                </h1>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  {pagination.total} paiement{pagination.total > 1 ? "s" : ""}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                Suivi des encaissements et des soldes
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="primary"
            className="w-full sm:w-auto shadow-lg shadow-primary-500/20 bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau paiement
          </Button>
        </div>

        {/* ── STATS ── */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              title="Total encaissé"
              value={`${fmt(stats.total_paye)} Ar`}
              subtitle={`${stats.nb_paiements || 0} transactions`}
              icon={TrendingUp}
              color="green"
            />
            <StatCard
              title="Restant à percevoir"
              value={`${fmt(stats.total_restant)} Ar`}
              subtitle={`${stats.nb_inscriptions_non_soldees || 0} inscriptions en attente`}
              icon={TrendingDown}
              color="orange"
            />
            <StatCard
              title="Paiements espèces"
              value={`${fmt(stats.total_especes)} Ar`}
              subtitle={`${stats.nb_especes || 0} transactions`}
              icon={Wallet}
              color="blue"
            />
            <StatCard
              title="Paiements MVola"
              value={`${fmt(stats.total_mvola)} Ar`}
              subtitle={`${stats.nb_mvola || 0} transactions`}
              icon={Smartphone}
              color="purple"
            />
          </div>
        )}

        {/* ── RECHERCHE + FILTRES ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5">
            {/* Ligne principale */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, téléphone, référence MVola..."
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
                {filters.date_debut && (
                  <FilterPill
                    label={`Depuis le ${filters.date_debut}`}
                    onRemove={() => setFilter("date_debut", "")}
                  />
                )}
                {filters.date_fin && (
                  <FilterPill
                    label={`Jusqu'au ${filters.date_fin}`}
                    onRemove={() => setFilter("date_fin", "")}
                  />
                )}
                {filters.type_paiement && (
                  <FilterPill
                    label={
                      TYPE_LABELS[filters.type_paiement]?.label ||
                      filters.type_paiement
                    }
                    onRemove={() => setFilter("type_paiement", "")}
                  />
                )}
                {filters.methode_paiement && (
                  <FilterPill
                    label={
                      METHODE_LABELS[filters.methode_paiement]?.label ||
                      filters.methode_paiement
                    }
                    onRemove={() => setFilter("methode_paiement", "")}
                  />
                )}
                {filters.avec_restant && (
                  <FilterPill
                    label="Avec solde restant"
                    onRemove={() => setFilter("avec_restant", false)}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Période */}
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Période
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="date"
                        value={filters.date_debut}
                        onChange={(e) =>
                          setFilter("date_debut", e.target.value)
                        }
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                      />
                      <span className="text-gray-400 text-xs shrink-0">au</span>
                      <input
                        type="date"
                        value={filters.date_fin}
                        onChange={(e) => setFilter("date_fin", e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Type de paiement
                    </label>
                    <SimpleSelect
                      value={filters.type_paiement}
                      onChange={(e) =>
                        setFilter("type_paiement", e.target.value)
                      }
                      options={[
                        { value: "", label: "Tous les types" },
                        { value: "inscription", label: "Frais d'inscription" },
                        { value: "livre", label: "Livre" },
                      ]}
                    />
                  </div>

                  {/* Méthode */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Méthode de paiement
                    </label>
                    <SimpleSelect
                      value={filters.methode_paiement}
                      onChange={(e) =>
                        setFilter("methode_paiement", e.target.value)
                      }
                      options={[
                        { value: "", label: "Toutes les méthodes" },
                        { value: "especes", label: "Espèces" },
                        { value: "mvola", label: "MVola" },
                      ]}
                    />
                  </div>
                </div>

                {/* Filtre solde restant */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setFilter("avec_restant", !filters.avec_restant)
                    }
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      filters.avec_restant
                        ? "border-orange-400 bg-orange-50 text-orange-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <XCircle
                      className={`w-4 h-4 ${filters.avec_restant ? "text-orange-500" : "text-gray-400"}`}
                    />
                    Inscriptions avec solde restant
                  </button>

                  <button
                    onClick={resetFilters}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors ml-auto"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Réinitialiser
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
              <Receipt className="w-4 h-4" />
              Historique des paiements
            </div>
            <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
              {pagination.total} résultat{pagination.total > 1 ? "s" : ""}
            </span>
          </div>

          {/* VUE DESKTOP – tableau */}
          <div className="hidden md:block overflow-x-auto">
            {loading ? (
              <div className="p-16 flex justify-center">
                <Loading message="Chargement des paiements..." />
              </div>
            ) : paiements.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Receipt className="w-8 h-8 text-gray-400" />
                </div>
                <p className="font-semibold text-gray-900 mb-1">
                  Aucun paiement trouvé
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  {searchTerm || activeFilterCount > 0
                    ? "Essayez de modifier vos filtres"
                    : "Aucun paiement enregistré pour le moment"}
                </p>
                <Button
                  variant="primary"
                  onClick={() => setIsModalOpen(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" /> Nouveau paiement
                </Button>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    {[
                      "Date",
                      "Étudiant",
                      "Inscription / Vague",
                      "Type",
                      "Méthode",
                      "Montant",
                      "Ref. MVola",
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
                  {paiements.map((p, i) => {
                    const typeCfg = TYPE_LABELS[p.type_paiement] || {
                      label: p.type_paiement,
                      color: "blue",
                      icon: Receipt,
                    };
                    const TypeIcon = typeCfg.icon;
                    const methodeCfg = METHODE_LABELS[p.methode_paiement] || {
                      label: p.methode_paiement,
                      icon: Wallet,
                    };
                    const MethodeIcon = methodeCfg.icon;
                    const colorBadge = {
                      blue: "bg-blue-50 text-blue-700 border-blue-200",
                      purple: "bg-purple-50 text-purple-700 border-purple-200",
                    };

                    return (
                      <tr
                        key={i}
                        className="hover:bg-gray-50/80 transition-colors group"
                      >
                        {/* Date */}
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                          {p.date_paiement
                            ? format(new Date(p.date_paiement), "dd MMM yyyy", {
                                locale: fr,
                              })
                            : "—"}
                        </td>

                        {/* Étudiant */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-primary-700">
                                {p.etudiant_prenom?.charAt(0)}
                                {p.etudiant_nom?.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                                {p.etudiant_nom} {p.etudiant_prenom}
                              </p>
                              {p.etudiant_telephone && (
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {p.etudiant_telephone}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Vague */}
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-700 whitespace-nowrap">
                            {p.vague_nom || "—"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {p.niveau_code || ""}
                          </p>
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colorBadge[typeCfg.color] || colorBadge.blue}`}
                          >
                            <TypeIcon className="w-3 h-3" />
                            {typeCfg.label}
                            {p.type_livre &&
                              ` · ${LIVRE_LABELS[p.type_livre] || p.type_livre}`}
                          </span>
                        </td>

                        {/* Méthode */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <MethodeIcon className="w-3.5 h-3.5 text-gray-400" />
                            {methodeCfg.label}
                          </div>
                        </td>

                        {/* Montant */}
                        <td className="px-4 py-3">
                          <p className="text-sm font-bold text-gray-900 whitespace-nowrap">
                            {fmt(p.montant)}{" "}
                            <span className="font-normal text-gray-400 text-xs">
                              Ar
                            </span>
                          </p>
                        </td>

                        {/* Référence MVola */}
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {p.reference_mvola || (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* VUE MOBILE – cartes */}
          <div className="md:hidden space-y-3 p-3">
            {loading ? (
              <div className="p-12 flex justify-center">
                <Loading message="Chargement..." />
              </div>
            ) : paiements.length === 0 ? (
              <div className="p-12 text-center">
                <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Aucun paiement trouvé</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-green-600 text-white text-sm rounded-xl"
                >
                  <Plus className="w-4 h-4" /> Nouveau paiement
                </button>
              </div>
            ) : (
              paiements.map((p, i) => <PaiementCard key={i} paiement={p} />)
            )}
          </div>

          {/* ── PAGINATION ── */}
          {!loading && paiements.length > 0 && (
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
                      fetchPaiements(1, searchTerm);
                    }}
                    className="px-2 py-1 text-xs bg-white border border-gray-200 rounded-lg"
                  >
                    {[15, 25, 50, 100].map((l) => (
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
                    fetchPaiements(pagination.page - 1, searchTerm);
                  }}
                  disabled={pagination.page <= 1}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Préc.
                </button>

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
                            fetchPaiements(page, searchTerm);
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
                    fetchPaiements(pagination.page + 1, searchTerm);
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
      </div>

      {/* ── MODAL ── */}
      <ModalAddPaiement
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchPaiements(1, searchTerm);
          fetchStats();
        }}
      />
    </div>
  );
}
