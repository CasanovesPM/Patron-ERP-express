import React, { useState, useEffect } from "react";
import Swal from 'sweetalert2';
import { Trash, PencilSquare } from 'react-bootstrap-icons';
import { doc, setDoc, getDocs, getDoc, collection, deleteDoc, updateDoc, db } from '../../firebaseConfig';

const Proveedores = ({ nivel, userId }) => {
  const [nivels, setNivel] = useState(nivel.toString());
  const [proveedores, setProveedores] = useState([]);
  const [selectedProveedor, setSelectedProveedor] = useState(null);
  const [selectedNameProveedor, setSelectedNameProveedor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompra, setSelectedCompra] = useState(null);
  const [ranking, setRanking] = useState([]);

  const [form, setForm] = useState({
    nombre: '',
    cuit: '',
    email: '',
    cp: '',
    direccion: '',
    localidad: ''
  });
  
  
const [rankingPendientes, setRankingPendientes] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [showComprasModal, setShowComprasModal] = useState(false);
  const [showAgregarComprasModal, setShowAgregarComprasModal] = useState(false);
  const [compras, setCompras] = useState([]);
const [nuevaCompra, setNuevaCompra] = useState({
  razon: '',
  monto: '',
  estado: 'Pendiente',
  fecha: (() => {
    const fecha = new Date();
    return `${String(fecha.getDate()).padStart(2, '0')}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${fecha.getFullYear()}`;
  })()
});
useEffect(() => {
  if (nivels === '0') {
    fetchProveedores();
    fetchProveedoresRanking();
    fetchRankingPendientes();
  }
}, [nivels]);

  const fetchProveedores = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, `users/${userId}/Proveedores`));
      const proveedoresList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProveedores(proveedoresList);
    } catch (error) {
      console.error("Error al obtener proveedores:", error);
    }
  };

  const fetchProveedoresRanking = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, `users/${userId}/Proveedores`));
      const proveedoresList = [];
      
      // Obtener el mes y el año actuales
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; // Mes actual (0-11)
      const currentYear = currentDate.getFullYear(); // Año actual
  
      for (const doc of querySnapshot.docs) {
        const proveedorData = { id: doc.id, ...doc.data() };
        const comprasSnapshot = await getDocs(collection(db, `users/${userId}/Proveedores/${doc.id}/Compras`));
        let totalCompras = 0;
        comprasSnapshot.docs.forEach(compraDoc => {
          const compraData = compraDoc.data();

          const fechaCompraParts = compraData.fecha.split('-'); // Divide la fecha en partes
          const dia = parseInt(fechaCompraParts[0], 10); // Día
          const mes = parseInt(fechaCompraParts[1], 10); // Mes (0-11)
          const anio = parseInt(fechaCompraParts[2], 10); // Año

          const fechaCompra = new Date();
          fechaCompra.setHours(0, 0, 0, 0); // Establece la hora a las 00:00:00.000 para que solo tenga la fecha


          // Verificar si la compra es del mes y año actuales
          if (fechaCompra.getMonth() === (mes - 1) && fechaCompra.getFullYear() === currentYear) {
            const monto = compraData.monto;
            totalCompras += Number(monto);
          }
        });
  
        proveedoresList.push({ proveedor: proveedorData.nombre, total: totalCompras });
      }
  
      proveedoresList.sort((a, b) => b.total - a.total);
      setRanking(proveedoresList);
    } catch (error) {
      console.error("Error al obtener proveedores:", error);
    }
  };
  

  

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setForm({ ...form, [id]: value });
  };

  const handleAddProveedor = async () => {
    if (!form.nombre || !form.email || !form.cuit) {
      Swal.fire('Por favor, completa todos los campos obligatorios.', '', 'error');
      return;
    }
  
    try {
      const docRef = doc(db, `users/${userId}/Proveedores/${form.cuit}`);
      const docSnap = await getDoc(docRef);
  
      if (docSnap.exists()) {
        Swal.fire('Proveedor Existente', '', 'warning');
        return;
      }
  
      await setDoc(docRef, { ...form });
  
      Swal.fire('Proveedor agregado con éxito', '', 'success');
      fetchProveedores();
      setForm({
        nombre: '',
        cuit: '',
        email: '',
        cp: '',
        direccion: '',
        localidad: ''
      });
      fetchProveedoresRanking();

      setShowModal(false);
    } catch (error) {
      console.error("Error al agregar proveedor:", error);
      Swal.fire('Error al agregar el proveedor', '', 'error');
    }
  };

  const handleDeleteProveedor = async (id) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás revertir esto',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'No, cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteDoc(doc(db, `users/${userId}/Proveedores/`, id));
          Swal.fire('Eliminado', 'El proveedor ha sido eliminado', 'success');
          fetchProveedores();
        } catch (error) {
          console.error("Error al eliminar proveedor:", error);
          Swal.fire('Error al eliminar el proveedor', '', 'error');
        }
      }
    });
  };

  const handleEditProveedor = (proveedor) => {
    setSelectedProveedor(proveedor);
    setForm(proveedor);
    setShowModal(true);
  };

  const handleUpdateProveedor = async () => {
    if (!selectedProveedor) return;

    try {
      const proveedorRef = doc(db, `users/${userId}/Proveedores`, selectedProveedor.id);
      await updateDoc(proveedorRef, { ...form });
      Swal.fire('Proveedor actualizado con éxito', '', 'success');
      fetchProveedores();
      setSelectedProveedor(null);
      setForm({
        nombre: '',
        cuit: '',
        email: '',
        cp: '',
        direccion: '',
        localidad: ''
      });
      setShowModal(false);
    } catch (error) {
      console.error("Error al actualizar proveedor:", error);
      Swal.fire('Error al actualizar el proveedor', '', 'error');
    }
  };




  const handleFetchCompras = async (proveedorId) => {
    try {
      const querySnapshot = await getDocs(collection(db, `users/${userId}/Proveedores/${proveedorId}/Compras`));
      const queryName = await getDoc(doc(db, `users/${userId}/Proveedores/${proveedorId}`));

      if (queryName.exists()) {
          const nombre = queryName.data().nombre; // Obtiene solo el campo 'nombre'
          setSelectedNameProveedor(nombre);
      } else {
          console.log("Documento no encontrado");
      }
      const comprasList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCompras(comprasList);
      setSelectedProveedor(proveedorId);
      setShowComprasModal(true);
    } catch (error) {
      console.error("Error al obtener compras:", error);
    }
  };

