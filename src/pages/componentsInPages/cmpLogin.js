import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../LoginContext';
import { db, collection, query, where, getDocs } from '../../firebaseConfig'; // Importamos las funciones necesarias de Firebase

const CmpLogin = ({ setShowHeader }) => {
  const { user } = useAuth();  // Obtenemos el usuario autenticado con Firebase Authentication
  const userId = user.uid;  // UID del usuario autenticado
  setShowHeader(false);  // Ocultamos el header (seguramente lo haces para no mostrarlo en el login)
  
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

    try {
      // Conexión directa con Firestore para obtener los datos del usuario
      const usuariosRef = collection(db, `users/${userId}/Usuarios`);  // Accedemos a la colección de usuarios
      const q = query(usuariosRef, where('email', '==', email), where('password', '==', password)); // Creamos la consulta
      const snapshot = await getDocs(q);  // Ejecutamos la consulta

      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();  // Obtenemos los datos del primer documento que coincida

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
          setErrorMessage('You do not have the correct permissions.');
        }
      } else {
        setErrorMessage('Invalid email or password');
      }
    } catch (error) {
      console.error('Error occurred during login:', error);
      setErrorMessage('Error occurred during login. Please try again.');
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
