import { useEffect, useState } from 'react';
import { Calendar, Clock, Users, MapPin, BookOpen } from 'lucide-react';
import { vagueService } from '@/services/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import { getStatusColor, getStatusLabel } from '@/utils/helpers';
import toast from 'react-hot-toast';

export default function Planning() {
  const [planning, setPlanning] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPlanning();
  }, []);

  const loadPlanning = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await vagueService.getPlanning(); 
      const data = response.data.vagues || response.data.liste || [];
      setPlanning(data);
    } catch (err) {
      console.error('Erreur chargement planning:', err);
      setError('Impossible de charger le planning. Veuillez réessayer.');
      toast.error('Erreur lors du chargement du planning');
    } finally {
      setLoading(false);
    }
  };

  const groupByDay = () => {
    const grouped = {};
    planning.forEach((item) => {
      item.horaires?.forEach((horaire) => {
        const jour = horaire.jour_nom || 'Non défini';
        if (!grouped[jour]) grouped[jour] = [];
        grouped[jour].push({ ...item, horaire });
      });
    });
    return grouped;
  };

  if (loading) return <Loading fullScreen message="Chargement du planning..." />;
  if (error) return <div className="text-center py-12 text-red-600">{error}</div>;

  const groupedPlanning = groupByDay();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Planning des cours</h1>
        <button
          onClick={loadPlanning}
          className="text-sm text-primary-600 hover:text-primary-800 flex items-center gap-1"
        >
          <Calendar className="w-4 h-4" /> Rafraîchir
        </button>
      </div>

      {planning.length === 0 ? (
        <Card className="text-center py-16">
          <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun cours planifié</h3>
          <p className="text-gray-500">Les vagues seront affichées ici une fois créées</p>
        </Card>
      ) : (
        <div className="space-y-10">
          {Object.entries(groupedPlanning).map(([jour, coursDuJour]) => (
            <div key={jour} className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-primary-600" />
                {jour}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coursDuJour.map((vague) => (
                  <Card
                    key={`${vague.id}-${vague.horaire?.id}`}
                    className="hover:shadow-lg transition-all duration-200 border-t-4"
                    style={{ borderTopColor: getStatusColor(vague.statut) }}
                  >
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">{vague.nom}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {vague.niveau_code} • {vague.salle_nom || 'Salle non assignée'}
                          </p>
                        </div>
                        <Badge variant={getStatusColor(vague.statut)}>
                          {getStatusLabel(vague.statut)}
                        </Badge>
                      </div>

                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span>
                            {vague.horaire?.heure_debut} – {vague.horaire?.heure_fin}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span>
                            {vague.nb_inscrits || 0} / {vague.capacite_max || '?'} inscrits
                          </span>
                        </div>

                        {vague.enseignant_nom && (
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-gray-500" />
                            <span>
                              {vague.enseignant_prenom} {vague.enseignant_nom}
                            </span>
                          </div>
                        )}

                        {vague.salle_nom && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span>{vague.salle_nom}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}