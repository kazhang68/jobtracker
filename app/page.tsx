"use client";
/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/label-has-associated-control */

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Stage = "Saved" | "Applied" | "Recruiter screen" | "Interview" | "Offer" | "Closed";
type Job = {
  id: number;
  company: string;
  role: string;
  location: string;
  workStyle: string;
  jobUrl: string;
  stage: Stage;
  stageDate: string;
  appliedDate: string;
  listedSalary: string;
  levelsSalary: string;
  level: string;
  pros: string;
  cons: string;
  notes: string;
  contact: string;
  nextStep: string;
  nextStepDate: string;
  priority: "High" | "Medium" | "Low";
  updatedAt?: string;
};

const stages: Stage[] = ["Saved", "Applied", "Recruiter screen", "Interview", "Offer", "Closed"];
const emptyJob: Omit<Job, "id"> = {
  company: "", role: "", location: "", workStyle: "Remote", jobUrl: "", stage: "Saved",
  stageDate: new Date().toISOString().slice(0, 10), appliedDate: "", listedSalary: "", levelsSalary: "",
  level: "", pros: "", cons: "", notes: "", contact: "", nextStep: "", nextStepDate: "", priority: "Medium",
};
function initials(company: string) { return company.split(/\s+/).map(x => x[0]).join("").slice(0, 2).toUpperCase(); }
function moneyMid(value: string) {
  const nums = [...value.matchAll(/(\d{2,3})k/gi)].map(m => Number(m[1]));
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}
function fmtDate(value: string) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(`${value}T12:00:00`));
}

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("All stages");
  const [selected, setSelected] = useState<Job | null>(null);
  const [editing, setEditing] = useState<Job | null>(null);
  const [newJob, setNewJob] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/jobs").then(r => r.ok ? r.json() : Promise.reject()).then(data => {
      setJobs(data.jobs || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => jobs.filter(j => {
    const match = `${j.company} ${j.role} ${j.location}`.toLowerCase().includes(query.toLowerCase());
    return match && (stageFilter === "All stages" || j.stage === stageFilter);
  }), [jobs, query, stageFilter]);
  const active = jobs.filter(j => !["Saved", "Closed"].includes(j.stage));
  const stats = {
    active: active.length,
    interviews: jobs.filter(j => j.stage === "Interview").length,
    offers: jobs.filter(j => j.stage === "Offer").length,
    avg: Math.round(jobs.map(j => moneyMid(j.levelsSalary)).filter(Boolean).reduce((a,b)=>a+b,0) / (jobs.filter(j => moneyMid(j.levelsSalary)).length || 1)),
  };

  async function save(job: Job) {
    const isNew = job.id === 0;
    const optimistic = { ...job, id: isNew ? Date.now() : job.id };
    setJobs(prev => isNew ? [optimistic, ...prev] : prev.map(j => j.id === job.id ? optimistic : j));
    setEditing(null); setNewJob(false); setSelected(optimistic);
    try {
      const response = await fetch(isNew ? "/api/jobs" : `/api/jobs/${job.id}`, { method: isNew ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(job) });
      if (response.ok) {
        const { job: saved } = await response.json();
        setJobs(prev => prev.map(j => j.id === optimistic.id ? saved : j)); setSelected(saved);
      }
    } catch { /* optimistic state remains available in this session */ }
  }

  async function remove(job: Job) {
    setJobs(prev => prev.filter(j => j.id !== job.id)); setSelected(null);
    if (job.id > 0) fetch(`/api/jobs/${job.id}`, { method: "DELETE" }).catch(() => {});
  }

  return <main>
    <header className="topbar">
      <Link className="brand" href="/"><span className="brandmark">JT</span><span>Job Track</span></Link>
      <nav><a className="active" href="#pipeline">Pipeline</a><a href="#applications">Applications</a></nav>
      <button className="primary compact" onClick={() => setNewJob(true)}><span>＋</span> Add application</button>
    </header>

    <section className="workspace" id="applications">
      <div className="page-title"><div><h1>Applications</h1><p>Track roles, stages, compensation, and follow-ups.</p></div><div className="mini-stats" aria-label="Application overview"><span><b>{stats.active}</b> Active</span><span><b>{stats.interviews}</b> Interviews</span><span><b>{stats.offers}</b> Offers</span><span><b>{stats.avg ? `$${stats.avg}k` : "—"}</b> Avg. market TC</span></div></div>
      <div className="section-heading"><div className="tools"><label className="search"><span>⌕</span><input aria-label="Search applications" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search company or role"/></label><select aria-label="Filter by stage" value={stageFilter} onChange={e => setStageFilter(e.target.value)}><option>All stages</option>{stages.map(s => <option key={s}>{s}</option>)}</select></div></div>
      <div className="stage-tabs">{["All stages", ...stages].map(s => <button key={s} className={stageFilter===s?"selected":""} onClick={() => setStageFilter(s)}>{s}<b>{s === "All stages" ? jobs.length : jobs.filter(j => j.stage === s).length}</b></button>)}</div>
      <div className="table-wrap">
        <table><thead><tr><th>OPPORTUNITY</th><th>STAGE</th><th>WORK STYLE</th><th>COMPENSATION</th><th>NEXT STEP</th><th></th></tr></thead>
        <tbody>{filtered.map(job => <tr key={job.id} onClick={() => setSelected(job)}>
          <td><div className={`avatar a${Math.abs(job.id)%5}`}>{initials(job.company)}</div><div><strong>{job.company}</strong><span>{job.role} · {job.location}</span></div></td>
          <td><span className={`pill ${job.stage.toLowerCase().replaceAll(" ", "-")}`}>{job.stage}</span><small>Updated {fmtDate(job.stageDate)}</small></td>
          <td><strong>{job.workStyle}</strong></td>
          <td><strong>{job.listedSalary || "Not listed"}</strong><span>{job.levelsSalary ? `${job.levelsSalary} market` : "Add market estimate"}</span></td>
          <td><strong>{job.nextStep || "Add next step"}</strong><span className={job.nextStepDate && job.nextStepDate <= new Date().toISOString().slice(0,10) ? "due" : ""}>{job.nextStepDate ? fmtDate(job.nextStepDate) : "No date"}</span></td>
          <td><button className="icon-button" aria-label={`Open ${job.company}`} onClick={e => { e.stopPropagation(); setSelected(job); }}>→</button></td>
        </tr>)}</tbody></table>
        {!filtered.length && <div className="empty"><span>◎</span><h3>No opportunities here yet</h3><p>Try a different filter or add your next application.</p></div>}
      </div>
      <p className="record-count">{loading ? "Checking your saved applications…" : `${filtered.length} of ${jobs.length} opportunities`}</p>
    </section>

    {selected && <div className="overlay" onMouseDown={() => setSelected(null)}><aside className="detail" onMouseDown={e=>e.stopPropagation()}>
      <button className="close" onClick={()=>setSelected(null)} aria-label="Close">×</button>
      <div className="detail-title"><div className={`avatar large a${Math.abs(selected.id)%5}`}>{initials(selected.company)}</div><div><p>{selected.company}</p><h2>{selected.role}</h2><span>{selected.location} · {selected.workStyle}</span></div></div>
      <div className="detail-actions"><span className={`pill ${selected.stage.toLowerCase().replaceAll(" ", "-")}`}>{selected.stage}</span><button className="primary" onClick={()=>setEditing(selected)}>Edit application</button></div>
      <div className="timeline"><span/><div><b>{selected.stage}</b><small>{fmtDate(selected.stageDate)}</small></div>{selected.appliedDate && <><span/><div><b>Applied</b><small>{fmtDate(selected.appliedDate)}</small></div></>}</div>
      <div className="detail-grid"><section><label>LISTED SALARY</label><strong>{selected.listedSalary || "Not listed"}</strong></section><section><label>LEVELS.FYI ESTIMATE</label><strong>{selected.levelsSalary || "Not added"}</strong><small>{selected.level}</small></section></div>
      <section className="detail-section"><label>NEXT STEP</label><h3>{selected.nextStep || "Nothing scheduled"}</h3><p>{selected.nextStepDate ? fmtDate(selected.nextStepDate) : "Add a date to keep momentum."}</p></section>
      <div className="detail-grid prose"><section><label>PROS</label><p>{selected.pros || "No pros added yet."}</p></section><section><label>CONSIDERATIONS</label><p>{selected.cons || "No considerations added yet."}</p></section></div>
      <section className="detail-section"><label>NOTES</label><p>{selected.notes || "No notes yet."}</p></section>
      {selected.contact && <section className="detail-section"><label>CONTACT</label><p>{selected.contact}</p></section>}
      <footer>{selected.jobUrl && <a href={selected.jobUrl} target="_blank" rel="noreferrer">View job description ↗</a>}<button className="danger" onClick={()=>remove(selected)}>Remove</button></footer>
    </aside></div>}

    {(editing || newJob) && <JobEditor initial={editing || { ...emptyJob, id: 0 }} onClose={()=>{setEditing(null);setNewJob(false)}} onSave={save}/>} 
  </main>;
}

