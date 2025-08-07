import React, { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import axios from "axios";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const API_BASE_URL = "http://127.0.0.1:8000/api";

export default function Login({ onLoginSuccess }) {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [faceMode, setFaceMode] = useState(false);
  const webcamRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarModelos = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models/tiny_face_detector");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models/face_landmark_68");
        await faceapi.nets.faceRecognitionNet.loadFromUri("/models/face_recognition");
        console.log("✅ Modelos cargados correctamente");
      } catch (error) {
        console.error("❌ Error cargando modelos:", error);
        Swal.fire({
          icon: "error",
          title: "Error al cargar modelos",
          text: "No se pudo cargar face-api.js",
        });
      }
    };
    cargarModelos();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        email: usuario,
        password: contrasena,
      });

      const user = response.data;
      localStorage.setItem("usuarioId", user.user_id);
      localStorage.setItem("nombreUsuario", user.name);

      await actualizarClaseEnCurso(user.user_id, user.name);
      onLoginSuccess();
      navigate("/dashboard");
    } catch (error) {
      console.error("❌ Error al iniciar sesión:", error);
      Swal.fire({
        icon: "error",
        title: "Credenciales inválidas",
        text: "Verifica tu correo y contraseña",
      });
    }
  };

  const actualizarClaseEnCurso = async (userId, nombreUsuario) => {
    try {
      const resp = await axios.get(`${API_BASE_URL}/clases`);
      const clases = resp.data;
      const ahora = new Date();

      console.log("🕐 Hora actual del navegador:", ahora.toLocaleString("es-EC"));
      console.log("🔍 Buscando clase para usuario:", userId);

      clases.forEach((c) => {
        console.log(
          `Clase ID ${c.id} - estado: ${c.estado} - user_id: ${c.user_id} - inicio: ${c.hora_inicio} - fin: ${c.hora_fin}`
        );
      });

      const claseVigente = clases.find((c) => {
        if (String(c.user_id) !== String(userId) || c.estado !== "PENDIENTE") return false;

        const inicioHoy = new Date(c.hora_inicio);
        const finHoy = new Date(c.hora_fin);
        const dentroHorario = ahora >= inicioHoy && ahora <= finHoy;

        console.log("⏱ Comparación detallada:");
        console.log("➡️ Hora actual      :", ahora.toLocaleString("es-EC"));
        console.log("🟢 Hora inicio clase:", inicioHoy.toLocaleString("es-EC"));
        console.log("🔴 Hora fin clase   :", finHoy.toLocaleString("es-EC"));
        console.log("✅ ¿Dentro del horario?:", dentroHorario);

        return dentroHorario;
      });

      console.log("🧪 Resultado de búsqueda de clase vigente:", claseVigente);

      if (claseVigente) {
        await axios.put(`${API_BASE_URL}/clases/${claseVigente.id}/estado`, {
          estado: "EN_CLASE",
        });

        Swal.fire({
          icon: "success",
          title: `Clase actualizada a en Clase`,
          text: `Bienvenido ${nombreUsuario}`,
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "info",
          title: `Autenticado correctamente`,
          text: `Hola ${nombreUsuario}, no tiene clase vigente.`,
          timer: 2500,
          showConfirmButton: false,
        });
      }

      localStorage.setItem("usuarioId", userId);
      localStorage.setItem("nombreUsuario", nombreUsuario);
    } catch (error) {
      console.error("❌ Error al actualizar clase:", error);
      Swal.fire({
        icon: "warning",
        title: "Clase no actualizada",
        text: "Rostro reconocido, pero no se pudo actualizar el estado de clase.",
      });
    }
  };

  const iniciarReconocimiento = async () => {
    setFaceMode(true);

    Swal.fire({
      title: "Reconocimiento Facial",
      text: "Iniciando cámara y modelos...",
      icon: "info",
      timer: 1500,
      showConfirmButton: false,
    });

    try {
      const usuarios = await axios.get(`${API_BASE_URL}/usuarios`);
      const labeledDescriptors = await Promise.all(
        usuarios.data
          .filter((u) => u.face_encoding)
          .map(async (u) => {
            const encoding = JSON.parse(u.face_encoding);
            return new faceapi.LabeledFaceDescriptors(
              u.name,
              [new Float32Array(encoding)]
            );
          })
      );

      const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.45);

      const interval = setInterval(async () => {
        if (!webcamRef.current) return;
        const video = webcamRef.current.video;
        if (!video || video.readyState !== 4) return;

        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();

        if (detections.length > 0) {
          const bestMatch = faceMatcher.findBestMatch(detections[0].descriptor);

          if (bestMatch.label !== "unknown") {
            clearInterval(interval);
            console.log(`✅ Usuario reconocido: ${bestMatch.label}`);

            const usuario = usuarios.data.find((u) => u.name === bestMatch.label);
            if (usuario) {
              await actualizarClaseEnCurso(usuario.id, usuario.name);
              onLoginSuccess();
              navigate("/dashboard");
            } else {
              Swal.fire({
                icon: "success",
                title: "Rostro reconocido",
                text: `${bestMatch.label}`,
                timer: 2000,
                showConfirmButton: false,
              });
              onLoginSuccess();
              navigate("/dashboard");
            }
          }
        }
      }, 3000);
    } catch (error) {
      console.error("❌ Error en reconocimiento facial:", error);
      Swal.fire({
        icon: "error",
        title: "Error en reconocimiento",
        text: "Ocurrió un problema al intentar identificar el rostro",
      });
    }
  };

  return (
    <div className="login-background">
      <div className="login-container">
        <div className="login-box">
          <img src="/logo_ucsg.png" alt="Logo CAD" className="logo" />
          {!faceMode ? (
            <>
              <form onSubmit={handleLogin}>
                <input
                  type="text"
                  placeholder="Usuario"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                />
                <button type="submit" className="btn-login">
                  Ingresar
                </button>
              </form>
              <button className="btn-facial" onClick={iniciarReconocimiento}>
                Ingresar con Reconocimiento Facial
              </button>
            </>
          ) : (
            <div className="facial-box">
              <Webcam ref={webcamRef} className="webcam" />
              <p>Escaneando rostro...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
