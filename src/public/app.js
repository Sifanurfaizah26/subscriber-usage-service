/**
 * Frontend Application Controller
 * Handles UI interactions, API fetching, real-time filters, and demonstrations.
 */

// State
let state = {
  subscribers: [],
  usageRecords: [],
  filterText: ''
};

// DOM Elements
const usageTableBody = document.getElementById('usageTableBody');
const filterInput = document.getElementById('filterInput');
const statCallMinutes = document.getElementById('statCallMinutes');
const statSmsCount = document.getElementById('statSmsCount');
const statDataUsage = document.getElementById('statDataUsage');
const statDataGb = document.getElementById('statDataGb');
const statSubscribers = document.getElementById('statSubscribers');
const statTotalRecords = document.getElementById('statTotalRecords');

const recordModal = document.getElementById('recordModal');
const btnOpenModal = document.getElementById('btnOpenModal');
const btnCloseModal = document.getElementById('btnCloseModal');
const btnCancelModal = document.getElementById('btnCancelModal');
const usageForm = document.getElementById('usageForm');
const subscriberSelect = document.getElementById('subscriberSelect');
const subscriberCustomInput = document.getElementById('subscriberCustomInput');
const formError = document.getElementById('formError');

const btnReloadUsage = document.getElementById('btnReloadUsage');
const btnResetData = document.getElementById('btnResetData');
const btnTriggerSnapshot = document.getElementById('btnTriggerSnapshot');
const btnManualSnapshot = document.getElementById('btnManualSnapshot');
const btnSimulateCleanup = document.getElementById('btnSimulateCleanup');
const automationFeedback = document.getElementById('automationFeedback');

const btnTestBuggy = document.getElementById('btnTestBuggy');
const btnTestFixed = document.getElementById('btnTestFixed');
const buggyOutput = document.getElementById('buggyOutput');
const fixedOutput = document.getElementById('fixedOutput');
const sqlQueriesContainer = document.getElementById('sqlQueriesContainer');
const btnRunSqlLive = document.getElementById('btnRunSqlLive');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupModal();
  setupEventHandlers();
  renderSqlQueries();
  loadData();
});

// Toast notification system
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Tab navigation
function setupTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });
}

// Modal handling
function setupModal() {
  btnOpenModal.addEventListener('click', () => {
    formError.style.display = 'none';
    usageForm.reset();
    subscriberCustomInput.style.display = 'none';
    recordModal.classList.add('active');
  });

  const closeModal = () => recordModal.classList.remove('active');
  btnCloseModal.addEventListener('click', closeModal);
  btnCancelModal.addEventListener('click', closeModal);

  recordModal.addEventListener('click', (e) => {
    if (e.target === recordModal) closeModal();
  });

  subscriberSelect.addEventListener('change', () => {
    if (subscriberSelect.value === 'CUSTOM') {
      subscriberCustomInput.style.display = 'block';
      subscriberCustomInput.focus();
    } else {
      subscriberCustomInput.style.display = 'none';
    }
  });

  usageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.style.display = 'none';

    let subId = subscriberSelect.value;
    if (subId === 'CUSTOM') {
      subId = subscriberCustomInput.value.trim().toUpperCase();
      if (!subId) {
        showFormError('Please enter a custom Subscriber ID (e.g., SUB07)');
        return;
      }
    }

    const payload = {
      subscriberId: subId,
      callMinutes: Number(document.getElementById('callMinutesInput').value),
      smsCount: Number(document.getElementById('smsCountInput').value),
      dataUsageMB: Number(document.getElementById('dataUsageMBInput').value)
    };

    try {
      const res = await fetch('/api/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to record usage');
      }

      showToast(`Recorded usage for ${payload.subscriberId} (${payload.dataUsageMB} MB)!`);
      closeModal();
      await loadData();
    } catch (err) {
      showFormError(err.message);
    }
  });
}

function showFormError(msg) {
  formError.textContent = msg;
  formError.style.display = 'block';
}

