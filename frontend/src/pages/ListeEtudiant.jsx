import Loading from "@/components/ui/Loading";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
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
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ListeEtudiant() {
  const [etudiants, setEtudiants] = useState([]);
  const [fetchingEtudiants, setFetchingEtudiants] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedEtudiant, setSelectedEtudiant] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const fetchEtudiants = async (page = 1, search = "") => {
    setFetchingEtudiants(true);
    try {
      const res = await etudiantService.getAll({
        page,
        search,
        limit: pagination.limit,
      });

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
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchEtudiants(1, searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const openModal = async (etudiant) => {
    setSelectedEtudiant(null);
    setIsModalOpen(true);
    await fetchEtudiantDetails(etudiant.id);
  };

  return (
    <div className="p-6">
      {/* LISTE PRINCIPALE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-xl font-bold text-[#0a3d5c] flex items-center gap-2">
            <GraduationCap size={24} /> Liste des Étudiants
          </h2>

          <div className="relative w-full md:w-72">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Rechercher un étudiant..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0a3d5c]/20 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {fetchingEtudiants ? (
            <div className="p-12 flex justify-center">
              <Loading />
            </div>
          ) : etudiants.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <GraduationCap size={48} className="mx-auto mb-4 opacity-40" />
              <p>Aucun étudiant trouvé</p>
            </div>
          ) : (
            <>
              <table className="w-full text-left min-w-[900px]">
                <thead className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Étudiant</th>
                    <th className="px-6 py-4 font-semibold">Contact</th>
                    <th className="px-6 py-4 font-semibold text-center">
                      Inscriptions
                    </th>
                    <th className="px-6 py-4 font-semibold">Statut</th>
                    <th className="px-6 py-4 font-semibold text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {etudiants.map((etudiant) => (
                    <tr
                      key={etudiant.id}
                      className="hover:bg-gray-50/70 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-800">
                          {etudiant.nom} {etudiant.prenom}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          #{etudiant.id || "Nouveau"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Phone size={14} /> {etudiant.telephone || "—"}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail size={14} /> {etudiant.email || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-blue-100 px-3 py-1 rounded-full text-xs font-bold text-blue-700">
                          {etudiant.nb_inscriptions || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            etudiant.actif
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {etudiant.actif ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openModal(etudiant)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0a3d5c] text-white rounded-lg hover:bg-[#083049] transition-colors shadow-sm"
                        >
                          <Eye size={16} />
                          Détails
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-600 order-2 sm:order-1">
                  Affichage {(pagination.page - 1) * pagination.limit + 1} –{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  )}{" "}
                  sur {pagination.total}
                </p>

                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <button
                    onClick={() =>
                      fetchEtudiants(pagination.page - 1, searchTerm)
                    }
                    disabled={pagination.page === 1}
                    className="p-2 border rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-sm font-medium px-3">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() =>
                      fetchEtudiants(pagination.page + 1, searchTerm)
                    }
                    disabled={pagination.page === pagination.totalPages}
                    className="p-2 border rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODAL DÉTAILS */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Profil étudiant complet"
        size="xl"
      >
        {loadingDetail ? (
          <div className="p-12 flex justify-center">
            <Loading />
          </div>
        ) : selectedEtudiant ? (
          <div className="space-y-6 pb-4">
            {/* En-tête */}
            <div className="bg-gradient-to-r from-[#0a3d5c] to-[#083049] text-white p-6 rounded-xl shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    {selectedEtudiant.nom_complet}
                  </h2>
                  <div className="flex flex-col gap-1 opacity-90">
                    <p className="flex items-center gap-2">
                      <Phone size={14} /> {selectedEtudiant.telephone}
                    </p>
                    {selectedEtudiant.email && (
                      <p className="flex items-center gap-2">
                        <Mail size={14} /> {selectedEtudiant.email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold">
                    {selectedEtudiant.finance?.resume?.pourcentage_paye || 0}%
                  </div>
                  <div className="text-sm opacity-80">payé</div>
                </div>
              </div>
            </div>

            {/* Stats rapides */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-100 p-5 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="text-green-600" size={20} />
                  <span className="text-sm font-bold uppercase text-green-700">
                    Payé
                  </span>
                </div>
                <div className="text-2xl font-bold text-green-800">
                  {parseInt(
                    selectedEtudiant.finance?.resume?.montant_paye || 0,
                  ).toLocaleString()}{" "}
                  Ar
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-100 p-5 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <AlertCircle className="text-orange-600" size={20} />
                  <span className="text-sm font-bold uppercase text-orange-700">
                    Restant
                  </span>
                </div>
                <div className="text-2xl font-bold text-orange-800">
                  {parseInt(
                    selectedEtudiant.finance?.resume?.montant_restant || 0,
                  ).toLocaleString()}{" "}
                  Ar
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-100 p-5 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="text-purple-600" size={20} />
                  <span className="text-sm font-bold uppercase text-purple-700">
                    Livres
                  </span>
                </div>
                <div className="text-2xl font-bold text-purple-800">
                  {selectedEtudiant.statistiques?.livres?.livres_payes || 0} /{" "}
                  {selectedEtudiant.statistiques?.livres?.total_livres || 0}
                </div>
              </div>
            </div>

            {/* Vagues & Inscriptions – version améliorée */}
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gray-50 p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="text-[#0a3d5c]" size={18} />
                  <h3 className="font-bold text-[#0a3d5c]">
                    Vague et salles
                  </h3>
                </div>
              </div>

              <div className="divide-y divide-gray-100 max-h-[420px] overflow-y-auto bg-white">
                {selectedEtudiant.vagues?.length > 0 ? (
                  selectedEtudiant.vagues.map((vague) => (
                    <div
                      key={vague.inscription_id}
                      className="p-5 hover:bg-blue-50/30 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                        <div>
                          <h4 className="font-bold text-lg text-gray-800">
                            {vague.vague_nom}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {vague.niveau_nom} • {vague.niveau_code || "?"}
                          </p>
                        </div>
                        <span
                          className={`px-4 py-1 rounded-full text-xs font-semibold border ${
                            vague.statut_inscription === "actif"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : vague.statut_inscription === "termine"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-red-50 text-red-700 border-red-200"
                          }`}
                        >
                          {vague.statut_inscription}
                        </span>
                      </div>

                      {/* Mise en avant de la SALLE */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg">
                          <div className="flex items-center gap-2 text-indigo-700 mb-1">
                            <Building size={16} />
                            <span className="font-semibold text-sm">Salle</span>
                          </div>
                          <p className="font-medium text-indigo-900 text-base">
                            {vague.salle_nom || "Non assignée"}
                          </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2 text-gray-600 mb-1">
                            <User size={16} />
                            <span className="font-semibold text-sm">
                              Enseignant
                            </span>
                          </div>
                          <p className="text-gray-800">
                            {vague.enseignant_nom || "—"}
                          </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2 text-gray-600 mb-1">
                            <Clock size={16} />
                            <span className="font-semibold text-sm">
                              Horaires
                            </span>
                          </div>
                          <p className="text-gray-800">
                            {vague.horaires_resume || "—"}
                          </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2 text-gray-600 mb-1">
                            <Calendar size={16} />
                            <span className="font-semibold text-sm">
                              Inscrit le
                            </span>
                          </div>
                          <p className="text-gray-800">
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

                      {/* Livres */}
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="text-xs font-semibold uppercase text-gray-600 mb-3 tracking-wide">
                          Livres
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[1, 2].map((num) => (
                            <div
                              key={num}
                              className="flex items-center justify-between py-1"
                            >
                              <span className="font-medium">Livre {num}</span>
                              <div className="flex items-center gap-2">
                                {vague.livres?.[`livre${num}`]?.paye ? (
                                  <>
                                    <CheckCircle
                                      size={16}
                                      className="text-green-600"
                                    />
                                    <span className="text-green-700 font-medium">
                                      Payé
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle
                                      size={16}
                                      className="text-red-500"
                                    />
                                    <span className="text-red-600">
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
                  ))
                ) : (
                  <div className="p-12 text-center text-gray-500">
                    <BookOpen size={48} className="mx-auto mb-4 opacity-40" />
                    <p>Aucune inscription pour cet étudiant</p>
                  </div>
                )}
              </div>
            </div>

            {/* Historique paiements */}
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gray-50 p-4 border-b flex items-center gap-2">
                <TrendingUp size={18} className="text-[#0a3d5c]" />
                <h3 className="font-bold text-[#0a3d5c]">
                  Historique des paiements
                </h3>
              </div>
              <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {selectedEtudiant.historique_paiements?.length > 0 ? (
                  selectedEtudiant.historique_paiements.map((paiement, idx) => (
                    <div
                      key={idx}
                      className="p-4 hover:bg-gray-50 transition flex justify-between items-start gap-4"
                    >
                      <div>
                        <p className="font-bold text-gray-800">
                          {parseInt(paiement.montant || 0).toLocaleString()} Ar
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {paiement.vague_nom || "?"} •{" "}
                          {paiement.methode_paiement || "?"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {format(
                            new Date(paiement.date_paiement),
                            "dd MMM yyyy",
                            { locale: fr },
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {paiement.type_frais || "?"}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center text-gray-500">
                    <DollarSign size={40} className="mx-auto mb-3 opacity-40" />
                    <p>Aucun paiement enregistré</p>
                  </div>
                )}
              </div>
            </div>

            {/* Boutons */}
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Fermer
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <AlertCircle size={64} className="mx-auto mb-6 opacity-50" />
            <p className="text-lg">
              Impossible de charger les informations de l'étudiant
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
