import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/HorarioEstudiante.css";

const API_BASE_URL = "http://127.0.0.1:8000/api";

export default function HorarioEstudiante() {
  const [clases, setClases] = useState([]);
  const [fechaHoy, setFechaHoy] = useState("");
  const [horaActual, setHoraActual] = useState("");

  useEffect(() => {
    obtenerFechaHoraActual();
    cargarClases();
    const intervalo = setInterval(obtenerFechaHoraActual, 1000); // actualizar cada segundo
    return () => clearInterval(intervalo);
  }, []);

  const obtenerFechaHoraActual = () => {
    const ahora = new Date();
    const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fechaFormateada = ahora.toLocaleDateString('es-ES', opcionesFecha);
    const hora = ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    setFechaHoy(fechaFormateada);
    setHoraActual(hora);
  };

  const cargarClases = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/clases`);
      const hoy = new Date().toISOString().split("T")[0];
      const clasesHoy = response.data.filter(clase =>
        clase.hora_inicio.startsWith(hoy)
      );
      setClases(clasesHoy);
    } catch (error) {
      console.error("❌ Error cargando clases:", error);
    }
  };

  return (
    <div className="horario-estudiante-container">
      <div className="horario-header">
        <div className="logo-ucsg">
          <span>Facultad de Ingeniería</span>
        </div>
        <div className="hora-actual">
          <span>{horaActual}</span>
          <span role="img" aria-label="clock">🕓</span>
        </div>
      </div>

      <h2 className="titulo-fecha">{fechaHoy.charAt(0).toUpperCase() + fechaHoy.slice(1)}</h2>

      <table className="tabla-horario">
        <thead>
          <tr>
            <th>Profesor</th>
            <th>Materia</th>
            <th>Carrera</th>
            <th>Hora Inicio</th>
            <th>Hora Fin</th>
            <th>Aula</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {clases.map(clase => (
            <tr key={clase.id}>
              <td>{clase.profesor?.nombre || 'Sin asignar'}</td>
              <td>{clase.materia}</td>
              <td>{clase.carrera}</td>
              <td>{new Date(clase.hora_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
              <td>{new Date(clase.hora_fin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
              <td>{clase.aula}</td>
              <td className={`estado ${clase.estado.toLowerCase().replace(" ", "_")}`}>{clase.estado}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