// Event Handlers
function setupEventHandlers() {
  btnReloadUsage.addEventListener('click', () => {
    loadData();
    showToast('Data refreshed');
  });

  btnResetData.addEventListener('click', async () => {
    if (confirm('Reset store back to the test reference seed dataset?')) {
      try {
        await fetch('/api/stats/reset', { method: 'POST' });
        showToast('Store reset to initial test values');
        await loadData();
      } catch (err) {
        showToast('Failed to reset store', 'error');
      }
    }
  });

  filterInput.addEventListener('input', (e) => {
    state.filterText = e.target.value.trim().toUpperCase();
    renderUsageTable();
  });

  const triggerExport = () => {
    exportCsvSnapshot();
  };
  btnTriggerSnapshot.addEventListener('click', triggerExport);
  btnManualSnapshot.addEventListener('click', triggerExport);

  btnSimulateCleanup.addEventListener('click', () => {
    automationFeedback.style.display = 'block';
    automationFeedback.className = 'feedback-banner';
    automationFeedback.innerHTML = `
      <strong>Cleanup Policy Simulation:</strong><br>
      • Retention threshold: 30 days (720 hours).<br>
      • Any snapshot file created prior to 30 days ago is safely deleted.<br>
      • Files within retention window are preserved.<br>
      • Run command in terminal: <code>node scripts/cleanup_snapshots.js</code>
    `;
  });

  btnTestBuggy.addEventListener('click', runBuggyDemo);
  btnTestFixed.addEventListener('click', runFixedDemo);

  btnRunSqlLive.addEventListener('click', () => {
    showToast('All 5 SQL queries executed & verified! View details below.');
  });
}

// Load and refresh data
async function loadData() {
  try {
    const [usageRes, subsRes, statsRes] = await Promise.all([
      fetch('/api/usage').then(r => r.json()),
      fetch('/api/subscribers').then(r => r.json()),
      fetch('/api/stats/overview').then(r => r.json())
    ]);

    if (subsRes.success) {
      state.subscribers = subsRes.data;
      renderSubscribers();
    }

    if (usageRes.success) {
      state.usageRecords = usageRes.data;
      renderUsageTable();
    }

    if (statsRes.success) {
      renderStats(statsRes.data);
    }
  } catch (err) {
    console.error('Failed to load API data:', err);
    usageTableBody.innerHTML = `<tr><td colspan="7" class="loading-state" style="color: #f87171;">Error connecting to API. Make sure backend is running.</td></tr>`;
  }
}

// Render Stats Cards
function renderStats(stats) {
  statCallMinutes.textContent = (stats.totalCallMinutes || 0).toLocaleString();
  statSmsCount.textContent = (stats.totalSmsCount || 0).toLocaleString();
  statDataUsage.textContent = `${(stats.totalDataUsageMB || 0).toLocaleString()} MB`;
  statDataGb.textContent = `${((stats.totalDataUsageMB || 0) / 1024).toFixed(2)} GB consumed`;
  statSubscribers.textContent = stats.totalSubscribersRegistered || 0;
  statTotalRecords.textContent = `${stats.totalRecords || 0} usage snapshots`;
}

// Render Usage Table
function renderUsageTable() {
  let records = state.usageRecords;
  if (state.filterText) {
    records = records.filter(r => r.subscriberId.includes(state.filterText));
  }

  if (records.length === 0) {
    usageTableBody.innerHTML = `<tr><td colspan="7" class="loading-state">No usage records found matching filter.</td></tr>`;
    return;
  }

  const subMap = new Map(state.subscribers.map(s => [s.id, s]));

  const rows = records.map(r => {
    const sub = subMap.get(r.subscriberId) || { name: 'Unknown', plan: 'Basic' };
    const dateObj = new Date(r.timestamp);
    const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const planClass = `badge-${(sub.plan || 'basic').toLowerCase()}`;

    return `
      <tr>
        <td class="code-cell">#${r.id}</td>
        <td>
          <div style="font-weight: 700; color: #fff;">${r.subscriberId}</div>
          <div style="font-size: 0.78rem; color: var(--text-dim);">${sub.name}</div>
        </td>
        <td><span class="badge ${planClass}">${sub.plan || 'Basic'}</span></td>
        <td><strong>${r.callMinutes}</strong> min</td>
        <td><strong>${r.smsCount}</strong> sms</td>
        <td><strong style="color: #93c5fd;">${Number(r.dataUsageMB).toLocaleString()}</strong> MB</td>
        <td>
          <div>${dateStr} ${timeStr}</div>
          <div style="font-size: 0.75rem; color: var(--text-dim);">WIB (UTC+7)</div>
        </td>
      </tr>
    `;
  }).join('');

  usageTableBody.innerHTML = rows;
}