const handleAgregarCompra = async () => {
  if (!nuevaCompra.razon || !nuevaCompra.monto || !nuevaCompra.fecha || !nuevaCompra.estado) {
    Swal.fire('Por favor, completa todos los campos obligatorios.', '', 'error');
    return;
  }

  try {
    if (selectedCompra) {
      const compraRef = doc(db, `users/${userId}/Proveedores/${selectedProveedor}/Compras/${selectedCompra.id}`);
      await updateDoc(compraRef, nuevaCompra);
      Swal.fire('Compra actualizada con éxito', '', 'success');
    } else {
      const docRef = doc(collection(db, `users/${userId}/Proveedores/${selectedProveedor}/Compras`));
      await setDoc(docRef, nuevaCompra);
      Swal.fire('Compra agregada con éxito', '', 'success');
    }

    // Resetear modal y recargar datos
    setNuevaCompra({
      razon: '',
      monto: '',
      estado: 'Pendiente',
      fecha: (() => {
        const fecha = new Date();
        return `${String(fecha.getDate()).padStart(2, '0')}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${fecha.getFullYear()}`;
      })()
    });
    setSelectedCompra(null);
    setShowAgregarComprasModal(false);
    handleFetchCompras(selectedProveedor);
    fetchProveedoresRanking();
    fetchRankingPendientes();
  } catch (error) {
    console.error("Error al agregar/actualizar compra:", error);
    Swal.fire('Error al agregar/actualizar la compra', '', 'error');
  }
};


  const handleDeleteCompra = async (id) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás revertir esto',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'No, cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteDoc(doc(db, `users/${userId}/Proveedores/${selectedProveedor}/Compras`, id));
          Swal.fire('Eliminado', 'La compra ha sido eliminada', 'success');
          handleFetchCompras(selectedProveedor);
        } catch (error) {
          console.error("Error al eliminar compra:", error);
          Swal.fire('Error al eliminar la compra', '', 'error');
        }
      }
    });
  };
  
  const handleEditCompra = (compra) => {
    setSelectedCompra(compra);
    setNuevaCompra({
      razon: compra.razon,
      monto: compra.monto,
      fecha: compra.fecha,
      estado: compra.estado || 'Pendiente' // Asegura que siempre haya un estado
    });
    setShowAgregarComprasModal(true);
  };
  

  const filteredProveedores = proveedores.filter(proveedor =>
    proveedor.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchRankingPendientes = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, `users/${userId}/Proveedores`));
    const pendientes = [];

    for (const docProv of querySnapshot.docs) {
      const proveedorData = { id: docProv.id, ...docProv.data() };
      const comprasSnapshot = await getDocs(collection(db, `users/${userId}/Proveedores/${docProv.id}/Compras`));

      comprasSnapshot.docs.forEach(compraDoc => {
        const compraData = compraDoc.data();
        if (compraData.estado === 'Pendiente') {
          pendientes.push({ proveedor: proveedorData.nombre, razon: compraData.razon, monto: Number(compraData.monto) });
        }
      });
    }

    setRankingPendientes(pendientes);
  } catch (error) {
    console.error("Error al obtener ranking pendientes:", error);
  }
};




  return (
    <>
      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <h2>Proveedores</h2>
      </div>
      <div className="container-fluid-prov">
        <div className="listProv">
          <h3>Listado de Proveedores</h3>

          <div className="provList">
            <div className="d-flex justify-content-center mb-3">
              <input
                type="text"
                className="form-control w-80"
                placeholder="Buscar Proveedor"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="btn btn-primary" onClick={() => {
                  setForm({
                    nombre: '',
                    cuit: '',
                    email: '',
                    cp: '',
                    direccion: '',
                    localidad: ''
                  });
                  setSelectedProveedor(null);  // Asegúrate de limpiar el proveedor seleccionado
                  setShowModal(true);
                }}>
                Agregar
              </button>
            </div>
            <div>
              <h4>Lista de Proveedores</h4>
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th scope="col">Nombre</th>
                    <th scope="col" className="d-none d-md-table-cell">CUIT</th>
                    <th scope="col" className="d-none d-md-table-cell">Email</th>
                    <th scope="col">Acciones</th>
                    <th scope="col">Compras</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProveedores.map((proveedor) => (
                    <tr key={proveedor.id}>
                      <td>{proveedor.nombre}</td>
                      <td className="d-none d-md-table-cell">{proveedor.cuit}</td>
                      <td className="d-none d-md-table-cell">{proveedor.email}</td>
                      <td>
                        <button className="btn btn-success btn-sm me-1" onClick={() => handleEditProveedor(proveedor)}>
                          <PencilSquare />
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteProveedor(proveedor.id)}>
                          <Trash />
                        </button>
                      </td>
                      <td>
                        <button className="btn btn-warning btn-sm me-1" onClick={() => handleFetchCompras(proveedor.id)}>
                          Compras
                        </button>
                        <button className="btn btn-success btn-sm" onClick={() => { setSelectedProveedor(proveedor); setShowAgregarComprasModal(true); }}>
                          Add
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div className="container-fluid-prov">
           <div className="row rankProv">
                <h3>Ranking Mensual</h3>
                <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>Proveedor</th>
                          <th>Compras</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ranking.map((item, index) => (
                          <tr key={index}>
                            <td>{item.proveedor}</td>
                            <td>{Number(item.total).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
          <div className="row rankProv">
                      <h3>Pendientes de Pago</h3>
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Proveedor</th>
                        <th>Razón</th>
                        <th>Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankingPendientes.map((item, index) => (
                        <tr key={index}>
                          <td>{item.proveedor}</td>
                          <td>{item.razon}</td>
                          <td>{Number(item.monto).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan="2"><strong>Total</strong></td>
                        <td><strong>{Number(rankingPendientes.reduce((acc, item) => acc + item.monto, 0)).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</strong></td>
                      </tr>
                    </tbody>
                  </table>
          </div>

      </div>



      {/* Modal para agregar/editar proveedor */}
      {showModal && (
        <div className="modal show" tabIndex="-1" style={{ display: 'block' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{selectedProveedor ? 'Editar Proveedor' : 'Agregar Proveedor'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="nombre" className="form-label">Nombre</label>
                  <input type="text" id="nombre" className="form-control" value={form.nombre} onChange={handleInputChange} />
                </div>
                <div className="mb-3">
                  <label htmlFor="cuit" className="form-label">CUIT</label>
                  <input type="text" id="cuit" className="form-control" value={form.cuit} onChange={handleInputChange} />
                </div>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input type="email" id="email" className="form-control" value={form.email} onChange={handleInputChange} />
                </div>
                <div className="mb-3">
                  <label htmlFor="cp" className="form-label">Código Postal</label>
                  <input type="text" id="cp" className="form-control" value={form.cp} onChange={handleInputChange} />
                </div>
                <div className="mb-3">
                  <label htmlFor="direccion" className="form-label">Dirección</label>
                  <input type="text" id="direccion" className="form-control" value={form.direccion} onChange={handleInputChange} />
                </div>
                <div className="mb-3">
                  <label htmlFor="localidad" className="form-label">Localidad</label>
                  <input type="text" id="localidad" className="form-control" value={form.localidad} onChange={handleInputChange} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cerrar</button>
                <button type="button" className="btn btn-primary" onClick={selectedProveedor ? handleUpdateProveedor : handleAddProveedor}>
                  {selectedProveedor ? 'Actualizar Proveedor' : 'Agregar Proveedor'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver compras */}
      {showComprasModal && (
        <div className="modal show" tabIndex="-1" style={{ display: 'block' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Compras de {selectedNameProveedor}</h5>
                <button type="button" className="btn-close" onClick={() => setShowComprasModal(false)}></button>
              </div>
              <div className="modal-body">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th scope="col">Fecha</th>
                      <th scope="col">Razón</th>
                      <th scope="col">Monto</th>
                      <th scope="col">Estado</th>
                      <th scope="col">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compras.map(compra => (
                    <tr key={compra.id} style={{ backgroundColor: compra.estado === 'Pagado' ? '#d4edda' : '#f8d7da' }}>
                      <td>{compra.fecha}</td>
                      <td>{compra.razon}</td>
                      <td>{(Number(compra.monto)).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</td>
                      <td><strong>{compra.estado || 'Pendiente'}</strong></td>
                      <td>
                        <button className="btn btn-success btn-sm me-1" onClick={() => handleEditCompra(compra)}>
                          <PencilSquare />
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCompra(compra.id)}>
                          <Trash />
                        </button>
                      </td>
                    </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowComprasModal(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal para agregar compras */}
{showAgregarComprasModal && (
  <div className="modal show" tabIndex="-1" style={{ display: 'block' }}>
    <div className="modal-dialog">
      <div className="modal-content">
        <div className="modal-header">
        <h5 className="modal-title">{selectedCompra ? 'Editar Compra' : 'Agregar Compra'}</h5>
          <button type="button" className="btn-close" onClick={() => setShowAgregarComprasModal(false)}></button>
        </div>
        <div className="modal-body">
          <div className="mb-3">
            <label htmlFor="razon" className="form-label">Razón</label>
            <input type="text" id="razon" className="form-control" value={nuevaCompra.razon} onChange={(e) => setNuevaCompra({ ...nuevaCompra, razon: e.target.value })} />
          </div>
          <div className="mb-3">
            <label htmlFor="monto" className="form-label">Monto</label>
            <input type="number" id="monto" className="form-control" value={nuevaCompra.monto} onChange={(e) => setNuevaCompra({ ...nuevaCompra, monto: e.target.value })} />
          </div>
          <div className="mb-3">
            <label htmlFor="fecha" className="form-label">Fecha</label>
            <input type="text" id="fecha" className="form-control" value={nuevaCompra.fecha} onChange={(e) => setNuevaCompra({ ...nuevaCompra, fecha: e.target.value })} />
          </div>
          <div className="mb-3">
            <label htmlFor="estado" className="form-label">Estado</label>
            <select id="estado" className="form-control" value={nuevaCompra.estado} onChange={(e) => setNuevaCompra({ ...nuevaCompra, estado: e.target.value })}>
              <option value="Pendiente">Pendiente</option>
              <option value="Pagado">Pagado</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => setShowAgregarComprasModal(false)}>Cerrar</button>
          <button type="button" className="btn btn-primary" onClick={handleAgregarCompra}>
            {selectedCompra ? 'Actualizar Compra' : 'Agregar Compra'}
          </button>  
        </div>
      </div>
    </div>
  </div>
)}
    </>
  );
};

export default Proveedores;
