import React, { useState, useEffect } from 'react';
import './informes.css';
import { db, doc, getDoc,getDocs, setDoc ,auth, collection} from '../../firebaseConfig';
import { FiRefreshCw } from 'react-icons/fi';
import html2canvas from 'html2canvas';

const IndicadoresMensuales = (userId) => {

    const [usdPesos, setUsdPesos] = useState(null);
const [aniosDisponibles, setAniosDisponibles] = useState([]);
const [mesesDisponibles, setMesesDisponibles] = useState([]);
const [esMesExistente, setEsMesExistente] = useState(false);
const [informesNombres, setInformesNombres] = useState([]); // guarda ids/doc names de Informes


  const [data, setData] = useState({
    ivaCompra: '',
ivaVenta: '',
    dineroCalle: '',

    mercaderia: '',

    pdPesos: '',
      totalStockCosto: '', // <-- nuevo campo

    factNeto: '',
    factUtilidad: '',
    nnNeto: '',
    nnUtilidad: '',
    plus: '',
    anio: '',
mes: '',
    gastos: {
      alquiler: '',
      gerente: '',
      servicios: '',
      muni: '',
      estudio: '',
      iva: '',
      seguro: '',
      agua: '',
      nafta: '',
      soft: '',
      empleados: '',
      comisiones: '',
      extras: '',
    }
  });

  const [resultados, setResultados] = useState({
    factFacturacion: 0,
    factPorcentaje: 0,
    nnFacturacion: 0,
    nnPorcentaje: 0,
    totalUtilidad: 0,
    totalNeto: 0,
    totalIVA: 0,
    totalUti: 0,
    totalGastos: 0,
  });

  let userIdx = userId.userId;

useEffect(() => {
  if (!informesNombres || informesNombres.length === 0) return;

  const anioSeleccionado = data.anio || new Date().getFullYear().toString();
  const mesActualNombre = new Intl.DateTimeFormat('es-AR', { month: 'long' }).format(new Date());
  const mesCapitalizado = mesActualNombre.charAt(0).toUpperCase() + mesActualNombre.slice(1);

  // obtener meses del año seleccionado
  const mesesDelAnio = informesNombres
    .filter((n) => n.startsWith(anioSeleccionado))
    .map((n) => n.split('-')[1]);

  // asegurarnos de eliminar duplicados (declaramos correctamente la variable)
  const mesesUnicos = [...new Set(mesesDelAnio)];

  // incluir mes actual si no está presente
  const mesesConActual = mesesUnicos.includes(mesCapitalizado)
    ? mesesUnicos
    : [mesCapitalizado, ...mesesUnicos];

  setMesesDisponibles(mesesConActual);

  // Si el año seleccionado es el actual y no hay mes, seteamos mes actual por defecto
  if (!data.mes && anioSeleccionado === new Date().getFullYear().toString()) {
    setData((prev) => ({ ...prev, mes: mesCapitalizado }));
  }
}, [informesNombres, data.anio]); // <- dependencias


  useEffect(() => {
const fetchAniosYMeses = async () => {
  if (!userIdx) return;

  const informesRef = collection(db, 'users', userIdx, 'Informes');
  const snapshot = await getDocs(informesRef);
  const nombres = snapshot.docs.map((doc) => doc.id); // ej: ['2025-Marzo']

  setInformesNombres(nombres); // guardar lista

  // Extraer años únicos
  const aniosUnicos = [...new Set(nombres.map((n) => n.split('-')[0]))];
  setAniosDisponibles(aniosUnicos);

  // Año y mes actual formateado
  const anioActual = new Date().getFullYear().toString();
  const mesActualNombre = new Intl.DateTimeFormat('es-AR', { month: 'long' }).format(new Date());
  const mesCapitalizado = mesActualNombre.charAt(0).toUpperCase() + mesActualNombre.slice(1);

  // Meses existentes para el año actual
  const mesesDelAnio = nombres
    .filter((n) => n.startsWith(anioActual))
    .map((n) => n.split('-')[1]);

  // Asegurar que el mes actual esté en la lista (si no existe, lo ponemos al inicio)
  const mesesConActual = mesesDelAnio.includes(mesCapitalizado)
    ? mesesDelAnio
    : [mesCapitalizado, ...mesesDelAnio];

  // Establecer por defecto año y mes actuales
  setData((prev) => ({
    ...prev,
    anio: anioActual,
    mes: mesCapitalizado,
  }));

  setMesesDisponibles(mesesConActual);
};


  fetchAniosYMeses();
}, [userIdx]);



  useEffect(() => {
    const { factNeto, factUtilidad, nnNeto, nnUtilidad, gastos } = data;

    const factFacturacion = factNeto ? parseFloat(factNeto) * 1.21 : 0;
    const nnFacturacion = nnNeto ? parseFloat(nnNeto) * 1.21 : 0;

    const plus = nnNeto ? parseFloat(nnNeto) * 0.1 : 0;

    const factPorcentaje =
      factFacturacion && factUtilidad
        ? ((parseFloat(factUtilidad) / factNeto) * 100).toFixed(2)
        : 0;

    const totalUtilidad =
      nnUtilidad && plus
        ? (parseFloat(nnUtilidad) + plus).toFixed(2)
        : 0;

    const nnPorcentaje =
      nnNeto && totalUtilidad
        ? ((parseFloat(totalUtilidad) / nnNeto) * 100).toFixed(2)
        : 0;

 

    const totalNeto = (parseFloat(factNeto || 0) + parseFloat(nnNeto || 0)).toFixed(2);
    const totalIVA = (factFacturacion + nnFacturacion).toFixed(2);
    const totalUti = (parseFloat(factUtilidad || 0) + parseFloat(nnUtilidad || 0) + plus).toFixed(2);

    const totalGastos = Object.values(gastos).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);

    setData((prev) => ({ ...prev, plus: plus.toFixed(2) }));

    setResultados({
      factFacturacion: factFacturacion.toFixed(2),
      factPorcentaje,
      nnFacturacion: nnFacturacion.toFixed(2),
      nnPorcentaje,
      totalUtilidad,
      totalNeto,
      totalIVA,
      totalUti,
      totalGastos,
    });
  }, [data.factNeto, data.factUtilidad, data.nnNeto, data.nnUtilidad, data.gastos]);

