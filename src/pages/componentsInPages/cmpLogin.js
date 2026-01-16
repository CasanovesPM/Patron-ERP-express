import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../LoginContext';
import { db, collection, query, where, getDocs } from '../../firebaseConfig';

const CmpLogin = ({ setShowHeader }) => {
  const { user } = useAuth();
  const userId = user?.uid;
  setShowHeader(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem('cmpLoginEmail');
    const savedPassword = localStorage.getItem('cmpLoginPassword');

    if (savedEmail) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!userId) {
      setErrorMessage('Usuario no autenticado. Por favor inicia sesión primero.');
      return;
    }

    try {
      // Buscar usuario en localStorage usando la estructura simulada de Firestore
      const usuariosRef = collection(db, `users/${userId}/Usuarios`);
      const q = query(usuariosRef, where('email', '==', email), where('password', '==', password));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();

        // Verificamos el nivel del usuario
        if (userData.nivel === 0 || userData.nivel === 1 || userData.nivel === 2) {
          if (rememberMe) {
            localStorage.setItem('cmpLoginEmail', email);
            localStorage.setItem('cmpLoginPassword', password);
          } else {
            localStorage.removeItem('cmpLoginEmail');
            localStorage.removeItem('cmpLoginPassword');
          }

          navigate('/dashboard', { state: { nivel: userData.nivel, empleado: userData.nombre } });
        } else {
          setErrorMessage('No tienes los permisos correctos.');
        }
      } else {
        setErrorMessage('Email o contraseña inválidos');
      }
    } catch (error) {
      console.error('Error occurred during login:', error);
      setErrorMessage('Ocurrió un error durante el inicio de sesión. Por favor intenta de nuevo.');
    }
  };

  return (
    <div className="login-container">
      <div className="card login-card shadow-lg p-4">
        <h2 className="text-center mb-4">Ingresar Usuario</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group mb-3" style={{ textAlign: 'center' }}>
            <input
              type="email"
              className="form-control"
              id="email"
              placeholder="Ingresa tu Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group mb-3" style={{ textAlign: 'center' }}>
            <input
              type="password"
              className="form-control"
              id="password"
              placeholder="Ingresa tu Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group form-check mb-3 d-flex justify-content-center" style={{ textAlign: 'center' }}>
            <input
              type="checkbox"
              className="form-check-input m-1"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="rememberMe">Guardar datos</label>
          </div>
          {errorMessage && (
            <div className="alert alert-danger" role="alert">
              {errorMessage}
            </div>
          )}
          <button type="submit" className="btn btn-primary w-100">
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}

export default CmpLogin;
