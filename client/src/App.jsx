import { useState } from "react";
import { api } from "./services/api";
import { makePages } from "./pages/pageRegistry.jsx";
import NotificationCenter from "./components/NotificationCenter.jsx";

function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const isRegister = mode === "register";
  const resetMode = nextMode => {
    setMode(nextMode);
    setError("");
    if (nextMode === "login") setName("");
  };
  const submit = async event => {
    event.preventDefault();
    try {
      const data = await api(isRegister ? "/auth/register" : "/auth/login", {
        method: "POST",
        body: JSON.stringify(isRegister ? { name, email, password } : { email, password })
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onLogin(data.user);
    } catch (e) { setError(e.message); }
  };
  return <main className="login"><form onSubmit={submit}><div className="brand-mark">G</div><h1>Geomaticx</h1><p>Management & field operations</p>{error && <p className="error">{error}</p>}{isRegister && <label>Name<input type="text" required minLength="2" value={name} onChange={e => setName(e.target.value)}/></label>}<label>Email<input type="email" required value={email} onChange={e => setEmail(e.target.value)}/></label><label>Password<input type="password" required minLength={isRegister ? 10 : 8} value={password} onChange={e => setPassword(e.target.value)}/></label><button>{isRegister ? "Create account" : "Sign in"}</button><button type="button" className="secondary auth-switch" onClick={() => resetMode(isRegister ? "login" : "register")}>{isRegister ? "Back to sign in" : "Create a new account"}</button></form></main>;
}

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));
  const [page, setPage] = useState("Dashboard");
  const [focusedTask, setFocusedTask] = useState(null);
  if (!user) return <Login onLogin={setUser}/>;

  const pages = makePages(user, focusedTask);
  const visiblePages = Object.entries(pages).filter(([, config]) => !config.roles || config.roles.includes(user.role));
  const active = visiblePages.some(([name]) => name === page) ? page : "Dashboard";
  return <div className="shell">
    <aside>
      <div className="logo"><b>G</b><div><strong>Geomaticx</strong><small>Operations</small></div></div>
      <nav>{visiblePages.map(([name]) => <button className={active === name ? "active" : ""} key={name} onClick={() => setPage(name)}>{name}</button>)}</nav>
      <div className="account"><div className="account-row"><div><span>{user.name}</span><small>{user.role}</small></div><NotificationCenter onOpenTask={taskId => { setFocusedTask({ id: taskId, key: Date.now() }); setPage("Tasks"); }}/></div><button onClick={() => { localStorage.clear(); setUser(null); }}>Sign out</button></div>
    </aside>
    <main className="content">{pages[active].element}</main>
  </div>;
}
