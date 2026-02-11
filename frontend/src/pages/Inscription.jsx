import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Loading from "@/components/ui/Loading";
import Select from "@/components/ui/Select";
import { inscriptionService, vagueService } from "@/services/api";
import { AlertCircle, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

export default function Inscriptions() {
  const [vagues, setVagues] = useState([]);
  const [loading, setLoading] = useState(false);

  // ===========================
  // Formulaire inscription
  // ===========================
  const [form, setForm] = useState({
    etudiant_nom: "",
    etudiant_prenom: "",
    etudiant_telephone: "",
    etudiant_email: "",

    niveau_id: "",
    vague_id: "",

    // Paiement - MODIFIÉ selon nouveau backend
    methode_paiement: "especes", // especes ou mvola uniquement
    reference_mvola: "", // Obligatoire si mvola

    frais_inscription_paye: false,
    livre_cours_paye: false, // ✅ Nouveau : livre de cours
    livre_exercices_paye: false, // ✅ Nouveau : livre d'exercices

    remarques: "",
  });

  const [errors, setErrors] = useState({});

  // ===========================
  // Charger les vagues
  // ===========================
  useEffect(() => {
    async function fetchVagues() {
      setLoading(true);
      try {
        const res = await vagueService.getAll();
        const data = res.data?.vagues || res.data?.liste || res.data || [];
        setVagues(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        toast.error("Erreur lors du chargement des vagues");
      } finally {
        setLoading(false);
      }
    }

    fetchVagues();
  }, []);

  // ===========================
  // Liste unique des niveaux
  // ===========================
  const niveaux = Array.from(
    new Map(
      vagues.map((v) => [
        v.niveau_id,
        {
          id: v.niveau_id,
          nom: v.niveau_nom,
          code: v.niveau_code,
        },
      ]),
    ).values(),
  );

  // ===========================
  // Filtrer vagues selon niveau + planifiées
  // ===========================
  const vaguesFiltrees = vagues.filter(
    (v) =>
      v.statut === "planifie" &&
      (!form.niveau_id || String(v.niveau_id) === String(form.niveau_id)),
  );

  // ===========================
  // Vague sélectionnée
  // ===========================
  const selectedVague = vagues.find(
    (v) => String(v.id) === String(form.vague_id),
  );

  // ===========================
  // Validation
  // ===========================
  const validateForm = () => {
    const newErrors = {};

    if (!form.etudiant_nom.trim()) {
      newErrors.etudiant_nom = "Nom requis";
    }

    if (!form.etudiant_prenom.trim()) {
      newErrors.etudiant_prenom = "Prénom requis";
    }

    if (!form.etudiant_telephone.trim()) {
      newErrors.etudiant_telephone = "Téléphone requis";
    }

    if (!form.niveau_id) {
      newErrors.niveau_id = "Niveau requis";
    }

    if (!form.vague_id) {
      newErrors.vague_id = "Vague requise";
    }

    // ✅ Validation MVola
    if (form.methode_paiement === "mvola" && !form.reference_mvola.trim()) {
      newErrors.reference_mvola =
        "Référence MVola requise pour ce mode de paiement";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ===========================
  // Handle change
  // ===========================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Reset référence MVola si on change de méthode
    if (name === "methode_paiement" && value !== "mvola") {
      setForm((prev) => ({ ...prev, reference_mvola: "" }));
      setErrors((prev) => ({ ...prev, reference_mvola: "" }));
    }
  };

  // ===========================
  // Submit
  // ===========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs du formulaire");
      return;
    }

    setLoading(true);

    try {
      await inscriptionService.createComplete(form);

      toast.success("Inscription créée avec succès !");

      // Reset formulaire
      setForm({
        etudiant_nom: "",
        etudiant_prenom: "",
        etudiant_telephone: "",
        etudiant_email: "",
        niveau_id: "",
        vague_id: "",
        methode_paiement: "especes",
        reference_mvola: "",
        frais_inscription_paye: false,
        livre_cours_paye: false,
        livre_exercices_paye: false,
        remarques: "",
      });
      setErrors({});
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || "Erreur lors de l'inscription",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading && vagues.length === 0) {
    return <Loading fullScreen message="Chargement..." />;
  }

  // ===========================
  // Render
  // ===========================
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          Création d'une inscription
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations étudiant */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Informations de l'étudiant
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nom"
                name="etudiant_nom"
                value={form.etudiant_nom}
                onChange={handleChange}
                error={errors.etudiant_nom}
                required
              />

              <Input
                label="Prénom"
                name="etudiant_prenom"
                value={form.etudiant_prenom}
                onChange={handleChange}
                error={errors.etudiant_prenom}
                required
              />

              <Input
                label="Téléphone"
                name="etudiant_telephone"
                value={form.etudiant_telephone}
                onChange={handleChange}
                error={errors.etudiant_telephone}
                placeholder="+261 32 00 000 00"
                required
              />

              <Input
                label="Email"
                name="etudiant_email"
                type="email"
                value={form.etudiant_email}
                onChange={handleChange}
                placeholder="email@example.com"
              />
            </div>
          </div>

          {/* Niveau et vague */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Choix de la formation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Niveau"
                name="niveau_id"
                value={form.niveau_id}
                onChange={(e) => {
                  setForm((prev) => ({
                    ...prev,
                    niveau_id: e.target.value,
                    vague_id: "",
                  }));
                  setErrors((prev) => ({
                    ...prev,
                    niveau_id: "",
                    vague_id: "",
                  }));
                }}
                error={errors.niveau_id}
                required
                options={niveaux.map((n) => ({
                  value: n.id,
                  label: `${n.code} - ${n.nom}`,
                }))}
                placeholder="Sélectionner un niveau"
              />

              <Select
                label="Vague"
                name="vague_id"
                value={form.vague_id}
                onChange={handleChange}
                error={errors.vague_id}
                required
                disabled={!form.niveau_id}
                placeholder={
                  form.niveau_id
                    ? "Sélectionner une vague..."
                    : "Choisir d'abord un niveau"
                }
                options={vaguesFiltrees.map((v) => ({
                  value: v.id,
                  label: `${v.nom} (${(v.capacite_max || 0) - (v.nb_inscrits || 0)} places)`,
                }))}
              />
            </div>
          </div>

          {/* Détails vague sélectionnée */}
          {selectedVague && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                📋 Informations sur la vague
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <p>
                  <strong>Niveau :</strong> {selectedVague.niveau_nom} (
                  {selectedVague.niveau_code})
                </p>
                <p>
                  <strong>Salle :</strong>{" "}
                  {selectedVague.salle_nom || "Non assignée"}
                </p>
                <p>
                  <strong>Enseignant :</strong>{" "}
                  {selectedVague.enseignant_prenom}{" "}
                  {selectedVague.enseignant_nom || "Non assigné"}
                </p>
                <p>
                  <strong>Horaires :</strong>{" "}
                  {selectedVague.horaires_resume || "Non défini"}
                </p>
                <p>
                  <strong>Date début :</strong>{" "}
                  {new Date(selectedVague.date_debut).toLocaleDateString(
                    "fr-FR",
                  )}
                </p>
                <p>
                  <strong>Date fin :</strong>{" "}
                  {new Date(selectedVague.date_fin).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>
          )}

          {/* Paiement initial */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Paiement initial
            </h2>

            <div className="space-y-4">
              {/* Méthode de paiement */}
              <Select
                label="Méthode de paiement"
                name="methode_paiement"
                value={form.methode_paiement}
                onChange={handleChange}
                required
                options={[
                  { value: "especes", label: "Espèces" },
                  { value: "mvola", label: "MVola (Mobile Money)" },
                ]}
              />

              {/* Référence MVola (si mvola sélectionné) */}
              {form.methode_paiement === "mvola" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <p className="text-sm text-yellow-800">
                      La référence MVola est <strong>obligatoire</strong> pour
                      ce mode de paiement
                    </p>
                  </div>
                  <Input
                    label="Référence MVola"
                    name="reference_mvola"
                    value={form.reference_mvola}
                    onChange={handleChange}
                    error={errors.reference_mvola}
                    placeholder="Ex: TXN123456789"
                    required
                  />
                </div>
              )}

              {/* Checkboxes paiements */}
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="frais_inscription_paye"
                    checked={form.frais_inscription_paye}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">
                    Frais d'inscription payés
                  </span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="livre_cours_paye"
                    checked={form.livre_cours_paye}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">
                    Livre de cours payé
                  </span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="livre_exercices_paye"
                    checked={form.livre_exercices_paye}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">
                    Livre d'exercices payé
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Remarques */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remarques
            </label>
            <textarea
              name="remarques"
              value={form.remarques}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Remarques ou notes supplémentaires..."
            />
          </div>

          {/* Submit button */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setForm({
                  etudiant_nom: "",
                  etudiant_prenom: "",
                  etudiant_telephone: "",
                  etudiant_email: "",
                  niveau_id: "",
                  vague_id: "",
                  methode_paiement: "especes",
                  reference_mvola: "",
                  frais_inscription_paye: false,
                  livre_cours_paye: false,
                  livre_exercices_paye: false,
                  remarques: "",
                });
                setErrors({});
              }}
            >
              Réinitialiser
            </Button>

            <Button type="submit" variant="primary" loading={loading}>
              <Save className="w-4 h-4 mr-2" />
              Créer l'inscription
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
