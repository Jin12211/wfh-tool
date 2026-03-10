import { useState, useCallback } from "react";

// ── Brand tokens ─────────────────────────────────────────────────────────────
const C = {
  black:   "#0D0D0E",
  white:   "#FFFFFF",
  yellow:  "#FFD65A",
  red:     "#EC570C",
  g09: "#19191C", g08: "#252527", g07: "#303033",
  g06: "#474749", g05: "#5E5E60", g04: "#757577",
  g03: "#9D9D9D", g02: "#C9CACA", g01: "#EFEFEF",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const parseCSV = (text) => {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map(line => {
    const vals = []; let cur = "", inQ = false;
    for (const ch of line) {
      if (ch === '"') inQ = !inQ;
      else if (ch === "," && !inQ) { vals.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    vals.push(cur.trim());
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""]));
  });
};
const extractReportingId = (str = "") => { const m = str.match(/\((\d+)\)/); return m ? m[1] : null; };
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ── Seed data ─────────────────────────────────────────────────────────────────
const SEED = [
  { "Last name, First name":"Cho, Yewon",    "Employee #":"207","Work Email":"claire@seoulrobotics.org",    "Job Information: Da":"02-21-2025",Location:"HQ - Seoul",Division:"Operation",Department:"Business",Teams:"People",  "Job Title":"Talent Acquisition Lead","Reporting to":"Cap (124)"},
  { "Last name, First name":"Ha, Jiwon",     "Employee #":"188","Work Email":"jiwon@seoulrobotics.org",     "Job Information: Da":"08-26-2025",Location:"HQ - Seoul",Division:"Operation",Department:"Business",Teams:"People",  "Job Title":"HR Generalist",          "Reporting to":"Jin (223)"},
  { "Last name, First name":"Ho, Dakyoung",  "Employee #":"177","Work Email":"raye@seoulrobotics.org",      "Job Information: Da":"12-08-2025",Location:"HQ - Seoul",Division:"Operation",Department:"Business",Teams:"Finance", "Job Title":"Accounting Manager",     "Reporting to":"Paul (166)"},
  { "Last name, First name":"Jo, Sooyeon",   "Employee #":"141","Work Email":"joy@seoulrobotics.org",       "Job Information: Da":"12-08-2025",Location:"HQ - Seoul",Division:"Operation",Department:"Business",Teams:"Finance", "Job Title":"Treasure Manager",       "Reporting to":"Paul (166)"},
  { "Last name, First name":"Jung, DaJin",   "Employee #":"223","Work Email":"jin@seoulrobotics.org",       "Job Information: Da":"08-26-2025",Location:"HQ - Seoul",Division:"Operation",Department:"Business",Teams:"People",  "Job Title":"People Business Partner","Reporting to":"Cap (124)"},
  { "Last name, First name":"Kim, Hyunmin",  "Employee #":"220","Work Email":"adam@seoulrobotics.org",      "Job Information: Da":"01-06-2026",Location:"HQ - Seoul",Division:"Operation",Department:"Business",Teams:"Strategy","Job Title":"Office Admin Staff",     "Reporting to":"Sangkil (228)"},
  { "Last name, First name":"Kim, Songrim",  "Employee #":"166","Work Email":"paul@seoulrobotics.org",      "Job Information: Da":"02-27-2024",Location:"HQ - Seoul",Division:"Operation",Department:"Business",Teams:"Finance", "Job Title":"Director Finance",       "Reporting to":"Cap (124)"},
  { "Last name, First name":"Moon, Hyejun",  "Employee #":"193","Work Email":"joshua@seoulrobotics.org",    "Job Information: Da":"01-06-2026",Location:"HQ - Seoul",Division:"Operation",Department:"Business",Teams:"Strategy","Job Title":"CEO Staff",              "Reporting to":"Sangkil (228)"},
  { "Last name, First name":"Son, Jeongwoo", "Employee #":"191","Work Email":"jason@seoulrobotics.org",     "Job Information: Da":"01-06-2026",Location:"HQ - Seoul",Division:"Operation",Department:"Business",Teams:"Strategy","Job Title":"Strategy Analyst",       "Reporting to":"Sangkil (228)"},
  { "Last name, First name":"Woo, Sangkil",  "Employee #":"228","Work Email":"woosangkil@seoulrobotics.org","Job Information: Da":"01-06-2026",Location:"HQ - Seoul",Division:"Operation",Department:"Business",Teams:"Strategy","Job Title":"CFO",                   "Reporting to":"Cap (124)"},
];
const deriveRole = (emp, all) => {
  if (emp["Employee #"] === "124") return "admin";
  return all.some(e => extractReportingId(e["Reporting to"]) === emp["Employee #"]) ? "manager" : "employee";
};
const genRecords = (emps) => {
  const r = []; const now = new Date();
  emps.forEach(emp => {
    for (let m = 0; m < 3; m++) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const days = Math.floor(Math.random() * 8) + 1;
      for (let i = 0; i < days; i++)
        r.push({ id:`${emp["Employee #"]}-${m}-${i}`, employeeId:emp["Employee #"], team:emp.Teams,
          date: new Date(d.getFullYear(), d.getMonth(), i*3+1).toISOString().slice(0,10),
          status:["approved","approved","approved","pending","rejected"][Math.floor(Math.random()*5)], reason:"Personal WFH request" });
    }
  });
  return r;
};



