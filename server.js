<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CompVerify Portal — NY & NJ Workers' Comp</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F4F6F9;color:#1a1a1a;font-size:14px}
a{color:inherit;text-decoration:none}

/* AUTH */
.auth-wrap{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#F4F6F9}
.auth-card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:2rem;width:100%;max-width:380px;box-shadow:0 2px 8px rgba(0,0,0,.06)}
.auth-logo{display:flex;align-items:center;gap:10px;margin-bottom:1.5rem}
.logo-icon{width:38px;height:38px;background:#1d4ed8;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px}
.auth-logo h1{font-size:16px;font-weight:600}
.auth-card h2{font-size:20px;font-weight:600;margin-bottom:.25rem}
.auth-card .sub{font-size:13px;color:#6b7280;margin-bottom:1.5rem}
.form-group{margin-bottom:1rem}
.form-group label{display:block;font-size:12px;font-weight:500;color:#374151;margin-bottom:5px}
.form-group input{width:100%;padding:9px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;outline:none}
.form-group input:focus{border-color:#1d4ed8;box-shadow:0 0 0 3px rgba(29,78,216,.1)}
.btn-primary{width:100%;padding:10px;background:#1d4ed8;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer}
.btn-primary:hover{background:#1e40af}
.hint{font-size:12px;color:#9ca3af;text-align:center;margin-top:1rem}

/* SHELL */
.shell{display:flex;height:100vh;overflow:hidden}
.sidebar{width:210px;background:#111827;display:flex;flex-direction:column;flex-shrink:0}
.sidebar-logo{display:flex;align-items:center;gap:9px;padding:1.125rem 1rem;border-bottom:1px solid #1f2937}
.sidebar-logo .logo-icon{width:30px;height:30px;font-size:14px}
.sidebar-logo span{color:#fff;font-size:14px;font-weight:600}
.nav-section{font-size:10px;color:#6b7280;padding:.875rem 1rem .3rem;text-transform:uppercase;letter-spacing:.06em}
.nav-item{display:flex;align-items:center;gap:9px;padding:8px 1rem;font-size:13px;color:#9ca3af;cursor:pointer;border-radius:0}
.nav-item:hover{background:#1f2937;color:#f9fafb}
.nav-item.active{background:#1d4ed8;color:#fff}
.nav-item .icon{font-size:15px;width:16px;text-align:center}
.sidebar-spacer{flex:1}
.sidebar-user{padding:.875rem 1rem;border-top:1px solid #1f2937;display:flex;align-items:center;gap:8px}
.avatar{width:28px;height:28px;border-radius:50%;background:#1d4ed8;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:#fff;flex-shrink:0}
.user-name{font-size:12px;color:#f9fafb;font-weight:500}
.user-role{font-size:11px;color:#6b7280}
.logout{background:none;border:none;color:#6b7280;cursor:pointer;margin-left:auto;font-size:13px}
.logout:hover{color:#f9fafb}

/* MAIN */
.main{flex:1;display:flex;flex-direction:column;overflow:hidden}
.topbar{background:#fff;border-bottom:1px solid #e5e7eb;padding:.75rem 1.25rem;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.topbar-title{font-size:15px;font-weight:600}
.topbar-right{display:flex;align-items:center;gap:8px}
.badge-red{background:#fee2e2;color:#b91c1c;font-size:11px;font-weight:600;padding:3px 9px;border-radius:20px}
.badge-green{background:#dcfce7;color:#15803d;font-size:11px;font-weight:600;padding:3px 9px;border-radius:20px}
.btn-sm{padding:6px 12px;border:1px solid #d1d5db;border-radius:7px;background:#fff;font-size:12px;cursor:pointer;display:flex;align-items:center;gap:5px}
.btn-sm:hover{background:#f9fafb}
.btn-sm.blue{background:#1d4ed8;color:#fff;border-color:#1d4ed8}
.btn-sm.blue:hover{background:#1e40af}
.content{flex:1;overflow-y:auto;padding:1.25rem}

/* PAGES */
.page{display:none}
.page.active{display:block}

/* STATS */
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:1.25rem}
.stat-card{background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:1rem}
.stat-label{font-size:12px;color:#6b7280;margin-bottom:4px}
.stat-val{font-size:26px;font-weight:600}
.stat-sub{font-size:11px;color:#9ca3af;margin-top:3px}
.val-green{color:#15803d}
.val-red{color:#b91c1c}
.val-amber{color:#b45309}

/* TABLE */
.card{background:#fff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:1rem}
.card-header{padding:.875rem 1rem;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f3f4f6}
.card-header h3{font-size:13px;font-weight:600}
.search-box{padding:6px 10px;border:1px solid #d1d5db;border-radius:7px;font-size:12px;width:190px;outline:none}
.search-box:focus{border-color:#1d4ed8}
table{width:100%;border-collapse:collapse}
th{font-size:11px;font-weight:600;color:#6b7280;text-align:left;padding:8px 12px;background:#f9fafb;border-bottom:1px solid #e5e7eb;text-transform:uppercase;letter-spacing:.04em}
td{font-size:13px;padding:9px 12px;color:#1a1a1a;border-bottom:1px solid #f3f4f6}
tr:last-child td{border-bottom:none}
tr:hover td{background:#fafafa}
.pill{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:600}
.pill-green{background:#dcfce7;color:#15803d}
.pill-red{background:#fee2e2;color:#b91c1c}
.pill-amber{background:#fef3c7;color:#92400e}
.pill-blue{background:#dbeafe;color:#1e40af}
.dot{width:6px;height:6px;border-radius:50%;background:currentColor}
.mono{font-family:monospace;font-size:12px}
.action-btn{background:none;border:none;cursor:pointer;color:#9ca3af;padding:3px 5px;border-radius:4px}
.action-btn:hover{background:#f3f4f6;color:#374151}

/* UPLOAD */
.upload-card{background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:1.25rem;margin-bottom:1rem}
.upload-card h3{font-size:14px;font-weight:600;margin-bottom:1rem;display:flex;align-items:center;gap:7px;color:#374151}
.drop-zone{border:2px dashed #d1d5db;border-radius:9px;padding:2.5rem 1rem;text-align:center;cursor:pointer}
.drop-zone:hover{border-color:#1d4ed8;background:#f0f5ff}
.drop-zone .drop-icon{font-size:32px;margin-bottom:.5rem}
.drop-zone p{font-size:13px;color:#6b7280}
.drop-zone span{font-size:12px;color:#9ca3af}
.divider{display:flex;align-items:center;gap:10px;margin:1rem 0;font-size:12px;color:#9ca3af}
.divider::before,.divider::after{content:'';flex:1;height:1px;background:#e5e7eb}
.manual-row{display:grid;grid-template-columns:1fr 160px auto auto;gap:8px;align-items:end}
.manual-row .form-group{margin:0}
.manual-row input,.manual-row select{padding:8px 10px;font-size:13px;border:1px solid #d1d5db;border-radius:8px;width:100%;outline:none}
.manual-row input:focus,.manual-row select:focus{border-color:#1d4ed8}
.btn-verify{padding:8px 14px;background:#1d4ed8;color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer;white-space:nowrap}
.btn-verify:hover{background:#1e40af}
.btn-add-only{padding:8px 14px;background:#f3f4f6;color:#374151;border:1px solid #d1d5db;border-radius:8px;font-size:13px;cursor:pointer;white-space:nowrap}
.btn-add-only:hover{background:#e5e7eb}

/* PROGRESS */
.file-progress{margin-top:.875rem;display:none}
.file-row{display:flex;align-items:center;gap:10px;background:#f9fafb;border-radius:8px;padding:8px 10px;margin-bottom:6px}
.file-icon{font-size:18px;color:#1d4ed8}
.file-name{font-size:13px;font-weight:500;flex:1}
.prog-wrap{height:4px;background:#e5e7eb;border-radius:2px;margin-top:4px}
.prog-bar{height:4px;background:#1d4ed8;border-radius:2px;width:0;transition:width .25s}
.prog-pct{font-size:11px;color:#6b7280;white-space:nowrap}

/* SETTINGS */
.settings-card{background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:1.25rem;margin-bottom:1rem}
.settings-card h3{font-size:14px;font-weight:600;margin-bottom:1rem;color:#374151}
.setting-row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f3f4f6}
.setting-row:last-child{border-bottom:none}
.setting-label{font-size:13px;font-weight:500}
.setting-desc{font-size:12px;color:#6b7280;margin-top:2px}
.toggle{width:38px;height:22px;background:#1d4ed8;border-radius:11px;position:relative;cursor:pointer;flex-shrink:0;transition:background .2s}
.toggle::after{content:'';position:absolute;width:16px;height:16px;background:#fff;border-radius:50%;top:3px;right:3px;transition:right .2s}
.toggle.off{background:#d1d5db}
.toggle.off::after{right:19px}
.email-row{display:flex;gap:8px;margin-top:.75rem}
.email-row input{flex:1;padding:8px 10px;font-size:13px;border:1px solid #d1d5db;border-radius:8px;outline:none}
.email-row input:focus{border-color:#1d4ed8}
.btn-save{padding:8px 14px;background:#1d4ed8;color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer}

/* TOAST */
.toast{position:fixed;bottom:20px;right:20px;background:#111827;color:#f9fafb;border-radius:9px;padding:10px 14px;font-size:13px;display:flex;align-items:center;gap:8px;opacity:0;transition:opacity .2s;pointer-events:none;z-index:999;max-width:320px}
.toast.show{opacity:1}
.toast.success .t-icon{color:#4ade80}
.toast.warning .t-icon{color:#fbbf24}

/* FILTERS */
.filter-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem}
.filter-btns{display:flex;gap:5px}
.f-btn{padding:5px 12px;border:1px solid #d1d5db;border-radius:7px;background:#fff;font-size:12px;cursor:pointer;color:#6b7280}
.f-btn:hover{background:#f9fafb}
.f-btn.active{background:#1d4ed8;color:#fff;border-color:#1d4ed8}
.right-filters{display:flex;gap:6px}
.right-filters select{padding:5px 8px;font-size:12px;border:1px solid #d1d5db;border-radius:7px;background:#fff;color:#374151;cursor:pointer}
</style>
</head>
<body>

<!-- LOGIN -->
<div class="auth-wrap" id="login-screen">
  <div class="auth-card">
    <div class="auth-logo">
      <div class="logo-icon">&#9673;</div>
      <h1>CompVerify Portal</h1>
    </div>
    <h2>Sign in</h2>
    <p class="sub">NY &amp; NJ Workers' Comp Verification</p>
    <div class="form-group">
      <label>Email address</label>
      <input type="email" id="login-email" value="admin@company.com" placeholder="you@company.com">
    </div>
    <div class="form-group">
      <label>Password</label>
      <input type="password" id="login-pass" value="password" placeholder="••••••••">
    </div>
    <button class="btn-primary" onclick="doLogin()">Sign in</button>
    <p class="hint">Demo: click Sign in with any credentials</p>
  </div>
</div>

<!-- PORTAL -->
<div class="shell" id="portal" style="display:none">
  <div class="sidebar">
    <div class="sidebar-logo">
      <div class="logo-icon">&#9673;</div>
      <span>CompVerify</span>
    </div>
    <span class="nav-section">Main</span>
    <div class="nav-item active" onclick="showPage('dashboard',this)">
      <span class="icon">&#9632;</span> Dashboard
    </div>
    <div class="nav-item" onclick="showPage('upload',this)">
      <span class="icon">&#8679;</span> Upload / Add
    </div>
    <div class="nav-item" onclick="showPage('policies',this)">
      <span class="icon">&#9636;</span> All Policies
    </div>
    <span class="nav-section">Config</span>
    <div class="nav-item" onclick="showPage('settings',this)">
      <span class="icon">&#9881;</span> Settings
    </div>
    <div class="sidebar-spacer"></div>
    <div class="sidebar-user">
      <div class="avatar">AD</div>
      <div>
        <div class="user-name">Admin User</div>
        <div class="user-role">Manager</div>
      </div>
      <button class="logout" onclick="doLogout()">&#8592; Out</button>
    </div>
  </div>

  <div class="main">
    <div class="topbar">
      <span class="topbar-title" id="topbar-title">Dashboard</span>
      <div class="topbar-right">
        <span class="badge-red" id="alert-badge" style="display:none"></span>
        <button class="btn-sm" onclick="runDailyCheck()">&#8635; Check all now</button>
        <button class="btn-sm blue" onclick="showPage('upload', document.querySelector('.nav-item:nth-child(4)'))">+ Add Policy</button>
      </div>
    </div>

    <div class="content">

      <!-- DASHBOARD PAGE -->
      <div class="page active" id="page-dashboard">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Total Policies</div>
            <div class="stat-val" id="stat-total">0</div>
            <div class="stat-sub">NY + NJ combined</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Active</div>
            <div class="stat-val val-green" id="stat-active">0</div>
            <div class="stat-sub">Verified today</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Expired / Inactive</div>
            <div class="stat-val val-red" id="stat-expired">0</div>
            <div class="stat-sub">Needs attention</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Pending Check</div>
            <div class="stat-val val-amber" id="stat-pending">0</div>
            <div class="stat-sub">Queued for verification</div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <h3>Recent Policies</h3>
            <input class="search-box" type="text" placeholder="Search name or policy #" oninput="filterDash(this.value)">
          </div>
          <table>
            <thead>
              <tr>
                <th>Policy #</th>
                <th>Insured Name</th>
                <th>State</th>
                <th>Carrier</th>
                <th>Expires</th>
                <th>Status</th>
                <th>Last Checked</th>
                <th></th>
              </tr>
            </thead>
            <tbody id="dash-tbody"></tbody>
          </table>
        </div>
      </div>

      <!-- UPLOAD PAGE -->
      <div class="page" id="page-upload">
        <div class="upload-card">
          <h3>&#8679; Upload Policy Documents</h3>
          <div class="drop-zone" id="drop-zone" onclick="document.getElementById('file-input').click()">
            <div class="drop-icon">&#128196;</div>
            <p>Drop PDF or image files here, or click to browse</p>
            <span>Supports PDF, JPG, PNG — AI extracts policy details automatically</span>
          </div>
          <input type="file" id="file-input" style="display:none" multiple accept=".pdf,.jpg,.jpeg,.png" onchange="handleFiles(this.files)">
          <div class="file-progress" id="file-progress"></div>

          <div class="divider">or enter manually</div>

          <div class="manual-row">
            <div class="form-group">
              <label>Policy Number</label>
              <input type="text" id="manual-policy" placeholder="e.g. WC-2024-00123">
            </div>
            <div class="form-group">
              <label>State Board</label>
              <select id="manual-state">
                <option value="NY">New York (WCB)</option>
                <option value="NJ">New Jersey</option>
              </select>
            </div>
            <button class="btn-verify" onclick="addManual(false)">Verify Now</button>
            <button class="btn-add-only" onclick="addManual(true)">+ Add</button>
          </div>
        </div>

        <div class="upload-card">
          <h3>&#9636; Bulk CSV Import</h3>
          <p style="font-size:13px;color:#6b7280;margin-bottom:.875rem">
            Upload a CSV with columns:
            <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:12px">policy_number, state, carrier, insured_name, expiry_date</code>
          </p>
          <button class="btn-sm" onclick="showToast('CSV import ready — connect your backend to process bulk files.','success')">
            &#8679; Upload CSV
          </button>
        </div>
      </div>

      <!-- ALL POLICIES PAGE -->
      <div class="page" id="page-policies">
        <div class="filter-row">
          <div class="filter-btns">
            <button class="f-btn active" onclick="setFilter('all',this)">All</button>
            <button class="f-btn" onclick="setFilter('active',this)">Active</button>
            <button class="f-btn" onclick="setFilter('expired',this)">Expired</button>
            <button class="f-btn" onclick="setFilter('pending',this)">Pending</button>
          </div>
          <div class="right-filters">
            <select id="state-filter" onchange="renderPolicies()">
              <option value="all">All States</option>
              <option value="NY">New York</option>
              <option value="NJ">New Jersey</option>
            </select>
            <button class="btn-sm" onclick="showToast('Export ready — connect backend to download CSV.','success')">
              &#8659; Export CSV
            </button>
          </div>
        </div>
        <div class="card">
          <table>
            <thead>
              <tr>
                <th><input type="checkbox" onchange="selectAll(this)"></th>
                <th>Policy #</th>
                <th>Insured Name</th>
                <th>State</th>
                <th>Carrier</th>
                <th>Expires</th>
                <th>Status</th>
                <th>Last Checked</th>
                <th></th>
              </tr>
            </thead>
            <tbody id="all-tbody"></tbody>
          </table>
        </div>
      </div>

      <!-- SETTINGS PAGE -->
      <div class="page" id="page-settings">
        <div class="settings-card">
          <h3>&#9993; Email Alerts</h3>
          <div class="setting-row">
            <div>
              <div class="setting-label">Alert on expired/inactive policy</div>
              <div class="setting-desc">Send email immediately when a policy becomes inactive</div>
            </div>
            <div class="toggle" onclick="this.classList.toggle('off')"></div>
          </div>
          <div class="setting-row">
            <div>
              <div class="setting-label">Alert 30 days before expiry</div>
              <div class="setting-desc">Proactive warning before a policy lapses</div>
            </div>
            <div class="toggle" onclick="this.classList.toggle('off')"></div>
          </div>
          <div class="setting-row">
            <div>
              <div class="setting-label">Daily summary email</div>
              <div class="setting-desc">Morning digest of all policy statuses</div>
            </div>
            <div class="toggle" onclick="this.classList.toggle('off')"></div>
          </div>
          <div style="margin-top:1rem">
            <div style="font-size:12px;font-weight:500;color:#374151;margin-bottom:6px">Alert recipients</div>
            <div class="email-row">
              <input type="email" value="admin@company.com" placeholder="email@company.com">
              <button class="btn-save" onclick="showToast('Alert email saved.','success')">Save</button>
            </div>
          </div>
        </div>

        <div class="settings-card">
          <h3>&#9200; Daily Auto-Check Schedule</h3>
          <div class="setting-row">
            <div>
              <div class="setting-label">Auto-check enabled</div>
              <div class="setting-desc">Automatically verify all policies every day</div>
            </div>
            <div class="toggle" onclick="this.classList.toggle('off')"></div>
          </div>
          <div class="setting-row">
            <div>
              <div class="setting-label">Check time</div>
              <div class="setting-desc">When to run the daily verification</div>
            </div>
            <select style="padding:6px 10px;font-size:13px;border:1px solid #d1d5db;border-radius:7px">
              <option>6:00 AM</option>
              <option selected>7:00 AM</option>
              <option>8:00 AM</option>
              <option>9:00 AM</option>
            </select>
          </div>
        </div>

        <div class="settings-card">
          <h3>&#127970; State Boards Connected</h3>
          <div class="setting-row">
            <div>
              <div class="setting-label">New York WCB</div>
              <div class="setting-desc">wcb.ny.gov — verification endpoint</div>
            </div>
            <span class="badge-green">Connected</span>
          </div>
          <div class="setting-row">
            <div>
              <div class="setting-label">New Jersey Workers' Comp</div>
              <div class="setting-desc">nj.gov/labor — verification endpoint</div>
            </div>
            <span class="badge-green">Connected</span>
          </div>
        </div>
      </div>

    </div><!-- /content -->
  </div><!-- /main -->
</div><!-- /shell -->

<!-- TOAST -->
<div class="toast" id="toast">
  <span class="t-icon" id="t-icon">&#10003;</span>
  <span id="toast-msg"></span>
</div>

<script>
const SAMPLE = [
  {id:1,policy:'WC-NY-2024-00441',name:'Metro Construction LLC',state:'NY',carrier:'Travelers',expires:'2025-03-15',status:'expired',checked:'Today 7:02 AM'},
  {id:2,policy:'WC-NY-2024-00892',name:'Sunrise Electrical Co.',state:'NY',carrier:'Hartford',expires:'2025-11-30',status:'active',checked:'Today 7:03 AM'},
  {id:3,policy:'WC-NJ-2024-01122',name:'Garden State Builders',state:'NJ',carrier:'Liberty Mutual',expires:'2025-08-20',status:'active',checked:'Today 7:03 AM'},
  {id:4,policy:'WC-NJ-2024-00338',name:'Tri-State Plumbing Inc.',state:'NJ',carrier:'CNA',expires:'2025-12-01',status:'active',checked:'Today 7:04 AM'},
  {id:5,policy:'WC-NY-2024-00217',name:'Brooklyn Roofing Co.',state:'NY',carrier:'Zurich',expires:'2025-02-28',status:'expired',checked:'Today 7:04 AM'},
  {id:6,policy:'WC-NY-2025-00103',name:'Hudson Valley HVAC',state:'NY',carrier:'AIG',expires:'2026-01-15',status:'active',checked:'Today 7:05 AM'},
  {id:7,policy:'WC-NJ-2025-00055',name:'Newark Demolition LLC',state:'NJ',carrier:'Employers',expires:'2025-06-30',status:'pending',checked:'Pending'},
  {id:8,policy:'WC-NY-2024-00778',name:'Queens Landscaping',state:'NY',carrier:'Selective',expires:'2025-09-10',status:'active',checked:'Today 7:06 AM'},
  {id:9,policy:'WC-NJ-2024-00901',name:'Atlantic City Contractors',state:'NJ',carrier:'Travelers',expires:'2025-10-15',status:'active',checked:'Today 7:07 AM'},
  {id:10,policy:'WC-NY-2025-00210',name:'Bronx Masonry Inc.',state:'NY',carrier:'Hartford',expires:'2026-03-01',status:'active',checked:'Today 7:08 AM'},
];

let policies = JSON.parse(JSON.stringify(SAMPLE));
let statusFilter = 'all';

function doLogin(){
  document.getElementById('login-screen').style.display='none';
  document.getElementById('portal').style.display='flex';
  renderAll();
}
function doLogout(){
  document.getElementById('portal').style.display='none';
  document.getElementById('login-screen').style.display='flex';
}

function showPage(name, el){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('page-'+name).classList.add('active');
  if(el) el.classList.add('active');
  const titles={dashboard:'Dashboard',upload:'Upload / Add Policy',policies:'All Policies',settings:'Settings'};
  document.getElementById('topbar-title').textContent = titles[name]||name;
  if(name==='policies') renderPolicies();
}

function statusPill(s){
  const map={active:'pill-green',expired:'pill-red',pending:'pill-amber'};
  const labels={active:'Active',expired:'Expired',pending:'Pending'};
  return `<span class="pill ${map[s]||'pill-amber'}"><span class="dot"></span>${labels[s]||s}</span>`;
}

function makeRow(p, withCheck){
  return `<tr>
    ${withCheck?`<td><input type="checkbox"></td>`:''}
    <td class="mono">${p.policy}</td>
    <td>${p.name}</td>
    <td><span class="pill pill-blue">${p.state}</span></td>
    <td style="color:#6b7280">${p.carrier}</td>
    <td style="font-size:12px;color:#6b7280">${p.expires}</td>
    <td>${statusPill(p.status)}</td>
    <td style="font-size:12px;color:#9ca3af">${p.checked}</td>
    <td><button class="action-btn" onclick="recheck(${p.id})" title="Re-check">&#8635;</button></td>
  </tr>`;
}

function renderAll(){
  const tb = document.getElementById('dash-tbody');
  if(tb) tb.innerHTML = policies.slice(0,8).map(p=>makeRow(p,false)).join('');
  updateStats();
}

function renderPolicies(){
  const sf = document.getElementById('state-filter')?.value||'all';
  let list = policies.filter(p=>{
    if(statusFilter!=='all' && p.status!==statusFilter) return false;
    if(sf!=='all' && p.state!==sf) return false;
    return true;
  });
  const tb = document.getElementById('all-tbody');
  if(tb) tb.innerHTML = list.map(p=>makeRow(p,true)).join('');
}

function updateStats(){
  const total = policies.length;
  const active = policies.filter(p=>p.status==='active').length;
  const expired = policies.filter(p=>p.status==='expired').length;
  const pending = policies.filter(p=>p.status==='pending').length;
  document.getElementById('stat-total').textContent=total;
  document.getElementById('stat-active').textContent=active;
  document.getElementById('stat-expired').textContent=expired;
  document.getElementById('stat-pending').textContent=pending;
  const badge = document.getElementById('alert-badge');
  if(expired>0){badge.textContent=expired+' alert'+(expired>1?'s':'');badge.style.display='inline';}
  else badge.style.display='none';
}

function filterDash(q){
  const tb = document.getElementById('dash-tbody');
  const list = policies.filter(p=>p.policy.toLowerCase().includes(q.toLowerCase())||p.name.toLowerCase().includes(q.toLowerCase()));
  tb.innerHTML = list.slice(0,8).map(p=>makeRow(p,false)).join('');
}

function setFilter(s, el){
  statusFilter = s;
  document.querySelectorAll('.f-btn').forEach(b=>b.classList.remove('active'));
  el.classList.add('active');
  renderPolicies();
}

function addManual(addOnly){
  const pn = document.getElementById('manual-policy').value.trim();
  const st = document.getElementById('manual-state').value;
  if(!pn){showToast('Please enter a policy number.','warning');return;}
  const carriers=['Hartford','Travelers','Zurich','CNA','AIG'];
  policies.unshift({
    id: Date.now(),
    policy: pn,
    name: '(Pending lookup)',
    state: st,
    carrier: carriers[Math.floor(Math.random()*carriers.length)],
    expires: '—',
    status: addOnly?'pending':'active',
    checked: addOnly?'Queued':'Just now'
  });
  document.getElementById('manual-policy').value='';
  renderAll();
  showToast(addOnly?'Policy added and queued for verification.':'Policy verified — status: Active.','success');
}

function handleFiles(files){
  const prog = document.getElementById('file-progress');
  prog.style.display='block';
  prog.innerHTML='';
  Array.from(files).forEach(f=>{
    const key = f.name.replace(/\W/g,'_');
    const row = document.createElement('div');
    row.className='file-row';
    row.innerHTML=`<span class="file-icon">&#128196;</span><div style="flex:1"><div class="file-name">${f.name}</div><div class="prog-wrap"><div class="prog-bar" id="pb_${key}"></div></div></div><span class="prog-pct" id="pp_${key}">0%</span>`;
    prog.appendChild(row);
    let pct=0;
    const iv=setInterval(()=>{
      pct+=Math.floor(Math.random()*18)+8;
      if(pct>=100){pct=100;clearInterval(iv);
        const pp=document.getElementById('pp_'+key);
        if(pp){pp.textContent='Done';pp.style.color='#15803d';}
        showToast('Extracted policy from '+f.name+' — added to dashboard.','success');
        addDemoPolicy();
      }
      const pb=document.getElementById('pb_'+key);
      const pp=document.getElementById('pp_'+key);
      if(pb) pb.style.width=pct+'%';
      if(pp && pct<100) pp.textContent=pct+'%';
    },180);
  });
}

function addDemoPolicy(){
  const names=['Allied Contractors LLC','Bronx Safety Group','NJ Concrete Co.','Park Slope Services','Essex County HVAC'];
  const carriers=['Hartford','Travelers','Zurich','CNA','AIG'];
  const states=['NY','NJ'];
  const st=states[Math.floor(Math.random()*2)];
  const yr=2025+Math.floor(Math.random()*2);
  const mo=String(Math.floor(Math.random()*12)+1).padStart(2,'0');
  policies.unshift({
    id:Date.now(),
    policy:'WC-'+st+'-'+yr+'-'+String(Math.floor(Math.random()*90000)+10000),
    name:names[Math.floor(Math.random()*names.length)],
    state:st,
    carrier:carriers[Math.floor(Math.random()*carriers.length)],
    expires:yr+'-'+mo+'-15',
    status:'active',
    checked:'Just now'
  });
  renderAll();
}

function recheck(id){
  const p=policies.find(x=>x.id===id);
  if(!p)return;
  p.checked='Checking...';
  renderAll();
  setTimeout(()=>{
    const outcomes=['active','active','active','expired'];
    p.status=outcomes[Math.floor(Math.random()*outcomes.length)];
    p.checked='Just now';
    renderAll();
    showToast('Policy '+p.policy+': '+p.status.toUpperCase(),p.status==='active'?'success':'warning');
  },1200);
}

function runDailyCheck(){
  showToast('Daily check started for '+policies.length+' policies across NY WCB & NJ...','success');
  let i=0;
  const iv=setInterval(()=>{
    if(i>=policies.length){clearInterval(iv);updateStats();showToast('All '+policies.length+' policies verified.','success');return;}
    policies[i].checked='Just now';i++;
  },60);
}

function selectAll(cb){
  document.querySelectorAll('#all-tbody input[type=checkbox]').forEach(c=>c.checked=cb.checked);
}

function showToast(msg,type){
  const t=document.getElementById('toast');
  const ic=document.getElementById('t-icon');
  document.getElementById('toast-msg').textContent=msg;
  t.className='toast show '+(type||'success');
  ic.textContent=type==='warning'?'⚠':'✓';
  clearTimeout(t._timer);
  t._timer=setTimeout(()=>t.classList.remove('show'),3500);
}

// drag & drop
const dz=document.getElementById('drop-zone');
dz.addEventListener('dragover',e=>{e.preventDefault();dz.style.borderColor='#1d4ed8';dz.style.background='#f0f5ff'});
dz.addEventListener('dragleave',()=>{dz.style.borderColor='';dz.style.background=''});
dz.addEventListener('drop',e=>{e.preventDefault();dz.style.borderColor='';dz.style.background='';handleFiles(e.dataTransfer.files)});
</script>
</body>
</html>
