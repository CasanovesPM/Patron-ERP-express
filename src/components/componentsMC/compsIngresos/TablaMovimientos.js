// ...resto de imports
import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Swal from 'sweetalert2';
import Cheques from './Cheques';
import { db, collection, getDocs, doc, setDoc, deleteDoc } from '../../../firebaseConfig';

const TablaMovimientos = (userId) => {
  let usId = userId.userId;

  const [ordenCampo, setOrdenCampo] = useState('');
const [ordenAscendente, setOrdenAscendente] = useState(true);
  const [clientes, setClientes] = useState([]);
  const [cliente, setCliente] = useState('');
  const [razon, setRazon] = useState('');
  const [monto, setMonto] = useState('');
  const [pago, setPago] = useState('');
  const [tipoTarjeta, setTipoTarjeta] = useState('');
  const [valorTarjeta, setValorTarjeta] = useState('');
  const [parcialEfectivo, setParcialEfectivo] = useState('');
  const [parcialCheque, setParcialCheque] = useState('');
  const [retiros, setRetiros] = useState('');
  const [editId, setEditId] = useState(null);
  const [tipoComprobante, setTipoComprobante] = useState("");
  const [subtipoFactura, setSubtipoFactura] = useState("");
  const [numeroComprobante, setNumeroComprobante] = useState("");

  const [fechaDoc, setFechaDoc] = useState("");

  useEffect(() => {
    const fetchDataFromFirebase = async () => {
      Swal.fire({
        title: 'Cargando información...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        const fecha = new Date();
        const fechaFormateada = fecha.toLocaleDateString('es-ES');
        const fechaFormateadaDoc = fechaFormateada.replace(/\//g, "-");
        setFechaDoc(fechaFormateadaDoc);
        const ref = collection(db, `users/${usId}/Movimientos/${fechaFormateadaDoc}/Data`);
        const snapshot = await getDocs(ref);
        const items = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        setClientes(items);
        Swal.close();
      } catch (error) {
        console.error('Error al cargar datos desde Firebase:', error);
        Swal.fire('Error', 'No se pudieron cargar los datos.', 'error');
      }
    };

    fetchDataFromFirebase();
  }, [usId]);

  const handleAddOrUpdateRow = async () => {
    if (!cliente || !razon || !monto || !pago) {
      alert('Por favor complete todos los campos');
      return;
    }

    const newRow = {
      cliente,
      razon,
      tipoComprobante,
      subtipoFactura,
      numeroComprobante,
      monto,
      pago,
      tipoTarjeta,
      valorTarjeta,
      parcialEfectivo,
      parcialCheque,
      retiros,
    };

    const rowId = editId !== null ? editId : `${pago}-${monto}`;

    try {
      const docRef = doc(db, `users/${usId}/Movimientos/${fechaDoc}/Data/${rowId}`);
      await setDoc(docRef, newRow);

      setClientes(prev => {
        const exists = prev.find(item => item.id === rowId);
        if (exists) {
          return prev.map(item => item.id === rowId ? { ...newRow, id: rowId } : item);
        } else {
          return [...prev, { ...newRow, id: rowId }];
        }
      });

      setEditId(null);

      Swal.fire({
        icon: 'success',
        title: 'Agregado con éxito',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error al guardar:', error);
    }

    setCliente('');
    setRazon('');
    setMonto('');
    setPago('');
    setTipoTarjeta('');
    setValorTarjeta('');
    setParcialEfectivo('');
    setParcialCheque('');
    setRetiros('');
    setTipoComprobante('');
    setSubtipoFactura('');
    setNumeroComprobante('');
  };

  const handleEditRow = (item) => {
    setCliente(item.cliente || '');
    setRazon(item.razon || '');
    setMonto(item.monto || '');
    setPago(item.pago || '');
    setTipoTarjeta(item.tipoTarjeta || '');
    setValorTarjeta(item.valorTarjeta || '');
    setParcialEfectivo(item.parcialEfectivo || '');
    setParcialCheque(item.parcialCheque || '');
    setRetiros(item.retiros || '');
    setTipoComprobante(item.tipoComprobante || '');
    setSubtipoFactura(item.subtipoFactura || '');
    setNumeroComprobante(item.numeroComprobante || '');
    setEditId(item.id);
  };

  const handleDeleteRow = async (id) => {
    try {
      const docRef = doc(db, `users/${usId}/Movimientos/${fechaDoc}/Data/${id}`);
      await deleteDoc(docRef);
      setClientes(prev => prev.filter(item => item.id !== id));
      Swal.fire({
        icon: 'success',
        title: 'Eliminado con éxito',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  };

  // Calcular los totales por tipo de pago
  const calculateTotals = () => {
    let efectivoTotal = 0;
    let transfTotal = 0;
    let tarjetaCreditoTotal = 0;
    let tarjetaDebitoTotal = 0;
    let chequeTotal = 0;
    let ntcTotal = 0;
let retirosEfectivoTotal = 0;
let retirosTransferTotal = 0;

    const facturadoTotal = clientes
    .filter((row) => row.tipoComprobante === "FACTURA")
    .reduce((acc, row) => acc + parseFloat(row.monto || 0), 0);

    const internoTotal = clientes
      .filter((row) => row.tipoComprobante === "INTERNO")
      .reduce((acc, row) => acc + parseFloat(row.monto || 0), 0);


    clientes.forEach((row) => {
      const monto = parseFloat(row.monto);
        // Para retiros
  // Retiros discriminados
  if (row.tipoComprobante === "RETIRO" && row.pago === "EFECTIVO") {
    retirosEfectivoTotal += monto;
  } else if (row.tipoComprobante === "RETIRO" && row.pago === "TRANSFERENCIA") {
    retirosTransferTotal += monto;
  }
      if (row.pago === "EFECTIVO" && row.tipoComprobante === "FACTURA" || row.pago === "EFECTIVO" && row.tipoComprobante === "INTERNO") {
        efectivoTotal += monto;
      } else if (row.pago === "TRANSFERENCIA" && row.tipoComprobante === "FACTURA" || row.pago === "TRANSFERENCIA" && row.tipoComprobante === "INTERNO") {
        transfTotal += monto;
      } else if (row.pago === "TARJETA") {
        if (row.tipoTarjeta === "CREDITO") {
          tarjetaCreditoTotal += monto;
        } else if (row.tipoTarjeta === "DEBITO") {
          tarjetaDebitoTotal += monto;
        }
      } else if (row.pago === "CHEQUE") {
        chequeTotal += monto;
      } else if (row.pago === "PARCIAL CH/FT") {
        // Para PARCIAL CH/FT, sumamos tanto en efectivo como en cheque
        efectivoTotal += parseFloat(row.parcialEfectivo || 0);
        chequeTotal += parseFloat(row.parcialCheque || 0);
      } else if (row.pago === "PARCIAL FT-TARJETA") {
        // Si el pago es "PARCIAL FT/TARJETA", sumamos el efectivo y discriminamos la tarjeta
        efectivoTotal += parseFloat(row.parcialEfectivo || 0);
        if (row.tipoTarjeta === "CREDITO") {
          tarjetaCreditoTotal += parseFloat(row.valorTarjeta || 0);
        } else if (row.tipoTarjeta === "DEBITO") {
          tarjetaDebitoTotal += parseFloat(row.valorTarjeta || 0);
        }
      } else if (row.pago === "NTC") {
        ntcTotal += monto;
      } else if (row.pago === "PARCIAL FT-TRANSFERENCIA" && row.tipoComprobante === "FACTURA" || row.tipoComprobante === "INTERNO") {
        // Si el pago es "PARCIAL FT/TRANSFERENCIA", sumamos tanto en efectivo como en transferencia
        efectivoTotal += parseFloat(row.parcialEfectivo || 0);
        transfTotal += parseFloat(row.parcialCheque || 0);
      } 
    });

return {
  efectivoTotal,
  transfTotal,
  tarjetaCreditoTotal,
  tarjetaDebitoTotal,
  chequeTotal,
  ntcTotal,
  facturadoTotal,
  internoTotal,
  retirosEfectivoTotal,   // 👈 agregado
  retirosTransferTotal    // 👈 agregado
};  };

const { 
  efectivoTotal, transfTotal, tarjetaCreditoTotal, tarjetaDebitoTotal, chequeTotal, 
  ntcTotal, facturadoTotal, internoTotal, 
  retirosEfectivoTotal, retirosTransferTotal  // 👈 incluido aquí
} = calculateTotals();

  // Función para cargar los movimientos a Firebase
const handleCargarMovimientosCierre = async (usId, totales) => {
  console.log(totales.retirosTransfer);
  const fecha = new Date();
  const fechaFormateada = fecha.toLocaleDateString('es-ES'); // Formato dd/mm/aaaa
  const fechaDoc = fechaFormateada.replace(/\//g, "-"); // Evitar / en path de Firestore

  const ruta = `users/${usId}/Movimientos/${fechaDoc}`;
  const docRef = doc(db, ruta);
  
  try {
await setDoc(docRef, {
  efectivo: totales.efectivoTotal,
  transferencias: totales.transfTotal,
  tarjetas: (totales.tarjetaCreditoTotal + totales.tarjetaDebitoTotal ),
  cheques: totales.chequeTotal,
  ntc: totales.ntcTotal,
  retiros: totales.retirosTotal,
  facturado: totales.facturadoTotal,
  interno: totales.internoTotal,
  retirosTransfer: totales.retirosTransfer
});
    console.log("Movimientos cargados correctamente a Firebase.");
  } catch (error) {
    console.error("Error al guardar movimientos:", error);
  }
};

// Función para cerrar el día
const handleCerrarDia = () => {
  const doc = new jsPDF();

  // Obtener la fecha actual en formato dd/mm/yyyy
  const fecha = new Date().toLocaleDateString('es-ES'); // Esto devuelve la fecha en formato dd/mm/yyyy

  // Agregar el título con la fecha
  doc.text(`Movimientos del ${fecha}`, 14, 20);

  // Seleccionar la tabla HTML
  const tabla = document.querySelector('table');
  
  // Obtenemos las filas de la tabla (tanto la cabecera como las filas de datos)
  const filas = Array.from(tabla.rows);

  // Filtramos las filas, eliminando la última columna en cada fila de datos
  const filasModificadas = filas.map((fila, index) => {
    // Solo eliminar la última columna de las filas de datos (no de la cabecera)
    const celdas = Array.from(fila.cells);
    if (index > 0) { // Aseguramos que no se elimine la columna de la cabecera
      celdas.pop();  // Eliminar la última columna
    }
    return celdas;
  });

  // Ahora pasamos las filas modificadas a autoTable
  doc.autoTable({
    head: [filasModificadas[0].map(celda => celda.textContent)], // Convertir las celdas del encabezado en un array de texto
    body: filasModificadas.slice(1).map(fila => fila.map(celda => celda.textContent)), // Convertir las celdas de cada fila en un array de texto
    startY: 30
  });

  // Agregar los totales al PDF
  const { efectivoTotal, transfTotal, tarjetaCreditoTotal, tarjetaDebitoTotal, chequeTotal, ntcTotal, retirosTotal,retirosTransfer, facturadoTotal, internoTotal } = calculateTotals();

  // Agregar resumen de totales
  doc.setFontSize(12);
  doc.text(`Resumen de Totales`, 14, doc.autoTable.previous.finalY + 10);
  doc.text(`Efectivo: ${efectivoTotal.toFixed(2)}`, 14, doc.autoTable.previous.finalY + 15);
  doc.text(`Transferencia: ${transfTotal.toFixed(2)}`, 14, doc.autoTable.previous.finalY + 20);
  doc.text(`Credito Tarjeta: ${tarjetaCreditoTotal.toFixed(2)}`, 14, doc.autoTable.previous.finalY + 25);
  doc.text(`Debito Tarjeta: ${tarjetaDebitoTotal.toFixed(2)}`, 14, doc.autoTable.previous.finalY + 30);
  doc.text(`Cheque: ${chequeTotal.toFixed(2)}`, 14, doc.autoTable.previous.finalY + 35);
  doc.text(`NTC: ${ntcTotal.toFixed(2)}`, 14, doc.autoTable.previous.finalY + 40);
  doc.text(`Retiros: ${retirosTotal.toFixed(2)}`, 14, doc.autoTable.previous.finalY + 45);
  doc.text(`Facturado: ${facturadoTotal.toFixed(2)}`, 14, doc.autoTable.previous.finalY + 50);
  doc.text(`Interno: ${internoTotal.toFixed(2)}`, 14, doc.autoTable.previous.finalY + 55);
  doc.text(`Retiros Transferencia: ${retirosTransfer.toFixed(2)}`, 14, doc.autoTable.previous.finalY + 60);

  // Guardar el PDF
  doc.save(fecha +'-' +'movimientos_diario.pdf');



     handleCargarMovimientosCierre(usId, {
      efectivoTotal,
      transfTotal,
      tarjetaCreditoTotal,
      tarjetaDebitoTotal,
      chequeTotal,
      ntcTotal,
      retirosTotal,
      facturadoTotal,
      internoTotal,
      retirosTransfer
    });
    
  // Mostrar el SweetAlert
  Swal.fire({
    title: '¡Éxito!',
    text: 'Se cerró el día y los datos fueron eliminados.',
    icon: 'success',
    confirmButtonText: 'Cerrar'
  });

  
  // Limpiar los datos después de un retraso
  setTimeout(() => {
    localStorage.clear(); // Limpiar el localStorage
    setClientes([]); // Limpiar los datos de la tabla
  }, 2000); // Retraso para permitir que el usuario vea el PDF
};




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
      const getRuta = (usId) => {
        return `users/${usId}/Cheques/Fisicos/Ingresos/`;
      };

      // Crear la referencia a la colección de cheques en Firestore
      const userIngresosCheque = collection(db, getRuta(usId));
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


const ordenarClientes = (campo) => {
  const asc = ordenCampo === campo ? !ordenAscendente : true;
  const clientesOrdenados = [...clientes].sort((a, b) => {
    const valA = a[campo] ?? '';
    const valB = b[campo] ?? '';

    if (!isNaN(valA) && !isNaN(valB)) {
      return asc ? valA - valB : valB - valA;
    } else {
      return asc
        ? valA.toString().localeCompare(valB.toString())
        : valB.toString().localeCompare(valA.toString());
    }
  });

  setClientes(clientesOrdenados);
  setOrdenCampo(campo);
  setOrdenAscendente(asc);
};

  return (
    <div className="container mt-5">
      <h2>Movimientos Diarios</h2>

      {/* Formulario para agregar o editar un movimiento */}
      <div className="mb-3 row">
        <div className="col-2">
          <input
            type="text"
            className="form-control"
            placeholder="Cliente/Prov."
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
          />
        </div>
        <div className="col-2">
          <input
            type="text"
            className="form-control"
            placeholder="Razón"
            value={razon}
            onChange={(e) => setRazon(e.target.value)}
          />
        </div>

          {/* Tipo de comprobante */}
  <div className="col-2">
    <select
      className="form-control"
      value={tipoComprobante}
      onChange={(e) => setTipoComprobante(e.target.value)}
    >
      <option value="">Tipo</option>
      <option value="FACTURA">FACTURA</option>
      <option value="INTERNO">INTERNO</option>
      <option value="RETIRO">RETIRO</option>
    </select>
  </div>

  {/* Subtipo de factura si aplica */}
  {tipoComprobante === "FACTURA" && (
    <div className="col-1">
      <select
        className="form-control"
        value={subtipoFactura}
        onChange={(e) => setSubtipoFactura(e.target.value)}
      >
        <option value="">A/B</option>
        <option value="A">A</option>
        <option value="B">B</option>
      </select>
    </div>
  )}

  {/* Número de comprobante */}
  {(tipoComprobante === "FACTURA" || tipoComprobante === "INTERNO") && (
    <div className="col-2">
      <input
        type="text"
        className="form-control"
        placeholder="Número"
        value={numeroComprobante}
        onChange={(e) => setNumeroComprobante(e.target.value)}
      />
    </div>
  )}

        <div className="col-2">
          <input
            type="number"
            className="form-control"
            placeholder="Monto"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
          />
        </div>
        <div className="col-2">
          <select
            className="form-control"
            value={pago}
            onChange={(e) => setPago(e.target.value)}
          >
            <option value="">Seleccionar Pago</option>
            <option value="EFECTIVO">EFECTIVO</option>
            <option value="TRANSFERENCIA">TRANSFERENCIA</option>
            <option value="TARJETA">TARJETA</option>
            <option value="CHEQUE">CHEQUE</option>
            <option value="PARCIAL CH/FT">PARCIAL CH/FT</option>
            <option value="PARCIAL FT-TARJETA">PARCIAL FT/TARJETA</option>
            <option value="PARCIAL FT-TRANSFERENCIA">PARCIAL FT/TRANSFERENCIA</option>
            <option value="NTC">NTC</option>
            <option value="RETIROS">RETIROS</option> {/* Nueva opción agregada */}
          </select>
        </div>


        {pago === "CHEQUE" && (
        <div className='infoNubes'>
            <Cheques
                title={" Cheques"}
                id="cheques"
                label="Ingresos"
                icon="+"
                value={{ fecha: '' , cliente: '', monto: '', banco: '', nroCheque: '', librador: '', cuitLibrador:'', fechaCobro:'' }} // Valor inicial del objeto
                onClick={handleGuardarCheques}
              />
          </div>
        )}

        {pago === "TARJETA" && (
          <div className="col-2">
            <select
              className="form-control"
              value={tipoTarjeta}
              onChange={(e) => setTipoTarjeta(e.target.value)}
            >
              <option value="">Seleccionar Tipo de Tarjeta</option>
              <option value="CREDITO">CREDITO</option>
              <option value="DEBITO">DEBITO</option>
            </select>
          </div>
        )}

        <div className="col-2">
          <button className="btn btn-primary w-100" onClick={handleAddOrUpdateRow}>
            {editId  !== null ? 'Actualizar Movimiento' : 'Agregar Movimiento'}
          </button>
        </div>
      </div>

      {/* Mostrar inputs adicionales si se selecciona "PARCIAL FT/CH", "PARCIAL FT/TARJETA" o "PARCIAL FT/TRANSFERENCIA" */}
      {(pago === "PARCIAL CH/FT" || pago === "PARCIAL FT-TARJETA" || pago === "PARCIAL FT-TRANSFERENCIA") && (
        <div className="mb-3 row">
          {(pago === "PARCIAL CH/FT") && (
            <div className="col-3">
              <input
                type="number"
                className="form-control"
                placeholder="PARCIAL EFECTIVO"
                value={parcialEfectivo}
                onChange={(e) => setParcialEfectivo(e.target.value)}
              />
            </div>
          )}
          {(pago === "PARCIAL CH/FT") && (
            
            <div className="col-3">
              <input
                type="number"
                className="form-control"
                placeholder="PARCIAL CHEQUE"
                value={parcialCheque}
                onChange={(e) => setParcialCheque(e.target.value)}
              />
            </div>
          )}
          {(pago === "PARCIAL CH/FT") && (
            
            <div className='infoNubes'>
            <Cheques
                title={" Cheques"}
                id="cheques"
                label="Ingresos"
                icon="+"
                value={{ fecha: '' , cliente: '', monto: '', banco: '', nroCheque: '', librador: '', cuitLibrador:'', fechaCobro:'' }} // Valor inicial del objeto
                onClick={handleGuardarCheques}
              />
          </div>
          )}
          {(pago === "PARCIAL FT-TARJETA") && (
            <>
              <div className="col-3">
                <input
                  type="number"
                  className="form-control"
                  placeholder="PARCIAL EFECTIVO"
                  value={parcialEfectivo}
                  onChange={(e) => setParcialEfectivo(e.target.value)}
                />
              </div>
              <div className="col-3">
                <select
                  className="form-control"
                  value={tipoTarjeta}
                  onChange={(e) => setTipoTarjeta(e.target.value)}
                >
                  <option value="">Seleccionar Tipo de Tarjeta</option>
                  <option value="CREDITO">CREDITO</option>
                  <option value="DEBITO">DEBITO</option>
                </select>
              </div>
              {tipoTarjeta && (
                <div className="col-3">
                  <input
                    type="number"
                    className="form-control"
                    placeholder={`Monto ${tipoTarjeta}`}
                    value={valorTarjeta}
                    onChange={(e) => setValorTarjeta(e.target.value)}
                  />
                </div>
              )}
            </>
          )}
          {(pago === "PARCIAL FT-TRANSFERENCIA") && (
            <>
              <div className="col-3">
                <input
                  type="number"
                  className="form-control"
                  placeholder="PARCIAL EFECTIVO"
                  value={parcialEfectivo}
                  onChange={(e) => setParcialEfectivo(e.target.value)}
                />
              </div>
              <div className="col-3">
                <input
                  type="number"
                  className="form-control"
                  placeholder="PARCIAL TRANSFERENCIA"
                  value={parcialCheque}
                  onChange={(e) => setParcialCheque(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Tabla de movimientos */}
<table className="table table-bordered mt-4">
<thead className="table-light">
  <tr>
    <th onClick={() => ordenarClientes('cliente')} style={{ cursor: 'pointer' }}>Cliente/Prov. ⬍</th>
    <th onClick={() => ordenarClientes('razon')} style={{ cursor: 'pointer' }}>Razón ⬍</th>
    <th onClick={() => ordenarClientes('tipoComprobante')} style={{ cursor: 'pointer' }}>Tipo ⬍</th>
    <th onClick={() => ordenarClientes('subtipoFactura')} style={{ cursor: 'pointer' }}>Subtipo ⬍</th>
    <th onClick={() => ordenarClientes('numeroComprobante')} style={{ cursor: 'pointer' }}>Número ⬍</th>
    <th onClick={() => ordenarClientes('monto')} style={{ cursor: 'pointer' }}>Monto ⬍</th>
    <th onClick={() => ordenarClientes('pago')} style={{ cursor: 'pointer' }}>Pago ⬍</th>
    <th>Acciones</th>
  </tr>
</thead>
  <tbody>
    {clientes.map((row, index) => (
      <tr key={index}>
        <td>{row.cliente}</td>
        <td>{row.razon}</td>
        <td>{row.tipoComprobante}</td>
        <td>{row.tipoComprobante === "FACTURA" ? row.subtipoFactura : "-"}</td>
        <td>{row.numeroComprobante}</td>
        <td>${parseFloat(row.monto).toFixed(2)}</td>
        <td>{row.pago +" "+ row.tipoTarjeta}</td>
        <td>
          <button className="btn btn-sm btn-warning me-2" onClick={() => handleEditRow(row)}>Editar</button>
          <button className="btn btn-sm btn-danger" onClick={() => handleDeleteRow(row.id)}>Eliminar</button>
        </td>
      </tr>
    ))}
  </tbody>
</table>

      {/* Resumen de totales */}
      <div className="mb-4 row">
        <h4>Resumen de Ingresos</h4>
        <div className="col-4">
          <p><strong>Efectivo: </strong>{efectivoTotal.toFixed(2)}</p>
          <p><strong>Transferencia: </strong>{transfTotal.toFixed(2)}</p>
        </div>
        <div className="col-4">
          <p><strong>Credito Tarjeta: </strong>{tarjetaCreditoTotal.toFixed(2)}</p>
          <p><strong>Debito Tarjeta: </strong>{tarjetaDebitoTotal.toFixed(2)}</p>
        </div>
        <div className="col-4">
          <p><strong>Cheque: </strong>{chequeTotal.toFixed(2)}</p>
          <p><strong>NTC: </strong>{ntcTotal.toFixed(2)}</p>
        </div>

      </div>
<div className="mb-4 row">
  <h4>Resumen de Egresos</h4>
  <div className="col-4">
    <p><strong>Efectivo: </strong>{retirosEfectivoTotal.toFixed(2)}</p>
  </div>
  <div className="col-4">
    <p><strong>Transferencias: </strong>{retirosTransferTotal.toFixed(2)}</p>
  </div>
</div>
      <div className="mb-4 row">
        <h4>Resumen de Diferencias</h4>
        <div className="col-4">
          <p><strong>Facturado: </strong>{facturadoTotal.toFixed(2)}</p>
        </div>
        <div className="col-4">
          <p><strong>Interno: </strong>{internoTotal.toFixed(2)}</p>
        </div>
      </div>
      {/* Botón para cerrar el día y generar el PDF */}
      <button className="btn btn-danger mb-5" onClick={handleCerrarDia}>Cerrar Día</button>
    </div>
  );
};

export default TablaMovimientos;
