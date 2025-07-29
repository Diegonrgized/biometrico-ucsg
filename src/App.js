import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./pages/Dashboard";
import RegisterFace from "./components/RegistroFacial";
import HorarioEstudiante from "./pages/HorarioEstudiante"; // ✅ Importación ya lista

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <Router>
      <Routes>
        {/* Ruta de Login */}
        <Route
          path="/"
          element={<Login onLoginSuccess={() => setIsAuthenticated(true)} />}
        />

        {/* Ruta del Dashboard */}
        <Route
          path="/dashboard"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />}
        />

        {/* Ruta del Registro Facial */}
        <Route path="/registro-facial" element={<RegisterFace />} />

        {/* ✅ Ruta del Panel de Horario Estudiantil (pública) */}
        <Route path="/horario-estudiante" element={<HorarioEstudiante />} />

        {/* Cualquier otra ruta redirige al login */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
