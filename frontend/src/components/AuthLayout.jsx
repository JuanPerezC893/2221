import React, { useState, useEffect } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css'; // Import Bootstrap Icons
import '../assets/Auth.css';

import image1 from '../assets/background/Antofa.png';
import image2 from '../assets/background/Araucania.png';
import image3 from '../assets/background/Chiloe.png';
import image4 from '../assets/background/PascuaRanol.png';
import image5 from '../assets/background/Tarapaca.png';
import image6 from '../assets/background/Tranquilo.png';
import image7 from '../assets/background/Valdivia.png';
import image8 from '../assets/background/Valdiviap.png';

const images = [image1, image2, image3, image4, image5, image6, image7, image8];

const AuthLayout = ({ children }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000); // Cambia la imagen cada 5 segundos

    return () => clearInterval(timer); // Limpia el intervalo al desmontar
  }, []);

  return (
    <div className="auth-layout">
      <div className="background-slideshow">
        {images.map((image, index) => (
          <div
            key={index}
            className={`background-image ${index === currentImageIndex ? 'active' : ''}`}
            style={{ backgroundImage: `url(${image})` }}
          />
        ))}
      </div>
      <main className="auth-main">
        {children}
      </main>
      <footer className="auth-footer">
        <div className="auth-footer-content">
          <a href="#" className="auth-footer-link">
            <i className="bi bi-file-text"></i> Términos y condiciones
          </a>
          <p className="auth-footer-copyright">© 2025 EcoObra. Todos los derechos reservados.</p>
          <a href="#" className="auth-footer-link">
            <i className="bi bi-headset"></i> Contacto
          </a>
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout;