useEffect(() => {
  if (!userIdx) return;
  const fetchData = async () => {
    const docRef = doc(db, 'users', userIdx, 'Informes', data.anio+"-"+data.mes );
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const docData = docSnap.data();
      setData(prev => ({
        ...prev,
        ...docData,
        gastos: {
          ...prev.gastos,               // valores por defecto ya definidos
          ...(docData.gastos || {})    // machaca si vienen de Firestore
        }
      }));
    }
  };
  fetchData();
}, [userIdx]);

useEffect(() => {
  const fetchDolar = async () => {
    try {
      const response = await fetch('https://dolarapi.com/v1/dolares/blue');
      const result = await response.json();
      setUsdPesos(result.venta);
    } catch (error) {
      console.error('Error al obtener el dólar:', error);
    }
  };

  fetchDolar();
}, []);

const handleChange = (e) => {
  const { name, value } = e.target;

  // Reemplazar coma por punto y eliminar caracteres no numéricos válidos
  const cleanValue = value.replace(',', '.');

  // Validar número (permite vacío para borrar)
  if (cleanValue !== '' && isNaN(cleanValue)) return;

  if (name.startsWith('gasto_')) {
    const gastoName = name.replace('gasto_', '');
    setData((prevData) => ({
      ...prevData,
      gastos: {
        ...prevData.gastos,
        [gastoName]: cleanValue,
      },
    }));
  } else {
    setData((prevData) => ({
      ...prevData,
      [name]: cleanValue,
    }));
  }
};


  const formatCurrency = (value) => {
    const number = parseFloat(value);
    if (isNaN(number)) return '';
    return number.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
  };

