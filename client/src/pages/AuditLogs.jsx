import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function AuditLogs() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { api("/audit-logs").then(setRows).catch(e => setError(e.message)); }, []);
  return <section>
    <div className="page-head"><div><span className="eyebrow">Administrator controls</span><h2>Audit trail</h2></div><span className="count">Latest {rows.length}</span></div>
    {error && <p className="error">{error}</p>}
    <div className="table-wrap"><table><thead><tr><th>Date and time</th><th>User</th><th>Action</th><th>Record type</th><th>Record ID</th></tr></thead>
      <tbody>{rows.length ? rows.map(row => <tr key={row.id}><td>{new Date(row.createdAt).toLocaleString()}</td><td>{row.actor?.name || "System"}</td><td><span className="status">{row.action}</span></td><td>{row.entityType}</td><td className="record-id">{row.entityId || "-"}</td></tr>) : <tr><td className="empty" colSpan="5">No audited changes yet.</td></tr>}</tbody>
    </table></div>
  </section>;
}
