
// Inicio.js
import React, { useEffect, useState } from 'react';
import { auth, db, doc, getDoc, collection, getDocs } from '../../firebaseConfig';
import Swal from 'sweetalert2';
import { CurrencyDollar, Cash, Bank, CashStack, CreditCard  } from 'react-bootstrap-icons';
import InfoNube from './compsIngresos/infoNubes';

const Inicio = ({ userId }) => {

  const [bancoActual, setBancoActual] = useState('');
  const [bancoPresente, setBancoPresente] = useState('');

  const fetchBancoPresente = async () => {
    try {
      if (!userId) throw new Error('userId no está definido');
  
      Swal.fire({
        title: 'Cargando datos...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
  
      // Ahora accedemos al documento específico de bancoPresente
      const bancoRef = doc(db, 'users', userId, 'Banco', 'bancoInfo');  // Accediendo correctamente a la ruta
      const bancoDoc = await getDoc(bancoRef);
  
      if (bancoDoc.exists()) {
        setBancoActual(Number(bancoDoc.data().bancoPresente));
      } else {
        console.log('No se encontró el documento de banco.');
      }
  
      Swal.close();
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'Hubo un problema al obtener los datos.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      console.error("Error al obtener los datos:", error);
    }
  };

  useEffect(() => {
    fetchBancoPresente();

  }, [userId]);

  const [data, setData] = useState({
    totalCajaIngresos: 0,
    totalBancosIngresos: 0,
    totalChequesIngresos: 0,
    totalTarjetasIngresos: 0,
    totalCajaEgresos: 0,
    totalBancosEgresos: 0,
    totalChequesEgresos: 0,
    totalTarjetasEgresos: 0,

  });

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const totalesIngresos = data.totalBancosIngresos + data.totalCajaIngresos + data.totalTarjetasIngresos + data.totalChequesIngresos;
  const totalesEgresos = data.totalBancosEgresos + data.totalCajaEgresos + data.totalTarjetasEgresos + data.totalChequesEgresos;
  
  //BALANCES 
  const totalesBalance = (totalesIngresos - totalesEgresos).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
  const cajaBalance = (data.totalCajaIngresos - data.totalCajaEgresos).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
  const bancosBalance = (data.totalBancosIngresos - data.totalBancosEgresos).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
  const chequesBalance = (data.totalChequesIngresos - data.totalChequesEgresos).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  // Función para determinar el color en base al valor
  const determinarColor = (valor) => {
    return valor.startsWith('-') ? '#B71C1C' : '#80d683'; // Bordó para valores negativos, verde para positivos
  };

  // Aplicar la función para obtener el color adecuado
  const colorTotalBalance = determinarColor(totalesBalance);
  const colorCajaBalance = determinarColor(cajaBalance);
  const colorChequeBalance = determinarColor(chequesBalance);
  const colorBancosBalance = determinarColor(bancosBalance);
  
   const obtenerTotalesDesdeMovimientos = async (userId) => {
    let totalEfectivo = 0;
    let totalTransferencias = 0;
    let totalTarjetas = 0;
    let totalCheques = 0;
    let totalRetiros = 0;
    let totalRetirosTransfer = 0;

  
    try {
      const movimientosRef = collection(db, `users/${userId}/Movimientos`);
      const fechasSnapshot = await getDocs(movimientosRef);
  
      for (const fechaDoc of fechasSnapshot.docs) {
        const fechaId = fechaDoc.id;
        const ingresoDocRef = doc(db, `users/${userId}/Movimientos/${fechaId}`);
        const ingresoSnap = await getDoc(ingresoDocRef);
  
        if (ingresoSnap.exists()) {
          const datos = ingresoSnap.data();
          totalEfectivo += datos.efectivo || 0;
          totalTransferencias += datos.transferencias || 0;
          totalTarjetas += datos.tarjetas || 0;
          totalCheques += datos.cheques || 0;
          totalRetiros += datos.retiros || 0;
          totalRetirosTransfer += datos.retirosTransfer || 0;
        }
      }
  
      return {
        efectivo: totalEfectivo,
        transferencias: totalTransferencias,
        tarjetas: totalTarjetas,
        cheques: totalCheques,
        retiros: totalRetiros,
        retirosTransfer : totalRetirosTransfer
      };
    } catch (error) {
      console.error("Error obteniendo datos desde Firebase:", error);
      return null;
    }
  };

  useEffect(() => {
    const cargarTotales = async () => {
      const totales = await obtenerTotalesDesdeMovimientos(userId);
      console.log(totales);
      if (totales) {
        setData({
          totalCajaIngresos: totales.efectivo,
          totalBancosIngresos: totales.transferencias,
          totalTarjetasIngresos: totales.tarjetas,
          totalChequesIngresos: totales.cheques,
          totalCajaEgresos: totales.retiros,
          totalBancosEgresos: totales.retirosTransfer,
          totalChequesEgresos: 0,
          totalTarjetasEgresos: 0
        });
      }  
    };
  
    if (userId) cargarTotales();
  }, [userId]);

  return (
    <div className="container p-3 panelInfo">
      <div className='infoNubes'>
        <div className='infoNube'>
          <div className='d-flex justify-content-between align-items-center'>
            <h4>Efectivo</h4>
            <div className='iconNube'>
              <Cash />
            </div>
          </div>
          <div className='mt-1'>
            <p className='infoIngreso'><strong>{data.totalCajaIngresos.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</strong></p>
            <p>Ingreso Caja</p>
          </div>
        </div>
        <div className='infoNube'>
          <div className='d-flex justify-content-between align-items-center'>
            <h4>Transferencias</h4>
            <div className='iconNube'>
              <Bank />
            </div>
          </div>
          <div className='mt-1'>
            <p className='infoIngreso'><strong>{data.totalBancosIngresos.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</strong></p>
            <p>Ingresos Transferencia</p>
          </div>
        </div>
        <div className='infoNube'>
          <div className='d-flex justify-content-between align-items-center'>
            <h4>Tarjetas</h4>
            <div className='iconNube'>
              <CreditCard  />
            </div>
          </div>
          <div className='mt-1'>
            <p className='infoIngreso'><strong>{data.totalTarjetasIngresos.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</strong></p>
            <p>Ingresos Tarjeta</p>
          </div>
        </div>
        <div className='infoNube'>
          <div className='d-flex justify-content-between align-items-center'>
            <h4>Cheques</h4>
            <div className='iconNube'>
              <CashStack />
            </div>
          </div>
          <div className='mt-1'>
            <p className='infoIngreso'><strong>{(data.totalChequesIngresos).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</strong></p>
            <p>Ingresos Cheques</p>
          </div>
        </div>
      </div>
      <div className='infoNubes'>
        <div className='infoNube'>
          <div className='d-flex justify-content-between align-items-center'>
            <h4>Efectivo</h4>
            <div className='iconNube' style={{ backgroundColor: '#961717' }}>
              <Cash />
            </div>
          </div>
          <div className='mt-1'>
            <p className='infoEngreso' style={{ color: '#962e2e' }}><strong>{data.totalCajaEgresos.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</strong></p>
            <p>Egreso Caja</p>
          </div>
        </div>
        <div className='infoNube'>
          <div className='d-flex justify-content-between align-items-center'>
            <h4>Transferencias</h4>
            <div className='iconNube' style={{ backgroundColor: '#961717' }}>
              <Bank />
            </div>
          </div>
          <div className='mt-1'>
            <p className='infoEngreso' style={{ color: '#962e2e' }}><strong>{data.totalBancosEgresos.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</strong></p>
            <p>Egresos Transferencias</p>
          </div>
        </div>
        <div className='infoNube'>
          <div className='d-flex justify-content-between align-items-center'>
            <h4>E - Totales</h4>
            <div className='iconNube' style={{ backgroundColor: '#961717' }}>
              <CurrencyDollar />
            </div>
          </div>
          <div className='mt-1'>
            <p className='infoEngreso' style={{ color: '#962e2e' }}><strong>{totalesEgresos.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</strong></p>
            <p>Egresos Totales</p>
          </div>
        </div> 
        <InfoNube
          titulo="Banco"
          icono={<Bank />}
          contenido={bancoActual.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) || "Cargando..."}
          subtitulo="Dinero Disponible"
          colorIcono={"#4CAF50"}
          colorContenido={"#80d683"}
        />
      </div>
      <div className='infoNubes'>
        <div className='infoNube'>
          <div className='d-flex justify-content-between align-items-center'>
            <h4>Balance Efectivo</h4>
            <div className='iconNube'>
              <Cash />
            </div>
          </div>
          <div className='mt-1'>
            <p className='infoIngreso' style={{ color: colorCajaBalance }}><strong>{cajaBalance}</strong></p>
          </div>
        </div>
        <div className='infoNube'>
          <div className='d-flex justify-content-between align-items-center'>
            <h4>Balance Tranferencias</h4>
            <div className='iconNube'>
              <Bank />
            </div>
          </div>
          <div className='mt-1'>
            <p className='infoIngreso' style={{ color: colorBancosBalance }}><strong>{bancosBalance}</strong></p>
          </div>
        </div>
        <div className='infoNube'>
          <div className='d-flex justify-content-between align-items-center'>
            <h4>I - Totales</h4>
            <div className='iconNube'>
              <CurrencyDollar />
            </div>
          </div>
          <div className='mt-1'>
            <p className='infoIngreso'><strong>{totalesIngresos.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</strong></p>
            <p>Ingresos Totales</p>
          </div>
        </div> 
        <div className='infoNube'>
          <div className='d-flex justify-content-between align-items-center'>
            <h4>I v E</h4>
            <div className='iconNube'>
              <CurrencyDollar />
            </div>
          </div>
          <div className='mt-1'>
            <p className='infoIngreso' style={{ color: colorTotalBalance }}><strong>{totalesBalance}</strong></p>
            <p>Ingresos vs Egresos</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inicio;

