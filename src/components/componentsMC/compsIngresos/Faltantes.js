import React, { useState, useEffect } from 'react';
import { db, collection, doc, setDoc, getDocs, deleteDoc } from '../../../firebaseConfig';
import { v4 as uuidv4 } from 'uuid';
import Swal from 'sweetalert2';
import ListasProvs from './ListasProvs.js'

const Faltantes = ({ userId }) => {
  const [formData, setFormData] = useState({
    codigo: '',
    cantidad: '',
    producto: '',
    cliente: '',
    contacto: '',
    categoria: 'SANITARIOS',
  });

  const [faltantesSanitarios, setFaltantesSanitarios] = useState([]);
  const [faltantesFerreteria, setFaltantesFerreteria] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editCategoria, setEditCategoria] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      Swal.fire({
        title: 'Cargando datos...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const categorias = ['SANITARIOS', 'FERRETERIA'];
      for (const cat of categorias) {
        const ref = collection(db, `users/${userId}/Faltantes de Stock/${cat}/data`);
        const snapshot = await getDocs(ref);
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (cat === 'SANITARIOS') setFaltantesSanitarios(items);
        else setFaltantesFerreteria(items);
      }

      Swal.close();
    };
    fetchData();
  }, [userId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAgregar = async () => {
    const nuevoItem = {
      codigo: formData.codigo,
      cantidad: formData.cantidad,
      producto: formData.producto,
      cliente: formData.cliente,
      contacto: formData.contacto,
    };

    const categoria = formData.categoria;

    try {
      if (editId) {
        const docRef = doc(db, `users/${userId}/Faltantes de Stock/${categoria}/data`, editId);
        await setDoc(docRef, nuevoItem);
        if (categoria === 'SANITARIOS') {
          setFaltantesSanitarios(prev => prev.map(item => item.id === editId ? { ...nuevoItem, id: editId } : item));
        } else {
          setFaltantesFerreteria(prev => prev.map(item => item.id === editId ? { ...nuevoItem, id: editId } : item));
        }
        setEditId(null);
        setEditCategoria(null);
      } else {
        const id = uuidv4();
        const docRef = doc(db, `users/${userId}/Faltantes de Stock/${categoria}/data`, id);
        await setDoc(docRef, nuevoItem);
        if (categoria === 'SANITARIOS') {
          setFaltantesSanitarios(prev => [...prev, { ...nuevoItem, id }]);
        } else {
          setFaltantesFerreteria(prev => [...prev, { ...nuevoItem, id }]);
        }
      }

      Swal.fire({
        icon: 'success',
        title: editId ? 'Actualizado con éxito' : 'Agregado con éxito',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error al guardar en Firebase:', error);
    }

    setFormData({ ...formData, codigo: '', cantidad: '', producto: '', cliente: '', contacto: '' });
  };

  const handleEditar = (item, categoria) => {
    setFormData({ ...item, categoria });
    setEditId(item.id);
    setEditCategoria(categoria);
  };

  const handleEliminar = async (id, categoria) => {
    try {
      await deleteDoc(doc(db, `users/${userId}/Faltantes de Stock/${categoria}/data`, id));
      if (categoria === 'SANITARIOS') {
        setFaltantesSanitarios(prev => prev.filter(item => item.id !== id));
      } else {
        setFaltantesFerreteria(prev => prev.filter(item => item.id !== id));
      }
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

  const handleLimpiarTabla = async (categoria) => {
    const ref = collection(db, `users/${userId}/Faltantes de Stock/${categoria}/data`);
    const snapshot = await getDocs(ref);
    const deletions = snapshot.docs.map((docItem) => deleteDoc(docItem.ref));
    await Promise.all(deletions);

    if (categoria === 'SANITARIOS') setFaltantesSanitarios([]);
    else setFaltantesFerreteria([]);

    Swal.fire({
      icon: 'success',
      title: 'Tabla limpiada con éxito',
      timer: 1500,
      showConfirmButton: false
    });
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Gestión de Faltantes</h2>

      <div className="row g-2 align-items-end">
        {['codigo', 'cantidad', 'producto', 'cliente', 'contacto'].map((field, idx) => (
          <div className="col-md-2" key={idx}>
            <input
              type={field === 'cantidad' ? 'number' : 'text'}
              className="form-control"
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              name={field}
              value={formData[field]}
              onChange={handleInputChange}
            />
          </div>
        ))}
        <div className="col-md-2">
          <select
            className="form-select"
            name="categoria"
            value={formData.categoria}
            onChange={handleInputChange}
          >
            <option value="SANITARIOS">Sanitarios</option>
            <option value="FERRETERIA">Ferretería</option>
          </select>
        </div>
        <div className="col-md-2 mt-2">
          <button className="btn btn-primary w-100" onClick={handleAgregar}>
            {editId ? 'Actualizar' : 'Agregar'}
          </button>
        </div>
      </div>

      <div className="row mt-5">
        {[{ titulo: 'Faltantes Sanitarios', data: faltantesSanitarios, categoria: 'SANITARIOS' },
          { titulo: 'Faltantes Ferretería', data: faltantesFerreteria, categoria: 'FERRETERIA' }].map((tabla, idx) => (
          <div className="col-md-6" key={idx}>
            <h5 className="text-center">{tabla.titulo}</h5>
            <table className="table table-bordered table-striped mt-2">
              <thead className="table-light">
                <tr>
                  <th>Código</th>
                  <th>Cantidad</th>
                  <th>Producto</th>
                  <th>Cliente</th>
                  <th>Contacto</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tabla.data.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted">Sin registros</td>
                  </tr>
                ) : (
                  tabla.data.map((item) => (
                    <tr key={item.id}>
                      <td>{item.codigo}</td>
                      <td>{item.cantidad}</td>
                      <td>{item.producto}</td>
                      <td>{item.cliente}</td>
                      <td>{item.contacto}</td>
                      <td>
                        <button className="btn btn-sm btn-warning me-2" onClick={() => handleEditar(item, tabla.categoria)}>Editar</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleEliminar(item.id, tabla.categoria)}>Eliminar</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="text-center mb-3">
              <button className="btn btn-danger" onClick={() => handleLimpiarTabla(tabla.categoria)}>
                Limpiar Tabla
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default Faltantes;