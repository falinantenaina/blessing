import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { referenceService } from "@/services/api";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Loading from "@/components/ui/Loading";
import Input from "@/components/ui/Input";
import { formatShortDate } from "@/utils/helpers";
import toast from "react-hot-toast";

import { create } from "zustand";

const useSalleStore = create((set) => ({
  salles: [],
  selectedSalle: null,
  setSalles: (salles) => set({ salles }),
  setSelectedSalle: (salle) => set({ selectedSalle: salle }),
}));

export default function Salles() {
  const [salles, setSalles] = useState([]);
  const [ecoles, setEcoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSalle, setSelectedSalle] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [salleDetails, setSalleDetails] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [formData, setFormData] = useState({
    nom: "",
    ecole_id: "1",
    capacite: 20,
    equipements: "",
    actif: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sallesRes, ecolesRes] = await Promise.all([
        referenceService.getSalles(),
        referenceService.getEcoles(),
      ]);

      setSalles(sallesRes.data || []);
      setEcoles(ecolesRes.data || []);
    } catch (error) {
      console.error("Erreur chargement salles:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (salle = null) => {
    if (salle) {
      setSelectedSalle(salle);
      setFormData({
        nom: salle.nom || "",
        ecole_id: salle.ecole_id || "",
        capacite: salle.capacite || 20,
        equipements: salle.equipements || "",
        actif: salle.actif ?? true,
      });
    } else {
      setSelectedSalle(null);
      setFormData({
        nom: "",
        ecole_id: "",
        capacite: 20,
        equipements: "",
        actif: true,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (selectedSalle) {
        await referenceService.updateSalle(selectedSalle.id, formData);
        toast.success("Salle modifiée avec succès");
      } else {
        await referenceService.createSalle(formData);
        toast.success("Salle créée avec succès");
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error("Erreur sauvegarde salle:", error);
      toast.error(
        error.response?.data?.message || "Erreur lors de l'enregistrement",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await referenceService.deleteSalle(id);
      toast.success("Salle supprimée avec succès");
      loadData();
    } catch (error) {
      console.error("Erreur suppression salle:", error);
      toast.error(
        error.response?.data?.message || "Erreur lors de la suppression",
      );
    } finally {
      setLoading(false);
      setShowConfirmDelete(false);
    }
  };

  const openConfirmDelete = (id) => {
    setDeleteId(id);
    setShowConfirmDelete(true);
  };

  if (loading) return <Loading fullScreen />;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Salles</h1>
        <Button onClick={() => handleOpenModal()} variant="primary">
          <Plus className="w-5 h-5 mr-2" />
          Nouvelle salle
        </Button>
      </div>

      {/* Table des salles */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableHead>Nom</TableHead>
            <TableHead>École</TableHead>
            <TableHead>Capacité</TableHead>
            <TableHead>Équipements</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Créé le</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableHeader>
          <TableBody>
            {salles.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-gray-500"
                >
                  Aucune salle trouvée
                </TableCell>
              </TableRow>
            ) : (
              salles.map((salle) => (
                <TableRow key={salle.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{salle.nom}</TableCell>
                  <TableCell>{salle.ecole_nom || "-"}</TableCell>
                  <TableCell>{salle.capacite}</TableCell>
                  <TableCell>{salle.equipements || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={salle.actif ? "success" : "danger"}>
                      {salle.actif ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatShortDate(salle.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(salle)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openConfirmDelete(salle.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal Add/Edit */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedSalle ? "Modifier la salle" : "Nouvelle salle"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Nom de la salle"
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            placeholder="Ex: Salle A"
            required
          />

          <Select
            label="École"
            value={formData.ecole_id || "1"}
            onChange={(e) =>
              setFormData({ ...formData, ecole_id: e.target.value })
            }
            options={ecoles.map((e) => ({
              value: e.id,
              label: e.nom,
            }))}
            placeholder={
              ecoles.length === 0
                ? "Chargement..."
                : "Blessing School (par défaut)"
            }
          />

          <Input
            label="Capacité"
            type="number"
            min="1"
            value={formData.capacite}
            onChange={(e) =>
              setFormData({ ...formData, capacite: e.target.value })
            }
            required
          />

          <Input
            label="Équipements"
            value={formData.equipements}
            onChange={(e) =>
              setFormData({ ...formData, equipements: e.target.value })
            }
            placeholder="Ex: Projecteur, Climatisation"
          />

          <Select
            label="Statut"
            value={formData.actif ? "true" : "false"}
            onChange={(e) =>
              setFormData({ ...formData, actif: e.target.value === "true" })
            }
            options={[
              { value: "true", label: "Actif" },
              { value: "false", label: "Inactif" },
            ]}
            required
          />

          <div className="flex justify-end gap-4 mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Enregistrement..."
                : selectedSalle
                  ? "Modifier"
                  : "Créer"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Détails */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Détails de la salle"
        size="md"
      >
        {salleDetails && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Nom</p>
                <p className="font-medium text-gray-900">{salleDetails.nom}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">École</p>
                <p className="font-medium text-gray-900">
                  {salleDetails.ecole_nom || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Capacité</p>
                <p className="font-medium text-gray-900">
                  {salleDetails.capacite}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Équipements</p>
                <p className="font-medium text-gray-900">
                  {salleDetails.equipements || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Statut</p>
                <Badge variant={salleDetails.actif ? "success" : "danger"}>
                  {salleDetails.actif ? "Actif" : "Inactif"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Créé le</p>
                <p className="font-medium text-gray-900">
                  {formatShortDate(salleDetails.created_at)}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Confirmation Suppression */}
      <Modal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        title="Confirmer la suppression"
        size="sm"
      >
        <p className="text-center mb-6">
          Êtes-vous sûr de vouloir supprimer cette salle ?
        </p>
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => setShowConfirmDelete(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={() => handleDelete(deleteId)}>
            Supprimer
          </Button>
        </div>
      </Modal>
    </div>
  );
}
