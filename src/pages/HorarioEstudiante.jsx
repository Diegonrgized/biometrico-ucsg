import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import "../styles/HorarioEstudiante.css";
import fondoPanel from "../assets/panel-fondo.jpg"; // ✅ Importación de la imagen

const API_BASE_URL = "http://127.0.0.1:8000/api";

export default function HorarioEstudiante() {
  const [clases, setClases] = useState([]);
  const [horaActual, setHoraActual] = useState("");
  const clasesPrevias = useRef([]);

  useEffect(() => {
    cargarClases();
    actualizarHora();

    const intervalo = setInterval(() => {
      actualizarHora();
      cargarClases();
    }, 60000); // cada minuto

    return () => clearInterval(intervalo);
  }, []);

  const actualizarHora = () => {
    const ahora = new Date();
    const hora = ahora.toLocaleTimeString("es-EC", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setHoraActual(hora);
  };

  const cargarClases = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/clases`);
      const ahora = new Date();

      const nuevasClases = response.data.map((clase) => {
        const inicio = new Date(clase.hora_inicio);
        const fin = new Date(clase.hora_fin);
        let estado = "PENDIENTE";

        if (ahora > fin) {
          estado = "FINALIZADA";
        } else if (ahora >= inicio && ahora <= fin) {
          estado = "EN CLASE";
        } else if ((inicio - ahora) / 60000 <= 20 && ahora < inicio) {
          estado = "POR INICIAR";
        }

        return { ...clase, estado };
      });

      const actualizadas = nuevasClases.map((clase) => {
        const anterior = clasesPrevias.current.find((c) => c.id === clase.id);
        return {
          ...clase,
          nuevo: !anterior,
          cambioEstado: anterior && anterior.estado !== clase.estado,
        };
      });

      setClases(actualizadas);
      clasesPrevias.current = nuevasClases;
    } catch (error) {
      console.error("Error al cargar clases:", error);
    }
  };

  const getEstadoClass = (estado) => {
    switch (estado) {
      case "EN CLASE":
        return "estado-en-clase";
      case "POR INICIAR":
        return "estado-por-iniciar";
      case "FINALIZADA":
        return "estado-finalizada";
      default:
        return "estado-pendiente";
    }
  };

  return (
    <div
      className="horario-container"
      style={{
        backgroundImage: `url(${fondoPanel})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        position: "relative",
        minHeight: "100vh",
      }}
    >
      {/* Difuminado */}
      <div className="overlay-blur" />

      {/* Contenido sobre el fondo */}
      <div className="contenido-panel">
        <header className="encabezado-panel-estudiantes">
          <div className="encabezado-panel-contenido">
            <img
              src="/logo_panel_estudiantes.png"
              alt="Logo UCSG"
              className="logo-panel-estudiantes"
            />
          </div>
          <div className="hora-actual">{horaActual}</div>
        </header>

        <div className="tabla-container">
          {clases.length === 0 ? (
            <p className="sin-clases">No hay clases programadas para hoy.</p>
          ) : (
            <motion.table
              className="tabla-horario"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
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
                {clases.map((clase) => (
                  <motion.tr
                    key={clase.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      duration: 0.3,
                      repeat: clase.nuevo || clase.cambioEstado ? 4 : 0,
                      repeatType: "reverse",
                    }}
                    className={clase.nuevo ? "fila-nueva" : ""}
                  >
                    <td>{clase.usuario?.name || "Sin asignar"}</td>
                    <td>{clase.materia}</td>
                    <td>{clase.carrera}</td>
                    <td>{clase.hora_inicio}</td>
                    <td>{clase.hora_fin}</td>
                    <td>{clase.aula}</td>
                    <td>
                      <span
                        className={`estado ${getEstadoClass(clase.estado)}`}
                      >
                        {clase.estado}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </motion.table>
          )}
        </div>
      </div>
    </div>
  );
}
