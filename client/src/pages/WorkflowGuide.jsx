import { useEffect, useState, Fragment } from "react";
import { api } from "../services/api";
import "../marketing.css";
import "../howcss.css";

const label = value => String(value || "-").replaceAll("_", " ");
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

// Marketing deep-dive data (roles, steps, reporting line)
const ROLES = [
  {
    name: "Admin (GeoMark)",
    icon: "🏛️",
    color: "#7c5ce7",
    reportsTo: null,
    duties: ["Final Go / No-Go approval", "Approves bid preparation", "Converts awarded bid into a project"]
  },
  {
    name: "Marketing Manager / Manager",
    icon: "🗂️",
    color: "#0d9e7c",
    reportsTo: "Admin",
    duties: ["Reviews screening → recommend GO / NO-BID", "Prepares BOQ & costing", "Records bid submission & post-bid result"]
  },
  {
    name: "Marketing Executive",
    icon: "👤",
    color: "#166fe5",
    reportsTo: "Marketing Manager",
    duties: ["Registers tenders / enquiries", "Initial screening & bid recommendation", "Client follow-up + CRM activities"]
  }
];

const DETAILED_STEPS = [
  { n: 1, icon: "📥", title: "Intake / Create", statuses: ["NEW"], who: "Marketing Executive", action: "Tender / enquiry registered with client, scope, estimated value & deadline.", note: "Start of pipeline" },
  { n: 2, icon: "🔍", title: "Executive Screening", statuses: ["SCREENING"], who: "Marketing Executive", action: "Suitability check → recommend BID, NO-BID, MORE INFO or HOLD.", note: "Sends to Manager" },
  { n: 3, icon: "🗂️", title: "Manager Review", statuses: ["MANAGER_REVIEW"], who: "Marketing Manager", action: "Validates screening → RECOMMEND_GO, NO-BID, RETURN or HOLD.", note: "Sends to Admin" },
  { n: 4, icon: "🏛️", title: "Admin Go / No-Go", statuses: ["ADMIN_REVIEW"], who: "Admin", action: "Final decision → GO_FOR_BID, NO_BID, APPROVE_WITH_CONDITIONS or HOLD.", note: "Gate before bidding" },
  { n: 5, icon: "📝", title: "Bid Preparation & Costing", statuses: ["BID_APPROVED", "BID_PREPARATION"], who: "Marketing Manager", action: "BOQ / costing — manpower, equipment, EMD/BG, overhead, profit & tax.", note: "Build the bid" },
  { n: 6, icon: "📤", title: "Bid Submission", statuses: ["SUBMITTED"], who: "Marketing Manager", action: "Portal, bid reference & final quoted value recorded — bid locks.", note: "Bid locked" },
  { n: 7, icon: "🔎", title: "Post-Bid Evaluation", statuses: ["TECHNICAL_EVALUATION", "QUALIFIED", "FINANCIAL_EVALUATION", "NEGOTIATION"], who: "Marketing Manager", action: "Track technical pass → qualified → financial evaluation → negotiation.", note: "Outcome pending" },
  { n: 8, icon: "🏆", title: "Award & Outcome", statuses: ["AWARDED", "LOST", "NO_BID"], who: "Admin", action: "AWARDED bid converts into a project; LOST / NO-BID closes the loop.", note: "End of pipeline" }
];

const STAGE_ORDER = ["NEW", "SCREENING", "MANAGER_REVIEW", "ADMIN_REVIEW", "BID_APPROVED", "BID_PREPARATION", "SUBMITTED", "TECHNICAL_EVALUATION", "QUALIFIED", "FINANCIAL_EVALUATION", "NEGOTIATION", "AWARDED", "LOST", "NO_BID", "HOLD"];

// How the whole website runs — at a glance
const SITE_OVERVIEW = [
  { icon: "🔐", t: "Login / Register", d: "Sign in with your account" },
  { icon: "🧭", t: "Role-based access", d: "Only your modules appear" },
  { icon: "🧩", t: "Pick a module", d: "Choose from the sidebar" },
  { icon: "⚙️", t: "Follow the workflow", d: "Complete the steps" },
  { icon: "🔔", t: "Notifications", d: "Alerts & approvals" },
  { icon: "🛡️", t: "Audit & AI review", d: "Everything is logged" }
];

