import { useEffect, useState } from "react";
import { 
  Plus, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX,
  Search,
  Filter,
  X,
  RefreshCw,
  Mail,
  Phone,
  Shield,
  User,
  Users as UsersIcon,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Download,
  Upload,
  Lock,
  Unlock,
  CheckCircle,
  AlertCircle,
  Info,
  Building,
  GraduationCap,
  Briefcase
} from "lucide-react";
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
import Card from "@/components/ui/Card";
import { getRoleLabel, formatShortDate } from "@/utils/helpers";
import toast from "react-hot-toast";

// Configuration des rôles
const ROLE_CONFIG = {
  admin: {
    label: "Administrateur",
    icon: Shield,
    color: "purple",
    bgColor: "bg-purple-50",
    textColor: "text-purple-700",
    borderColor: "border-purple-200"
  },
  secretaire: {
    label: "Secrétaire",
    icon: Building,
    color: "blue",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200"
  },
  enseignant: {
    label: "Enseignant",
    icon: GraduationCap,
    color: "green",
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    borderColor: "border-green-200"
  },
  etudiant: {
    label: "Étudiant",
    icon: UsersIcon,
    color: "orange",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700",
    borderColor: "border-orange-200"
  }
};

// Composant UserCard pour mobile
const UserCard = ({ user, onEdit, onToggleActive, onDelete, onViewDetails }) => {
  const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.etudiant;
  const RoleIcon = roleConfig.icon;

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${roleConfig.bgColor}`}>
            <RoleIcon className={`w-5 h-5 ${roleConfig.textColor}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {user.prenom} {user.nom}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge 
                variant={user.actif ? "success" : "danger"} 
                size="sm"
              >
                {user.actif ? "Actif" : "Inactif"}
              </Badge>
              <span className="text-xs text-gray-500">
                #{user.id}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(user)}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Modifier"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onToggleActive(user)}
            className={`p-1.5 rounded-lg transition-colors ${
              user.actif 
                ? 'text-green-600 hover:bg-green-50' 
                : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
            }`}
            title={user.actif ? "Désactiver" : "Activer"}
          >
            {user.actif ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onDelete(user.id)}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail className="w-4 h-4 text-gray-400" />
          <span className="truncate">{user.email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone className="w-4 h-4 text-gray-400" />
          <span>{user.telephone || "Non renseigné"}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <Badge variant="outline" className={roleConfig.bgColor}>
          <RoleIcon className={`w-3 h-3 mr-1 ${roleConfig.textColor}`} />
          {roleConfig.label}
        </Badge>
        <span className="text-xs text-gray-500">
          Inscrit le {formatShortDate(user.created_at)}
        </span>
      </div>
    </div>
  );
};

