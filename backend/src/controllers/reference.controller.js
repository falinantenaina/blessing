import ReferenceModel from '../models/reference.model.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { asyncHandler } from '../utils/response.js';

// ===== SALLES =====

export const getSalles = asyncHandler(async (req, res) => {
  const salles = await ReferenceModel.getAllSalles();
  return successResponse(res, salles, 'Liste des salles récupérée avec succès');
});

export const getSalleById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const salle = await ReferenceModel.getSalleById(id);
  
  if (!salle) {
    return errorResponse(res, 'Salle introuvable', 404);
  }
  
  return successResponse(res, salle, 'Salle récupérée avec succès');
});

export const createSalle = asyncHandler(async (req, res) => {
  const { nom, ecole_id, capacite, equipements } = req.body;
  
  const salleId = await ReferenceModel.createSalle({
    nom,
    ecole_id,
    capacite,
    equipements
  });
  
  const salle = await ReferenceModel.getSalleById(salleId);
  
  return successResponse(res, salle, 'Salle créée avec succès', 201);
});

export const updateSalle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nom, ecole_id, capacite, equipements, actif } = req.body;
  
  const updateData = {};
  if (nom) updateData.nom = nom;
  if (ecole_id !== undefined) updateData.ecole_id = ecole_id;
  if (capacite) updateData.capacite = capacite;
  if (equipements !== undefined) updateData.equipements = equipements;
  if (actif !== undefined) updateData.actif = actif;
  
  const updated = await ReferenceModel.updateSalle(id, updateData);
  
  if (!updated) {
    return errorResponse(res, 'Erreur lors de la mise à jour', 400);
  }
  
  const salle = await ReferenceModel.getSalleById(id);
  
  return successResponse(res, salle, 'Salle mise à jour avec succès');
});

export const deleteSalle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const deleted = await ReferenceModel.deleteSalle(id);
  
  if (!deleted) {
    return errorResponse(res, 'Erreur lors de la suppression', 400);
  }
  
  return successResponse(res, null, 'Salle supprimée avec succès');
});

// ===== HORAIRES =====

export const getHoraires = asyncHandler(async (req, res) => {
  const horaires = await ReferenceModel.getAllHoraires();
  return successResponse(res, horaires, 'Liste des horaires récupérée avec succès');
});

export const getHoraireById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const horaire = await ReferenceModel.getHoraireById(id);
  
  if (!horaire) {
    return errorResponse(res, 'Horaire introuvable', 404);
  }
  
  return successResponse(res, horaire, 'Horaire récupéré avec succès');
});

export const createHoraire = asyncHandler(async (req, res) => {
  const { heure_debut, heure_fin, libelle } = req.body;
  
  const horaireId = await ReferenceModel.createHoraire({
    heure_debut,
    heure_fin,
    libelle
  });
  
  const horaire = await ReferenceModel.getHoraireById(horaireId);
  
  return successResponse(res, horaire, 'Horaire créé avec succès', 201);
});

export const updateHoraire = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { heure_debut, heure_fin, libelle, actif } = req.body;
  
  const updateData = {};
  if (heure_debut) updateData.heure_debut = heure_debut;
  if (heure_fin) updateData.heure_fin = heure_fin;
  if (libelle !== undefined) updateData.libelle = libelle;
  if (actif !== undefined) updateData.actif = actif;
  
  const updated = await ReferenceModel.updateHoraire(id, updateData);
  
  if (!updated) {
    return errorResponse(res, 'Erreur lors de la mise à jour', 400);
  }
  
  const horaire = await ReferenceModel.getHoraireById(id);
  
  return successResponse(res, horaire, 'Horaire mis à jour avec succès');
});

export const deleteHoraire = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const deleted = await ReferenceModel.deleteHoraire(id);
  
  if (!deleted) {
    return errorResponse(res, 'Erreur lors de la suppression', 400);
  }
  
  return successResponse(res, null, 'Horaire supprimé avec succès');
});

// ===== JOURS =====

export const getJours = asyncHandler(async (req, res) => {
  const jours = await ReferenceModel.getAllJours();
  return successResponse(res, jours, 'Liste des jours récupérée avec succès');
});

export const getJourById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const jour = await ReferenceModel.getJourById(id);
  
  if (!jour) {
    return errorResponse(res, 'Jour introuvable', 404);
  }
  
  return successResponse(res, jour, 'Jour récupéré avec succès');
});

// ===== ÉCOLES =====

export const getEcoles = asyncHandler(async (req, res) => {
  const ecoles = await ReferenceModel.getAllEcoles();
  return successResponse(res, ecoles, 'Liste des écoles récupérée avec succès');
});

export const getEcoleById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ecole = await ReferenceModel.getEcoleById(id);
  
  if (!ecole) {
    return errorResponse(res, 'École introuvable', 404);
  }
  
  return successResponse(res, ecole, 'École récupérée avec succès');
});

export const createEcole = asyncHandler(async (req, res) => {
  const { nom, adresse, telephone, email } = req.body;
  
  const ecoleId = await ReferenceModel.createEcole({
    nom,
    adresse,
    telephone,
    email
  });
  
  const ecole = await ReferenceModel.getEcoleById(ecoleId);
  
  return successResponse(res, ecole, 'École créée avec succès', 201);
});

export const updateEcole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nom, adresse, telephone, email, actif } = req.body;
  
  const updateData = {};
  if (nom) updateData.nom = nom;
  if (adresse !== undefined) updateData.adresse = adresse;
  if (telephone !== undefined) updateData.telephone = telephone;
  if (email !== undefined) updateData.email = email;
  if (actif !== undefined) updateData.actif = actif;
  
  const updated = await ReferenceModel.updateEcole(id, updateData);
  
  if (!updated) {
    return errorResponse(res, 'Erreur lors de la mise à jour', 400);
  }
  
  const ecole = await ReferenceModel.getEcoleById(id);
  
  return successResponse(res, ecole, 'École mise à jour avec succès');
});

export const deleteEcole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const deleted = await ReferenceModel.deleteEcole(id);
  
  if (!deleted) {
    return errorResponse(res, 'Erreur lors de la suppression', 400);
  }
  
  return successResponse(res, null, 'École supprimée avec succès');
});