// ── UI primitives ─────────────────────────────────────────────────────────────
const Tag = ({ status }) => {
  const cfg = {
    approved:{ bg:"#1a2e1a", color:"#4ade80", label:"Approved" },
    pending: { bg:"#2e2510", color:C.yellow,   label:"Pending" },
    rejected:{ bg:"#2e1410", color:C.red,      label:"Rejected" },
  }[status] || { bg:C.g08, color:C.g03, label:status };
  return (
    <span style={{ background:cfg.bg, color:cfg.color, fontSize:11, fontWeight:600,
      padding:"2px 10px", borderRadius:2, letterSpacing:"0.03em", textTransform:"uppercase" }}>
      {cfg.label}
    </span>
  );
};

const RoleTag = ({ role }) => {
  const cfg = { admin:{ bg:C.yellow, color:C.black }, manager:{ bg:C.g07, color:C.white }, employee:{ bg:C.g08, color:C.g03 } }[role];
  return (
    <span style={{ background:cfg.bg, color:cfg.color, fontSize:10, fontWeight:700,
      padding:"2px 10px", borderRadius:2, letterSpacing:"0.08em", textTransform:"uppercase" }}>
      {role}
    </span>
  );
};

const Btn = ({ children, onClick, variant="primary", small=false }) => {
  const styles = {
    primary: { background:C.white, color:C.black, border:"none" },
    ghost:   { background:"transparent", color:C.white, border:`1px solid ${C.g06}` },
    danger:  { background:"transparent", color:C.red, border:`1px solid ${C.red}` },
    success: { background:"transparent", color:"#4ade80", border:"1px solid #4ade80" },
  };
  const s = styles[variant];
  return (
    <button onClick={onClick} style={{ ...s, fontFamily:"inherit", fontWeight:600,
      fontSize: small ? 11 : 13, padding: small ? "4px 12px" : "8px 20px",
      cursor:"pointer", borderRadius:2, letterSpacing:"0.03em", transition:"opacity .15s" }}
      onMouseEnter={e=>e.currentTarget.style.opacity=".75"}
      onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
      {children}
    </button>
  );
};

