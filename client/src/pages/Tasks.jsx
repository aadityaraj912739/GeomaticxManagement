import { useEffect, useState } from "react";
import { FiCheck, FiChevronLeft, FiChevronRight, FiEdit2, FiSearch, FiTrash2 } from "react-icons/fi";
import { api } from "../services/api";

const statuses = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const progressOptions = [0, 10, 25, 50, 75, 90, 100];
const emptyForm = { title: "", description: "", ProjectId: "", assigneeId: "", dueDate: "", priority: "MEDIUM", status: "TODO", progress: 0 };
const emptyFilters = { q: "", status: "", priority: "", assigneeId: "", ProjectId: "" };
const label = value => String(value || "").replaceAll("_", " ");

export default function Tasks({ currentUser, focusedTask }) {
  const canManage = ["ADMIN", "MANAGER", "HR"].includes(currentUser.role);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(emptyFilters);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTaskId, setActiveTaskId] = useState(null);

  useEffect(() => {
    if (!focusedTask?.id) return;
    setActiveTaskId(focusedTask.id);
    setFilters(emptyFilters);
    setPage(1);
  }, [focusedTask?.key]);

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const projectRows = await api("/projects?limit=200");
        setProjects(projectRows);
        if (canManage) {
          const accounts = await api("/users");
          setUsers(accounts.filter(account => account.active));
        }
      } catch (e) { setError(e.message); }
    };
    loadLookups();
  }, [canManage]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setBusy(true); setError("");
      try {
        const params = new URLSearchParams({ page: String(page), limit: "25" });
        Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
        if (activeTaskId) params.set("taskId", activeTaskId);
        const result = await api(`/tasks?${params}`);
        setRows(result.rows);
        setPagination(result.pagination);
        if (page > result.pagination.pages) setPage(result.pagination.pages);
      } catch (e) { setError(e.message); } finally { setBusy(false); }
    }, filters.q ? 300 : 0);
    return () => clearTimeout(timer);
  }, [filters, page, refreshKey, activeTaskId]);

  useEffect(() => {
    if (!activeTaskId || !rows.some(row => row.id === activeTaskId)) return;
    document.getElementById(`task-${activeTaskId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [rows, activeTaskId]);

  const setFilter = (key, value) => { setActiveTaskId(null); setFilters(current => ({ ...current, [key]: value })); setPage(1); };
  const refresh = () => setRefreshKey(value => value + 1);

  const submit = async event => {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      await api(editing ? `/tasks/${editing}` : "/tasks", { method: editing ? "PUT" : "POST", body: JSON.stringify(form) });
      setForm(emptyForm); setEditing(null); setPage(1); refresh();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const edit = row => {
    setEditing(row.id);
    setForm(Object.fromEntries(Object.keys(emptyForm).map(key => [key, row[key] ?? emptyForm[key]])));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateProgress = async (row, changes) => {
    setBusy(true); setError("");
    try {
      await api(`/tasks/${row.id}`, { method: "PUT", body: JSON.stringify(changes) });
      refresh();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const remove = async row => {
    if (!confirm(`Delete task "${row.title}"?`)) return;
    try { await api(`/tasks/${row.id}`, { method: "DELETE" }); refresh(); } catch (e) { setError(e.message); }
  };

  return <section className="tasks-page">
    <div className="page-head"><div><span className="eyebrow">Work tracking</span><h2>{canManage ? "Team tasks" : "My tasks"}</h2></div><span className="count">{pagination.total} tasks</span></div>
    {error && <p className="error">{error}</p>}

    {canManage && <form className="form-grid task-form" onSubmit={submit}>
      <label>Task title<input required maxLength="255" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}/></label>
      <label>Project<select value={form.ProjectId} onChange={e => setForm({ ...form, ProjectId: e.target.value })}><option value="">No project</option>{projects.map(project => <option key={project.id} value={project.id}>{project.code} - {project.name}</option>)}</select></label>
      <label>Assign to<select required value={form.assigneeId} onChange={e => setForm({ ...form, assigneeId: e.target.value })}><option value="">Select employee</option>{users.map(account => <option key={account.id} value={account.id}>{account.name} ({account.role})</option>)}</select></label>
      <label>Due date<input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}/></label>
      <label>Priority<select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>{priorities.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Status<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{statuses.map(value => <option key={value}>{label(value)}</option>)}</select></label>
      <label>Progress: {form.progress}%<input type="range" min="0" max="100" step="5" value={form.progress} onChange={e => setForm({ ...form, progress: Number(e.target.value) })}/></label>
      <label className="task-description">Description<textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}/></label>
      <div className="actions"><button disabled={busy}>{editing ? "Update task" : "Assign task"}</button>{editing && <button type="button" className="secondary" onClick={() => { setEditing(null); setForm(emptyForm); }}>Cancel</button>}</div>
    </form>}

    <div className="task-filters">
      <label className="task-search"><FiSearch/><input value={filters.q} onChange={e => setFilter("q", e.target.value)} placeholder="Search task title or description"/></label>
      <select aria-label="Filter by status" value={filters.status} onChange={e => setFilter("status", e.target.value)}><option value="">All statuses</option>{statuses.map(value => <option key={value} value={value}>{label(value)}</option>)}</select>
      <select aria-label="Filter by priority" value={filters.priority} onChange={e => setFilter("priority", e.target.value)}><option value="">All priorities</option>{priorities.map(value => <option key={value} value={value}>{value}</option>)}</select>
      <select aria-label="Filter by project" value={filters.ProjectId} onChange={e => setFilter("ProjectId", e.target.value)}><option value="">All projects</option>{projects.map(project => <option key={project.id} value={project.id}>{project.code} - {project.name}</option>)}</select>
      {canManage && <select aria-label="Filter by assignee" value={filters.assigneeId} onChange={e => setFilter("assigneeId", e.target.value)}><option value="">All assignees</option>{users.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}</select>}
      {Object.values(filters).some(Boolean) && <button className="secondary clear-filters" onClick={() => { setFilters(emptyFilters); setPage(1); }}>Clear</button>}
      {activeTaskId && <button className="secondary clear-filters" onClick={() => setActiveTaskId(null)}>Show all tasks</button>}
    </div>

    <div className="task-table-wrap">
      <table className="task-table"><thead><tr><th>Task</th><th>Project</th>{canManage && <th>Assignee</th>}<th>Due</th><th>Priority</th><th>Status</th><th>Progress</th><th>Actions</th></tr></thead>
        <tbody>{rows.map(row => <tr id={`task-${row.id}`} className={row.id === activeTaskId ? "task-highlight" : ""} key={row.id}>
          <td className="task-title-cell"><strong title={row.title}>{row.title}</strong>{row.description && <small title={row.description}>{row.description}</small>}</td>
          <td>{row.Project ? <><strong>{row.Project.code}</strong><small>{row.Project.name}</small></> : <span className="muted">No project</span>}</td>
          {canManage && <td>{row.assignee?.name || <span className="muted">Unassigned</span>}</td>}
          <td>{row.dueDate || <span className="muted">Not set</span>}</td>
          <td><span className={`priority priority-${row.priority.toLowerCase()}`}>{row.priority}</span></td>
          <td>{canManage ? <span className={`task-status task-status-${row.status.toLowerCase()}`}>{label(row.status)}</span> : <select disabled={busy} value={row.status} onChange={e => updateProgress(row, { status: e.target.value })}>{statuses.map(value => <option key={value} value={value}>{label(value)}</option>)}</select>}</td>
          <td><div className="table-progress"><div><span style={{ width: `${row.progress || 0}%` }}/></div>{canManage ? <strong>{row.progress || 0}%</strong> : <select disabled={busy} value={row.progress} onChange={e => updateProgress(row, { progress: Number(e.target.value) })}>{progressOptions.map(value => <option key={value} value={value}>{value}%</option>)}</select>}</div></td>
          <td><div className="table-actions">{!canManage && row.status !== "DONE" && <button title="Mark complete" aria-label="Mark complete" onClick={() => updateProgress(row, { progress: 100, status: "DONE" })}><FiCheck/></button>}{canManage && <><button className="secondary" title="Edit task" aria-label="Edit task" onClick={() => edit(row)}><FiEdit2/></button><button className="danger-button" title="Delete task" aria-label="Delete task" onClick={() => remove(row)}><FiTrash2/></button></>}</div></td>
        </tr>)}{!rows.length && <tr><td colSpan={canManage ? 8 : 7} className="empty">{busy ? "Loading tasks..." : "No tasks match these filters."}</td></tr>}</tbody>
      </table>
    </div>

    <div className="task-pagination"><span>Page {pagination.page} of {pagination.pages} · {pagination.total} results</span><div><button className="secondary" title="Previous page" aria-label="Previous page" disabled={page <= 1 || busy} onClick={() => setPage(value => value - 1)}><FiChevronLeft/></button><button className="secondary" title="Next page" aria-label="Next page" disabled={page >= pagination.pages || busy} onClick={() => setPage(value => value + 1)}><FiChevronRight/></button></div></div>
  </section>;
}
