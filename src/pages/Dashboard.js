import React, {  useState, useContext, useEffect } from 'react';
import {  LoginContext } from '../LoginContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import MainContent from '../components/MainContent';


function Dashboard({setShowHeader}) {
  
  const location = useLocation();
  const navigate = useNavigate();

  const nivel = location.state?.nivel;
  const empleado = location.state?.empleado;

  console.log(nivel, empleado);

  const getInitialOption = (nivel) => {
    switch (nivel) {
      case 1:
        return 'Movimientos';
      case 0:
        return 'Movimientos';
      case 2:
        return 'Movimientos';
      default:
        return ''; // Valor por defecto si nivel no coincide con 0, 1 o 2
    }
  };

  const [selectedOption, setSelectedOption] = useState(() => getInitialOption(nivel));

  const { isLoggedIn } = useContext(LoginContext);

      // Ocultar el header si el usuario ya ha iniciado sesión
      useEffect(() => {
        if (isLoggedIn) {
          setShowHeader(false);
        }
      }, [isLoggedIn, setShowHeader]);
  
  // Redirigir si el usuario no está autenticado
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/');
    }
  }, [isLoggedIn, navigate]);




  // No renderizar nada si el usuario no está autenticado (la redirección se maneja en useEffect)
  if (!isLoggedIn) {
    return null;
  }

  return (
    <>
      <div className="dashboard-container">
        <Sidebar
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
          setShowHeader={setShowHeader} 
          nivel = {nivel}
        />
        <MainContent nivel = {nivel} empleado = {empleado} selectedOption={selectedOption}
          />
      </div>
    </>
  );

}

export default Dashboard;