// Composant StatCard
const StatCard = ({ title, value, icon: Icon, color = "primary", subtitle }) => {
  const colors = {
    primary: { bg: "bg-blue-50", text: "text-blue-700", icon: "text-blue-600" },
    green: { bg: "bg-green-50", text: "text-green-700", icon: "text-green-600" },
    purple: { bg: "bg-purple-50", text: "text-purple-700", icon: "text-purple-600" },
    yellow: { bg: "bg-yellow-50", text: "text-yellow-700", icon: "text-yellow-600" },
  };

  return (
    <Card className="hover:shadow-lg transition-all border border-gray-100/80">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wider">
              {title}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-2 sm:p-3 rounded-xl ${colors[color].bg}`}>
            <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${colors[color].icon}`} />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  // Filtres
  const [filters, setFilters] = useState({
    role: "",
    actif: "",
    search: "",
  });

  // Formulaire
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    password: "",
    role: "secretaire",
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadUsers();
  }, [filters, pagination.page]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const cleanFilters = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.role && { role: filters.role }),
        ...(filters.actif && { actif: filters.actif }),
        ...(filters.search && { search: filters.search }),
      };

      const response = await userService.getAll(cleanFilters);
      
      // Gestion de la réponse paginée
      if (response.data) {
        if (response.data.data) {
          setUsers(response.data.data || []);
          setPagination(prev => ({
            ...prev,
            total: response.data.pagination?.totalItems || 0,
            totalPages: response.data.pagination?.totalPages || 1
          }));
        } else if (Array.isArray(response.data)) {
          setUsers(response.data);
          setPagination(prev => ({
            ...prev,
            total: response.data.length,
            totalPages: 1
          }));
        }
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.prenom.trim()) {
      errors.prenom = "Le prénom est requis";
    }

    if (!formData.nom.trim()) {
      errors.nom = "Le nom est requis";
    }

    if (!formData.email.trim()) {
      errors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email invalide";
    }

    if (!selectedUser && !formData.password) {
      errors.password = "Le mot de passe est requis";
    } else if (formData.password && formData.password.length < 6) {
      errors.password = "Le mot de passe doit contenir au moins 6 caractères";
    }

    if (formData.telephone && !/^[0-9+\-\s]{8,}$/.test(formData.telephone)) {
      errors.telephone = "Numéro de téléphone invalide";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
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
    setFormErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs du formulaire");
      return;
    }

    try {
      if (selectedUser) {
        await userService.update(selectedUser.id, formData);
        toast.success("Utilisateur modifié avec succès");
      } else {
        await userService.create(formData);
        toast.success("Utilisateur créé avec succès");
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
      toast.success(`Utilisateur ${user.actif ? "désactivé" : "activé"} avec succès`);
      loadUsers();
    } catch (error) {
      toast.error("Impossible de changer le statut");
    }
  };

  const openConfirmDelete = (id) => {
    setDeleteId(id);
    setShowConfirmDelete(true);
  };

  const handleDelete = async () => {
    try {
      await userService.delete(deleteId);
      toast.success("Utilisateur supprimé avec succès");
      loadUsers();
      setShowConfirmDelete(false);
      setDeleteId(null);
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const resetFilters = () => {
    setFilters({
      role: "",
      actif: "",
      search: "",
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Statistiques
  const stats = {
    total: users.length,
    actifs: users.filter(u => u.actif).length,
    admins: users.filter(u => u.role === 'admin').length,
    secretaires: users.filter(u => u.role === 'secretaire').length,
    enseignants: users.filter(u => u.role === 'enseignant').length,
    etudiants: users.filter(u => u.role === 'etudiant').length,
  };

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <Loading fullScreen message="Chargement des utilisateurs..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
      <div className="max-w-screen mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
        
        {/* HEADER */}
        <div className="relative">
          <div className="absolute inset-0 bg-linear-to-r from-primary-600/10 via-primary-400/5 to-transparent rounded-2xl sm:rounded-3xl blur-xl" />
          
          <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl border border-gray-100/80 shadow-sm">
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="p-2 sm:p-3 bg-linear-to-br from-primary-500 to-primary-600 rounded-lg sm:rounded-xl shadow-lg shadow-primary-500/20 shrink-0">
                <UsersIcon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
              </div>
              
              <div className="min-w-0 flex-1 sm:flex-initial">
                <div className="flex items-center flex-wrap gap-2">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent truncate">
                    Gestion des utilisateurs
                  </h1>
                  <Badge variant="primary" className="text-xs sm:text-sm whitespace-nowrap">
                    {stats.total} utilisateur{stats.total > 1 ? 's' : ''}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 flex items-center gap-1 sm:gap-2">
                  <User className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate">
                    Gérez les comptes administrateurs, secrétaires et enseignants
                  </span>
                </p>
              </div>
            </div>

            <Button
              onClick={() => handleOpenModal()}
              variant="primary"
              className="w-full sm:w-auto shadow-lg shadow-primary-500/20 hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 mr-1.5 sm:mr-2 shrink-0" />
              <span className="truncate">Nouvel utilisateur</span>
            </Button>
          </div>
        </div>

        {/* BARRE DE RECHERCHE ET FILTRES */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-100/80 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6">
            <div className="flex flex-row gap-4">
              {/* Recherche */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Rechercher par nom, prénom ou email..."
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-lg sm:rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  value={filters.search}
                  onChange={(e) => {
                    setFilters({ ...filters, search: e.target.value });
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                />
                {filters.search && (
                  <button
                    onClick={() => setFilters({ ...filters, search: "" })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Boutons filtres */}
              <div className="flex items-center gap-2">

                <Button
                  variant="outline"
                  onClick={loadUsers}
                  className="border-gray-200"
                  title="Rafraîchir"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENU PRINCIPAL */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-100/80 shadow-sm overflow-hidden">
          
          {/* En-tête de la liste */}
          <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Liste des utilisateurs
                </h2>
              </div>
              <span className="text-xs text-gray-500 bg-white px-3 py-1.5 rounded-full border border-gray-200">
                {pagination.total} résultat{pagination.total > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Vue Desktop - Tableau */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Inscrit le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center">
                        <div className="p-3 bg-gray-100 rounded-full mb-3">
                          <UsersIcon className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-gray-600 font-medium">Aucun utilisateur trouvé</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {filters.search || filters.role || filters.actif
                            ? "Essayez de modifier vos filtres"
                            : "Commencez par créer un utilisateur"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => {
                    const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.etudiant;
                    const RoleIcon = roleConfig.icon;
                    
                    return (
                      <TableRow key={user.id} className="hover:bg-gray-50/80 transition-colors group">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${roleConfig.bgColor}`}>
                              <RoleIcon className={`w-5 h-5 ${roleConfig.textColor}`} />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {user.prenom} {user.nom}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                #{user.id}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="truncate max-w-50">{user.email}</span>
                            </div>
                            {user.telephone && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span>{user.telephone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={roleConfig.bgColor}>
                            <RoleIcon className={`w-3 h-3 mr-1 ${roleConfig.textColor}`} />
                            {roleConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={user.actif ? "success" : "danger"}
                            className="px-3 py-1.5"
                          >
                            {user.actif ? "Actif" : "Inactif"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600 flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {formatShortDate(user.created_at)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenModal(user)}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openConfirmDelete(user.id)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Vue Mobile - Cartes */}
          <div className="md:hidden">
            <div className="p-4 space-y-4">
              {users.length === 0 ? (
                <div className="text-center py-12">
                  <UsersIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Aucun utilisateur trouvé</p>
                </div>
              ) : (
                users.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    onEdit={handleOpenModal}
                    onToggleActive={handleToggleActive}
                    onDelete={openConfirmDelete}
                  />
                ))
              )}
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50/50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
                  Affichage <span className="font-medium">1</span> –{" "}
                  <span className="font-medium">{Math.min(pagination.limit, pagination.total)}</span>{" "}
                  sur <span className="font-medium">{pagination.total}</span> utilisateur(s)
                </p>

                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="border-gray-200"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1 px-2">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      return (
                        <button
                          key={i}
                          onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                          className={`min-w-8 h-8 px-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                            pagination.page === pageNum
                              ? "bg-primary-500 text-white shadow-md shadow-primary-500/20"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="border-gray-200"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL AJOUT/MODIFICATION */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-linear-to-br from-primary-500 to-primary-600 rounded-lg shadow-lg shadow-primary-500/20">
              {selectedUser ? (
                <Edit className="w-5 h-5 text-white" />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
            </div>
            <span className="text-xl font-bold text-gray-900">
              {selectedUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
            </span>
          </div>
        }
        size="lg"
        className="backdrop-blur-sm"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations personnelles */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <div className="p-1.5 bg-primary-50 rounded-lg">
                <User className="w-4 h-4 text-primary-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">
                Informations personnelles
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  placeholder="Jean"
                  error={formErrors.prenom}
                  className="rounded-xl border-gray-200 focus:ring-2 focus:ring-primary-500/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Nom <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Dupont"
                  error={formErrors.nom}
                  className="rounded-xl border-gray-200 focus:ring-2 focus:ring-primary-500/20"
                  required
                />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <div className="p-1.5 bg-green-50 rounded-lg">
                <Mail className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">
                Contact
              </h3>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jean.dupont@email.com"
                  error={formErrors.email}
                  className="pl-10 rounded-xl border-gray-200"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Téléphone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  placeholder="+261 34 12 345 67"
                  error={formErrors.telephone}
                  className="pl-10 rounded-xl border-gray-200"
                />
              </div>
            </div>
          </div>

          {/* Sécurité */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <div className="p-1.5 bg-purple-50 rounded-lg">
                <Lock className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">
                Sécurité
              </h3>
            </div>

            {!selectedUser && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Mot de passe <span className="text-red-500">*</span>
                </label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  error={formErrors.password}
                  className="rounded-xl border-gray-200"
                  required
                />
                <p className="text-xs text-gray-500">
                  Minimum 6 caractères
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Rôle <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                options={[
                  { label: "Administrateur", value: "admin" },
                  { label: "Secrétaire", value: "secretaire" },
                  { label: "Enseignant", value: "enseignant" },
                ]}
                className="rounded-xl border-gray-200"
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
              className="w-full sm:w-auto px-6 rounded-xl border-gray-200 hover:bg-gray-50"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="w-full sm:w-auto px-8 rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-xl"
            >
              {selectedUser ? (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Mettre à jour
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer l'utilisateur
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL CONFIRMATION SUPPRESSION */}
      <Modal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        title={
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-gray-900">
              Confirmer la suppression
            </span>
          </div>
        }
        size="sm"
        className="backdrop-blur-sm"
      >
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-gray-700 mb-2">
              Êtes-vous sûr de vouloir supprimer cet utilisateur ?
            </p>
            <p className="text-sm text-gray-500">
              Cette action est irréversible.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDelete(false)}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              className="w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}