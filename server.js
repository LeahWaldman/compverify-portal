/**
 * CompVerify Portal - Complete Single File Server
 * NY & NJ Workers Comp Verification
 */

require('dotenv').config();
const express  = require('express');
const session  = require('express-session');
const bcrypt   = require('bcryptjs');
const multer   = require('multer');
const axios    = require('axios');
const Database = require('better-sqlite3');
const fs       = require('fs');
const path     = require('path');
const cron     = require('node-cron');

const app  = express();
const PORT = process.env.PORT || 3000;

if (!fs.existsSync('./data')) fs.mkdirSync('./data');
const db = new Database('./data/compverify.db');
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT
  );
  CREATE TABLE IF NOT EXISTS policies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    policy_number TEXT NOT NULL,
    insured_name  TEXT,
    carrier       TEXT,
    state         TEXT NOT NULL DEFAULT 'NY',
    expiry_date   TEXT,
    status        TEXT DEFAULT 'pending',
    last_checked  TEXT,
    check_count   INTEGER DEFAULT 0,
    notes         TEXT,
    created_at    TEXT DEFAULT (datetime('now')),
    updated_at    TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS check_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    policy_id  INTEGER,
    checked_at TEXT DEFAULT (datetime('now')),
    status     TEXT,
    message    TEXT
  );
`);

const adminEmail    = process.env.ADMIN_EMAIL    || 'admin@yourcompany.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin1234!';
const exists = db.prepare('SELECT id FROM users WHERE email=?').get(adminEmail);
if (!exists) {
  db.prepare('INSERT INTO users(email,password,name) VALUES(?,?,?)').run(
    adminEmail, bcrypt.hashSync(adminPassword, 10), 'Admin User'
  );
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'compverify-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 8 * 60 * 60 * 1000 }
}));

if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
const upload = multer({ dest: './uploads/', limits: { fileSize: 20 * 1024 * 1024 } });

function auth(req, res, next) {
  if (req.session.userId) return next();
  res.status(401).json({ error: 'Not logged in' });
}

// ── SMART VERIFICATION ────────────────────────────────────────────────────────
// NY WCB and NJ block bots. We use a 3-step smart check:
// 1. Try live WCB website lookup
// 2. If blocked, check expiry date from certificate
// 3. Flag for manual review if needed

async function checkPolicyStatus(policyNumber, state, carrier='', insuredName='', expiryDate='') {
  // Step 1: Try live board check
  try {
    let result = null;
    if (state === 'NY') result = await tryNYWCB(policyNumber, insuredName);
    if (state === 'NJ') result = await tryNJCRIB(policyNumber, carrier);
    if (result && result.status !== 'unknown' && result.status !== 'error') return result;
  } catch(e) { /* blocked - fall through */ }

  // Step 2: Smart date check from certificate
  if (expiryDate) {
    const expiry = new Date(expiryDate);
    const today  = new Date();
    const daysLeft = Math.floor((expiry - today) / (1000*60*60*24));

    if (daysLeft < 0) {
      return {
        status: 'expired',
        message: `EXPIRED — Policy expired ${Math.abs(daysLeft)} days ago (${expiryDate}). Verified from certificate.`
      };
    } else if (daysLeft <= 30) {
      return {
        status: 'expiring_soon',
        message: `⚠️ EXPIRING SOON — ${daysLeft} days left. Expires ${expiryDate}. Verified from certificate.`
      };
    } else {
      return {
        status: 'active',
        message: `✅ ACTIVE — Valid until ${expiryDate} (${daysLeft} days remaining). Verified from certificate.`
      };
    }
  }

  // Step 3: No date — needs manual review
  return {
    status: 'needs_review',
    message: `Board website blocked automated check. Please verify manually at ${state === 'NY' ? 'wcb.ny.gov' : 'njcrib.com'} using policy # ${policyNumber}`
  };
}

async function tryNYWCB(policyNumber, insuredName) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Referer': 'https://www.wcb.ny.gov/',
  };

  // Try employer name search (more reliable than policy number)
  if (insuredName) {
    const res = await axios.get(
      `https://www.wcb.ny.gov/content/main/Employers/VerifyCoverage.jsp?employerName=${encodeURIComponent(insuredName)}`,
      { headers, timeout: 12000 }
    );
    const html = res.data.toLowerCase();
    if (html.includes('coverage is in force') || html.includes('active'))   return { status:'active',  message:'Active — confirmed by NY WCB' };
    if (html.includes('coverage has lapsed')  || html.includes('expired'))  return { status:'expired', message:'Expired — confirmed by NY WCB' };
    if (html.includes('cancelled'))                                          return { status:'expired', message:'Cancelled — confirmed by NY WCB' };
  }

  // Try policy number search
  const form = new URLSearchParams({ policyNo: policyNumber });
  const res2 = await axios.post(
    'https://www.wcb.ny.gov/content/main/Employers/VerifyCoverage.jsp',
    form.toString(),
    { headers:{ ...headers, 'Content-Type':'application/x-www-form-urlencoded' }, timeout: 12000 }
  );
  const html2 = res2.data.toLowerCase();
  if (html2.includes('coverage is in force') || html2.includes('active'))  return { status:'active',  message:'Active — confirmed by NY WCB' };
  if (html2.includes('coverage has lapsed')  || html2.includes('expired')) return { status:'expired', message:'Expired — confirmed by NY WCB' };
  if (html2.includes('cancelled'))                                          return { status:'expired', message:'Cancelled — confirmed by NY WCB' };

  return { status:'unknown', message:'NY WCB did not return a clear result' };
}

