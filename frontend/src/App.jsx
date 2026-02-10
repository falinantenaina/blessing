import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import InscriptionEtudiant from "./pages/auth/InscriptionEtudiant";
import Dashboard from "./pages/Dashboard";
import EtudiantsPage from "./pages/Etudiants";
import Horaires from "./pages/Horaires";
import Inscriptions from "./pages/Inscription";
import Login from "./pages/Login";
import Niveaux from "./pages/Niveaux";
import Planning from "./pages/Planning";
import RegisterSuccess from "./pages/RegisterSuccess";
import Salles from "./pages/Salles";
import Users from "./pages/Users";
import Vagues from "./pages/Vagues";
import { useAuthStore } from "./store";

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/inscription-etudiant" element={<InscriptionEtudiant />} />

        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
        />

        <Route path="/register-success" element={<RegisterSuccess />} />

        {/* Protected routes */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route
            path="/users"
            element={
              <ProtectedRoute roles={["admin", "secretaire"]}>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vagues"
            element={
              <ProtectedRoute roles={["admin", "secretaire", "enseignant"]}>
                <Vagues />
              </ProtectedRoute>
            }
          />
          <Route
            path="/horaires"
            element={
              <ProtectedRoute roles={["admin", "secretaire", "enseignant"]}>
                <Horaires />
              </ProtectedRoute>
            }
          />
          <Route
            path="/etudiants"
            element={
              <ProtectedRoute roles={["admin", "secretaire", "enseignant"]}>
                <EtudiantsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inscription"
            element={
              <ProtectedRoute roles={["admin", "secretaire", "enseignant"]}>
                <Inscriptions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/niveaux"
            element={
              <ProtectedRoute roles={["admin", "secretaire"]}>
                <Niveaux />
              </ProtectedRoute>
            }
          />
          <Route
            path="/planning"
            element={
              <ProtectedRoute roles={["admin", "secretaire", "enseignant"]}>
                <Planning />
              </ProtectedRoute>
            }
          />
          <Route
            path="/salles"
            element={
              <ProtectedRoute roles={["admin", "secretaire", "enseignant"]}>
                <Salles />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
