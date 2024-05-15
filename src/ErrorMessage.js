import React, { useState, useEffect } from 'react';

const ErrorMessage = ({ message }) => {
    const [showError, setShowError] = useState(true);
  
    useEffect(() => {
      const timer = setTimeout(() => {
        setShowError(false);
      }, 5000); // Hide the error message after 3 seconds
  
      return () => clearTimeout(timer); // Clean up the timer on component unmount
    }, []);
  
    const handleCloseError = () => {
      setShowError(false);
    };
  
    return showError ? (
      <div
        style={{
          position: 'fixed',
          top: '10px', // Adjust the top position
          right: '10px', // Position at the top right corner
          backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent black background
          padding: '10px',
          borderRadius: '5px',
          display: 'flex',
          alignItems: 'center',
          zIndex: 9999,
        }}
      >
        <span style={{ marginRight: '10px', color: 'white' }}>{message}</span>
        <button
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '16px',
            color: 'white', // Change the close button color to white
          }}
          onClick={handleCloseError}
        >
          &times;
        </button>
      </div>
    ) : null;
  };
  

export default ErrorMessage;