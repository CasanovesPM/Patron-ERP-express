import { useState, useEffect } from "react";
import { db, collection, getDocs, query, where, doc, setDoc, getDoc, updateDoc  } from '../../firebaseConfig';  // Asegúrate de importar correctamente Firebase
import AddValue from "./compsIngresos/addValue";
import { CurrencyDollar, Bank, ArrowRightCircleFill } from 'react-bootstrap-icons';
import InfoNube from './compsIngresos/infoNubes';
import InfoX2Nube from './compsIngresos/infoX2Nubes';
import TableCheques from './compsIngresos/TableCheques';
import Swal from 'sweetalert2';
import AddExcelCheques from './compsIngresos/AddExcelCheques'
import Cheques from './compsIngresos/Cheques'
import ChequesPropios from './compsIngresos/ChequesPropios'

import TableChequesFisicos from './compsIngresos/TableChequesFisicos'
import moment from 'moment';
import 'moment/locale/es'; // Asegúrate de importar el idioma si querés usar español

moment.locale('es'); // Establece el idioma a español

const Banco = ({ userId }) => {
  const [bancoPresente, setBancoPresente] = useState('');
  const [bancoActual, setBancoActual] = useState(0);
  const [mostrarEcheqs, setMostrarEcheqs] = useState(true);
  const [hastaEl15, setHastaEl15] = useState('');
  const [hastaElFinal, setHastaElFinal] = useState('');
  const [emitidosTodos, setEmitidosTodos] = useState('');
  const [hastaEl15Proximo, setChequesPorCubrirProximoAl15] = useState('');
  const [hastaElFinalProximo, setChequesPorCubrirProximoAlFin] = useState('');
  const [showExcelCheques, setShowExcelCheques] = useState(false);
  const [showChequesTerceros, setShowChequesTerceros] = useState(false);
  const [showChequesPropios, setShowChequesPropios] = useState(false);
  const [showCartera, setShowCartera] = useState(false);

  const fecha = moment().format('DD-MM-YYYY'); // Formato DD-MM-YYYY

  const nombreMes = moment().format('MMMM'); // Ej: "mayo"
  const mesSiguiente = moment().add(1, 'month').format('MMMM'); // mes siguiente

  const nombreMesCapitalizado = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);
  const nombreMesSiguienteCapitalizado = mesSiguiente.charAt(0).toUpperCase() + mesSiguiente.slice(1);


