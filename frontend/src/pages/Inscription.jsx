import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Loading from "@/components/ui/Loading";
import Select from "@/components/ui/Select";
import { inscriptionService, vagueService } from "@/services/api";
import { Save } from "lucide-react";
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

    niveau_id: "", //  Niveau choisi avant vague
    vague_id: "",

    // Paiement
    methode_paiement: "especes",

    frais_inscription_paye: false,
    montant_ecolage_initial: 0,
    livre1_paye: false,
    livre2_paye: false,

    remarques: "",
  });

  // ===========================
  // Charger les vagues
  // ===========================
  useEffect(() => {
    async function fetchVagues() {
      setLoading(true);
      try {
        const res = await vagueService.getAll();
        setVagues(res.data || []);
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
      v.statut === "planifie" && String(v.niveau_id) === String(form.niveau_id),
  );

  // ===========================
  // Vague sélectionnée
  // ===========================
  const selectedVague = vagues.find(
    (v) => String(v.id) === String(form.vague_id),
  );

  // ===========================
  // Handle change
  // ===========================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ===========================
  // Submit
  // ===========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.etudiant_nom ||
      !form.etudiant_prenom ||
      !form.etudiant_telephone ||
      !form.niveau_id ||
      !form.vague_id
    ) {
      toast.error("Nom, prénom, téléphone, niveau et vague sont obligatoires");
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

        frais_inscription_paye: false,
        montant_ecolage_initial: 0,
        livre1_paye: false,
        livre2_paye: false,

        remarques: "",
      });
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || "Erreur lors de l'inscription",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  // ===========================
  // Render
  // ===========================
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Création d'une inscription</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white p-6 rounded-lg shadow"
      >
        {/* ===========================
            Infos étudiant
        =========================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nom"
            name="etudiant_nom"
            value={form.etudiant_nom}
            onChange={handleChange}
            required
          />

          <Input
            label="Prénom"
            name="etudiant_prenom"
            value={form.etudiant_prenom}
            onChange={handleChange}
            required
          />

          <Input
            label="Téléphone"
            name="etudiant_telephone"
            value={form.etudiant_telephone}
            onChange={handleChange}
            required
          />

          <Input
            label="Email"
            name="etudiant_email"
            value={form.etudiant_email}
            onChange={handleChange}
          />
        </div>

        {/* ===========================
            Niveau puis vague
        =========================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Select Niveau */}
          <Select
            label="Niveau"
            name="niveau_id"
            value={form.niveau_id}
            required
            onChange={(e) => {
              // Reset vague quand niveau change
              setForm((prev) => ({
                ...prev,
                niveau_id: e.target.value,
                vague_id: "",
              }));
            }}
            options={niveaux.map((n) => ({
              value: n.id,
              label: `${n.nom} (${n.code})`,
            }))}
          />

          {/* Select Vague filtrée */}
          <Select
            label="Vague"
            name="vague_id"
            value={form.vague_id}
            required
            disabled={!form.niveau_id}
            placeholder={
              form.niveau_id
                ? "Sélectionner une vague..."
                : "Choisir d'abord un niveau"
            }
            onChange={handleChange}
            options={vaguesFiltrees.map((v) => ({
              value: v.id,
              label: `${v.nom} (${v.capacite_max - (v.nb_inscrits || 0)} places)`,
            }))}
          />
        </div>

        {/* ===========================
            Infos brutes vague sélectionnée
        =========================== */}
        {selectedVague && (
          <div className="bg-gray-50 border rounded-lg p-4">
            <h2 className="font-semibold text-gray-700 mb-2">
              Informations sur la vague sélectionnée
            </h2>

            <p>
              <strong>Niveau :</strong> {selectedVague.niveau_nom} (
              {selectedVague.niveau_code})
            </p>

            <p>
              <strong>Salle :</strong> {selectedVague.salle_nom}
            </p>

            <p>
              <strong>Enseignant :</strong> {selectedVague.enseignant_nom}{" "}
              {selectedVague.enseignant_prenom}
            </p>

            <p className="mt-2">
              <strong>Horaires (brut) :</strong>{" "}
              {selectedVague.horaires_resume || "Non défini"}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              <strong>Date début :</strong>{" "}
              {new Date(selectedVague.date_debut).toLocaleDateString()}
              {" | "}
              <strong>Date fin :</strong>{" "}
              {new Date(selectedVague.date_fin).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* ===========================
            Paiement
        =========================== */}
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">Paiement initial</h2>

          {/* Méthode paiement ENUM */}
          <Select
            label="Méthode de paiement"
            name="methode_paiement"
            value={form.methode_paiement}
            onChange={handleChange}
            required
            options={[
              { value: "especes", label: "Espèces" },
              { value: "carte", label: "Carte bancaire" },
              { value: "virement", label: "Virement" },
              { value: "cheque", label: "Chèque" },
              { value: "mobile_money", label: "Mobile Money" },
            ]}
          />

          <label className="flex items-center space-x-2 mt-2">
            <input
              type="checkbox"
              name="frais_inscription_paye"
              checked={form.frais_inscription_paye}
              onChange={handleChange}
            />
            <span>Frais d'inscription payés</span>
          </label>

          <Input
            label="Montant écolage initial"
            name="montant_ecolage_initial"
            type="number"
            value={form.montant_ecolage_initial}
            onChange={handleChange}
          />

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="livre1_paye"
              checked={form.livre1_paye}
              onChange={handleChange}
            />
            <span>Livre 1 payé</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="livre2_paye"
              checked={form.livre2_paye}
              onChange={handleChange}
            />
            <span>Livre 2 payé</span>
          </label>
        </div>

        {/* ===========================
            Remarques
        =========================== */}
        <Input
          label="Remarques"
          name="remarques"
          value={form.remarques}
          onChange={handleChange}
          type="textarea"
        />

        {/* Submit */}
        <Button type="submit" className="mt-4 flex items-center space-x-2">
          <Save size={16} />
          <span>Créer l'inscription</span>
        </Button>
      </form>
    </div>
  );
}
