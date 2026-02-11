import {
  BookOpen,
  Clock,
  Home,
  Loader2,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  niveauService,
  vagueService,
  inscriptionService,
} from "@/services/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const InscriptionEtudiant = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [vaguesList, setVaguesList] = useState([]);
  const [niveaux, setNiveaux] = useState([]);

  const [modeCours, setModeCours] = useState("salle");
  const [niveauSelected, setNiveauSelected] = useState("");
  const [vagueSelected, setVagueSelected] = useState(null);

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
    vague_id: "",
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

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "mode_cours") {
      setModeCours(value);
      setFormData({ ...formData, vague_id: "" });
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (modeCours === "salle" && !formData.vague_id) {
      toast.error("Veuillez choisir une session");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        etudiant_nom: formData.nom,
        etudiant_prenom: formData.prenom,
        etudiant_telephone: formData.telephone,
        etudiant_email: formData.email,
        vague_id: formData.vague_id,
        methode_paiement: "mobile_money",
        frais_inscription_paye: 0,
        montant_ecolage_initial: 0,
        livre1_paye: false,
        livre2_paye: false,
        remarques: "Inscription via site web",
      };

      await inscriptionService.create(payload);
      toast.success("Inscription réussie !");
      navigate("/register-success");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erreur lors de l'inscription"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-blue-50/30">
      <div className="relative flex min-h-screen">
        {/* Panneau gauche FIXE sur desktop */}
        <div className="hidden lg:block lg:fixed lg:inset-y-0 lg:left-0 lg:w-5/12 xl:w-1/2 bg-linear-to-br from-[#0a3d5c] to-[#0f5a8a] text-white z-10 overflow-hidden">
          <div className="h-full flex flex-col justify-center items-center px-8 xl:px-16 py-12">
            <img
              src="/iconebless.png "
              alt="Blessing School"
              className="w-48 sm:w-56 lg:w-64 xl:w-72 mb-10 drop-shadow-2xl"
            />
            <div className="max-w-md space-y-10 text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                Bienvenue chez Blessing School
              </h1>
              <div className="space-y-8">
                <div className="flex items-start gap-5">
                  <div className="p-3 bg-white/15 rounded-full backdrop-blur-sm shrink-0">
                    <BookOpen size={24} />
                  </div>
                  <p className="text-lg leading-relaxed opacity-90">
                    Une éducation de qualité accessible à tous
                  </p>
                </div>
                <div className="flex items-start gap-5">
                  <div className="p-3 bg-white/15 rounded-full backdrop-blur-sm shrink-0">
                    <User size={24} />
                  </div>
                  <p className="text-lg leading-relaxed opacity-90">
                    Accompagnement personnalisé et suivi régulier
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal - décalé à droite sur desktop */}
        <div className="flex-1 lg:ml-[41.666667%] xl:ml-1/2 min-h-screen flex items-center justify-center px-5 py-10 sm:px-8 md:px-12 lg:px-16">
          <div className="w-full max-w-xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#0a3d5c] mb-3">
                Inscription
              </h2>
              <p className="text-gray-600 text-base sm:text-lg">
                Remplis les champs ci-dessous pour t'inscrire rapidement
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <input
                  type="text"
                  name="prenom"
                  placeholder="Prénom"
                  onChange={handleChange}
                  className="w-full px-5 py-4 rounded-2xl border border-gray-300 focus:border-[#0a3d5c] focus:ring-2 focus:ring-[#0a3d5c]/20 outline-none transition-all shadow-sm text-base"
                  required
                  disabled={isLoading}
                />
                <input
                  type="text"
                  name="nom"
                  placeholder="Nom"
                  onChange={handleChange}
                  className="w-full px-5 py-4 rounded-2xl border border-gray-300 focus:border-[#0a3d5c] focus:ring-2 focus:ring-[#0a3d5c]/20 outline-none transition-all shadow-sm text-base"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Phone size={20} className="text-gray-400" />
                </div>
                <input
                  type="tel"
                  name="telephone"
                  placeholder="Téléphone"
                  onChange={handleChange}
                  className="w-full pl-14 pr-5 py-4 rounded-2xl border border-gray-300 focus:border-[#0a3d5c] focus:ring-2 focus:ring-[#0a3d5c]/20 outline-none transition-all shadow-sm text-base"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 ml-1">
                  Mode de cours
                </label>
                <select
                  name="mode_cours"
                  value={modeCours}
                  onChange={handleChange}
                  className="w-full px-5 py-4 rounded-2xl border border-gray-300 focus:border-[#0a3d5c] focus:ring-2 focus:ring-[#0a3d5c]/20 outline-none transition-all shadow-sm text-base"
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
                    onChange={handleChange}
                    className="w-full px-5 py-4 rounded-2xl border border-gray-300 focus:border-[#0a3d5c] focus:ring-2 focus:ring-[#0a3d5c]/20 outline-none transition-all shadow-sm text-base"
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
                    <div className="space-y-5">
                      <h3 className="text-base font-semibold text-gray-700">
                        Sessions disponibles :
                      </h3>

                      {vaguesFiltrees.length === 0 ? (
                        <div className="p-6 bg-gray-50 rounded-2xl text-center text-gray-600 border border-dashed">
                          Aucune vague disponible pour le moment
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          {vaguesFiltrees.map((v) => (
                            <div
                              key={v.id}
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  vague_id: v.id,
                                }))
                              }
                              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                                formData.vague_id == v.id
                                  ? "border-[#0a3d5c] bg-[#0a3d5c]/5 shadow-md"
                                  : "border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white"
                              }`}
                            >
                              <div className="flex justify-between items-start mb-3">
                                <h4 className="font-bold text-lg text-[#0a3d5c]">
                                  {v.nom}
                                </h4>
                                <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-green-100 text-green-700">
                                  {v.capacite_max - (v.nb_inscrits || 0)} places
                                </span>
                              </div>
                              <div className="space-y-2 text-sm text-gray-700">
                                <p className="flex items-center gap-2">
                                  <Home size={16} className="text-gray-500" />
                                  {v.salle_nom || "Salle non précisée"}
                                </p>
                                <p className="flex items-center gap-2">
                                  <Clock size={16} className="text-gray-500" />
                                  {v.horaires_resume}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Mail size={20} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  onChange={handleChange}
                  className="w-full pl-14 pr-5 py-4 rounded-2xl border border-gray-300 focus:border-[#0a3d5c] focus:ring-2 focus:ring-[#0a3d5c]/20 outline-none transition-all shadow-sm text-base"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4.5 bg-[#0a3d5c] hover:bg-[#08324a] text-white font-bold text-lg rounded-2xl shadow-lg transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed mt-8 flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={22} />
                    Inscription en cours...
                  </>
                ) : (
                  "S'inscrire"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InscriptionEtudiant;