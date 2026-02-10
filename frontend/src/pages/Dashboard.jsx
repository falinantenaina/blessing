import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Loading from "@/components/ui/Loading";
import { useAuthStore } from "@/store";
import { formatCurrency } from "@/utils/helpers";
import {
  BookOpen,
  Calendar,
  DollarSign,
  GraduationCap,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  financeService,
  inscriptionService,
  niveauService,
  userService,
  vagueService,
} from "../services/api";

function StatCard({
  title,
  value,
  icon: Icon,
  color = "primary",
  subtitle = null,
}) {
  const colors = {
    primary: "bg-primary-50 text-primary-600",
    green: "bg-green-50 text-green-600",
    yellow: "bg-yellow-50 text-yellow-600",
    purple: "bg-purple-50 text-purple-600",
    blue: "bg-blue-50 text-blue-600",
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-4 rounded-full ${colors[color]}`}>
          <Icon className="w-8 h-8" />
        </div>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    users: null,
    vagues: null,
    finances: null,
    niveaux: null,
    inscriptions: null,
  });
  const [loading, setLoading] = useState(true);
  const [recentVagues, setRecentVagues] = useState([]);

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    setLoading(true);
    try {
      if (user?.role === "admin" || user?.role === "secretaire") {
        const [
          usersData,
          vaguesData,
          financesData,
          niveauxData,
          inscriptionsData,
        ] = await Promise.all([
          userService.getStats().catch(() => null),
          vagueService.getAll({ limit: 5, page: 1 }).catch(() => null),
          financeService.getStats().catch(() => null),
          niveauService.getStats().catch(() => null),
          inscriptionService.getStats().catch(() => null),
        ]);

        setStats({
          users: usersData?.data || null,
          vagues: vaguesData?.data || null,
          finances: financesData?.data || null,
          niveaux: niveauxData?.data || null,
          inscriptions: inscriptionsData?.data || null,
        });

        // Extraire les vagues récentes
        if (vaguesData?.data) {
          const vaguesArray =
            vaguesData.data.vagues ||
            vaguesData.data.liste ||
            vaguesData.data ||
            [];
          setRecentVagues(
            Array.isArray(vaguesArray) ? vaguesArray.slice(0, 5) : [],
          );
        }
      } else if (user?.role === "enseignant") {
        // Statistiques pour enseignant
        const vaguesData = await vagueService
          .getAll({
            enseignant_id: user.id,
            limit: 10,
          })
          .catch(() => null);

        setStats({
          vagues: vaguesData?.data || null,
        });

        if (vaguesData?.data) {
          const vaguesArray =
            vaguesData.data.vagues ||
            vaguesData.data.liste ||
            vaguesData.data ||
            [];
          setRecentVagues(Array.isArray(vaguesArray) ? vaguesArray : []);
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
      toast.error("Erreur lors du chargement du tableau de bord");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading fullScreen message="Chargement du tableau de bord..." />;
  }

  // Dashboard pour les étudiants
  if (user?.role === "etudiant") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenue, {user.prenom} !
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card title="Mes informations">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Nom complet</p>
                <p className="text-sm font-medium text-gray-900">
                  {user.prenom} {user.nom}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-900">
                  {user.email}
                </p>
              </div>
              {user.telephone && (
                <div>
                  <p className="text-xs text-gray-500">Téléphone</p>
                  <p className="text-sm font-medium text-gray-900">
                    {user.telephone}
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card title="Mon statut">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Compte</span>
                <Badge variant="success">Actif</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Rôle</span>
                <Badge variant="primary">Étudiant</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Dashboard pour les enseignants
  if (user?.role === "enseignant") {
    const totalVagues = recentVagues.length;
    const totalEtudiants = recentVagues.reduce(
      (sum, v) => sum + (v.nb_inscrits || 0),
      0,
    );

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenue, {user.prenom} !
          </h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Mes vagues"
            value={totalVagues}
            icon={BookOpen}
            color="primary"
          />
          <StatCard
            title="Total étudiants"
            value={totalEtudiants}
            icon={Users}
            color="green"
          />
          <StatCard
            title="Cours aujourd'hui"
            value="0"
            icon={Calendar}
            color="yellow"
          />
        </div>

        {/* Mes vagues */}
        <Card title="Mes vagues en cours">
          {recentVagues.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Aucune vague assignée</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentVagues.map((vague) => (
                <div
                  key={vague.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{vague.nom}</h4>
                    <p className="text-sm text-gray-600">
                      {vague.niveau_code} •{" "}
                      {vague.salle_nom || "Salle non assignée"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {vague.nb_inscrits || 0} étudiants
                    </p>
                    <Badge variant="primary" size="sm">
                      {vague.statut}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Dashboard pour admin et secrétaire
  const totalUsers = Array.isArray(stats.users)
    ? stats.users.reduce((acc, item) => acc + parseInt(item.total || 0), 0)
    : 0;

  const totalEtudiants = Array.isArray(stats.users)
    ? stats.users.find((item) => item.role === "etudiant")?.total || 0
    : 0;

  const totalVagues =
    stats.vagues?.pagination?.totalItems ||
    stats.vagues?.total ||
    (Array.isArray(recentVagues) ? recentVagues.length : 0);

  const totalInscriptions = stats.inscriptions?.total_inscriptions || 0;
  const inscriptionsActives = stats.inscriptions?.inscriptions_actives || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <div className="text-sm text-gray-600">
          {new Date().toLocaleDateString("fr-FR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* Stats cards principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total utilisateurs"
          value={totalUsers}
          icon={Users}
          color="primary"
          subtitle={`${totalEtudiants} étudiants`}
        />
        <StatCard
          title="Vagues actives"
          value={totalVagues}
          icon={BookOpen}
          color="yellow"
        />
        <StatCard
          title="Inscriptions"
          value={totalInscriptions}
          icon={GraduationCap}
          color="green"
          subtitle={`${inscriptionsActives} actives`}
        />
        <StatCard
          title="Montant collecté"
          value={formatCurrency(stats.finances?.montant_total_paye || 0)}
          icon={DollarSign}
          color="purple"
          subtitle={`sur ${formatCurrency(stats.finances?.montant_total_attendu || 0)}`}
        />
      </div>

      {/* Grille de détails */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Statistiques utilisateurs */}
        <Card title="Répartition des utilisateurs">
          {Array.isArray(stats.users) && stats.users.length > 0 ? (
            <div className="space-y-3">
              {stats.users.map((item) => (
                <div
                  key={item.role}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary-600" />
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {item.role === "enseignant"
                        ? "Enseignants"
                        : item.role === "etudiant"
                          ? "Étudiants"
                          : item.role === "secretaire"
                            ? "Secrétaires"
                            : item.role === "admin"
                              ? "Administrateurs"
                              : item.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-green-600 font-medium">
                      {item.actifs} actifs
                    </span>
                    <span className="text-sm text-gray-400">•</span>
                    <span className="text-sm text-gray-900 font-medium">
                      {item.total} total
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Aucune donnée disponible
            </div>
          )}
        </Card>

        {/* Statistiques financières */}
        <Card title="Statistiques financières">
          {stats.finances ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Montant attendu</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(stats.finances.montant_total_attendu || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-600">Montant payé</span>
                <span className="text-sm font-medium text-green-600">
                  {formatCurrency(stats.finances.montant_total_paye || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-sm text-gray-600">Reste à payer</span>
                <span className="text-sm font-medium text-red-600">
                  {formatCurrency(stats.finances.montant_total_restant || 0)}
                </span>
              </div>

              {/* Barre de progression */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    Taux de paiement
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {stats.finances.montant_total_attendu > 0
                      ? Math.round(
                          (stats.finances.montant_total_paye /
                            stats.finances.montant_total_attendu) *
                            100,
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${
                        stats.finances.montant_total_attendu > 0
                          ? Math.min(
                              (stats.finances.montant_total_paye /
                                stats.finances.montant_total_attendu) *
                                100,
                              100,
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.finances.nb_payes || 0}
                    </p>
                    <p className="text-xs text-gray-500">Payés</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">
                      {stats.finances.nb_partiels || 0}
                    </p>
                    <p className="text-xs text-gray-500">Partiels</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">
                      {stats.finances.nb_non_payes || 0}
                    </p>
                    <p className="text-xs text-gray-500">Non payés</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Aucune donnée financière disponible
            </div>
          )}
        </Card>
      </div>

      {/* Vagues récentes */}
      {recentVagues.length > 0 && (
        <Card title="Vagues récentes">
          <div className="space-y-3">
            {recentVagues.map((vague) => (
              <div
                key={vague.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium text-gray-900">{vague.nom}</h4>
                    <Badge variant="primary" size="sm">
                      {vague.statut}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {vague.niveau_code} • {vague.enseignant_prenom}{" "}
                    {vague.enseignant_nom || "Non assigné"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {vague.nb_inscrits || 0} / {vague.capacite_max || "∞"}
                  </p>
                  <p className="text-xs text-gray-500">inscrits</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Statistiques des niveaux */}
      {Array.isArray(stats.niveaux) && stats.niveaux.length > 0 && (
        <Card title="Statistiques par niveau">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    Niveau
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    Vagues
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    Inscrits
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    Frais total
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.niveaux.map((niveau) => (
                  <tr
                    key={niveau.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">
                        {niveau.code}
                      </span>
                      <span className="text-sm text-gray-600 ml-2">
                        {niveau.nom}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-gray-900">
                      {niveau.nb_vagues || 0}
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-gray-900">
                      {niveau.nb_inscrits || 0}
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(
                        (niveau.frais_inscription || 0) +
                          (niveau.frais_ecolage || 0) +
                          (niveau.frais_livre || 0),
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