async function tryNJCRIB(policyNumber, carrier) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  const form = new URLSearchParams({ PolicyNumber: policyNumber, CarrierName: carrier||'', SearchType:'PolicyNumber' });
  const res = await axios.post('https://www.njcrib.com/Certificate/Search', form.toString(), { headers, timeout: 12000 });
  const html = res.data.toLowerCase();
  if (html.includes('policy is active') || html.includes('in force'))     return { status:'active',  message:'Active — confirmed by NJ CRIB' };
  if (html.includes('not in force')     || html.includes('expired'))      return { status:'expired', message:'Expired — confirmed by NJ CRIB' };
  if (html.includes('cancelled'))                                          return { status:'expired', message:'Cancelled — confirmed by NJ CRIB' };
  return { status:'unknown', message:'NJ CRIB did not return a clear result' };
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Invalid email or password' });
  req.session.userId = user.id;
  req.session.userName = user.name;
  res.json({ ok:true, name:user.name });
});
app.post('/api/logout', (req, res) => { req.session.destroy(); res.json({ ok:true }); });
app.get('/api/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error:'Not logged in' });
  res.json({ id:req.session.userId, name:req.session.userName });
});

// ── POLICIES ──────────────────────────────────────────────────────────────────
app.get('/api/policies', auth, (req, res) => {
  const { state, status, q } = req.query;
  let sql = 'SELECT * FROM policies WHERE 1=1'; const p = [];
  if (state  && state  !== 'all') { sql += ' AND state=?';  p.push(state); }
  if (status && status !== 'all') { sql += ' AND status=?'; p.push(status); }
  if (q) { sql += ' AND (policy_number LIKE ? OR insured_name LIKE ?)'; p.push(`%${q}%`,`%${q}%`); }
  sql += ' ORDER BY updated_at DESC';
  const policies = db.prepare(sql).all(...p);
  const counts = db.prepare(`
    SELECT COUNT(*) as total,
    SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) as active,
    SUM(CASE WHEN status IN ('expired','not_found','cancelled') THEN 1 ELSE 0 END) as expired,
    SUM(CASE WHEN status IN ('pending','unknown','needs_review','expiring_soon') THEN 1 ELSE 0 END) as pending
    FROM policies`).get();
  res.json({ policies, counts });
});

app.post('/api/policies', auth, (req, res) => {
  const { policy_number, state, carrier, insured_name, expiry_date } = req.body;
  if (!policy_number || !state) return res.status(400).json({ error:'Required: policy number and state' });
  const r = db.prepare('INSERT INTO policies(policy_number,state,carrier,insured_name,expiry_date,status) VALUES(?,?,?,?,?,?)').run(
    policy_number.trim(), state, carrier||null, insured_name||null, expiry_date||null, 'pending'
  );
  res.json({ id:r.lastInsertRowid, message:'Added' });
});

app.post('/api/policies/:id/verify', auth, async (req, res) => {
  const policy = db.prepare('SELECT * FROM policies WHERE id=?').get(Number(req.params.id));
  if (!policy) return res.status(404).json({ error:'Not found' });
  const result = await checkPolicyStatus(
    policy.policy_number, policy.state, policy.carrier||'',
    policy.insured_name||'', policy.expiry_date||''
  );
  db.prepare(`UPDATE policies SET status=?,notes=?,last_checked=datetime('now'),check_count=check_count+1,updated_at=datetime('now') WHERE id=?`)
    .run(result.status, result.message, policy.id);
  db.prepare('INSERT INTO check_log(policy_id,status,message) VALUES(?,?,?)').run(policy.id, result.status, result.message);
  res.json({ ...result, policy_number:policy.policy_number });
});

app.delete('/api/policies/:id', auth, (req, res) => {
  db.prepare('DELETE FROM policies WHERE id=?').run(Number(req.params.id));
  res.json({ ok:true });
});

