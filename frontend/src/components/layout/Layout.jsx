import { authService } from "@/services/api";
import { useAuthStore } from "@/store";
import toast, { Toaster } from "react-hot-toast";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { cn } from "@/utils/helpers";
import { useState, useEffect } from "react";
import { LogOut, X, AlertCircle, Loader2 } from "lucide-react";

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState("fadeIn");
  
  // États pour le modal de déconnexion
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (displayLocation !== location) {
      setTransitionStage("fadeOut");
      setIsTransitioning(true);
      
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage("fadeIn");
        
        setTimeout(() => {
          setIsTransitioning(false);
        }, 300);
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [location, displayLocation]);

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const handleLogoutCancel = () => {
    setIsLogoutModalOpen(false);
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    
    try {
      await authService.logout();
      logout();
      
      // Petit délai pour montrer le toast avant la redirection
      setTimeout(() => {
        navigate("/login");
      }, 1000);
      
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
      toast.error("Erreur lors de la déconnexion", {
        duration: 4000,
      });
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-linear-to-br from-gray-50 to-gray-100">
      {/* Sidebar - avec la fonction de déconnexion modifiée */}
      <Sidebar onLogout={handleLogoutClick} />

      {/* Main content */}
      <div className="relative flex flex-col flex-1 w-full lg:w-auto overflow-hidden">
        
        {/* Barre de progression animée */}
        {isTransitioning && (
          <div className="absolute top-0 left-0 right-0 z-50 h-1 bg-linear-to-br from-[#0a3d5c] to-[#0f5a8a] animate-progress" />
        )}

        {/* Effet de vague au changement de page */}
        <div className={cn(
          "absolute inset-0 bg-linear-to-r from-blue-500/5 to-purple-500/5 pointer-events-none transition-opacity duration-500",
          isTransitioning ? "opacity-100" : "opacity-0"
        )} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div 
            className={cn(
              "py-4 sm:py-6 px-4 sm:px-6 lg:px-8 transition-all duration-500",
            )}
          >
            <Outlet />
          </div>
        </main>
      </div>

      {/* Modal de confirmation de déconnexion */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Overlay avec animation fade */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-fade-in"
            onClick={handleLogoutCancel}
          />
          
          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-modal-slide-in">
              
              {/* Bouton fermer */}
              <button
                onClick={handleLogoutCancel}
                disabled={isLoggingOut}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Contenu du modal */}
              <div className="p-6">
                {/* Icône d'avertissement */}
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                  {isLoggingOut ? (
                    <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  )}
                </div>

                {/* Titre */}
                <h3 className="text-center text-xl font-semibold text-gray-900 mb-2">
                  {isLoggingOut ? "Déconnexion en cours..." : "Confirmer la déconnexion"}
                </h3>

                {/* Message */}
                <p className="text-center text-gray-600 mb-6">
                  {isLoggingOut 
                    ? "Veuillez patienter pendant que nous vous déconnectons..."
                    : "Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter pour accéder à votre compte."
                  }
                </p>

                {/* Boutons d'action */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleLogoutConfirm}
                    disabled={isLoggingOut}
                    className={cn(
                      "flex-1 inline-flex justify-center items-center px-4 py-2.5 rounded-lg font-medium transition-all duration-200",
                      "bg-red-600 hover:bg-red-700 text-white",
                      "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500",
                      "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600",
                      "transform hover:scale-[1.02] active:scale-[0.98]"
                    )}
                  >
                    {isLoggingOut ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Déconnexion...
                      </>
                    ) : (
                      <>
                        <LogOut className="w-4 h-4 mr-2" />
                        Se déconnecter
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleLogoutCancel}
                    disabled={isLoggingOut}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2.5 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Annuler
                  </button>
                </div>

                {/* Message de session */}
                {!isLoggingOut && (
                  <p className="text-xs text-center text-gray-500 mt-4">
                    Toutes vos sessions seront fermées
                  </p>
                )}
              </div>

              {/* Barre de progression pour la déconnexion */}
              {isLoggingOut && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 rounded-b-xl overflow-hidden">
                  <div className="h-full bg-linear-to-r from-red-500 to-red-600 animate-logout-progress" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#fff",
            color: "#374151",
            borderRadius: "0.75rem",
            boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)",
            animation: "slideIn 0.3s ease-out",
            border: "1px solid #f1f5f9",
          },
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
            style: {
              borderLeft: "4px solid #ef4444",
            },
          },
        }}
      />
    </div>
  );
}