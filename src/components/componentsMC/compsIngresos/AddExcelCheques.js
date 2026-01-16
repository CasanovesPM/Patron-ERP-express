import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import Modal from 'react-modal';
import { format, parse, addDays } from 'date-fns';
import Swal from 'sweetalert2';
import { db, collection, doc, setDoc, getDoc, updateDoc } from '../../../firebaseConfig';
import { AlignCenter } from 'react-bootstrap-icons';

const AddExcelCheques = ({ userId }) => {
  const [data, setData] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showGaliciaInput, setShowGaliciaInput] = useState(false);
  const fileInputRef = useRef(null);
  const fecha = format(new Date(), 'dd-MM-yyyy');

  const [showMacroInput, setShowMacroInput] = useState(false);
  const [showBBVAInput, setShowBBVAInput] = useState(false);
  
  // Asume que tienes el userId y fecha definidos en tu contexto o props
  const handleToggleGalicia = () => {
    setShowGaliciaInput(!showGaliciaInput);
    setShowBBVAInput(false);
    setShowMacroInput(false);

  };

  const handleToggleMacro = () => {
    setShowMacroInput(!showMacroInput);
    setShowBBVAInput(false);
    setShowGaliciaInput(false);
  };

  const handleToggleBBVA = () => {
    setShowBBVAInput(!showBBVAInput);
    setShowMacroInput(false);
    setShowGaliciaInput(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      if (typeof dateString === 'number') {
        const excelDate = new Date((dateString - (25567 + 2)) * 86400 * 1000);
        return format(excelDate, 'dd/MM/yyyy');
      }
      const [datePart] = dateString.split(' ');
      const [day, month, year] = datePart.split('/');
      if (day && month && year) {
        const parsedDate = new Date(year, month - 1, day);
        return format(parsedDate, 'dd/MM/yyyy');
      }
    } catch (error) {
      console.error('Error formateando la fecha:', error);
      return 'Fecha inválida';
    }
    return 'Fecha inválida';
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const binaryStr = event.target.result;
      const workbook = XLSX.read(binaryStr, { type: 'binary' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const filteredData = jsonData.slice(2).map(row => ({
        fechaEmision: formatDate(row[5]),
        numeroCheque: row[0],
        cuitCuilCdi: row[3],
        importe: row[6],
        emitidoA: row[1],
        fechaPago: formatDate(row[4]),
        motivo: row[12],
        descripcion: row[12],
        estado: row[7],
      }));

      setData(filteredData);
      setIsOpen(true);
    };
    reader.readAsBinaryString(file);
  };

  const closeModal = () => {
    setIsOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGuardarECheques = async () => {
    Swal.fire({
      title: 'Cargando...',
      text: 'Por favor espere mientras se cargan los datos.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  
    try {
      for (const valores of data) {
        const nroCheque = parseInt(valores.numeroCheque, 10).toString();
        const chequeRef = doc(db, `users/${userId}/Cheques/Electronicos/Egresos`, nroCheque);
        const docSnap = await getDoc(chequeRef);
  
        const fechaPagoOriginal = parse(valores.fechaPago, 'dd/MM/yyyy', new Date());
        const fechaPagoNueva = addDays(fechaPagoOriginal, 1);
        const fechaPagoFormateada = format(fechaPagoNueva, 'dd-MM-yyyy');
  
        // Datos a actualizar o insertar
        const chequeData = {
          fecha: format(parse(valores.fechaEmision, 'dd/MM/yyyy', new Date()), 'dd-MM-yyyy'),
          numero: nroCheque,
          cuit: valores.cuitCuilCdi,
          proveedor: valores.emitidoA,
          monto: valores.importe,
          fechaPago: fechaPagoFormateada,
          motivo: valores.motivo,
          descripcion: valores.descripcion,
          estado: valores.estado,
        };
  
        // Si el documento ya existe, actualiza los datos, si no, lo crea
        if (docSnap.exists()) {
          await updateDoc(chequeRef, chequeData); // Actualiza el documento
        } else {
          await setDoc(chequeRef, chequeData); // Crea un nuevo documento
        }
      }
  
      Swal.fire({
        title: 'Carga Exitosa',
        text: 'Los datos se han cargado correctamente.',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      }).then(() => {
        closeModal();
      });
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'Hubo un problema al guardar los datos.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      console.error('Error al guardar los e-cheques:', error);
    }
  };
  

  return (
    <div className="infoNubeHorizontal p-3">
      <button className="inputCheques btnCheques m-2" onClick={handleToggleGalicia}>GALICIA</button>
      <button className="inputCheques btnCheques m-2" onClick={handleToggleMacro}>
          {"MACRO"}
        </button>
        <button className="inputCheques btnCheques m-2" onClick={handleToggleBBVA}>
          {"BBVA FRANCES"}
        </button> 

      {showGaliciaInput && (
        <div style={{ textAlign: "center" }}>
          <h3>FORMATO BANCO GALICIA</h3>
          <div className="d-flex justify-content-center">
          <input 
            type="file" 
            className="form-control w-50 text-center mx-auto" 
            accept=".xlsx, .xls" 
            onChange={handleFileUpload} 
            ref={fileInputRef} 
          />
        </div>



          <Modal isOpen={isOpen} onRequestClose={closeModal}>
            <h2 className="mb-4">E-Cheques Cargados</h2>
            <button className="btn btn-primary mb-4" onClick={closeModal}>Cerrar</button>
            <table className="table table-striped table-bordered text-center">
              <thead className="table-dark">
                <tr>
                  <th>Fecha Emisión</th>
                  <th>Nº Cheque</th>
                  <th>CUIT</th>
                  <th>Importe</th>
                  <th>Emitido a</th>
                  <th>Fecha Pago</th>
                  <th>Motivo</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={index}>
                    <td>{row.fechaEmision}</td>
                    <td>{row.numeroCheque}</td>
                    <td>{row.cuitCuilCdi}</td>
                    <td>{row.importe}</td>
                    <td>{row.emitidoA}</td>
                    <td>{row.fechaPago}</td>
                    <td>{row.motivo}</td>
                    <td>{row.descripcion}</td>
                    <td>{row.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="d-flex justify-content-center">
              <button className="btn btn-success mt-3" onClick={handleGuardarECheques}>Cargar al Sistema</button>
             </div>   
          </Modal>
        </div>
      )}

      {showMacroInput &&
              <div>
                <h3>FORMATO BANCO MACRO</h3>
                {/* Implementa la lógica para el formato de Banco Macro aquí */}
              </div>
            }
            {showBBVAInput &&
              <div>
                <h3>FORMATO BANCO BBVA FRANCES</h3>
                {/* Implementa la lógica para el formato de Banco BBVA aquí */}
              </div>
            }

    </div>
  );
};

export default AddExcelCheques;