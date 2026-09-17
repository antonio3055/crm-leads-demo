/* Leads mock prototype: wiring. Owns the single central state object and
   the master render() that fans out to each panel module. Plain DOM, no
   framework — mirrors the original's full-re-render style, except for the
   two spots (search box, modal fields) where a naive full rebuild would
   destroy an input mid-keystroke; those modules patch themselves instead. */
(function () {
  'use strict';

  var icon = function (opts) { return window.LeadsMock.icons.svg(opts); };
  var data = window.LeadsMock.data;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var NAV_ITEMS = [
    { id: 'leads', label: 'Leads' },
    { id: 'messages', label: 'Messages', badge: true },
    { id: 'email', label: 'Email', badge: true },
    { id: 'scanner', label: 'Scanner' },
    { id: 'command', label: 'Command' },
  ];

  var state = {
    activePage: 'leads',
    leads: data.leads,
    selectedLeadId: data.leads[0] ? data.leads[0].id : null,
    searchQuery: '',
    filters: { status: '', rep: '', priority: '' },
    sortBy: 'updatedAt',
    sortDir: 'desc',
    showFilters: false,
    showSortMenu: false,
    activeTab: 'activity',
    modal: null,
    docViewer: null,
    incomingCall: null,
    notification: null,
    reps: data.reps,
    statusOptions: data.statusOptions,
    getStatusById: data.getStatusById,
    researchDestinations: data.researchDestinations,
  };

  function findLead(id) {
    for (var i = 0; i < state.leads.length; i++) if (state.leads[i].id === id) return state.leads[i];
    return null;
  }
  function selectedLead() { return findLead(state.selectedLeadId); }

  function updateLead(id, updates) {
    var lead = findLead(id);
    if (!lead) return;
    Object.assign(lead, updates, { updatedAt: new Date() });
  }

  function addActivity(leadId, activity) {
    var lead = findLead(leadId);
    if (!lead) return;
    var rep = window.LeadsMock.list.repFor(state.reps, lead.assignedTo);
    lead.activities.unshift(Object.assign({
      id: 'a-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      timestamp: new Date(),
      actor: rep.name,
      actorId: rep.id,
    }, activity));
  }

  function autoAdvanceIfNew(leadId) {
    var lead = findLead(leadId);
    if (lead && lead.status === 'new') {
      var oldStatus = state.getStatusById('new');
      updateLead(leadId, { status: 'attempted' });
      addActivity(leadId, { type: 'status', title: 'Status updated', description: oldStatus.label + ' → Attempted (auto)' });
    }
  }

  // ---- render ----
  var els = {};

  function renderSidebar() {
    var html = NAV_ITEMS.map(function (item) {
      return '<div class="sidebar-item' + (state.activePage === item.id ? ' active' : '') + '" data-action="nav" data-page-id="' + item.id + '">' +
        icon({ strokeWidth: 1.8 }) +
        '<span class="sidebar-item-label">' + item.label + '</span>' +
        (item.badge ? '<span class="sidebar-badge"></span>' : '') +
        '</div>';
    }).join('');
    els.sidebarNav.innerHTML = html;
  }

  function renderMain() {
    var isLeads = state.activePage === 'leads';
    els.leadsPage.style.display = isLeads ? 'flex' : 'none';
    els.otherPage.style.display = isLeads ? 'none' : 'flex';

    if (isLeads) {
      window.LeadsMock.list.render(els.leadsListPanel, {
        leads: state.leads, selectedLeadId: state.selectedLeadId, searchQuery: state.searchQuery,
        filters: state.filters, sortBy: state.sortBy, sortDir: state.sortDir,
        showFilters: state.showFilters, showSortMenu: state.showSortMenu,
        reps: state.reps, statusOptions: state.statusOptions, getStatusById: state.getStatusById,
      }, {
        onSearch: function (v) { state.searchQuery = v; render(); },
        onToggleFilters: function () { state.showFilters = !state.showFilters; state.showSortMenu = false; render(); },
        onFilters: function (patch, clear) { state.filters = clear ? patch : Object.assign({}, state.filters, patch); render(); },
        onToggleSortMenu: function () { state.showSortMenu = !state.showSortMenu; state.showFilters = false; render(); },
        onSort: function (id) { state.sortBy = id; state.sortDir = state.sortDir === 'desc' ? 'asc' : 'desc'; state.showSortMenu = false; render(); },
        onSelectLead: function (id) { state.selectedLeadId = id; state.activeTab = 'activity'; render(); },
        onToggleFavorite: function (id) { updateLead(id, { favorite: !findLead(id).favorite }); render(); },
        onCloseMenus: function () { if (state.showFilters || state.showSortMenu) { state.showFilters = false; state.showSortMenu = false; render(); } },
      });

      var lead = selectedLead();
      var tabContentEl = window.LeadsMock.detail.render(els.leadDetailSlot, {
        lead: lead, reps: state.reps, getStatusById: state.getStatusById, researchDestinations: state.researchDestinations, activeTab: state.activeTab,
      }, {
        onToggleFavorite: function () { updateLead(lead.id, { favorite: !lead.favorite }); render(); },
        onShowModal: function (type) { state.modal = { type: type }; render(); },
        onSetActiveTab: function (id) { state.activeTab = id; render(); },
      });

      if (tabContentEl && lead) {
        window.LeadsMock.tabs.render(tabContentEl, { lead: lead, activeTab: state.activeTab, reps: state.reps }, {
          onOpenDoc: function (docId) {
            var doc = lead.documents.filter(function (d) { return d.id === docId; })[0];
            if (doc) { state.docViewer = { doc: doc, lead: lead }; render(); }
          },
          onShowModal: function (type) { state.modal = { type: type }; render(); },
        });
      }
    } else {
      var page = window.LeadsMock.staticPages[state.activePage];
      if (page) page.render(els.otherPage);
    }
  }

  function renderNotification() {
    if (!state.notification) { els.notificationRoot.innerHTML = ''; return; }
    var n = state.notification;
    els.notificationRoot.innerHTML = '' +
      '<div class="incoming-notification ' + n.type + '">' +
      '<div class="incoming-pulse ' + n.type + '">' + icon({ size: 16 }) + '</div>' +
      '<div class="incoming-info"><div class="incoming-title">' + escapeHtml(n.title) + '</div>' +
      '<div class="incoming-desc">' + escapeHtml(n.desc) + '</div></div>' +
      '<div class="incoming-actions">' +
      '<button type="button" class="btn btn-primary btn-sm" data-action="answer-call">' + icon({ size: 12 }) + ' Answer</button>' +
      '<button type="button" class="btn btn-secondary btn-sm" data-action="decline-call">Decline</button>' +
      '</div></div>';
  }

  function renderDocViewer() {
    if (!state.docViewer) { els.docViewerRoot.innerHTML = ''; return; }
    var doc = state.docViewer.doc, lead = state.docViewer.lead;
    els.docViewerRoot.innerHTML = '' +
      '<div class="doc-viewer-overlay" data-action="close-doc-viewer">' +
      '<div class="doc-viewer" data-stop-close>' +
      '<div class="doc-viewer-header"><div class="doc-viewer-title">' + icon({ size: 16, color: 'var(--accent-danger)' }) +
      ' ' + escapeHtml(doc.label) + '<span style="margin-left:8px;font-size:11px;color:var(--text-muted);font-weight:400">' + escapeHtml(lead.company) + '</span></div>' +
      '<div class="doc-viewer-toolbar">' +
      '<button type="button" class="btn-icon">' + icon({ size: 16 }) + '</button>' +
      '<button type="button" class="btn-icon">' + icon({ size: 16 }) + '</button>' +
      '<button type="button" class="btn-icon">' + icon({ size: 16 }) + '</button>' +
      '<button type="button" class="btn-icon" data-action="close-doc-viewer">' + icon({ size: 16 }) + '</button>' +
      '</div></div>' +
      '<div class="doc-viewer-body"><div class="doc-viewer-page">' +
      '<div style="text-align:center;margin-bottom:32px"><h2 style="font-size:18px;font-weight:700;margin-bottom:4px">' + escapeHtml(doc.label) + '</h2>' +
      '<p style="font-size:11px;color:var(--text-muted)">' + escapeHtml(lead.company) + ' — ' + escapeHtml(lead.contact.name) + '</p></div>' +
      '<div style="border-top:2px solid var(--text-primary);padding-top:20px;margin-bottom:20px">' +
      '<p style="margin-bottom:12px"><strong>Document Type:</strong> ' + doc.type.toUpperCase() + '</p>' +
      '<p style="margin-bottom:12px"><strong>File Size:</strong> ' + doc.size + '</p>' +
      '<p style="margin-bottom:12px"><strong>Date:</strong> ' + new Date(doc.date).toLocaleDateString() + '</p>' +
      '<p style="margin-bottom:12px"><strong>Company:</strong> ' + escapeHtml(lead.company) + '</p>' +
      '<p style="margin-bottom:12px"><strong>EIN:</strong> ' + escapeHtml(lead.ein) + '</p>' +
      '<p style="margin-bottom:12px"><strong>Industry:</strong> ' + escapeHtml(lead.industry) + '</p></div>' +
      '<div style="background:var(--bg-subtle);padding:16px;border-radius:8px;margin-bottom:20px">' +
      '<p style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;color:var(--text-muted)">Document Preview</p>' +
      '<p style="color:var(--text-secondary);line-height:1.8">This is a mock document preview for the ' + escapeHtml(doc.label) +
      ' associated with ' + escapeHtml(lead.company) + '. In a production environment, this would render the actual PDF or image content using a document viewer library.</p></div>' +
      '<div style="display:flex;gap:8px;justify-content:center">' +
      '<button type="button" class="btn btn-secondary btn-sm">' + icon({ size: 12 }) + ' Download</button>' +
      '<button type="button" class="btn btn-secondary btn-sm">' + icon({ size: 12 }) + ' Share</button>' +
      '<button type="button" class="btn btn-secondary btn-sm">' + icon({ size: 12 }) + ' Print</button>' +
      '</div></div></div>' +
      '<div class="doc-viewer-nav">' +
      '<button type="button" class="btn btn-ghost btn-sm">' + icon({ size: 14 }) + ' Previous</button>' +
      '<span style="font-size:11px;color:var(--text-muted)">1 of ' + lead.documents.length + '</span>' +
      '<button type="button" class="btn btn-ghost btn-sm">Next ' + icon({ size: 14 }) + '</button>' +
      '</div></div>';
  }

  function renderModal() {
    els.modalOverlay.style.display = state.modal ? 'flex' : 'none';
    var lead = selectedLead();
    window.LeadsMock.modals.render(els.modalRoot, {
      modal: state.modal, lead: lead, reps: state.reps, statusOptions: state.statusOptions,
    }, {
      onClose: function () { state.modal = null; render(); },
      onAddNote: function (text) {
        addActivity(lead.id, { type: 'note', title: 'Note added', description: text });
        updateLead(lead.id, { notes: (lead.notes ? lead.notes + '\n' : '') + text });
        state.modal = null; render();
      },
      onSendSms: function (text, isWhatsapp) {
        addActivity(lead.id, { type: isWhatsapp ? 'whatsapp' : 'sms', title: isWhatsapp ? 'WhatsApp message sent' : 'SMS sent', description: text });
        autoAdvanceIfNew(lead.id);
        state.modal = null; render();
      },
      onSendEmail: function (d) {
        addActivity(lead.id, { type: 'email', title: 'Email sent', description: 'Subject: ' + (d.subject || 'No subject') });
        autoAdvanceIfNew(lead.id);
        state.modal = null; render();
      },
      onSetFollowUp: function (d) {
        updateLead(lead.id, { followUp: { date: d.date ? new Date(d.date) : new Date(), action: d.action } });
        addActivity(lead.id, { type: 'followup', title: 'Follow-up scheduled', description: d.action });
        state.modal = null; render();
      },
      onStatusChange: function (newStatusId) {
        var oldStatus = state.getStatusById(lead.status), newStatus = state.getStatusById(newStatusId);
        updateLead(lead.id, { status: newStatusId });
        addActivity(lead.id, { type: 'status', title: 'Status updated', description: oldStatus.label + ' → ' + newStatus.label });
        state.modal = null; render();
      },
      onAssign: function (repId) {
        var rep = state.reps.filter(function (r) { return r.id === repId; })[0];
        updateLead(lead.id, { assignedTo: repId });
        addActivity(lead.id, { type: 'assignment', title: 'Lead reassigned', description: 'Assigned to ' + rep.name });
        state.modal = null; render();
      },
      onCall: function (phone) {
        addActivity(lead.id, { type: 'call', title: 'Outbound call', description: 'Called ' + phone.number + ' (' + phone.type + ')', duration: '0:45' });
        autoAdvanceIfNew(lead.id);
        state.modal = null; render();
      },
    });
  }

  function render() {
    renderSidebar();
    renderMain();
    renderNotification();
    renderDocViewer();
    renderModal();
  }

  function bindOnce() {
    els.sidebarNav.addEventListener('click', function (e) {
      var el = e.target.closest('[data-action="nav"]');
      if (el) { state.activePage = el.getAttribute('data-page-id'); render(); }
    });
    els.notificationRoot.addEventListener('click', function (e) {
      var el = e.target.closest('[data-action]');
      if (!el) return;
      if (el.getAttribute('data-action') === 'answer-call') {
        var n = state.notification;
        if (n && n.leadId) {
          state.selectedLeadId = n.leadId;
          state.activePage = 'leads';
          addActivity(n.leadId, { type: 'call', title: 'Inbound call — Answered', description: 'Call answered from lead detail panel', duration: '0:00' });
        }
        state.notification = null; state.incomingCall = null; render();
      } else if (el.getAttribute('data-action') === 'decline-call') {
        state.notification = null; state.incomingCall = null; render();
      }
    });
    els.docViewerRoot.addEventListener('click', function (e) {
      if (e.target.closest('[data-stop-close]') && !e.target.closest('[data-action="close-doc-viewer"]')) return;
      if (e.target.closest('[data-action="close-doc-viewer"]') || e.target.hasAttribute('data-action')) {
        state.docViewer = null; render();
      }
    });
    els.modalOverlay.addEventListener('click', function (e) {
      if (e.target === els.modalOverlay) { state.modal = null; render(); }
    });
  }

  function mockIncomingCall() {
    setTimeout(function () {
      var lead = state.leads[3];
      if (!lead) return;
      state.incomingCall = { type: 'call', lead: lead, number: lead.phones[0].number };
      state.notification = { type: 'call', title: 'Incoming Call', desc: lead.contact.name + ' — ' + lead.company, leadId: lead.id };
      render();
    }, 8000);
  }

  function init() {
    els.sidebarNav = document.getElementById('sidebar-nav');
    els.leadsPage = document.getElementById('leads-page');
    els.leadsListPanel = document.getElementById('leads-list-panel');
    els.leadDetailSlot = document.getElementById('lead-detail-slot');
    els.otherPage = document.getElementById('other-page');
    els.notificationRoot = document.getElementById('notification-root');
    els.docViewerRoot = document.getElementById('docviewer-root');
    els.modalOverlay = document.getElementById('modal-overlay');
    els.modalRoot = document.getElementById('modal-root');
    bindOnce();
    render();
    mockIncomingCall();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.LeadsMock = window.LeadsMock || {};
  window.LeadsMock.app = { getState: function () { return state; }, render: render };
})();
