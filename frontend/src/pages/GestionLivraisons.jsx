import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Loading from "@/components/ui/Loading";
import Select from "@/components/ui/Select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { etudiantService, paiementService } from "@/services/api";
import { formatCurrency, formatDate } from "@/utils/helpers";
import { CheckCircle, Package, Search } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function GestionLivraisons() {
  const [loading, setLoading] = useState(true);
  const [livres, setLivres] = useState([]);
  const [filteredLivres, setFilteredLivres] = useState([]);
  const [selected, setSelected] = useState([]);

  // Filtres
  const [filters, setFilters] = useState({
    search: "",
    type_livre: "",
    statut_paiement: "",
    statut_livraison: "non_livre", // Par défaut, afficher non livrés
  });

  // Charger tous les étudiants avec leurs livres
  const loadLivres = async () => {
    setLoading(true);
    try {
      // Récupérer tous les étudiants avec détails
      const response = await etudiantService.getWithDetails({
        limit: 1000,
        statut_inscription: "actif",
      });

      const etudiants = response.data || [];
      const allLivres = [];

      // Extraire tous les livres de tous les étudiants
      etudiants.forEach((etudiant) => {
        if (etudiant.inscription_id) {
          // Livre de cours
          if (etudiant.livre_cours_paye !== null) {
            allLivres.push({
              id: `${etudiant.inscription_id}-cours`,
              inscription_id: etudiant.inscription_id,
              type_livre: "cours",
              prix: etudiant.prix_livre_cours,
              statut_paiement:
                etudiant.livre_cours_paye === "paye" ? "paye" : "non_paye",
              statut_livraison:
                etudiant.livre_cours_livre === "livre" ? "livre" : "non_livre",
              date_paiement:
                etudiant.livre_cours_paye === "paye"
                  ? etudiant.date_inscription
                  : null,
              date_livraison: null,
              // Info étudiant
              etudiant_id: etudiant.id,
              etudiant_nom: etudiant.nom,
              etudiant_prenom: etudiant.prenom,
              etudiant_telephone: etudiant.telephone,
              // Info vague
              vague_id: etudiant.vague_id,
              vague_nom: etudiant.vague_nom,
              niveau_code: etudiant.niveau_code,
            });
          }

          // Livre d'exercices
          if (etudiant.livre_exercices_paye !== null) {
            allLivres.push({
              id: `${etudiant.inscription_id}-exercices`,
              inscription_id: etudiant.inscription_id,
              type_livre: "exercices",
              prix: etudiant.prix_livre_exercices,
              statut_paiement:
                etudiant.livre_exercices_paye === "paye" ? "paye" : "non_paye",
              statut_livraison:
                etudiant.livre_exercices_livre === "livre"
                  ? "livre"
                  : "non_livre",
              date_paiement:
                etudiant.livre_exercices_paye === "paye"
                  ? etudiant.date_inscription
                  : null,
              date_livraison: null,
              // Info étudiant
              etudiant_id: etudiant.id,
              etudiant_nom: etudiant.nom,
              etudiant_prenom: etudiant.prenom,
              etudiant_telephone: etudiant.telephone,
              // Info vague
              vague_id: etudiant.vague_id,
              vague_nom: etudiant.vague_nom,
              niveau_code: etudiant.niveau_code,
            });
          }
        }
      });

      setLivres(allLivres);
      applyFilters(allLivres, filters);
    } catch (error) {
      console.error("Erreur chargement:", error);
      toast.error("Erreur lors du chargement des livres");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLivres();
  }, []);

  // Appliquer les filtres
  const applyFilters = (data, currentFilters) => {
    let filtered = [...data];

    // Filtrer par recherche
    if (currentFilters.search) {
      const searchLower = currentFilters.search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.etudiant_nom?.toLowerCase().includes(searchLower) ||
          item.etudiant_prenom?.toLowerCase().includes(searchLower) ||
          item.etudiant_telephone?.includes(searchLower) ||
          item.vague_nom?.toLowerCase().includes(searchLower),
      );
    }

    // Filtrer par type de livre
    if (currentFilters.type_livre) {
      filtered = filtered.filter(
        (item) => item.type_livre === currentFilters.type_livre,
      );
    }

    // Filtrer par statut de paiement
    if (currentFilters.statut_paiement) {
      filtered = filtered.filter(
        (item) => item.statut_paiement === currentFilters.statut_paiement,
      );
    }

    // Filtrer par statut de livraison
    if (currentFilters.statut_livraison) {
      filtered = filtered.filter(
        (item) => item.statut_livraison === currentFilters.statut_livraison,
      );
    }

    // Trier par nom d'étudiant
    filtered.sort((a, b) => {
      const nameA = `${a.etudiant_nom} ${a.etudiant_prenom}`.toLowerCase();
      const nameB = `${b.etudiant_nom} ${b.etudiant_prenom}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

    setFilteredLivres(filtered);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    applyFilters(livres, newFilters);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const selectable = filteredLivres.filter(
        (item) =>
          item.statut_paiement === "paye" &&
          item.statut_livraison === "non_livre",
      );
      setSelected(
        selectable.map((item) => ({
          inscription_id: item.inscription_id,
          type_livre: item.type_livre,
        })),
      );
    } else {
      setSelected([]);
    }
  };

  const handleSelect = (inscriptionId, typeLivre) => {
    const isSelected = selected.some(
      (s) => s.inscription_id === inscriptionId && s.type_livre === typeLivre,
    );

    if (isSelected) {
      setSelected(
        selected.filter(
          (s) =>
            s.inscription_id !== inscriptionId || s.type_livre !== typeLivre,
        ),
      );
    } else {
      setSelected([
        ...selected,
        { inscription_id: inscriptionId, type_livre: typeLivre },
      ]);
    }
  };

  const handleMarquerLivre = async (inscriptionId, typeLivre) => {
    try {
      await paiementService.updateLivraison(inscriptionId, typeLivre, {
        statut_livraison: "livre",
      });
      toast.success("Livre marqué comme livré");
      loadLivres();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleLivrerSelection = async () => {
    if (selected.length === 0) {
      toast.error("Aucun livre sélectionné");
      return;
    }

    if (!window.confirm(`Marquer ${selected.length} livre(s) comme livrés ?`)) {
      return;
    }

    try {
      await paiementService.livrerBatch(selected);
      toast.success(`${selected.length} livre(s) marqué(s) comme livrés`);
      setSelected([]);
      loadLivres();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const isSelected = (inscriptionId, typeLivre) =>
    selected.some(
      (s) => s.inscription_id === inscriptionId && s.type_livre === typeLivre,
    );

  if (loading) return <Loading fullScreen message="Chargement des livres..." />;

  const selectableCount = filteredLivres.filter(
    (item) =>
      item.statut_paiement === "paye" && item.statut_livraison === "non_livre",
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestion des Livraisons
          </h1>
          <p className="text-gray-600 mt-1">
            {filteredLivres.length} livre(s) à gérer
          </p>
        </div>

        {selected.length > 0 && (
          <Button onClick={handleLivrerSelection} variant="primary">
            <CheckCircle className="w-4 h-4 mr-2" />
            Marquer {selected.length} comme livré(s)
          </Button>
        )}
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Rechercher étudiant ou vague..."
            value={filters.search}
            onChange={(e) =>
              handleFilterChange({ ...filters, search: e.target.value })
            }
            icon={<Search className="w-4 h-4" />}
          />

          <Select
            value={filters.type_livre}
            onChange={(e) =>
              handleFilterChange({ ...filters, type_livre: e.target.value })
            }
            options={[
              { value: "", label: "Tous les types" },
              { value: "cours", label: "Livre de cours" },
              { value: "exercices", label: "Livre d'exercices" },
            ]}
          />

          <Select
            value={filters.statut_paiement}
            onChange={(e) =>
              handleFilterChange({
                ...filters,
                statut_paiement: e.target.value,
              })
            }
            options={[
              { value: "", label: "Tous les statuts de paiement" },
              { value: "paye", label: "Payé" },
              { value: "non_paye", label: "Non payé" },
            ]}
          />

          <Select
            value={filters.statut_livraison}
            onChange={(e) =>
              handleFilterChange({
                ...filters,
                statut_livraison: e.target.value,
              })
            }
            options={[
              { value: "", label: "Tous les statuts de livraison" },
              { value: "non_livre", label: "Non livré" },
              { value: "livre", label: "Livré" },
            ]}
          />
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold">{filteredLivres.length}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <p className="text-sm text-orange-600">Non payés</p>
          <p className="text-2xl font-bold text-orange-600">
            {
              filteredLivres.filter((i) => i.statut_paiement === "non_paye")
                .length
            }
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-600">Payés non livrés</p>
          <p className="text-2xl font-bold text-blue-600">{selectableCount}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-green-600">Livrés</p>
          <p className="text-2xl font-bold text-green-600">
            {
              filteredLivres.filter((i) => i.statut_livraison === "livre")
                .length
            }
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableHead className="w-12">
              <input
                type="checkbox"
                checked={
                  selected.length === selectableCount && selectableCount > 0
                }
                onChange={(e) => handleSelectAll(e.target.checked)}
                disabled={selectableCount === 0}
                className="rounded border-gray-300"
              />
            </TableHead>
            <TableHead>Étudiant</TableHead>
            <TableHead>Vague</TableHead>
            <TableHead>Type de livre</TableHead>
            <TableHead>Prix</TableHead>
            <TableHead>Paiement</TableHead>
            <TableHead>Livraison</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableHeader>
          <TableBody>
            {filteredLivres.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Aucun livre trouvé</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredLivres.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.statut_paiement === "paye" &&
                      item.statut_livraison === "non_livre" && (
                        <input
                          type="checkbox"
                          checked={isSelected(
                            item.inscription_id,
                            item.type_livre,
                          )}
                          onChange={() =>
                            handleSelect(item.inscription_id, item.type_livre)
                          }
                          className="rounded border-gray-300"
                        />
                      )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {item.etudiant_prenom} {item.etudiant_nom}
                      </p>
                      <p className="text-sm text-gray-600">
                        {item.etudiant_telephone}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.vague_nom}</p>
                      <p className="text-sm text-gray-600">
                        {item.niveau_code}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {item.type_livre === "cours" ? "Cours" : "Exercices"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(item.prix)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <Badge
                        variant={
                          item.statut_paiement === "paye" ? "success" : "danger"
                        }
                      >
                        {item.statut_paiement === "paye" ? "Payé" : "Non payé"}
                      </Badge>
                      {item.date_paiement && (
                        <p className="text-xs text-gray-600 mt-1">
                          {formatDate(item.date_paiement)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <Badge
                        variant={
                          item.statut_livraison === "livre"
                            ? "primary"
                            : "default"
                        }
                      >
                        {item.statut_livraison === "livre"
                          ? "Livré"
                          : "Non livré"}
                      </Badge>
                      {item.date_livraison && (
                        <p className="text-xs text-gray-600 mt-1">
                          {formatDate(item.date_livraison)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {item.statut_paiement === "paye" &&
                      item.statut_livraison === "non_livre" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleMarquerLivre(
                              item.inscription_id,
                              item.type_livre,
                            )
                          }
                        >
                          <Package className="w-4 h-4 mr-2" />
                          Livrer
                        </Button>
                      )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
