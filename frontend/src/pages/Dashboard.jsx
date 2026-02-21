import {
  etudiantService,
  inscriptionService,
  paiementService,
  vagueService,
} from "@/services/api";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Clock,
  DollarSign,
  GraduationCap,
  Package,
  Receipt,
  RefreshCw,
  Smartphone,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const fmt = (n) => parseInt(n || 0).toLocaleString("fr-FR");

function useAdminName() {
  const [name, setName] = useState("Admin");
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.prenom || user.nom) setName(user.prenom || user.nom);
    } catch {}
  }, []);
  return name;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

// ─────────────────────────────────────────────
// COMPOSANTS UI
// ─────────────────────────────────────────────

const KpiCard = ({ title, value, sub, icon: Icon, color, link, loading }) => {
  const palette = {
    blue: {
      card: "bg-blue-600",
      light: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-100",
      icon: "bg-blue-100 text-blue-600",
    },
    green: {
      card: "bg-emerald-600",
      light: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-100",
      icon: "bg-emerald-100 text-emerald-600",
    },
    orange: {
      card: "bg-orange-500",
      light: "bg-orange-50",
      text: "text-orange-700",
      border: "border-orange-100",
      icon: "bg-orange-100 text-orange-500",
    },
    purple: {
      card: "bg-violet-600",
      light: "bg-violet-50",
      text: "text-violet-700",
      border: "border-violet-100",
      icon: "bg-violet-100 text-violet-600",
    },
    red: {
      card: "bg-red-500",
      light: "bg-red-50",
      text: "text-red-700",
      border: "border-red-100",
      icon: "bg-red-100 text-red-500",
    },
  };
  const p = palette[color] || palette.blue;

  const inner = (
    <div
      className={`relative overflow-hidden rounded-2xl border ${p.border} bg-white hover:shadow-lg transition-all duration-300 group cursor-pointer`}
    >
      {/* Accent bar top */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${p.card}`} />

      <div className="p-5 pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-2.5 rounded-xl ${p.icon}`}>
            <Icon className="w-5 h-5" />
          </div>
          {link && (
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all duration-200" />
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            <div className="h-8 bg-gray-100 rounded-lg w-2/3 animate-pulse" />
            <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" />
          </div>
        ) : (
          <>
            <p className="text-2xl font-bold text-gray-900 leading-tight">
              {value}
            </p>
            <p className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider">
              {title}
            </p>
            {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
          </>
        )}
      </div>
    </div>
  );

  return link ? <Link to={link}>{inner}</Link> : inner;
};

const SectionHeader = ({
  title,
  icon: Icon,
  link,
  linkLabel = "Voir tout",
}) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-gray-500" />
      <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
        {title}
      </h2>
    </div>
    {link && (
      <Link
        to={link}
        className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
      >
        {linkLabel} <ArrowRight className="w-3 h-3" />
      </Link>
    )}
  </div>
);

const SkeletonRow = () => (
  <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 animate-pulse">
    <div className="w-9 h-9 rounded-full bg-gray-100 shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3.5 bg-gray-100 rounded w-2/3" />
      <div className="h-3 bg-gray-100 rounded w-1/3" />
    </div>
    <div className="h-6 w-16 bg-gray-100 rounded-full" />
  </div>
);

const EmptyState = ({ icon: Icon, message }) => (
  <div className="flex flex-col items-center justify-center py-10 text-center">
    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
      <Icon className="w-6 h-6 text-gray-400" />
    </div>
    <p className="text-sm text-gray-400">{message}</p>
  </div>
);

