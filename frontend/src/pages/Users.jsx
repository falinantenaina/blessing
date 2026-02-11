import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, UserCheck, UserX } from "lucide-react";
import { userService } from "@/services/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
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
import { getRoleLabel } from "@/utils/helpers";
import toast from "react-hot-toast";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [filters, setFilters] = useState({
    role: "",
    actif: "",
    search: "",
  });

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    password: "",
    role: "secretaire",
  });

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Créer un objet de filtres propres (sans les champs vides)
      const cleanFilters = {};
      if (filters.role) cleanFilters.role = filters.role;
      if (filters.actif) cleanFilters.actif = filters.actif;
      if (filters.search) cleanFilters.search = filters.search;

      const response = await userService.getAll(cleanFilters);

      // Correction de l'accès aux données : l'API renvoie { data: [...] }
      setUsers(response.data || []);
    } catch (error) {
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        nom: user.nom || "",
        prenom: user.prenom || "",
        email: user.email || "",
        telephone: user.telephone || "",
        password: "",
        role: user.role || "etudiant",
      });
    } else {
      setSelectedUser(null);
      setFormData({
        nom: "",
        prenom: "",
        email: "",
        telephone: "",
        password: "",
        role: "etudiant",
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedUser) {
        await userService.update(selectedUser.id, formData);
        toast.success("Utilisateur modifié");
      } else {
        await userService.create(formData);
        toast.success("Utilisateur créé");
      }
      setShowModal(false);
      loadUsers();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erreur lors de l'enregistrement",
      );
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await userService.toggleActive(user.id);
      toast.success(`Utilisateur ${user.actif ? "désactivé" : "activé"}`);
      loadUsers();
    } catch (error) {
      toast.error("Impossible de changer le statut");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Confirmer la suppression ?")) return;
    try {
      await userService.delete(id);
      toast.success("Utilisateur supprimé");
      loadUsers();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  if (loading && users.length === 0) {
    return <Loading fullScreen />;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Utilisateurs</h1>
        <Button onClick={() => handleOpenModal()} variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Input
          placeholder="Rechercher par nom ou email..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <Select
          value={filters.role}
          onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          options={[
            { label: "Tous les rôles", value: "" },
            { label: "Admin", value: "admin" },
            { label: "Secrétaire", value: "secretaire" },
            { label: "Enseignant", value: "enseignant" },
          ]}
        />
        <Select
          value={filters.actif}
          onChange={(e) => setFilters({ ...filters, actif: e.target.value })}
          options={[
            { label: "Tous les statuts", value: "" },
            { label: "Actifs", value: "true" },
            { label: "Inactifs", value: "false" },
          ]}
        />
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <Table>
          <TableHeader>
            <TableHead>Nom complet</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-gray-500"
                >
                  Aucun utilisateur trouvé
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.prenom || "?"} {user.nom || "?"}
                  </TableCell>
                  <TableCell>{user.email || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getRoleLabel(user.role) || user.role || "?"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.actif ? "success" : "danger"}>
                      {user.actif ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenModal(user)}
                      title="Modifier"
                    >
                      <Edit size={16} />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      onClick={() => handleDelete(user.id)}
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal création / modification */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
      >
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Prénom"
              value={formData.prenom}
              onChange={(e) =>
                setFormData({ ...formData, prenom: e.target.value })
              }
              required
            />
            <Input
              label="Nom"
              value={formData.nom}
              onChange={(e) =>
                setFormData({ ...formData, nom: e.target.value })
              }
              required
            />
          </div>

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
          />

          <Input
            label="Téléphone"
            value={formData.telephone}
            onChange={(e) =>
              setFormData({ ...formData, telephone: e.target.value })
            }
          />

          {!selectedUser && (
            <Input
              label="Mot de passe"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
          )}

          <Select
            label="Rôle"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={[
              { label: "Administrateur", value: "admin" },
              { label: "Secrétaire", value: "secretaire" },
              { label: "Enseignant", value: "enseignant" },
            ]}
          />

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
            >
              Annuler
            </Button>
            <Button type="submit">
              {selectedUser ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
