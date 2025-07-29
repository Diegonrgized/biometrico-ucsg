import React, { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import axios from "axios";
import "./Login.css";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://127.0.0.1:8000/api";

export default function Login({ onLoginSuccess }) {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [faceMode, setFaceMode] = useState(false);
  const [mensaje, setMensaje] = useState("");
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
      }
    };
    cargarModelos();
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (usuario === "admin" && contrasena === "1234") {
      const profesorId = 123456;
      localStorage.setItem("profesorId", profesorId);
      setMensaje("✅ Login tradicional exitoso");
      onLoginSuccess();
      navigate("/dashboard");
    } else {
      setMensaje("❌ Credenciales incorrectas");
    }
  };

  const actualizarClaseEnCurso = async (profesorId, nombreProfesor) => {
    try {
      const resp = await axios.get(`${API_BASE_URL}/clases`);
      const clases = resp.data;

      const claseVigente = clases.find(
        (c) => c.profesor_id === profesorId && ["PENDIENTE", "EN_CLASE"].includes(c.estado)
      );

      if (claseVigente) {
        await axios.put(`${API_BASE_URL}/clases/${claseVigente.id}/estado`, {
          estado: "EN_CLASE",
        });
        console.log(`✅ Clase ${claseVigente.id} actualizada a EN_CLASE`);
        setMensaje(`✅ Rostro autentificado con éxito: ${nombreProfesor} (Clase actualizada)`);
      } else {
        setMensaje(`✅ Rostro autentificado con éxito: ${nombreProfesor} (Sin clase vigente)`);
      }

      localStorage.setItem("profesorId", profesorId);
      onLoginSuccess();
      navigate("/dashboard");
    } catch (error) {
      console.error("❌ Error al actualizar clase:", error);
      setMensaje("⚠️ Rostro reconocido, pero no se pudo actualizar la clase.");
      localStorage.setItem("profesorId", profesorId);
      onLoginSuccess();
      navigate("/dashboard");
    }
  };

  const iniciarReconocimiento = async () => {
    setFaceMode(true);
    setMensaje("Iniciando reconocimiento facial...");

    try {
      const profesores = await axios.get(`${API_BASE_URL}/profesores`);
      const labeledDescriptors = await Promise.all(
        profesores.data.map(async (prof) => {
          const encoding = JSON.parse(prof.face_encoding);
          return new faceapi.LabeledFaceDescriptors(
            prof.nombre,
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
            console.log(`✅ Profesor reconocido: ${bestMatch.label}`);

            const profesor = profesores.data.find((p) => p.nombre === bestMatch.label);
            if (profesor) {
              await actualizarClaseEnCurso(profesor.id, profesor.nombre);
            } else {
              setMensaje(`✅ Rostro autentificado con éxito: ${bestMatch.label}`);
              onLoginSuccess();
              navigate("/dashboard");
            }
          }
        }
      }, 3000);
    } catch (error) {
      console.error("❌ Error en reconocimiento facial:", error);
      setMensaje("Error en reconocimiento facial");
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
              <p>{mensaje}</p>
            </>
          ) : (
            <div className="facial-box">
              <Webcam ref={webcamRef} className="webcam" />
              <p>{mensaje}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
