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
    role: "etudiant",
  });

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.getAll(filters);
      setUsers(response.data || response);
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
        toast.success("Utilisateur mis à jour");
      } else {
        await userService.create(formData);
        toast.success("Utilisateur créé");
      }
      setShowModal(false);
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur d'enregistrement");
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await userService.toggleActive(user.id);
      toast.success("Statut mis à jour");
      loadUsers();
    } catch (error) {
      toast.error("Erreur de modification");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cet utilisateur ?"))
      return;
    try {
      await userService.delete(id);
      toast.success("Utilisateur supprimé");
      loadUsers();
    } catch (error) {
      toast.error("Erreur de suppression");
    }
  };

  if (loading && users.length === 0) return <Loading fullScreen />;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Utilisateurs</h1>
        <Button onClick={() => handleOpenModal()} variant="primary">
          <Plus className="w-4 h-4 mr-2" /> Nouveau
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
            { label: "Etudiant", value: "etudiant" },
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

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            {/* Supprime le <TableRow> ici s'il est déjà dans ton composant TableHeader */}
            <TableHead>Nom complet</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.prenom} {user.nom}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">{getRoleLabel(user.role)}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.actif ? "success" : "danger"}>
                    {user.actif ? "Actif" : "Inactif"}
                  </Badge>
                </TableCell>
                {/* ... reste des cellules */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={
          selectedUser ? "Modifier l'utilisateur" : "Ajouter un utilisateur"
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
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
              { label: "Admin", value: "admin" },
              { label: "Secrétaire", value: "secretaire" },
              { label: "Enseignant", value: "enseignant" },
              { label: "Etudiant", value: "etudiant" },
            ]}
          />
          <div className="flex justify-end gap-3 mt-8">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowModal(false)}
            >
              Annuler
            </Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
