/* Leads mock prototype: 3rd panel tab content
   (activity timeline, documents, financial, notes, follow-up).
   Plain DOM rendering + event delegation, no framework. */
(function () {
  'use strict';

  var icon = function (opts) { return window.LeadsMock.icons.svg(opts); };

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function formatCurrency(n) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  }

  var ACTIVITY_COLORS = {
    call: '#059669', email: '#2563eb', sms: '#0ea5e9', whatsapp: '#059669',
    note: '#d97706', status: '#7c3aed', assignment: '#6b7280', scan: '#059669', ai: '#7c3aed',
  };
  var ACTIVITY_BG = {
    call: '#d1fae5', email: '#dbeafe', sms: '#e0f2fe', whatsapp: '#d1fae5',
    note: '#fef3c7', status: '#ede9fe', assignment: '#f3f4f6', scan: '#ecfdf5', ai: '#f5f3ff',
  };

  function repFor(reps, id) {
    for (var i = 0; i < reps.length; i++) if (reps[i].id === id) return reps[i];
    return reps[0];
  }

  function renderActivityTab(lead, state) {
    return '<div class="timeline">' + lead.activities.map(function (act, i) {
      var color = ACTIVITY_COLORS[act.type] || '#6b7280';
      var bg = ACTIVITY_BG[act.type] || '#f3f4f6';
      var actorColor = act.actorId === 'system' ? 'var(--text-muted)' :
        act.actorId === 'ai' ? 'var(--accent-purple)' :
        (repFor(state.reps, act.actorId) || {}).color || 'var(--accent-primary)';
      return '<div class="timeline-item" style="animation-delay:' + (i * 0.03) + 's">' +
        '<div class="timeline-dot" style="background:' + bg + '">' + icon({ size: 8, color: color }) + '</div>' +
        '<div class="timeline-content">' +
        '<div class="timeline-header"><span class="timeline-title">' + escapeHtml(act.title) + '</span>' +
        '<span class="timeline-time">' + window.LeadsMock.list.formatRelativeDate(act.timestamp) + '</span></div>' +
        '<div class="timeline-desc">' + escapeHtml(act.description) + '</div>' +
        (act.duration ? '<div class="timeline-desc" style="margin-top:2px;font-size:10px;color:var(--text-muted)">Duration: ' + act.duration + '</div>' : '') +
        '<div class="timeline-actor"><span class="avatar avatar-sm" style="background:' + actorColor + ';width:16px;height:16px;font-size:7px">' +
        act.actor.split(' ').map(function (n) { return n[0]; }).join('').slice(0, 2) + '</span>' + escapeHtml(act.actor) + '</div>' +
        '</div></div>';
    }).join('') + '</div>';
  }

  function renderDocumentsTab(lead) {
    return '<div class="doc-list">' + lead.documents.map(function (doc) {
      return '<div class="doc-item" data-action="open-doc" data-doc-id="' + doc.id + '">' +
        '<div class="doc-icon">' + icon({ size: 18 }) + '</div>' +
        '<div class="doc-info"><div class="doc-label">' + escapeHtml(doc.label) + '</div>' +
        '<div class="doc-meta">' + doc.type.toUpperCase() + ' &middot; ' + doc.size + ' &middot; ' + new Date(doc.date).toLocaleDateString() + '</div></div>' +
        '<button type="button" class="btn-icon" data-action="open-doc" data-doc-id="' + doc.id + '">' + icon({ size: 14 }) + '</button>' +
        '<button type="button" class="btn-icon" data-action="download-doc">' + icon({ size: 14 }) + '</button>' +
        '</div>';
    }).join('') + '</div>';
  }

  function renderFinancialTab(lead) {
    var mcaCards = lead.hasMCA ? (
      '<div class="financial-card" style="border-color:var(--accent-warning-light)">' +
      '<div class="financial-card-label">MCA Balance</div>' +
      '<div class="financial-card-value" style="color:var(--accent-warning)">' + formatCurrency(lead.mcaBalance) + '</div>' +
      '<div class="financial-card-sub">Outstanding position</div></div>' +
      '<div class="financial-card" style="border-color:var(--accent-warning-light)">' +
      '<div class="financial-card-label">MCA Withdrawal</div>' +
      '<div class="financial-card-value" style="color:var(--accent-warning)">' + formatCurrency(lead.mcaWithdrawals) + '/mo</div>' +
      '<div class="financial-card-sub">Recurring deduction</div></div>'
    ) : '';

    var maxDeposit = Math.max.apply(null, lead.deposits.map(function (d) { return d.deposits; }).concat([1]));
    var bars = lead.deposits.map(function (d) {
      return '<div class="bar-chart-item"><div class="bar-chart-bar" style="height:' + ((d.deposits / maxDeposit) * 100) + 'px" title="' + d.month + ': ' + formatCurrency(d.deposits) + '"></div>' +
        '<span class="bar-chart-label">' + d.month + '</span></div>';
    }).join('');

    var bank = lead.bank;
    var bankAccountBlock = '<div class="bank-account">' +
      '<div class="bank-account-title">Bank Account</div>' +
      '<div class="bank-account-row"><span class="bank-account-label">Bank</span><span class="bank-account-value">' + escapeHtml(bank.name) + '</span></div>' +
      '<div class="bank-account-row"><span class="bank-account-label">Account</span><span class="bank-account-value">' + bank.accountMasked + '</span></div>' +
      '<div class="bank-account-row"><span class="bank-account-label">Routing</span><span class="bank-account-value">' + bank.routing + '</span></div>' +
      '<div class="bank-account-row"><span class="bank-account-label">Type</span><span class="bank-account-value">' + bank.type + '</span></div>' +
      '<div class="bank-account-row"><span class="bank-account-label">Avg Daily Balance</span><span class="bank-account-value">' + formatCurrency(bank.avgDailyBalance) + '</span></div>' +
      '<div class="bank-account-row"><span class="bank-account-label">Current Balance</span><span class="bank-account-value">' + formatCurrency(bank.currentBalance) + '</span></div>' +
      '</div>';

    var approvalLine = '<p><strong>Approval:</strong> Approved for ' + formatCurrency(lead.approvedAmount) +
      ' against a ' + formatCurrency(lead.requestedAmount) + ' request, based on ' + formatCurrency(lead.monthlyDeposits) +
      ' in average monthly deposits and a ' + formatCurrency(bank.currentBalance) + ' current balance.</p>';

    var mcaConcern = lead.hasMCA ? (
      '<p><strong>Cash Flow Concern:</strong> The existing MCA position of ' + formatCurrency(lead.mcaBalance) +
      ' with monthly withdrawals of ' + formatCurrency(lead.mcaWithdrawals) + ' is consuming approximately ' +
      Math.round((lead.mcaWithdrawals / lead.monthlyDeposits) * 100) +
      '% of monthly deposits. This recurring obligation may be restricting operational flexibility and limiting access to additional capital.</p>'
    ) : '';

    return '<div>' +
      '<div class="financial-grid">' +
      '<div class="financial-card"><div class="financial-card-label">Annual Revenue</div><div class="financial-card-value">' + formatCurrency(lead.revenue) + '</div><div class="financial-card-sub">Stated on application</div></div>' +
      '<div class="financial-card"><div class="financial-card-label">Monthly Deposits</div><div class="financial-card-value">' + formatCurrency(lead.monthlyDeposits) + '</div><div class="financial-card-sub">Avg. last 12 months</div></div>' +
      '<div class="financial-card"><div class="financial-card-label">Ending Balance</div><div class="financial-card-value">' + formatCurrency(lead.endingBalance) + '</div><div class="financial-card-sub">Most recent statement</div></div>' +
      '<div class="financial-card"><div class="financial-card-label">Years in Business</div><div class="financial-card-value">' + lead.yearsInBusiness + '</div><div class="financial-card-sub">Established business</div></div>' +
      mcaCards +
      '</div>' +
      bankAccountBlock +
      '<div style="background:var(--bg-secondary);border:1px solid var(--border-subtle);border-radius:var(--radius-lg);padding:16px;margin-bottom:16px">' +
      '<div style="font-size:12px;font-weight:600;margin-bottom:12px;color:var(--text-primary)">Monthly Deposit Trend</div>' +
      '<div class="bar-chart">' + bars + '</div></div>' +
      '<div class="ai-pitch"><div class="ai-pitch-header">' + icon({ size: 16 }) + '<span>AI Funding Analysis</span></div>' +
      '<div class="ai-pitch-content">' +
      '<p><strong>Financial Snapshot:</strong> ' + escapeHtml(lead.company) + ' shows ' + lead.yearsInBusiness +
      '+ years of operation with ' + formatCurrency(lead.revenue) + ' in annual revenue. Monthly deposits average ' +
      formatCurrency(lead.monthlyDeposits) + ' with a current ending balance of ' + formatCurrency(lead.endingBalance) + '.</p>' +
      approvalLine +
      mcaConcern +
      '<p><strong>Revolving Line Opportunity:</strong> A revolving line of credit would provide ' + escapeHtml(lead.company) +
      ' with on-demand access to working capital without the rigid daily/weekly repayment structure of an MCA. This preserves cash flow during slower periods and allows the business to draw only what is needed, when it is needed.</p>' +
      '<p><strong>Talking Points:</strong><br>' +
      '&bull; ' + lead.yearsInBusiness + '+ year track record demonstrates stability<br>' +
      '&bull; Consistent deposit history of ' + formatCurrency(lead.monthlyDeposits) + '/month<br>' +
      '&bull; ' + (lead.hasMCA ? 'Consolidating the existing MCA into a flexible line eliminates rigid payment schedules' : 'Clean position with no existing MCA obligations') + '<br>' +
      '&bull; Revolving access means capital is available for payroll, inventory, or growth without reapplying</p>' +
      '</div></div></div>';
  }

  function renderNotesTab(lead) {
    var notes = lead.notes ? lead.notes.split('\n').filter(function (n) { return n.trim(); }) : [];
    var body = notes.length
      ? notes.map(function (n, i) { return '<div class="note-item"><div class="note-text">' + escapeHtml(n) + '</div><div class="note-meta">Note #' + (i + 1) + '</div></div>'; }).join('')
      : '<div class="empty-state">' + icon({ size: 32 }) + '<p>No notes yet</p></div>';
    return '<div><div class="notes-area">' + body + '</div>' +
      '<button type="button" class="btn btn-secondary" style="margin-top:12px;width:100%" data-action="open-modal" data-modal-type="note">' + icon({ size: 14 }) + ' Add Note</button></div>';
  }

  function renderFollowupTab(lead) {
    if (lead.followUp) {
      return '<div><div class="follow-up-card">' + icon({ size: 16 }) +
        '<div><div style="font-size:12px;font-weight:600;color:var(--text-primary)">' + escapeHtml(lead.followUp.action) + '</div>' +
        '<div style="font-size:11px;color:var(--text-muted);margin-top:2px">Due: ' + new Date(lead.followUp.date).toLocaleDateString() + '</div></div>' +
        '<button type="button" class="btn btn-ghost btn-sm" style="margin-left:auto" data-action="open-modal" data-modal-type="followup">' + icon({ size: 12 }) + ' Edit</button>' +
        '</div></div>';
    }
    return '<div><div class="empty-state">' + icon({ size: 32 }) + '<p>No follow-up scheduled</p>' +
      '<button type="button" class="btn btn-secondary btn-sm" data-action="open-modal" data-modal-type="followup">' + icon({ size: 12 }) + ' Schedule Follow-up</button></div></div>';
  }

  function render(container, state, handlers) {
    if (!container) return;
    var lead = state.lead;
    var html = '';
    if (state.activeTab === 'activity') html = renderActivityTab(lead, state);
    else if (state.activeTab === 'documents') html = renderDocumentsTab(lead);
    else if (state.activeTab === 'financial') html = renderFinancialTab(lead);
    else if (state.activeTab === 'notes') html = renderNotesTab(lead);
    else if (state.activeTab === 'followup') html = renderFollowupTab(lead);
    container.innerHTML = html;

    if (container.__mockBound) return;
    container.__mockBound = true;
    container.addEventListener('click', function (e) {
      var el = e.target.closest('[data-action]');
      if (!el) return;
      var action = el.getAttribute('data-action');
      if (action === 'open-doc') handlers.onOpenDoc(el.getAttribute('data-doc-id'));
      else if (action === 'open-modal') handlers.onShowModal(el.getAttribute('data-modal-type'));
    });
  }

  window.LeadsMock = window.LeadsMock || {};
  window.LeadsMock.tabs = { render: render };
})();