// Every module with its visual workflow and approval chain
const MODULES = [
  {
    id: "hr", name: "Human Resources", icon: "🏢", color: "#166fe5", users: "Admin, HR",
    desc: "Company master data — offices, departments, designations and employees.",
    steps: [
      { t: "Office", d: "Add office & branch details", who: "HR" },
      { t: "Department", d: "Create a department", who: "HR" },
      { t: "Designation", d: "Define roles & levels", who: "HR" },
      { t: "Employee", d: "Add employee record", who: "HR" },
      { t: "Reporting", d: "Set reporting manager", who: "HR" },
      { t: "Account", d: "Link the user login", who: "Admin" }
    ],
    approvals: ["HR enters data", "Manager approves", "Account linked"]
  },
  {
    id: "clients", name: "Clients & Projects", icon: "🏗️", color: "#0d9e7c", users: "Admin, Manager",
    desc: "Client masters and the projects linked to them.",
    steps: [
      { t: "Add Client", d: "Capture contact details", who: "Manager" },
      { t: "Create Project", d: "Plan scope, budget, dates & location", who: "Manager" },
      { t: "Track Status", d: "Planned → Active → Completed", who: "Manager" },
      { t: "Assign Team", d: "Attach tasks & employees", who: "Manager" }
    ],
    approvals: ["Manager creates", "Admin approves", "Assigned to team"]
  },
  {
    id: "survey", name: "Field Survey", icon: "📝", color: "#e67e22", users: "Admin, Manager, Surveyor",
    desc: "Design forms, capture field data and review submissions.",
    steps: [
      { t: "Design Form", d: "Define fields & questions", who: "Manager" },
      { t: "Submit", d: "Field team fills the form", who: "Surveyor" },
      { t: "Review", d: "Validate submissions", who: "Manager" },
      { t: "Analyse", d: "Use data in reports", who: "Manager" }
    ],
    approvals: ["Manager designs form", "Surveyor submits", "Manager reviews"]
  },
  {
    id: "gis", name: "Geospatial & Processing", icon: "🗺️", color: "#7c5ce7", users: "Admin, Manager, Surveyor",
    desc: "Spatial / GIS capture and processing jobs.",
    steps: [
      { t: "Capture", d: "Save a spatial / GIS record", who: "Surveyor" },
      { t: "Attach", d: "Geometry, LiDAR, drone & files", who: "Surveyor" },
      { t: "Process", d: "Run a processing job", who: "Surveyor" },
      { t: "Store & Reuse", d: "Keep for analysis", who: "Manager" }
    ],
    approvals: ["Surveyor captures", "Manager reviews", "Stored"]
  },
  {
    id: "tasks", name: "Tasks", icon: "✅", color: "#0b8a4e", users: "Everyone",
    desc: "Project and employee task workflow with progress tracking.",
    steps: [
      { t: "Create", d: "Add a task to a project", who: "Manager" },
      { t: "Assign", d: "Allocate to an employee", who: "Manager" },
      { t: "Work", d: "Update progress & status", who: "Employee" },
      { t: "Review", d: "Mark Done or reopen", who: "Manager" }
    ],
    approvals: ["Manager assigns", "Employee updates", "Manager reviews → Done"]
  },
  {
    id: "attendance", name: "Attendance", icon: "⏰", color: "#f7b928", users: "Everyone",
    desc: "Daily time tracking with breaks and a live workforce view.",
    steps: [
      { t: "Check-in", d: "Punch in with location", who: "Employee" },
      { t: "Break", d: "Tea / lunch breaks", who: "Employee" },
      { t: "Check-out", d: "End the workday", who: "Employee" },
      { t: "Report", d: "Automatic daily summary", who: "Auto" }
    ],
    approvals: ["Employee checks-in", "Breaks tracked", "Report auto-generated"]
  },
  {
    id: "assets", name: "Assets", icon: "🏷️", color: "#e1306c", users: "Admin, Manager, HR",
    desc: "Asset lifecycle management.",
    steps: [
      { t: "Register", d: "Add asset details", who: "HR / Admin" },
      { t: "Assign", d: "Allocate to employee / office", who: "HR" },
      { t: "Maintain", d: "Track condition & service", who: "HR" },
      { t: "Dispose", d: "Retire old assets", who: "Admin" }
    ],
    approvals: ["HR / Admin registers", "Assigned", "Admin disposes"]
  },
  {
    id: "commercial", name: "Commercial & Approvals", icon: "💰", color: "#16a085", users: "Admin, Manager",
    desc: "Commercial records flowing through the approval chain.",
    steps: [
      { t: "Record", d: "Submit a commercial entry", who: "Submitter" },
      { t: "Review", d: "Manager checks it", who: "Manager" },
      { t: "Approve", d: "Admin approves / rejects", who: "Admin" },
      { t: "Notify", d: "Alert the submitter", who: "Auto" }
    ],
    approvals: ["Submitter", "Manager reviews", "Admin approves"]
  },
  {
    id: "ai", name: "AI Governance", icon: "🤖", color: "#e74c3c", users: "Admin, Manager, Surveyor",
    desc: "AI usage with policy review, approval and audit.",
    steps: [
      { t: "Request", d: "Submit an AI operation", who: "User" },
      { t: "Review", d: "Policy & sensitivity check", who: "Manager" },
      { t: "Approve / Run", d: "Execute the AI job", who: "Manager / Admin" },
      { t: "Audit", d: "Log output & decision", who: "Auto" }
    ],
    approvals: ["User requests", "Manager / Admin reviews", "Audit logged"]
  },
  {
    id: "security", name: "Security & Audit", icon: "🔒", color: "#2c3e50", users: "Admin",
    desc: "Security controls, user management and the full audit trail.",
    steps: [
      { t: "Controls", d: "Manage security registers", who: "Admin" },
      { t: "Users", d: "Manage accounts & access", who: "Admin" },
      { t: "Audit Trail", d: "Every change is logged", who: "Auto" }
    ],
    approvals: ["Admin controls", "Users managed", "Full audit trail"]
  },
  {
    id: "marketing", name: "Marketing & Tenders", icon: "📣", color: "#0b8a4e", users: "Marketing roles",
    desc: "Full tender lifecycle from enquiry to award — detailed diagram below.",
    steps: DETAILED_STEPS.map(s => ({ t: s.title, d: s.note, who: s.who })),
    approvals: ["Marketing Executive", "Marketing Manager", "Admin"]
  }
];

