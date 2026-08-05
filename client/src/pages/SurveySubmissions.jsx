import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

const projectName = project => `${project.code} - ${project.name}`;

export default function SurveySubmissions() {
  const [forms, setForms] = useState([]);
  const [projects, setProjects] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [surveyFormId, setSurveyFormId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [answers, setAnswers] = useState({});
  const [location, setLocation] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const selectedForm = useMemo(() => forms.find(form => form.id === surveyFormId), [forms, surveyFormId]);

  const load = async () => {
    try {
      const [formRows, projectRows, submissionRows] = await Promise.all([
        api("/survey-forms"), api("/projects"), api("/survey-submissions")
      ]);
      setForms(formRows.filter(form => form.active));
      setProjects(projectRows);
      setSubmissions(submissionRows);
    } catch (e) { setError(e.message); }
  };

  useEffect(() => { load(); }, []);

  const captureLocation = () => {
    setError("");
    if (!navigator.geolocation) return setError("Location is not supported by this browser");
    navigator.geolocation.getCurrentPosition(
      position => {
        setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setMessage("Survey location captured");
      },
      () => setError("Location permission was denied or location is unavailable")
    );
  };

  const submit = async event => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await api("/survey-submissions", {
        method: "POST",
        body: JSON.stringify({ surveyFormId, projectId: projectId || null, answers, ...location })
      });
      setAnswers({});
      setLocation({});
      setMessage("Survey submitted successfully");
      await load();
    } catch (e) { setError(e.message); }
  };

  const updateAnswer = (key, value) => setAnswers(current => ({ ...current, [key]: value }));
  const fieldInput = field => {
    const value = answers[field.key] ?? "";
    if (field.type === "textarea") return <textarea required={field.required} value={value} onChange={event => updateAnswer(field.key, event.target.value)}/>;
    if (field.type === "select" && field.options?.length) {
      return <select required={field.required} value={value} onChange={event => updateAnswer(field.key, event.target.value)}>
        <option value="">Select</option>
        {field.options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>;
    }
    return <input type={field.type === "number" || field.type === "date" ? field.type : "text"} required={field.required} value={value} onChange={event => updateAnswer(field.key, event.target.value)}/>;
  };

  return <section>
    <div className="page-head">
      <div><span className="eyebrow">Field data collection</span><h2>Survey submissions</h2></div>
      <span className="count">{submissions.length} submissions</span>
    </div>
    <p className="muted">Choose an active form, answer its questions and optionally attach your current field location.</p>
    {error && <p className="error">{error}</p>}
    {message && <p className="success">{message}</p>}
    <form className="builder survey-entry" onSubmit={submit}>
      <label>Survey form<select required value={surveyFormId} onChange={event => { setSurveyFormId(event.target.value); setAnswers({}); }}>
        <option value="">Select form</option>
        {forms.map(form => <option key={form.id} value={form.id}>{form.name}</option>)}
      </select></label>
      <label>Project<select value={projectId} onChange={event => setProjectId(event.target.value)}>
        <option value="">No project selected</option>
        {projects.map(project => <option key={project.id} value={project.id}>{projectName(project)}</option>)}
      </select></label>
      {selectedForm?.fields?.map(field => <label key={field.key}>{field.label}{fieldInput(field)}</label>)}
      {selectedForm && <div className="survey-location">
        <span>{location.latitude ? `Location: ${Number(location.latitude).toFixed(5)}, ${Number(location.longitude).toFixed(5)}` : "Location not captured"}</span>
        <button type="button" className="secondary" onClick={captureLocation}>Capture location</button>
      </div>}
      {selectedForm && <div className="actions"><button>Submit survey</button></div>}
    </form>
    <div className="table-wrap"><table><thead><tr><th>Date</th><th>Form</th><th>Project</th><th>Submitted by</th><th>Status</th><th>Answers</th></tr></thead>
      <tbody>{submissions.length ? submissions.map(row => <tr key={row.id}>
        <td>{new Date(row.createdAt).toLocaleString()}</td>
        <td>{row.SurveyForm?.name || "-"}</td>
        <td>{row.Project?.name || "-"}</td>
        <td>{row.submittedBy?.name || "-"}</td>
        <td><span className="status">{row.status}</span></td>
        <td>{Object.entries(row.answers || {}).map(([key, value]) => `${key}: ${value}`).join(" | ") || "-"}</td>
      </tr>) : <tr><td className="empty" colSpan="6">No survey submissions yet.</td></tr>}</tbody>
    </table></div>
  </section>;
}
