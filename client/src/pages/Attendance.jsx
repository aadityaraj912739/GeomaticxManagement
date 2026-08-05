import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

const supervisoryRoles = ["ADMIN", "MANAGER", "HR"];
const employeeName = employee => `${employee.firstName} ${employee.lastName || ""}`.trim();

export default function Attendance({ currentUser }) {
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState({});
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

  const captureLocation = () => {
    setError("");
    if (!navigator.geolocation) return setError("Location is not supported by this browser");
    navigator.geolocation.getCurrentPosition(
      position => {
        setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setMessage("Current location captured");
      },
      () => setError("Location permission was denied or location is unavailable")
    );
  };

  const checkIn = async event => {
    event.preventDefault();
    if (submitting || todayAttendance) return;
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      await api("/attendance", {
        method: "POST",
        body: JSON.stringify({ ...(employeeId ? { employeeId } : {}), ...location, notes })
      });
      setNotes("");
      setLocation({});
      setMessage("Check-in recorded successfully");
      await load();
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const checkOut = async id => {
    setError("");
    setMessage("");
    try {
      await api(`/attendance/${id}/checkout`, { method: "PATCH" });
      setMessage("Check-out recorded successfully");
      await load();
    } catch (e) { setError(e.message); }
  };

  return <section>
    <div className="page-head">
      <div><span className="eyebrow">Employee self-service</span><h2>Attendance</h2></div>
      <span className="count">{rows.length} entries</span>
    </div>
    <p className="muted">Start your workday with check-in and close it with check-out. Location is optional.</p>
    {error && <p className="error">{error}</p>}
    {message && <p className="success">{message}</p>}
    <form className="form-grid" onSubmit={checkIn}>
      {canChooseEmployee && <label>Employee<select required value={employeeId} onChange={event => setEmployeeId(event.target.value)}>
        <option value="">Select employee</option>
        {employees.map(employee => <option key={employee.id} value={employee.id}>{employeeName(employee)} ({employee.employeeCode})</option>)}
      </select></label>}
      <label>Work notes<input value={notes} onChange={event => setNotes(event.target.value)} placeholder="Today's planned field work"/></label>
      <label>Location<span className="location-value">{location.latitude ? `${Number(location.latitude).toFixed(5)}, ${Number(location.longitude).toFixed(5)}` : "Not captured"}</span></label>
      <div className="actions">
        <button type="button" className="secondary" onClick={captureLocation}>Capture location</button>
        <button disabled={Boolean(todayAttendance) || submitting}>{submitting ? "Recording..." : "Check in"}</button>
      </div>
    </form>
    {todayAttendance && <p className="muted">Today&apos;s attendance is already recorded. Use the open row below to check out.</p>}
    <div className="table-wrap"><table><thead><tr><th>Employee</th><th>Work date</th><th>Check in</th><th>Check out</th><th>Location</th><th>Notes</th><th>Action</th></tr></thead>
      <tbody>{rows.length ? rows.map(row => <tr key={row.id}>
        <td>{row.Employee ? employeeName(row.Employee) : currentUser.name}</td>
        <td>{row.workDate}</td>
        <td>{row.checkIn ? new Date(row.checkIn).toLocaleTimeString() : "-"}</td>
        <td>{row.checkOut ? new Date(row.checkOut).toLocaleTimeString() : "Open"}</td>
        <td>{row.latitude && row.longitude ? `${row.latitude}, ${row.longitude}` : "-"}</td>
        <td>{row.notes || "-"}</td>
        <td>{!row.checkOut ? <button className="link" onClick={() => checkOut(row.id)}>Check out</button> : <span className="status status-active">Completed</span>}</td>
      </tr>) : <tr><td className="empty" colSpan="7">No attendance recorded yet.</td></tr>}</tbody>
    </table></div>
  </section>;
}
