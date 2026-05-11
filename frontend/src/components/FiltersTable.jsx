import { useEffect, useState, useCallback } from "react";
import api from "../api.js";

const NORTE_CODES = ["O-717A", "O-717B", "O-717C", "O-717D", "O-717E", "O-717F"];
const SUL_CODES = ["O-707A", "O-707B", "O-707C", "O-707D", "O-707E", "O-707F"];

const EMPTY_ROW = {
  lavado_data: null,
  lavado_grupo: null,
  operando_data: null,
  operando_grupo: null,
};

function isoToDisplay(iso) {
  if (!iso) return "";
  const match = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return "";
  const [, year, month, day] = match;
  return `${day}/${month}/${year.slice(-2)}`;
}

function maskDateInput(value) {
  const digits = value.replace(/\D/g, "").slice(0, 6);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function displayToIso(text) {
  const match = text.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const yy = parseInt(match[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const year = yy < 70 ? 2000 + yy : 1900 + yy;
  const d = new Date(year, month - 1, day);
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  ) {
    return null;
  }
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function DateInput({ value, onCommit }) {
  const [text, setText] = useState(() => isoToDisplay(value));
  const [lastValue, setLastValue] = useState(value);

  if (value !== lastValue) {
    setLastValue(value);
    setText(isoToDisplay(value));
  }

  const handleBlur = () => {
    if (text === "") {
      onCommit("");
      return;
    }
    const iso = displayToIso(text);
    if (iso) {
      onCommit(iso);
    } else {
      setText(isoToDisplay(value));
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      maxLength={8}
      value={text}
      onChange={(e) => setText(maskDateInput(e.target.value))}
      onBlur={handleBlur}
    />
  );
}

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
          <DateInput
            value={row.lavado_data}
            onCommit={(v) => persist(code, "lavado_data", v)}
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
          <DateInput
            value={row.operando_data}
            onCommit={(v) => persist(code, "operando_data", v)}
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
      <h1 className="panel-title">
        Filtros de Pressão <span className="panel-title-tag">( W-8 )</span>
      </h1>
      <table className="filters-table">
        <colgroup>
          <col className="col-filtro" />
          <col className="col-data" />
          <col className="col-grupo" />
          <col className="col-data" />
          <col className="col-grupo" />
        </colgroup>
        <thead>
          <tr>
            <th>FILTRO</th>
            <th colSpan={2}>Lavado</th>
            <th colSpan={2}>Operando</th>
          </tr>
        </thead>
        <tbody>
          <tr className="filters-section">
            <th>Sul</th>
            <th>Data</th>
            <th>Grupo</th>
            <th>Data</th>
            <th>Grupo</th>
          </tr>
          {SUL_CODES.map(renderRow)}
          <tr className="filters-section">
            <th>Norte</th>
            <th>Data</th>
            <th>Grupo</th>
            <th>Data</th>
            <th>Grupo</th>
          </tr>
          {NORTE_CODES.map(renderRow)}
        </tbody>
      </table>
    </div>
  );
}
