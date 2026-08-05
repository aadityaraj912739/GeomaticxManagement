import { useEffect, useState } from "react";
import { api } from "../services/api";

const sections = [
  ["employeeDashboard", "Employee dashboard"],
  ["projectManagerDashboard", "Project manager dashboard"],
  ["hrDashboard", "HR dashboard"],
  ["fieldOperationDashboard", "Field-operation dashboard"],
  ["projectProgressDashboard", "Project progress dashboard"],
  ["processingDashboard", "Processing dashboard"],
  ["securityReadinessDashboard", "Security and readiness dashboard"],
  ["productionDataDashboard", "Production-data dashboard"],
  ["mobileReadinessDashboard", "Android and iOS readiness dashboard"],
  ["goLiveCentre", "Go-Live Centre"]
];

export default function Reporting({ currentUser }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { api("/reports/management").then(setData).catch(e => setError(e.message)); }, []);
  return <section>
    <div className="page-head"><div><span className="eyebrow">Management reporting</span><h2>Dashboards and summaries</h2></div><span className="count">{currentUser.role}</span></div>
    <p className="muted">Different teams see different operational signals; senior management sees the exceptions and readiness gates in one place.</p>
    {error && <p className="error">{error}</p>}
    {!data ? <div className="card"><strong>Loading</strong><span>Fetching live metrics</span></div> : <>
      <div className="cards">{sections.map(([key, label]) => <article className="card" key={key}><strong>{Object.values(data[key] || {}).reduce((sum, value) => sum + (typeof value === "number" ? value : 0), 0) || "—"}</strong><span>{label}</span></article>)}</div>
      <div className="table-wrap" style={{ marginTop: 20 }}><table><thead><tr><th>Exception / pending action</th><th>Type</th><th>Status</th></tr></thead><tbody>{(data.exceptions || []).slice(0, 8).map(item => <tr key={item.id}><td>{item.label || item.id}</td><td>{item.type}</td><td>{item.status || "-"}</td></tr>)}{!(data.exceptions || []).length && <tr><td className="empty" colSpan="3">No exceptions queued.</td></tr>}</tbody></table></div>
      <div className="table-wrap" style={{ marginTop: 20 }}><table><thead><tr><th>Pending action</th><th>Type</th><th>Status</th></tr></thead><tbody>{(data.pendingActions || []).slice(0, 8).map(item => <tr key={item.id}><td>{item.label || item.id}</td><td>{item.type}</td><td>{item.status || "-"}</td></tr>)}{!(data.pendingActions || []).length && <tr><td className="empty" colSpan="3">No pending actions.</td></tr>}</tbody></table></div>
    </>}
  </section>;
}