const registrarMesEnFirestore = async () => {
  if (!userIdx || !data.anio || !data.mes) return;

  const docRef = doc(db, 'users', userIdx, 'Informes', `${data.anio}-${data.mes}`);
  await setDoc(docRef, data);

  alert(`✅ Datos guardados en Informes > ${data.anio} > ${data.mes}`);
};

const fetchInformePorFecha = async (anio, mes) => {
  if (!userIdx || !anio || !mes) return;
  try {
    const docRef = doc(db, 'users', userIdx, 'Informes', `${anio}-${mes}`);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const docData = docSnap.data();
      setEsMesExistente(true); // existe

      setData({
        ...data, // mantiene anio y mes actuales
        ...docData,
        anio,
        mes,
        gastos: {
          ...Object.fromEntries(Object.keys(data.gastos).map(k => [k, ''])), // limpia campos gastos previos
          ...(docData.gastos || {}),
        },
      });
    } else {
      setEsMesExistente(false); // nuevo
      alert(`No se encontró información para ${mes} de ${anio}`);
      vaciarCampos();
    }
  } catch (error) {
    console.error('Error al obtener informe:', error);
  }
};


const handlePrintAsImage = async () => {
  const element = document.querySelector('.informe');
  if (!element) return;

  try {
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Informe</title>
          <style>
            body { margin: 0; text-align: center; }
            img { max-width: 100%; }
          </style>
        </head>
        <body>
          <img src="${imgData}" alt="Informe"/>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  } catch (error) {
    console.error('Error al generar la imagen:', error);
  }
};

