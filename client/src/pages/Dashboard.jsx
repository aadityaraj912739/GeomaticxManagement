import { useEffect, useState } from "react";
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

export default function Dashboard() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [period, setPeriod] = useState(() => localStorage.getItem("dashboard-period") || "today");
  const [projectId, setProjectId] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [breakType, setBreakType] = useState("TEA");

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

  const startBreak = async () => {
    if (!currentAttendance?.id || activeBreak) return;
    try {
      setError("");
      setMessage("");
      await api(`/attendance/${currentAttendance.id}/breaks`, {
        method: "POST",
        body: JSON.stringify({ breakType })
      });
      setMessage(`${breakType.toLowerCase()} break started`);
      setRefreshKey(value => value + 1);
    } catch (e) {
      setError(e.message);
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
          </div>) : <p className="muted">No project activity found for this period.</p>}
        </div>

        <div className="dash-insight-box">
          <h4>Employee work progress</h4>
          <p className="dash-section-note">Task progress grouped by assignee in the selected window.</p>
          {employeeProgress.length ? employeeProgress.map(item => <div className="dash-insight-row" key={item.id}>
            <span className="dash-insight-label">{item.name}</span>
            <span className="dash-insight-bar-bg"><span className="dash-insight-bar" style={{ width: `${item.progress}%`, background: item.progress >= 80 ? '#42B72A' : '#6C5CE7' }}></span></span>
            <span className="dash-insight-value">{item.progress}%</span>
          </div>) : <p className="muted">No employee activity found for this period.</p>}

          <div className="dash-break-panel">
            <div className="dash-break-header">
              <div>
                <h5>Break controls</h5>
                <p className="dash-section-note">{currentAttendance ? `Check-in ${new Date(currentAttendance.checkIn).toLocaleTimeString()}` : "Check in from Attendance to enable break controls."}</p>
              </div>
              {activeBreak ? <span className="status status-inactive">{activeBreak.breakType} break active</span> : <span className="status status-active">Ready</span>}
            </div>
            {currentAttendance && !currentAttendance.checkOut && <div className="dash-break-actions">
              <select className="dash-select" value={breakType} onChange={event => setBreakType(event.target.value)}>
                <option value="TEA">TEA</option>
                <option value="LUNCH">LUNCH</option>
                <option value="PERSONAL">PERSONAL</option>
                <option value="OTHER">OTHER</option>
              </select>
              {activeBreak ? <button type="button" className="dash-btn" onClick={resumeWork}>Resume work</button> : <button type="button" className="dash-btn" onClick={startBreak}>Take break</button>}
            </div>}
            {!currentAttendance && <p className="muted">No open attendance record is available for your account yet.</p>}
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
