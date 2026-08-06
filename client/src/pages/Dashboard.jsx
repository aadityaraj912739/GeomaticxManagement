import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid
} from "recharts";
import "../styles/dashboard.css";

const ICONS = {
  employees: '👥', offices: '🏢', clients: '👤', projects: '📋',
  tasks: '✅', attendance: '⏰', surveyForms: '📝', submissions: '📄',
  spatialRecords: '🗺️', processingJobs: '⚙️', assets: '📦',
  commercialRecords: '💰', approvals: '✔️', aiRecords: '🤖', securityRegisters: '🔒',
  marketingOpportunities: 'M', activeBreaks: 'B'
};

// FACEBOOK COLORS
const FB_COLORS = ['#1877F2', '#42B72A', '#F7B928', '#E74C3C', '#8B9DC3', '#6C5CE7', '#1DA1F2', '#E1306C'];
const PERIOD_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "all", label: "All time" }
];
const ATTENDANCE_LABELS = {
  PRESENT: "Present",
  ON_BREAK: "On break",
  CHECKED_OUT: "Checked out",
  ABSENT: "Absent"
};
const TASK_LABELS = { TODO: "To do", IN_PROGRESS: "In progress", REVIEW: "Review", DONE: "Done", UNASSIGNED: "No task" };

export default function Dashboard() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [period, setPeriod] = useState(() => localStorage.getItem("dashboard-period") || "today");
  const [projectId, setProjectId] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [breakType, setBreakType] = useState("TEA");
  const [breakSubmitting, setBreakSubmitting] = useState(false);
  const [workforceProjectId, setWorkforceProjectId] = useState("");
  const [workforceEmployeeId, setWorkforceEmployeeId] = useState("");
  const [workforceAttendance, setWorkforceAttendance] = useState("");
  const [workforceTaskStatus, setWorkforceTaskStatus] = useState("");
  const [workforceSearch, setWorkforceSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const query = new URLSearchParams({ period });
        if (projectId) query.set("projectId", projectId);
        const res = await api(`/dashboard?${query.toString()}`);
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [period, projectId, refreshKey]);

  useEffect(() => {
    localStorage.setItem("dashboard-period", period);
  }, [period]);

  useEffect(() => {
    if (!projectId && data.projectId) setProjectId(data.projectId);
  }, [data.projectId, projectId]);

  const currentAttendance = data.myAttendance;
  const activeBreak = currentAttendance?.activeBreak || currentAttendance?.breaks?.find(entry => !entry.resumedAt);

  const locate = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Location is not supported by this browser"));
    navigator.geolocation.getCurrentPosition(
      position => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude, locationAccuracy: position.coords.accuracy }),
      error => reject(new Error(error.code === 1 ? "Location permission is required to punch in before the break" : "Current location could not be detected. Please enable GPS and retry")),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });

  const startBreak = async () => {
    if (activeBreak || breakSubmitting) return;
    try {
      setBreakSubmitting(true);
      setError("");
      setMessage("");
      const location = currentAttendance ? {} : await locate();
      const result = await api("/attendance/breaks/start", {
        method: "POST",
        body: JSON.stringify({ breakType, ...location })
      });
      setMessage(result.attendanceCreated
        ? `Location captured, punch-in recorded and ${breakType.toLowerCase()} break started`
        : `${breakType.toLowerCase()} break started`);
      setRefreshKey(value => value + 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setBreakSubmitting(false);
    }
  };

  const resumeWork = async () => {
    if (!currentAttendance?.id || !activeBreak?.id) return;
    try {
      setError("");
      setMessage("");
      await api(`/attendance/${currentAttendance.id}/breaks/${activeBreak.id}/resume`, { method: "PATCH" });
      setMessage("Work resumed successfully");
      setRefreshKey(value => value + 1);
    } catch (e) {
      setError(e.message);
    }
  };

  const filteredWorkforce = useMemo(() => {
    const search = workforceSearch.trim().toLowerCase();
    return (data.workforceStatus || []).filter(row => {
      if (workforceProjectId && row.projectId !== workforceProjectId) return false;
      if (workforceEmployeeId && row.employeeId !== workforceEmployeeId) return false;
      if (workforceAttendance === "ATTENDED" && row.attendanceStatus === "ABSENT") return false;
      if (workforceAttendance && workforceAttendance !== "ATTENDED" && row.attendanceStatus !== workforceAttendance) return false;
      if (workforceTaskStatus && row.taskStatus !== workforceTaskStatus) return false;
      if (search && !`${row.employeeName} ${row.employeeCode} ${row.projectName || ""} ${row.taskTitle || ""}`.toLowerCase().includes(search)) return false;
      return true;
    });
  }, [data.workforceStatus, workforceProjectId, workforceEmployeeId, workforceAttendance, workforceTaskStatus, workforceSearch]);

  if (loading) return (
    <div className="dash-loading">
      <div className="dash-spinner"></div>
      <p>Loading dashboard...</p>
    </div>
  );

  const projectProgress = data.projectProgress || [];
  const employeeProgress = data.employeeProgress || [];
  const projectOptions = data.projectOptions || [];
  const selectedProject = data.selectedProjectProgress || null;
  const recentBreakHistory = data.recentBreakHistory || [];
  const selectedPeriodLabel = data.periodLabel || PERIOD_OPTIONS.find(option => option.value === period)?.label || "Today";
  const summaryProgress = data.progressSummary || { taskCount: 0, completedTasks: 0, averageProgress: 0 };
  const workforceEmployeeOptions = [...new Map((data.workforceStatus || []).map(row => [row.employeeId, { id: row.employeeId, code: row.employeeCode, name: row.employeeName }])).values()];

  const cardData = [
    { key: 'employees', label: 'Employees', value: data.employees || 0, icon: ICONS.employees, color: '#1877F2' },
    { key: 'offices', label: 'Offices', value: data.offices || 0, icon: ICONS.offices, color: '#8B9DC3' },
    { key: 'clients', label: 'Clients', value: data.clients || 0, icon: ICONS.clients, color: '#6C5CE7' },
    { key: 'projects', label: 'Projects', value: data.projects || 0, icon: ICONS.projects, color: '#42B72A' },
    { key: 'tasks', label: 'Tasks', value: data.tasks || 0, icon: ICONS.tasks, color: '#F7B928' },
    { key: 'attendance', label: 'Attendance', value: data.attendance || 0, icon: ICONS.attendance, color: '#E74C3C' },
    { key: 'surveyForms', label: 'Survey Forms', value: data.surveyForms || 0, icon: ICONS.surveyForms, color: '#1DA1F2' },
    { key: 'submissions', label: 'Submissions', value: data.submissions || 0, icon: ICONS.submissions, color: '#E1306C' },
    { key: 'spatialRecords', label: 'Spatial Records', value: data.spatialRecords || 0, icon: ICONS.spatialRecords, color: '#1877F2' },
    { key: 'processingJobs', label: 'Processing Jobs', value: data.processingJobs || 0, icon: ICONS.processingJobs, color: '#F7B928' },
    { key: 'assets', label: 'Assets', value: data.assets || 0, icon: ICONS.assets, color: '#42B72A' },
    { key: 'commercialRecords', label: 'Commercial', value: data.commercialRecords || 0, icon: ICONS.commercialRecords, color: '#8B9DC3' },
    { key: 'approvals', label: 'QC Approvals', value: data.approvals || 0, icon: ICONS.approvals, color: '#42B72A' },
    { key: 'aiRecords', label: 'AI Records', value: data.aiRecords || 0, icon: ICONS.aiRecords, color: '#6C5CE7' },
    { key: 'securityRegisters', label: 'Security', value: data.securityRegisters || 0, icon: ICONS.securityRegisters, color: '#E74C3C' },
    { key: 'marketingOpportunities', label: 'Marketing opportunities', value: data.marketingOpportunities || 0, icon: ICONS.marketingOpportunities, color: '#A47612' },
    { key: 'activeBreaks', label: 'Employees on break', value: data.activeBreaks || 0, icon: ICONS.activeBreaks, color: '#E67E22' },
  ];

  const sortedData = [...cardData].sort((a, b) => b.value - a.value);
  const topSix = sortedData.slice(0, 6);
  
  const chartData = topSix.map(item => ({
    name: item.label,
    value: item.value
  }));

  const pieData = topSix.map(item => ({
    name: item.label,
    value: item.value || 1
  }));

  const totalRecords = cardData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="dash-wrapper">
      {/* Header */}
      <div className="dash-header">
        <div>
          <span className="dash-eyebrow">● LIVE DASHBOARD</span>
          <h1 className="dash-title">Geomaticx Analytics</h1>
          <p className="dash-sub">{totalRecords.toLocaleString()} total records · {Object.keys(data).length} modules · {selectedPeriodLabel}</p>
        </div>
        <div className="dash-controls">
          <select className="dash-select" value={projectId} onChange={event => setProjectId(event.target.value)}>
            <option value="">All projects</option>
            {projectOptions.map(option => <option key={option.id} value={option.id}>{option.code} - {option.name}</option>)}
          </select>
          <select className="dash-select" value={period} onChange={event => setPeriod(event.target.value)}>
            {PERIOD_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <button className="dash-btn" onClick={() => setRefreshKey(value => value + 1)}>⟳ Refresh</button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      {/* Stats Grid */}
      <div className="dash-grid">
        {cardData.map((item) => (
          <div key={item.key} className="dash-card">
            <div className="dash-card-left">
              <span className="dash-card-icon" style={{ color: item.color }}>
                {item.icon}
              </span>
              <div>
                <div className="dash-card-value">{item.value.toLocaleString()}</div>
                <div className="dash-card-label">{item.label}</div>
              </div>
            </div>
            <div className="dash-card-bar" style={{ background: item.color, width: `${Math.min((item.value / Math.max(1, ...cardData.map(card => card.value))) * 100, 100)}%` }}></div>
          </div>
        ))}
      </div>

      <div className="dash-insights">
        <div className="dash-insight-box">
          <h4>Project progress</h4>
          <p className="dash-section-note">{summaryProgress.taskCount.toLocaleString()} tasks in {selectedPeriodLabel.toLowerCase()} · average {summaryProgress.averageProgress}% complete</p>
          {selectedProject && <div className="dash-project-focus">
            <div>
              <span className="dash-project-code">{selectedProject.code}</span>
              <strong>{selectedProject.name}</strong>
            </div>
            <div className="dash-project-meter">
              <span style={{ width: `${selectedProject.progress}%` }} />
            </div>
            <div className="dash-project-stats">
              <span>{selectedProject.progress}% done</span>
              <span>{selectedProject.completedTasks}/{selectedProject.totalTasks} tasks</span>
            </div>
          </div>}
          {projectProgress.length ? projectProgress.map(item => <div className="dash-insight-row" key={item.id}>
            <span className="dash-insight-label">{item.code} · {item.name}</span>
            <span className="dash-insight-bar-bg"><span className="dash-insight-bar" style={{ width: `${item.progress}%`, background: item.progress >= 80 ? '#42B72A' : '#1877F2' }}></span></span>
            <span className="dash-insight-value">{item.progress}%</span>
          </div>) : <p className="muted">No projects are configured yet.</p>}
        </div>

        <div className="dash-insight-box">
          <h4>Employee work progress</h4>
          <p className="dash-section-note">Current task progress grouped dynamically by assignee.</p>
          {employeeProgress.length ? employeeProgress.map(item => <div className="dash-insight-row" key={item.id}>
            <span className="dash-insight-label">{item.name}</span>
            <span className="dash-insight-bar-bg"><span className="dash-insight-bar" style={{ width: `${item.progress}%`, background: item.progress >= 80 ? '#42B72A' : '#6C5CE7' }}></span></span>
            <span className="dash-insight-value">{item.progress}%</span>
          </div>) : <p className="muted">No employee activity found for this period.</p>}

          <div className="dash-break-panel">
            <div className="dash-break-header">
              <div>
                <h5>Break controls</h5>
                <p className="dash-section-note">{currentAttendance ? `Check-in ${new Date(currentAttendance.checkIn).toLocaleTimeString()}` : "Taking a break will capture your location and punch you in first."}</p>
              </div>
              {activeBreak ? <span className="status status-inactive">{activeBreak.breakType} break active</span> : <span className="status status-active">Ready</span>}
            </div>
            {!activeBreak && <div className="dash-break-actions">
              <select className="dash-select" value={breakType} onChange={event => setBreakType(event.target.value)}>
                <option value="TEA">TEA</option>
                <option value="LUNCH">LUNCH</option>
                <option value="PERSONAL">PERSONAL</option>
                <option value="OTHER">OTHER</option>
              </select>
              <button type="button" className="dash-btn" disabled={breakSubmitting} onClick={startBreak}>{breakSubmitting ? "Locating..." : "Take break"}</button>
            </div>}
            {activeBreak && <div className="dash-break-actions"><button type="button" className="dash-btn" onClick={resumeWork}>Resume work</button></div>}
          </div>

          {data.onBreakEmployees?.length > 0 && <>
            <h4 className="dash-break-heading">Live break monitor</h4>
            {data.onBreakEmployees.map(item => <div className="dash-insight-row" key={item.id}>
              <span className="status status-inactive">{item.breakType}</span>
              <span className="dash-insight-label">{item.employee ? `${item.employee.firstName} ${item.employee.lastName || ""}` : "Employee"}</span>
              <span className="muted">Since {new Date(item.startedAt).toLocaleTimeString()}</span>
            </div>)}
          </>}

          <div className="dash-break-panel">
            <h4>Break history</h4>
            <p className="dash-section-note">Most recent break and resume events, capped for performance.</p>
            {recentBreakHistory.length ? recentBreakHistory.map(item => <div className="dash-break-history-row" key={item.id}>
              <div>
                <strong>{item.employeeName}</strong>
                <span>{item.breakType}</span>
              </div>
              <div>
                <span>Break: {new Date(item.startedAt).toLocaleString()}</span>
                <span>{item.resumedAt ? `Resumed: ${new Date(item.resumedAt).toLocaleString()}` : "Resumed: Pending"}</span>
              </div>
              <span className={`status ${item.status === 'ACTIVE' ? 'status-inactive' : 'status-active'}`}>{item.status === 'ACTIVE' ? 'Active' : 'Resumed'}</span>
            </div>) : <p className="muted">No break history available yet.</p>}
          </div>
        </div>
      </div>

      {Array.isArray(data.workforceStatus) && <section className="dash-workforce">
        <div className="dash-workforce-header">
          <div>
            <h3>Employee work status</h3>
            <p className="dash-section-note">Today&apos;s attendance, project allocation, task and live progress in one admin view.</p>
          </div>
          <span className="dash-chart-badge">{filteredWorkforce.length} records</span>
        </div>
        <div className="dash-workforce-filters">
          <input value={workforceSearch} onChange={event => setWorkforceSearch(event.target.value)} placeholder="Search employee, project or task" aria-label="Search workforce" />
          <select value={workforceProjectId} onChange={event => setWorkforceProjectId(event.target.value)}>
            <option value="">All projects</option>
            {projectOptions.map(option => <option key={option.id} value={option.id}>{option.code} - {option.name}</option>)}
          </select>
          <select value={workforceEmployeeId} onChange={event => setWorkforceEmployeeId(event.target.value)}>
            <option value="">All employees</option>
            {workforceEmployeeOptions.map(option => <option key={option.id} value={option.id}>{option.code} - {option.name}</option>)}
          </select>
          <select value={workforceAttendance} onChange={event => setWorkforceAttendance(event.target.value)}>
            <option value="">All attendance</option>
            <option value="ATTENDED">Present today</option>
            <option value="PRESENT">Working now</option>
            <option value="ON_BREAK">On break</option>
            <option value="CHECKED_OUT">Checked out</option>
            <option value="ABSENT">Absent</option>
          </select>
          <select value={workforceTaskStatus} onChange={event => setWorkforceTaskStatus(event.target.value)}>
            <option value="">All task statuses</option>
            {Object.entries(TASK_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div className="table-wrap dash-workforce-table"><table>
          <thead><tr><th>Employee</th><th>Today</th><th>Punch time</th><th>Project</th><th>Assigned task</th><th>Task status</th><th>Progress</th></tr></thead>
          <tbody>{filteredWorkforce.length ? filteredWorkforce.map(row => <tr key={`${row.employeeId}-${row.taskId || "unassigned"}`}>
            <td><strong>{row.employeeName}</strong><small>{row.employeeCode}</small></td>
            <td><span className={`status ${row.attendanceStatus === "ABSENT" ? "status-inactive" : "status-active"}`}>{ATTENDANCE_LABELS[row.attendanceStatus] || row.attendanceStatus}</span>{row.activeBreakType && <small>{row.activeBreakType} break</small>}</td>
            <td>{row.checkIn ? <><span>In: {new Date(row.checkIn).toLocaleTimeString()}</span>{row.checkOut && <small>Out: {new Date(row.checkOut).toLocaleTimeString()}</small>}</> : "-"}</td>
            <td>{row.projectName ? <><strong>{row.projectName}</strong><small>{row.projectCode}</small></> : "-"}</td>
            <td>{row.taskTitle || "No task assigned"}</td>
            <td>{TASK_LABELS[row.taskStatus] || row.taskStatus}</td>
            <td><div className="dash-workforce-progress"><span><i style={{ width: `${row.taskProgress}%` }} /></span><strong>{row.taskProgress}%</strong></div></td>
          </tr>) : <tr><td className="empty" colSpan="7">No employee records match these filters.</td></tr>}</tbody>
        </table></div>
      </section>}

      {/* Charts Section */}
      <div className="dash-charts">
        <div className="dash-chart-box">
          <div className="dash-chart-header">
            <h3>📊 Top Metrics</h3>
            <span className="dash-chart-badge">6 categories</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E6EB" />
              <XAxis dataKey="name" tick={{ fill: '#65676B', fontSize: 12 }} />
              <YAxis tick={{ fill: '#65676B', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  background: 'white', 
                  border: 'none', 
                  borderRadius: '8px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.15)'
                }}
              />
              <Bar dataKey="value" fill="#1877F2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="dash-chart-box">
          <div className="dash-chart-header">
            <h3>📈 Distribution</h3>
            <span className="dash-chart-badge">share</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: '#E4E6EB', strokeWidth: 1 }}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={FB_COLORS[index % FB_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  background: 'white', 
                  border: 'none', 
                  borderRadius: '8px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.15)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
