import React from 'react';
import Inicio from './componentsMC/Inicio'
import Movimientos from './componentsMC/Movimientos'
import Banco from './componentsMC/Banco'
import Creditos from './componentsMC/Creditos'
import Presupuestos from './componentsMC/Presupuestos'
import PagosPendientes from './componentsMC/PagosPendientes'
import Informacion from './componentsMC/Informacion'
import Empleados from './componentsMC/Empleados'
import { useAuth } from '../LoginContext';
import Proveedores from './componentsMC/Proveedores';
import CostosFijos from './componentsMC/CostosFijos';
import TablaMovimientos from './componentsMC/compsIngresos/TablaMovimientos';
import Faltantes from './componentsMC/compsIngresos/Faltantes';
import Informes from './componentsMC/informes';
import ListasProvs from './componentsMC/compsIngresos/ListasProvs';
import Ventas from './componentsMC/Ventas';

const MainContent = ({ selectedOption ,empleado, nivel }) => {

  const { user } = useAuth();
  const userId = user.uid;

  return (
    <div className="main-content">
      {selectedOption  === 'Inicio' && (
        <Inicio userId={userId}/>
      )}
       {/* {selectedOption  === 'Ingresos' && (
        <Movimientos userId={userId} tipo="Ingresos" nivel={nivel} />
      )}
      {selectedOption  === 'Egresos' && (
        <Movimientos userId={userId} tipo="Egresos" nivel={nivel}/>
      )} */}
      {selectedOption  === 'Movimientos' && (
        <TablaMovimientos userId={userId} />
      )}
            {selectedOption  === 'Ventas' && (
        <Ventas userId={userId} />
      )}

      {selectedOption  === 'Faltantes' && (
        <Faltantes userId={userId} />
      )}

      {selectedOption  === 'ListaProvs' && (
        <ListasProvs userId={userId} />
      )}


      
      {selectedOption  === 'Banco' && (
        <Banco userId={userId} />
      )}

      {selectedOption  === 'Creditos' && (
        <Creditos userId={userId} />
      )}

      {selectedOption  === 'Presupuestos' && (
        <Presupuestos userId={userId} />
      )}

      {selectedOption  === 'PagosPendientes' && (
        <PagosPendientes userId={userId} />
      )}

      {selectedOption  === 'Empleados' && (
        <Empleados nivel={nivel} empleado={empleado} userId={userId}/>
      )}
      {selectedOption  === 'Proveedores' && (
        <Proveedores nivel={nivel}  userId={userId}/>
      )}
      {selectedOption  === 'CostosFijos' && (
        <CostosFijos nivel={nivel}  userId={userId}/>
      )}
      {selectedOption  === 'Informes' && (
        <Informes userId={userId}/>
      )}

      
    </div>
  );
};

export default MainContent;