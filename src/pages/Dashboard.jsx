import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000/api";

export default function Dashboard() {
  const [horaActual, setHoraActual] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const navigate = useNavigate();

  // ✅ Verificar si el profesor tiene biometría registrada
  useEffect(() => {
    const verificarBiometria = async () => {
      const nombreProfesor = localStorage.getItem("nombreProfesor") || "Ismael Sosa";
      try {
        const response = await axios.get(`${API_BASE_URL}/profesores`);
        const profesor = response.data.find(p => p.nombre === nombreProfesor);
        if (!profesor || !profesor.face_encoding) {
          setMostrarModal(true);
        }
      } catch (error) {
        console.error("❌ Error al verificar registro biométrico:", error);
      }
    };

    verificarBiometria();
  }, []);

  useEffect(() => {
    const actualizarHora = () => {
      const ahora = new Date();
      const hora = ahora.toLocaleTimeString("es-EC", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setHoraActual(hora);
    };

    actualizarHora();
    const intervalo = setInterval(actualizarHora, 1000);
    return () => clearInterval(intervalo);
  }, []);

  const handleLogout = () => {
    navigate("/"); // ✅ Vuelve al login
  };

  const mostrarAlerta = (titulo) => {
    alert(`${titulo}: Funcionalidad en desarrollo`);
  };

  return (
    <div className="dashboard-wrapper">
      {mostrarModal && (
        <div className="modal-alerta">
          <div className="modal-contenido">
            <h3>Registro biométrico no encontrado</h3>
            <p>No se ha ingresado su registro biométrico.<br />Dé click en el botón para registrarse.</p>
            <button onClick={() => navigate("/registro-facial")}>Registrar Rostro</button>
          </div>
        </div>
      )}

      <header className="dashboard-header">
        <div className="header-left">
        </div>
        <div className="header-center">
          <div className="titulo-sistema">Centro de Apoyo Docente</div>
        </div>
        <div className="header-right">
          <div className="user-dropdown">
            <button onClick={() => setShowMenu(!showMenu)}>Ismael Sosa ▾</button>
            {showMenu && (
              <div className="dropdown-menu">
                <button onClick={handleLogout}>Cerrar sesión</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="dashboard-main-container">
        {/* Panel superior */}
        <section className="panel-superior">
          <div className="materia-encabezado">
            <h3>COMPUTACIÓN (R)</h3>
            <p>A-2025</p>
          </div>

          <div className="acciones-rapidas">
            <button className="accion-btn" onClick={() => mostrarAlerta("Temas a Tratar")}>
              📘<br />Temas a Tratar
            </button>
            <button className="accion-btn" onClick={() => mostrarAlerta("Temas Tratados")}>
              📖<br />Temas Tratados
            </button>
            <button className="accion-btn" onClick={() => mostrarAlerta("Asistencia")}>
              📋<br />Asistencia
            </button>
            <button className="accion-btn" onClick={() => mostrarAlerta("Cerrar Clase")}>
              ⚠️<br />Cerrar Clase
            </button>
          </div>

          <div className="datos-materia">
            <p><strong>Materia:</strong> Resolución de Problemas de Ingeniería</p>
            <p><strong>Paralelo:</strong> A</p>
            <p><strong>Grupo:</strong> 1 - T</p>
            <p><strong>Horario:</strong> 07:00 - 09:00</p>
            <p><strong>Tipo:</strong> <a href="#">CLASES</a></p>
            <p><strong>Modalidad:</strong> Presencial</p>
          </div>

          <div className="reloj-refrescar">
            <button className="refrescar-btn">🔄 Refrescar</button>
            <div className="hora-fecha">
              <div className="icono-hora">🕒</div>
              <div>
                <div className="hora-actual">{horaActual}</div>
                <div className="fecha-hoy">
                  {new Date().toLocaleDateString("es-EC", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Panel inferior en dos columnas */}
        <section className="panel-inferior">
          <div className="panel-materias">
            <div className="panel-title">Materias por dictar Hoy</div>
            <div className="panel-content">
              <h4>COMPUTACIÓN (R)</h4>
              <p><strong>Materia:</strong> Resolución de Problemas de Ingeniería</p>
              <p><strong>Paralelo:</strong> C</p>
              <p><strong>Grupo:</strong> 1 - T</p>
              <p><strong>Horario:</strong> 17:00 - 19:00</p>
              <p><strong>Tipo:</strong> <a href="#">CLASES</a></p>
              <p><strong>Modalidad:</strong> PRESENCIAL</p>
            </div>
          </div>

          <div className="panel-materias-cerradas">
            <div className="panel-title">Materias Cerradas de Hoy</div>
            <div className="panel-content">
              <p>No se encontraron Materias Cerradas el día de hoy</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
