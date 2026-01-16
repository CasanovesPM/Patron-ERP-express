import React, { useEffect, useRef, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginContext } from '../LoginContext';
import logo from './path/to/logo-color.png'; // Reemplaza con la ruta correcta de tu logo

const Sidebar = ({ selectedOption, setSelectedOption, setShowHeader, nivel}) => {
    const [lvl, setLvl] = useState(nivel)
    const { logout } = useContext(LoginContext);
    const navigate = useNavigate();
    
    const handleLogout = async () => {
      try {
        await logout();
        setShowHeader(true);
        navigate('/');

      } catch (error) {
        console.error("Error al cerrar sesión:", error);
      }
    };

    const handleHome = () => {
      setShowHeader(true);
      navigate('/');

    };


    const handleOptionClick = (option) => {
      console.log('Opción seleccionada:', option);
      setSelectedOption(option);
    };


    const sidebarRef = useRef(null);
    const toggleButtonRef = useRef(null);
  
    useEffect(() => {
      const sidebar = sidebarRef.current;
      const toggleButton = toggleButtonRef.current;
  
      if (sidebar && toggleButton) {
        toggleButton.addEventListener('click', () => {
          sidebar.classList.toggle('.active');
        });
      }
  
      return () => {
        if (sidebar && toggleButton) {
          toggleButton.removeEventListener('click', () => {
            sidebar.classList.toggle('.active');
          });
        }
      };
    }, []);


  return (
    <div className="sidebar" ref={sidebarRef}>
      <div  onClick={handleHome} className='sidebarHeader'>
            <img  src={logo} alt="Logo"  className="d-inline-block align-top" />
      </div>
      <ul>
        {(lvl === 0 || lvl === 1 || lvl === 2) &&  (<li className={`sidebar-link sidebar-item ${selectedOption === 'Movimientos' ? 'active' : ''}`} ref={toggleButtonRef} onClick={() => handleOptionClick('Movimientos')}>HOY</li>)}
        {/* {(lvl === 0 || lvl === 1) && (
          <li
            className={`sidebar-link sidebar-item ${selectedOption === 'Ingresos' ? 'active' : ''}`}
            ref={toggleButtonRef}
            onClick={() => handleOptionClick('Ingresos')}
          >
            Ingresos
          </li>
        )}        
        {(lvl === 0 || lvl === 1) && (
          <li
            className={`sidebar-link sidebar-item ${selectedOption === 'Egresos' ? 'active' : ''}`}
            ref={toggleButtonRef}
            onClick={() => handleOptionClick('Egresos')}
          >
            Egresos
          </li>
        )}  */}


      {(lvl === 0 || lvl === 1 || lvl === 2) && (
          <li 
            className={`sidebar-link sidebar-item ${selectedOption === 'Faltantes' ? 'active' : ''}`} 
            ref={toggleButtonRef} 
            onClick={() => handleOptionClick('Faltantes')}
          >
            Faltantes de Stock
          </li>
        )}
         {(lvl === 0 || lvl === 1 || lvl === 2) && (
          <li 
            className={`sidebar-link sidebar-item ${selectedOption === 'ListaProvs' ? 'active' : ''}`} 
            ref={toggleButtonRef} 
            onClick={() => handleOptionClick('ListaProvs')}
          >
            Lista Provs
          </li>
        )}



        {(lvl === 0 || lvl === 1 || lvl === 2) && (
          <li 
            className={`sidebar-link sidebar-item ${selectedOption === 'Presupuestos' ? 'active' : ''}`} 
            ref={toggleButtonRef} 
            onClick={() => handleOptionClick('Presupuestos')}
          >
            Presupuestos
          </li>
        )}

                {(lvl === 0 || lvl === 1 || lvl === 2) && (
          <li 
            className={`sidebar-link sidebar-item ${selectedOption === 'PagosPendientes' ? 'active' : ''}`} 
            ref={toggleButtonRef} 
            onClick={() => handleOptionClick('PagosPendientes')}
          >
            Pagos Pendientes
          </li>
        )}
    
        {lvl === 0 &&  <li className={`sidebar-link sidebar-item ${selectedOption === 'Banco' ? 'active' : ''}`} ref={toggleButtonRef} onClick={() => handleOptionClick('Banco')}>Banco</li> }
         {lvl === 0 &&  <li className={`sidebar-link sidebar-item ${selectedOption === 'Informes' ? 'active' : ''}`} ref={toggleButtonRef} onClick={() => handleOptionClick('Informes')}>Informes</li>}
     
        {lvl === 0 &&  <li className={`sidebar-link sidebar-item ${selectedOption === 'Creditos' ? 'active' : ''}`} ref={toggleButtonRef} onClick={() => handleOptionClick('Creditos')}>Creditos</li> }
        
        {(lvl === 0 || lvl === 1 || lvl === 2) && (
          <li
            className={`sidebar-link sidebar-item ${selectedOption === 'Empleados' ? 'active' : ''}`}
            ref={toggleButtonRef}
            onClick={() => handleOptionClick('Empleados')}
          >
            Empleados
          </li>
        )}        
        {lvl === 0 &&  <li className={`sidebar-link sidebar-item ${selectedOption === 'Proveedores' ? 'active' : ''}`} ref={toggleButtonRef} onClick={() => handleOptionClick('Proveedores')}>Proveedores</li>}
        {lvl === 0 &&  <li className={`sidebar-link sidebar-item ${selectedOption === 'Costos Fijos' ? 'active' : ''}`} ref={toggleButtonRef} onClick={() => handleOptionClick('CostosFijos')}>Costos Fijos</li>}
        {lvl === 0 &&  <li className={`sidebar-link sidebar-item ${selectedOption === 'Ventas' ? 'active' : ''}`} ref={toggleButtonRef} onClick={() => handleOptionClick('Ventas')}>Ventas</li>}

      </ul>
      <button className="btn btn-danger me-2" onClick={handleLogout} >
                  Cerrar Sesión
      </button>
    </div>
  );
};

export default Sidebar;