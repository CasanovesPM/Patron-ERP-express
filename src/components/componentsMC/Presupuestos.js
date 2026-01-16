import { useState, useEffect } from "react";
import { db, doc, setDoc, getDocs, collection, updateDoc, deleteDoc } from '../../firebaseConfig';
import Swal from 'sweetalert2';

const Presupuestos = ({ userId }) => {
  const [presupuestos, setPresupuestos] = useState([]);
  const [orden, setOrden] = useState({ campo: '', asc: true });
  const [editandoId, setEditandoId] = useState(null);

  const [nuevo, setNuevo] = useState({
    nombre: '',
    telefono: '',
    nro: '',
    monto: '',
    lista: 'Lista 1',
    estado: 'Abierto'
  });

  const fetchPresupuestos = async () => {
    try {
      const ref = collection(db, 'users', userId, 'Presupuestos');
      const snapshot = await getDocs(ref);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data().data
      }));
      setPresupuestos(data);
    } catch (error) {
      console.error("Error al obtener presupuestos:", error);
    }
  };

  useEffect(() => {
    fetchPresupuestos();
  }, [userId]);

  const guardarPresupuesto = async (e) => {
    e.preventDefault();
    const { nombre, nro } = nuevo;
    if (!nombre || !nro) return Swal.fire('Error', 'Nombre y Nro Presupuesto son obligatorios', 'error');

    const id = `${nombre.trim()} - ${nro}`;
    const docRef = doc(db, 'users', userId, 'Presupuestos', id);

    try {
      await setDoc(docRef, {
        data: {
          ...nuevo,
          monto: Number(nuevo.monto),
        }
      });
      Swal.fire('Presupuesto guardado', `Presupuesto "${id}" registrado.`, 'success');
      setNuevo({
        nombre: '',
        telefono: '',
        nro: '',
        monto: '',
        lista: 'Lista 1',
        estado: 'Abierto'
      });
      setEditandoId(null);
      fetchPresupuestos();
    } catch (error) {
      console.error("Error al guardar presupuesto:", error);
    }
  };

  const alternarEstado = async (p) => {
    const id = `${p.nombre} - ${p.nro}`;
    const nuevoEstado = p.estado === 'Abierto' ? 'Cerrado' : 'Abierto';
    const ref = doc(db, 'users', userId, 'Presupuestos', id);

    try {
      await updateDoc(ref, {
        'data.estado': nuevoEstado
      });
      fetchPresupuestos();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    }
  };

  const editarPresupuesto = (p) => {
    setNuevo({ ...p });
    setEditandoId(`${p.nombre} - ${p.nro}`);
  };

  const eliminarPresupuesto = async (p) => {
    const id = `${p.nombre} - ${p.nro}`;
    const ref = doc(db, 'users', userId, 'Presupuestos', id);

    const confirm = await Swal.fire({
      title: '¿Eliminar?',
      text: `¿Seguro que querés eliminar el presupuesto "${id}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
    });

    if (confirm.isConfirmed) {
      try {
        await deleteDoc(ref);
        Swal.fire('Eliminado', 'Presupuesto eliminado.', 'success');
        fetchPresupuestos();
      } catch (error) {
        console.error("Error al eliminar presupuesto:", error);
        Swal.fire('Error', 'No se pudo eliminar el presupuesto.', 'error');
      }
    }
  };

  const ordenarPor = (campo) => {
    const asc = orden.campo === campo ? !orden.asc : true;
    const sorted = [...presupuestos].sort((a, b) => {
      if (typeof a[campo] === 'number') {
        return asc ? a[campo] - b[campo] : b[campo] - a[campo];
      }
      return asc
        ? (a[campo] || '').localeCompare(b[campo] || '')
        : (b[campo] || '').localeCompare(a[campo] || '');
    });
    setPresupuestos(sorted);
    setOrden({ campo, asc });
  };

  return (
    <div className="container mt-4">
      <h2>Presupuestos</h2>
      <form onSubmit={guardarPresupuesto} className="mb-4">
        <div className="row g-2">
          <div className="col-md-2">
            <input type="text" className="form-control" placeholder="Nombre"
              value={nuevo.nombre}
              onChange={e => setNuevo({ ...nuevo, nombre: e.target.value })} required />
          </div>
          <div className="col-md-2">
            <input type="text" className="form-control" placeholder="Teléfono"
              value={nuevo.telefono}
              onChange={e => setNuevo({ ...nuevo, telefono: e.target.value })} />
          </div>
          <div className="col-md-2">
            <input type="text" className="form-control" placeholder="Nro Presupuesto"
              value={nuevo.nro}
              onChange={e => setNuevo({ ...nuevo, nro: e.target.value })} required />
          </div>
          <div className="col-md-2">
            <input type="number" className="form-control" placeholder="Monto"
              value={nuevo.monto}
              onChange={e => setNuevo({ ...nuevo, monto: e.target.value })} />
          </div>
          <div className="col-md-2">
            <select className="form-select"
              value={nuevo.lista}
              onChange={e => setNuevo({ ...nuevo, lista: e.target.value })}>
              <option>Lista 1</option>
              <option>Lista 2</option>
              <option>Lista 3</option>
              <option>Lista 3 NN</option>
              <option>Lista 4</option>
              <option>Lista 5</option>
            </select>
          </div>
          <div className="col-md-2">
            <select className="form-select"
              value={nuevo.estado}
              onChange={e => setNuevo({ ...nuevo, estado: e.target.value })}>
              <option>Abierto</option>
              <option>Cerrado</option>
            </select>
          </div>
          <div className="col-md-2 mt-2">
            <button className="btn btn-primary w-100">
              {editandoId ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </div>
      </form>

      {presupuestos.length > 0 ? (
        <table className="table table-bordered table-sm text-center">
          <thead className="table-light">
            <tr>
              <th onClick={() => ordenarPor('nombre')} style={{ cursor: 'pointer' }}>Nombre ⬍</th>
              <th>Teléfono</th>
              <th onClick={() => ordenarPor('nro')} style={{ cursor: 'pointer' }}>Nro Presupuesto ⬍</th>
              <th onClick={() => ordenarPor('monto')} style={{ cursor: 'pointer' }}>Monto ⬍</th>
              <th onClick={() => ordenarPor('lista')} style={{ cursor: 'pointer' }}>Lista ⬍</th>
              <th onClick={() => ordenarPor('estado')} style={{ cursor: 'pointer' }}>Estado ⬍</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {presupuestos.map(p => {
              const id = `${p.nombre} - ${p.nro}`;
              return (
                <tr key={id}>
                  <td>{p.nombre}</td>
                  <td>{p.telefono}</td>
                  <td>{p.nro}</td>
                  <td>${p.monto?.toLocaleString()}</td>
                  <td>{p.lista}</td>
                  <td
                    onClick={() => alternarEstado(p)}
                    style={{
                      backgroundColor: p.estado === 'Abierto' ? '#d4edda' : '#f8d7da',
                      color: p.estado === 'Abierto' ? '#155724' : '#721c24',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    {p.estado}
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-warning me-1"
                      onClick={() => editarPresupuesto(p)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => eliminarPresupuesto(p)}
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
        <p className="text-muted">No hay presupuestos cargados.</p>
      )}
    </div>
  );
};

export default Presupuestos;