const vaciarCampos = () => {
  setData((prev) => ({
    ...prev,
    ivaCompra: '',
    ivaVenta: '',
    dineroCalle: '',
    mercaderia: '',
    pdPesos: '',
    factNeto: '',
    factUtilidad: '',
    nnNeto: '',
    nnUtilidad: '',
    plus: '',
    gastos: Object.keys(prev.gastos).reduce((acc, key) => {
      acc[key] = '';
      return acc;
    }, {}),
  }));
};




  return (
    <>

    <div className="container my-4">
<div className="d-flex justify-content-between align-items-center mb-2">
  <h3 className="fw-bold">📅 INDICADORES MENSUALES</h3>
  <div className="d-flex gap-2">
    <button className="btn btn-secondary btn-sm" onClick={vaciarCampos}>
      🧹 Setear Datos
    </button>

  </div>
</div>
      <div className="card shadow border">
<div className="card shadow-sm border mb-4">
  <div className="card-body">
<div className="row justify-content-center align-items-center text-center" style={{ minHeight: '50px' }}>
  <div className="col-md-8 d-flex flex-column align-items-center justify-content-center">

    <div className="row w-100">
      {/* Año */}
      <div className="col-md-4 mb-2">
        <label className="form-label fw-semibold">Año</label>
<select
  className="form-select form-select-sm"
  value={data.anio || ''}
onChange={(e) =>
  setData((prev) => ({
    ...prev,
    anio: e.target.value,
    mes: '', // limpiar mes para que el useEffect ponga el mes por defecto si corresponde
  }))
}
>
  <option value="">Seleccionar Año</option>
  {aniosDisponibles.map((anio) => (
    <option key={anio} value={anio}>
      {anio}
    </option>
  ))}
</select>

      </div>

      {/* Mes */}
<div className="col-md-4 mb-2">
  <label className="form-label fw-semibold">Mes</label>
<select
  className="form-select form-select-sm"
  value={data.mes || ''}
  onChange={(e) =>
    setData((prev) => ({
      ...prev,
      mes: e.target.value,
    }))
  }
>
  {mesesDisponibles.map((mes) => (
    <option key={mes} value={mes}>
      {mes}
    </option>
  ))}
</select>

</div>

      {/* Botón */}
      {data.anio && data.mes && (
        <div className="col-md-4 mb-2 d-flex align-items-end">
          <button
            className="btn btn-primary btn-sm w-100"
            onClick={() => fetchInformePorFecha(data.anio, data.mes)}
          >
            🔍 Analizar Mes
          </button>
        </div>
      )}
    </div>
  </div>
</div>

  </div>
</div>


        <div className="card-body informe">

          <div className="rounded border p-3 bg-light-subtle mb-4">
<h5 className="text-center fw-semibold mb-3">
  📊 {data.anio && data.mes
    ? `Resumen del Mes ${data.mes} de ${data.anio}`
    : 'Facturación al Mes Corriente'}
</h5>
            {/* FACT */}
            <div className="row text-center fw-semibold text-uppercase small text-secondary">
              <div className="col">Neto</div>
              <div className="col">+IVA</div>
              <div className="col">Utilidad</div>
              <div className="col">%</div>
            </div>
            <div className="row text-center mb-4">
              <div className="col">
                <input
                  type="number"
                  name="factNeto"
                  className="form-control form-control-sm text-center"
                  value={data.factNeto}
                  onChange={handleChange}
                />
              </div>
              <div className="col">
                <input
                  type="text"
                  className="form-control form-control-sm text-center"
                  value={`$ ${resultados.factFacturacion}`}
                  readOnly
                />
              </div>
              <div className="col">
                <input
                  type="number"
                  name="factUtilidad"
                  className="form-control form-control-sm text-center"
                  value={data.factUtilidad}
                  onChange={handleChange}
                />
              </div>
              <div className="col">
                <input
                  type="text"
                  className="form-control form-control-sm text-center"
                  value={`${resultados.factPorcentaje} %`}
                  readOnly
                />
              </div>
            </div>

{/* INTERNO con PLUS y TOTAL en la misma fila */}
<div className="row text-center fw-semibold text-uppercase small text-secondary">
  <div className="col">Neto</div>
  <div className="col">+IVA</div>
  <div className="col">Utilidad</div>
  <div className="col">PLUS + 10% </div>
  <div className="col">Total</div>
  <div className="col">%</div>
</div>
<div className="row text-center mb-3">
  <div className="col">
    <input
      type="number"
      name="nnNeto"
      className="form-control form-control-sm text-center"
      value={data.nnNeto}
      onChange={handleChange}
    />
  </div>
  <div className="col">
    <input
      type="text"
      className="form-control form-control-sm text-center"
      value={`$ ${resultados.nnFacturacion}`}
      readOnly
    />
  </div>
  <div className="col">
    <input
      type="number"
      name="nnUtilidad"
      className="form-control form-control-sm text-center"
      value={data.nnUtilidad}
      onChange={handleChange}
    />
  </div>
  <div className="col">
    <input
      type="number"
      name="plus"
      className="form-control form-control-sm text-center"
      value={data.plus}
      onChange={handleChange}
    />
  </div>
  <div className="col">
    <input
      type="text"
      className="form-control form-control-sm text-center fw-bold"
      value={`$ ${resultados.totalUtilidad}`}
      readOnly
    />
  </div>
  <div className="col">
    <input
      type="text"
      className="form-control form-control-sm text-center"
      value={`${resultados.nnPorcentaje} %`}
      readOnly
    />
  </div>
</div>

{/* TOTAL GENERAL */}
<div className="row text-center fw-semibold text-uppercase small text-secondary mt-4">
  <div className="col">TOTAL NETO</div>
  <div className="col">TOTAL +IVA</div>
  <div className="col">TOTAL UTILIDAD</div>
  <div className="col">%</div>
</div>
<div className="row text-center mb-3">
  <div className="col">
    <input
      type="text"
      className="form-control form-control-sm text-center"
      value={`${formatCurrency(resultados.totalNeto)}`}
      readOnly
    />
  </div>
  <div className="col">
    <input
      type="text"
      className="form-control form-control-sm text-center"
      value={`${formatCurrency(resultados.totalIVA)}`} 
      readOnly
    />
  </div>
  <div className="col">
    <input
      type="text"
      className="form-control form-control-sm text-center fw-bold text-success"
      value={`${formatCurrency(resultados.totalUti)}`}
      readOnly
    />
  </div>
    <div className="col">
    <input
      type="text"
      className="form-control form-control-sm text-center fw-bold text-success"
      value={`${((parseFloat(resultados.totalUti) / resultados.totalNeto) * 100).toFixed(2)} %`}
      readOnly
    />
  </div>
</div>

    {/* NUEVA SECCIÓN DE GASTOS */}
      <div className="rounded border p-3 bg-light-subtle mb-4">
        <h5 className="text-center fw-semibold mb-3">📉 GASTOS</h5>

        <div className="row text-center fw-semibold text-uppercase small text-secondary">
          <div className="col">ALQUILER</div>
          <div className="col">SERVICIOS</div>
          <div className="col">ESTUDIO</div>
          <div className="col">SEGURO</div>
          <div className="col">NAFTA</div>
          <div className="col">EMPLEADOS</div>
        </div>
        <div className="row text-center mb-2">
          {['alquiler', 'servicios', 'estudio', 'seguro', 'nafta', 'empleados'].map((key) => (
            <div className="col" key={key}>
              <input
                type="number"
                name={`gasto_${key}`}
                className="form-control form-control-sm text-center"
                value={data.gastos[key] || ''}
                onChange={handleChange}
              />
            </div>
          ))}
        </div>

        <div className="row text-center fw-semibold text-uppercase small text-secondary">
          <div className="col">GERENTE</div>
          <div className="col">Comercio e Industria</div>
          <div className="col">IVA</div>
          <div className="col">AGUA</div>
          <div className="col">SOFTWARE</div>
          <div className="col">COMISIONES</div>
        </div>
        <div className="row text-center mb-2">
          {['gerente', 'muni', 'iva', 'agua', 'soft', 'comisiones'].map((key) => (
            <div className={`col`} key={key}>
              <input
                type="number"
                name={`gasto_${key}`}
                className="form-control form-control-sm text-center"
                value={data.gastos[key] || ''}
                onChange={handleChange}
              />
            </div>
          ))}
        </div>

        <div className="d-flex justify-content-end mt-2">
          <div className="fw-bold fs-5">
            TOTAL: <span className="text-danger">{formatCurrency(resultados.totalGastos)}</span>
          </div>
        </div>
      </div>

      {/* BLOQUE UTILIDAD Y GASTOS */}
<div className="row text-center fw-semibold text-uppercase small text-secondary mt-4">
  <div className="col">UTILIDAD</div>
  <div className="col">GASTOS</div>
  <div className="col">BALANCE</div>
  <div className="col">%</div>
</div>
<div className="row text-center mb-3">
  <div className="col">
    <input
      type="text"
      className="form-control form-control-sm text-center"
      value={formatCurrency(resultados.totalUti)}
      readOnly
    />
  </div>
  <div className="col">
    <input
      type="text"
      className="form-control form-control-sm text-center"
      value={formatCurrency(resultados.totalGastos)}
      readOnly
    />
  </div>
  <div className="col">
    <input
      type="text"
      className="form-control form-control-sm text-center fw-bold"
      value={formatCurrency(resultados.totalUti - resultados.totalGastos)}
      readOnly
    />
  </div>
  <div className="col">
<input
  type="text"
  className={`form-control form-control-sm text-center fw-bold ${
    ((resultados.totalUti / resultados.totalGastos) * 100) < 100
      ? 'text-danger'
      : ((resultados.totalUti / resultados.totalGastos) * 100) > 100
      ? 'text-success'
      : 'text-warning'
  }`}
  value={`${((resultados.totalUti / resultados.totalGastos) * 100).toFixed(2)} %`}
  readOnly
/>
  </div>
</div>

{/* BLOQUE P/D Y USD */}
<div className="row text-center fw-semibold text-uppercase small text-secondary">
  <div className="col">Poder de Venta (ARS)</div>
  <div className="col">DOLAR HOY</div>
  <div className="col">Poder de Venta (USD)</div>

</div>
<div className="row text-center mb-3">
  <div className="col">
    <input
      type="number"
      name="pdPesos"
      className="form-control form-control-sm text-center"
      value={data.pdPesos}
      onChange={handleChange}
    />
  </div>
  <div className="col">
<input 
  type="text"
  className="form-control form-control-sm text-center"
  value={usdPesos ? `$ ${usdPesos}` : 'Cargando...'}
  disabled
/>
  </div>
    <div className="col">
        <input
        type="text"
        className="form-control form-control-sm text-center text-success fw-bold"
        value={
            data.pdPesos && usdPesos
            ? `USD ${(data.pdPesos / usdPesos).toFixed(2)}`
            : ''
        }
        disabled
        />
  </div>
</div>
{/* BLOQUE TOTAL STOCK */} 
<div className="row text-center fw-semibold text-uppercase small text-secondary">
  <div className="col">TOTAL STOCK AL COSTO (ARS)</div>
  <div className="col">DOLAR HOY</div>
  <div className="col">TOTAL STOCK (USD)</div>
</div>
<div className="row text-center mb-3">
  <div className="col">
    <input
      type="number"
      name="totalStockCosto"
      className="form-control form-control-sm text-center"
      value={data.totalStockCosto}
      onChange={handleChange}
    />
  </div>
  <div className="col">
    <input
      type="text"
      className="form-control form-control-sm text-center"
      value={usdPesos ? `$ ${usdPesos}` : 'Cargando...'}
      disabled
    />
  </div>
  <div className="col">
    <input
      type="text"
      className="form-control form-control-sm text-center text-primary fw-bold"
      value={
        data.totalStockCosto && usdPesos
          ? `USD ${(data.totalStockCosto / usdPesos).toFixed(2)}`
          : ''
      }
      disabled
    />
  </div>
</div>


<div className="rounded border p-3 bg-light-subtle mb-4">
  <div className="row">
    
    {/* IZQUIERDA: Dinero en Calle + Mercadería */}
    <div className="col-md-6 border-end">
      <h6 className="fw-semibold">💰 MERCADERÍA ACOPIADA</h6>
      <input
        type="number"
        name="mercaderia"
        className="form-control form-control-sm text-center mb-3"
        value={data.mercaderia}
        onChange={handleChange}
      />

      <h6 className="fw-semibold">💸 DINERO EN CUENTAS CORRIENTES</h6>
      <input
        type="number"
        name="dineroCalle"
        className="form-control form-control-sm text-center"
        value={data.dineroCalle}
        onChange={handleChange}
      />
    </div>

    {/* DERECHA: Posición IVA */}
    <div className="col-md-6 text-center">
      <h6 className="fw-semibold">🧾 POSICIÓN IVA</h6>
      <div className="row text-uppercase small text-secondary fw-semibold mb-1">
        <div className="col">COMPRA</div>
        <div className="col">VENTA</div>
      </div>
      <div className="row mb-3">
        <div className="col">
          <input
            type="number"
            name="ivaCompra"
            className="form-control form-control-sm text-center"
            value={data.ivaCompra}
            onChange={handleChange}
          />
        </div>
        <div className="col">
          <input
            type="number"
            name="ivaVenta"
            className="form-control form-control-sm text-center text-danger fw-bold"
            value={data.ivaVenta}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Botón debajo */}
<div className="d-flex justify-content-center gap-2 mt-2">
<button className="btn btn-success btn-sm" onClick={registrarMesEnFirestore}>
  {esMesExistente ? '💾 Actualizar Mes' : '✅ Registrar Mes'}
</button>
  <button className="btn btn-primary btn-sm" onClick={handlePrintAsImage}>
    🖨️ Imprimir Informe
  </button>
</div>
    </div>

  </div>
</div>



          </div>

        </div>
      </div>
    </div>
    </>
  );
};

export default IndicadoresMensuales;