// Función para obtener el banco presente desde localStorage
const fetchBancoPresente = async () => {
  try {
    if (!userId) throw new Error('userId no está definido');

    // Solo mostrar loading si no hay datos previos o es la primera carga
    const showLoading = bancoActual === 0 || bancoActual === '';
    
    if (showLoading) {
      Swal.fire({
        title: 'Cargando datos...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
    }

    // Ahora accedemos al documento específico de bancoPresente
    const bancoRef = doc(db, 'users', userId, 'Banco', 'bancoInfo');
    const bancoDoc = await getDoc(bancoRef);

    if (bancoDoc.exists()) {
      const data = bancoDoc.data();
      const bancoValue = data && data.bancoPresente !== undefined ? Number(data.bancoPresente) : 0;
      setBancoActual(bancoValue);
    } else {
      // Si no existe, establecer valor por defecto de 0 sin mostrar error
      setBancoActual(0);
    }

    if (showLoading) {
      Swal.close();
    }
  } catch (error) {
    Swal.close();
    // Solo mostrar error si es un error real, no si simplemente no existe el documento
    if (error.message && !error.message.includes('No se encontró')) {
      Swal.fire({
        title: 'Error',
        text: 'Hubo un problema al obtener los datos.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
    // Establecer valor por defecto en caso de error
    setBancoActual(0);
    console.error("Error al obtener los datos:", error);
  }
};

// Función para obtener cheques por cubrir desde Firebase
const fetchChequesPorCubrir = async () => {
  try {

    const estadosValidos = ['Emitido', 'Aceptado', 'ENTREGADO'];

    // Consulta para cheques físicos antes del 15
    const chequesQueries = [`Egresos`].map(tipo => {
      return getDocs(collection(db, `users/${userId}/Cheques/Fisicos/${tipo}`))
        .then(chequesSnap => {
          const montos = chequesSnap.docs
            .map(chequeDoc => {
              const data = chequeDoc.data();
              const chequeMonto = parseFloat(data.monto) || 0;
              const chequeEstado = data.estado || '';
              const chequeFecha = data.fechacobro || '';
              const [dia, mes, ano] = chequeFecha.split('-');
              const mesActual = String(new Date().getMonth() + 1).padStart(2, '0');

              if (estadosValidos.includes(chequeEstado) && (dia <= 15 && mes === mesActual) || mes === (mesActual - 1)) {
                return chequeMonto;
              }

              return null;
            })
            .filter(monto => monto !== null); // Filtrar los montos válidos

          return montos;
        });
    });

    // Consulta para cheques físicos al Fin
    const chequesQueriesAlFin = [`Egresos`].map(tipo => {
      return getDocs(collection(db, `users/${userId}/Cheques/Fisicos/${tipo}`))
        .then(chequesSnap => {
          const montos = chequesSnap.docs
            .map(chequeDoc => {
              const data = chequeDoc.data();
              const chequeMonto = parseFloat(data.monto) || 0;
              const chequeEstado = data.estado || '';
              const chequeFecha = data.fechacobro || '';
              const [dia, mes, ano] = chequeFecha.split('-');
              const mesActual = String(new Date().getMonth() + 1).padStart(2, '0');
              const lastDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

              if (estadosValidos.includes(chequeEstado) && dia <= (lastDayOfMonth) && (mes === mesActual || mes === (mesActual - 1))) {
                return chequeMonto;
              }

              return null;
            })
            .filter(monto => monto !== null); // Filtrar los montos válidos

          return montos;
        });
    });

    // Consulta para cheques electrónicos (hasta el 15 del mes actual)
    const chequesElectronicosQueriesAl15 = getDocs(collection(db, `users/${userId}/Cheques/Electronicos/Egresos`))
      .then(chequesSnap => {
        const montos = chequesSnap.docs
          .map(chequeDoc => {
            const data = chequeDoc.data();
            const chequeMonto = parseFloat(data.monto) || 0;
            const chequeEstado = data.estado || '';
            const chequeFecha = data.fechaPago || '';
            const [dia, mes, ano] = chequeFecha.split('-').map(Number); // Convertir a números
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth() + 1; // Mes actual (1-12)
            const currentYear = currentDate.getFullYear();
            const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();

            // Mes anterior
            const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
            const previousMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

            // Verificar el estado y la fecha
            if (estadosValidos.includes(chequeEstado)) {
              // Cheques del 1 al 15 del mes actual
              if (mes === currentMonth && ano === currentYear && dia <= 15) {
                return chequeMonto;
              }
              // Cheques del mes anterior
              if (mes === previousMonth && ano === previousMonthYear) {
                return chequeMonto;
              }
            }

            return null;
          })
          .filter(monto => monto !== null); // Filtrar los montos válidos

        return montos;
      });

    // Consulta para cheques electrónicos (hasta el final del mes actual)
    const chequesElectronicosQueriesAlFin = getDocs(collection(db, `users/${userId}/Cheques/Electronicos/Egresos`))
      .then(chequesSnap => {
        const montos = chequesSnap.docs
          .map(chequeDoc => {
            const data = chequeDoc.data();
            const chequeMonto = parseFloat(data.monto) || 0;
            const chequeEstado = data.estado || '';
            const chequeFecha = data.fechaPago || '';
            const [dia, mes, ano] = chequeFecha.split('-').map(Number); // Convertir a números
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth() + 1; // Mes actual (1-12)
            const currentYear = currentDate.getFullYear();
            const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();

            // Mes anterior
            const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
            const previousMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

            // Verificar el estado y la fecha
            if (estadosValidos.includes(chequeEstado)) {
              // Cheques del 1 al 15 del mes actual
              if (mes === currentMonth && ano === currentYear && dia <= lastDayOfMonth) {
                return chequeMonto;
              }
              // Cheques del mes anterior
              if (mes === previousMonth && ano === previousMonthYear) {
                return chequeMonto;
              }
            }

            return null;
          })
          .filter(monto => monto !== null); // Filtrar los montos válidos

        return montos;
      });

    // Consulta para cheques electrónicos (todos los cheques)
    const chequesElectronicosQueriesTodos = getDocs(collection(db, `users/${userId}/Cheques/Electronicos/Egresos`))
      .then(chequesSnap => {
        const montos = chequesSnap.docs
          .map(chequeDoc => {
            const data = chequeDoc.data();
            const chequeMonto = parseFloat(data.monto) || 0;
            const chequeEstado = data.estado || '';

            if (estadosValidos.includes(chequeEstado)) {
              return chequeMonto;
            }

            return null;
          })
          .filter(monto => monto !== null); // Filtrar los montos válidos

        return montos;
      });

    // Ejecutar todas las promesas y combinar resultados
    const [fisicosResultsAl15, fisicosResultsAlFin, electronicosResultsAl15, electronicosResultsAlFin, electronicosResultsTodos] = await Promise.all([
      Promise.all(chequesQueries),
      Promise.all(chequesQueriesAlFin),
      chequesElectronicosQueriesAl15,
      chequesElectronicosQueriesAlFin,
      chequesElectronicosQueriesTodos,
    ]);

    // Combina los resultados de todos los montos
    const allMontosAl15 = [...fisicosResultsAl15.flat(), ...electronicosResultsAl15];
    const allMontosAlFin = [...fisicosResultsAlFin.flat(), ...electronicosResultsAlFin];
    const allMontosTodos = [...fisicosResultsAlFin.flat(), ...electronicosResultsTodos];

    // Calcula los totales
    const chequesTotalsAl15 = allMontosAl15.reduce((acc, monto) => acc + monto, 0);
    const chequesTotalsAlFin = allMontosAlFin.reduce((acc, monto) => acc + monto, 0);
    const chequesTotalsTodos = allMontosTodos.reduce((acc, monto) => acc + monto, 0);

    // Actualiza el estado con los totales
    setHastaEl15(chequesTotalsAl15);
    setHastaElFinal(chequesTotalsAlFin);
    setEmitidosTodos(chequesTotalsTodos);

  } catch (error) {
    console.error('Error al obtener los datos:', error);
  }
};


const fetchChequesPorCubrirProximo = async () => {
  try {
              const estadosValidos = ['Emitido', 'Aceptado', 'ENTREGADO'];

    // Consulta para cheques físicos antes del 15 del mes siguiente
    const chequesQueries = [`Egresos`].map(tipo => {
      return getDocs(collection(db, `users/${userId}/Cheques/Fisicos/${tipo}`))
        .then(chequesSnap => {
          const mesProximo = String(new Date().getMonth() + 2).padStart(2, '0');
          const montos = chequesSnap.docs
            .map(chequeDoc => {
              const data = chequeDoc.data();
              const chequeMonto = parseFloat(data.monto) || 0;
              const chequeEstado = data.estado || '';
              const chequeFecha = data.fechacobro || '';
              const [dia, mes] = chequeFecha.split('-');

              if (estadosValidos.includes(chequeEstado) && (dia <= 15 && mes === mesProximo)) {
                return chequeMonto;
              }

              return null;
            })
            .filter(monto => monto !== null); // Filtrar los montos válidos

          return montos;
        });
    });

    // Consulta para cheques físicos hasta el final del mes siguiente
    const chequesQueriesAlFin = [`Egresos`].map(tipo => {
      return getDocs(collection(db, `users/${userId}/Cheques/Fisicos/${tipo}`))
        .then(chequesSnap => {
          const mesProximo = String(new Date().getMonth() + 2).padStart(2, '0');
          const lastDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0).getDate();

          const montos = chequesSnap.docs
            .map(chequeDoc => {
              const data = chequeDoc.data();
              const chequeMonto = parseFloat(data.monto) || 0;
              const chequeEstado = data.estado || '';
              const chequeFecha = data.fechacobro || '';
              const [dia, mes] = chequeFecha.split('-');

              if (estadosValidos.includes(chequeEstado) && dia <= lastDayOfMonth && mes === mesProximo) {
                return chequeMonto;
              }

              return null;
            })
            .filter(monto => monto !== null); // Filtrar los montos válidos

          return montos;
        });
    });

    // Consulta para cheques electrónicos antes del 15 del mes siguiente
    const chequesElectronicosQueriesAl15 = getDocs(collection(db, `users/${userId}/Cheques/Electronicos/Egresos`))
      .then(chequesSnap => {
        const mesProximo = String(new Date().getMonth() + 2).padStart(2, '0');
        const montos = chequesSnap.docs
          .map(chequeDoc => {
            const data = chequeDoc.data();
            const chequeMonto = parseFloat(data.monto) || 0;
            const chequeEstado = data.estado || '';
            const chequeFecha = data.fechaPago || '';
            const [dia, mes] = chequeFecha.split('-');

            if (estadosValidos.includes(chequeEstado) && dia <= 14 && mes === mesProximo) {
              return chequeMonto;
            }

            return null;
          })
          .filter(monto => monto !== null); // Filtrar los montos válidos

        return montos;
      });

    // Consulta para cheques electrónicos hasta el final del mes siguiente
    const chequesElectronicosQueriesAlFin = getDocs(collection(db, `users/${userId}/Cheques/Electronicos/Egresos`))
      .then(chequesSnap => {
        const mesProximo = String(new Date().getMonth() + 2).padStart(2, '0');
        const lastDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0).getDate();

        const montos = chequesSnap.docs
          .map(chequeDoc => {
            const data = chequeDoc.data();
            const chequeMonto = parseFloat(data.monto) || 0;
            const chequeEstado = data.estado || '';
            const chequeFecha = data.fechaPago || '';
            const [dia, mes] = chequeFecha.split('-');

            if (estadosValidos.includes(chequeEstado) && dia <= lastDayOfMonth && mes === mesProximo) {
              return chequeMonto;
            }

            return null;
          })
          .filter(monto => monto !== null); // Filtrar los montos válidos

        return montos;
      });

    // Ejecutar todas las promesas y combinar resultados
    const [fisicosResultsAl15, fisicosResultsAlFin, electronicosResultsAl15, electronicosResultsAlFin] = await Promise.all([
      Promise.all(chequesQueries),
      Promise.all(chequesQueriesAlFin),
      chequesElectronicosQueriesAl15,
      chequesElectronicosQueriesAlFin,
    ]);

    // Combina los resultados de todos los montos
    const allMontosAl15 = [...fisicosResultsAl15.flat(), ...electronicosResultsAl15];
    const allMontosAlFin = [...fisicosResultsAlFin.flat(), ...electronicosResultsAlFin];

    // Calcula los totales
    const chequesTotalsAl15 = allMontosAl15.reduce((acc, monto) => acc + monto, 0);
    const chequesTotalsAlFin = allMontosAlFin.reduce((acc, monto) => acc + monto, 0);

    // Actualiza el estado con los totales
    setChequesPorCubrirProximoAl15(chequesTotalsAl15);
    setChequesPorCubrirProximoAlFin(chequesTotalsAlFin);
  } catch (error) {
    console.error('Error al obtener los datos:', error);
  }
};


  useEffect(() => {
    fetchBancoPresente();
    fetchChequesPorCubrir();
    fetchChequesPorCubrirProximo();
  }, [userId]);

  // Función para actualizar el banco presente en Firebase
  const handleSetBanco = async (userId, valor) => {
    try {
      // Convertir el valor a número
      const valorNumerico = Number(valor) || 0;
      
      Swal.fire({
        title: 'Actualizando Banco...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Actualizar el valor de bancoPresente en localStorage
      const bancoRef = doc(db, 'users', userId, 'Banco', 'bancoInfo');
      await setDoc(bancoRef, { bancoPresente: valorNumerico }, { merge: true });

      // Actualizar el estado local directamente sin recargar
      setBancoActual(valorNumerico);
      setBancoPresente('');

      // Cerrar el loading antes de mostrar el éxito
      Swal.close();
      
      // Mostrar mensaje de éxito que se cierra automáticamente
      await Swal.fire({
        title: 'Carga Exitosa',
        text: 'Valor cargado con éxito.',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        timer: 2000,
        timerProgressBar: true,
        allowOutsideClick: false
      });
    } catch (error) {
      Swal.close();
      Swal.fire({
        title: 'Error',
        text: 'Hubo un problema al guardar los datos.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        timer: 3000,
        timerProgressBar: true
      });
      console.error('Error al guardar los datos:', error);
    }
  };

  const handleShowECheqs = () => {
    setMostrarEcheqs(!mostrarEcheqs);
    setShowExcelCheques(false);
    setShowChequesTerceros(false);
    setShowCartera(false);
    setShowChequesPropios(false);


  };

  const handleToggleExcelCheques = () => {
    setMostrarEcheqs(false);
    setShowExcelCheques(!showExcelCheques);
    setShowChequesTerceros(false);
    setShowCartera(false);  
    setShowChequesPropios(false);

  };

  const handleToggleChequesFisicosTerceros = () => {
    setMostrarEcheqs(false);
    setShowExcelCheques(false);
    setShowChequesTerceros(!showChequesTerceros);
    setShowCartera(false);  
    setShowChequesPropios(false);

  };

    const handleToggleChequesFisicosPropios = () => {
      setMostrarEcheqs(false);
      setShowExcelCheques(false);
      setShowChequesTerceros(false);
      setShowChequesPropios(!showChequesPropios);
      setShowCartera(false); 
 
    };

  const handleToggleCartera = () => {
    setMostrarEcheqs(false);
    setShowExcelCheques(false);
    setShowChequesTerceros(false);
    setShowCartera(!showCartera);
    setShowChequesPropios(false);

  }

  const handleGuardarCheques = async (valores) => {
    console.log('Valores ingresados:', valores.id);
    console.log(valores);
    // Mostrar el loading mientras se guarda el cheque
    try {
        Swal.fire({
            title: 'Cargando...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
  
        // Función auxiliar para obtener la ruta donde guardaremos los cheques
        const getRuta = (userId) => {
          return `users/${userId}/Cheques/Fisicos/Ingresos/`;
        };
  
        // Crear la referencia a la colección de cheques en Firestore
        const userIngresosCheque = collection(db, getRuta(userId));
        const docRefCheque = doc(userIngresosCheque, valores.nrocheque.toString());
  
        // Obtener la referencia al documento, si ya existe
        const docSnapCheque = await getDoc(docRefCheque);
  
        // Si el documento no existe, lo creamos con la estructura inicial
        if (!docSnapCheque.exists()) {
          await setDoc(docRefCheque, {
            fecha: '',
            cliente: '',
            monto: '',
            banco: '',
            nrocheque: 0,
            librador: '',
            cuitlibrador: 0,
            fechacobro: '',
            entrega: ''
          });
        }
  
        // Asignar el estado del cheque basado en el tipo
        let entregado = '';

          entregado = 'EN CARTERA';

        // Actualizar el documento con los valores proporcionados
        await updateDoc(docRefCheque, {
          fecha: valores.fecha,
          cliente: valores.cliente,
          monto: valores.monto,
          banco: valores.banco,
          nrocheque: valores.nrocheque,
          librador: valores.librador,
          cuitlibrador: valores.cuitLibrador,
          fechacobro: valores.fechaCobro,
          estado: entregado,
          entrega: 'EN CARTERA'
        });
  
        // Cerrar el loading y mostrar el mensaje de éxito
        Swal.close();
        Swal.fire({
            title: 'Carga Exitosa',
            text: 'Los datos se han cargado correctamente.',
            icon: 'success',
            confirmButtonText: 'Aceptar'
        }).then(() => {
          setShowChequesTerceros(!showChequesTerceros);
          setShowCartera(!showCartera);
        });
  
    } catch (error) {
        // Mostrar mensaje de error en caso de que algo falle
        Swal.fire({
            title: 'Error',
            text: 'Hubo un problema al guardar los datos.',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
        console.error('Error al guardar el ingreso:', error);
    }
  };

  const handleGuardarChequesPropios = async (valores) => {
    console.log('Valores ingresados:', valores.id);
    console.log(valores);
    // Mostrar el loading mientras se guarda el cheque
    try {
        Swal.fire({
            title: 'Cargando...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
  
        // Función auxiliar para obtener la ruta donde guardaremos los cheques
        const getRuta = (userId) => {
          return `users/${userId}/Cheques/Electronicos/Egresos/`;
        };
  
        // Crear la referencia a la colección de cheques en Firestore
        const userIngresosCheque = collection(db, getRuta(userId));
        const docRefCheque = doc(userIngresosCheque, valores.nrocheque.toString());
  
        // Obtener la referencia al documento, si ya existe
        const docSnapCheque = await getDoc(docRefCheque);
  
        // Si el documento no existe, lo creamos con la estructura inicial
        if (!docSnapCheque.exists()) {
          await setDoc(docRefCheque, {
            fecha: '',
            proveedor: '',
            monto: '',
            tipo: '',
            numero: 0,
            librador: '',
            cuit: '',
            fechaPago: '',
            estado: '',
          });
        }
  
        // Asignar el estado del cheque basado en el tipo
        let entregado = '';

          entregado = 'Aceptado';

        // Actualizar el documento con los valores proporcionados
        await updateDoc(docRefCheque, {
          fecha: valores.fecha,
          proveedor: valores.proveedor,
          monto: valores.monto,
          tipo: valores.tipo,
          numero: valores.nrocheque,
          librador: valores.librador,
          cuit: 'FISICO',
          fechaPago: valores.fechaPago,
          estado: entregado,
        });
  
        // Cerrar el loading y mostrar el mensaje de éxito
        Swal.close();
        Swal.fire({
            title: 'Carga Exitosa',
            text: 'Los datos se han cargado correctamente.',
            icon: 'success',
            confirmButtonText: 'Aceptar'
        }).then(() => {
          setShowChequesPropios(!showChequesPropios);
          setMostrarEcheqs(!mostrarEcheqs);
          fetchChequesPorCubrir();
        });
  
    } catch (error) {
        // Mostrar mensaje de error en caso de que algo falle
        Swal.fire({
            title: 'Error',
            text: 'Hubo un problema al guardar los datos.',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
        console.error('Error al guardar el ingreso:', error);
    }
  };
  

  return (
    <div className="container p-3 panelInfo">
      <h2>Informacion de Bancos / Cheques</h2>
      <div className='infoNubes'>
        <InfoNube
          titulo="Banco"
          icono={<Bank />}
          contenido={bancoActual.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) || "Cargando..."}
          subtitulo="Dinero Disponible"
          colorIcono={"#4CAF50"}
          colorContenido={"#80d683"}
        />
        <AddValue
          id="inputSetBancos"
          title="Setear Bancos"
          valor="Valor"
          value={bancoPresente}
          onValueChange={(e) => setBancoPresente(e.target.value)}
          onClick={() => handleSetBanco(userId, bancoPresente)}
        />
        <div className='infoNube noneInMobile'>
          <div className='panelBtnNube' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '100%' }}>
              <button className="btn btn-success btnNube" onClick={handleToggleChequesFisicosTerceros} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {"CH TERCEROS"}
              </button>
              <button className="btn btn-success btnNube" onClick={handleToggleChequesFisicosPropios} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {"CH PROPIOS"}
              </button>
              <button className="btn btn-success btnNube" onClick={handleToggleExcelCheques} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {"ADD EXCEL"}
              </button>
            </div>
          </div>
        </div>
        <div className="infoNube" >
          <div style={{ textAlign: 'center' }}>
             <button className="btn btn-success btnNube mt-2"  onClick={handleToggleCartera}>
                      {"CART. TERCEROS"}
             </button>
            <button className="btn btn-success btnNube mt-2" onClick={handleShowECheqs}>
              {"CART. PROPIOS"}
            </button>
          </div>
        </div>
      </div>
      <div className='infoNubes'>

        <InfoX2Nube
          titulo={nombreMesCapitalizado}
          icono={<CurrencyDollar />}
          contenido={hastaEl15.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) || "Cargando..."}
          contenido2={hastaElFinal.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) || "Cargando..."}
          colorIcono={"#f0d000"}
          colorContenido={"#f0d000"}
          colorContenido2={"#f0d000"}
        />
        <InfoX2Nube
          titulo="Balance"
          icono={<CurrencyDollar />}
          contenido={(bancoActual - hastaEl15).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) || "Cargando..."}
          contenido2={(bancoActual - hastaElFinal).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) || "Cargando..."}
          colorIcono={"#4CAF50"}
          colorContenido={"#80d683"}
          colorContenido2={"#80d683"}
        />
        <InfoX2Nube
          titulo={nombreMesSiguienteCapitalizado}
          icono={<CurrencyDollar />}
          contenido={hastaEl15Proximo.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) || "Cargando..."}
          contenido2={hastaElFinalProximo.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) || "Cargando..."}
          colorIcono={"#f0d000"}
          colorContenido={"#f0d000"}
          colorContenido2={"#f0d000"}
        />
        <InfoX2Nube
          titulo="Balance"
          icono={<CurrencyDollar />}
          contenido={(bancoActual - hastaElFinal - hastaEl15Proximo).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) || "Cargando..."}
          contenido2={(bancoActual - hastaElFinal - hastaElFinalProximo).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) || "Cargando..."}
          colorIcono={"#4CAF50"}
          colorContenido={"#80d683"}
          colorContenido2={"#80d683"}
        />
      </div>




      {mostrarEcheqs && (
        <div className="infoTables">
          <TableCheques userId={userId} bancoActual={bancoActual} />
        </div>
      )}

      {showExcelCheques && 
              <AddExcelCheques userId={userId} />
      } 

      { showChequesTerceros &&       <div className='infoNubes'>
          <Cheques
              title={" Cheques"}
              id="cheques"
              label="Ingresos"
              icon="+"
              value={{ fecha: '' , cliente: '', monto: '', banco: '', nroCheque: '', librador: '', cuitLibrador:'', fechaCobro:'' }} // Valor inicial del objeto
              onClick={handleGuardarCheques}
            />
      </div>}
      { showCartera && 
          <TableChequesFisicos userId={userId} />
      }

      { showChequesPropios &&       <div className='infoNubes'>
          <ChequesPropios
              title={" Cheques"}
              id="cheques"
              label="Egresos"
              icon="+"
              value={{fecha: '' , proveedor: '', monto: '', banco: '', nroCheque: '', librador: '', cuitLibrador:'', fechaPago:'' }} // Valor inicial del objeto
              onClick={handleGuardarChequesPropios}
            />
      </div>}
    </div>

    
  );
};

export default Banco;
