import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import "../marketing.css";

const supervisoryRoles = ["ADMIN", "MANAGER", "HR"];
const employeeName = employee => `${employee.firstName} ${employee.lastName || ""}`.trim();

export default function Attendance({ currentUser }) {
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [notes, setNotes] = useState("");
  const [workDescription, setWorkDescription] = useState("");
  const [breakType, setBreakType] = useState("TEA");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const canChooseEmployee = supervisoryRoles.includes(currentUser.role);

  const load = async () => {
    try {
      const [attendance, employeeRows] = await Promise.all([
        api("/attendance"),
        canChooseEmployee ? api("/employees") : Promise.resolve([])
      ]);
      setRows(attendance);
      setEmployees(employeeRows);
    } catch (e) { setError(e.message); }
  };

  useEffect(() => {
    setEmployeeId("");
    setError("");
    setMessage("");
    load();
  }, [currentUser.id, currentUser.role]);

  useEffect(() => {
    if (!canChooseEmployee || employeeId) return;
    const ownEmployee = employees.find(employee => employee.userId === currentUser.id);
    if (ownEmployee) setEmployeeId(ownEmployee.id);
  }, [employees, canChooseEmployee, employeeId, currentUser.id]);

  const today = new Date().toISOString().slice(0, 10);
  const todayAttendance = useMemo(
    () => rows.find(row => row.workDate === today && (!employeeId || row.employeeId === employeeId)),
    [rows, employeeId]
  );

  const locate = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Location is not supported by this browser"));
    navigator.geolocation.getCurrentPosition(
      position => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude, locationAccuracy: position.coords.accuracy }),
      error => reject(new Error(error.code === 1 ? "Location permission is required for check-in" : "Current location could not be detected. Please enable GPS and retry")),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });

  const checkIn = async event => {
    event.preventDefault();
    if (submitting || todayAttendance) return;
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      setMessage("Detecting current location...");
      const location = await locate();
      await api("/attendance", {
        method: "POST",
        body: JSON.stringify({ ...(employeeId ? { employeeId } : {}), ...location, notes })
      });
      setNotes("");
      setMessage("Check-in recorded successfully");
      await load();
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const checkOut = async id => {
    setError("");
    setMessage("");
    try {
      await api(`/attendance/${id}/checkout`, { method: "PATCH", body: JSON.stringify({ workDescription }) });
      setWorkDescription("");
      setMessage("Check-out recorded successfully");
      await load();
    } catch (e) { setError(e.message); }
  };

  const startBreak = async id => {
    setError(""); setMessage("");
    try {
      await api(`/attendance/${id}/breaks`, { method: "POST", body: JSON.stringify({ breakType }) });
      setMessage(`${breakType.toLowerCase()} break started`);
      await load();
    } catch (e) { setError(e.message); }
  };

  const resumeWork = async (attendanceId, breakId) => {
    setError(""); setMessage("");
    try {
      await api(`/attendance/${attendanceId}/breaks/${breakId}/resume`, { method: "PATCH" });
      setMessage("Work resumed successfully");
      await load();
    } catch (e) { setError(e.message); }
  };

  return <section>
    <div className="page-head">
      <div><span className="eyebrow">Employee self-service</span><h2>Attendance</h2></div>
      <span className="count">{rows.length} entries</span>
    </div>
    <p className="muted">Check-in automatically captures your live location. Before check-out, add the work completed today. Break and resume events remain visible in attendance history.</p>
    {error && <p className="error">{error}</p>}
    {message && <p className="success">{message}</p>}
    <form className="form-grid" onSubmit={checkIn}>
      {canChooseEmployee && <label>Employee<select required value={employeeId} onChange={event => setEmployeeId(event.target.value)}>
        <option value="">Select employee</option>
        {employees.map(employee => <option key={employee.id} value={employee.id}>{employeeName(employee)} ({employee.employeeCode})</option>)}
      </select></label>}
      <label>Work notes<input value={notes} onChange={event => setNotes(event.target.value)} placeholder="Today's planned field work"/></label>
      <div className="actions">
        <button disabled={Boolean(todayAttendance) || submitting}>{submitting ? "Locating & recording..." : "Check in "}</button>
      </div>
    </form>
    {todayAttendance && <p className="muted">Today&apos;s attendance is already recorded. Use the open row below to check out.</p>}
    <div className="table-wrap"><table><thead><tr><th>Employee</th><th>Work date</th><th>Check in</th><th>Check out</th><th>Location</th><th>Notes / work done</th><th>Break history</th><th>Action</th></tr></thead>
      <tbody>{rows.length ? rows.map(row => { const activeBreak = row.breaks?.find(entry => !entry.resumedAt); return <tr key={row.id}>
        <td>{row.Employee ? employeeName(row.Employee) : currentUser.name}</td>
        <td>{row.workDate}</td>
        <td>{row.checkIn ? new Date(row.checkIn).toLocaleTimeString() : "-"}</td>
        <td>{row.checkOut ? new Date(row.checkOut).toLocaleTimeString() : "Open"}</td>
        <td>{row.latitude && row.longitude ? `${row.latitude}, ${row.longitude}` : "-"}</td>
        <td><div>{row.notes || "-"}</div>{row.workDescription && <small>Completed: {row.workDescription}</small>}</td>
        <td>{row.breaks?.length ? row.breaks.map(entry => <div key={entry.id}><small>{entry.breakType}: {new Date(entry.startedAt).toLocaleTimeString()} – {entry.resumedAt ? new Date(entry.resumedAt).toLocaleTimeString() : "Active"}</small></div>) : "-"}</td>
        <td>{!row.checkOut ? <div className="attendance-actions">{activeBreak
          ? <button className="link" onClick={() => resumeWork(row.id, activeBreak.id)}>Resume work</button>
          : <><select aria-label="Break type" value={breakType} onChange={event => setBreakType(event.target.value)}><option>TEA</option><option>LUNCH</option><option>PERSONAL</option><option>OTHER</option></select><button className="link" onClick={() => startBreak(row.id)}>Take break</button><input aria-label="Work completed today" value={workDescription} onChange={event => setWorkDescription(event.target.value)} placeholder="Work completed today"/><button className="link" disabled={!workDescription.trim()} onClick={() => checkOut(row.id)}>Check out</button></>}
        </div> : <span className="status status-active">Completed</span>}</td>
      </tr>}) : <tr><td className="empty" colSpan="8">No attendance recorded yet.</td></tr>}</tbody>
    </table></div>
  </section>;
}
