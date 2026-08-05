import { useCallback, useEffect, useRef, useState } from "react";
import { FiBell, FiCheck, FiChevronDown, FiX } from "react-icons/fi";
import { api } from "../services/api";

const initialData = { unreadCount: 0, rows: [], hasMore: false, nextCursor: null };
const formatTime = value => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export default function NotificationCenter({ onOpenTask }) {
  const [data, setData] = useState(initialData);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const panelRef = useRef(null);

  const load = useCallback(async ({ append = false, cursor = null } = {}) => {
    try {
      setBusy(true);
      const params = new URLSearchParams({ limit: "20" });
      if (cursor) { params.set("before", cursor.before); params.set("beforeId", cursor.beforeId); }
      const result = await api(`/notifications?${params}`);
      setData(current => ({ ...result, rows: append ? [...current.rows, ...result.rows] : result.rows }));
    } catch { /* Header notifications should not block the active page. */ } finally { setBusy(false); }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(() => load(), 30000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    const close = event => { if (panelRef.current && !panelRef.current.contains(event.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const toggle = () => {
    setOpen(value => {
      if (!value) load();
      return !value;
    });
  };
  const read = async row => {
    if (!row.readAt) await api(`/notifications/${row.id}/read`, { method: "PATCH" });
    if (row.taskId) { onOpenTask(row.taskId); setOpen(false); }
    await load();
  };
  const readAll = async () => { await api("/notifications/read-all", { method: "PATCH" }); await load(); };

  return <div className="notification-center" ref={panelRef}>
    <button className="notification-trigger" title="Notifications" aria-label={`${data.unreadCount} unread notifications`} onClick={toggle}>
      <FiBell/>{data.unreadCount > 0 && <span>{data.unreadCount > 99 ? "99+" : data.unreadCount}</span>}
    </button>
    {open && <div className="notification-panel">
      <div className="notification-head"><div><strong>Notifications</strong><small>{data.unreadCount} unread</small></div><div>{data.unreadCount > 0 && <button className="read-all" onClick={readAll}><FiCheck/> Read all</button>}<button title="Close" aria-label="Close notifications" onClick={() => setOpen(false)}><FiX/></button></div></div>
      <div className="notification-list">{data.rows.map(row => <button key={row.id} className={row.readAt ? "" : "unread"} onClick={() => read(row)}><span className="notification-dot"/><span className="notification-content"><strong>{row.title}</strong><span>{row.message}</span><small>{formatTime(row.createdAt)}</small></span></button>)}{!data.rows.length && <p>{busy ? "Loading..." : "No notifications yet."}</p>}</div>
      {data.hasMore && <button className="load-notifications" disabled={busy} onClick={() => load({ append: true, cursor: data.nextCursor })}><FiChevronDown/> {busy ? "Loading..." : "Load older"}</button>}
    </div>}
  </div>;
}
