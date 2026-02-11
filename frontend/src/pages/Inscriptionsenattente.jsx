import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Loading from "@/components/ui/Loading";
import Modal from "@/components/ui/Modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { inscriptionService } from "@/services/api";
import { formatCurrency, formatShortDate } from "@/utils/helpers";
import { CheckCircle, Clock, Eye, RefreshCcw, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function InscriptionsEnAttente() {
  const [inscriptions, setInscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInscription, setSelectedInscription] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });

  console.log(inscriptions);

  useEffect(() => {
    loadInscriptions();
  }, [pagination.page]);

  const loadInscriptions = async () => {
    setLoading(true);
    try {
      const response = await inscriptionService.getPendingValidation({
        page: pagination.page,
        limit: pagination.limit,
      });

      const data = response.data || {};

      setInscriptions(data || []);
      setPagination((prev) => ({
        ...prev,
        total: data.total || 0,
      }));
    } catch (error) {
      console.error("Erreur chargement inscriptions:", error);
      toast.error("Erreur lors du chargement des inscriptions");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (inscription) => {
    try {
      const response = await inscriptionService.getById(inscription.id);
      setSelectedInscription(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des détails");
    }
  };

  const handleValidation = async (inscriptionId, statut) => {
    const action = statut === "validee" ? "valider" : "rejeter";

    if (!window.confirm(`Voulez-vous vraiment ${action} cette inscription ?`)) {
      return;
    }

    setActionLoading(true);
    try {
      await inscriptionService.validerInscription(inscriptionId, { statut });

      toast.success(
        statut === "validee"
          ? "Inscription validée avec succès ✅"
          : "Inscription rejetée",
      );

      loadInscriptions();
      setShowDetailsModal(false);
    } catch (error) {
      console.error("Erreur validation:", error);
      toast.error(
        error.response?.data?.message || "Erreur lors de la validation",
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <Loading fullScreen message="Chargement des inscriptions..." />;
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Inscriptions en attente
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {pagination.total} inscription(s) en attente de validation
          </p>
        </div>
        <Button variant="outline" onClick={loadInscriptions}>
          <RefreshCcw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-yellow-600">
                {pagination.total}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {inscriptions.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune inscription en attente
            </h3>
            <p className="text-gray-600">
              Toutes les inscriptions ont été traitées
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableHead>Date</TableHead>
                  <TableHead>Étudiant</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Vague</TableHead>
                  <TableHead>Niveau</TableHead>
                  <TableHead className="text-right">
                    Frais inscription
                  </TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableHeader>
                <TableBody>
                  {inscriptions.map((inscription) => (
                    <TableRow key={inscription.id} className="hover:bg-gray-50">
                      <TableCell className="text-sm">
                        {formatShortDate(inscription.date_inscription)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {inscription.etudiant_nom} {inscription.etudiant_prenom}
                      </TableCell>
                      <TableCell className="text-sm">
                        {inscription.etudiant_telephone}
                      </TableCell>
                      <TableCell className="text-sm">
                        {inscription.vague_nom}
                      </TableCell>
                      <TableCell>
                        <Badge variant="primary">
                          {inscription.niveau_code}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(inscription.frais_inscription)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(inscription)}
                            title="Voir détails"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:text-green-800"
                            onClick={() =>
                              handleValidation(inscription.id, "validee")
                            }
                            title="Valider"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-800"
                            onClick={() =>
                              handleValidation(inscription.id, "rejetee")
                            }
                            title="Rejeter"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page {pagination.page} sur {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page - 1,
                      }))
                    }
                    disabled={pagination.page === 1}
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page + 1,
                      }))
                    }
                    disabled={pagination.page === totalPages}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Détails */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Détails de l'inscription"
        size="lg"
      >
        {selectedInscription && (
          <div className="space-y-6">
            {/* Informations étudiant */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Informations de l'étudiant
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Nom complet</p>
                  <p className="font-medium text-gray-900">
                    {selectedInscription.etudiant_prenom}{" "}
                    {selectedInscription.etudiant_nom}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Téléphone</p>
                  <p className="font-medium text-gray-900">
                    {selectedInscription.etudiant_telephone}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">
                    {selectedInscription.etudiant_email || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date d'inscription</p>
                  <p className="font-medium text-gray-900">
                    {formatShortDate(selectedInscription.date_inscription)}
                  </p>
                </div>
              </div>
            </div>

            {/* Informations formation */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Informations sur la formation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Vague</p>
                  <p className="font-medium text-gray-900">
                    {selectedInscription.vague_nom}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Niveau</p>
                  <p className="font-medium text-gray-900">
                    {selectedInscription.niveau_code} -{" "}
                    {selectedInscription.niveau_nom}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Période</p>
                  <p className="font-medium text-gray-900">
                    {formatShortDate(selectedInscription.date_debut)} au{" "}
                    {formatShortDate(selectedInscription.date_fin)}
                  </p>
                </div>
              </div>
            </div>

            {/* Informations financières */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Informations financières
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">
                    Frais d'inscription
                  </span>
                  <span className="font-medium">
                    {selectedInscription.frais_inscription_paye ? (
                      <Badge variant="success">Payé</Badge>
                    ) : (
                      <Badge variant="danger">Non payé</Badge>
                    )}
                  </span>
                </div>

                {selectedInscription.livres?.map((livre) => (
                  <div
                    key={livre.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <span className="text-sm text-gray-600">
                        Livre{" "}
                        {livre.type_livre === "cours"
                          ? "de cours"
                          : "d'exercices"}
                      </span>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(livre.prix)}
                      </p>
                    </div>
                    <span className="font-medium">
                      {livre.statut_paiement === "paye" ? (
                        <Badge variant="success">Payé</Badge>
                      ) : (
                        <Badge variant="danger">Non payé</Badge>
                      )}
                    </span>
                  </div>
                ))}

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Montant total
                    </span>
                    <span className="text-xl font-bold text-primary-600">
                      {formatCurrency(selectedInscription.montant_total || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-600">Déjà payé</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(selectedInscription.montant_paye || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-gray-600">Reste à payer</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(selectedInscription.montant_restant || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Remarques */}
            {selectedInscription.remarques && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Remarques
                </h3>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {selectedInscription.remarques}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setShowDetailsModal(false)}
              >
                Fermer
              </Button>
              <Button
                variant="danger"
                onClick={() =>
                  handleValidation(selectedInscription.id, "rejetee")
                }
                loading={actionLoading}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rejeter
              </Button>
              <Button
                variant="success"
                onClick={() =>
                  handleValidation(selectedInscription.id, "validee")
                }
                loading={actionLoading}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Valider
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
