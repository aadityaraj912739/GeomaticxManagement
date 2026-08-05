import { useEffect, useState } from "react";
import { api } from "../services/api";

const newField = () => ({ key: "", label: "", type: "text", required: false, optionsText: "" });

export default function SurveyForms() {
  const [rows, setRows] = useState([]);
  const [name, setName] = useState("");
  const [fields, setFields] = useState([newField()]);
  const [error, setError] = useState("");
  const load = () => api("/survey-forms").then(setRows).catch(e => setError(e.message));

  useEffect(() => { load(); }, []);

  const updateField = (index, changes) => setFields(current =>
    current.map((field, fieldIndex) => fieldIndex === index ? { ...field, ...changes } : field)
  );

  const save = async event => {
    event.preventDefault();
    setError("");
    try {
      const preparedFields = fields.map(({ optionsText, ...field }) => ({
        ...field,
        ...(field.type === "select" ? {
          options: optionsText.split(",").map(option => option.trim()).filter(Boolean)
        } : {})
      }));
      await api("/survey-forms", {
        method: "POST",
        body: JSON.stringify({ name, fields: preparedFields })
      });
      setName("");
      setFields([newField()]);
      load();
    } catch (e) { setError(e.message); }
  };

  return <section>
    <span className="eyebrow">Configurable collection</span>
    <h2>Survey form builder</h2>
    {error && <p className="error">{error}</p>}
    <form onSubmit={save} className="builder">
      <label>Form name<input required value={name} onChange={event => setName(event.target.value)}/></label>
      {fields.map((field, index) => <div className="field-row survey-builder-row" key={index}>
        <input placeholder="field_key" required value={field.key} onChange={event => updateField(index, { key: event.target.value })}/>
        <input placeholder="Question label" required value={field.label} onChange={event => updateField(index, { label: event.target.value })}/>
        <select value={field.type} onChange={event => updateField(index, { type: event.target.value })}>
          <option value="text">Text</option>
          <option value="number">Number</option>
          <option value="date">Date</option>
          <option value="select">Select</option>
          <option value="textarea">Textarea</option>
        </select>
        <label className="check"><input type="checkbox" checked={field.required} onChange={event => updateField(index, { required: event.target.checked })}/>Required</label>
        {field.type === "select" && <input className="survey-options" placeholder="Options: Good, Damaged, Missing" required value={field.optionsText} onChange={event => updateField(index, { optionsText: event.target.value })}/>}
        {fields.length > 1 && <button type="button" className="link danger" onClick={() => setFields(current => current.filter((_, fieldIndex) => fieldIndex !== index))}>Remove</button>}
      </div>)}
      <div className="actions">
        <button type="button" className="secondary" onClick={() => setFields(current => [...current, newField()])}>Add field</button>
        <button>Save form</button>
      </div>
    </form>
    <div className="cards">{rows.map(form => <article className="card" key={form.id}>
      <strong className="small">{form.name}</strong>
      <span>{form.fields?.length || 0} fields</span>
    </article>)}</div>
  </section>;
}
