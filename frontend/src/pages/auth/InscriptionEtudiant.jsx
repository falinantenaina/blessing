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
import {
  authService,
  niveauService,
  vagueService,
  inscriptionService,
} from "@/services/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const InscriptionEtudiant = () => {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [vaguesList, setVaguesList] = useState([]);
  const [niveaux, setNiveaux] = useState([]);

  const [modeCours, setModeCours] = useState("salle");
  const [niveauSelected, setNiveauSelected] = useState("");
  const [vagueSelected, setVagueSelected] = useState(null);

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
  });

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

  const vaguesFiltrees = vaguesList.filter(
    (v) =>
      v.statut === "planifie" &&
      (!niveauSelected || v.niveau_id == niveauSelected),
  );

  const handleLoginChange = (e) =>
    setLoginData({ ...loginData, [e.target.name]: e.target.value });

  const handleSignupChange = (e) => {
    const { name, value } = e.target;

    if (name === "mode_cours") {
      setModeCours(value);
      setSignupData({ ...signupData, vague_id: "" });
      setNiveauSelected("");
      setVagueSelected(null);
      return;
    }

    if (name === "niveau_id") {
      setNiveauSelected(value);
      setSignupData({ ...signupData, vague_id: "" });
      setVagueSelected(null);
      return;
    }

    if (name === "vague_id") {
      setSignupData({ ...signupData, vague_id: value });
      const found = vaguesFiltrees.find((v) => v.id == value);
      setVagueSelected(found || null);
      return;
    }

    setSignupData({ ...signupData, [name]: value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.login(loginData.email, loginData.password);
      toast.success("Connexion réussie !");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (modeCours === "salle" && !signupData.vague_id) {
      toast.error("Veuillez choisir une session");
      return;
    }

    setLoading(true);
    try {
      // Préparation du payload avec les clés attendues par le backend
      const payload = {
        etudiant_nom: signupData.nom,
        etudiant_prenom: signupData.prenom,
        etudiant_telephone: signupData.telephone,
        etudiant_email: signupData.email,
        vague_id: signupData.vague_id,
        // Ajout des valeurs par défaut pour les champs requis par le contrôleur
        methode_paiement: "mobile_money",
        frais_inscription_paye: 0,
        montant_ecolage_initial: 0,
        livre1_paye: false,
        livre2_paye: false,
        remarques: "Inscription via site web",
      };

      console.log("Envoi à : /api/inscriptions/public", payload);

      const response = await inscriptionService.create(payload);
      navigate("/register-success");

      if (response) {
        toast.success("Inscription réussie !");
        setIsLogin(true);
      }
    } catch (error) {
      console.error("Détails erreur:", error.response?.data);
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

                    {modeCours === "salle" && (
                      <>
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

                        {niveauSelected && (
                          <div className="space-y-4 mt-4">
                            <h3 className="text-sm font-semibold text-gray-700">
                              Sessions disponibles :
                            </h3>
                            {vaguesFiltrees.length === 0 && (
                              <p className="text-sm text-gray-500">
                                Aucune vague disponible.
                              </p>
                            )}
                            {vaguesFiltrees.map((v) => (
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
                                    {v.nom}
                                  </h4>
                                  <span className="text-xs px-3 py-1 rounded-full bg-gray-100">
                                    {v.capacite_max - (v.nb_inscrits || 0)}{" "}
                                    places
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  📍 {v.salle_nom}
                                </p>
                                <p className="text-sm text-gray-600">
                                  🕒 {v.horaires_resume}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
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