const Input = ({ label, ...props }) => (
  <div style={{ marginBottom:16 }}>
    {label && <div style={{ color:C.g03, fontSize:11, fontWeight:600, letterSpacing:"0.08em",
      textTransform:"uppercase", marginBottom:6 }}>{label}</div>}
    <input {...props} style={{ width:"100%", background:C.g08, border:`1px solid ${C.g06}`,
      color:C.white, padding:"10px 14px", borderRadius:2, fontFamily:"inherit", fontSize:14,
      outline:"none", boxSizing:"border-box" }}
      onFocus={e => e.target.style.borderColor = C.yellow}
      onBlur={e => e.target.style.borderColor = C.g06} />
  </div>
);

const Divider = () => <div style={{ height:1, background:C.g08, margin:"16px 0" }}/>;

// ── Bar chart ──────────────────────────────────────────────────────────────────
const Bar = ({ data, accent = C.yellow }) => {
  const max = Math.max(...data.map(d=>d.v), 1);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:80 }}>
      {data.map((d,i) => (
        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
          <span style={{ color:C.g03, fontSize:11 }}>{d.v}</span>
          <div style={{ width:"100%", background:accent, borderRadius:"2px 2px 0 0",
            height: Math.max(d.v/max*52, d.v>0?3:0), opacity:0.85 }}/>
          <span style={{ color:C.g04, fontSize:10 }}>{d.l}</span>
        </div>
      ))}
    </div>
  );
};

const Card = ({ title, children, accent }) => (
  <div style={{ background:C.g09, border:`1px solid ${C.g08}`, borderRadius:2,
    borderTop: accent ? `2px solid ${accent}` : undefined, padding:20 }}>
    {title && <div style={{ color:C.g03, fontSize:11, fontWeight:700, letterSpacing:"0.1em",
      textTransform:"uppercase", marginBottom:16 }}>{title}</div>}
    {children}
  </div>
);

// ── SCREENS ───────────────────────────────────────────────────────────────────
const LoginScreen = ({ employees, onLogin }) => {
  const [email, setEmail] = useState(""); const [err, setErr] = useState("");
  const go = () => {
    const emp = employees.find(e => e["Work Email"].toLowerCase() === email.toLowerCase().trim());
    if (!emp) { setErr("No account found for this email address."); return; }
    onLogin(emp);
  };
  return (
    <div style={{ minHeight:"100vh", background:C.black, display:"flex", alignItems:"center",
      justifyContent:"center", padding:24, fontFamily:"'Pretendard', 'Inter', sans-serif" }}>
      <div style={{ width:"100%", maxWidth:400 }}>
        {/* Logo */}
        <div style={{ marginBottom:48 }}>
          <div style={{ color:C.white, fontWeight:700, fontSize:28, letterSpacing:"-0.03em", lineHeight:1.05 }}>Seoul</div>
          <div style={{ color:C.white, fontWeight:700, fontSize:28, letterSpacing:"-0.03em", lineHeight:1.05 }}>Robotics</div>
        </div>

        <div style={{ marginBottom:8 }}>
          <div style={{ color:C.white, fontWeight:700, fontSize:28, letterSpacing:"-0.03em", lineHeight:1.15 }}>
            WFH Approval
          </div>
          <div style={{ color:C.g04, fontSize:14, marginTop:6, letterSpacing:"-0.01em" }}>
            Sign in with your work email via Google SSO
          </div>
        </div>

        <div style={{ height:1, background:C.g08, margin:"24px 0" }}/>

        <Input label="Work Email" type="email" placeholder="you@seoulrobotics.org"
          value={email} onChange={e => { setEmail(e.target.value); setErr(""); }}
          onKeyDown={e => e.key === "Enter" && go()} />

        {err && <div style={{ color:C.red, fontSize:12, marginBottom:12, letterSpacing:"-0.01em" }}>{err}</div>}

        <Btn onClick={go}>Sign in with Google SSO →</Btn>

        <div style={{ marginTop:24, color:C.g06, fontSize:11, letterSpacing:"0.05em" }}>
          TRY &nbsp;·&nbsp; claire@seoulrobotics.org &nbsp;·&nbsp; paul@seoulrobotics.org &nbsp;·&nbsp; woosangkil@seoulrobotics.org
        </div>
      </div>
    </div>
  );
};

