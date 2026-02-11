import { useAuthStore } from "@/store";
import { cn } from "@/utils/helpers";
import {
  BookOpen,
  Building,
  Calendar,
  Clock10,
  DollarSign,
  GraduationCap,
  House,
  LayoutDashboard,
  LogIn,
  LogOut,
  Settings,
  Users,
  Menu,
  X,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Sidebar({ onLogout }) {
  const location = useLocation();
  const { user } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Détecter la taille de l'écran
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(true);
      } else {
        setIsMobileMenuOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Fermer le menu mobile lors du changement de page
  useEffect(() => {
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [location.pathname, isMobile]);

  const navigation = [
    // ... votre tableau navigation existant ...
    {
      name: "Tableau de bord",
      href: "/",
      icon: LayoutDashboard,
      roles: ["admin", "secretaire", "enseignant", "etudiant"],
    },
    {
      name: "Liste étudiant",
      href: "/list-etudiant",
      icon: LogIn,
      roles: ["admin", "secretaire"],
    },
    {
      name: "Utilisateurs",
      href: "/users",
      icon: Users,
      roles: ["admin", "secretaire"],
    },
    {
      name: "Vagues",
      href: "/vagues",
      icon: BookOpen,
      roles: ["admin", "secretaire", "enseignant"],
    },
    {
      name: "Niveaux",
      href: "/niveaux",
      icon: GraduationCap,
      roles: ["admin", "secretaire"],
    },
    {
      name: "Horaires",
      href: "/horaires",
      icon: Clock10,
      roles: ["admin", "secretaire"],
    },
    {
      name: "Planning",
      href: "/planning",
      icon: Calendar,
      roles: ["admin", "secretaire", "enseignant"],
    },
    {
      name: "Finances",
      href: "/finances",
      icon: DollarSign,
      roles: ["admin", "secretaire"],
    },
    {
      name: "Mes cours",
      href: "/mes-cours",
      icon: BookOpen,
      roles: ["etudiant"],
    },
    {
      name: "Salles",
      href: "/salles",
      icon: House,
      roles: ["admin", "secretaire", "enseignant", "etudiant"],
    },
    {
      name: "Référence",
      href: "/reference",
      icon: Building,
      roles: ["admin", "secretaire"],
    },
    {
      name: "Paramètres",
      href: "/settings",
      icon: Settings,
      roles: ["admin", "secretaire", "enseignant", "etudiant"],
    },
  ];

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(user?.role),
  );

  // Version mobile avec bouton hamburger
  if (isMobile) {
    return (
      <>
        {/* Bouton hamburger */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="fixed top-4 left-4 z-50 p-2 bg-gray-900 text-gray-100 rounded-lg shadow-lg lg:hidden"
          aria-label="Menu"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>

        {/* Overlay sombre */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar mobile */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 border-r border-gray-800 text-gray-100 transform transition-transform duration-300 ease-in-out lg:hidden",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex flex-col h-full">
            {/* Logo / Titre */}
            <div className="flex items-center justify-center h-16 px-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <img
                  src="/iconebless.png"
                  alt="Logo Blessing"
                  className="h-9 w-9 object-contain drop-shadow-sm"
                />
                <img
                  src="/descriBlessing.png"
                  alt="Blessing"
                  className="h-7 w-auto object-contain"
                />
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "group relative flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200",
                      isActive
                        ? "text-blue-300 bg-blue-950/50"
                        : "text-gray-300 hover:text-gray-100",
                    )}
                  >
                    <div className="relative flex items-center w-full">
                      <Icon className="w-5 h-5 mr-3 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                      <span className="relative">
                        {item.name}
                        <span
                          className={cn(
                            "absolute left-0 -bottom-0.5 h-0.5 bg-blue-400 transition-all duration-400 ease-out",
                            isActive ? "w-full" : "w-0 group-hover:w-full",
                          )}
                        />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Infos utilisateur + Déconnexion */}
            <div className="p-4 border-t border-gray-800">
              <div className="mb-3 px-3 py-2 bg-gray-800/50 rounded-lg">
                <p className="text-sm font-medium text-gray-100">
                  {user?.prenom} {user?.nom}
                </p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-950/40 hover:text-red-300 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Version desktop
  return (
    <div className="hidden lg:flex lg:flex-col lg:h-full lg:w-64 bg-gray-900 border-r border-gray-800 text-gray-100">
      {/* Logo / Titre */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <img
            src="/iconebless.png"
            alt="Logo Blessing"
            className="h-9 w-9 object-contain drop-shadow-sm"
          />
          <img
            src="/descriBlessing.png"
            alt="Blessing"
            className="h-7 w-auto object-contain"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "group relative flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200",
                isActive
                  ? "text-blue-300 bg-blue-950/50"
                  : "text-gray-300 hover:text-gray-100",
              )}
            >
              <div className="relative flex items-center w-full">
                <Icon className="w-5 h-5 mr-3 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                <span className="relative">
                  {item.name}
                  <span
                    className={cn(
                      "absolute left-0 -bottom-0.5 h-0.5 bg-blue-400 transition-all duration-400 ease-out",
                      isActive ? "w-full" : "w-0 group-hover:w-full",
                    )}
                  />
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Infos utilisateur + Déconnexion */}
      <div className="p-4 border-t border-gray-800">
        <div className="mb-3 px-3 py-2 bg-gray-800/50 rounded-lg">
          <p className="text-sm font-medium text-gray-100">
            {user?.prenom} {user?.nom}
          </p>
          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-950/40 hover:text-red-300 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Déconnexion
        </button>
      </div>
    </div>
  );
}