import { useEffect, useState, useCallback } from "react";
import api from "../api.js";

const NORTE_CODES = ["O-707A", "O-707B", "O-707C", "O-707D", "O-707E", "O-707F"];
const SUL_CODES = ["O-717A", "O-717B", "O-717C", "O-717D", "O-717E", "O-717F"];

const EMPTY_ROW = {
  lavado_data: null,
  lavado_grupo: null,
  operando_data: null,
  operando_grupo: null,
};

export default function FiltersTable() {
  const [rows, setRows] = useState(() => {
    const initial = {};
    for (const code of [...NORTE_CODES, ...SUL_CODES]) {
      initial[code] = { ...EMPTY_ROW, filter_code: code };
    }
    return initial;
  });

  useEffect(() => {
    let cancelled = false;
    api
      .get("/pressure-filters")
      .then((res) => {
        if (cancelled) return;
        setRows((prev) => {
          const next = { ...prev };
          for (const row of res.data) {
            next[row.filter_code] = row;
          }
          return next;
        });
      })
      .catch(() => {
        /* handled by interceptor */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((filter_code, field, rawValue) => {
    const value = rawValue === "" ? null : rawValue;
    setRows((prev) => {
      const current = prev[filter_code] || { ...EMPTY_ROW, filter_code };
      if (current[field] === value) return prev;
      return { ...prev, [filter_code]: { ...current, [field]: value } };
    });
    api
      .put(`/pressure-filters/${filter_code}`, { [field]: value })
      .catch(() => {
        /* handled by interceptor */
      });
  }, []);

  const renderRow = (code) => {
    const row = rows[code] || { ...EMPTY_ROW, filter_code: code };
    return (
      <tr key={code}>
        <td className="filter-code">{code}</td>
        <td>
          <input
            type="date"
            defaultValue={row.lavado_data || ""}
            onBlur={(e) => persist(code, "lavado_data", e.target.value)}
          />
        </td>
        <td>
          <input
            type="text"
            maxLength={100}
            defaultValue={row.lavado_grupo || ""}
            onBlur={(e) => persist(code, "lavado_grupo", e.target.value)}
          />
        </td>
        <td>
          <input
            type="date"
            defaultValue={row.operando_data || ""}
            onBlur={(e) => persist(code, "operando_data", e.target.value)}
          />
        </td>
        <td>
          <input
            type="text"
            maxLength={100}
            defaultValue={row.operando_grupo || ""}
            onBlur={(e) => persist(code, "operando_grupo", e.target.value)}
          />
        </td>
      </tr>
    );
  };

  return (
    <div className="filters-panel">
      <h2 className="filters-title">
        Filtros de Pressão <span className="filters-title-tag">( W-8 )</span>
      </h2>
      <table className="filters-table">
        <thead>
          <tr>
            <th rowSpan={2}>FILTRO</th>
            <th colSpan={2}>Lavado</th>
            <th colSpan={2}>Operando</th>
          </tr>
          <tr>
            <th>Data</th>
            <th>Grupo</th>
            <th>Data</th>
            <th>Grupo</th>
          </tr>
        </thead>
        <tbody>
          <tr className="filters-section">
            <th>Norte</th>
            <th>Data</th>
            <th>Grupo</th>
            <th>Data</th>
            <th>Grupo</th>
          </tr>
          {NORTE_CODES.map(renderRow)}
          <tr className="filters-section">
            <th>Sul</th>
            <th>Data</th>
            <th>Grupo</th>
            <th>Data</th>
            <th>Grupo</th>
          </tr>
          {SUL_CODES.map(renderRow)}
        </tbody>
      </table>
    </div>
  );
}
