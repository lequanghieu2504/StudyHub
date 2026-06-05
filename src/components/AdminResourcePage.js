'use client';

import { useEffect, useMemo, useState } from 'react';

export default function AdminResourcePage({ resource, title, fields }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({});
  const [message, setMessage] = useState('');

  const endpoint = useMemo(() => `/api/admin/${resource}`, [resource]);
  const columnKeys = rows[0] ? Object.keys(rows[0]) : [];

  const loadData = () => {
    fetch(endpoint)
      .then((res) => res.json())
      .then((json) => setRows(json.data || []));
  };

  useEffect(loadData, [endpoint]);

  const submit = async (e) => {
    e.preventDefault();
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (!res.ok) return setMessage(json.error || 'Failed to create');
    setMessage('Created successfully');
    setForm({});
    loadData();
  };

  return (
    <section className="card">
      <h1>{title}</h1>
      {fields.length > 0 && (
        <form className="grid grid-cols-2" onSubmit={submit}>
          {fields.map((field) => (
            <label key={field.name}>
              {field.label}
              <input
                type={field.type || 'text'}
                value={form[field.name] || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
                required={field.required !== false}
              />
            </label>
          ))}
          <button type="submit">Add</button>
        </form>
      )}
      {message && <p className="muted">{message}</p>}
      {rows.length > 0 && (
        <table>
          <thead>
            <tr>{columnKeys.map((key) => <th key={key}>{key}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {columnKeys.map((key) => <td key={key}>{String(row[key])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
