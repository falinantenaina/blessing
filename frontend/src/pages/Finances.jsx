import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Loading from "@/components/ui/Loading";
import api from "@/lib/axios";
import { formatDate } from "@/utils/dateUtils";
import { formatCurrency, getStatutPaiementBadge } from "@/utils/formatUtils";
import { DollarSign, PieChart, TrendingDown, TrendingUp } from "lucide-react";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function Finances() {
  const [stats, setStats] = useState(null);
  const [inscriptions, setInscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  useEffect(() => {
    // Définir les dates par défaut (début et fin de l'année en cours)
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31);

    setDateDebut(yearStart.toISOString().split("T")[0]);
    setDateFin(yearEnd.toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    if (dateDebut && dateFin) {
      fetchStats();
      fetchInscriptions();
    }
  }, [dateDebut, dateFin]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get("/finances/stats", {
        params: {
          date_debut: dateDebut,
          date_fin: dateFin,
        },
      });
      setStats(response.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des statistiques");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInscriptions = async () => {
    try {
      const response = await api.get("/inscriptions", {
        params: {
          date_debut: dateDebut,
          date_fin: dateFin,
        },
      });
      // Trier par date d'inscription décroissante
      const data = response.data.data || response.data;
      const sorted = data.sort(
        (a, b) => new Date(b.date_inscription) - new Date(a.date_inscription),
      );
      setInscriptions(sorted.slice(0, 10)); // Top 10 dernières inscriptions
    } catch (error) {
      console.error("Erreur lors du chargement des inscriptions:", error);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading size="lg" />
      </div>
    );
  }

  const tauxRecouvrement =
    stats.total_attendu > 0
      ? (stats.total_paye / stats.total_attendu) * 100
      : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Finances</h1>

      {/* Filtres de date */}
      <Card>
        <CardHeader>
          <CardTitle>Période</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Date de début"
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
            />
            <Input
              label="Date de fin"
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total attendu
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(stats.total_attendu)}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total payé</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(stats.total_paye)}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total restant
                </p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {formatCurrency(stats.total_restant)}
                </p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Taux de recouvrement
                </p>
                <p className="text-2xl font-bold text-primary-600 mt-1">
                  {tauxRecouvrement.toFixed(1)}%
                </p>
              </div>
              <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                <PieChart className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Répartition par statut de paiement */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition par statut de paiement</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.repartition_statuts ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <div className="text-4xl font-bold text-green-600">
                  {stats.repartition_statuts.complet || 0}
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  Paiements complets
                </div>
              </div>

              <div className="text-center p-6 bg-orange-50 rounded-lg">
                <div className="text-4xl font-bold text-orange-600">
                  {stats.repartition_statuts.partiel || 0}
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  Paiements partiels
                </div>
              </div>

              <div className="text-center p-6 bg-red-50 rounded-lg">
                <div className="text-4xl font-bold text-red-600">
                  {stats.repartition_statuts.non_paye || 0}
                </div>
                <div className="text-sm text-gray-600 mt-2">Non payés</div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Aucune donnée disponible
            </p>
          )}
        </CardContent>
      </Card>

      {/* Paiements par mois */}
      {stats.paiements_par_mois && stats.paiements_par_mois.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Évolution des paiements par mois</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.paiements_par_mois.map((item) => {
                const maxMontant = Math.max(
                  ...stats.paiements_par_mois.map((i) => i.montant),
                );
                const percentage = (item.montant / maxMontant) * 100;

                // Formater le mois (YYYY-MM → Mois Année)
                const [year, month] = item.mois.split("-");
                const date = new Date(year, month - 1);
                const monthName = date.toLocaleDateString("fr-FR", {
                  month: "long",
                  year: "numeric",
                });

                return (
                  <div key={item.mois} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium capitalize">
                        {monthName}
                      </span>
                      <span className="text-gray-600">
                        {formatCurrency(item.montant)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dernières inscriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Dernières inscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {inscriptions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Étudiant</TableHead>
                  <TableHead>Vague</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payé</TableHead>
                  <TableHead>Restant</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inscriptions.map((inscription) => (
                  <TableRow key={inscription.id}>
                    <TableCell>
                      {formatDate(inscription.date_inscription)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {inscription.prenoms_etudiant} {inscription.nom_etudiant}
                    </TableCell>
                    <TableCell>{inscription.vague?.nom || "-"}</TableCell>
                    <TableCell>
                      {formatCurrency(inscription.montant_total)}
                    </TableCell>
                    <TableCell className="text-green-600 font-medium">
                      {formatCurrency(inscription.montant_paye)}
                    </TableCell>
                    <TableCell className="text-red-600 font-medium">
                      {formatCurrency(inscription.montant_restant)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatutPaiementBadge(
                          inscription.statut_paiement,
                        )}
                      >
                        {inscription.statut_paiement === "non_paye"
                          ? "Non payé"
                          : inscription.statut_paiement === "partiel"
                            ? "Partiel"
                            : "Complet"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Aucune inscription trouvée
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
