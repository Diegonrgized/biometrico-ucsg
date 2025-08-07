import React, { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2"; // <-- Importación de SweetAlert2
import "../styles/RegistroFacial.css";

const API_BASE_URL = "http://127.0.0.1:8000/api";

export default function RegistroFacial() {
  const [camaraActiva, setCamaraActiva] = useState(false);
  const webcamRef = useRef(null);
  const navigate = useNavigate();

  const userId = localStorage.getItem("usuarioId");

  useEffect(() => {
    const cargarModelos = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models/tiny_face_detector");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models/face_landmark_68");
        await faceapi.nets.faceRecognitionNet.loadFromUri("/models/face_recognition");
        console.log("✅ Modelos cargados para registro facial");
      } catch (error) {
        console.error("❌ Error cargando modelos:", error);
        Swal.fire({
          icon: "error",
          title: "Error al cargar modelos",
          text: "No se pudieron cargar los modelos de reconocimiento.",
        });
      }
    };
    cargarModelos();
  }, []);

  const registrarRostro = async () => {
    if (!userId) {
      Swal.fire({
        icon: "warning",
        title: "Usuario no identificado",
        text: "Inicia sesión antes de registrar el rostro.",
      });
      return;
    }

    if (!webcamRef.current || !camaraActiva) {
      Swal.fire({
        icon: "warning",
        title: "Cámara inactiva",
        text: "Activa la cámara antes de registrar.",
      });
      return;
    }

    try {
      const video = webcamRef.current.video;
      if (!video || video.readyState !== 4) {
        Swal.fire({
          icon: "info",
          title: "Cámara no lista",
          text: "Espera a que se inicialice completamente.",
        });
        return;
      }

      const detections = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detections) {
        Swal.fire({
          icon: "error",
          title: "Sin rostro detectado",
          text: "Asegúrate de estar visible en la cámara.",
        });
        return;
      }

      const encodingArray = Array.from(detections.descriptor);

      const response = await axios.post(`${API_BASE_URL}/usuarios/${userId}/guardar-rostro`, {
        face_encoding: JSON.stringify(encodingArray),
      });

      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "¡Rostro registrado!",
          text: "Tu rostro ha sido guardado exitosamente.",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("❌ Error al registrar el rostro:", error);
      Swal.fire({
        icon: "error",
        title: "Error en el registro",
        text: "No se pudo guardar el rostro. Intenta nuevamente.",
      });
    }
  };

  const alternarCamara = () => {
    setCamaraActiva((prev) => !prev);
  };

  return (
    <div className="registro-background">
      <div className="registro-facial-wrapper">
        <div className="registro-facial-box">
          <h2>Registro Facial</h2>

          <div className="recomendaciones">
            <p><strong>🛈 Recomendaciones:</strong> Ubíquese de frente, con buena luz, sin accesorios y con expresión neutral.</p>
          </div>

          <button className="btn-camara" onClick={alternarCamara}>
            {camaraActiva ? "Desactivar Cámara" : "Activar Cámara"}
          </button>

          {camaraActiva && <Webcam ref={webcamRef} className="webcam" />}

          <button className="btn-registrar" onClick={registrarRostro}>
            Registrar Rostro
          </button>
          <button className="btn-regresar" onClick={() => navigate("/")}>
            🔙 Regresar al Login
          </button>
        </div>
      </div>
    </div>
  );
}
