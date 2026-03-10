import { useState, useCallback } from "react";

const C = {
  black:"#0D0D0E", white:"#FFFFFF", yellow:"#FFD65A", red:"#EC570C",
  g09:"#19191C", g08:"#252527", g07:"#303033", g06:"#474749",
  g05:"#5E5E60", g04:"#757577", g03:"#9D9D9D", g02:"#C9CACA", g01:"#EFEFEF",
};

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
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const ADMIN_EMAIL = "jin@seoulrobotics.org";

const toFullName = (str) => {
  if (!str) return "";
  const p = str.split(",");
  return p.length > 1 ? `${p[1].trim()} ${p[0].trim()}` : str;
};

const SEED = [
  { "Last name, First name":"Cho, Yewon",    "Employee #":"207","Work Email":"claire@seoulrobotics.org","Password":"1234","Job Title":"Talent Acquisition Lead","Teams":"People",  "Reporting to":"Cap (124)"},
  { "Last name, First name":"Ha, Jiwon",     "Employee #":"188","Work Email":"jiwon@seoulrobotics.org", "Password":"1234","Job Title":"HR Generalist",          "Teams":"People",  "Reporting to":"Jin (223)"},
  { "Last name, First name":"Ho, Dakyoung",  "Employee #":"177","Work Email":"raye@seoulrobotics.org",  "Password":"1234","Job Title":"Accounting Manager",     "Teams":"Finance", "Reporting to":"Paul (166)"},
  { "Last name, First name":"Jo, Sooyeon",   "Employee #":"141","Work Email":"joy@seoulrobotics.org",   "Password":"1234","Job Title":"Treasure Manager",       "Teams":"Finance", "Reporting to":"Paul (166)"},
  { "Last name, First name":"Jung, DaJin",   "Employee #":"223","Work Email":"jin@seoulrobotics.org",   "Password":"1234","Job Title":"People Business Partner","Teams":"People",  "Reporting to":"Cap (124)"},
  { "Last name, First name":"Kim, Hyunmin",  "Employee #":"220","Work Email":"adam@seoulrobotics.org",  "Password":"1234","Job Title":"Office Admin Staff",     "Teams":"Strategy","Reporting to":"Sangkil (228)"},
  { "Last name, First name":"Kim, Songrim",  "Employee #":"166","Work Email":"paul@seoulrobotics.org",  "Password":"1234","Job Title":"Director Finance",       "Teams":"Finance", "Reporting to":"Cap (124)"},
  { "Last name, First name":"Moon, Hyejun",  "Employee #":"193","Work Email":"joshua@seoulrobotics.org","Password":"1234","Job Title":"CEO Staff",              "Teams":"Strategy","Reporting to":"Sangkil (228)"},
  { "Last name, First name":"Son, Jeongwoo", "Employee #":"191","Work Email":"jason@seoulrobotics.org", "Password":"1234","Job Title":"Strategy Analyst",       "Teams":"Strategy","Reporting to":"Sangkil (228)"},
  { "Last name, First name":"Woo, Sangkil",  "Employee #":"228","Work Email":"woosangkil@seoulrobotics.org","Password":"1234","Job Title":"CFO","Teams":"Strategy","Reporting to":"Cap (124)"},
];

const deriveRole = (emp, all) => {
  if (emp["Work Email"] === ADMIN_EMAIL) return "admin";
  return all.some(e => extractReportingId(e["Reporting to"]) === emp["Employee #"]) ? "manager" : "employee";
};

const genRecords = (emps) => {
  const r = []; const now = new Date();
  emps.forEach(emp => {
    for (let m = 0; m < 4; m++) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const days = Math.floor(Math.random() * 6) + 1;
      for (let i = 0; i < days; i++)
        r.push({ id:`${emp["Employee #"]}-${m}-${i}`, employeeId:emp["Employee #"], team:emp.Teams,
          date: new Date(d.getFullYear(), d.getMonth(), i*3+2).toISOString().slice(0,10),
          half: null, status:["approved","approved","approved","pending","rejected"][Math.floor(Math.random()*5)], reason:"WFH request" });
    }
  });
  return r;
};

