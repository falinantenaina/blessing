import clsx from "clsx";

export function cn(...inputs) {
  return clsx(inputs);
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "MGA",
    minimumFractionDigits: 0,
  }).format(amount); //.replace('EUR', 'Ar').replace(',', ' ');
}

export function formatDateForInput(date) {
  if (!date) return "";

  return new Date(date).toISOString().split("T")[0];
}

export function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatShortDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("fr-FR");
}

export function getRoleLabel(role) {
  const roles = {
    admin: "Administrateur",
    secretaire: "Secrétaire",
    enseignant: "Enseignant",
    etudiant: "Étudiant",
  };
  return roles[role] || role;
}

export function getStatusLabel(status) {
  const statuses = {
    planifie: "Planifié",
    en_cours: "En cours",
    termine: "Terminé",
    annule: "Annulé",
    actif: "Actif",
    abandonne: "Abandonné",
    suspendu: "Suspendu",
    paye: "Payé",
    partiel: "Paiement partiel",
    non_paye: "Non payé",
  };
  return statuses[status] || status;
}

export function getStatusColor(status) {
  const colors = {
    planifie: "bg-yellow-100 text-yellow-800",
    en_cours: "bg-green-100 text-green-800",
    termine: "bg-gray-100 text-gray-800",
    annule: "bg-red-100 text-red-800",
    actif: "bg-green-100 text-green-800",
    abandonne: "bg-red-100 text-red-800",
    suspendu: "bg-orange-100 text-orange-800",
    paye: "bg-green-100 text-green-800",
    partiel: "bg-yellow-100 text-yellow-800",
    non_paye: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export function getPaymentMethodLabel(method) {
  const methods = {
    especes: "Espèces",
    carte: "Carte bancaire",
    virement: "Virement",
    cheque: "Chèque",
    mobile_money: "Mobile Money",
  };
  return methods[method] || method;
}
