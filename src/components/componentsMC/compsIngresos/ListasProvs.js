// CargarListasProveedores.jsx
import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { db, collection, setDoc, doc, getDocs, query, where, writeBatch } from '../../../firebaseConfig';
import Swal from 'sweetalert2';
import './ListasProvs.css';

const CargarListasProveedores = ({ userId }) => {
  const [productos, setProductos] = useState([]);
  const [filtro, setFiltro] = useState({ proveedor: 'Seleccionar', codigo: '', descripcion: '' });
  const [utilidad, setUtilidad] = useState(40);

  const cargarDesdeFirebase = async (proveedorSeleccionado) => {
    if (!userId || proveedorSeleccionado === 'Seleccionar') return;

    Swal.fire({
      title: 'Cambiando proveedor...',
      text: 'Cargando artículos desde la base de datos...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const colRef = collection(db, 'users', userId, 'ListaProvs');
    let q = colRef;

    if (proveedorSeleccionado !== 'Ambos') {
      q = query(colRef, where('proveedor', '==', proveedorSeleccionado));
    }

    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => doc.data());
    setProductos(data);
    Swal.close();
  };

  const handleProveedorChange = async (e) => {
    const selected = e.target.value;
    setFiltro(prev => ({ ...prev, proveedor: selected }));
    await cargarDesdeFirebase(selected);
  };

// helper: busca la primera columna que coincida con variantes
const getField = (row, candidates = []) => {
  const keys = Object.keys(row);
  for (let k of keys) {
    const kn = String(k).trim().toLowerCase();
    for (let cand of candidates) {
      if (kn === String(cand).toLowerCase()) return row[k];
      // también aceptamos que el header contenga la palabra (por si hay espacios/acentos)
      if (kn.includes(String(cand).toLowerCase())) return row[k];
    }
  }
  return null;
};

const parsePrecio = (precioRaw) => {
  if (precioRaw === null || precioRaw === undefined) return 0;
  if (typeof precioRaw === 'number') return precioRaw;
  // eliminar todo excepto dígitos, punto y coma/coma; convertir comas decimales
  const str = String(precioRaw).replace(/\s/g, '');
  // si viene con separador de miles como punto y decimal con coma: "1.234,56"
  if (/[.,]/.test(str)) {
    // quitar todos los puntos (miles) y reemplazar coma por punto
    const cleaned = str.replace(/\./g, '').replace(/,/g, '.').replace(/[^\d.]/g, '');
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }
  const onlyDigits = str.replace(/[^\d]/g, '');
  const n = parseFloat(onlyDigits);
  return isNaN(n) ? 0 : n;
};

const handleFileUpload = async (e, proveedor) => {
  const file = e.target.files[0];
  if (!file) return;

  Swal.fire({
    title: `Cargando lista (${proveedor})`,
    html: `
      <div id="swal-progress-wrap" style="width:100%;margin-top:8px">
        <div style="width:100%;background:#e9ecef;border-radius:8px;height:18px;overflow:hidden">
          <div id="swal-progress-bar" style="width:0%;height:100%;border-radius:8px"></div>
        </div>
        <div style="margin-top:8px;text-align:center"><b id="swal-progress-text">0%</b></div>
      </div>
    `,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  const reader = new FileReader();
  reader.onload = async (evt) => {
    try {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { defval: '' });

      // identificar campos flexibles
      const codigoCandidates = ['CODIGO', 'COD', 'COD.', 'CÓDIGO'];
      const descripcionCandidates = ['DESCRIPCION', 'DETALLE', 'DESCRIPCIÓN', 'DESCRIP'];
      const precioCandidates = ['PRECIO', 'P.VENTA', 'P. VENTA', 'PRECIO FINAL', 'PRECIO_VENTA', 'PVENTA'];

      const articulos = data.map(row => {
        const codigoRaw = getField(row, codigoCandidates);
        const descripcionRaw = getField(row, descripcionCandidates);
        const precioRaw = getField(row, precioCandidates) ?? getField(row, ['COSTO', 'IMPORTE', 'VALOR', 'PRECIO']);

        if (!codigoRaw && !descripcionRaw && !precioRaw) return null;

        const codigo = codigoRaw !== null && codigoRaw !== undefined ? String(codigoRaw).trim() : null;
        const descripcion = descripcionRaw !== null && descripcionRaw !== undefined ? String(descripcionRaw).trim() : '';
        const precio = parsePrecio(precioRaw);

        if (!codigo || descripcion === '') return null; // querés exigir ambos -> ajustá si querés distinto

        return {
          codigo,
          descripcion,
          precio,
          proveedor
        };
      }).filter(r => r !== null);

      if (!userId) {
        Swal.close();
        return Swal.fire('⚠️ Error', 'No hay usuario autenticado.', 'error');
      }

      if (articulos.length === 0) {
        Swal.close();
        return Swal.fire('⚠️ Archivo inválido', 'No se encontraron productos válidos. Verificá el formato.', 'error');
      }

      const colRef = collection(db, 'users', userId, 'ListaProvs');
      const batchSize = 500;
      let contador = 0;

      for (let i = 0; i < articulos.length; i += batchSize) {
        const batch = writeBatch(db);
        const slice = articulos.slice(i, i + batchSize);

        slice.forEach((art) => {
          const docRef = doc(colRef, `${art.proveedor}-${art.codigo}`);
          batch.set(docRef, art);
        });

        await batch.commit();
        contador += slice.length;

        // actualizar barra de progreso en el modal
        const percent = Math.round((contador / articulos.length) * 100);
        const progressHtml = `
          <div id="swal-progress-wrap" style="width:100%;margin-top:8px">
            <div style="width:100%;background:#e9ecef;border-radius:8px;height:18px;overflow:hidden">
              <div id="swal-progress-bar" style="width:${percent}%;height:100%;border-radius:8px"></div>
            </div>
            <div style="margin-top:8px;text-align:center"><b id="swal-progress-text">${percent}%</b></div>
            <div style="margin-top:6px;font-size:12px;text-align:center">Cargando ${contador} de ${articulos.length}</div>
          </div>
        `;
        Swal.update({ html: progressHtml });
        console.log(`Progreso: ${contador}/${articulos.length} (${percent}%)`);
      }

      // recargar lista visible según filtro.proveedor (si está seleccionado)
      await cargarDesdeFirebase(filtro.proveedor === 'Seleccionar' ? proveedor : filtro.proveedor);

      Swal.close();
      Swal.fire('✅ Listo', `Se cargaron ${articulos.length} artículos (${proveedor}).`, 'success');
    } catch (error) {
      console.error('Error al procesar archivo:', error);
      Swal.close();
      Swal.fire('❌ Error', 'Hubo un error al procesar el archivo. Verifica el formato.', 'error');
    }
  };

  reader.readAsBinaryString(file);
};


  const productosFiltrados = productos.filter(p =>
    (filtro.codigo === '' || p.codigo?.toLowerCase().includes(filtro.codigo.toLowerCase())) &&
    (filtro.descripcion === '' || p.descripcion?.toLowerCase().includes(filtro.descripcion.toLowerCase()))
  );

  const formatearPrecio = (valor) => {
    return valor.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
  };

  return (
    <div className="container mt-5">
      <h4 className="text-center fw-bold mb-4">📦 Cargar Listas de Proveedores</h4>

      <div className="d-flex justify-content-center align-items-center gap-4 flex-wrap mb-4">
        <div>
          <label className="form-label">Cargar archivo Berger:</label>
          <input type="file" className="form-control" accept=".xlsx, .xls" onChange={(e) => handleFileUpload(e, 'Berger')} />
        </div>
        <div>
          <label className="form-label">Cargar archivo Lekons:</label>
          <input type="file" className="form-control" accept=".xlsx, .xls" onChange={(e) => handleFileUpload(e, 'Lekons')} />
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-3">
          <select className="form-select" value={filtro.proveedor} onChange={handleProveedorChange}>
            <option value="Seleccionar">Seleccionar Prov.</option>
            <option value="Ambos">Ambos</option>
            <option value="Berger">Berger</option>
            <option value="Lekons">Lekons</option>
          </select>
        </div>
        <div className="col-md-3">
          <input className="form-control" placeholder="Código" onChange={e => setFiltro({ ...filtro, codigo: e.target.value })} />
        </div>
        <div className="col-md-4">
          <input className="form-control" placeholder="Descripción" onChange={e => setFiltro({ ...filtro, descripcion: e.target.value })} />
        </div>
        <div className="col-md-2">
          <div className="input-group">
            <input
              type="number"
              className="form-control"
              value={utilidad}
              onChange={e => setUtilidad(parseFloat(e.target.value) || 0)}
            />
            <span className="input-group-text">% 🔧</span>
          </div>
        </div>
      </div>

      {filtro.proveedor !== 'Seleccionar' && (
        <table className="table table-hover table-bordered">
          <thead className="table-dark">
            <tr>
              <th>Proveedor</th>
              <th>Código</th>
              <th>Descripción</th>
              <th>Precio</th>
              <th>+ Utilidad ({utilidad}%)</th>
              <th>+ IVA (21%)</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.map((p, i) => {
              const conUtilidad = p.precio * (1 + utilidad / 100);
              const conIVA = conUtilidad * 1.21;
              return (
                <tr key={i}>
                  <td>{p.proveedor}</td>
                  <td>{p.codigo}</td>
                  <td>{p.descripcion}</td>
                  <td>{formatearPrecio(p.precio)}</td>
                  <td>{formatearPrecio(conUtilidad)}</td>
                  <td>{formatearPrecio(conIVA)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CargarListasProveedores;