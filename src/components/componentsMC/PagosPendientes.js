import { useState, useEffect } from "react";
import { db, doc, setDoc, getDocs, collection, updateDoc, deleteDoc } from '../../firebaseConfig';
import Swal from 'sweetalert2';

const PagosPendientes = ({ userId }) => {
  const [pagos, setPagos] = useState([]);
  const [orden, setOrden] = useState({ campo: '', asc: true });
  const [editandoId, setEditandoId] = useState(null);

  const formatDateForInput = (fecha) => {
    if (fecha.includes('/')) {
      const [dd, mm, yyyy] = fecha.split('/');
      return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }
    return fecha;
  };

  const [nuevo, setNuevo] = useState({
    fecha: '',
    nombre: '',
    monto: '',
    tipo: 'Factura',
    numero: '',
    estado: 'Pendiente'
  });

  const fetchPagos = async () => {
    try {
      const ref = collection(db, 'users', userId, 'PagoPendiente');
      const snapshot = await getDocs(ref);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data().data
      }));
      setPagos(data);
    } catch (error) {
      console.error("Error al obtener pagos pendientes:", error);
    }
  };

  useEffect(() => {
    fetchPagos();
  }, [userId]);

  const guardarPago = async (e) => {
    e.preventDefault();
    const { fecha, nombre } = nuevo;
    if (!fecha || !nombre) return Swal.fire('Error', 'La fecha y el nombre son obligatorios', 'error');

    const id = `${fecha.trim()} - ${nombre.trim()}`;
    const docRef = doc(db, 'users', userId, 'PagoPendiente', id);

    try {
      await setDoc(docRef, {
        data: {
          ...nuevo,
          monto: Number(nuevo.monto)
        }
      });
      Swal.fire('Guardado', `Pago pendiente "${id}" guardado.`, 'success');
      setNuevo({
        fecha: '',
        nombre: '',
        monto: '',
        tipo: 'Factura',
        numero: '',
        estado: 'Pendiente'
      });
      setEditandoId(null);
      fetchPagos();
    } catch (error) {
      console.error("Error al guardar pago:", error);
    }
  };

  const alternarEstado = async (p) => {
    const id = `${p.fecha} - ${p.nombre}`;
    const nuevoEstado = p.estado === 'Pagado' ? 'Pendiente' : 'Pagado';
    const ref = doc(db, 'users', userId, 'PagoPendiente', id);

    try {
      await updateDoc(ref, {
        'data.estado': nuevoEstado
      });
      fetchPagos();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    }
  };

  const editarPago = (p) => {
    setNuevo({ ...p });
    setEditandoId(`${p.fecha} - ${p.nombre}`);
  };

  const eliminarPago = async (p) => {
    const id = `${p.fecha} - ${p.nombre}`;
    const ref = doc(db, 'users', userId, 'PagoPendiente', id);

    const confirm = await Swal.fire({
      title: '¿Eliminar?',
      text: `¿Seguro que querés eliminar el pago "${id}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
    });

    if (confirm.isConfirmed) {
      try {
        await deleteDoc(ref);
        Swal.fire('Eliminado', 'Pago eliminado.', 'success');
        fetchPagos();
      } catch (error) {
        console.error("Error al eliminar pago:", error);
        Swal.fire('Error', 'No se pudo eliminar el pago.', 'error');
      }
    }
  };

  const ordenarPor = (campo) => {
    const asc = orden.campo === campo ? !orden.asc : true;
    const sorted = [...pagos].sort((a, b) => {
      if (typeof a[campo] === 'number') {
        return asc ? a[campo] - b[campo] : b[campo] - a[campo];
      }
      return asc
        ? (a[campo] || '').localeCompare(b[campo] || '')
        : (b[campo] || '').localeCompare(a[campo] || '');
    });
    setPagos(sorted);
    setOrden({ campo, asc });
  };

  return (
    <div className="container mt-4">
      <h2>Pagos Pendientes</h2>
      <form onSubmit={guardarPago} className="mb-4">
        <div className="row g-2">
          <div className="col-md-2">
            <input
              type="date"
              className="form-control"
              value={nuevo.fecha ? formatDateForInput(nuevo.fecha) : ''}
              onChange={(e) => setNuevo({ ...nuevo, fecha: e.target.value })}
              required
            />
          </div>
          <div className="col-md-2">
            <input type="text" className="form-control" placeholder="Nombre"
              value={nuevo.nombre}
              onChange={e => setNuevo({ ...nuevo, nombre: e.target.value })}
              required />
          </div>
          <div className="col-md-2">
            <input type="number" className="form-control" placeholder="Monto"
              value={nuevo.monto}
              onChange={e => setNuevo({ ...nuevo, monto: e.target.value })} />
          </div>
          <div className="col-md-2">
            <select className="form-select"
              value={nuevo.tipo}
              onChange={e => setNuevo({ ...nuevo, tipo: e.target.value })}>
              <option>Factura</option>
              <option>Interno</option>
            </select>
          </div>
          <div className="col-md-2">
            <input type="text" className="form-control" placeholder="Número"
              value={nuevo.numero}
              onChange={e => setNuevo({ ...nuevo, numero: e.target.value })}
            />
          </div>
          <div className="col-md-2">
            <select className="form-select"
              value={nuevo.estado}
              onChange={e => setNuevo({ ...nuevo, estado: e.target.value })}>
              <option>Pagado</option>
              <option>Pendiente</option>
            </select>
          </div>
          <div className="col-md-2">
            <button className="btn btn-primary w-100">
              {editandoId ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </div>
      </form>

      {pagos.length > 0 ? (
        <table className="table table-bordered table-sm text-center">
          <thead className="table-light">
            <tr>
              <th onClick={() => ordenarPor('fecha')} style={{ cursor: 'pointer' }}>Fecha ⬍</th>
              <th onClick={() => ordenarPor('nombre')} style={{ cursor: 'pointer' }}>Nombre ⬍</th>
              <th onClick={() => ordenarPor('monto')} style={{ cursor: 'pointer' }}>Monto ⬍</th>
              <th onClick={() => ordenarPor('tipo')} style={{ cursor: 'pointer' }}>Tipo ⬍</th>
              <th onClick={() => ordenarPor('numero')} style={{ cursor: 'pointer' }}>Número ⬍</th>
              <th onClick={() => ordenarPor('estado')} style={{ cursor: 'pointer' }}>Estado ⬍</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pagos.map(p => {
              const id = `${p.fecha} - ${p.nombre}`;
              return (
                <tr key={id}>
                  <td>{p.fecha}</td>
                  <td>{p.nombre}</td>
                  <td>${p.monto?.toLocaleString()}</td>
                  <td>{p.tipo}</td>
                  <td>{p.numero}</td>
                  <td
                    onClick={() => alternarEstado(p)}
                    style={{
                      backgroundColor: p.estado === 'Pagado' ? '#d4edda' : '#f8d7da',
                      color: p.estado === 'Pagado' ? '#155724' : '#721c24',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    {p.estado}
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-warning me-1"
                      onClick={() => editarPago(p)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => eliminarPago(p)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      ) : (
        <p className="text-muted">No hay pagos pendientes cargados.</p>
      )}
    </div>
  );
};

export default PagosPendientes;