export default function WorkflowGuide() {
  const [active, setActive] = useState("marketing");
  const [stageBuckets, setStageBuckets] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const rows = await api("/marketing/opportunities");
        const buckets = {};
        rows.forEach(r => { (buckets[r.status] = buckets[r.status] || []).push(r); });
        setStageBuckets(STAGE_ORDER.filter(s => buckets[s]).map(s => ({ name: label(s), count: buckets[s].length })));
      } catch (e) { /* non-marketing roles simply won't show live counts */ }
    })();
  }, []);

  const countFor = statuses => statuses.reduce((s, st) => s + (stageBuckets.find(b => b.name === label(st))?.count || 0), 0);
  const mod = MODULES.find(m => m.id === active) || MODULES[0];

  return (
    <section className="hw-page">
      <div className="hw-header">
        <span className="hw-eyebrow">Guide · Geomaticx Operations</span>
        <h1 className="hw-title">How the website works</h1>
        <p className="hw-sub">Understand the whole system at a glance, then pick any module to see its visual workflow, roles and approval chain.</p>
      </div>

      {/* At-a-glance overview */}
      <div className="hw-section">
        <div className="hw-section-head"><h3>At a glance — how the website runs</h3><span className="mk-chart-badge">system flow</span></div>
        <div className="hw-overview">
          {SITE_OVERVIEW.map((s, i) => (
            <Fragment key={s.t}>
              <div className="hw-ov-item">
                <span className="hw-ov-icon">{s.icon}</span>
                <b className="hw-ov-title">{s.t}</b>
                <small className="hw-ov-desc">{s.d}</small>
              </div>
              {i < SITE_OVERVIEW.length - 1 && <span className="hw-ov-arrow">→</span>}
            </Fragment>
          ))}
        </div>
      </div>

      {/* Module picker */}
      <div className="hw-section">
        <div className="hw-section-head"><h3>Explore a module</h3><span className="mk-chart-badge">{MODULES.length} modules</span></div>
        <div className="hw-picker">
          <label className="hw-select-label">Choose a module to see its workflow</label>
          <select className="hw-select" value={active} onChange={e => setActive(e.target.value)}>
            {MODULES.map(m => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}
          </select>
          <div className="hw-tiles">
            {MODULES.map(m => (
              <button key={m.id} className={`hw-tile${m.id === active ? " active" : ""}`}
                style={m.id === active ? { borderColor: m.color, background: `${m.color}12`, color: m.color } : {}}
                onClick={() => setActive(m.id)}>
                <span>{m.icon}</span>{m.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected module diagram */}
      <ModuleDiagram mod={mod} countFor={countFor} isMarketing={mod.id === "marketing"} />
    </section>
  );
}

function ModuleDiagram({ mod, countFor, isMarketing }) {
  return (
    <div className="hw-section hw-diagram">
      <div className="hw-diagram-head">
        <span className="hw-diagram-icon" style={{ background: `${mod.color}1a`, color: mod.color }}>{mod.icon}</span>
        <div className="hw-diagram-title">
          <h3 style={{ color: mod.color }}>{mod.name}</h3>
          <small className="mk-role-report">↳ Used by: {mod.users}</small>
        </div>
        <span className="hw-badge" style={{ background: `${mod.color}14`, color: mod.color }}>module workflow</span>
      </div>
      <p className="hw-diagram-desc">{mod.desc}</p>

      {/* Visual workflow steps */}
      <div className="hw-vis-block">
        <h4 className="hw-subhead">Step-by-step workflow</h4>
        <div className="hw-vis">
          {mod.steps.map((s, i) => (
            <Fragment key={i}>
              {i > 0 && <div className="hw-vis-arrow">➜</div>}
              <div className="hw-vis-node">
                <span className="hw-vis-circle" style={{ background: mod.color, color: "#fff" }}>{i + 1}</span>
                <span className="hw-vis-sicon">{s.icon || "✔"}</span>
                <b className="hw-vis-title">{s.t}</b>
                <small className="hw-vis-desc">{s.d}</small>
                <span className="hw-vis-who" style={{ background: `${mod.color}14`, color: mod.color }}>{s.who}</span>
              </div>
            </Fragment>
          ))}
        </div>
      </div>

      {/* Approval / ownership chain */}
      <div className="hw-ap-block">
        <h4 className="hw-subhead">Handled by / who approves</h4>
        <div className="hw-ap">
          {mod.approvals.map((c, i) => (
            <span className="hw-ap-step" key={i}>
              {i > 0 && <span className="hw-ap-arrow">→</span>}
              <span className="hw-ap-chip" style={{ borderColor: mod.color, color: mod.color }}>{c}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Marketing deep-dive */}
      {isMarketing && <MarketingDiagram countFor={countFor} />}
    </div>
  );
}

function MarketingDiagram({ countFor = () => 0 }) {
  return (
    <div className="mk-workflow">
      <div className="mk-workflow-head">
        <span>🔄 Marketing model — roles, workflow & reporting</span>
        <span className="mk-chart-badge">opportunity lifecycle</span>
      </div>

      <div className="mk-role-section">
        <h4 className="mk-section-title">Roles · responsibilities · reporting line</h4>
        <div className="mk-org">
          <div className="mk-org-col">
            {ROLES.map(role => (
              <div className="mk-role" key={role.name} style={{ borderTopColor: role.color }}>
                <div className="mk-role-top">
                  <span className="mk-role-icon" style={{ background: `${role.color}1a`, color: role.color }}>{role.icon}</span>
                  <div className="mk-flow-text">
                    <b style={{ color: role.color }}>{role.name}</b>
                    <small className="mk-role-report">↳ Reports to: {role.reportsTo || <b>— top authority</b>}</small>
                  </div>
                </div>
                <ul className="mk-role-duties">{role.duties.map(d => <li key={d}>{d}</li>)}</ul>
              </div>
            ))}
          </div>
          <div className="mk-org-chain">
            <span className="mk-chain-box" style={{ borderColor: ROLES[0].color, color: ROLES[0].color }}>🏛️ ADMIN <small>final authority</small></span>
            <span className="mk-chain-link">⬇ reports to</span>
            <span className="mk-chain-box" style={{ borderColor: ROLES[1].color, color: ROLES[1].color }}>🗂️ MANAGERS <small>review + bid</small></span>
            <span className="mk-chain-link">⬇ reports to</span>
            <span className="mk-chain-box" style={{ borderColor: ROLES[2].color, color: ROLES[2].color }}>👤 EXECUTIVES <small>intake + screening</small></span>
          </div>
        </div>
      </div>

      <div className="mk-step-section">
        <h4 className="mk-section-title">Detailed process — every step, who acts & live count</h4>
        <div className="mk-timeline">
          {DETAILED_STEPS.map(step => {
            const count = countFor(step.statuses);
            return (
              <div className="mk-step" key={step.title}>
                <span className="mk-step-num" style={{ background: tone(step.statuses[0])[1], color: "#fff" }}>{step.n}</span>
                <div className="mk-step-body">
                  <div className="mk-step-head">
                    <span className="mk-flow-icon" style={{ background: tone(step.statuses[0])[0], color: tone(step.statuses[0])[1] }}>{step.icon}</span>
                    <div className="mk-flow-text">
                      <b>{step.title}</b>
                      <small>{step.statuses.map(label).join(" · ")}</small>
                    </div>
                    {count > 0 && <span className="mk-flow-count" style={{ background: tone(step.statuses[0])[0], color: tone(step.statuses[0])[1] }}>{count}</span>}
                    <span className="mk-step-arrow">↓</span>
                  </div>
                  <div className="mk-step-meta">
                    <span className="mk-who" style={{ borderColor: step.n <= 2 ? "#166fe5" : step.n === 8 ? "#7c5ce7" : "#0d9e7c" }}>👤 {step.who} acts here</span>
                    <span className="mk-action">{step.action}</span>
                    <span className="mk-decision" style={{ color: tone(step.statuses[0])[1] }}>{step.note}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mk-flow-note">Any opportunity can branch to <b style={{ color: tone("HOLD")[1] }}>⏸️ HOLD</b> (paused) from any review stage, or become <b style={{ color: tone("LOST")[1] }}>🚫 LOST / NO-BID</b> after evaluation. Only an <b style={{ color: tone("AWARDED")[1] }}>🏆 AWARDED</b> bid is converted by the Admin into a project.</p>
    </div>
  );
}