import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

export default function CrudPage({ title, endpoint, fields }) {
  const empty = useMemo(() => Object.fromEntries(fields.map(field => [field.key, field.default ?? ""])), [fields]);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [lookups, setLookups] = useState({});
  const [error, setError] = useState("");
  const load = () => api(endpoint).then(setRows).catch(e => setError(e.message));
  const lookupEndpoints = useMemo(
    () => [...new Set(fields.map(field => field.optionsEndpoint).filter(Boolean))],
    [fields]
  );
  const loadLookups = () => Promise.all(
    lookupEndpoints.map(path => api(path).then(data => [path, data]))
  ).then(entries => setLookups(Object.fromEntries(entries)));

  useEffect(() => {
    load();
    loadLookups().catch(e => setError(e.message));
  }, [endpoint]);

  const optionsFor = field => field.options || lookups[field.optionsEndpoint] || [];
  const optionValue = option => typeof option === "string" ? option : option.id;
  const optionLabel = (field, option) => typeof option === "string"
    ? option
    : field.optionLabel?.(option) || option.name || option.title;
  const displayValue = (field, value) => {
    const match = optionsFor(field).find(option => optionValue(option) === value);
    return match ? optionLabel(field, match) : String(value ?? "-");
  };

  const submit = async event => {
    event.preventDefault();
    setError("");
    try {
      const body = Object.fromEntries(Object.entries(form).filter(([, value]) => value !== ""));
      await api(editing ? `${endpoint}/${editing}` : endpoint, {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(body)
      });
      setForm(empty);
      setEditing(null);
      load();
      loadLookups().catch(e => setError(e.message));
    } catch (e) { setError(e.message); }
  };

  const edit = row => {
    setEditing(row.id);
    setForm(Object.fromEntries(fields.map(field => [field.key, row[field.key] ?? field.default ?? ""])));
  };
  const remove = async id => {
    if (!confirm("Delete this record?")) return;
    try {
      await api(`${endpoint}/${id}`, { method: "DELETE" });
      load();
      loadLookups().catch(e => setError(e.message));
    } catch (e) { setError(e.message); }
  };

  return <section>
    <div className="page-head"><div><span className="eyebrow">Management</span><h2>{title}</h2></div><span className="count">{rows.length} records</span></div>
    {error && <p className="error">{error}</p>}
    <form className="form-grid" onSubmit={submit}>
      {fields.map(field => field.type === "select" || field.optionsEndpoint
        ? <label key={field.key}>{field.label}<select required={field.required} value={form[field.key]} onChange={e => setForm({ ...form, [field.key]: e.target.value })}><option value="">Select</option>{optionsFor(field).map(option => <option key={optionValue(option)} value={optionValue(option)}>{optionLabel(field, option)}</option>)}</select></label>
        : field.type === "checkbox"
          ? <label className="check form-check" key={field.key}><input type="checkbox" checked={Boolean(form[field.key])} onChange={e => setForm({ ...form, [field.key]: e.target.checked })}/>{field.label}</label>
          : <label key={field.key}>{field.label}<input type={field.type || "text"} required={field.required} value={form[field.key]} onChange={e => setForm({ ...form, [field.key]: e.target.value })}/></label>)}
      <div className="actions"><button>{editing ? "Update" : "Add record"}</button>{editing && <button type="button" className="secondary" onClick={() => { setEditing(null); setForm(empty); }}>Cancel</button>}</div>
    </form>
    <div className="table-wrap"><table><thead><tr>{fields.map(field => <th key={field.key}>{field.label}</th>)}<th>Actions</th></tr></thead>
      <tbody>{rows.length ? rows.map(row => <tr key={row.id}>{fields.map(field => <td key={field.key}>{field.type === "checkbox" ? (row[field.key] ? "Active" : "Inactive") : displayValue(field, row[field.key])}</td>)}<td><button className="link" onClick={() => edit(row)}>Edit</button><button className="link danger" onClick={() => remove(row.id)}>Delete</button></td></tr>) : <tr><td colSpan={fields.length + 1} className="empty">No data yet. Add the first record above.</td></tr>}</tbody>
    </table></div>
  </section>;
}