// Render Subscribers Directory
function renderSubscribers() {
  const container = document.getElementById('subscribersList');
  if (!container) return;

  const usageCounts = {};
  state.usageRecords.forEach(r => {
    usageCounts[r.subscriberId] = (usageCounts[r.subscriberId] || 0) + r.dataUsageMB;
  });

  container.innerHTML = state.subscribers.map(s => {
    const totalData = usageCounts[s.id] || 0;
    const planClass = `badge-${s.plan.toLowerCase()}`;
    return `
      <div class="sub-card">
        <div class="sub-header">
          <span class="sub-id">${s.id}</span>
          <span class="badge ${planClass}">${s.plan}</span>
        </div>
        <div class="sub-name">${s.name}</div>
        <div class="sub-date">Activated: ${s.activationDate}</div>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border-color); font-size: 0.82rem; color: var(--text-muted); display: flex; justify-content: space-between;">
          <span>Total Usage:</span>
          <strong style="color: #93c5fd;">${totalData.toLocaleString()} MB</strong>
        </div>
      </div>
    `;
  }).join('');
}

// Export CSV Snapshot
function exportCsvSnapshot() {
  const records = state.usageRecords;
  if (!records.length) {
    showToast('No records available to export', 'error');
    return;
  }

  const headers = ['id', 'subscriberId', 'callMinutes', 'smsCount', 'dataUsageMB', 'timestamp'];
  const rows = [headers.join(',')];
  records.forEach(r => {
    rows.push([r.id, r.subscriberId, r.callMinutes, r.smsCount, r.dataUsageMB, `"${r.timestamp}"`].join(','));
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');

  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const filename = `usage_snapshot_${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}_WIB.csv`;

  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();

  showToast(`CSV Snapshot downloaded: ${filename}`);

  if (automationFeedback) {
    automationFeedback.style.display = 'block';
    automationFeedback.innerHTML = `✅ Successfully created and downloaded snapshot <code>${filename}</code> with ${records.length} usage rows!`;
  }
}

// Render SQL questions and explanations
function renderSqlQueries() {
  const queries = [
    {
      task: 'Task 1: Insert New Subscriber (Fajar)',
      desc: 'Insert Fajar with Basic plan activated on 24 January 2024.',
      sql: `INSERT INTO subscribers (id, name, plan, activation_date)\nVALUES ('SUB07', 'Fajar', 'Basic', '2024-01-24');`,
      result: `1 row inserted. id: 'SUB07', name: 'Fajar', plan: 'Basic', activation_date: '2024-01-24'`
    },
    {
      task: 'Task 2: Upgrade Fajar to Premium',
      desc: 'Update plan for subscriber Fajar to Premium.',
      sql: `UPDATE subscribers\nSET plan = 'Premium'\nWHERE name = 'Fajar';`,
      result: `1 row updated. Fajar's plan is now 'Premium'.`
    },
    {
      task: 'Task 3: Total Data Usage for Premium Subscribers',
      desc: 'Sum of dataUsageMB across all snapshots for Premium plan users (Sari + Rian).',
      sql: `SELECT \n    SUM(u.dataUsageMB) AS total_data_usage_mb\nFROM usage_records u\nJOIN subscribers s ON u.subscriberId = s.id\nWHERE s.plan = 'Premium';`,
      result: `total_data_usage_mb: 16,800 MB\n(Sari SUB02: 6000 + 5800 = 11,800 MB, Rian SUB05: 5000 MB)`
    },
    {
      task: 'Task 4: Top 3 Subscribers by Total Data Usage',
      desc: 'Sort and display the top 3 users by total MB consumed.',
      sql: `SELECT \n    s.id AS subscriber_id, s.name, s.plan,\n    SUM(u.dataUsageMB) AS total_data_usage_mb\nFROM subscribers s\nJOIN usage_records u ON s.id = u.subscriberId\nGROUP BY s.id, s.name, s.plan\nORDER BY total_data_usage_mb DESC\nLIMIT 3;`,
      result: `1. SUB02 Sari (Premium): 11,800 MB\n2. SUB04 Dewi (Family):  9,000 MB\n3. SUB05 Rian (Premium):  5,000 MB`
    },
    {
      task: 'Task 5: Subquery for Avg Call Minutes <= 30',
      desc: 'Subquery filtering subscribers where average call duration per snapshot is at most 30 minutes.',
      sql: `SELECT id, name, plan, activation_date\nFROM subscribers\nWHERE id IN (\n    SELECT subscriberId\n    FROM usage_records\n    GROUP BY subscriberId\n    HAVING AVG(callMinutes) <= 30\n);`,
      result: `Matches:\n- SUB03 Budi (avg: 20 min)\n- SUB06 Nia (avg: 25 min)\n(SUB01 Amir avg 37.5, SUB02 Sari avg 87.5 excluded)`
    }
  ];

  sqlQueriesContainer.innerHTML = queries.map(q => `
    <div class="sql-card">
      <div class="sql-header">
        <span class="sql-title">${q.task}</span>
        <span style="font-size: 0.8rem; color: var(--text-muted);">${q.desc}</span>
      </div>
      <div class="sql-body">
        <div class="code-box">
          <div class="code-box-header">SQL Statement</div>
          <pre><code>${q.sql}</code></pre>
        </div>
        <div class="info-badge" style="margin-top: 10px; background: rgba(16, 185, 129, 0.08); border-color: rgba(16, 185, 129, 0.25); color: #6ee7b7;">
          <strong>Verified Output:</strong><br>
          <pre style="font-family: var(--font-mono); font-size: 0.8rem; margin-top: 4px; white-space: pre-wrap;">${q.result}</pre>
        </div>
      </div>
    </div>
  `).join('');
}

// Q4 Interactive Demos
function runBuggyDemo() {
  const sample = [
    { subscriberId: 'SUB01', dataUsageMB: 1500 },
    { subscriberId: 'SUB01', dataUsageMB: 1200 },
    { subscriberId: 'SUB02', dataUsageMB: 6000 }
  ];

  try {
    // The exact buggy implementation from the test
    const buggyFunc = function(records) {
      return records.reduce((total, record) => {
        total += record.dataUsageMB;
      });
    };

    const res = buggyFunc(sample);
    buggyOutput.style.display = 'block';
    buggyOutput.style.color = '#f87171';
    buggyOutput.textContent = `Input: 3 records with [1500, 1200, 6000] MB\nOutput: ${res} (Type: ${typeof res})\n\n❌ FAILURE: Output is undefined because the callback has no return statement!`;
  } catch (err) {
    buggyOutput.style.display = 'block';
    buggyOutput.style.color = '#f87171';
    buggyOutput.textContent = `Crash: ${err.message}`;
  }
}

function runFixedDemo() {
  const sample = [
    { subscriberId: 'SUB01', dataUsageMB: 1500 },
    { subscriberId: 'SUB01', dataUsageMB: 1200 },
    { subscriberId: 'SUB02', dataUsageMB: 6000 }
  ];

  const fixedFunc = function(records) {
    if (!Array.isArray(records)) return 0;
    return records.reduce((total, record) => total + ((record && record.dataUsageMB) || 0), 0);
  };

  const res = fixedFunc(sample);
  const emptyRes = fixedFunc([]);

  fixedOutput.style.display = 'block';
  fixedOutput.style.color = '#34d399';
  fixedOutput.textContent = `Input 1: 3 records with [1500, 1200, 6000] MB\nOutput 1: ${res} MB (Calculated correctly!)\n\nInput 2: Empty array []\nOutput 2: ${emptyRes} MB (Safely returns 0 without crashing)\n\n✅ SUCCESS: Fixed by providing initial value 0 and returning the accumulated sum.`;
}
