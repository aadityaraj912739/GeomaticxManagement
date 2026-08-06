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

export default function Dashboard() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/dashboard").then(res => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="dash-loading">
      <div className="dash-spinner"></div>
      <p>Loading dashboard...</p>
    </div>
  );

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
          <p className="dash-sub">{totalRecords.toLocaleString()} total records · {Object.keys(data).length} modules</p>
        </div>
        <div className="dash-controls">
          <select className="dash-select">
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
          </select>
          <button className="dash-btn">⟳ Refresh</button>
        </div>
      </div>

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

      {data.onBreakEmployees?.length > 0 && <div className="dash-insight-box break-monitor">
        <h4>Live break monitor</h4>
        {data.onBreakEmployees.map(item => <div className="dash-insight-row" key={item.id}>
          <span className="status status-inactive">{item.breakType}</span>
          <span className="dash-insight-label">{item.employee ? `${item.employee.firstName} ${item.employee.lastName || ""}` : "Employee"}</span>
          <span className="muted">Since {new Date(item.startedAt).toLocaleTimeString()}</span>
        </div>)}
      </div>}

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

      {/* Insights */}
      <div className="dash-insights">
        <div className="dash-insight-box">
          <h4>🏆 Top Performers</h4>
          {sortedData.slice(0, 5).map((item, i) => (
            <div key={i} className="dash-insight-row">
              <span className="dash-rank">#{i + 1}</span>
              <span className="dash-insight-label">{item.label}</span>
              <span className="dash-insight-bar-bg">
                <span className="dash-insight-bar" style={{ width: `${sortedData[0].value ? (item.value / sortedData[0].value) * 100 : 0}%`, background: item.color }}></span>
              </span>
              <span className="dash-insight-value">{item.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="dash-insight-box">
          <h4>📌 Quick Stats</h4>
          <div className="dash-quick-grid">
            <div className="dash-quick-item">
              <span>Total</span>
              <strong style={{ color: '#1877F2' }}>{totalRecords.toLocaleString()}</strong>
            </div>
            <div className="dash-quick-item">
              <span>Average</span>
              <strong style={{ color: '#42B72A' }}>{(totalRecords / cardData.length).toFixed(0)}</strong>
            </div>
            <div className="dash-quick-item">
              <span>Highest</span>
              <strong style={{ color: '#F7B928' }}>{Math.max(0, ...cardData.map(item => item.value)).toLocaleString()}</strong>
            </div>
            <div className="dash-quick-item">
              <span>Active</span>
              <strong style={{ color: '#6C5CE7' }}>{cardData.filter(item => item.value > 0).length}</strong>
            </div>
          </div>
          <div className="dash-quick-note">
            <span>🟢 All systems operational</span>
            <span className="dash-timestamp">Updated {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