function JobEditor({ initial, onClose, onSave }: { initial: Job; onClose: () => void; onSave: (job: Job) => void }) {
  const [job, setJob] = useState(initial);
  const field = (key: keyof Job) => ({ value: String(job[key] ?? ""), onChange: (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => setJob({ ...job, [key]: e.target.value }) });
  function submit(e: FormEvent) { e.preventDefault(); if (job.company.trim() && job.role.trim()) onSave(job); }
  return <div className="overlay editor-overlay" onMouseDown={onClose}><form className="editor" onSubmit={submit} onMouseDown={e=>e.stopPropagation()}>
    <header><div><p className="eyebrow">{job.id ? "EDIT OPPORTUNITY" : "NEW OPPORTUNITY"}</p><h2>{job.id ? `${job.company} · ${job.role}` : "Add an application"}</h2></div><button type="button" className="close" onClick={onClose}>×</button></header>
    <div className="form-grid"><label>Company<input required placeholder="e.g. Stripe" {...field("company")}/></label><label>Role<input required placeholder="e.g. Product Designer" {...field("role")}/></label><label>Location<input placeholder="City, state or region" {...field("location")}/></label><label>Work style<select {...field("workStyle")}><option>Remote</option><option>Flexible hybrid</option><option>Hybrid · 2 days in office</option><option>Hybrid · 3 days in office</option><option>On-site</option></select></label><label className="wide">Job description link<input type="url" placeholder="https://…" {...field("jobUrl")}/></label></div>
    <div className="form-section"><h3>Process</h3><div className="form-grid"><label>Stage<select {...field("stage")}>{stages.map(s=><option key={s}>{s}</option>)}</select></label><label>Stage updated<input type="date" {...field("stageDate")}/></label><label>Applied date<input type="date" {...field("appliedDate")}/></label><label>Priority<select {...field("priority")}><option>High</option><option>Medium</option><option>Low</option></select></label><label>Next step<input placeholder="e.g. Portfolio review" {...field("nextStep")}/></label><label>Next step date<input type="date" {...field("nextStepDate")}/></label><label className="wide">Contact<input placeholder="Name · relationship or title" {...field("contact")}/></label></div></div>
    <div className="form-section"><h3>Compensation</h3><div className="form-grid"><label>Salary from job description<input placeholder="$180k–$220k" {...field("listedSalary")}/></label><label>Levels.fyi estimate<input placeholder="$210k–$260k TC" {...field("levelsSalary")}/></label><label className="wide">Role level<input placeholder="e.g. L5 / Senior" {...field("level")}/></label></div></div>
    <div className="form-section"><h3>Your take</h3><div className="form-grid"><label>Pros<textarea rows={4} placeholder="One thought per line" {...field("pros")}/></label><label>Cons / considerations<textarea rows={4} placeholder="One thought per line" {...field("cons")}/></label><label className="wide">Notes<textarea rows={4} placeholder="Interview prep, context, people, questions…" {...field("notes")}/></label></div></div>
    <footer><button type="button" onClick={onClose}>Cancel</button><button className="primary" type="submit">Save application</button></footer>
  </form></div>;
}
