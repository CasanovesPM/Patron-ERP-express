import { useState, useEffect, useCallback } from 'react';
import { CurrencyDollar, Cash, Bank, CashStack, ArrowRightCircleFill } from 'react-bootstrap-icons';
import InfoNube from './compsIngresos/infoNubes'; // Importa el componente InfoNube
import AddInfoNube from './compsIngresos/addValueRazon'; // Importa el componente InfoNube
import Cheques from './compsIngresos/Cheques'; // Importa el componente InfoNube
import ECheques from './compsIngresos/ECheques'; // Importa el componente InfoNube
import TableChequesFisicos from "./compsIngresos/TableChequesFisicos";
import AddExcelCheques from './compsIngresos/AddExcelCheques'
import Swal from 'sweetalert2';

import moment from 'moment';
import { endOfMonth, startOfMonth } from 'date-fns';
import TablaMovimientos from './compsIngresos/TablaMovimientos';

const Movimientos = ({ tipo, nivel, userId }) => {

    const [lvl, setLvl] = useState(nivel)

    const egresoDisplay = tipo === 'Egresos' ? { display: 'block' } : { display: 'none' };
    const egresoNoDisplay = tipo === 'Egresos' ? { display: 'none' } : { display: 'block' };
    const egresoFlex = tipo === 'Egresos' ? {display:'block', textAlign:'center'} : {display:'block-inline', textAlign:'center'};
    // Define colores basados en el tipo
    const colorIcono = tipo === 'Egresos' ? "#961717" : "#000" || 'Ingresos' ? "#4CAF50" : "#000";
    const colorContenido = tipo === 'Egresos' ? "#962e2e" : "#000" || 'Ingresos' ? "#80d683" : "#000";

    const subCaja = tipo === 'Egresos' ? 'Egresos Caja Diaria' : "#000" || 'Ingresos' ? 'Registro Caja Diaria' : "#000";
    const subBanco = tipo === 'Egresos' ? 'Egresos Bancos' : "#000" || 'Ingresos' ? 'Ingresos Bancos' : "#000";
    const subCheque = tipo === 'Egresos' ? 'Egresos Cheques' : "#000" || 'Ingresos' ? 'Ingresos Cheques' : "#000";

    const fecha = moment().format('DD-MM-YYYY'); // Formato DD-MM-YYYY
    
    const [showCheques, setShowCheques] = useState(false);
    const [showECheques, setShowECheques] = useState(false);
    const [showCartera, setShowCartera] = useState(false);
    const [showExcelCheques, setShowExcelCheques] = useState(false);

    const handleToggleCheques = () => {
      setShowCheques(!showCheques); // Invierte el valor de showCheques
      setShowCartera(false);
      setShowECheques(false);
      setShowExcelCheques(false);
    };

    const handleToggleECheques = () => {
      setShowECheques(!showECheques);
      setShowCheques(false); // Invierte el valor de showCheques
      setShowExcelCheques(false);
    };

    const handleToggleExcelCheques = () => {
      setShowExcelCheques(!showExcelCheques);
      setShowCheques(false); // Invierte el valor de showCheques
      setShowECheques(false);
    };

    const handleToggleCartera = () => {
      setShowCartera(!showCartera);
      setShowCheques(false); // Invierte el valor de showCheques

    };

    

    const [inputValueCaja, setInputValueCaja] = useState('');
    const [inputValueCajaRazon, setInputValueCajaRazon] = useState('');

    const [inputValueBancos, setInputValueBancos] = useState('');
    const [inputValueBancosRazon, setInputValueBancosRazon] = useState('');

    const [totalIngresosCaja, setTotalIngresosCaja] = useState(0);
    const [totalIngresosBancos, setTotalIngresosBancos] = useState(0);
    const [totalIngresosCheques, setTotalIngresosCheques] = useState(0);
    const [totalGeneral, setTotalGeneral] = useState(0);
    
    const fetchTotalIngresos = useCallback(async () => {
      if (!userId) return;
  
      try {
          Swal.fire({
              title: 'Cargando datos...',
              allowOutsideClick: false,
              didOpen: () => Swal.showLoading()
          });
  
          // Preparar los datos para enviar al back-end
          const requestData = {
              userId: userId,
              tipo: tipo,
              startDate: startOfMonth(new Date()).toISOString().split('T')[0],
              endDate: endOfMonth(new Date()).toISOString().split('T')[0]
          };
  
          // Enviar la solicitud al back-end
          const response = await fetch('https://patron.com.ar:5000/api/fetchTotalIngresos', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestData),
          });
  
          if (!response.ok) {
              throw new Error('Error en la respuesta del servidor');
          }
  
          const { totalCaja, totalBancos, totalCheques, totalChequesFisicosEgreso, totalChequesElectronicosEgreso } = await response.json();
          setTotalIngresosCaja(totalCaja.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }));
          setTotalIngresosBancos(totalBancos.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }));
          setTotalGeneral((totalCaja + totalBancos ).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }));
          if( tipo === "Ingresos"){
            setTotalIngresosCheques(totalCheques.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }));
          } else {

            setTotalIngresosCheques((totalChequesFisicosEgreso + totalChequesElectronicosEgreso).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }));
          }
          
          Swal.close();
      } catch (error) {
          Swal.fire({
              title: 'Error',
              text: 'Hubo un problema al cargar los datos.',
              icon: 'error',
              confirmButtonText: 'Aceptar'
          });
          console.error("Error al obtener el valor:", error);
      }
  }, [userId, tipo]);
  
  
  
  useEffect(() => {
      fetchTotalIngresos();
  }, [userId, fetchTotalIngresos]);
    
  const handleGuardarIngreso = async (id, motive) => {
    try {
        Swal.fire({
            title: 'Cargando ' + tipo + '...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        let valorAIngresar;
        let razonAIngresar;

        switch (id) {
            case 'caja':
                valorAIngresar = Number(inputValueCaja);
                razonAIngresar = inputValueCajaRazon;
                break;
            case 'banco':
                valorAIngresar = Number(inputValueBancos);
                razonAIngresar = inputValueBancosRazon;
                break;
            default:
                Swal.fire({
                    title: 'Error',
                    text: 'Hubo un problema al guardar los datos.',
                    icon: 'error',
                    confirmButtonText: 'Aceptar'
                });
                console.error('ID de ingreso no válido:', id);
                return;
        }

        // Preparar los datos para enviar al back-end
        const requestData = {
            userId: userId,
            fecha: fecha,
            tipo: tipo,
            id: id,
            valor: valorAIngresar,
            razon: razonAIngresar
        };

        // Enviar la solicitud al back-end
        const response = await fetch('https://patron.com.ar:5000/api/guardarIngreso', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
        });

        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }

        // Limpiar los inputs
        setInputValueCaja('');
        setInputValueCajaRazon('');  
        setInputValueBancos('');
        setInputValueBancosRazon('');

        Swal.close();
        Swal.fire({
            title: 'Carga Exitosa',
            text: 'Los datos se han cargado correctamente.',
            icon: 'success',
            confirmButtonText: 'Aceptar'
        }).then(() => {
            fetchTotalIngresos();
        });

    } catch (error) {
        Swal.fire({
            title: 'Error',
            text: 'Hubo un problema al guardar los datos.',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
        console.error('Error al guardar el ingreso:', error);
    }
};


const handleGuardarCheques = async (valores) => {
  console.log('Valores ingresados:', valores.id);
  // Aquí puedes realizar otras acciones con los valores, como enviarlos a un servidor
  try {
      Swal.fire({
          title: 'Cargando ' + tipo + '...',
          allowOutsideClick: false,
          didOpen: () => {
              Swal.showLoading();
          }
      });

      // Preparar los datos para enviar al back-end
      const requestData = {
          userId: userId,
          fecha: fecha,
          tipo: tipo,
          cheque: valores
      };

      // Enviar la solicitud al back-end
      const response = await fetch('https://patron.com.ar:5000/api/guardarCheque', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
      });

      if (!response.ok) {
          throw new Error('Error en la respuesta del servidor');
      }

      // Cerrar Cheques
      setShowCheques(!showCheques);

      Swal.close();
      Swal.fire({
          title: 'Carga Exitosa',
          text: 'Los datos se han cargado correctamente.',
          icon: 'success',
          confirmButtonText: 'Aceptar'
      }).then(() => {
          fetchTotalIngresos();
      });

  } catch (error) {
      Swal.fire({
          title: 'Error',
          text: 'Hubo un problema al guardar los datos.',
          icon: 'error',
          confirmButtonText: 'Aceptar'
      });
      console.error('Error al guardar el ingreso:', error);
  }
};

    

const handleGuardarECheques = async (valores) => {
  console.log('Valores ingresados:', valores.fecha);
  if (!valores.numero) {
    Swal.fire({
      title: 'Error',
      text: 'Número de cheque no puede estar vacío.',
      icon: 'error',
      confirmButtonText: 'Aceptar'
    });
    return;
  }
  try {
    Swal.fire({
      title: 'Cargando ' + tipo + '...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Preparar los datos para enviar al back-end
    const requestData = {
      userId: userId,
      fecha: valores.fecha,
      tipo: tipo,
      nrocheque: valores.numero,
      eCheque: valores
    };

    // Enviar la solicitud al back-end
    const response = await fetch('https://patron.com.ar:5000/api/guardarECheque', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error('Error en la respuesta del servidor');
    }

    // Cerrar eCheques
    setShowECheques(!showECheques);

    Swal.close();
    Swal.fire({
      title: 'Carga Exitosa',
      text: 'Los datos se han cargado correctamente.',
      icon: 'success',
      confirmButtonText: 'Aceptar'
    }).then(() => {
      fetchTotalIngresos();
    });

  } catch (error) {
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
      <h2>{tipo} al <span>{fecha}</span></h2>
      <div className='infoNubes'>
      <InfoNube
        titulo="Totales"
        icono={<CurrencyDollar />}
        contenido={totalGeneral}
        subtitulo="Resumen"
        colorIcono={colorIcono}
        colorContenido={colorContenido}
      />
      <InfoNube
        titulo="Caja"
        icono={<Cash />}
        contenido={totalIngresosCaja} // Utiliza la variable totalIngresos aquí
        subtitulo={subCaja}
        colorIcono={colorIcono}
        colorContenido={colorContenido}
      />
      {(lvl === 1 && tipo === 'Ingresos') && (
        <InfoNube
          titulo="Bancos"
          icono={<Bank />}
          contenido={totalIngresosBancos}
          subtitulo={subBanco}
          colorIcono={colorIcono}
          colorContenido={colorContenido}
        />
      )}
       {(lvl === 0 && tipo === 'Ingresos' || lvl === 0 && tipo === 'Egresos') && (
        console.log(lvl, tipo),
        <InfoNube
          titulo="Bancos"
          icono={<Bank />}
          contenido={totalIngresosBancos}
          subtitulo={subBanco}
          colorIcono={colorIcono}
          colorContenido={colorContenido}
        />
      )}
      {(lvl === 1 && tipo === 'Ingresos') && (
        <InfoNube
          titulo="Cheques"
          icono={<CashStack />}
          contenido={totalIngresosCheques}
          subtitulo={subCheque}
          colorIcono={colorIcono}
          colorContenido={colorContenido}
        />
      )}
      {(lvl === 0 && tipo === 'Ingresos' || lvl === 0 && tipo === 'Egresos') && (
        <InfoNube
          titulo="Cheques"
          icono={<CashStack />}
          contenido={totalIngresosCheques}
          subtitulo={subCheque}
          colorIcono={colorIcono}
          colorContenido={colorContenido}
        />
      )}
      </div>
      <div className='infoNubes'>
            <div className='infoNube noneInMobile'>
                <div className='panelBtnNube'>
                    <ArrowRightCircleFill color='#4CAF50' size={100} />
                </div>
            </div>
            <AddInfoNube
            id="inputIngresoCaja"
            valor="Valor"
            title={tipo + " Caja"}
            value={inputValueCaja}
            motive={inputValueCajaRazon}
            razon="Razon"
            onValueChange={(e) => setInputValueCaja(e.target.value)}
            onMotiveChange={(e) => setInputValueCajaRazon(e.target.value)}
            onClick={() => handleGuardarIngreso("caja", inputValueCajaRazon)} // Pasa "caja" como argumento
            />
            {(lvl === 1 && tipo === 'Ingresos') && (
              <AddInfoNube
              id="inputIngresoBancos"
              valor="Valor"
              title={tipo + " Bancos"}
              value={inputValueBancos}
              motive={inputValueBancosRazon}
              razon="Razon"
              onValueChange={(e) => setInputValueBancos(e.target.value)}
              onMotiveChange={(e) => setInputValueBancosRazon(e.target.value)}
              onClick={() => handleGuardarIngreso("banco", inputValueBancosRazon)} // Pasa "caja" como argumento
              />
            )}
              
              {(lvl === 0 && tipo === 'Ingresos' || lvl === 0 && tipo === 'Egresos') && (
              <AddInfoNube
              id="inputIngresoBancos"
              valor="Valor"
              title={tipo + " Bancos"}
              value={inputValueBancos}
              motive={inputValueBancosRazon}
              razon="Razon"
              onValueChange={(e) => setInputValueBancos(e.target.value)}
              onMotiveChange={(e) => setInputValueBancosRazon(e.target.value)}
              onClick={() => handleGuardarIngreso("banco", inputValueBancosRazon)} // Pasa "caja" como argumento
              />
            )}
            {(lvl === 1 && tipo === 'Ingresos') && (
              <div className="infoNube" style={egresoFlex}>
                  <div className='centered-content'>
                    <button className="btn btn-success btnNube mt-2" onClick={handleToggleCheques}>
                      {"ADD CHEQUE"}
                    </button>
                  </div>
              </div>
            )}

            {(lvl === 0 && tipo === 'Ingresos' || lvl === 0 && tipo === 'Egresos') && (
              <div className="infoNube" style={egresoFlex}>
                  <div className='centered-content'>
                    <button className="btn btn-success btnNube mt-2" onClick={handleToggleCheques}>
                      {"ADD CHEQUE"}
                    </button>
                    <button className="btn btn-success btnNube mt-2" style={egresoNoDisplay} onClick={handleToggleCartera}>
                      {"VER CARTERA"}
                    </button>
                    <button className="btn btn-success btnNube mt-2" style={egresoDisplay} onClick={handleToggleECheques}>
                      {"ADD E-CHEQ"}
                    </button>
                    <button className="btn btn-success btnNube mt-2" style={egresoDisplay} onClick={handleToggleExcelCheques}>
                      {"ADD EXCEL"}
                    </button>
                  </div>
              </div>
            )}
      </div>

      {(lvl === 0 && tipo === 'Ingresos' ) && (
        <TablaMovimientos
          titulo="Cheques"
          icono={<CashStack />}
          contenido={totalIngresosCheques}
          subtitulo={subCheque}
          colorIcono={colorIcono}
          colorContenido={colorContenido}
        />
      )}
      { showCheques &&       <div className='infoNubes'>
          <Cheques
              title={tipo + " Cheques"}
              id="cheques"
              label="Ingreso"
              icon="+"
              value={{ fecha: '' , cliente: '', monto: '', banco: '', nroCheque: '', librador: '', cuitLibrador:'', fechaCobro:'' }} // Valor inicial del objeto
              onClick={handleGuardarCheques}
            />
      </div>}

      { showECheques &&       <div className='infoNubes'>
          <ECheques
              title = {tipo + " E-Cheques"}
              id="cheques"
              label="Ingreso"
              icon="+"
              value={{     fecha: '',
                numero:'',
                cuit: '',
                proveedor: '',
                importe: '',
                fechaPago: '',
                motivo: '',
                descripcion: '',
                estado: 'Emitido'}} // Valor inicial del objeto
              onClick={handleGuardarECheques}
            />
      </div>}
      {
        showExcelCheques && 
         <AddExcelCheques userId={userId}
/>
      }          

      { showCartera && 
          <TableChequesFisicos userId={userId} />
      }

    </div>
  );
};

export default Movimientos;