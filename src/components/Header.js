import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { BarChartFill } from 'react-bootstrap-icons';
import logo from './path/to/logo.png'; // Reemplaza con la ruta correcta de tu logo
import './components.css'; // Archivo CSS personalizado
import { LoginContext } from '../LoginContext';
import { useNavigate } from 'react-router-dom';


function Header() {
  const { isLoggedIn, logout } = useContext(LoginContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDashboard = () => {
    navigate('/userLogin');
  };
  return (
<header>
  <div className="container-fluid">
    <Link to="/" className="navbar-brand">
      <img src={logo} alt="Logo" width="300" height="auto" className="d-inline-block align-top" />
    </Link>
    <button
      className="navbar-toggler"
      type="button"
      data-bs-toggle="collapse"
      data-bs-target="#navbarNav"
      aria-controls="navbarNav"
      aria-expanded="false"
      aria-label="Toggle navigation"
    >
      <BarChartFill color='white' size={50} />
    </button>
  </div>

  <nav className="navbar navbar-expand-lg navbar-light">
    <div className="container-fluid">
      <div className="collapse navbar-collapse" id="navbarNav">
        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
          <li className="nav-item">
            <Link to="/" className="nav-link custom-link">Inicio</Link>
          </li>
          <li className="nav-item">
            <Link to="/features" className="nav-link custom-link">Características</Link>
          </li>
          <li className="nav-item">
            <Link to="/pricing" className="nav-link custom-link">Precios</Link>
          </li>
          <li className="nav-item">
            <Link to="/contact" className="nav-link custom-link">Contacto</Link>
          </li>
          <li className="nav-item">
            <Link to="/help" className="nav-link custom-link">Ayuda</Link>
          </li>
        </ul>
        <div className="d-flex justify-content-center align-items-center">
          {isLoggedIn ? (
            <>
              <button className="btn btn-success me-2" onClick={handleDashboard}>
                Panel de Usuario
              </button>
              <button className="btn btn-danger me-2" onClick={handleLogout}>
                Cerrar Sesión
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-primary me-2 btnWFondo">Iniciar Sesión</Link>
              <Link to="/register" className="btn btn-outline-primary btnSFondo">Registrarse</Link>
            </>
          )}
        </div>
      </div>
    </div>
  </nav>
</header>
  );
}

export default Header;

