import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { LoginContext } from '../LoginContext';
import logo from '../components/path/to/logo-color.png'; // ⚠️ Asegurate de usar la ruta correcta

function LoginPage({ setShowHeader }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(LoginContext);

  useEffect(() => {
    const savedEmail = localStorage.getItem('email');
    const savedPassword = localStorage.getItem('password');
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const isLoginSuccessful = await login(email, password);
      if (isLoginSuccessful) {
        Swal.fire({
          title: 'Éxito!',
          text: 'Inicio de sesión exitoso.',
          icon: 'success',
          confirmButtonText: 'Continuar',
        }).then((result) => {
          if (result.isConfirmed) {
            navigate('/userLogin');
          }
        });
      } else {
        Swal.fire({
          title: 'Error!',
          text: 'Hubo un problema al iniciar sesión.',
          icon: 'error',
          confirmButtonText: 'Cerrar',
        });
      }
    } catch (error) {
      Swal.fire({
        title: 'Error!',
        text: 'Ocurrió un problema inesperado.',
        icon: 'error',
        confirmButtonText: 'Cerrar',
      });
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{
        backgroundColor: '#f5f5f5',
        width: 'auto',
        height: '100vh',
        margin: 0,
        padding: 0,
      }}
    >
      <div
        className="bg-white p-5 rounded shadow"
        style={{ width: '100%', maxWidth: '420px' }}
      >
        <div className="text-center mb-4">
          <img src={logo} alt="Logo" style={{ width: '100%' }} /> {/* 4x más grande que 120px */}
        </div>
        <h2 className="text-center mb-4 text-orange">Empresa</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Correo electrónico"
              className="form-control"
              required
            />
          </div>
          <div className="mb-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="form-control"
              required
            />
          </div>
          <div className="form-check mb-3">
            <input
              type="checkbox"
              className="form-check-input"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="rememberMe">
              Guardar datos
            </label>
          </div>
          <button
            type="submit"
            className="btn w-100 mb-2"
            style={{ backgroundColor: '#ff9802', color: '#fff' }}
          >
            Iniciar Sesión
          </button>
          <Link to="/register" className="btn btn-primary w-100">
            Registrarse
          </Link>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;


