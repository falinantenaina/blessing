import {
  BookOpen,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";

import { authService, niveauService, vagueService } from "@/services/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const InscriptionEtudiant = () => {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Données backend
  const [vaguesList, setVaguesList] = useState([]);
  const [niveaux, setNiveaux] = useState([]);

  // Choix inscription
  const [modeCours, setModeCours] = useState("salle"); // salle | ligne
  const [niveauSelected, setNiveauSelected] = useState("");
  const [vagueSelected, setVagueSelected] = useState(null);

  // Formulaires
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [signupData, setSignupData] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    vague_id: "",
    email: "",
    password: "",
    role: "etudiant",
    mode_cours: "salle",
  });

  // ============================
  // Charger niveaux
  // ============================
  useEffect(() => {
    async function fetchNiveaux() {
      try {
        const res = await niveauService.getAll();
        setNiveaux(res.data || []);
      } catch (err) {
        toast.error("Impossible de charger les niveaux");
      }
    }
    fetchNiveaux();
  }, []);

  // ============================
  // Charger vagues planifiées
  // ============================
  useEffect(() => {
    async function fetchVagues() {
      try {
        const response = await vagueService.getAll({ statut: "planifie" });
        const data = response.data.vagues || response.data || [];
        setVaguesList(data);
      } catch (error) {
        toast.error("Impossible de charger les sessions disponibles");
      }
    }
    fetchVagues();
  }, []);

  // ============================
  // Filtrer vagues par niveau
  // ============================
  const vaguesFiltrees = vaguesList.filter(
    (v) =>
      v.statut === "planifie" &&
      (!niveauSelected || v.niveau_id == niveauSelected),
  );

  // ============================
  // Handlers
  // ============================
  const handleLoginChange = (e) =>
    setLoginData({ ...loginData, [e.target.name]: e.target.value });

  const handleSignupChange = (e) => {
    const { name, value } = e.target;

    // Choix mode cours
    if (name === "mode_cours") {
      setModeCours(value);

      setSignupData({
        ...signupData,
        mode_cours: value,
        vague_id: "",
      });

      setNiveauSelected("");
      setVagueSelected(null);
      return;
    }

    // Choix niveau
    if (name === "niveau_id") {
      setNiveauSelected(value);
      setSignupData({ ...signupData, vague_id: "" });
      setVagueSelected(null);
      return;
    }

    // Choix vague
    if (name === "vague_id") {
      setSignupData({ ...signupData, vague_id: value });

      const found = vaguesFiltrees.find((v) => v.id == value);
      setVagueSelected(found || null);
      return;
    }

    // Autres champs
    setSignupData({ ...signupData, [name]: value });
  };

  // ============================
  // Connexion
  // ============================
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.login(loginData);
      toast.success("Connexion réussie !");
      navigate("/dashboard");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Email ou mot de passe incorrect",
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // Inscription
  // ============================
  const handleSignup = async (e) => {
    e.preventDefault();

    // Si salle → vague obligatoire
    if (modeCours === "salle" && !signupData.vague_id) {
      return toast.error("Veuillez choisir une vague");
    }

    setLoading(true);

    try {
      await authService.register(signupData);
      toast.success("Compte créé avec succès !");
      navigate("/register-success");
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
                    <User size={20} className="text-[#0aa3d5c]" />
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

              {/* Switch */}
              <div className="flex mb-10 bg-gray-100 rounded-full p-1.5 shadow-inner">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-3 rounded-full font-medium transition-all ${
                    isLogin
                      ? "bg-white shadow-md text-[#0a3d5c]"
                      : "text-gray-600"
                  }`}
                >
                  Connexion
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-3 rounded-full font-medium transition-all ${
                    !isLogin
                      ? "bg-white shadow-md text-[#0a3d5c]"
                      : "text-gray-600"
                  }`}
                >
                  Inscription
                </button>
              </div>

              {/* Form */}
              <form
                onSubmit={isLogin ? handleLogin : handleSignup}
                className="space-y-5"
              >
                {!isLogin && (
                  <>
                    {/* Nom/prénom */}
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

                    {/* Téléphone */}
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

                    {/* ========================= */}
                    {/* Choix mode cours */}
                    {/* ========================= */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700 ml-1">
                        Mode de cours
                      </label>
                      <select
                        name="mode_cours"
                        value={modeCours}
                        onChange={handleSignupChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-[#0a3d5c]/20"
                      >
                        <option value="salle">En salle</option>
                        <option value="ligne">En ligne</option>
                      </select>
                    </div>

                    {/* ========================= */}
                    {/* Si salle → Niveau + Vague */}
                    {/* ========================= */}
                    {modeCours === "salle" && (
                      <>
                        {/* Niveau */}
                        <select
                          name="niveau_id"
                          value={niveauSelected}
                          onChange={handleSignupChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-[#0a3d5c]/20"
                          required
                        >
                          <option value="">Choisir un niveau...</option>
                          {niveaux.map((n) => (
                            <option key={n.id} value={n.id}>
                              {n.nom}
                            </option>
                          ))}
                        </select>

                        {/* Vague */}
                        {modeCours === "salle" && niveauSelected && (
                          <div className="space-y-4 mt-4">
                            <h3 className="text-sm font-semibold text-gray-700">
                              Sessions disponibles :
                            </h3>

                            {vaguesFiltrees.length === 0 && (
                              <p className="text-sm text-gray-500">
                                Aucune vague disponible pour ce niveau.
                              </p>
                            )}

                            {vaguesFiltrees.map((v) => {
                              const placesRestantes =
                                v.capacite_max - (v.nb_inscrits || 0);

                              return (
                                <div
                                  key={v.id}
                                  className={`p-4 border rounded-xl shadow-sm cursor-pointer transition-all ${
                                    signupData.vague_id == v.id
                                      ? "border-[#0a3d5c] bg-[#0a3d5c]/5"
                                      : "hover:border-gray-400"
                                  }`}
                                  onClick={() => {
                                    setSignupData({
                                      ...signupData,
                                      vague_id: v.id,
                                    });
                                    setVagueSelected(v);
                                  }}
                                >
                                  <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-[#0a3d5c]">
                                      {v.nom} ({v.niveau_nom})
                                    </h4>
                                    <span className="text-xs px-3 py-1 rounded-full bg-gray-100">
                                      {placesRestantes} places
                                    </span>
                                  </div>

                                  <p className="text-sm text-gray-600 mt-1">
                                    📍 Salle : {v.salle_nom}
                                  </p>

                                  <p className="text-sm text-gray-600">
                                    🕒 Horaires : {v.horaires_resume}
                                  </p>

                                  <p className="text-sm text-gray-600">
                                    📅 Début :{" "}
                                    {new Date(
                                      v.date_debut,
                                    ).toLocaleDateString()}
                                  </p>

                                  <button
                                    type="button"
                                    className="mt-3 w-full py-2 rounded-lg bg-[#0a3d5c] text-white font-semibold hover:opacity-90"
                                  >
                                    Choisir cette vague
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Infos brute */}
                        {vagueSelected && (
                          <div className="mt-3 p-4 bg-gray-50 border rounded-xl text-sm space-y-1">
                            <p>
                              <b>Vague :</b> {vagueSelected.nom}
                            </p>
                            <p>
                              <b>Niveau :</b> {vagueSelected.niveau_nom}
                            </p>
                            <p>
                              <b>Salle :</b> {vagueSelected.salle_nom}
                            </p>
                            <p>
                              <b>Horaires :</b> {vagueSelected.horaires_resume}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {/* Email */}
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

                {/* Password */}
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

                {/* Submit */}
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
