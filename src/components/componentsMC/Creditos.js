import { useState, useEffect } from "react";
import { db, collection, getDocs, doc, setDoc, updateDoc , deleteField } from '../../firebaseConfig';
import moment from 'moment';
import 'moment/locale/es';
import Swal from 'sweetalert2';

moment.locale('es');

const Creditos = ({ userId }) => {
  const [creditos, setCreditos] = useState([]);
  const [nuevoCredito, setNuevoCredito] = useState({
    razon: '',
    fechaInicio: moment().format('YYYY-MM-DD'),
    montoTotal: '',
    cuotas: '',
    valorCuota: ''
  });

  const mesActual = moment().format('YYYY-MM');

  useEffect(() => {
    fetchCreditos();
  }, [userId]);

  const fetchCreditos = async () => {
    try {
      const ref = collection(db, 'users', userId, 'Creditos');
      const snapshot = await getDocs(ref);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data().data
      }));
      setCreditos(data);
    } catch (error) {
      console.error("Error al obtener créditos:", error);
    }
  };

  const registrarPago = async (razon, mes) => {
    const creditoRef = doc(db, 'users', userId, 'Creditos', razon);
    const credito = creditos.find(c => c.razon === razon);
    try {
      await updateDoc(creditoRef, {
        [`data.pagos.${mes}`]: true,
        'data.cuotasPagadas': (credito?.cuotasPagadas || 0) + 1
      });
      Swal.fire('Pago registrado', `El mes ${mes} fue marcado como pagado.`, 'success');
      fetchCreditos();
    } catch (error) {
      console.error("Error al registrar pago:", error);
    }
  };

  const desestimarPago = async (razon, mes) => {
  const creditoRef = doc(db, 'users', userId, 'Creditos', razon);
  const credito = creditos.find(c => c.razon === razon);
  try {
    await updateDoc(creditoRef, {
      [`data.pagos.${mes}`]: deleteField(),
      'data.cuotasPagadas': Math.max((credito?.cuotasPagadas || 1) - 1, 0)
    });
    Swal.fire('Pago desestimado', `El pago del mes ${mes} fue revertido.`, 'info');
    fetchCreditos();
  } catch (error) {
    console.error("Error al desestimar pago:", error);
    Swal.fire('Error', 'No se pudo revertir el pago.', 'error');
  }
};

  const agregarCredito = async (e) => {
    e.preventDefault();
    const razon = nuevoCredito.razon.trim();
    if (!razon) return Swal.fire('Error', 'La razón es obligatoria', 'error');

    const docRef = doc(db, 'users', userId, 'Creditos', razon);
    try {
      await setDoc(docRef, {
        data: {
          ...nuevoCredito,
          montoTotal: Number(nuevoCredito.montoTotal),
          cuotas: Number(nuevoCredito.cuotas),
          valorCuota: Number(nuevoCredito.valorCuota),
          cuotasPagadas: 0,
          pagos: {}
        }
      });
      Swal.fire('Crédito agregado', `Crédito "${razon}" registrado correctamente.`, 'success');
      setNuevoCredito({
        razon: '',
        fechaInicio: moment().format('YYYY-MM-DD'),
        montoTotal: '',
        cuotas: '',
        valorCuota: ''
      });
      fetchCreditos();
    } catch (error) {
      console.error("Error al agregar crédito:", error);
    }

    await setDoc(docRef, {
  data: {
    ...nuevoCredito,
    montoTotal: Number(nuevoCredito.montoTotal),
    cuotas: Number(nuevoCredito.cuotas),
    valorCuota: nuevoCredito.tipoCredito === 'frances' ? Number(nuevoCredito.valorCuota) : null,
    cuotasAleman: nuevoCredito.tipoCredito === 'aleman'
      ? nuevoCredito.cuotasAleman.map(c => Number(c))
      : [],
    tipoCredito: nuevoCredito.tipoCredito || 'frances',
    cuotasPagadas: 0,
    pagos: {}
  }
});
  };

  const finalizarCredito = async (razon) => {
  const creditoRef = doc(db, 'users', userId, 'Creditos', razon);
  try {
    await updateDoc(creditoRef, {
      'data.finalizado': true
    });
    Swal.fire('Finalizado', `El crédito "${razon}" fue marcado como finalizado.`, 'success');
    fetchCreditos(); // actualiza la lista
  } catch (error) {
    console.error("Error al finalizar crédito:", error);
    Swal.fire('Error', 'No se pudo finalizar el crédito.', 'error');
  }
};

  return (
    <div className="container mt-4">
      <h2>Créditos Tomados</h2>

<form onSubmit={agregarCredito} className="mb-4">
  <div className="row g-2 align-items-end">
    <div className="col-md-2">
      <input
        type="text"
        className="form-control"
        placeholder="Razón"
        value={nuevoCredito.razon}
        onChange={e => setNuevoCredito({ ...nuevoCredito, razon: e.target.value })}
        required
      />
    </div>
    <div className="col-md-2">
      <input
        type="date"
        className="form-control"
        value={nuevoCredito.fechaInicio}
        onChange={e => setNuevoCredito({ ...nuevoCredito, fechaInicio: e.target.value })}
        required
      />
    </div>
    <div className="col-md-2">
      <input
        type="number"
        className="form-control"
        placeholder="Monto total"
        value={nuevoCredito.montoTotal}
        onChange={e => setNuevoCredito({ ...nuevoCredito, montoTotal: e.target.value })}
        required
      />
    </div>
    <div className="col-md-2">
      <input
        type="number"
        className="form-control"
        placeholder="Cuotas"
        value={nuevoCredito.cuotas}
        onChange={e => {
          const cuotas = Number(e.target.value);
          setNuevoCredito({
            ...nuevoCredito,
            cuotas,
            cuotasAleman: Array.from({ length: cuotas }, () => '')
          });
        }}
        required
      />
    </div>
    <div className="col-md-2">
      <select
        className="form-select"
        value={nuevoCredito.tipoCredito || 'frances'}
        onChange={e => setNuevoCredito({ ...nuevoCredito, tipoCredito: e.target.value })}
      >
        <option value="frances">Tipo Francés</option>
        <option value="aleman">Tipo Alemán</option>
      </select>
    </div>
  </div>

  {/* Cuotas fijas solo para tipo francés */}
  {nuevoCredito.tipoCredito === 'frances' && (
    <div className="row mt-2">
      <div className="col-md-2">
        <input
          type="number"
          className="form-control"
          placeholder="Valor cuota"
          value={nuevoCredito.valorCuota}
          onChange={e => setNuevoCredito({ ...nuevoCredito, valorCuota: e.target.value })}
          required
        />
      </div>
    </div>
  )}

  {/* Lista de cuotas para tipo alemán */}
  {nuevoCredito.tipoCredito === 'aleman' && (
    <div className="mt-3">
      <h6>Valores de cada cuota</h6>
      <div className="row g-2">
        {nuevoCredito.cuotasAleman?.map((valor, idx) => (
          <div className="col-md-2" key={idx}>
            <input
              type="number"
              className="form-control"
              placeholder={`Cuota ${idx + 1}`}
              value={valor}
              onChange={e => {
                const nuevasCuotas = [...nuevoCredito.cuotasAleman];
                nuevasCuotas[idx] = e.target.value;
                setNuevoCredito({ ...nuevoCredito, cuotasAleman: nuevasCuotas });
              }}
              required
            />
          </div>
        ))}
      </div>
    </div>
  )}

  <div className="row mt-3">
    <div className="col-md-2">
      <button type="submit" className="btn btn-primary w-100">Agregar</button>
    </div>
  </div>
</form>


<h4 className="mt-5">Seguimiento de Cuotas</h4>
{creditos.length > 0 ? (
  <div className="row">
    {creditos.filter(c => !c.finalizado).map((credito, index) => {

      
      const cuotasTotales = Number(credito.cuotas) || 0;
      const fechaInicio = moment(credito.fechaInicio);
      const pagos = credito.pagos || {};
      const cuotasAleman = credito.tipoCredito === 'aleman' ? credito.cuotasAleman || [] : [];

      // Ajuste de ancho de columna dinámico
      const colWidth = creditos.length === 1 ? 'col-12' : 'col-md-6';

      return (
        <div className={`${colWidth} mb-4`} key={credito.razon}>
          <div className="card shadow-sm p-3 h-100">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">{credito.razon}</h5>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => finalizarCredito(credito.razon)}
            >
              Finalizar
            </button>
          </div>
            {/* Resumen de crédito */}
            <div className="card bg-light border-start border-primary border-4 mb-3 p-3">
              <div className="row text-center">
                <div className="col-4">
                  <small className="text-muted">Monto Total</small>
                  <div className="fw-bold">${credito.montoTotal?.toLocaleString()}</div>
                </div>
                <div className="col-4">
                  <small className="text-muted">Total Pagado</small>
                  <div className="fw-bold">
                    ${(
                      (credito.cuotasPagadas || 0) *
                      (credito.tipoCredito === 'aleman'
                        ? cuotasAleman.slice(0, credito.cuotasPagadas).reduce((a, b) => a + (b || 0), 0)
                        : credito.valorCuota)
                    )?.toLocaleString()}
                  </div>
                </div>
                <div className="col-4">
                  <small className="text-muted">Saldo Restante</small>
                  <div className="fw-bold">
                    ${(
                      credito.montoTotal -
                      ((credito.cuotasPagadas || 0) *
                        (credito.tipoCredito === 'aleman'
                          ? cuotasAleman.slice(0, credito.cuotasPagadas).reduce((a, b) => a + (b || 0), 0)
                          : credito.valorCuota))
                    )?.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="mt-3">
                <div className="progress" style={{ height: '10px' }}>
                  <div
                    className="progress-bar bg-primary"
                    role="progressbar"
                    style={{
                      width: `${((credito.cuotasPagadas || 0) / credito.cuotas) * 100}%`
                    }}
                  ></div>
                </div>
                <small className="text-muted d-block text-end mt-1">
                  {(credito.cuotasPagadas || 0)} de {credito.cuotas} cuotas pagadas
                </small>
              </div>
            </div>

            {/* Tabla de cuotas */}
            <table className="table table-sm table-bordered">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Mes</th>
                  <th>Importe</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(cuotasTotales)].map((_, i) => {
                  const fechaCuota = fechaInicio.clone().add(i, 'months');
                  const claveMes = fechaCuota.format('YYYY-MM');
                  const pagada = pagos[claveMes];
                  const valorCuota =
                    credito.tipoCredito === 'aleman'
                      ? cuotasAleman[i] || 0
                      : credito.valorCuota;

                  return (
                    <tr key={claveMes}>
                      <td>{i + 1}</td>
                      <td>{fechaCuota.format('MMMM YYYY').charAt(0).toUpperCase() + fechaCuota.format('MMMM YYYY').slice(1)
}</td>
                      <td>${valorCuota?.toLocaleString()}</td>
                      <td>
                        {pagada ? (
                          <span className="badge bg-success">Pagado</span>
                        ) : (
                          <span className="badge bg-warning text-dark">Pendiente</span>
                        )}
                      </td>
                      <td>
                        {pagada ? (
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => desestimarPago(credito.razon, claveMes)}
                          >
                            Desestimar Pago
                          </button>
                        ) : (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => registrarPago(credito.razon, claveMes)}
                          >
                            Registrar Pago
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    })}
  </div>
) : (
  <p className="text-muted text-center mt-4">No hay créditos registrados.</p>
)}

    </div>
  );
};

export default Creditos;
