import React, { useEffect, useState } from 'react';
import './Toast.css';

const Toast = ({ message, type, onClose }) => {
  const [show, setShow] = useState(false);

  // Effect for fade-in animation
  useEffect(() => {
    // This timeout ensures the transition is applied after the component mounts
    const fadeInTimer = setTimeout(() => {
      setShow(true);
    }, 100);

    return () => clearTimeout(fadeInTimer);
  }, []);

  // Effect for auto-closing the toast
  useEffect(() => {
    const closeTimer = setTimeout(() => {
      setShow(false);
      // Allow time for fade-out animation before calling onClose
      setTimeout(onClose, 400);
    }, 8000); // Toast visible for 8 seconds

    return () => {
      clearTimeout(closeTimer);
    };
  }, [onClose]);

  if (!message) {
    return null;
  }

  return (
    <div className={`toast ${type} ${show ? 'show' : ''}`}>
      {message}
    </div>
  );
};

export default Toast;
