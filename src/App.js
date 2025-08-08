import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./pages/Dashboard";
import RegisterFace from "./components/RegistroFacial";
import HorarioEstudiante from "./pages/HorarioEstudiante";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <Router>
      <Routes>
        {/* ✅ Ahora la raíz muestra directamente el panel */}
        <Route path="/" element={<HorarioEstudiante />} />

        {/* Ruta de Login */}
        <Route
          path="/login"
          element={<Login onLoginSuccess={() => setIsAuthenticated(true)} />}
        />

        {/* Ruta del Dashboard */}
        <Route
          path="/dashboard"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
        />

        {/* Ruta del Registro Facial */}
        <Route path="/registro-facial" element={<RegisterFace />} />

        {/* Cualquier otra ruta redirige al panel */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
