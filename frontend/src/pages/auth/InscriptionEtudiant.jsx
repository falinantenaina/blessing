import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Mail,
  User,
  Eye,
  EyeOff,
  Calendar,
  Phone,
  Loader2,
} from "lucide-react";
import { vagueService, authService } from "@/services/api"; 
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const InscriptionEtudiant = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vaguesList, setVaguesList] = useState([]);

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    vague_id: "",
    horaire_id: "",
    email: "",
    password: "",
    role: "etudiant",
  });

  // Chargement des vagues
  useEffect(() => {
    const fetchVagues = async () => {
      try {
        const response = await vagueService.getAll({ statut: "planifie" });
        const data = response.data.vagues || response.data || [];
        setVaguesList(data);
      } catch (error) {
        toast.error("Impossible de charger les sessions disponibles");
      }
    };
    fetchVagues();
  }, []);

  // Génération des options aplaties
  const vaguesOptions = vaguesList.flatMap((vague) => {
    if (!vague.horaires || vague.horaires.length === 0) {
      return [
        {
          id: `v-${vague.id}`,
          vague_id: vague.id,
          horaire_id: null,
          label: `${vague.nom} - ${new Date(vague.date_debut).toLocaleDateString()} - ${vague.salle_nom}`,
        },
      ];
    }
    return vague.horaires.map((h) => ({
      id: `v-${vague.id}-h-${h.id}`,
      vague_id: vague.id,
      horaire_id: h.id,
      label: `${vague.nom} - ${new Date(vague.date_debut).toLocaleDateString()} - ${vague.salle_nom} - ${h.heure_debut.substring(0, 5)}:${h.heure_fin.substring(0, 5)}`,
    }));
  });

  const handleLoginChange = (e) =>
    setLoginData({ ...loginData, [e.target.name]: e.target.value });

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    if (name === "vague_selection") {
      const selectedOption = vaguesOptions.find((opt) => opt.id === value);
      setSignupData({
        ...signupData,
        vague_id: selectedOption?.vague_id || "",
        horaire_id: selectedOption?.horaire_id || "",
      });
    } else {
      setSignupData({ ...signupData, [name]: value });
    }
  };

  // --- LOGIQUE DE CONNEXION ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authService.login(loginData);
      toast.success("Connexion réussie !");
      // Redirection selon le rôle ou vers le dashboard
      navigate("/dashboard");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Email ou mot de passe incorrect",
      );
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIQUE D'INSCRIPTION ---
  const handleSignup = async (e) => {
    e.preventDefault();
    if (!signupData.vague_id) {
      return toast.error("Veuillez choisir une vague et un créneau");
    }

    setLoading(true);
    try {
      // On envoie signupData qui contient vague_id et horaire_id
      await authService.register(signupData);
      toast.success("Compte créé avec succès ! Connectez-vous.");
      navigate('/register-success'); 
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erreur lors de l'inscription",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50 overflow-hidden relative">
      <div className="relative h-screen max-h-screen flex overflow-hidden">
        {/* Partie gauche - Info */}
        <div className="hidden lg:block lg:w-1/2 fixed inset-y-0 left-0 z-10 bg-linear-to-br from-[#0a3d5c]/10 to-blue-50">
          <div className="h-full flex flex-col justify-center items-center p-12">
            <div className="max-w-md text-center">
              <img
                src="/blessing-school.png"
                alt="blessing school"
                className="w-60 mx-auto mb-8"
              />
              <div className="space-y-6 text-left max-w-sm mx-auto">
                <div className="flex items-start gap-4 text-lg text-gray-800">
                  <div className="w-10 h-10 rounded-full bg-[#0a3d5c]/10 flex items-center justify-center shrink-0">
                    <BookOpen size={20} className="text-[#0a3d5c]" />
                  </div>
                  <span>Éducation de qualité accessible à tous</span>
                </div>
                <div className="flex items-start gap-4 text-lg text-gray-800">
                  <div className="w-10 h-10 rounded-full bg-[#0a3d5c]/10 flex items-center justify-center shrink-0">
                    <User size={20} className="text-[#0a3d5c]" />
                  </div>
                  <span>Accompagnement personnalisé</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Partie droite - Formulaire */}
        <div className="w-full lg:ml-[50%] lg:w-1/2 h-screen overflow-y-auto">
          <div className="min-h-full flex items-center justify-center p-6 sm:p-8 lg:p-12">
            <div className="w-full max-w-md py-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-[#0a3d5c]">
                  {isLogin ? "Bienvenue !" : "Rejoins-nous"}
                </h2>
              </div>

              <div className="flex mb-10 bg-gray-100 rounded-full p-1.5 shadow-inner">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-3 rounded-full font-medium transition-all ${isLogin ? "bg-white shadow-md text-[#0a3d5c]" : "text-gray-600"}`}
                >
                  Connexion
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-3 rounded-full font-medium transition-all ${!isLogin ? "bg-white shadow-md text-[#0a3d5c]" : "text-gray-600"}`}
                >
                  Inscription
                </button>
              </div>

              <form
                onSubmit={isLogin ? handleLogin : handleSignup}
                className="space-y-5"
              >
                {!isLogin && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="prenom"
                        placeholder="Prénom"
                        onChange={handleSignupChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-[#0a3d5c]/20"
                        required
                        disabled={loading}
                      />
                      <input
                        type="text"
                        name="nom"
                        placeholder="Nom"
                        onChange={handleSignupChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-[#0a3d5c]/20"
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                        <Phone size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        name="telephone"
                        placeholder="Téléphone"
                        onChange={handleSignupChange}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-[#0a3d5c]/20"
                        required
                        disabled={loading}
                      />
                    </div>
                  </>
                )}

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                    <Mail size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    onChange={isLogin ? handleLoginChange : handleSignupChange}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-[#0a3d5c]/20"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Mot de passe"
                    onChange={isLogin ? handleLoginChange : handleSignupChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-[#0a3d5c]/20"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {!isLogin && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 ml-1">
                      Choisir votre créneau
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Calendar size={18} className="text-gray-400" />
                      </div>
                      <select
                        name="vague_selection"
                        onChange={handleSignupChange}
                        required
                        disabled={loading}
                        className="w-full pl-11 pr-10 py-3.5 bg-white border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-[#0a3d5c]/20 outline-none appearance-none cursor-pointer text-sm"
                      >
                        <option value="">Sélectionner une session...</option>
                        {vaguesOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-[#0a3d5c] text-white font-bold rounded-xl shadow-lg hover:bg-opacity-90 transition-all flex justify-center items-center"
                >
                  {loading ? (
                    <Loader2 className="animate-spin mr-2" size={20} />
                  ) : isLogin ? (
                    "Se connecter"
                  ) : (
                    "S'inscrire"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InscriptionEtudiant;
