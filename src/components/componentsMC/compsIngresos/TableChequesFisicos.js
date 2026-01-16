import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, query, where, doc, setDoc, getDoc, updateDoc  } from '../../../firebaseConfig';  // Asegúrate de importar correctamente Firebase
import Swal from 'sweetalert2';

const TableChequesFisicos = ({ userId }) => {
  const [data, setData] = useState([]);
  const [statusFilter, setStatusFilter] = useState('EN CARTERA');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [inputValues, setInputValues] = useState({});

  useEffect(() => {
    const fetchChequesData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Obtener los cheques desde la subcolección de Firestore
        const chequesRef = collection(db, `users/${userId}/Cheques/Fisicos/Ingresos`);
        const querySnapshot = await getDocs(chequesRef); // Obtener los documentos de la subcolección
  
        const cheques = [];
        querySnapshot.forEach((doc) => {
          cheques.push({ ...doc.data(), id: doc.id }); // Almacenar los datos de cada cheque
        });
  
        // Ordenar cheques por fecha de cobro
        cheques.sort((a, b) => {
          const dateA = new Date(a.fechacobro);
          const dateB = new Date(b.fechacobro);
          return dateA - dateB;
        });
  
        setData(cheques); // Guardar los cheques en el estado
      } catch (error) {
        setError(error); // Si ocurre un error, guardarlo en el estado
        console.error('Error al obtener los datos de cheques:', error);
      } finally {
        setLoading(false); // Terminar el loading
      }
    };
  
    if (userId) {
      fetchChequesData(); // Ejecutar la función cuando se tiene un userId
    }
  }, [userId]);

  const handleEstadoChange = async (id, newStatus) => {
    // Actualizamos el estado localmente para reflejar el cambio en la UI
    const updatedData = data.map((item) => (item.id === id ? { ...item, estado: newStatus } : item));
    setData(updatedData);
  
    try {
      // Referencia al documento del cheque en Firestore
      const chequesRef = doc(db, `users/${userId}/Cheques/Fisicos/Ingresos`, id);
      
      // Preparamos los cambios que vamos a hacer en el documento
      const updates = { estado: newStatus };
  
      // Actualizamos el documento con el nuevo estado
      await updateDoc(chequesRef, updates);
  
      // Si el cheque se actualiza correctamente, se muestra un mensaje de éxito (opcional)
      Swal.fire({
        title: 'Estado actualizado',
        text: 'El estado del cheque se ha actualizado correctamente.',
        icon: 'success',
        confirmButtonText: 'Aceptar',
      });
    } catch (error) {
      // Si ocurre un error, mostramos un mensaje de error
      console.error('Error al actualizar el estado en la base de datos:', error);
      Swal.fire({
        title: 'Error',
        text: 'Hubo un problema al actualizar el estado del cheque.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
    }
  };
  const handleEntregadoChange = async (id) => {
    const newEntregado = inputValues[id] || ''; // Obtener el nuevo valor de "entrega" desde el input
    const updatedData = data.map((item) => (item.id === id ? { ...item, entrega: newEntregado } : item)); 
    setData(updatedData); // Actualizar el estado local para reflejar el cambio en la UI
  
    try {
      // Referencia al documento del cheque en Firestore
      const chequesRef = doc(db, `users/${userId}/Cheques/Fisicos/Ingresos`, id);
      
      // Preparamos los cambios que vamos a hacer en el documento
      const updates = { entrega: newEntregado };
  
      // Actualizamos el documento con el nuevo estado de entrega
      await updateDoc(chequesRef, updates);
  
      // Si el cheque se actualiza correctamente, mostramos un mensaje de éxito
      Swal.fire({
        title: 'Modificación Exitosa!',
        text: 'Cheque Modificado con Exito.',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });
    } catch (error) {
      // Si ocurre un error, mostramos un mensaje de error
      console.error('Error al actualizar el entregado en la base de datos:', error);
      Swal.fire({
        title: 'Error',
        text: 'Hubo un problema al actualizar la entrega del cheque.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  const handleInputChange = (id, value) => {
    setInputValues({ ...inputValues, [id]: value });
  };

  const handleStatusChange = (event) => {
    setStatusFilter(event.target.value);
  };

  const filteredData = data.filter(
    (item) =>
      (statusFilter === '' || item.estado === statusFilter) &&
      (item.nrocheque.toString().includes(searchTerm) ||
        item.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.banco.toString().includes(searchTerm) ||
        item.fechacobro.includes(searchTerm) ||
        item.monto.toString().includes(searchTerm) ||
        item.librador.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.cuitlibrador.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <p>Cargando datos...</p>;
  if (error) return <p>Error al cargar los datos: {error.message}</p>;

  return (
    <div className='p-5'>
        <h2>CARTERA DE CHEQUES EN CUSTODIA FISICA</h2>
      <div className="mb-3">
        <input
          type="text"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-control mb-3"
        />

        <select className="form-select me-2" onChange={handleStatusChange} value={statusFilter}>
          <option value="">Filtrar por Estado</option>
          <option value="EN CARTERA">EN CARTERA</option>
          <option value="ENTREGADO">ENTREGADO</option>
        </select>
      </div>

      <table className="table table-striped table-bordered table-hover">
        <thead>
          <tr>
            <th className="d-none d-md-table-cell">Fecha</th>
            <th>Cliente</th>
            <th>Monto</th>
            <th className="d-none d-md-table-cell">Banco</th>
            <th>Nro Cheque</th>
            <th className="d-none d-md-table-cell">Librador</th>
            <th className="d-none d-md-table-cell">Cuit Librador</th>
            <th>Fecha de Cobro</th>
            <th>Estado</th>
            <th>Entrega</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((item) => (
            <tr key={item.id}>
              <td className="d-none d-md-table-cell">{item.fecha}</td>
              <td>{item.cliente}</td>
              <td>{Number(item.monto).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</td>
              <td className="d-none d-md-table-cell">{item.banco}</td>
              <td>{item.nrocheque}</td>
              <td className="d-none d-md-table-cell">{item.librador}</td>
              <td className="d-none d-md-table-cell">{item.cuitlibrador}</td>
              <td>{item.fechacobro}</td>
              <td>
                <select
                  className="form-select"
                  value={item.estado}
                  onChange={(e) => handleEstadoChange(item.id, e.target.value)}
                >
                  <option value="EN CARTERA">EN CARTERA</option>
                  <option value="ENTREGADO">ENTREGADO</option>
                </select>
              </td>
              <td>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nombre a quien se entregó"
                    value={inputValues[item.id] || item.entrega || ''}
                    onChange={(e) => handleInputChange(item.id, e.target.value)}
                  />
                  <button
                    className="btn btn-success"
                    onClick={() => handleEntregadoChange(item.id)}
                  >
                    Guardar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableChequesFisicos;
