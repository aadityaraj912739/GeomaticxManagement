import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  PieChart, Pie, Cell
} from "recharts";
import { api } from "../services/api";
import "../marketing.css";

const initial = { title: "", clientName: "", contactPerson: "", enquiryNumber: "", source: "OTHER", sourceLink: "", scope: "", location: "", service: "", estimatedValue: "", submissionDeadline: "", emdAmount: "", tenderFee: "", eligibilityCriteria: "", assignedExecutiveId: "" };
const money = value => Number(value || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const compactMoney = value => {
  const n = Number(value || 0);
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
  return `₹${n}`;
};
const label = value => String(value || "-").replaceAll("_", " ");
const sources = ["GEM", "CPPP", "EPROCURE", "PRIVATE_ENQUIRY", "EXISTING_CLIENT", "EMAIL", "WEBSITE", "LINKEDIN", "PARTNER", "OTHER"];

// Professional teal/green brand palette for charts
const PIE_COLORS = ["#0d9e7c", "#d4a63d", "#1877f2", "#7c5ce7", "#e74c3c", "#1da1f2", "#42b72a", "#e1306c", "#8b9dc3", "#f39c12", "#2c3e50", "#16a085", "#c0392b", "#f7b928", "#95a5a6"];

const STATUS_TONE = {
  NEW: ["#e7f3ff", "#166fe5"],
  SCREENING: ["#e7f3ff", "#166fe5"],
  MANAGER_REVIEW: ["#fff4d6", "#9a6b00"],
  ADMIN_REVIEW: ["#fff4d6", "#9a6b00"],
  BID_APPROVED: ["#efeaff", "#6c3df2"],
  BID_PREPARATION: ["#efeaff", "#6c3df2"],
  SUBMITTED: ["#def0e6", "#0d694e"],
  TECHNICAL_EVALUATION: ["#def0e6", "#0d694e"],
  QUALIFIED: ["#def0e6", "#0d694e"],
  FINANCIAL_EVALUATION: ["#def0e6", "#0d694e"],
  NEGOTIATION: ["#def0e6", "#0d694e"],
  AWARDED: ["#d9f6e7", "#0b8a4e"],
  LOST: ["#fee8e8", "#c0392b"],
  NO_BID: ["#fee8e8", "#c0392b"],
  HOLD: ["#eef1f4", "#5b6770"]
};
const tone = status => STATUS_TONE[status] || ["#e1ebe7", "#17453f"];

const STAGE_ORDER = ["NEW", "SCREENING", "MANAGER_REVIEW", "ADMIN_REVIEW", "BID_APPROVED", "BID_PREPARATION", "SUBMITTED", "TECHNICAL_EVALUATION", "QUALIFIED", "FINANCIAL_EVALUATION", "NEGOTIATION", "AWARDED", "LOST", "NO_BID", "HOLD"];

const METRICS = (summary) => [
  { label: "Active pipeline", value: summary.active ?? 0, icon: "📌", tone: "#0d9e7c" },
  { label: "Pipeline value", value: compactMoney(summary.pipelineValue), icon: "💰", tone: "#1877f2" },
  { label: "Bid preparation", value: summary.bidsInPreparation ?? 0, icon: "📝", tone: "#7c5ce7" },
  { label: "Submitted", value: summary.submitted ?? 0, icon: "📤", tone: "#16a085" },
  { label: "Awarded", value: summary.awarded ?? 0, icon: "🏆", tone: "#0b8a4e" },
  { label: "Win rate", value: `${summary.winPercentage || 0}%`, icon: "🎯", tone: "#f39c12" },
  { label: "Manager pending", value: summary.managerPending ?? 0, icon: "🗂️", tone: "#e1306c" },
  { label: "Admin pending", value: summary.adminPending ?? 0, icon: "🏛️", tone: "#c0392b" },
  { label: "Deadlines (7d)", value: summary.upcomingDeadlines ?? 0, icon: "⏰", tone: "#f7b928" },
  { label: "Overdue follow-ups", value: summary.overdueFollowUps ?? 0, icon: "🔔", tone: "#e67e22" }
];


export default function Marketing({ currentUser }) {
  const [summary, setSummary] = useState({}); const [rows, setRows] = useState([]); const [team, setTeam] = useState([]);
  const [form, setForm] = useState(initial); const [selectedId, setSelectedId] = useState(null); const [query, setQuery] = useState("");
  const [notes, setNotes] = useState(""); const [screening, setScreening] = useState("BID_RECOMMENDED"); const [managerDecision, setManagerDecision] = useState("RECOMMEND_GO"); const [adminDecision, setAdminDecision] = useState("GO_FOR_BID");
  const [cost, setCost] = useState({ category: "MANPOWER", description: "", quantity: 1, rate: "" }); const [activity, setActivity] = useState({ activityType: "FOLLOW_UP", details: "", nextFollowUpAt: "" });
  const [submission, setSubmission] = useState({ portalName: "", bidReference: "", quotedValue: "", submissionReceipt: "" }); const [result, setResult] = useState({ status: "TECHNICAL_EVALUATION", reason: "" });
  const [error, setError] = useState(""); const [message, setMessage] = useState("");
  const canManage = ["ADMIN", "MANAGER", "MARKETING_MANAGER"].includes(currentUser.role);
  const load = async (search = query) => { try { const suffix = search ? `?q=${encodeURIComponent(search)}` : ""; const [stats, opportunities, members] = await Promise.all([api("/marketing/dashboard"), api(`/marketing/opportunities${suffix}`), api("/marketing/team")]); setSummary(stats); setRows(opportunities); setTeam(members); } catch (e) { setError(e.message); } };
  useEffect(() => { load(""); }, [currentUser.id]);
  const selected = useMemo(() => rows.find(row => row.id === selectedId), [rows, selectedId]);
  const run = async (path, options, success) => { setError(""); setMessage(""); try { await api(path, options); setNotes(""); setMessage(success); await load(); } catch (e) { setError(e.message); } };
  const field = (key, value) => setForm(current => ({ ...current, [key]: value }));

  // Derived chart data (from the loaded opportunity list)
  const stageBuckets = useMemo(() => {
    const buckets = {};
    rows.forEach(row => { (buckets[row.status] = buckets[row.status] || []).push(row); });
    return STAGE_ORDER.filter(s => buckets[s]).map(s => ({
      name: label(s),
      short: label(s).split(" ")[0],
      count: buckets[s].length,
      value: buckets[s].reduce((sum, r) => sum + Number(r.estimatedValue || 0), 0)
    }));
  }, [rows]);

  const sourceBuckets = useMemo(() => {
    const buckets = {};
    rows.forEach(row => { buckets[row.source || "OTHER"] = (buckets[row.source || "OTHER"] || 0) + 1; });
    return Object.entries(buckets).map(([name, count]) => ({ name: label(name), count })).sort((a, b) => b.count - a.count);
  }, [rows]);

  const barData = stageBuckets.map(b => ({ ...b, valueCr: +(b.value / 1e7).toFixed(2) }));

  return <section className="marketing-page">
    <div className="mk-header">
      <div>
        <span className="mk-eyebrow">Lead to project · CRM pipeline</span>
        <h2 className="mk-title">Marketing Dashboard</h2>
        <p className="mk-sub">Track tenders from enquiry → bid → award, manage approvals and convert wins into projects.</p>
      </div>
      <div className="mk-header-right">
        <span className="mk-pill"><b>{summary.active || 0}</b> active opportunities</span>
        <button className="mk-add-btn" onClick={e => { const d = e.currentTarget.closest("section").querySelector("details"); d.open = !d.open; }}>＋ Add tender</button>
      </div>
    </div>
    {error && <p className="error">{error}</p>}{message && <p className="success">{message}</p>}

    {/* KPI cards */}
    <div className="mk-kpis">
      {METRICS(summary).map(({ label: l, value, icon, tone: t }) => (
        <div className="mk-kpi" key={l}>
          <span className="mk-kpi-icon" style={{ background: `${t}1a`, color: t }}>{icon}</span>
          <span className="mk-kpi-value" style={{ color: t }}>{value ?? 0}</span>
          <span className="mk-kpi-label">{l}</span>
        </div>
      ))}
    </div>


    <details className="marketing-panel"><summary>Add opportunity / tender</summary><form className="form-grid" onSubmit={async e => { e.preventDefault(); await run("/marketing/opportunities", { method: "POST", body: JSON.stringify(form) }, "Opportunity registered"); setForm(initial); }}>
      <label>Work title<input required value={form.title} onChange={e => field("title", e.target.value)}/></label><label>Client<input required value={form.clientName} onChange={e => field("clientName", e.target.value)}/></label>
      <label>Contact person<input value={form.contactPerson} onChange={e => field("contactPerson", e.target.value)}/></label><label>Tender / enquiry no.<input value={form.enquiryNumber} onChange={e => field("enquiryNumber", e.target.value)}/></label>
      <label>Source<select value={form.source} onChange={e => field("source", e.target.value)}>{sources.map(x => <option key={x}>{x}</option>)}</select></label><label>Source link<input type="url" value={form.sourceLink} onChange={e => field("sourceLink", e.target.value)}/></label>
      <label>Service<input value={form.service} onChange={e => field("service", e.target.value)}/></label><label>Location<input value={form.location} onChange={e => field("location", e.target.value)}/></label>
      <label>Estimated value<input type="number" min="0" value={form.estimatedValue} onChange={e => field("estimatedValue", e.target.value)}/></label><label>Deadline<input type="datetime-local" value={form.submissionDeadline} onChange={e => field("submissionDeadline", e.target.value)}/></label>
      <label>EMD<input type="number" min="0" value={form.emdAmount} onChange={e => field("emdAmount", e.target.value)}/></label><label>Tender fee<input type="number" min="0" value={form.tenderFee} onChange={e => field("tenderFee", e.target.value)}/></label>
      {canManage && <label>Marketing executive<select value={form.assignedExecutiveId} onChange={e => field("assignedExecutiveId", e.target.value)}><option value="">Unassigned</option>{team.filter(x => x.role === "MARKETING_EXECUTIVE").map(x => <option value={x.id} key={x.id}>{x.name}</option>)}</select></label>}
      <label>Scope<textarea value={form.scope} onChange={e => field("scope", e.target.value)}/></label><label>Eligibility criteria<textarea value={form.eligibilityCriteria} onChange={e => field("eligibilityCriteria", e.target.value)}/></label><div className="actions"><button>Register opportunity</button></div>
    </form></details>

    <div className="pipeline-toolbar"><input placeholder="Search client, tender, location or service" value={query} onChange={e => setQuery(e.target.value)}/><button onClick={() => load()}>Search</button><button className="secondary" onClick={() => { setQuery(""); load(""); }}>Clear</button></div>
    <div className="marketing-layout"><div className="table-wrap"><table><thead><tr><th>Opportunity</th><th>Client</th><th>Deadline</th><th>Value</th><th>Owner</th><th>Status</th></tr></thead><tbody>{rows.length ? rows.map(row => <tr className={selectedId === row.id ? "selected-row" : ""} key={row.id} onClick={() => setSelectedId(row.id)}><td>{row.title}<small className="block">{row.enquiryNumber || row.source}</small></td><td>{row.clientName}</td><td>{row.submissionDeadline ? new Date(row.submissionDeadline).toLocaleString() : "-"}</td><td>{money(row.estimatedValue)}</td><td>{row.assignedExecutive?.name || "Unassigned"}</td><td><span className="status" style={{ background: tone(row.status)[0], color: tone(row.status)[1] }}>{label(row.status)}</span></td></tr>) : <tr><td className="empty" colSpan="6">No matching opportunity.</td></tr>}</tbody></table></div>

      <aside className="opportunity-detail">{selected ? <><span className="eyebrow">Selected opportunity</span><h3>{selected.title}</h3><p>{selected.scope || "No scope entered"}</p><p className="muted">{selected.clientName} · {selected.location || "Location pending"}</p><div className="detail-grid"><span>Status <b style={{ color: tone(selected.status)[1] }}>{label(selected.status)}</b></span><span>EMD <b>{money(selected.emdAmount)}</b></span><span>Quoted <b>{money(selected.quotedValue)}</b></span><span>Follow-up <b>{selected.nextFollowUpAt ? new Date(selected.nextFollowUpAt).toLocaleString() : "-"}</b></span></div>
        {["NEW", "SCREENING"].includes(selected.status) && ["ADMIN", "MARKETING_EXECUTIVE", "MARKETING_MANAGER"].includes(currentUser.role) && <Workflow title="Executive screening" options={["BID_RECOMMENDED", "NO_BID_RECOMMENDED", "MORE_INFORMATION_REQUIRED", "HOLD"]} value={screening} setValue={setScreening} notes={notes} setNotes={setNotes} button="Send to manager" onClick={() => run(`/marketing/opportunities/${selected.id}/screen`, { method: "PATCH", body: JSON.stringify({ recommendation: screening, notes }) }, "Sent to Marketing Manager")}/>} 
        {selected.status === "MANAGER_REVIEW" && canManage && <Workflow title="Marketing Manager review" options={["RECOMMEND_GO", "RECOMMEND_NO_BID", "RETURN_TO_EXECUTIVE", "HOLD"]} value={managerDecision} setValue={setManagerDecision} notes={notes} setNotes={setNotes} button="Submit review" onClick={() => run(`/marketing/opportunities/${selected.id}/manager-review`, { method: "PATCH", body: JSON.stringify({ decision: managerDecision, notes }) }, "Manager decision recorded")}/>} 
        {selected.status === "ADMIN_REVIEW" && currentUser.role === "ADMIN" && <Workflow title="Admin Go / No-Go" options={["GO_FOR_BID", "NO_BID", "HOLD", "APPROVE_WITH_CONDITIONS", "RETURN_TO_MANAGER"]} value={adminDecision} setValue={setAdminDecision} notes={notes} setNotes={setNotes} button="Confirm decision" onClick={() => run(`/marketing/opportunities/${selected.id}/admin-decision`, { method: "PATCH", body: JSON.stringify({ decision: adminDecision, notes }) }, "Admin decision recorded")}/>} 
        {["BID_APPROVED", "BID_PREPARATION"].includes(selected.status) && canManage && <form className="workflow-box" onSubmit={async e => { e.preventDefault(); await run(`/marketing/opportunities/${selected.id}/cost-items`, { method: "POST", body: JSON.stringify(cost) }, "Cost item added"); setCost({ category: "MANPOWER", description: "", quantity: 1, rate: "" }); }}><h4>BOQ & costing</h4><select value={cost.category} onChange={e => setCost({ ...cost, category: e.target.value })}>{["MANPOWER", "EQUIPMENT", "TRAVEL", "SOFTWARE", "VENDOR", "EMD_BG", "OVERHEAD", "CONTINGENCY", "PROFIT", "TAX", "OTHER"].map(x => <option key={x}>{x}</option>)}</select><input required placeholder="Description" value={cost.description} onChange={e => setCost({ ...cost, description: e.target.value })}/><div className="split"><input required type="number" min="0.01" step="0.01" value={cost.quantity} onChange={e => setCost({ ...cost, quantity: e.target.value })}/><input required type="number" min="0" step="0.01" placeholder="Rate" value={cost.rate} onChange={e => setCost({ ...cost, rate: e.target.value })}/></div><button>Add cost</button>{selected.costItems?.map(item => <small key={item.id}>{item.category}: {item.description} — {money(item.amount)}</small>)}<b>Total: {money(selected.costItems?.reduce((sum, item) => sum + Number(item.amount), 0))}</b></form>}
        {["BID_APPROVED", "BID_PREPARATION"].includes(selected.status) && canManage && <div className="workflow-box"><h4>Submit approved bid</h4>{Object.keys(submission).map(key => <input key={key} type={key === "quotedValue" ? "number" : "text"} placeholder={label(key)} value={submission[key]} onChange={e => setSubmission({ ...submission, [key]: e.target.value })}/>)}<button onClick={() => run(`/marketing/opportunities/${selected.id}/submit`, { method: "PATCH", body: JSON.stringify(submission) }, "Bid submitted and locked")}>Record submission</button></div>}
        {selected.submittedAt && !["AWARDED", "LOST", "NO_BID"].includes(selected.status) && canManage && <Workflow title="Post-bid status" options={["TECHNICAL_EVALUATION", "QUALIFIED", "FINANCIAL_EVALUATION", "NEGOTIATION", "AWARDED", "LOST"]} value={result.status} setValue={value => setResult({ ...result, status: value })} notes={result.reason} setNotes={value => setResult({ ...result, reason: value })} button="Update result" onClick={() => run(`/marketing/opportunities/${selected.id}/result`, { method: "PATCH", body: JSON.stringify(result) }, "Bid status updated")}/>} 
        {selected.status === "AWARDED" && currentUser.role === "ADMIN" && !selected.convertedProjectId && <div className="workflow-box"><h4>Award conversion</h4><p>Client, scope, location and approved value will transfer to a planned project.</p><button onClick={() => run(`/marketing/opportunities/${selected.id}/convert-project`, { method: "POST", body: "{}" }, "Award converted to project")}>Convert to project</button></div>}{selected.convertedProjectId && <p className="success">Converted to project</p>}
        <form className="workflow-box" onSubmit={async e => { e.preventDefault(); await run(`/marketing/opportunities/${selected.id}/activities`, { method: "POST", body: JSON.stringify(activity) }, "Activity recorded"); setActivity({ activityType: "FOLLOW_UP", details: "", nextFollowUpAt: "" }); }}><h4>CRM activity / follow-up</h4><select value={activity.activityType} onChange={e => setActivity({ ...activity, activityType: e.target.value })}>{["CALL", "EMAIL", "MEETING", "FOLLOW_UP", "CLARIFICATION", "PRESENTATION", "NEGOTIATION", "NOTE"].map(x => <option key={x}>{x}</option>)}</select><textarea required placeholder="Activity details" value={activity.details} onChange={e => setActivity({ ...activity, details: e.target.value })}/><label>Next follow-up<input type="datetime-local" value={activity.nextFollowUpAt} onChange={e => setActivity({ ...activity, nextFollowUpAt: e.target.value })}/></label><button>Add activity</button>{selected.activities?.slice().reverse().map(item => <p key={item.id}><b>{label(item.activityType)}</b> · {new Date(item.occurredAt).toLocaleString()}<br/><small>{item.details}</small></p>)}</form>
      </> : <p className="muted">Select an opportunity to review its workflow, costing, submission and follow-ups.</p>}</aside>
    </div>

    {/* Charts — at the bottom */}
    {rows.length > 0 && (
      <div className="mk-charts">
        <div className="mk-chart-box">
          <div className="mk-chart-head"><span>💹 Pipeline value by stage</span><span className="mk-chart-badge">₹ in Cr</span></div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eeec" vertical={false} />
              <XAxis dataKey="short" tick={{ fill: "#5b6770", fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={46} />
              <YAxis tick={{ fill: "#5b6770", fontSize: 11 }} />
              <Tooltip formatter={value => [`₹${value} Cr`, "Pipeline value"]} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 6px 24px rgba(0,0,0,0.12)" }} />
              <Bar dataKey="valueCr" fill="#0d9e7c" radius={[6, 6, 0, 0]} maxBarSize={46} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mk-chart-box">
          <div className="mk-chart-head"><span>🥧 Opportunities by source</span><span className="mk-chart-badge">{rows.length} total</span></div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={sourceBuckets} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={58} outerRadius={92} paddingAngle={2}>
                {sourceBuckets.map((entry, i) => <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 6px 24px rgba(0,0,0,0.12)" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    )}
  </section>;
}

function Workflow({ title, options, value, setValue, notes, setNotes, button, onClick }) {
  return <div className="workflow-box"><h4>{title}</h4><select value={value} onChange={e => setValue(e.target.value)}>{options.map(x => <option key={x}>{x}</option>)}</select><textarea placeholder="Assessment / decision notes" value={notes} onChange={e => setNotes(e.target.value)}/><button onClick={onClick}>{button}</button></div>;
}