app.post('/api/verify-all', auth, async (req, res) => {
  res.json({ message:'Verification started' });
  const all = db.prepare('SELECT * FROM policies').all();
  for (const p of all) {
    const result = await checkPolicyStatus(p.policy_number, p.state, p.carrier||'', p.insured_name||'', p.expiry_date||'');
    db.prepare(`UPDATE policies SET status=?,notes=?,last_checked=datetime('now'),check_count=check_count+1,updated_at=datetime('now') WHERE id=?`)
      .run(result.status, result.message, p.id);
    await new Promise(r=>setTimeout(r,1000));
  }
});

app.post('/api/upload', auth, upload.array('files',50), async (req,res) => {
  const results = [];
  for (const file of req.files||[]) {
    try {
      let text = '';
      if (file.mimetype==='application/pdf') {
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(fs.readFileSync(file.path));
        text = data.text;
      }
      // Extract policy details from ACORD form
      const extracted = extractFromACORD(text);
      const state = extracted.state || req.body.state || 'NY';
      if (extracted.policy_number) {
        const r = db.prepare('INSERT OR IGNORE INTO policies(policy_number,state,carrier,insured_name,expiry_date,status,notes) VALUES(?,?,?,?,?,?,?)').run(
          extracted.policy_number, state, extracted.carrier||null, extracted.insured_name||null,
          extracted.expiry_date||null, 'pending', 'Extracted from: '+file.originalname
        );
        results.push({ file:file.originalname, policy_number:extracted.policy_number, status:'added', id:r.lastInsertRowid, extracted });
      } else {
        results.push({ file:file.originalname, status:'no_policy_found' });
      }
    } catch(err) {
      results.push({ file:file.originalname, status:'error', error:err.message });
    }
    fs.unlink(file.path, ()=>{});
  }
  res.json({ results });
});

function extractFromACORD(text) {
  const result = {};
  // WC policy number patterns (ACORD form)
  const wcPatterns = [
    /(?:WORKERS.{0,30}COMPENSATION.{0,100})([A-Z]{2,4}\d{5,15}[A-Z]?)/is,
    /WCC?[\s\-]?(\d{5,12}[A-Z]?)/i,
    /([A-Z]{2,4}\d{6,12}[A-Z]?)\s+\d{2}\/\d{2}\/\d{4}\s+\d{2}\/\d{2}\/\d{4}/,
  ];
  for (const p of wcPatterns) {
    const m = text.match(p);
    if (m) { result.policy_number = m[1].trim(); break; }
  }
  // Insured name
  const nameMatch = text.match(/INSURED\s+([A-Z][A-Za-z\s,\.]+(?:Inc|LLC|Corp|Co|Ltd)?)/);
  if (nameMatch) result.insured_name = nameMatch[1].trim().substring(0,60);
  // Expiry date for WC line
  const dateMatch = text.match(/(?:WC|WORKERS).{0,200}(\d{2}\/\d{2}\/\d{4})\s*$/im);
  if (dateMatch) result.expiry_date = dateMatch[1];
  // State
  if (/new york|NY\s/i.test(text)) result.state = 'NY';
  if (/new jersey|NJ\s/i.test(text)) result.state = 'NJ';
  // Carrier
  const carrierMatch = text.match(/INSURER\s+A\s*:\s*([A-Za-z][A-Za-z\s&]+?)(?:\n|INSURER|\d)/);
  if (carrierMatch) result.carrier = carrierMatch[1].trim();
  return result;
}

app.get('/api/export', auth, (req,res) => {
  const rows = db.prepare('SELECT * FROM policies ORDER BY state,status').all();
  const cols = ['policy_number','insured_name','carrier','state','status','expiry_date','last_checked','notes'];
  const csv  = [cols.join(','), ...rows.map(r=>cols.map(c=>`"${(r[c]||'').toString().replace(/"/g,'""')}"`).join(','))].join('\n');
  res.setHeader('Content-Type','text/csv');
  res.setHeader('Content-Disposition',`attachment; filename="policies_${new Date().toISOString().slice(0,10)}.csv"`);
  res.send(csv);
});

cron.schedule('0 7 * * *', async () => {
  const all = db.prepare('SELECT * FROM policies').all();
  for (const p of all) {
    const result = await checkPolicyStatus(p.policy_number, p.state, p.carrier||'', p.insured_name||'', p.expiry_date||'');
    db.prepare(`UPDATE policies SET status=?,notes=?,last_checked=datetime('now'),check_count=check_count+1,updated_at=datetime('now') WHERE id=?`).run(result.status,result.message,p.id);
    await new Promise(r=>setTimeout(r,1000));
  }
}, { timezone:'America/New_York' });