// ── UI Primitives ─────────────────────────────────────────────────────────────
const Tag = ({ status }) => {
  const cfg = { approved:{bg:"#1a2e1a",color:"#4ade80"}, pending:{bg:"#2e2510",color:C.yellow}, rejected:{bg:"#2e1410",color:C.red}, cancelled:{bg:"#1e1e1e",color:C.g04} }[status] || {bg:C.g08,color:C.g03};
  return <span style={{background:cfg.bg,color:cfg.color,fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:2,letterSpacing:"0.05em",textTransform:"uppercase"}}>{status}</span>;
};
const RoleTag = ({ role }) => {
  const cfg = { admin:{bg:C.yellow,color:C.black}, manager:{bg:C.g07,color:C.white}, employee:{bg:C.g08,color:C.g03} }[role];
  return <span style={{background:cfg.bg,color:cfg.color,fontSize:10,fontWeight:700,padding:"2px 10px",borderRadius:2,letterSpacing:"0.08em",textTransform:"uppercase"}}>{role}</span>;
};
const Btn = ({ children, onClick, variant="primary", small=false, full=false, active=false }) => {
  const s = {
    primary:{background:C.white,color:C.black,border:"none"},
    ghost:{background:active?C.g07:"transparent",color:active?C.white:C.g03,border:`1px solid ${active?C.g05:C.g07}`},
    danger:{background:"transparent",color:C.red,border:`1px solid ${C.red}`},
    success:{background:"transparent",color:"#4ade80",border:"1px solid #4ade80"},
    yellow:{background:C.yellow,color:C.black,border:"none"},
  }[variant];
  return <button onClick={onClick} style={{...s,fontFamily:"inherit",fontWeight:600,fontSize:small?11:13,padding:small?"4px 12px":"9px 20px",cursor:"pointer",borderRadius:2,letterSpacing:"0.03em",width:full?"100%":"auto",transition:"opacity .15s",whiteSpace:"nowrap"}} onMouseEnter={e=>e.currentTarget.style.opacity=".75"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>{children}</button>;
};
const Field = ({ label, children }) => (
  <div style={{marginBottom:16}}>
    <div style={{color:C.g03,fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>{label}</div>
    {children}
  </div>
);
const TextInput = ({ value, onChange, placeholder, type="text" }) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder}
    style={{width:"100%",background:C.g08,border:`1px solid ${C.g06}`,color:C.white,padding:"10px 14px",borderRadius:2,fontFamily:"inherit",fontSize:14,outline:"none",boxSizing:"border-box"}}
    onFocus={e=>e.target.style.borderColor=C.yellow} onBlur={e=>e.target.style.borderColor=C.g06}/>
);
const Select = ({ value, onChange, children }) => (
  <select value={value} onChange={onChange} style={{background:C.g08,border:`1px solid ${C.g06}`,color:C.white,padding:"7px 12px",borderRadius:2,fontFamily:"inherit",fontSize:12,outline:"none",cursor:"pointer"}}>
    {children}
  </select>
);
const Card = ({ title, children, accent, extra }) => (
  <div style={{background:C.g09,border:`1px solid ${C.g08}`,borderRadius:2,borderTop:accent?`2px solid ${accent}`:undefined,padding:20,marginBottom:12}}>
    {(title||extra) && <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
      {title && <div style={{color:C.g03,fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase"}}>{title}</div>}
      {extra}
    </div>}
    {children}
  </div>
);
const THead = ({ cols }) => (
  <thead><tr style={{borderBottom:`1px solid ${C.g08}`}}>{cols.map(c=><th key={c} style={{textAlign:"left",color:C.g04,fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",padding:"6px 16px 6px 0",whiteSpace:"nowrap"}}>{c}</th>)}</tr></thead>
);
const StatBox = ({ label, value, color=C.yellow }) => (
  <div style={{background:C.g08,border:`1px solid ${C.g07}`,borderRadius:2,padding:"14px 18px",flex:1}}>
    <div style={{color:color,fontSize:24,fontWeight:700,letterSpacing:"-0.03em"}}>{value}</div>
    <div style={{color:C.g04,fontSize:11,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",marginTop:4}}>{label}</div>
  </div>
);

// ── Calendar Picker ───────────────────────────────────────────────────────────
const CalendarPicker = ({ selected, onChange }) => {
  const now = new Date();
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const firstDay = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const prevMonth = () => setView(v => v.m === 0 ? {y:v.y-1,m:11} : {y:v.y,m:v.m-1});
  const nextMonth = () => setView(v => v.m === 11 ? {y:v.y+1,m:0} : {y:v.y,m:v.m+1});
  const dateKey = (d) => `${view.y}-${String(view.m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const isWeekend = (d) => [0,6].includes(new Date(view.y, view.m, d).getDay());
  const isPast = (d) => new Date(view.y, view.m, d) < new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const toggleDay = (d) => {
    if (isWeekend(d) || isPast(d)) return;
    const k = dateKey(d), exists = selected.find(s=>s.date===k);
    if (exists) onChange(selected.filter(s=>s.date!==k));
    else onChange([...selected,{date:k,half:null}]);
  };
  const setHalf = (date, half) => onChange(selected.map(s=>s.date===date?{...s,half:s.half===half?null:half}:s));
  const getEntry = (d) => selected.find(s=>s.date===dateKey(d));
  const pfx = `${view.y}-${String(view.m+1).padStart(2,"0")}`;
  const monthSelected = selected.filter(s=>s.date.startsWith(pfx));
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <button onClick={prevMonth} style={{background:"none",border:"none",color:C.white,cursor:"pointer",fontSize:18,padding:"0 8px"}}>‹</button>
        <span style={{color:C.white,fontWeight:700,fontSize:14}}>{MONTHS[view.m]} {view.y}</span>
        <button onClick={nextMonth} style={{background:"none",border:"none",color:C.white,cursor:"pointer",fontSize:18,padding:"0 8px"}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
        {DAYS.map(d=><div key={d} style={{textAlign:"center",color:C.g04,fontSize:10,fontWeight:700,letterSpacing:"0.05em",padding:"4px 0"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
        {Array.from({length:firstDay}).map((_,i)=><div key={`e${i}`}/>)}
        {Array.from({length:daysInMonth},(_,i)=>i+1).map(d=>{
          const entry=getEntry(d), disabled=isWeekend(d)||isPast(d), sel=!!entry;
          return <div key={d} onClick={()=>toggleDay(d)} style={{textAlign:"center",padding:"8px 2px",borderRadius:2,cursor:disabled?"not-allowed":"pointer",background:sel?C.yellow:"transparent",color:disabled?C.g07:sel?C.black:C.white,fontWeight:sel?700:400,fontSize:13,border:`1px solid ${sel?C.yellow:"transparent"}`,transition:"all .1s"}}>{d}</div>;
        })}
      </div>
      {monthSelected.length>0 && (
        <div style={{marginTop:16}}>
          <div style={{color:C.g03,fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>Half Day Options</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {monthSelected.map(s=>(
              <div key={s.date} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:C.g08,padding:"8px 12px",borderRadius:2}}>
                <span style={{color:C.white,fontSize:12}}>{s.date}</span>
                <div style={{display:"flex",gap:6}}>
                  {["AM","PM"].map(h=><button key={h} onClick={()=>setHalf(s.date,h)} style={{background:s.half===h?C.yellow:"transparent",color:s.half===h?C.black:C.g03,border:`1px solid ${s.half===h?C.yellow:C.g06}`,fontFamily:"inherit",fontWeight:700,fontSize:11,padding:"3px 10px",borderRadius:2,cursor:"pointer"}}>0.5 {h}</button>)}
                  <button onClick={()=>setHalf(s.date,null)} style={{background:s.half===null?C.g06:"transparent",color:s.half===null?C.white:C.g05,border:`1px solid ${s.half===null?C.g05:C.g07}`,fontFamily:"inherit",fontWeight:700,fontSize:11,padding:"3px 10px",borderRadius:2,cursor:"pointer"}}>Full</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {selected.length>0 && <div style={{marginTop:10,color:C.g04,fontSize:12}}>{selected.length} day(s) selected · {selected.reduce((a,s)=>a+(s.half?0.5:1),0)} total days</div>}
    </div>
  );
};

// ── Login ─────────────────────────────────────────────────────────────────────
const LoginScreen = ({ employees, onLogin }) => {
  const [email,setEmail]=useState(""); const [pw,setPw]=useState(""); const [err,setErr]=useState("");
  const go = () => {
    const emp=employees.find(e=>e["Work Email"].toLowerCase()===email.toLowerCase().trim());
    if (!emp){setErr("No account found.");return;}
    if (emp.Password!==pw){setErr("Incorrect password.");return;}
    onLogin(emp);
  };
  return (
    <div style={{minHeight:"100vh",background:C.black,display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Inter',sans-serif"}}>
      <div style={{width:"100%",maxWidth:400}}>
        <div style={{marginBottom:40}}>
          <div style={{color:C.white,fontWeight:700,fontSize:28,letterSpacing:"-0.03em",lineHeight:1.05}}>Seoul</div>
          <div style={{color:C.white,fontWeight:700,fontSize:28,letterSpacing:"-0.03em",lineHeight:1.05}}>Robotics</div>
          <div style={{color:C.g04,fontSize:12,letterSpacing:"0.1em",textTransform:"uppercase",marginTop:4}}>WFH Approval</div>
        </div>
        <div style={{height:1,background:C.g08,marginBottom:28}}/>
        <Field label="Work Email"><TextInput value={email} onChange={e=>{setEmail(e.target.value);setErr("")}} placeholder="you@seoulrobotics.org"/></Field>
        <Field label="Password"><TextInput type="password" value={pw} onChange={e=>{setPw(e.target.value);setErr("")}} placeholder="Enter your password"/></Field>
        {err&&<div style={{color:C.red,fontSize:12,marginBottom:12}}>{err}</div>}
        <Btn onClick={go} full>Sign In →</Btn>
        <div style={{marginTop:20,color:C.g06,fontSize:11}}>Default password for all accounts: <span style={{color:C.g04}}>1234</span></div>
      </div>
    </div>
  );
};

// ── New Request Modal ─────────────────────────────────────────────────────────
const NewRequestModal = ({ onSubmit, onClose }) => {
  const [dates,setDates]=useState([]); const [reason,setReason]=useState("");
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:24,overflowY:"auto"}}>
      <div style={{background:C.g09,border:`1px solid ${C.g07}`,borderTop:`2px solid ${C.yellow}`,borderRadius:2,padding:28,width:"100%",maxWidth:480,margin:"auto"}}>
        <div style={{color:C.white,fontWeight:700,fontSize:18,letterSpacing:"-0.02em",marginBottom:20}}>New WFH Request</div>
        <Field label="Select Dates">
          <div style={{background:C.g08,border:`1px solid ${C.g06}`,borderRadius:2,padding:16}}>
            <CalendarPicker selected={dates} onChange={setDates}/>
          </div>
        </Field>
        <Field label="Reason">
          <textarea value={reason} onChange={e=>setReason(e.target.value)} rows={3} placeholder="Brief reason..."
            style={{width:"100%",background:C.g08,border:`1px solid ${C.g06}`,color:C.white,padding:"10px 14px",borderRadius:2,fontFamily:"inherit",fontSize:14,outline:"none",resize:"none",boxSizing:"border-box"}}
            onFocus={e=>e.target.style.borderColor=C.yellow} onBlur={e=>e.target.style.borderColor=C.g06}/>
        </Field>
        <div style={{display:"flex",gap:10}}>
          <Btn onClick={()=>dates.length>0&&reason&&onSubmit(dates,reason)}>Submit Request</Btn>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        </div>
      </div>
    </div>
  );
};

// ── My Requests ───────────────────────────────────────────────────────────────
const MyRequests = ({ user, records, onNew, onCancel }) => {
  const mine = records.filter(r=>r.employeeId===user["Employee #"]);
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div style={{color:C.white,fontWeight:700,fontSize:20,letterSpacing:"-0.03em"}}>My WFH Requests</div>
        <Btn onClick={onNew}>+ New Request</Btn>
      </div>
      {mine.length===0
        ? <div style={{color:C.g05,fontSize:14,padding:"40px 0",textAlign:"center"}}>No requests yet.</div>
        : <table style={{width:"100%",borderCollapse:"collapse"}}>
            <THead cols={["Date","Days","Reason","Status","Action"]}/>
            <tbody>{mine.map(r=>(
              <tr key={r.id} style={{borderBottom:`1px solid ${C.g09}`}}>
                <td style={{color:C.white,fontSize:13,padding:"12px 16px 12px 0"}}>{r.date}{r.half?` (½${r.half})`:""}</td>
                <td style={{color:C.yellow,fontSize:13,fontWeight:700,padding:"12px 16px 12px 0"}}>{r.half?0.5:1}</td>
                <td style={{color:C.g03,fontSize:13,padding:"12px 16px 12px 0"}}>{r.reason}</td>
                <td style={{padding:"12px 16px 12px 0"}}><Tag status={r.status}/></td>
                <td style={{padding:"12px 0"}}>{r.status==="pending"&&<Btn variant="danger" small onClick={()=>onCancel(r.id)}>Cancel</Btn>}</td>
              </tr>
            ))}</tbody>
          </table>
      }
    </div>
  );
};

// ── Approvals ─────────────────────────────────────────────────────────────────
const Approvals = ({ user, employees, records, onApprove, onReject }) => {
  const [filter, setFilter] = useState("pending");
  const myTeamIds = employees.filter(e=>extractReportingId(e["Reporting to"])===user["Employee #"]).map(e=>e["Employee #"]);
  const allTeamRecs = records.filter(r=>myTeamIds.includes(r.employeeId));
  const pending   = allTeamRecs.filter(r=>r.status==="pending");
  const approved  = allTeamRecs.filter(r=>r.status==="approved");
  const rejected  = allTeamRecs.filter(r=>r.status==="rejected");
  const cancelled = allTeamRecs.filter(r=>r.status==="cancelled");
  const filtered  = filter==="pending"?pending:filter==="approved"?approved:filter==="rejected"?rejected:cancelled;
  const getEmp = id => employees.find(e=>e["Employee #"]===id);

  const FILTERS = [
    {k:"pending",  l:"Pending",   count:pending.length,   color:C.yellow},
    {k:"approved", l:"Approved",  count:approved.length,  color:"#4ade80"},
    {k:"rejected", l:"Rejected",  count:rejected.length,  color:C.red},
    {k:"cancelled",l:"Cancelled", count:cancelled.length, color:C.g04},
  ];

  return (
    <div>
      <div style={{color:C.white,fontWeight:700,fontSize:20,letterSpacing:"-0.03em",marginBottom:20}}>Team Approvals</div>

      {/* Stat boxes */}
      <div style={{display:"flex",gap:10,marginBottom:20}}>
        {FILTERS.map(f=>(
          <div key={f.k} onClick={()=>setFilter(f.k)} style={{flex:1,background:filter===f.k?C.g08:C.g09,border:`1px solid ${filter===f.k?C.g06:C.g08}`,borderTop:`2px solid ${filter===f.k?f.color:C.g08}`,borderRadius:2,padding:"14px 16px",cursor:"pointer",transition:"all .15s"}}>
            <div style={{color:f.color,fontSize:22,fontWeight:700}}>{f.count}</div>
            <div style={{color:C.g04,fontSize:11,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",marginTop:2}}>{f.l}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      {filtered.length===0
        ? <div style={{color:C.g05,fontSize:14,padding:"40px 0",textAlign:"center"}}>No {filter} requests.</div>
        : <table style={{width:"100%",borderCollapse:"collapse"}}>
            <THead cols={["Employee","Date","Days","Reason","Status","Action"]}/>
            <tbody>{filtered.map(r=>{
              const emp=getEmp(r.employeeId);
              return (
                <tr key={r.id} style={{borderBottom:`1px solid ${C.g09}`}}>
                  <td style={{padding:"12px 16px 12px 0"}}>
                    <div style={{color:C.white,fontSize:13,fontWeight:600}}>{toFullName(emp?.["Last name, First name"])}</div>
                    <div style={{color:C.g05,fontSize:11,marginTop:2}}>{emp?.["Job Title"]}</div>
                  </td>
                  <td style={{color:C.g03,fontSize:13,padding:"12px 16px 12px 0",whiteSpace:"nowrap"}}>{r.date}{r.half?` (½${r.half})`:""}</td>
                  <td style={{color:C.yellow,fontSize:13,fontWeight:700,padding:"12px 16px 12px 0"}}>{r.half?0.5:1}</td>
                  <td style={{color:C.g03,fontSize:13,padding:"12px 16px 12px 0"}}>{r.reason}</td>
                  <td style={{padding:"12px 16px 12px 0"}}><Tag status={r.status}/></td>
                  <td style={{padding:"12px 0"}}>
                    {r.status==="pending"&&<div style={{display:"flex",gap:6}}>
                      <Btn variant="success" small onClick={()=>onApprove(r.id)}>Approve</Btn>
                      <Btn variant="danger" small onClick={()=>onReject(r.id)}>Reject</Btn>
                    </div>}
                  </td>
                </tr>
              );
            })}</tbody>
          </table>
      }
    </div>
  );
};

// ── Bar chart ─────────────────────────────────────────────────────────────────
const Bar = ({ data, accent=C.yellow }) => {
  const max=Math.max(...data.map(d=>d.v),1);
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:4,height:80}}>
      {data.map((d,i)=>(
        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,minWidth:0}}>
          <span style={{color:C.g03,fontSize:10}}>{d.v||""}</span>
          <div style={{width:"100%",background:accent,borderRadius:"2px 2px 0 0",height:Math.max(d.v/max*52,d.v>0?3:0),opacity:0.85}}/>
          <span style={{color:C.g04,fontSize:9,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:"100%",textAlign:"center"}}>{d.l}</span>
        </div>
      ))}
    </div>
  );
};

// ── Team Dashboard ────────────────────────────────────────────────────────────
const TeamDash = ({ user, employees, records }) => {
  const now = new Date();

  // Include manager + their team
  const myTeamIds = [
    user["Employee #"],
    ...employees.filter(e=>extractReportingId(e["Reporting to"])===user["Employee #"]).map(e=>e["Employee #"])
  ];

  // Period filter state
  const [periodType, setPeriodType] = useState("month"); // "month" | "range"
  const [selMonth, setSelMonth] = useState(now.getMonth());
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [memberFilter, setMemberFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("approved");

  // Build year options
  const years = [now.getFullYear()-1, now.getFullYear()];

  const inPeriod = (date) => {
    if (periodType==="month") {
      if (selMonth==="all") return date.startsWith(`${selYear}`);
      const pfx=`${selYear}-${String(selMonth+1).padStart(2,"0")}`;
      return date.startsWith(pfx);
    } else {
      if (!rangeFrom||!rangeTo) return true;
      return date>=rangeFrom && date<=rangeTo;
    }
  };

  const teamRecs = records.filter(r=>
    myTeamIds.includes(r.employeeId) &&
    r.status===statusFilter &&
    inPeriod(r.date) &&
    (memberFilter==="all"||r.employeeId===memberFilter)
  );

  // Monthly trend (last 4 months)
  const monthData = Array.from({length:4},(_,i)=>{
    const d=new Date(now.getFullYear(),now.getMonth()-(3-i),1);
    const pfx=d.toISOString().slice(0,7);
    return {l:MONTHS[d.getMonth()].slice(0,3),v:records.filter(r=>myTeamIds.includes(r.employeeId)&&r.status==="approved"&&r.date.startsWith(pfx)).length};
  });

  // Member bar data
  const memberData = myTeamIds.map(id=>{
    const emp=employees.find(e=>e["Employee #"]===id);
    return {l:toFullName(emp?.["Last name, First name"])??id, v:teamRecs.filter(r=>r.employeeId===id).length};
  });

  // Table rows
  const tableRows = employees.filter(e=>myTeamIds.includes(e["Employee #"])&&(memberFilter==="all"||e["Employee #"]===memberFilter));

  return (
    <div>
      <div style={{color:C.white,fontWeight:700,fontSize:20,letterSpacing:"-0.03em",marginBottom:20}}>Team Dashboard</div>

      {/* Filters row */}
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{display:"flex",gap:4}}>
          <Btn small variant="ghost" active={periodType==="month"} onClick={()=>setPeriodType("month")}>By Month</Btn>
          <Btn small variant="ghost" active={periodType==="range"} onClick={()=>setPeriodType("range")}>Date Range</Btn>
        </div>

        {periodType==="month" ? (
          <div style={{display:"flex",gap:6}}>
            <Select value={selMonth} onChange={e=>setSelMonth(e.target.value==="all"?"all":Number(e.target.value))}>
              <option value="all">All Months</option>
              {MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}
            </Select>
            <Select value={selYear} onChange={e=>setSelYear(Number(e.target.value))}>
              {years.map(y=><option key={y} value={y}>{y}</option>)}
            </Select>
          </div>
        ) : (
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <input type="date" value={rangeFrom} onChange={e=>setRangeFrom(e.target.value)} style={{background:C.g08,border:`1px solid ${C.g06}`,color:C.white,padding:"6px 10px",borderRadius:2,fontFamily:"inherit",fontSize:12,outline:"none"}}/>
            <span style={{color:C.g05,fontSize:12}}>to</span>
            <input type="date" value={rangeTo} onChange={e=>setRangeTo(e.target.value)} style={{background:C.g08,border:`1px solid ${C.g06}`,color:C.white,padding:"6px 10px",borderRadius:2,fontFamily:"inherit",fontSize:12,outline:"none"}}/>
          </div>
        )}

        <Select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </Select>

        <Select value={memberFilter} onChange={e=>setMemberFilter(e.target.value)}>
          <option value="all">All Members</option>
          {myTeamIds.map(id=>{
            const emp=employees.find(e=>e["Employee #"]===id);
            return <option key={id} value={id}>{toFullName(emp?.["Last name, First name"])}</option>;
          })}
        </Select>
      </div>

      {/* Charts */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
        <Card title="Monthly Trend (Approved)" accent={C.yellow}><Bar data={monthData}/></Card>
        <Card title="WFH Days by Member" accent={C.g06}><Bar data={memberData} accent={C.g04}/></Card>
      </div>

      {/* Team table */}
      <Card title="Team Members" extra={
        <div style={{color:C.g05,fontSize:11}}>{tableRows.length} member{tableRows.length!==1?"s":""}</div>
      }>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <THead cols={["Name","Job Title","Team","WFH Days (filtered)","Total Approved"]}/>
          <tbody>{tableRows.map(emp=>{
            const filteredDays = teamRecs.filter(r=>r.employeeId===emp["Employee #"]).length;
            const totalApproved = records.filter(r=>r.employeeId===emp["Employee #"]&&r.status==="approved").length;
            const isManager = emp["Employee #"]===user["Employee #"];
            return (
              <tr key={emp["Employee #"]} style={{borderBottom:`1px solid ${C.g09}`}}>
                <td style={{padding:"10px 16px 10px 0"}}>
                  <div style={{color:C.white,fontSize:13}}>{toFullName(emp["Last name, First name"])}</div>
                  {isManager&&<div style={{color:C.yellow,fontSize:10,fontWeight:700,letterSpacing:"0.05em",textTransform:"uppercase",marginTop:1}}>You</div>}
                </td>
                <td style={{color:C.g04,fontSize:13,padding:"10px 16px 10px 0"}}>{emp["Job Title"]}</td>
                <td style={{color:C.g04,fontSize:13,padding:"10px 16px 10px 0"}}>{emp.Teams}</td>
                <td style={{color:C.yellow,fontSize:13,fontWeight:700,padding:"10px 16px 10px 0"}}>{filteredDays}</td>
                <td style={{color:C.g03,fontSize:13,padding:"10px 0"}}>{totalApproved}</td>
              </tr>
            );
          })}</tbody>
        </table>
      </Card>
    </div>
  );
};

// ── Org Dashboard ─────────────────────────────────────────────────────────────
const OrgDash = ({ employees, records }) => {
  const now=new Date(); const approved=records.filter(r=>r.status==="approved");
  const teams=[...new Set(employees.map(e=>e.Teams))];
  const teamData=teams.map(t=>({l:t,v:approved.filter(r=>r.team===t).length}));
  const monthData=Array.from({length:4},(_,i)=>{ const d=new Date(now.getFullYear(),now.getMonth()-(3-i),1); return {l:MONTHS[d.getMonth()].slice(0,3),v:approved.filter(r=>r.date.startsWith(d.toISOString().slice(0,7))).length}; });
  return (
    <div>
      <div style={{color:C.white,fontWeight:700,fontSize:20,letterSpacing:"-0.03em",marginBottom:20}}>Organizational Dashboard</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
        <Card title="Total WFH Days by Month" accent={C.yellow}><Bar data={monthData}/></Card>
        <Card title="WFH Days by Team" accent={C.g06}><Bar data={teamData} accent={C.red}/></Card>
      </div>
      <Card title="All Employees">
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <THead cols={["Name","Team","Title","WFH Days"]}/>
          <tbody>{employees.map(emp=><tr key={emp["Employee #"]} style={{borderBottom:`1px solid ${C.g09}`}}><td style={{color:C.white,fontSize:13,padding:"10px 16px 10px 0"}}>{toFullName(emp["Last name, First name"])}</td><td style={{color:C.g04,fontSize:13,padding:"10px 16px 10px 0"}}>{emp.Teams}</td><td style={{color:C.g04,fontSize:13,padding:"10px 16px 10px 0"}}>{emp["Job Title"]}</td><td style={{color:C.yellow,fontSize:13,fontWeight:700,padding:"10px 0"}}>{approved.filter(r=>r.employeeId===emp["Employee #"]).length}</td></tr>)}</tbody>
        </table>
      </Card>
    </div>
  );
};

// ── Admin Panel ───────────────────────────────────────────────────────────────
const AdminPanel = ({ employees, setEmployees, records, setRecords, invites, setInvites }) => {
  const [subTab,setSubTab]=useState("employees");
  const [inviteEmail,setInviteEmail]=useState(""); const [inviteMsg,setInviteMsg]=useState("");
  const [editingId,setEditingId]=useState(null); const [editReporting,setEditReporting]=useState("");
  const fileRef=useCallback(n=>{if(n)n.value="";},[]);
  const handleFile=e=>{
    const f=e.target.files[0]; if(!f) return;
    const r=new FileReader(); r.onload=ev=>{try{const p=parseCSV(ev.target.result); if(p.length){const w=p.map(x=>({...x,Password:x.Password||"1234"})); setEmployees(w); setRecords(genRecords(w)); alert(`✅ Imported ${p.length} employees.`);}}catch{alert("❌ Failed to parse CSV.");}}; r.readAsText(f);
  };
  const sendInvite=()=>{
    if(!inviteEmail.includes("@")){setInviteMsg("Please enter a valid email.");return;}
    setInvites(p=>[...p,{email:inviteEmail,sentAt:new Date().toISOString().slice(0,10)}]);
    setInviteMsg(`✅ Invite sent to ${inviteEmail} (simulated)`); setInviteEmail("");
  };
  const SUBTABS=[{k:"employees",l:"Employees"},{k:"approval",l:"Approval Lines"},{k:"invite",l:"Invite"}];
  return (
    <div>
      <div style={{color:C.white,fontWeight:700,fontSize:20,letterSpacing:"-0.03em",marginBottom:16}}>Admin Panel</div>
      <div style={{display:"flex",gap:0,marginBottom:20,borderBottom:`1px solid ${C.g08}`}}>
        {SUBTABS.map(t=><button key={t.k} onClick={()=>setSubTab(t.k)} style={{background:"none",border:"none",borderBottom:subTab===t.k?`2px solid ${C.yellow}`:"2px solid transparent",color:subTab===t.k?C.white:C.g04,fontFamily:"inherit",fontSize:13,fontWeight:subTab===t.k?600:400,padding:"10px 16px",cursor:"pointer"}}>{t.l}</button>)}
      </div>
      {subTab==="employees"&&<div>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16,gap:16}}>
          <div style={{color:C.g04,fontSize:12}}>Required CSV columns: Last name, First name · Employee # · Work Email · Teams · Job Title · Reporting to</div>
          <label style={{background:C.white,color:C.black,fontSize:13,fontWeight:600,padding:"8px 20px",borderRadius:2,cursor:"pointer",whiteSpace:"nowrap"}}>Import CSV<input ref={fileRef} type="file" accept=".csv" style={{display:"none"}} onChange={handleFile}/></label>
        </div>
        <Card><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><THead cols={["#","Name","Email","Team","Title","Reports To"]}/><tbody>{employees.map(emp=><tr key={emp["Employee #"]} style={{borderBottom:`1px solid ${C.g09}`}}><td style={{color:C.g04,fontSize:12,padding:"10px 16px 10px 0"}}>{emp["Employee #"]}</td><td style={{color:C.white,fontSize:12,padding:"10px 16px 10px 0"}}>{toFullName(emp["Last name, First name"])}</td><td style={{color:C.g04,fontSize:12,padding:"10px 16px 10px 0"}}>{emp["Work Email"]}</td><td style={{color:C.g04,fontSize:12,padding:"10px 16px 10px 0"}}>{emp.Teams}</td><td style={{color:C.g04,fontSize:12,padding:"10px 16px 10px 0"}}>{emp["Job Title"]}</td><td style={{color:C.g04,fontSize:12,padding:"10px 0"}}>{emp["Reporting to"]}</td></tr>)}</tbody></table></div></Card>
      </div>}
      {subTab==="approval"&&<Card title="Set Approval Lines">
        <div style={{color:C.g04,fontSize:12,marginBottom:16}}>Format: Name (Employee#) — e.g. "Paul (166)"</div>
        <table style={{width:"100%",borderCollapse:"collapse"}}><THead cols={["Name","Job Title","Reports To","Action"]}/><tbody>{employees.map(emp=>(
          <tr key={emp["Employee #"]} style={{borderBottom:`1px solid ${C.g09}`}}>
            <td style={{color:C.white,fontSize:13,padding:"10px 16px 10px 0"}}>{toFullName(emp["Last name, First name"])}</td>
            <td style={{color:C.g04,fontSize:13,padding:"10px 16px 10px 0"}}>{emp["Job Title"]}</td>
            <td style={{padding:"10px 16px 10px 0"}}>
              {editingId===emp["Employee #"]
                ?<input value={editReporting} onChange={e=>setEditReporting(e.target.value)} style={{background:C.g08,border:`1px solid ${C.yellow}`,color:C.white,padding:"4px 8px",borderRadius:2,fontFamily:"inherit",fontSize:12,outline:"none",width:160}}/>
                :<span style={{color:C.g03,fontSize:13}}>{emp["Reporting to"]||"—"}</span>}
            </td>
            <td style={{padding:"10px 0"}}>
              {editingId===emp["Employee #"]
                ?<div style={{display:"flex",gap:6}}><Btn small onClick={()=>{setEmployees(p=>p.map(e=>e["Employee #"]===emp["Employee #"]?{...e,"Reporting to":editReporting}:e));setEditingId(null);}}>Save</Btn><Btn small variant="ghost" onClick={()=>setEditingId(null)}>Cancel</Btn></div>
                :<Btn small variant="ghost" onClick={()=>{setEditingId(emp["Employee #"]);setEditReporting(emp["Reporting to"]||"");}}>Edit</Btn>}
            </td>
          </tr>
        ))}</tbody></table>
      </Card>}
      {subTab==="invite"&&<div>
        <Card title="Invite Employee by Email" accent={C.yellow}>
          <div style={{color:C.g04,fontSize:12,marginBottom:16}}>Send an invitation to a new employee to join the WFH tool.</div>
          <Field label="Email Address"><TextInput value={inviteEmail} onChange={e=>{setInviteEmail(e.target.value);setInviteMsg("")}} placeholder="newemployee@seoulrobotics.org"/></Field>
          {inviteMsg&&<div style={{color:inviteMsg.startsWith("✅")?"#4ade80":C.red,fontSize:12,marginBottom:12}}>{inviteMsg}</div>}
          <Btn variant="yellow" onClick={sendInvite}>Send Invite →</Btn>
          <div style={{color:C.g05,fontSize:11,marginTop:10}}>⚠ Real email sending requires a backend integration.</div>
        </Card>
        {invites.length>0&&<Card title="Sent Invites"><table style={{width:"100%",borderCollapse:"collapse"}}><THead cols={["Email","Sent Date","Status"]}/><tbody>{invites.map((inv,i)=><tr key={i} style={{borderBottom:`1px solid ${C.g09}`}}><td style={{color:C.white,fontSize:13,padding:"10px 16px 10px 0"}}>{inv.email}</td><td style={{color:C.g04,fontSize:13,padding:"10px 16px 10px 0"}}>{inv.sentAt}</td><td style={{padding:"10px 0"}}><Tag status="pending"/></td></tr>)}</tbody></table></Card>}
      </div>}
    </div>
  );
};

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [employees,setEmployees]=useState(SEED);
  const [records,setRecords]=useState(()=>genRecords(SEED));
  const [invites,setInvites]=useState([]);
  const [user,setUser]=useState(null); const [role,setRole]=useState(null);
  const [tab,setTab]=useState("my"); const [modal,setModal]=useState(false);

  const login=emp=>{setUser(emp);setRole(deriveRole(emp,employees));setTab("my");};
  const logout=()=>{setUser(null);setRole(null);};
  const newReq=(dates,reason)=>{
    const newRecs=dates.map(d=>({id:`${user["Employee #"]}-${Date.now()}-${d.date}`,employeeId:user["Employee #"],team:user.Teams,date:d.date,half:d.half,status:"pending",reason}));
    setRecords(r=>[...r,...newRecs]); setModal(false);
  };

  if (!user) return <LoginScreen employees={employees} onLogin={login}/>;

  const isManager=role==="manager"||role==="admin";
  const TABS=[
    {key:"my",label:"My Requests"},
    ...(isManager?[{key:"approvals",label:"Approvals"},{key:"team",label:"Team Dashboard"}]:[]),
    ...(role==="admin"?[{key:"org",label:"Org Dashboard"},{key:"admin",label:"Admin"}]:[]),
  ];

  return (
    <div style={{minHeight:"100vh",background:C.black,fontFamily:"'Inter',sans-serif",color:C.white}}>
      <div style={{background:C.g09,borderBottom:`1px solid ${C.g08}`,padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",height:56}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{lineHeight:1.1}}>
            <div style={{fontWeight:700,fontSize:14,letterSpacing:"-0.03em"}}>Seoul Robotics</div>
            <div style={{color:C.g04,fontSize:10,letterSpacing:"0.06em",textTransform:"uppercase"}}>WFH Approval</div>
          </div>
          <div style={{width:1,height:24,background:C.g07}}/>
          <div style={{color:C.g03,fontSize:12}}>{toFullName(user["Last name, First name"])}</div>
          <RoleTag role={role}/>
        </div>
        <button onClick={logout} style={{background:"none",border:"none",color:C.g05,fontFamily:"inherit",fontSize:12,cursor:"pointer"}}>Sign out</button>
      </div>
      <div style={{background:C.g09,borderBottom:`1px solid ${C.g08}`,padding:"0 28px",display:"flex"}}>
        {TABS.map(t=><button key={t.key} onClick={()=>setTab(t.key)} style={{background:"none",border:"none",borderBottom:tab===t.key?`2px solid ${C.yellow}`:"2px solid transparent",color:tab===t.key?C.white:C.g04,fontFamily:"inherit",fontSize:13,fontWeight:tab===t.key?600:400,padding:"14px 20px",cursor:"pointer",letterSpacing:"-0.01em"}}>{t.label}</button>)}
      </div>
      <div style={{maxWidth:960,margin:"0 auto",padding:28}}>
        {tab==="my"        && <MyRequests user={user} records={records} onNew={()=>setModal(true)} onCancel={id=>setRecords(r=>r.filter(x=>x.id!==id))}/>}
        {tab==="approvals" && isManager && <Approvals user={user} employees={employees} records={records} onApprove={id=>setRecords(r=>r.map(x=>x.id===id?{...x,status:"approved"}:x))} onReject={id=>setRecords(r=>r.map(x=>x.id===id?{...x,status:"rejected"}:x))}/>}
        {tab==="team"      && isManager && <TeamDash user={user} employees={employees} records={records}/>}
        {tab==="org"       && role==="admin" && <OrgDash employees={employees} records={records}/>}
        {tab==="admin"     && role==="admin" && <AdminPanel employees={employees} setEmployees={setEmployees} records={records} setRecords={setRecords} invites={invites} setInvites={setInvites}/>}
      </div>
      {modal&&<NewRequestModal onSubmit={newReq} onClose={()=>setModal(false)}/>}
    </div>
  );
}