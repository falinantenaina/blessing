import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import InscriptionEtudiant from "./pages/auth/InscriptionEtudiant";
import Dashboard from "./pages/Dashboard";
import EtudiantsPage from "./pages/Etudiants";
import GestionLivraisons from "./pages/GestionLivraisons";
import GestionPaiementsEtudiant from "./pages/GestionPaiementEtudiant";
import Horaires from "./pages/Horaires";
import Inscriptions from "./pages/Inscription";
import InscriptionsEnAttente from "./pages/Inscriptionsenattente";
import Niveaux from "./pages/Niveaux";
import Planning from "./pages/Planning";
import Salles from "./pages/Salles";
import Users from "./pages/Users";
import Vagues from "./pages/Vagues";

import Login from "./pages/Login";
import RegisterSuccess from "./pages/RegisterSuccess";

import { useAuthStore } from "./store";

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        {/* ===================== */}
        {/* 🌍 Routes publiques */}
        {/* ===================== */}
        <Route path="/" element={<InscriptionEtudiant />} />

        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
          }
        />

        <Route path="/register-success" element={<RegisterSuccess />} />

        {/* ===================== */}
        {/* 🔐 Routes protégées */}
        {/* ===================== */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Page dashboard principale */}
          <Route index element={<Dashboard />} />

          {/* 👤 Users */}
          <Route
            path="users"
            element={
              <ProtectedRoute roles={["admin", "secretaire"]}>
                <Users />
              </ProtectedRoute>
            }
          />

          {/* 🌊 Vagues */}
          <Route
            path="vagues"
            element={
              <ProtectedRoute roles={["admin", "secretaire", "enseignant"]}>
                <Vagues />
              </ProtectedRoute>
            }
          />

          {/* ⏰ Horaires */}
          <Route
            path="horaires"
            element={
              <ProtectedRoute roles={["admin", "secretaire", "enseignant"]}>
                <Horaires />
              </ProtectedRoute>
            }
          />

          {/* 🎓 Étudiants */}
          <Route
            path="etudiants"
            element={
              <ProtectedRoute roles={["admin", "secretaire", "enseignant"]}>
                <EtudiantsPage />
              </ProtectedRoute>
            }
          />

          {/* 📝 Inscriptions */}
          <Route
            path="inscriptions"
            element={
              <ProtectedRoute roles={["admin", "secretaire", "enseignant"]}>
                <Inscriptions />
              </ProtectedRoute>
            }
          />

          {/* 💰 Paiements */}
          <Route
            path="paiements"
            element={
              <ProtectedRoute roles={["admin", "secretaire", "enseignant"]}>
                <GestionPaiementsEtudiant />
              </ProtectedRoute>
            }
          />

          {/* 📦 Livraisons */}
          <Route
            path="livraisons"
            element={
              <ProtectedRoute roles={["admin", "secretaire", "enseignant"]}>
                <GestionLivraisons />
              </ProtectedRoute>
            }
          />

          {/* 📚 Niveaux */}
          <Route
            path="niveaux"
            element={
              <ProtectedRoute roles={["admin", "secretaire"]}>
                <Niveaux />
              </ProtectedRoute>
            }
          />

          {/* 📅 Planning */}
          <Route
            path="planning"
            element={
              <ProtectedRoute roles={["admin", "secretaire", "enseignant"]}>
                <Planning />
              </ProtectedRoute>
            }
          />

          {/* 🏫 Salles */}
          <Route
            path="salles"
            element={
              <ProtectedRoute roles={["admin", "secretaire", "enseignant"]}>
                <Salles />
              </ProtectedRoute>
            }
          />

          {/* ⏳ Inscriptions en attente */}
          <Route
            path="inscriptions-en-attente"
            element={
              <ProtectedRoute roles={["admin", "secretaire"]}>
                <InscriptionsEnAttente />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* ===================== */}
        {/* Catch all */}
        {/* ===================== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
