/* Leads mock prototype: action modals (note/sms/email/whatsapp/followup/status/assign/call).
   `container` is a single stable root that always exists in the page (never
   destroyed): innerHTML is only rebuilt when the open modal's type changes,
   so a re-render triggered by unrelated state never wipes an in-progress
   textarea (and never steals focus while the user is mid-keystroke). Event
   listeners are bound exactly once via delegation and always read the live
   `state` object at click time, so there is never more than one listener
   and it can never see stale data. */
(function () {
  'use strict';

  var icon = function (opts) { return window.LeadsMock.icons.svg(opts); };

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function header(title) {
    return '<div class="modal-header"><span class="modal-title">' + title + '</span>' +
      '<button type="button" class="btn-icon" data-action="close">' + icon({ size: 16 }) + '</button></div>';
  }
  function footer(submitLabel, submitAction, withIcon) {
    return '<div class="modal-footer">' +
      '<button type="button" class="btn btn-ghost" data-action="close">Cancel</button>' +
      '<button type="button" class="btn btn-primary" data-action="' + submitAction + '">' + (withIcon ? icon({ size: 12 }) : '') + ' ' + submitLabel + '</button>' +
      '</div>';
  }

  function buildNote() {
    return header('Add Note') +
      '<div class="modal-body"><div class="form-group"><label class="form-label">Note</label>' +
      '<textarea class="form-textarea" data-field="note-text" placeholder="Enter your note..." autofocus></textarea></div></div>' +
      footer('Save Note', 'submit-note');
  }
  function buildSms(lead, whatsapp) {
    var phone = (lead.phones[0] || {}).number || '';
    return header(whatsapp ? 'WhatsApp Message' : 'Send SMS') +
      '<div class="modal-body"><div class="form-group"><label class="form-label">To</label>' +
      '<input class="form-input" value="' + escapeHtml(phone) + '" readonly></div>' +
      '<div class="form-group"><label class="form-label">Message</label>' +
      '<textarea class="form-textarea" rows="4" data-field="sms-text" placeholder="Type your message..." autofocus></textarea></div></div>' +
      footer(whatsapp ? 'Send' : 'Send SMS', 'submit-sms', true);
  }
  function buildEmail(lead) {
    var email = (lead.emails[0] || {}).address || '';
    return header('Send Email') +
      '<div class="modal-body"><div class="form-group"><label class="form-label">To</label>' +
      '<input class="form-input" value="' + escapeHtml(email) + '" readonly></div>' +
      '<div class="form-group"><label class="form-label">Subject</label>' +
      '<input class="form-input" data-field="email-subject" placeholder="Email subject..."></div>' +
      '<div class="form-group"><label class="form-label">Message</label>' +
      '<textarea class="form-textarea" rows="6" data-field="email-body" placeholder="Type your email..." autofocus></textarea></div></div>' +
      footer('Send Email', 'submit-email', true);
  }
  function buildFollowup() {
    return header('Schedule Follow-up') +
      '<div class="modal-body"><div class="form-group"><label class="form-label">Date</label>' +
      '<input type="date" class="form-input" data-field="followup-date"></div>' +
      '<div class="form-group"><label class="form-label">Action</label>' +
      '<input class="form-input" data-field="followup-action" placeholder="e.g. Call back to discuss terms" autofocus></div></div>' +
      footer('Schedule', 'submit-followup', true);
  }
  function buildStatus(lead, statusOptions) {
    var rows = statusOptions.map(function (s) {
      var active = lead.status === s.id;
      return '<button type="button" class="btn btn-ghost" style="justify-content:flex-start;background:' +
        (active ? s.bg : 'transparent') + ';color:' + (active ? s.color : 'var(--text-secondary)') + '" data-action="pick-status" data-status-id="' + s.id + '">' +
        '<span style="width:8px;height:8px;border-radius:50%;background:' + s.color + ';margin-right:8px;flex-shrink:0"></span>' +
        s.label + (active ? '<span style="margin-left:auto">' + icon({ size: 14 }) + '</span>' : '') + '</button>';
    }).join('');
    return header('Update Status') + '<div class="modal-body"><div style="display:flex;flex-direction:column;gap:6px">' + rows + '</div></div>';
  }
  function buildAssign(lead, reps) {
    var rows = reps.filter(function (r) { return r.active; }).map(function (r) {
      var active = lead.assignedTo === r.id;
      return '<button type="button" class="btn btn-ghost" style="justify-content:flex-start;background:' + (active ? 'var(--bg-hover)' : 'transparent') + '" data-action="pick-rep" data-rep-id="' + r.id + '">' +
        '<span class="avatar avatar-sm" style="background:' + r.color + ';margin-right:8px">' + r.initials + '</span>' + r.name +
        '<span style="margin-left:auto;font-size:10px;color:var(--text-muted)">' + r.role + '</span>' +
        (active ? '<span style="margin-left:8px">' + icon({ size: 14 }) + '</span>' : '') + '</button>';
    }).join('');
    return header('Assign Lead') + '<div class="modal-body"><div style="display:flex;flex-direction:column;gap:6px">' + rows + '</div></div>';
  }
  function buildCall(lead) {
    var buttons = lead.phones.map(function (p, i) {
      return '<button type="button" class="btn btn-primary" data-action="place-call" data-phone-index="' + i + '">' + icon({ size: 12 }) + ' ' + p.type + '</button>';
    }).join('');
    return header('Call ' + escapeHtml(lead.contact.name)) +
      '<div class="modal-body" style="text-align:center;padding:24px 20px">' +
      '<div style="width:64px;height:64px;border-radius:50%;background:var(--accent-success-light);display:flex;align-items:center;justify-content:center;margin:0 auto 16px">' +
      icon({ size: 28, color: 'var(--accent-success)' }) + '</div>' +
      '<p style="font-size:14px;font-weight:600;margin-bottom:4px">' + escapeHtml((lead.phones[0] || {}).number || '') + '</p>' +
      '<p style="font-size:11px;color:var(--text-muted)">' + escapeHtml(lead.company) + '</p>' +
      '<div style="margin-top:20px;display:flex;gap:8px;justify-content:center">' + buttons + '</div></div>';
  }

  function render(container, state, handlers) {
    // Stored on every call (not gated by the bind-once guard below) so the
    // delegated listener -- bound only once -- always sees the latest data
    // instead of the state/handlers object captured on its first render.
    container.__latestState = state;
    container.__latestHandlers = handlers;

    var modal = state.modal;

    if (!modal || !state.lead) {
      container.innerHTML = '';
      container.__modalType = null;
    } else if (container.__modalType !== modal.type) {
      container.__modalType = modal.type;
      var lead = state.lead;
      if (modal.type === 'note') container.innerHTML = buildNote();
      else if (modal.type === 'sms') container.innerHTML = buildSms(lead, false);
      else if (modal.type === 'whatsapp') container.innerHTML = buildSms(lead, true);
      else if (modal.type === 'email') container.innerHTML = buildEmail(lead);
      else if (modal.type === 'followup') container.innerHTML = buildFollowup();
      else if (modal.type === 'status') container.innerHTML = buildStatus(lead, state.statusOptions);
      else if (modal.type === 'assign') container.innerHTML = buildAssign(lead, state.reps);
      else if (modal.type === 'call') container.innerHTML = buildCall(lead);
      else container.innerHTML = '';
    }
    // else: same modal type still open — leave the DOM untouched so any
    // in-progress typing and input focus survive this re-render.

    if (container.__mockBound) return;
    container.__mockBound = true;

    container.addEventListener('click', function (e) {
      var el = e.target.closest('[data-action]');
      if (!el) return;
      var curState = container.__latestState;
      var curHandlers = container.__latestHandlers;
      var curModal = curState.modal;
      var curLead = curState.lead;
      if (!curModal || !curLead) return;
      var action = el.getAttribute('data-action');
      var val = function (sel) { var f = container.querySelector(sel); return f ? f.value : ''; };

      if (action === 'close') curHandlers.onClose();
      else if (action === 'submit-note') { var n = val('[data-field="note-text"]'); if (n.trim()) curHandlers.onAddNote(n); }
      else if (action === 'submit-sms') { var s = val('[data-field="sms-text"]'); if (s.trim()) curHandlers.onSendSms(s, curModal.type === 'whatsapp'); }
      else if (action === 'submit-email') { var b = val('[data-field="email-body"]'); if (b.trim()) curHandlers.onSendEmail({ subject: val('[data-field="email-subject"]'), body: b }); }
      else if (action === 'submit-followup') { var a = val('[data-field="followup-action"]'); if (a.trim()) curHandlers.onSetFollowUp({ date: val('[data-field="followup-date"]'), action: a }); }
      else if (action === 'pick-status') curHandlers.onStatusChange(el.getAttribute('data-status-id'));
      else if (action === 'pick-rep') curHandlers.onAssign(el.getAttribute('data-rep-id'));
      else if (action === 'place-call') curHandlers.onCall(curLead.phones[Number(el.getAttribute('data-phone-index'))]);
    });
  }

  window.LeadsMock = window.LeadsMock || {};
  window.LeadsMock.modals = { render: render };
})();