// Badge statut inscription
const StatutBadge = ({ statut }) => {
  const map = {
    actif: {
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
      label: "Actif",
    },
    en_attente: {
      cls: "bg-amber-50 text-amber-700 border-amber-200",
      label: "En attente",
    },
    rejetee: { cls: "bg-red-50 text-red-600 border-red-200", label: "Rejeté" },
    abandonne: {
      cls: "bg-gray-100 text-gray-500 border-gray-200",
      label: "Abandonné",
    },
  };
  const c = map[statut] || {
    cls: "bg-gray-100 text-gray-500 border-gray-200",
    label: statut,
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${c.cls}`}
    >
      {c.label}
    </span>
  );
};

// Avatar initiales
const Avatar = ({ nom, prenom, size = "sm" }) => {
  const s = size === "sm" ? "w-9 h-9 text-sm" : "w-11 h-11 text-base";
  return (
    <div
      className={`${s} rounded-full bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center text-white font-bold shrink-0`}
    >
      {prenom?.charAt(0)}
      {nom?.charAt(0)}
    </div>
  );
};

// ─────────────────────────────────────────────
// BLOC : Alertes urgentes
// ─────────────────────────────────────────────
const AlertesUrgentes = ({
  inscriptionsEnAttente,
  livresNonLivres,
  soldesRestants,
}) => {
  const alertes = [
    inscriptionsEnAttente > 0 && {
      icon: Clock,
      color: "amber",
      message: `${inscriptionsEnAttente} inscription${inscriptionsEnAttente > 1 ? "s" : ""} en attente de validation`,
      link: "/inscriptions/pending",
      cta: "Valider",
    },
    soldesRestants > 0 && {
      icon: DollarSign,
      color: "red",
      message: `${fmt(soldesRestants)} Ar de soldes non encaissés`,
      link: "/paiements",
      cta: "Voir",
    },
    livresNonLivres > 0 && {
      icon: Package,
      color: "blue",
      message: `${livresNonLivres} livre${livresNonLivres > 1 ? "s" : ""} à livrer`,
      link: "/etudiants",
      cta: "Gérer",
    },
  ].filter(Boolean);

  if (alertes.length === 0) {
    return (
      <div className="flex items-center gap-2.5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
        <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
        <p className="text-sm font-medium text-emerald-700">
          Tout est à jour — aucune action urgente requise
        </p>
      </div>
    );
  }

  const colorMap = {
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      icon: "text-amber-500",
      text: "text-amber-800",
      btn: "bg-amber-100 text-amber-700 hover:bg-amber-200",
    },
    red: {
      bg: "bg-red-50",
      border: "border-red-200",
      icon: "text-red-500",
      text: "text-red-800",
      btn: "bg-red-100 text-red-700 hover:bg-red-200",
    },
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: "text-blue-500",
      text: "text-blue-800",
      btn: "bg-blue-100 text-blue-700 hover:bg-blue-200",
    },
  };

  return (
    <div className="space-y-2">
      {alertes.map((a, i) => {
        const c = colorMap[a.color];
        const Icon = a.icon;
        return (
          <div
            key={i}
            className={`flex items-center gap-3 p-3.5 ${c.bg} border ${c.border} rounded-xl`}
          >
            <Icon className={`w-4.5 h-4.5 ${c.icon} shrink-0`} />
            <p className={`text-sm font-medium ${c.text} flex-1`}>
              {a.message}
            </p>
            <Link
              to={a.link}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shrink-0 ${c.btn}`}
            >
              {a.cta}
            </Link>
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────
export default function Dashboard() {
  const adminName = useAdminName();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Données
  const [kpis, setKpis] = useState(null);
  const [paiementStats, setPaiementStats] = useState(null);
  const [inscriptionStats, setInscriptionStats] = useState(null);
  const [derniersEtudiants, setDerniersEtudiants] = useState([]);
  const [derniersPaiements, setDerniersPaiements] = useState([]);
  const [vaguesActives, setVaguesActives] = useState([]);

  const fetchAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [
        etudiantStatsRes,
        paiementStatsRes,
        inscriptionStatsRes,
        derniersEtudiantsRes,
        derniersPaiementsRes,
        vaguesRes,
      ] = await Promise.allSettled([
        etudiantService.getStats(),
        paiementService.getStats(),
        inscriptionService.getStats(),
        etudiantService.getWithDetails({ page: 1, limit: 5 }),
        paiementService.getAll({ page: 1, limit: 6 }),
        vagueService.getAll({ statut: "en_cours", limit: 4 }),
      ]);

      if (etudiantStatsRes.status === "fulfilled")
        setKpis(etudiantStatsRes.value?.data || null);
      if (paiementStatsRes.status === "fulfilled")
        setPaiementStats(paiementStatsRes.value?.data || null);
      if (inscriptionStatsRes.status === "fulfilled")
        setInscriptionStats(inscriptionStatsRes.value?.data || null);
      if (derniersEtudiantsRes.status === "fulfilled")
        setDerniersEtudiants(derniersEtudiantsRes.value?.data || []);
      if (derniersPaiementsRes.status === "fulfilled")
        setDerniersPaiements(derniersPaiementsRes.value?.data || []);
      if (vaguesRes.status === "fulfilled")
        setVaguesActives(
          vaguesRes.value?.data?.vagues || vaguesRes.value?.data || [],
        );
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const today = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1 capitalize">
              {today}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {getGreeting()},{" "}
              <span className="text-primary-600">{adminName}</span> 👋
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Voici l'état de votre centre de formation aujourd'hui.
            </p>
          </div>
          <button
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Actualisation..." : "Actualiser"}
          </button>
        </div>

        {/* ── ALERTES URGENTES ── */}
        <AlertesUrgentes
          inscriptionsEnAttente={parseInt(inscriptionStats?.en_attente || 0)}
          livresNonLivres={parseInt(kpis?.livres_non_livres || 0)}
          soldesRestants={parseFloat(paiementStats?.total_restant || 0)}
        />

        {/* ── KPIs PRINCIPAUX (2 lignes) ── */}
        {/* Ligne 1 : étudiants & inscriptions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard
            title="Étudiants actifs"
            value={loading ? "—" : fmt(kpis?.total_actifs ?? kpis?.total)}
            sub={`${fmt(kpis?.total)} au total`}
            icon={Users}
            color="blue"
            link="/etudiants"
            loading={loading}
          />
          <KpiCard
            title="Inscriptions actives"
            value={loading ? "—" : fmt(inscriptionStats?.actifs)}
            sub={`${fmt(inscriptionStats?.en_attente)} en attente`}
            icon={GraduationCap}
            color="purple"
            link="/etudiants"
            loading={loading}
          />
          <KpiCard
            title="Total encaissé"
            value={loading ? "—" : `${fmt(paiementStats?.total_paye)} Ar`}
            sub={`${fmt(paiementStats?.nb_paiements)} transactions`}
            icon={TrendingUp}
            color="green"
            link="/paiements"
            loading={loading}
          />
          <KpiCard
            title="Restant à percevoir"
            value={loading ? "—" : `${fmt(paiementStats?.total_restant)} Ar`}
            sub={`${fmt(paiementStats?.nb_inscriptions_non_soldees)} inscriptions`}
            icon={AlertTriangle}
            color="orange"
            link="/paiements"
            loading={loading}
          />
        </div>

        {/* Ligne 2 : détails paiements & livres */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard
            title="Espèces encaissées"
            value={loading ? "—" : `${fmt(paiementStats?.total_especes)} Ar`}
            sub={`${fmt(paiementStats?.nb_especes)} paiements`}
            icon={Wallet}
            color="green"
            loading={loading}
          />
          <KpiCard
            title="MVola encaissé"
            value={loading ? "—" : `${fmt(paiementStats?.total_mvola)} Ar`}
            sub={`${fmt(paiementStats?.nb_mvola)} paiements`}
            icon={Smartphone}
            color="blue"
            loading={loading}
          />
          <KpiCard
            title="Livres non livrés"
            value={loading ? "—" : fmt(kpis?.livres_non_livres ?? "—")}
            sub="à remettre aux étudiants"
            icon={Package}
            color="orange"
            link="/etudiants"
            loading={loading}
          />
          <KpiCard
            title="Vagues en cours"
            value={loading ? "—" : fmt(vaguesActives.length)}
            sub="sessions actives"
            icon={BookOpen}
            color="purple"
            link="/vagues"
            loading={loading}
          />
        </div>

        {/* ── CONTENU PRINCIPAL : 3 colonnes ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* COL 1+2 : Derniers étudiants inscrits */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <SectionHeader
                title="Dernières inscriptions"
                icon={Users}
                link="/etudiants"
              />
            </div>
            <div className="px-5 divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : derniersEtudiants.length === 0 ? (
                <EmptyState
                  icon={Users}
                  message="Aucun étudiant inscrit pour le moment"
                />
              ) : (
                derniersEtudiants.map((e, i) => {
                  const restant = parseInt(e.montant_restant || 0);
                  return (
                    <div key={i} className="flex items-center gap-3 py-3">
                      <Avatar nom={e.nom} prenom={e.prenom} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {e.nom} {e.prenom}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {e.niveau_code} · {e.vague_nom || "—"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <StatutBadge statut={e.statut_inscription} />
                        {restant > 0 ? (
                          <span className="text-xs font-semibold text-orange-600">
                            {fmt(restant)} Ar restant
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Soldé
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {derniersEtudiants.length > 0 && (
              <div className="px-5 py-3 border-t border-gray-50">
                <Link
                  to="/etudiants"
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  Voir tous les étudiants <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>

          {/* COL 3 : Répartition inscriptions + vagues actives */}
          <div className="space-y-5">
            {/* Répartition statuts inscriptions */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <SectionHeader
                  title="Statuts inscriptions"
                  icon={GraduationCap}
                />
              </div>
              <div className="px-5 py-4 space-y-3">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 animate-pulse"
                    >
                      <div className="h-3 bg-gray-100 rounded flex-1" />
                      <div className="h-5 w-10 bg-gray-100 rounded-full" />
                    </div>
                  ))
                ) : inscriptionStats ? (
                  [
                    {
                      label: "Actifs",
                      value: inscriptionStats.actifs,
                      color: "bg-emerald-500",
                      light: "bg-emerald-50 text-emerald-700",
                    },
                    {
                      label: "En attente",
                      value: inscriptionStats.en_attente,
                      color: "bg-amber-400",
                      light: "bg-amber-50 text-amber-700",
                    },
                    {
                      label: "Rejetées",
                      value: inscriptionStats.rejetees,
                      color: "bg-red-400",
                      light: "bg-red-50 text-red-700",
                    },
                    {
                      label: "Abandonnés",
                      value: inscriptionStats.abandonnes,
                      color: "bg-gray-300",
                      light: "bg-gray-100 text-gray-600",
                    },
                  ].map(({ label, value, color, light }) => {
                    const total = parseInt(inscriptionStats.total || 1);
                    const pct = Math.round(
                      (parseInt(value || 0) / total) * 100,
                    );
                    return (
                      <div key={label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-600">
                            {label}
                          </span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${light}`}
                          >
                            {fmt(value)}
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${color} rounded-full transition-all duration-700`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <EmptyState
                    icon={GraduationCap}
                    message="Données non disponibles"
                  />
                )}

                {inscriptionStats && !loading && (
                  <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-xs text-gray-400">Total</span>
                    <span className="text-sm font-bold text-gray-800">
                      {fmt(inscriptionStats.total)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Vagues en cours */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <SectionHeader
                  title="Vagues en cours"
                  icon={BookOpen}
                  link="/vagues"
                />
              </div>
              <div className="px-5 divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))
                ) : vaguesActives.length === 0 ? (
                  <EmptyState icon={BookOpen} message="Aucune vague en cours" />
                ) : (
                  vaguesActives.slice(0, 4).map((v, i) => {
                    const pct = v.capacite_max
                      ? Math.min(
                          Math.round(
                            (parseInt(v.nb_inscrits || 0) / v.capacite_max) *
                              100,
                          ),
                          100,
                        )
                      : null;
                    const isPlein = pct !== null && pct >= 100;
                    return (
                      <div key={i} className="py-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {v.nom}
                            </p>
                            <p className="text-xs text-gray-400">
                              {v.niveau_code || v.niveau_nom}
                            </p>
                          </div>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              isPlein
                                ? "bg-red-50 text-red-600 border border-red-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {v.nb_inscrits || 0}
                            {v.capacite_max ? `/${v.capacite_max}` : ""} élèves
                          </span>
                        </div>
                        {pct !== null && (
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${isPlein ? "bg-red-400" : "bg-emerald-500"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        )}
                        {v.date_debut && v.date_fin && (
                          <p className="text-xs text-gray-400 mt-1">
                            {format(new Date(v.date_debut), "dd MMM", {
                              locale: fr,
                            })}{" "}
                            →{" "}
                            {format(new Date(v.date_fin), "dd MMM yyyy", {
                              locale: fr,
                            })}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── DERNIERS PAIEMENTS ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <SectionHeader
              title="Derniers paiements"
              icon={Receipt}
              link="/paiements"
            />
          </div>

          {/* Desktop */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-50">
                  {["Date", "Étudiant", "Type", "Méthode", "Montant"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-5 py-3">
                          <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : derniersPaiements.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-10 text-center text-sm text-gray-400"
                    >
                      Aucun paiement enregistré
                    </td>
                  </tr>
                ) : (
                  derniersPaiements.map((p, i) => (
                    <tr
                      key={i}
                      className="hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="px-5 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {p.date_paiement
                          ? format(new Date(p.date_paiement), "dd MMM yyyy", {
                              locale: fr,
                            })
                          : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            nom={p.etudiant_nom}
                            prenom={p.etudiant_prenom}
                          />
                          <div>
                            <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                              {p.etudiant_nom} {p.etudiant_prenom}
                            </p>
                            <p className="text-xs text-gray-400">
                              {p.vague_nom || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            p.type_paiement === "inscription"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-violet-50 text-violet-700 border-violet-200"
                          }`}
                        >
                          {p.type_paiement === "inscription" ? (
                            <>
                              <GraduationCap className="w-3 h-3" /> Inscription
                            </>
                          ) : (
                            <>
                              <BookOpen className="w-3 h-3" /> Livre{" "}
                              {p.type_livre === "cours" ? "cours" : "exercices"}
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          {p.methode_paiement === "mvola" ? (
                            <Smartphone className="w-3.5 h-3.5 text-gray-400" />
                          ) : (
                            <Wallet className="w-3.5 h-3.5 text-gray-400" />
                          )}
                          <span className="capitalize">
                            {p.methode_paiement}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm font-bold text-gray-900 whitespace-nowrap">
                          {fmt(p.montant)}{" "}
                          <span className="text-xs font-normal text-gray-400">
                            Ar
                          </span>
                        </p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="sm:hidden divide-y divide-gray-50 px-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
            ) : derniersPaiements.length === 0 ? (
              <EmptyState icon={Receipt} message="Aucun paiement enregistré" />
            ) : (
              derniersPaiements.map((p, i) => (
                <div
                  key={i}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar nom={p.etudiant_nom} prenom={p.etudiant_prenom} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {p.etudiant_nom} {p.etudiant_prenom}
                      </p>
                      <p className="text-xs text-gray-400">
                        {p.date_paiement
                          ? format(new Date(p.date_paiement), "dd MMM", {
                              locale: fr,
                            })
                          : "—"}
                        {" · "}
                        {p.methode_paiement}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-900 shrink-0">
                    {fmt(p.montant)} Ar
                  </p>
                </div>
              ))
            )}
          </div>

          {derniersPaiements.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-50">
              <Link
                to="/paiements"
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                Voir tous les paiements <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <p className="text-center text-xs text-gray-300 pb-4">
          Dernière mise à jour · {format(new Date(), "HH:mm", { locale: fr })}
        </p>
      </div>
    </div>
  );
}