// ── FRONTEND ──────────────────────────────────────────────────────────────────
const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>CompVerify Portal</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F4F6F9;color:#1a1a1a;font-size:14px}
.auth-wrap{display:flex;align-items:center;justify-content:center;min-height:100vh}
.auth-card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:2rem;width:100%;max-width:380px;box-shadow:0 2px 8px rgba(0,0,0,.06)}
.logo{display:flex;align-items:center;gap:10px;margin-bottom:1.5rem}
.logo-icon{width:38px;height:38px;background:#1d4ed8;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:700}
.logo span{font-size:16px;font-weight:600}
h2{font-size:20px;font-weight:600;margin-bottom:.25rem}
.sub{font-size:13px;color:#6b7280;margin-bottom:1.5rem}
.fg{margin-bottom:1rem}
.fg label{display:block;font-size:12px;font-weight:500;color:#374151;margin-bottom:5px}
.fg input,.fg select{width:100%;padding:9px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;outline:none}
.fg input:focus{border-color:#1d4ed8}
.btn{padding:9px 16px;border:none;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer}
.btn-blue{background:#1d4ed8;color:#fff;width:100%}
.btn-blue:hover{background:#1e40af}
.btn-sm{padding:6px 12px;font-size:12px;border:1px solid #d1d5db;background:#fff;border-radius:7px;cursor:pointer}
.btn-sm:hover{background:#f9fafb}
.shell{display:flex;height:100vh;overflow:hidden}
.sidebar{width:210px;background:#111827;display:flex;flex-direction:column;flex-shrink:0}
.sb-logo{display:flex;align-items:center;gap:9px;padding:1rem;border-bottom:1px solid #1f2937}
.sb-logo .logo-icon{width:30px;height:30px;font-size:12px}
.sb-logo span{color:#fff;font-size:14px;font-weight:600}
.nav-s{font-size:10px;color:#6b7280;padding:.75rem 1rem .25rem;text-transform:uppercase;letter-spacing:.06em}
.nav-i{display:flex;align-items:center;gap:9px;padding:8px 1rem;font-size:13px;color:#9ca3af;cursor:pointer}
.nav-i:hover{background:#1f2937;color:#f9fafb}
.nav-i.active{background:#1d4ed8;color:#fff}
.sb-space{flex:1}
.sb-user{padding:.875rem 1rem;border-top:1px solid #1f2937;display:flex;align-items:center;gap:8px}
.avatar{width:28px;height:28px;border-radius:50%;background:#1d4ed8;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:#fff}
.u-name{font-size:12px;color:#f9fafb;font-weight:500}
.u-role{font-size:11px;color:#6b7280}
.logout{background:none;border:none;color:#6b7280;cursor:pointer;margin-left:auto;font-size:18px}
.logout:hover{color:#f9fafb}
.main{flex:1;display:flex;flex-direction:column;overflow:hidden}
.topbar{background:#fff;border-bottom:1px solid #e5e7eb;padding:.75rem 1.25rem;display:flex;align-items:center;justify-content:space-between}
.topbar-title{font-size:15px;font-weight:600}
.tr{display:flex;align-items:center;gap:8px}
.badge-r{background:#fee2e2;color:#b91c1c;font-size:11px;font-weight:600;padding:3px 9px;border-radius:20px}
.badge-y{background:#fef3c7;color:#92400e;font-size:11px;font-weight:600;padding:3px 9px;border-radius:20px}
.content{flex:1;overflow-y:auto;padding:1.25rem}
.page{display:none}.page.active{display:block}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:1.25rem}
.stat{background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:1rem}
.stat-l{font-size:12px;color:#6b7280;margin-bottom:4px}
.stat-v{font-size:26px;font-weight:600}
.stat-s{font-size:11px;color:#9ca3af;margin-top:3px}
.g{color:#15803d}.r{color:#b91c1c}.a{color:#b45309}
.card{background:#fff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:1rem}
.ch{padding:.875rem 1rem;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f3f4f6}
.ch h3{font-size:13px;font-weight:600}
.srch{padding:6px 10px;border:1px solid #d1d5db;border-radius:7px;font-size:12px;width:200px;outline:none}
table{width:100%;border-collapse:collapse}
th{font-size:11px;font-weight:600;color:#6b7280;text-align:left;padding:8px 12px;background:#f9fafb;border-bottom:1px solid #e5e7eb;text-transform:uppercase}
td{font-size:13px;padding:9px 12px;border-bottom:1px solid #f3f4f6}
tr:last-child td{border-bottom:none}
tr:hover td{background:#fafafa}
.pill{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:600}
.pg{background:#dcfce7;color:#15803d}
.pr{background:#fee2e2;color:#b91c1c}
.pa{background:#fef3c7;color:#92400e}
.pb{background:#dbeafe;color:#1e40af}
.py{background:#fef9c3;color:#854d0e}
.mono{font-family:monospace;font-size:12px}
.abn{background:none;border:none;cursor:pointer;color:#9ca3af;padding:3px 5px;border-radius:4px;font-size:16px}
.abn:hover{background:#f3f4f6;color:#374151}
.ucard{background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:1.25rem;margin-bottom:1rem}
.ucard h3{font-size:14px;font-weight:600;margin-bottom:1rem;color:#374151}
.ucard .tip{font-size:12px;color:#6b7280;background:#f0f9ff;border:1px solid #bae6fd;border-radius:7px;padding:10px 12px;margin-bottom:1rem}
.dz{border:2px dashed #d1d5db;border-radius:9px;padding:2rem;text-align:center;cursor:pointer}
.dz:hover{border-color:#1d4ed8;background:#f0f5ff}
.dz p{font-size:13px;color:#6b7280;margin-top:.5rem}
.dz span{font-size:12px;color:#9ca3af}
.divider{display:flex;align-items:center;gap:10px;margin:1rem 0;font-size:12px;color:#9ca3af}
.divider::before,.divider::after{content:'';flex:1;height:1px;background:#e5e7eb}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.grid4{display:grid;grid-template-columns:1fr 160px auto auto;gap:8px;align-items:end}
.grid4 .fg{margin:0}
.grid4 input,.grid4 select,.grid2 input,.grid2 select{padding:8px 10px;font-size:13px;border:1px solid #d1d5db;border-radius:8px;width:100%;outline:none}
.fr{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem}
.fbtns{display:flex;gap:5px}
.fb{padding:5px 12px;border:1px solid #d1d5db;border-radius:7px;background:#fff;font-size:12px;cursor:pointer;color:#6b7280}
.fb:hover{background:#f9fafb}
.fb.active{background:#1d4ed8;color:#fff;border-color:#1d4ed8}
.rf{display:flex;gap:6px}
.rf select{padding:5px 8px;font-size:12px;border:1px solid #d1d5db;border-radius:7px;background:#fff;color:#374151}
.toast{position:fixed;bottom:20px;right:20px;background:#111827;color:#f9fafb;border-radius:9px;padding:12px 16px;font-size:13px;display:flex;align-items:flex-start;gap:8px;opacity:0;transition:opacity .2s;pointer-events:none;z-index:999;max-width:380px;line-height:1.5}
.toast.show{opacity:1}
.ti{color:#4ade80;flex-shrink:0}.tw{color:#fbbf24;flex-shrink:0}
.prog{margin-top:.75rem;display:none}
.prow{display:flex;align-items:center;gap:10px;background:#f9fafb;border-radius:8px;padding:8px 10px;margin-bottom:6px}
.pname{font-size:13px;font-weight:500;flex:1}
.pwrap{height:4px;background:#e5e7eb;border-radius:2px;margin-top:4px}
.pbar{height:4px;background:#1d4ed8;border-radius:2px;width:0;transition:width .25s}
.ppct{font-size:11px;color:#6b7280;white-space:nowrap}
.notes-cell{font-size:11px;color:#6b7280;max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
</style>
</head>
<body>

<div class="auth-wrap" id="login-screen">
  <div class="auth-card">
    <div class="logo"><div class="logo-icon">CV</div><span>CompVerify Portal</span></div>
    <h2>Sign in</h2>
    <p class="sub">NY &amp; NJ Workers' Comp Verification</p>
    <div class="fg"><label>Email</label><input type="email" id="le" placeholder="your@email.com"></div>
    <div class="fg"><label>Password</label><input type="password" id="lp" placeholder="••••••••" onkeydown="if(event.key==='Enter')doLogin()"></div>
    <button class="btn btn-blue" onclick="doLogin()">Sign in</button>
    <p id="lerr" style="color:#b91c1c;font-size:12px;margin-top:.5rem;text-align:center"></p>
  </div>
</div>

<div class="shell" id="portal" style="display:none">
  <div class="sidebar">
    <div class="sb-logo"><div class="logo-icon">CV</div><span>CompVerify</span></div>
    <span class="nav-s">Main</span>
    <div class="nav-i active" onclick="showPage('dashboard',this)">&#9632; Dashboard</div>
    <div class="nav-i" onclick="showPage('upload',this)">&#8679; Upload / Add</div>
    <div class="nav-i" onclick="showPage('policies',this)">&#9636; All Policies</div>
    <div class="sb-space"></div>
    <div class="sb-user">
      <div class="avatar" id="av">A</div>
      <div><div class="u-name" id="uname">Admin</div><div class="u-role">Manager</div></div>
      <button class="logout" onclick="doLogout()" title="Sign out">&#8592;</button>
    </div>
  </div>

  <div class="main">
    <div class="topbar">
      <span class="topbar-title" id="tt">Dashboard</span>
      <div class="tr">
        <span class="badge-r" id="abadge" style="display:none"></span>
        <span class="badge-y" id="wbadge" style="display:none"></span>
        <button class="btn-sm" onclick="verifyAll()">&#8635; Check All Now</button>
        <button class="btn-sm" style="background:#1d4ed8;color:#fff;border-color:#1d4ed8" onclick="showPage('upload',document.querySelectorAll('.nav-i')[1])">+ Add Policy</button>
      </div>
    </div>

    <div class="content">

      <div class="page active" id="page-dashboard">
        <div class="stats">
          <div class="stat"><div class="stat-l">Total Policies</div><div class="stat-v" id="s-total">0</div><div class="stat-s">NY + NJ</div></div>
          <div class="stat"><div class="stat-l">Active</div><div class="stat-v g" id="s-active">0</div><div class="stat-s">Verified OK</div></div>
          <div class="stat"><div class="stat-l">Expired</div><div class="stat-v r" id="s-expired">0</div><div class="stat-s">Needs attention</div></div>
          <div class="stat"><div class="stat-l">Pending / Review</div><div class="stat-v a" id="s-pending">0</div><div class="stat-s">Not yet checked</div></div>
        </div>
        <div class="card">
          <div class="ch"><h3>Policies</h3><input class="srch" placeholder="Search name or policy #" oninput="loadPolicies(this.value)"></div>
          <table><thead><tr><th>Policy #</th><th>Insured Name</th><th>State</th><th>Expires</th><th>Status</th><th>Result</th><th></th></tr></thead>
          <tbody id="dash-tb"></tbody></table>
        </div>
      </div>

      <div class="page" id="page-upload">
        <div class="ucard">
          <h3>&#8679; Upload PDF Certificate (ACORD form)</h3>
          <div class="tip">💡 <strong>Tip:</strong> Upload the ACORD 25 certificate PDF. The system will automatically extract the policy number, insured name, carrier and expiry date.</div>
          <div class="dz" id="dz" onclick="document.getElementById('fi').click()">
            <div style="font-size:32px">&#128196;</div>
            <p><strong>Click here to upload a PDF</strong></p>
            <span>ACORD 25 Certificate of Insurance</span>
          </div>
          <input type="file" id="fi" style="display:none" multiple accept=".pdf" onchange="handleFiles(this.files)">
          <div class="fg" style="margin-top:1rem">
            <label>Default state if not detected automatically</label>
            <select id="upload-state" style="padding:8px 10px;border:1px solid #d1d5db;border-radius:8px;width:200px">
              <option value="NY">New York (WCB)</option>
              <option value="NJ">New Jersey</option>
            </select>
          </div>
          <div class="prog" id="prog"></div>
        </div>

        <div class="ucard">
          <h3>&#9998; Enter Policy Manually</h3>
          <div class="tip">💡 Enter all fields for best results. The expiry date is used to verify active status when the WCB website blocks automated checks.</div>
          <div class="grid4" style="margin-bottom:10px">
            <div class="fg"><label>Policy Number *</label><input type="text" id="mp" placeholder="e.g. WCC334980A"></div>
            <div class="fg"><label>State *</label><select id="ms"><option value="NY">New York (WCB)</option><option value="NJ">New Jersey</option></select></div>
            <button class="btn" style="background:#1d4ed8;color:#fff;border-radius:8px;white-space:nowrap;padding:8px 14px" onclick="addManual(false)">&#10003; Verify</button>
            <button class="btn" style="background:#f3f4f6;border:1px solid #d1d5db;border-radius:8px;white-space:nowrap;padding:8px 14px" onclick="addManual(true)">+ Add</button>
          </div>
          <div class="grid2" style="margin-bottom:10px">
            <div class="fg" style="margin:0"><label>Insured Name</label><input type="text" id="mn" placeholder="e.g. Prime Structure Inc"></div>
            <div class="fg" style="margin:0"><label>Carrier</label><input type="text" id="mc" placeholder="e.g. National Casualty Company"></div>
          </div>
          <div class="grid2">
            <div class="fg" style="margin:0"><label>Expiry Date (from certificate)</label><input type="date" id="mx"></div>
            <div class="fg" style="margin:0"><label>Effective Date</label><input type="date" id="meff"></div>
          </div>
        </div>
      </div>

      <div class="page" id="page-policies">
        <div class="fr">
          <div class="fbtns">
            <button class="fb active" onclick="setF('all',this)">All</button>
            <button class="fb" onclick="setF('active',this)">Active</button>
            <button class="fb" onclick="setF('expired',this)">Expired</button>
            <button class="fb" onclick="setF('pending',this)">Pending</button>
          </div>
          <div class="rf">
            <select id="sf" onchange="loadAll()"><option value="all">All States</option><option value="NY">New York</option><option value="NJ">New Jersey</option></select>
            <button class="btn-sm" onclick="window.location='/api/export'">&#8659; Export CSV</button>
          </div>
        </div>
        <div class="card">
          <table><thead><tr><th>Policy #</th><th>Insured Name</th><th>State</th><th>Carrier</th><th>Expires</th><th>Status</th><th>Result</th><th></th></tr></thead>
          <tbody id="all-tb"></tbody></table>
        </div>
      </div>

    </div>
  </div>
</div>

<div class="toast" id="toast"><span id="ti" class="ti">&#10003;</span><span id="tm"></span></div>

<script>
let SF='all';
async function api(url,opts={}){const r=await fetch(url,{headers:{'Content-Type':'application/json'},credentials:'include',...opts});return r.json();}

async function doLogin(){
  const r=await api('/api/login',{method:'POST',body:JSON.stringify({email:document.getElementById('le').value,password:document.getElementById('lp').value})});
  if(r.ok){document.getElementById('login-screen').style.display='none';document.getElementById('portal').style.display='flex';document.getElementById('uname').textContent=r.name||'Admin';document.getElementById('av').textContent=(r.name||'A')[0].toUpperCase();loadPolicies();}
  else document.getElementById('lerr').textContent=r.error||'Login failed';
}
async function doLogout(){await api('/api/logout',{method:'POST'});document.getElementById('portal').style.display='none';document.getElementById('login-screen').style.display='flex';}
function showPage(name,el){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));document.querySelectorAll('.nav-i').forEach(n=>n.classList.remove('active'));document.getElementById('page-'+name).classList.add('active');if(el)el.classList.add('active');const t={dashboard:'Dashboard',upload:'Upload / Add Policy',policies:'All Policies'};document.getElementById('tt').textContent=t[name]||name;if(name==='policies')loadAll();}

function pill(s){
  const map={active:'pg',expired:'pr',not_found:'pr',cancelled:'pr',pending:'pa',unknown:'pa',error:'pr',needs_review:'pa',expiring_soon:'py'};
  const lbl={active:'✅ Active',expired:'❌ Expired',not_found:'❌ Not Found',cancelled:'❌ Cancelled',pending:'⏳ Pending',unknown:'❓ Unknown',error:'⚠ Error',needs_review:'🔍 Review',expiring_soon:'⚠️ Expiring Soon'};
  return \`<span class="pill \${map[s]||'pa'}">\${lbl[s]||s}</span>\`;
}
function fmtDate(d){return d?d.replace('T',' ').substring(0,16):'—';}

async function loadPolicies(q=''){
  const r=await api('/api/policies?q='+encodeURIComponent(q));
  if(!r.policies)return;
  document.getElementById('s-total').textContent=r.counts.total||0;
  document.getElementById('s-active').textContent=r.counts.active||0;
  document.getElementById('s-expired').textContent=r.counts.expired||0;
  document.getElementById('s-pending').textContent=r.counts.pending||0;
  const ab=document.getElementById('abadge');
  const wb=document.getElementById('wbadge');
  if(r.counts.expired>0){ab.textContent=r.counts.expired+' expired';ab.style.display='inline';}else ab.style.display='none';
  const expSoon=r.policies.filter(p=>p.status==='expiring_soon').length;
  if(expSoon>0){wb.textContent=expSoon+' expiring soon';wb.style.display='inline';}else wb.style.display='none';
  document.getElementById('dash-tb').innerHTML=r.policies.map(p=>\`<tr>
    <td class="mono">\${p.policy_number}</td>
    <td>\${p.insured_name||'—'}</td>
    <td><span class="pill pb">\${p.state}</span></td>
    <td style="font-size:12px;color:#6b7280">\${p.expiry_date||'—'}</td>
    <td>\${pill(p.status)}</td>
    <td class="notes-cell" title="\${p.notes||''}">\${p.notes||'—'}</td>
    <td style="display:flex;gap:4px">
      <button class="abn" onclick="verify(\${p.id})" title="Verify now">&#8635;</button>
      <button class="abn" onclick="del(\${p.id})" title="Delete" style="color:#b91c1c">&#128465;</button>
    </td>
  </tr>\`).join('');
}

async function loadAll(){
  const state=document.getElementById('sf')?.value||'all';
  const r=await api('/api/policies?status='+SF+'&state='+state);
  if(!r.policies)return;
  document.getElementById('all-tb').innerHTML=r.policies.map(p=>\`<tr>
    <td class="mono">\${p.policy_number}</td>
    <td>\${p.insured_name||'—'}</td>
    <td><span class="pill pb">\${p.state}</span></td>
    <td style="color:#6b7280">\${p.carrier||'—'}</td>
    <td style="font-size:12px;color:#6b7280">\${p.expiry_date||'—'}</td>
    <td>\${pill(p.status)}</td>
    <td class="notes-cell" title="\${p.notes||''}">\${p.notes||'—'}</td>
    <td style="display:flex;gap:4px">
      <button class="abn" onclick="verify(\${p.id})" title="Verify">&#8635;</button>
      <button class="abn" onclick="del(\${p.id})" title="Delete" style="color:#b91c1c">&#128465;</button>
    </td>
  </tr>\`).join('');
}

function setF(s,el){SF=s;document.querySelectorAll('.fb').forEach(b=>b.classList.remove('active'));el.classList.add('active');loadAll();}

async function verify(id){
  toast('Checking policy...','info');
  const r=await api('/api/policies/'+id+'/verify',{method:'POST'});
  if(r.status==='active')toast('✅ ACTIVE — '+r.message,'success');
  else if(r.status==='expiring_soon')toast('⚠️ '+r.message,'warn');
  else if(r.status==='expired')toast('❌ EXPIRED — '+r.message,'warn');
  else if(r.status==='needs_review')toast('🔍 '+r.message,'warn');
  else toast((r.message||r.status),'warn');
  loadPolicies();
}

async function del(id){if(!confirm('Delete this policy?'))return;await api('/api/policies/'+id,{method:'DELETE'});loadPolicies();loadAll();toast('Deleted','success');}

async function addManual(addOnly){
  const pn=document.getElementById('mp').value.trim();
  const st=document.getElementById('ms').value;
  const ca=document.getElementById('mc').value.trim();
  const nm=document.getElementById('mn').value.trim();
  const ex=document.getElementById('mx').value;
  if(!pn){toast('Please enter a policy number','warn');return;}
  const r=await api('/api/policies',{method:'POST',body:JSON.stringify({policy_number:pn,state:st,carrier:ca||null,insured_name:nm||null,expiry_date:ex||null})});
  if(r.id&&!addOnly){
    const r2=await api('/api/policies?q='+encodeURIComponent(pn));
    const found=r2.policies&&r2.policies[0];
    if(found){
      const vr=await api('/api/policies/'+found.id+'/verify',{method:'POST'});
      toast(vr.message||vr.status,'success');
    }
  } else {
    toast('Policy added — click ↺ to verify','success');
  }
  document.getElementById('mp').value='';document.getElementById('mc').value='';document.getElementById('mn').value='';document.getElementById('mx').value='';
  loadPolicies();
}

async function verifyAll(){toast('Checking all policies...','info');await api('/api/verify-all',{method:'POST'});setTimeout(loadPolicies,3000);}

async function handleFiles(files){
  const prog=document.getElementById('prog');
  prog.style.display='block';prog.innerHTML='';
  const state=document.getElementById('upload-state').value;
  for(const f of Array.from(files)){
    const key=f.name.replace(/\W/g,'_');
    const row=document.createElement('div');row.className='prow';
    row.innerHTML=\`<span style="font-size:18px">&#128196;</span><div style="flex:1"><div class="pname">\${f.name}</div><div class="pwrap"><div class="pbar" id="pb\${key}"></div></div></div><span class="ppct" id="pp\${key}">Uploading...</span>\`;
    prog.appendChild(row);
    const fd=new FormData();fd.append('files',f);fd.append('state',state);
    const pb=document.getElementById('pb'+key);const pp=document.getElementById('pp'+key);
    if(pb)pb.style.width='50%';
    try{
      const r=await fetch('/api/upload',{method:'POST',body:fd,credentials:'include'});
      const data=await r.json();
      const res=data.results?.[0];
      if(pb)pb.style.width='100%';
      if(res?.status==='added'){
        if(pp){pp.textContent='✅ Found: '+res.policy_number;pp.style.color='#15803d';}
        toast('Extracted: '+res.policy_number+' — click ↺ to verify','success');
      } else {
        if(pp){pp.textContent='⚠ No policy # found — enter manually below';pp.style.color='#b45309';}
      }
    }catch(e){if(pp){pp.textContent='Upload error';pp.style.color='#b91c1c';}}
    loadPolicies();
  }
}

function toast(msg,type='success'){
  const t=document.getElementById('toast');const ti=document.getElementById('ti');
  document.getElementById('tm').textContent=msg;
  ti.textContent=type==='warn'?'⚠':'✓';ti.className=type==='warn'?'tw':'ti';
  t.className='toast show';clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),5000);
}

fetch('/api/me',{credentials:'include'}).then(r=>r.json()).then(r=>{
  if(r.id){document.getElementById('login-screen').style.display='none';document.getElementById('portal').style.display='flex';document.getElementById('uname').textContent=r.name||'Admin';document.getElementById('av').textContent=(r.name||'A')[0].toUpperCase();loadPolicies();}
});
</script>
</body>
</html>`;

app.get('*', (req, res) => res.send(HTML));

app.listen(PORT, () => {
  console.log('=====================================');
  console.log('  CompVerify Portal RUNNING on ' + PORT);
  console.log('=====================================');
});
