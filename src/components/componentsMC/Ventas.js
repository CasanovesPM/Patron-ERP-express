import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import 'bootstrap/dist/css/bootstrap.min.css';

// AnalizadorVentasPorRubro.jsx - versión con Bootstrap styling + Análisis General
export default function AnalizadorVentasPorRubro() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('rotacion'); // 'rotacion'|'utilidad'|'facturacion'|'pct'
  const [showGeneral, setShowGeneral] = useState(false);

  function readFile(file) {
    setError(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const raw = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        const parsed = parseSheet(raw);
        setReport(parsed);
        setShowGeneral(false);
      } catch (e) {
        console.error(e);
        setError('No se pudo leer el archivo. Asegurate que sea un Excel válido.');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function parseSheet(rows) {
    let headerIdx = -1;
    let headers = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i].map((c) => String(c).toLowerCase());
      if (r.some((c) => c.includes('neto')) && (r.some((c) => c.includes('cant')) || r.some((c) => c.includes('cantidad')))) {
        headerIdx = i;
        headers = rows[i];
        break;
      }
    }
    if (headerIdx === -1) {
      headerIdx = 0;
      headers = rows[0] || [];
    }

    const headerMap = {};
    headers.forEach((h, idx) => {
      const key = String(h || '').toLowerCase();
      if (key.includes('rubro')) headerMap.rubro = idx;
      if (key.includes('cant')) headerMap.cantidad = idx;
      if (key.includes('cantidad')) headerMap.cantidad = idx;
      if (key.includes('neto')) headerMap.neto = idx;
      if (key.includes('imp. util') || key.includes('imp util') || (key.includes('util') && !key.includes('%'))) headerMap.utilidad = idx;
      if (key.includes('i.v.a') || key.includes('iva')) headerMap.iva = idx;
      if (key.includes('total')) headerMap.total = idx;
      if (key.includes('costo')) headerMap.costo = idx;
      if (key.includes('art') || key.includes('art.') || key.includes('art:')) headerMap.articulo = idx;
      if ((key.includes('%') && key.includes('util')) || (key.includes('porc') && key.includes('util')) || (key.includes('porcentaje') && key.includes('util'))) {
        headerMap.pct = idx;
      }
      if (key.includes('%') && key.includes('utilidad')) headerMap.pct = idx;
    });

    const byRubro = {};
    let currentRubro = 'Sin Rubro';
    const rubroRegex = /rubro\s*[:\-]?\s*(.*)/i;

    function isNumericToken(tok) {
      if (tok === null || tok === undefined) return false;
      const n = parseNumber(String(tok));
      return Number.isFinite(n);
    }

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;
      const joined = row.join(' ').trim();
      if (!joined) continue;

      if (/total rubro/i.test(joined) || /^\s*total(es)?\b/i.test(joined) || /\btotales\b/i.test(joined)) {
        if (!byRubro[currentRubro]) byRubro[currentRubro] = { products: {}, totals: initTotals() };
        const t = byRubro[currentRubro].totals;
        if (headerMap.cantidad !== undefined && Number.isFinite(parseNumber(row[headerMap.cantidad]))) t.cantidad = Number(parseNumber(row[headerMap.cantidad]));
        if (headerMap.neto !== undefined && Number.isFinite(parseNumber(row[headerMap.neto]))) t.neto = Number(parseNumber(row[headerMap.neto]));
        if (headerMap.utilidad !== undefined && Number.isFinite(parseNumber(row[headerMap.utilidad]))) t.utilidad = Number(parseNumber(row[headerMap.utilidad]));
        if (headerMap.iva !== undefined && Number.isFinite(parseNumber(row[headerMap.iva]))) t.iva = Number(parseNumber(row[headerMap.iva]));
        if (headerMap.total !== undefined && Number.isFinite(parseNumber(row[headerMap.total]))) t.total = Number(parseNumber(row[headerMap.total]));
        if (headerMap.costo !== undefined && Number.isFinite(parseNumber(row[headerMap.costo]))) t.costo = Number(parseNumber(row[headerMap.costo]));
        if (headerMap.pct !== undefined && Number.isFinite(parseNumber(row[headerMap.pct]))) {
          t.pct_util = Number(parseNumber(row[headerMap.pct]));
        }
        continue;
      }

      const tokens = row.map((c) => String(c || '').trim()).filter((t) => t !== '');
      if (tokens.length > 0) {
        let numericCount = 0;
        let alphaCount = 0;
        for (const t of tokens) {
          if (/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(t)) alphaCount++;
          else if (isNumericToken(t)) numericCount++;
        }
        if (numericCount >= 4 && alphaCount <= 1) continue;
      }

      const matchR = joined.match(rubroRegex);
      if (matchR) {
        const candidate = (matchR[1] || '').trim();
        if (candidate && /[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(candidate)) {
          currentRubro = candidate;
          if (!byRubro[currentRubro]) byRubro[currentRubro] = { products: {}, totals: initTotals() };
        }
        continue;
      }

      const rubroCellIndex = row.findIndex((c) => /\brubro\b/i.test(String(c)));
      if (rubroCellIndex >= 0) {
        const rightCell = String(row[rubroCellIndex + 1] || '').trim();
        if (rightCell && /[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(rightCell)) {
          currentRubro = rightCell;
          if (!byRubro[currentRubro]) byRubro[currentRubro] = { products: {}, totals: initTotals() };
          continue;
        }
      }

      const maybeCantidad = headerMap.cantidad !== undefined ? Number(parseNumber(row[headerMap.cantidad])) : NaN;
      const firstCell = String(row[0] || '').toLowerCase();
      const isProductRow = (Number.isFinite(maybeCantidad) && maybeCantidad !== 0)
        || /art[:\.]/i.test(firstCell)
        || row.some((c) => /art\b/i.test(String(c)));

      if (!isProductRow) continue;

      const codigo = headerMap.articulo !== undefined ? row[headerMap.articulo] : row[1] || '';
      const descripcion = headerMap.articulo !== undefined && headerMap.articulo + 1 < row.length ? row[headerMap.articulo + 1] : row[2] || '';

      const cantidad = headerMap.cantidad !== undefined && Number.isFinite(parseNumber(row[headerMap.cantidad])) ? Number(parseNumber(row[headerMap.cantidad])) : 0;
      const neto = headerMap.neto !== undefined && Number.isFinite(parseNumber(row[headerMap.neto])) ? Number(parseNumber(row[headerMap.neto])) : 0;
      const utilidad = headerMap.utilidad !== undefined && Number.isFinite(parseNumber(row[headerMap.utilidad])) ? Number(parseNumber(row[headerMap.utilidad])) : 0;
      const iva = headerMap.iva !== undefined && Number.isFinite(parseNumber(row[headerMap.iva])) ? Number(parseNumber(row[headerMap.iva])) : 0;
      const total = headerMap.total !== undefined && Number.isFinite(parseNumber(row[headerMap.total])) ? Number(parseNumber(row[headerMap.total])) : 0;
      const costo = headerMap.costo !== undefined && Number.isFinite(parseNumber(row[headerMap.costo])) ? Number(parseNumber(row[headerMap.costo])) : 0;
      const pct = headerMap.pct !== undefined && Number.isFinite(parseNumber(row[headerMap.pct])) ? Number(parseNumber(row[headerMap.pct])) : null;

      if (!byRubro[currentRubro]) byRubro[currentRubro] = { products: {}, totals: initTotals() };

      const key = `${codigo} ${descripcion}`.trim();
      const prod = byRubro[currentRubro].products[key] || { codigo, descripcion: String(descripcion).trim(), cantidad: 0, neto: 0, utilidad: 0, iva: 0, total: 0, costo: 0, pct: null };

      prod.cantidad += cantidad;
      prod.neto += neto;
      prod.utilidad += utilidad;
      prod.iva += iva;
      prod.total += total;
      prod.costo += costo;
      if (pct !== null) prod.pct = pct;

      byRubro[currentRubro].products[key] = prod;

      const t = byRubro[currentRubro].totals;
      t.cantidad += cantidad;
      t.neto += neto;
      t.utilidad += utilidad;
      t.iva += iva;
      t.total += total;
      t.costo += costo;
    }

    const rubros = Object.keys(byRubro).map((r) => {
      const prods = Object.values(byRubro[r].products);
      const totals = byRubro[r].totals;
      const pct_util = totals.pct_util !== undefined ? totals.pct_util : null;
      return { rubro: r, products: prods, totals: { ...totals, pct_util } };
    });

    const global = initTotals();
    for (const r of rubros) {
      global.cantidad += r.totals.cantidad;
      global.neto += r.totals.neto;
      global.utilidad += r.totals.utilidad;
      global.iva += r.totals.iva;
      global.total += r.totals.total;
      global.costo += r.totals.costo;
    }
    global.pct_util = global.neto !== 0 ? (global.utilidad / global.neto) * 100 : null;

    return { rubros, global };
  }

  function initTotals() {
    return { cantidad: 0, neto: 0, utilidad: 0, iva: 0, total: 0, costo: 0, pct_util: undefined };
  }

  function parseNumber(v) {
    if (v === null || v === undefined) return NaN;
    let s = String(v).trim();
    if (s === '') return NaN;
    s = s.replace(/\s+/g, '');
    const negative = /^\(.*\)$/.test(s);
    if (negative) s = s.replace(/[()]/g, '');
    s = s.replace('%', '');
    const comma = s.indexOf(',');
    if (comma > -1) {
      s = s.replace(/\./g, '');
      const lastComma = s.lastIndexOf(',');
      s = s.substring(0, lastComma) + '.' + s.substring(lastComma + 1);
    }
    s = s.replace(/[^0-9.\-]/g, '');
    let n = Number(s);
    if (negative) n = -Math.abs(n);
    return isNaN(n) ? NaN : n;
  }

  function sortAndTake(products, n = 10) {
    const sorted = [...(products || [])];
    switch (sortBy) {
      case 'rotacion':
        sorted.sort((a, b) => (b.cantidad || 0) - (a.cantidad || 0));
        break;
      case 'utilidad':
        sorted.sort((a, b) => (b.utilidad || 0) - (a.utilidad || 0));
        break;
      case 'facturacion':
        sorted.sort((a, b) => (b.total || 0) - (a.total || 0));
        break;
      case 'pct':
        sorted.sort((a, b) => ((b.pct !== null && b.pct !== undefined) ? b.pct : -Infinity) - ((a.pct !== null && a.pct !== undefined) ? a.pct : -Infinity));
        break;
      default:
        break;
    }
    return sorted.slice(0, n);
  }

  function getTopGeneral(n = 100) {
    if (!report) return [];
    const all = [];
    report.rubros.forEach((r) => {
      (r.products || []).forEach((p) => {
        all.push({
          ...p,
          rubro: r.rubro
        });
      });
    });
    return sortAndTake(all, n);
  }

  function downloadXLSX() {
    if (!report) return;
    const wb = XLSX.utils.book_new();

    const topRows = [
      ['Rubro', 'Rank', 'Código/Descripción', 'Cantidad', 'Neto', 'Utilidad', 'IVA', 'Total', 'Costo', '% Utilidad']
    ];
    report.rubros.forEach((r) => {
      const top = sortAndTake(r.products || [], 10);
      if (top.length === 0) {
        topRows.push([r.rubro, '', '(sin productos)', '', '', '', '', '', '', '']);
      } else {
        top.forEach((p, idx) => {
          topRows.push([
            r.rubro,
            idx + 1,
            `${p.codigo ?? ''} ${p.descripcion ?? ''}`.trim(),
            p.cantidad ?? 0,
            p.neto ?? 0,
            p.utilidad ?? 0,
            p.iva ?? 0,
            p.total ?? 0,
            p.costo ?? 0,
            p.pct ?? ''
          ]);
        });
      }
      topRows.push([]);
    });
    const wsTop = XLSX.utils.aoa_to_sheet(topRows);
    XLSX.utils.book_append_sheet(wb, wsTop, 'Top 10 por Rubro');

    const topGeneral = getTopGeneral(100);
    const genRows = [
      ['Rank', 'Rubro', 'Código/Descripción', 'Cantidad', 'Neto', 'Utilidad', 'IVA', 'Total', 'Costo', '% Utilidad']
    ];
    topGeneral.forEach((p, idx) => {
      genRows.push([
        idx + 1,
        p.rubro,
        `${p.codigo ?? ''} ${p.descripcion ?? ''}`.trim(),
        p.cantidad ?? 0,
        p.neto ?? 0,
        p.utilidad ?? 0,
        p.iva ?? 0,
        p.total ?? 0,
        p.costo ?? 0,
        p.pct ?? ''
      ]);
    });
    const wsGen = XLSX.utils.aoa_to_sheet(genRows);
    XLSX.utils.book_append_sheet(wb, wsGen, 'Top 100 General');

    const allRows = [
      ['Rubro', 'Código/Descripción', 'Cantidad', 'Neto', 'Utilidad', 'IVA', 'Total', 'Costo', '% Utilidad']
    ];
    report.rubros.forEach((r) => {
      (r.products || []).forEach((p) => {
        allRows.push([
          r.rubro,
          `${p.codigo ?? ''} ${p.descripcion ?? ''}`.trim(),
          p.cantidad ?? 0,
          p.neto ?? 0,
          p.utilidad ?? 0,
          p.iva ?? 0,
          p.total ?? 0,
          p.costo ?? 0,
          p.pct ?? ''
        ]);
      });
      allRows.push([]);
    });
    const wsAll = XLSX.utils.aoa_to_sheet(allRows);
    XLSX.utils.book_append_sheet(wb, wsAll, 'Todos los Productos');

    const g = report.global || initTotals();
    const wsTotals = XLSX.utils.aoa_to_sheet([
      ['Campo', 'Valor'],
      ['Cantidad Total', g.cantidad ?? 0],
      ['Neto Total', g.neto ?? 0],
      ['Utilidad Total', g.utilidad ?? 0],
      ['IVA Total', g.iva ?? 0],
      ['Facturación Total', g.total ?? 0],
      ['Costo Total', g.costo ?? 0],
      ['% Utilidad Global', g.pct_util !== null && g.pct_util !== undefined ? (g.pct_util.toFixed ? g.pct_util.toFixed(2) + '%' : String(g.pct_util)) : '-']
    ]);
    XLSX.utils.book_append_sheet(wb, wsTotals, 'Totales Generales');

    XLSX.writeFile(wb, 'analisis_por_rubro.xlsx');
  }

  return (
    <div className="container py-4">
      <h2 className="h4 mb-2">Analizador de Ventas por Rubro</h2>
      <p className="mb-3">Subí el Excel exportado por tu sistema (xls/xlsx). El parser usa la columna <strong>Utilidad</strong> y la columna de <strong>% de Utilidad</strong> tal cual.</p>

      <div className="d-flex align-items-center mb-3 gap-2 flex-wrap">
        <input
          className="form-control form-control-sm me-2"
          type="file"
          accept=".xlsx,.xls"
          style={{ maxWidth: '340px' }}
          onChange={(e) => {
            const f = e.target.files && e.target.files[0];
            if (f) readFile(f);
          }}
        />

        <div className="btn-group" role="group" aria-label="Acciones">
          <button className="btn btn-success btn-sm" onClick={downloadXLSX} disabled={!report}>
            📥 Descargar Excel
          </button>

          <button
            className={`btn btn-sm ${showGeneral ? 'btn-secondary' : 'btn-outline-secondary'}`}
            onClick={() => setShowGeneral(true)}
            disabled={!report}
            title="Mostrar Top 100 global"
          >
            🔎 Análisis General
          </button>

          {showGeneral && (
            <button className="btn btn-sm btn-outline-primary" onClick={() => setShowGeneral(false)} title="Volver a vista por rubros">
              ↩ Volver a Rubros
            </button>
          )}
        </div>
      </div>

      {report && (
        <div className="d-flex justify-content-center mb-3">
          <div className="btn-group" role="group" aria-label="Orden" style={{ flexWrap: 'wrap' }}>
            <button
              className={`btn btn-sm ${sortBy === 'rotacion' ? 'btn-primary' : 'btn-outline-primary'} me-1 mb-1`}
              onClick={() => setSortBy('rotacion')}
            >
              🔄 Rotación
            </button>
            <button
              className={`btn btn-sm ${sortBy === 'utilidad' ? 'btn-success' : 'btn-outline-success'} me-1 mb-1`}
              onClick={() => setSortBy('utilidad')}
            >
              💰 Utilidad
            </button>
            <button
              className={`btn btn-sm ${sortBy === 'facturacion' ? 'btn-warning text-dark' : 'btn-outline-warning'} me-1 mb-1`}
              onClick={() => setSortBy('facturacion')}
            >
              📊 Facturación
            </button>
            <button
              className={`btn btn-sm ${sortBy === 'pct' ? 'btn-info text-white' : 'btn-outline-info'} me-1 mb-1`}
              onClick={() => setSortBy('pct')}
            >
              📈 % Utilidad
            </button>
          </div>
        </div>
      )}

      {error && <div className="alert alert-danger py-1">{error}</div>}
      {!report && <div className="text-muted">Esperando archivo...</div>}

      {report && (
        <div className="mb-4">
          {showGeneral ? (
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="card-title mb-0">Análisis General — Top 100</h5>
                  <small className="text-muted">Ordenado por: <strong>{sortBy === 'rotacion' ? 'Rotación' : sortBy === 'utilidad' ? 'Utilidad' : sortBy === 'facturacion' ? 'Facturación' : '% Utilidad'}</strong></small>
                </div>

                <div className="table-responsive">
                  <table className="table table-sm table-striped mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{width: '40px'}}>#</th>
                        <th>Rubro</th>
                        <th>Código/Descripción</th>
                        <th style={{width: '90px'}}>Cantidad</th>
                        <th style={{width: '110px'}}>Neto</th>
                        <th style={{width: '110px'}}>Utilidad</th>
                        <th style={{width: '90px'}}>IVA</th>
                        <th style={{width: '110px'}}>Total</th>
                        <th style={{width: '110px'}}>Costo</th>
                        <th style={{width: '90px'}}>% Util</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getTopGeneral(100).map((p, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>{p.rubro}</td>
                          <td>{p.codigo} {p.descripcion}</td>
                          <td>{formatNumber(p.cantidad)}</td>
                          <td>{formatCurrency(p.neto)}</td>
                          <td>{formatCurrency(p.utilidad)}</td>
                          <td>{formatCurrency(p.iva)}</td>
                          <td>{formatCurrency(p.total)}</td>
                          <td>{formatCurrency(p.costo)}</td>
                          <td>{p.pct !== null && p.pct !== undefined ? Number(p.pct).toFixed(2) + '%' : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            report.rubros.map((r) => {
              const top10 = sortAndTake(r.products || [], 10);
              return (
                <div key={r.rubro} className="card mb-3 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h5 className="card-title mb-0">Rubro: {r.rubro}</h5>
                      <small className="text-muted">
                        Totales — Cant: {formatNumber(r.totals.cantidad)} | Neto: {formatCurrency(r.totals.neto)} | Utilidad: {formatCurrency(r.totals.utilidad)} | IVA: {formatCurrency(r.totals.iva)} | Facturación: {formatCurrency(r.totals.total)} | % Util: {r.totals.pct_util !== null && r.totals.pct_util !== undefined ? r.totals.pct_util.toFixed(2) + '%' : '-'}
                      </small>
                    </div>

                    <div className="table-responsive">
                      <table className="table table-sm table-striped mb-0">
                        <thead className="table-light">
                          <tr>
                            <th style={{width: '40px'}}>#</th>
                            <th>Código/Descripción</th>
                            <th style={{width: '90px'}}>Cantidad</th>
                            <th style={{width: '110px'}}>Neto</th>
                            <th style={{width: '110px'}}>Utilidad</th>
                            <th style={{width: '90px'}}>IVA</th>
                            <th style={{width: '110px'}}>Total</th>
                            <th style={{width: '110px'}}>Costo</th>
                            <th style={{width: '90px'}}>% Util</th>
                          </tr>
                        </thead>
                        <tbody>
                          {top10.map((p, idx) => (
                            <tr key={idx}>
                              <td>{idx + 1}</td>
                              <td>{p.codigo} {p.descripcion}</td>
                              <td>{formatNumber(p.cantidad)}</td>
                              <td>{formatCurrency(p.neto)}</td>
                              <td>{formatCurrency(p.utilidad)}</td>
                              <td>{formatCurrency(p.iva)}</td>
                              <td>{formatCurrency(p.total)}</td>
                              <td>{formatCurrency(p.costo)}</td>
                              <td>{p.pct !== null && p.pct !== undefined ? Number(p.pct).toFixed(2) + '%' : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="small text-muted mt-2">Mostrando top 10 según: <strong>{sortBy === 'rotacion' ? 'Rotación' : sortBy === 'utilidad' ? 'Utilidad' : sortBy === 'facturacion' ? 'Facturación' : 'Utilidad %'}</strong> (aplica sobre todos los productos del rubro).</div>
                  </div>
                </div>
              );
            })
          )}

          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Totales Generales</h5>
              <div className="small">Cantidad Articulos Vendidos: {formatNumber(report.global.cantidad)}</div>
              <div className="small">Facturacion Neta total: {formatCurrency(report.global.neto)}</div>
              <div className="small">IVA total: {formatCurrency(report.global.iva)}</div>
              <div className="small">Facturación total: {formatCurrency(report.global.total)}</div>
              <div className="small">Costo total: {formatCurrency(report.global.costo)}</div>
              <div className="small">Utilidad total: {formatCurrency(report.global.utilidad)}</div>
              <div className="small">% Utilidad global (siempre calculada): {report.global.pct_util !== null && report.global.pct_util !== undefined ? report.global.pct_util.toFixed(2) + '%' : '-'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// formateadores
function formatCurrency(v) {
  if (!Number.isFinite(v)) return 'AR$ 0,00';
  return v.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatNumber(v) {
  if (!Number.isFinite(v)) return '0';
  return Number(v).toLocaleString('es-AR');
}
