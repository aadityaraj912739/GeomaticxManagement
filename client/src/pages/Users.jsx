import { useEffect, useState } from "react";
import { api } from "../services/api";

const empty = { name: "", email: "", password: "", role: "EMPLOYEE" };
const roles = ["ADMIN", "MANAGER", "HR", "SURVEYOR", "EMPLOYEE", "MARKETING_EXECUTIVE", "MARKETING_MANAGER"];

export default function Users({ currentUser }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const load = () => api("/users").then(setRows).catch(e => setError(e.message));
  useEffect(() => { load(); }, []);

  const submit = async event => {
    event.preventDefault();
    setError("");
    try {
      const body = { ...form };
      if (editing && !body.password) delete body.password;
      await api(editing ? `/users/${editing}` : "/users", {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(body)
      });
      setForm(empty);
      setEditing(null);
      load();
    } catch (e) { setError(e.message); }
  };
  const edit = user => {
    setEditing(user.id);
    setForm({ name: user.name, email: user.email, password: "", role: user.role });
  };
  const setActive = async user => {
    setError("");
    try {
      await api(`/users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ active: !user.active })
      });
      load();
    } catch (e) { setError(e.message); }
  };

  return <section>
    <div className="page-head"><div><span className="eyebrow">Access control</span><h2>User accounts</h2></div><span className="count">{rows.length} accounts</span></div>
    {error && <p className="error">{error}</p>}
    <form className="form-grid" onSubmit={submit}>
      <label>Name<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/></label>
      <label>Email<input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}/></label>
      <label>{editing ? "New password (optional)" : "Password"}<input type="password" required={!editing} minLength="10" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}/></label>
      <label>Role<select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>{roles.map(role => <option key={role}>{role}</option>)}</select></label>
      <div className="actions"><button>{editing ? "Update account" : "Create account"}</button>{editing && <button type="button" className="secondary" onClick={() => { setEditing(null); setForm(empty); }}>Cancel</button>}</div>
    </form>
    <div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>{rows.map(user => <tr key={user.id}><td>{user.name}</td><td>{user.email}</td><td>{user.role}</td><td><span className={`status ${user.active ? "status-active" : "status-inactive"}`}>{user.active ? "Active" : "Inactive"}</span></td><td><button className="link" onClick={() => edit(user)}>Edit</button><button className={`link ${user.active ? "danger" : ""}`} disabled={user.id === currentUser.id} onClick={() => setActive(user)}>{user.active ? "Deactivate" : "Activate"}</button></td></tr>)}</tbody>
    </table></div>
  </section>;
}
