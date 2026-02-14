import {
  BookOpen,
  Clock,
  Home,
  Loader2,
  Mail,
  Phone,
  User,
  CheckCircle2,
  Users,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  Award,
  Target,
  TrendingUp,
  Shield,
  Star,
  MessageCircle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { useEffect, useState } from "react";
import { authService, niveauService, vagueService } from "@/services/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const InscriptionEtudiant = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [vaguesList, setVaguesList] = useState([]);
  const [niveaux, setNiveaux] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [modeCours, setModeCours] = useState("salle");
  const [niveauSelected, setNiveauSelected] = useState("");
  const [vagueSelected, setVagueSelected] = useState(null);

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
    password: "",
    vague_id: "",
    role: "etudiant",
    mode_cours: "salle",
  });

  const isStep1Complete =
    formData.prenom &&
    formData.nom &&
    formData.telephone &&
    formData.password &&
    formData.password.length >= 6;
  const isStep2Complete = modeCours !== "";
  const isStep3Complete =
    modeCours === "ligne" || (modeCours === "salle" && formData.vague_id);

  const totalSteps = modeCours === "ligne" ? 2 : 3;
  const progressPercentage = (currentStep / totalSteps) * 100;

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

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "mode_cours") {
      setModeCours(value);
      setFormData({
        ...formData,
        mode_cours: value,
        vague_id: "",
      });
      setNiveauSelected("");
      setVagueSelected(null);
      return;
    }

    if (name === "niveau_id") {
      setNiveauSelected(value);
      setFormData({ ...formData, vague_id: "" });
      setVagueSelected(null);
      return;
    }

    if (name === "vague_id") {
      setFormData({ ...formData, vague_id: value });
      const found = vaguesFiltrees.find((v) => v.id == value);
      setVagueSelected(found || null);
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const goToNextStep = () => {
    if (currentStep === 1 && isStep1Complete) {
      setCurrentStep(2);
    } else if (currentStep === 2 && isStep2Complete) {
      if (modeCours === "ligne") {
        return;
      } else {
        setCurrentStep(3);
      }
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (modeCours === "salle" && !formData.vague_id) {
      toast.error("Veuillez choisir une session");
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setIsLoading(true);
    try {
      await authService.register(formData);
      toast.success("Compte créé avec succès !");
      navigate("/register-success");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erreur lors de l'inscription",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-gray-100 flex">
      <div className="hidden lg:flex lg:w-1/2 xl:w-1/2 bg-linear-to-br from-[#0a3d5c] via-[#0d4a70] to-[#0f5a8a] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 border border-white rounded-full"></div>
          <div className="absolute bottom-20 left-10 w-48 h-48 border border-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/3 w-32 h-32 border border-white rounded-full"></div>
        </div>
        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent"></div>
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          <div>
            <div className="flex flex-col items-center justify-center mb-12">
              <img
                src="/iconebless.png"
                alt="Blessing School"
                className="w-48 xl:w-56 drop-shadow-2xl mb-8"
              />
              <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
                Rejoignez l'Excellence
              </h1>
              <p className="text-xl text-blue-100 font-light">
                Votre parcours vers la réussite commence ici
              </p>
            </div>
            <div className="flex items-center justify-center">
              <div className="space-y-6">
                <div className="flex items-start gap-4 group">
                  <div className="p-3 bg-white/15 rounded-xl backdrop-blur-sm group-hover:bg-white/25 transition-all duration-300">
                    <Target size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-1">
                      Programmes personnalisés
                    </h3>
                    <p className="text-blue-100 text-sm leading-relaxed">
                      Adaptés à votre niveau et à vos objectifs professionnels
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 group">
                  <div className="p-3 bg-white/15 rounded-xl backdrop-blur-sm group-hover:bg-white/25 transition-all duration-300">
                    <TrendingUp size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-1">
                      Suivi de progression
                    </h3>
                    <p className="text-blue-100 text-sm leading-relaxed">
                      Évaluations régulières et feedback personnalisé
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 group">
                  <div className="p-3 bg-white/15 rounded-xl backdrop-blur-sm group-hover:bg-white/25 transition-all duration-300">
                    <Shield size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-1">
                      Certification reconnue
                    </h3>
                    <p className="text-blue-100 text-sm leading-relaxed">
                      Diplômes valorisés sur le marché du travail
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-xl">
          <div className="lg:hidden text-center mb-8">
            <img
              src="/iconebless.png"
              alt="Blessing School"
              className="w-32 mx-auto mb-4"
            />
            <h2 className="text-3xl font-bold text-[#0a3d5c]">Inscription</h2>
          </div>

          <div className="hidden lg:block mb-8">
            <h2 className="text-4xl font-bold text-[#0a3d5c] mb-2">
              Intégrez l’excellence – Inscrivez-vous à Blessing School
            </h2>
            <p className="text-gray-600">
              Une éducation d’élite commence par une simple étape
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#0a3d5c] uppercase tracking-wide">
                  Étape {currentStep} sur {totalSteps}
                </span>
                <span className="text-xs font-medium text-gray-500">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-[#0a3d5c] to-[#0f5a8a] transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {currentStep === 1 && (
                <div className="animate-in fade-in slide-in-from-right-5 duration-500 space-y-5">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-[#0a3d5c] mb-1">
                      Informations personnelles
                    </h3>
                    <p className="text-sm text-gray-500">
                      Renseignez vos coordonnées
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prénom *
                      </label>
                      <input
                        type="text"
                        name="prenom"
                        placeholder="Jean"
                        value={formData.prenom}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#0a3d5c] focus:ring-2 focus:ring-[#0a3d5c]/20 outline-none transition-all"
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom *
                      </label>
                      <input
                        type="text"
                        name="nom"
                        placeholder="Dupont"
                        value={formData.nom}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#0a3d5c] focus:ring-2 focus:ring-[#0a3d5c]/20 outline-none transition-all"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone *
                    </label>
                    <div className="relative">
                      <Phone
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="tel"
                        name="telephone"
                        placeholder="+261 XX XX XXX XX"
                        value={formData.telephone}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:border-[#0a3d5c] focus:ring-2 focus:ring-[#0a3d5c]/20 outline-none transition-all"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="email"
                        name="email"
                        placeholder="votre@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:border-[#0a3d5c] focus:ring-2 focus:ring-[#0a3d5c]/20 outline-none transition-all"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mot de passe *
                    </label>
                    <div className="relative">
                      <Lock
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full pl-12 pr-12 py-3 rounded-lg border border-gray-300 focus:border-[#0a3d5c] focus:ring-2 focus:ring-[#0a3d5c]/20 outline-none transition-all"
                        required
                        disabled={isLoading}
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0a3d5c] cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum 6 caractères
                    </p>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={goToNextStep}
                      disabled={!isStep1Complete}
                      className="group px-6 py-3 bg-linear-to-r from-[#0a3d5c] to-[#0f5a8a] hover:from-[#08324a] hover:to-[#0a3d5c] text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                    >
                      Continuer
                      <ArrowRight
                        size={18}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="animate-in fade-in slide-in-from-right-5 duration-500 space-y-5">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-[#0a3d5c] mb-1">
                      Mode de formation
                    </h3>
                    <p className="text-sm text-gray-500">
                      Choisissez comment vous souhaitez apprendre
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() =>
                        handleChange({
                          target: { name: "mode_cours", value: "salle" },
                        })
                      }
                      className={`relative p-6 rounded-xl border-2 transition-all  ${
                        modeCours === "salle"
                          ? "border-[#0a3d5c] bg-[#0a3d5c]/5 shadow-lg "
                          : "border-gray-200 hover:border-gray-300 cursor-pointer"
                      }`}
                    >
                      {modeCours === "salle" && (
                        <div className="absolute top-3 right-3">
                          <CheckCircle2 size={20} className="text-[#0a3d5c]" />
                        </div>
                      )}
                      <Home
                        size={28}
                        className={`mx-auto mb-3 ${modeCours === "salle" ? "text-[#0a3d5c]" : "text-gray-400"}`}
                      />
                      <div
                        className={`text-sm font-semibold ${modeCours === "salle" ? "text-[#0a3d5c]" : "text-gray-600"}`}
                      >
                        En salle
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Présentiel</p>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleChange({
                          target: { name: "mode_cours", value: "ligne" },
                        })
                      }
                      className={`relative p-6 rounded-xl border-2 transition-all ${
                        modeCours === "ligne"
                          ? "border-[#0a3d5c] bg-[#0a3d5c]/5 shadow-lg"
                          : "border-gray-200 hover:border-gray-300 cursor-pointer"
                      }`}
                    >
                      {modeCours === "ligne" && (
                        <div className="absolute top-3 right-3">
                          <CheckCircle2 size={20} className="text-[#0a3d5c]" />
                        </div>
                      )}
                      <BookOpen
                        size={28}
                        className={`mx-auto mb-3 ${modeCours === "ligne" ? "text-[#0a3d5c]" : "text-gray-400"}`}
                      />
                      <div
                        className={`text-sm font-semibold ${modeCours === "ligne" ? "text-[#0a3d5c]" : "text-gray-600"}`}
                      >
                        En ligne
                      </div>
                      <p className="text-xs text-gray-500 mt-1">À distance</p>
                    </button>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={goToPreviousStep}
                      className="group px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <ArrowLeft
                        size={18}
                        className="group-hover:-translate-x-1 transition-transform"
                      />
                      Retour
                    </button>
                    {modeCours === "ligne" ? (
                      <button
                        type="submit"
                        disabled={!isStep2Complete || isLoading}
                        className="px-6 py-3 bg-linear-to-r from-[#0a3d5c] to-[#0f5a8a] hover:from-[#08324a] hover:to-[#0a3d5c] text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="animate-spin" size={18} />
                            Inscription...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={18} />
                            S'inscrire
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={goToNextStep}
                        disabled={!isStep2Complete}
                        className="group px-6 py-3 bg-linear-to-r from-[#0a3d5c] to-[#0f5a8a] hover:from-[#08324a] hover:to-[#0a3d5c] text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                      >
                        Continuer
                        <ArrowRight
                          size={18}
                          className="group-hover:translate-x-1 transition-transform"
                        />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 3 && modeCours === "salle" && (
                <div className="animate-in fade-in slide-in-from-right-5 duration-500 space-y-5">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-[#0a3d5c] mb-1">
                      Choix de la session
                    </h3>
                    <p className="text-sm text-gray-500">
                      Sélectionnez votre niveau et session
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Niveau d'études *
                    </label>
                    <select
                      name="niveau_id"
                      value={niveauSelected}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#0a3d5c] focus:ring-2 focus:ring-[#0a3d5c]/20 outline-none transition-all"
                      required
                    >
                      <option value="">Sélectionnez...</option>
                      {niveaux.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.nom}
                        </option>
                      ))}
                    </select>
                  </div>

                  {niveauSelected && (
                    <div className="space-y-3 animate-in fade-in duration-300">
                      <label className="block text-sm font-medium text-gray-700">
                        Session *
                      </label>

                      {vaguesFiltrees.length === 0 ? (
                        <div className="p-6 bg-gray-50 rounded-lg text-center text-gray-600 border border-gray-200">
                          <Clock
                            size={32}
                            className="mx-auto mb-2 text-gray-400"
                          />
                          <p className="text-sm">Aucune session disponible</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {vaguesFiltrees.map((v) => (
                            <div
                              key={v.id}
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  vague_id: v.id,
                                }))
                              }
                              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                formData.vague_id == v.id
                                  ? "border-[#0a3d5c] bg-[#0a3d5c]/5 shadow-md"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-[#0a3d5c]">
                                  {v.nom}
                                </h4>
                                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">
                                  {v.capacite_max - (v.nb_inscrits || 0)} places
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 space-y-1">
                                <div className="flex items-center gap-2">
                                  <Home size={14} />
                                  {v.salle_nom || "Salle non précisée"}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock size={14} />
                                  {v.horaires_resume}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={goToPreviousStep}
                      className="group px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <ArrowLeft
                        size={18}
                        className="group-hover:-translate-x-1 transition-transform"
                      />
                      Retour
                    </button>
                    <button
                      type="submit"
                      disabled={!isStep3Complete || isLoading}
                      className="px-6 py-3 bg-linear-to-r from-[#0a3d5c] to-[#0f5a8a] hover:from-[#08324a] hover:to-[#0a3d5c] text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          Inscription...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={18} />
                          S'inscrire
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500 text-center pt-4 border-t border-gray-100">
                En vous inscrivant, vous acceptez nos conditions d'utilisation
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InscriptionEtudiant;