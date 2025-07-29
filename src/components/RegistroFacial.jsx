import React, { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/RegistroFacial.css";

const API_BASE_URL = "http://127.0.0.1:8000/api";

export default function RegistroFacial() {
  const [nombre, setNombre] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [camaraActiva, setCamaraActiva] = useState(false); // ✅ NUEVO estado
  const webcamRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarModelos = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models/tiny_face_detector");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models/face_landmark_68");
        await faceapi.nets.faceRecognitionNet.loadFromUri("/models/face_recognition");
        console.log("✅ Modelos cargados para registro facial");
      } catch (error) {
        console.error("❌ Error cargando modelos:", error);
      }
    };
    cargarModelos();
  }, []);

  const generarIdAleatorio = () => {
    return Math.floor(100000 + Math.random() * 900000);
  };

  const registrarProfesor = async () => {
    if (!nombre.trim()) {
      setMensaje("⚠️ Por favor ingresa un nombre antes de registrar.");
      return;
    }

    if (!webcamRef.current || !camaraActiva) {
      setMensaje("⚠️ Cámara no disponible o apagada.");
      return;
    }

    try {
      const video = webcamRef.current.video;
      if (!video || video.readyState !== 4) {
        setMensaje("⚠️ La cámara aún no está lista.");
        return;
      }

      const detections = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detections) {
        setMensaje("❌ No se detectó ningún rostro, intenta nuevamente.");
        return;
      }

      const encodingArray = Array.from(detections.descriptor);
      const profesorId = generarIdAleatorio();

      const response = await axios.post(`${API_BASE_URL}/profesores`, {
        id: profesorId,
        nombre: nombre,
        face_encoding: JSON.stringify(encodingArray),
      });

      if (response.status === 201) {
        setMensaje(`✅ Profesor registrado con éxito: ${nombre} (ID: ${profesorId})`);
        setNombre("");
      }
    } catch (error) {
      console.error("❌ Error al registrar el profesor:", error);
      setMensaje("❌ No se pudo registrar el profesor. Revisa la consola.");
    }
  };

  const alternarCamara = () => {
    setCamaraActiva((prev) => !prev);
    setMensaje("");
  };

  return (
    <div className="registro-background">
      <div className="registro-facial-wrapper">
        <div className="registro-facial-box">
          <h2>Registro Facial de Profesores</h2>

          {/* ✅ Botón para encender/apagar cámara */}
          <button className="btn-camara" onClick={alternarCamara}>
            {camaraActiva ? "Desactivar Cámara" : "Activar Cámara"}
          </button>

          {/* ✅ Webcam solo si está activa */}
          {camaraActiva && <Webcam ref={webcamRef} className="webcam" />}

          <input
            type="text"
            placeholder="Nombre del profesor"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <button className="btn-registrar" onClick={registrarProfesor}>
            Registrar Rostro
          </button>
          <button className="btn-regresar" onClick={() => navigate("/dashboard")}>
            🔙 Regresar al Dashboard
          </button>
          <p className="mensaje">{mensaje}</p>
        </div>
      </div>
    </div>
  );
}