// My Requests
const MyRequests = ({ user, records, onNew, onCancel }) => {
  const mine = records.filter(r => r.employeeId === user["Employee #"]);
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div style={{ color:C.white, fontWeight:700, fontSize:20, letterSpacing:"-0.03em" }}>My WFH Requests</div>
        <Btn onClick={onNew}>+ New Request</Btn>
      </div>
      {mine.length === 0
        ? <div style={{ color:C.g05, fontSize:14, padding:"40px 0", textAlign:"center" }}>No requests yet.</div>
        : <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${C.g08}` }}>
                {["Date","Reason","Status","Action"].map(h => (
                  <th key={h} style={{ textAlign:"left", color:C.g04, fontSize:11, fontWeight:700,
                    letterSpacing:"0.08em", textTransform:"uppercase", padding:"8px 16px 8px 0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mine.map(r => (
                <tr key={r.id} style={{ borderBottom:`1px solid ${C.g09}` }}>
                  <td style={{ color:C.white, fontSize:13, padding:"12px 16px 12px 0" }}>{r.date}</td>
                  <td style={{ color:C.g03, fontSize:13, padding:"12px 16px 12px 0" }}>{r.reason}</td>
                  <td style={{ padding:"12px 16px 12px 0" }}><Tag status={r.status}/></td>
                  <td style={{ padding:"12px 0" }}>
                    {r.status === "pending" && <Btn variant="danger" small onClick={() => onCancel(r.id)}>Cancel</Btn>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      }
    </div>
  );
};

// New Request Modal
const Modal = ({ onSubmit, onClose }) => {
  const [date, setDate] = useState(""); const [reason, setReason] = useState("");
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", display:"flex",
      alignItems:"center", justifyContent:"center", zIndex:100, padding:24 }}>
      <div style={{ background:C.g09, border:`1px solid ${C.g07}`, borderTop:`2px solid ${C.yellow}`,
        borderRadius:2, padding:28, width:"100%", maxWidth:400 }}>
        <div style={{ color:C.white, fontWeight:700, fontSize:18, letterSpacing:"-0.02em", marginBottom:20 }}>
          New WFH Request
        </div>
        <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <div style={{ marginBottom:16 }}>
          <div style={{ color:C.g03, fontSize:11, fontWeight:700, letterSpacing:"0.08em",
            textTransform:"uppercase", marginBottom:6 }}>Reason</div>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
            placeholder="Brief reason..." style={{ width:"100%", background:C.g08, border:`1px solid ${C.g06}`,
            color:C.white, padding:"10px 14px", borderRadius:2, fontFamily:"inherit", fontSize:14,
            outline:"none", resize:"none", boxSizing:"border-box" }}
            onFocus={e => e.target.style.borderColor = C.yellow}
            onBlur={e => e.target.style.borderColor = C.g06} />
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <Btn onClick={() => date && reason && onSubmit(date, reason)}>Submit Request</Btn>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        </div>
      </div>
    </div>
  );
};

// Approvals
const Approvals = ({ user, employees, records, onApprove, onReject }) => {
  const myTeamIds = employees.filter(e => extractReportingId(e["Reporting to"]) === user["Employee #"]).map(e => e["Employee #"]);
  const pending = records.filter(r => myTeamIds.includes(r.employeeId) && r.status === "pending");
  const getEmp = id => employees.find(e => e["Employee #"] === id);
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <div style={{ color:C.white, fontWeight:700, fontSize:20, letterSpacing:"-0.03em" }}>Pending Approvals</div>
        {pending.length > 0 && (
          <span style={{ background:C.red, color:C.white, borderRadius:2, fontSize:11, fontWeight:700,
            padding:"2px 8px", letterSpacing:"0.05em" }}>{pending.length}</span>
        )}
      </div>
      {pending.length === 0
        ? <div style={{ color:C.g05, fontSize:14, padding:"40px 0", textAlign:"center" }}>No pending requests from your team.</div>
        : <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {pending.map(r => {
              const emp = getEmp(r.employeeId);
              return (
                <div key={r.id} style={{ background:C.g09, border:`1px solid ${C.g08}`, borderRadius:2,
                  padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
                  <div>
                    <div style={{ color:C.white, fontWeight:600, fontSize:14 }}>{emp?.["Last name, First name"]}</div>
                    <div style={{ color:C.g04, fontSize:12, marginTop:2 }}>{emp?.["Job Title"]} &nbsp;·&nbsp; {r.date}</div>
                    <div style={{ color:C.g05, fontSize:12, marginTop:2 }}>{r.reason}</div>
                  </div>
                  <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                    <Btn variant="success" small onClick={() => onApprove(r.id)}>Approve</Btn>
                    <Btn variant="danger" small onClick={() => onReject(r.id)}>Reject</Btn>
                  </div>
                </div>
              );
            })}
          </div>
      }
    </div>
  );
};

// Team Dashboard
const TeamDash = ({ user, employees, records }) => {
  const now = new Date();
  const myTeamIds = employees.filter(e => extractReportingId(e["Reporting to"]) === user["Employee #"]).map(e => e["Employee #"]);
  const teamRecs = records.filter(r => myTeamIds.includes(r.employeeId) && r.status === "approved");
  const monthData = Array.from({length:3},(_,i) => {
    const d = new Date(now.getFullYear(), now.getMonth()-(2-i), 1);
    return { l:MONTHS[d.getMonth()], v:teamRecs.filter(r=>r.date.startsWith(d.toISOString().slice(0,7))).length };
  });
  const memberData = myTeamIds.map(id => {
    const emp = employees.find(e=>e["Employee #"]===id);
    return { l:emp?.["Last name, First name"].split(",")[0]??id, v:teamRecs.filter(r=>r.employeeId===id).length };
  });
  return (
    <div>
      <div style={{ color:C.white, fontWeight:700, fontSize:20, letterSpacing:"-0.03em", marginBottom:20 }}>Team Dashboard</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
        <Card title="WFH Days by Month" accent={C.yellow}><Bar data={monthData} accent={C.yellow}/></Card>
        <Card title="WFH Days by Member" accent={C.g06}><Bar data={memberData} accent={C.g04}/></Card>
      </div>
      <Card title="Team Members">
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr style={{ borderBottom:`1px solid ${C.g08}` }}>
            {["Name","Title","WFH Days"].map(h=>(
              <th key={h} style={{ textAlign:"left", color:C.g04, fontSize:11, fontWeight:700,
                letterSpacing:"0.08em", textTransform:"uppercase", padding:"6px 16px 6px 0" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {myTeamIds.map(id => {
              const emp = employees.find(e=>e["Employee #"]===id);
              return (
                <tr key={id} style={{ borderBottom:`1px solid ${C.g09}` }}>
                  <td style={{ color:C.white, fontSize:13, padding:"10px 16px 10px 0" }}>{emp?.["Last name, First name"]}</td>
                  <td style={{ color:C.g04, fontSize:13, padding:"10px 16px 10px 0" }}>{emp?.["Job Title"]}</td>
                  <td style={{ color:C.yellow, fontSize:13, fontWeight:700, padding:"10px 0" }}>{teamRecs.filter(r=>r.employeeId===id).length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

// Org Dashboard
const OrgDash = ({ employees, records }) => {
  const now = new Date(); const approved = records.filter(r=>r.status==="approved");
  const teams = [...new Set(employees.map(e=>e.Teams))];
  const teamData = teams.map(t => ({ l:t, v:approved.filter(r=>r.team===t).length }));
  const monthData = Array.from({length:3},(_,i)=>{
    const d = new Date(now.getFullYear(), now.getMonth()-(2-i), 1);
    return { l:MONTHS[d.getMonth()], v:approved.filter(r=>r.date.startsWith(d.toISOString().slice(0,7))).length };
  });
  return (
    <div>
      <div style={{ color:C.white, fontWeight:700, fontSize:20, letterSpacing:"-0.03em", marginBottom:20 }}>Organizational Dashboard</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
        <Card title="Total WFH Days by Month" accent={C.yellow}><Bar data={monthData} accent={C.yellow}/></Card>
        <Card title="WFH Days by Team" accent={C.g06}><Bar data={teamData} accent={C.red}/></Card>
      </div>
      <Card title="All Employees">
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ borderBottom:`1px solid ${C.g08}` }}>
              {["Name","Team","Title","WFH Days"].map(h=>(
                <th key={h} style={{ textAlign:"left", color:C.g04, fontSize:11, fontWeight:700,
                  letterSpacing:"0.08em", textTransform:"uppercase", padding:"6px 16px 6px 0" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp["Employee #"]} style={{ borderBottom:`1px solid ${C.g09}` }}>
                  <td style={{ color:C.white, fontSize:13, padding:"10px 16px 10px 0" }}>{emp["Last name, First name"]}</td>
                  <td style={{ color:C.g04, fontSize:13, padding:"10px 16px 10px 0" }}>{emp.Teams}</td>
                  <td style={{ color:C.g04, fontSize:13, padding:"10px 16px 10px 0" }}>{emp["Job Title"]}</td>
                  <td style={{ color:C.yellow, fontSize:13, fontWeight:700, padding:"10px 0" }}>{approved.filter(r=>r.employeeId===emp["Employee #"]).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// Employee Management
const EmployeeMgmt = ({ employees, onImport }) => {
  const ref = useCallback(n => { if(n) n.value=""; }, []);
  const handleFile = e => { const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=ev=>onImport(ev.target.result); r.readAsText(f); };
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div style={{ color:C.white, fontWeight:700, fontSize:20, letterSpacing:"-0.03em" }}>Employee Management</div>
        <label style={{ background:C.white, color:C.black, fontSize:13, fontWeight:600,
          padding:"8px 20px", borderRadius:2, cursor:"pointer", letterSpacing:"0.03em" }}>
          Import CSV
          <input ref={ref} type="file" accept=".csv" style={{ display:"none" }} onChange={handleFile}/>
        </label>
      </div>
      <div style={{ color:C.g05, fontSize:12, marginBottom:16, letterSpacing:"-0.01em" }}>
        CSV must include: Last name, First name · Employee # · Work Email · Teams · Job Title · Reporting to
      </div>
      <Card>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ borderBottom:`1px solid ${C.g08}` }}>
              {["#","Name","Email","Team","Title","Reports To"].map(h=>(
                <th key={h} style={{ textAlign:"left", color:C.g04, fontSize:11, fontWeight:700,
                  letterSpacing:"0.08em", textTransform:"uppercase", padding:"6px 16px 6px 0" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp["Employee #"]} style={{ borderBottom:`1px solid ${C.g09}` }}>
                  <td style={{ color:C.g04, fontSize:12, padding:"10px 16px 10px 0" }}>{emp["Employee #"]}</td>
                  <td style={{ color:C.white, fontSize:12, padding:"10px 16px 10px 0" }}>{emp["Last name, First name"]}</td>
                  <td style={{ color:C.g04, fontSize:12, padding:"10px 16px 10px 0" }}>{emp["Work Email"]}</td>
                  <td style={{ color:C.g04, fontSize:12, padding:"10px 16px 10px 0" }}>{emp.Teams}</td>
                  <td style={{ color:C.g04, fontSize:12, padding:"10px 16px 10px 0" }}>{emp["Job Title"]}</td>
                  <td style={{ color:C.g04, fontSize:12, padding:"10px 0" }}>{emp["Reporting to"]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [employees, setEmployees] = useState(SEED);
  const [records, setRecords] = useState(() => genRecords(SEED));
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [tab, setTab] = useState("my");
  const [modal, setModal] = useState(false);

  const login = emp => { setUser(emp); setRole(deriveRole(emp, employees)); setTab("my"); };
  const logout = () => { setUser(null); setRole(null); };
  const newReq = (date, reason) => {
    setRecords(r => [...r, { id:`${user["Employee #"]}-${Date.now()}`, employeeId:user["Employee #"],
      team:user.Teams, date, status:"pending", reason }]);
    setModal(false);
  };
  const importCSV = text => {
    try {
      const p = parseCSV(text);
      if (p.length) { setEmployees(p); setRecords(genRecords(p)); alert(`✅ Imported ${p.length} employees.`); }
    } catch { alert("❌ Failed to parse CSV."); }
  };

  if (!user) return <LoginScreen employees={employees} onLogin={login}/>;

  const isManager = role === "manager" || role === "admin";
  const TABS = [
    { key:"my", label:"My Requests" },
    ...(isManager ? [{ key:"approvals", label:"Approvals" }, { key:"team", label:"Team Dashboard" }] : []),
    ...(role === "admin" ? [{ key:"org", label:"Org Dashboard" }, { key:"employees", label:"Employees" }] : []),
  ];

  return (
    <div style={{ minHeight:"100vh", background:C.black, fontFamily:"'Pretendard','Inter',sans-serif", color:C.white }}>
      {/* Top nav */}
      <div style={{ background:C.g09, borderBottom:`1px solid ${C.g08}`, padding:"0 28px",
        display:"flex", alignItems:"center", justifyContent:"space-between", height:56 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ display:"flex", flexDirection:"column", lineHeight:1.1 }}>
            <span style={{ fontWeight:700, fontSize:14, letterSpacing:"-0.03em" }}>Seoul Robotics</span>
            <span style={{ color:C.g04, fontSize:10, letterSpacing:"0.06em", textTransform:"uppercase" }}>WFH Approval</span>
          </div>
          {/* nav divider */}
          <div style={{ width:1, height:24, background:C.g07, margin:"0 12px" }}/>
          <div style={{ color:C.g03, fontSize:12 }}>{user["Last name, First name"]}</div>
          <RoleTag role={role}/>
        </div>
        <button onClick={logout} style={{ background:"none", border:"none", color:C.g05,
          fontFamily:"inherit", fontSize:12, cursor:"pointer", letterSpacing:"0.03em" }}>
          Sign out
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ background:C.g09, borderBottom:`1px solid ${C.g08}`, padding:"0 28px", display:"flex", gap:0 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background:"none", border:"none", borderBottom: tab===t.key ? `2px solid ${C.yellow}` : "2px solid transparent",
            color: tab===t.key ? C.white : C.g04, fontFamily:"inherit", fontSize:13, fontWeight: tab===t.key ? 600 : 400,
            padding:"14px 20px", cursor:"pointer", letterSpacing:"-0.01em", transition:"color .15s"
          }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth:960, margin:"0 auto", padding:28 }}>
        {tab === "my"        && <MyRequests user={user} records={records} onNew={() => setModal(true)} onCancel={id => setRecords(r=>r.filter(x=>x.id!==id))}/>}
        {tab === "approvals" && isManager && <Approvals user={user} employees={employees} records={records} onApprove={id=>setRecords(r=>r.map(x=>x.id===id?{...x,status:"approved"}:x))} onReject={id=>setRecords(r=>r.map(x=>x.id===id?{...x,status:"rejected"}:x))}/>}
        {tab === "team"      && isManager && <TeamDash user={user} employees={employees} records={records}/>}
        {tab === "org"       && role==="admin" && <OrgDash employees={employees} records={records}/>}
        {tab === "employees" && role==="admin" && <EmployeeMgmt employees={employees} onImport={importCSV}/>}
      </div>

      {modal && <Modal onSubmit={newReq} onClose={() => setModal(false)}/>}
    </div>
  );
}