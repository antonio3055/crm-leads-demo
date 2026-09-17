/* Leads mock prototype: middle panel (header, contact info, owner info,
   quick actions). Renders a .record-body container that record.js fills
   with the single-page record body. Plain DOM, no framework. */
(function () {
  'use strict';

  var icon = function (opts) { return window.LeadsMock.icons.svg(opts); };

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function initials(name) {
    return name.split(' ').map(function (n) { return n[0]; }).join('').slice(0, 2);
  }

  function repFor(reps, id) {
    for (var i = 0; i < reps.length; i++) if (reps[i].id === id) return reps[i];
    return reps[0];
  }

  function formatDob(d) {
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function render(container, state, handlers) {
    var lead = state.lead;
    if (!lead) {
      container.innerHTML = '<div class="placeholder-page">' + icon({ size: 48 }) +
        '<h2>Select a lead</h2><p>Choose a lead from the list to view details</p></div>';
      return null;
    }

    var rep = repFor(state.reps, lead.assignedTo);
    var status = state.getStatusById(lead.status);
    var favColor = lead.favorite ? 'var(--accent-warning)' : 'var(--text-muted)';
    var favFill = lead.favorite ? 'var(--accent-warning)' : 'none';

    var infoItems = [];
    var phone0 = lead.phones[0];
    infoItems.push('<div class="lead-detail-info-item">' + icon({ size: 14 }) +
      '<span>' + escapeHtml(phone0 ? phone0.number : '') + '</span>' +
      '<button type="button" class="btn-icon btn-xs" style="width:20px;height:20px" data-action="open-modal" data-modal-type="call">' + icon({ size: 12 }) + '</button></div>');
    if (lead.phones[1]) {
      infoItems.push('<div class="lead-detail-info-item">' + icon({ size: 14 }) +
        '<span>' + escapeHtml(lead.phones[1].number) + '</span>' +
        '<span style="font-size:10px;color:var(--text-muted)">(' + escapeHtml(lead.phones[1].type) + ')</span></div>');
    }
    var email0 = lead.emails[0];
    infoItems.push('<div class="lead-detail-info-item">' + icon({ size: 14 }) +
      '<span>' + escapeHtml(email0 ? email0.address : '') + '</span>' +
      '<button type="button" class="btn-icon btn-xs" style="width:20px;height:20px" data-action="open-modal" data-modal-type="email">' + icon({ size: 12 }) + '</button></div>');
    infoItems.push('<div class="lead-detail-info-item">' + icon({ size: 14 }) +
      '<span style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escapeHtml(lead.address) + '</span></div>');
    infoItems.push('<div class="lead-detail-info-item">' + icon({ size: 14 }) +
      '<span>' + lead.yearsInBusiness + ' yrs &middot; ' + lead.employees + ' employees</span></div>');
    infoItems.push('<div class="lead-detail-info-item">' + icon({ size: 14 }) + '<span>EIN: ' + escapeHtml(lead.ein) + '</span></div>');

    var researchBtns = state.researchDestinations.map(function (rd) {
      return '<button type="button" class="research-btn" data-action="research" data-url="' + escapeHtml(rd.url) + '">' +
        icon({ size: 10, className: 'research-icon' }) + escapeHtml(rd.name) + '</button>';
    }).join('');

    var followUpBadge = lead.followUp
      ? '<span class="status-badge" style="background:var(--accent-warning-ghost);color:var(--accent-warning)">' + icon({ size: 10 }) + ' Follow-up</span>'
      : '';

    var owner = lead.owner;
    var ownerItems = [
      '<div class="lead-detail-info-item">' + icon({ size: 14 }) + '<span>SSN: ' + owner.ssn + '</span></div>',
      '<div class="lead-detail-info-item">' + icon({ size: 14 }) + '<span>DOB: ' + formatDob(owner.dob) + '</span></div>',
      '<div class="lead-detail-info-item">' + icon({ size: 14 }) + '<span>' + escapeHtml(owner.homeAddress) + '</span></div>',
    ].join('');

    container.innerHTML = '' +
      '<div class="lead-detail-header">' +
      '<div class="lead-detail-header-top">' +
      '<div class="lead-detail-title">' +
      '<div class="avatar avatar-lg" style="background:' + rep.color + '">' + initials(lead.contact.name) + '</div>' +
      '<div><div class="lead-detail-name">' + escapeHtml(lead.company) + '</div>' +
      '<div class="lead-detail-sub">' + escapeHtml(lead.contact.name) + ' &middot; ' + escapeHtml(lead.contact.title) + ' &middot; ' + escapeHtml(lead.industry) + '</div>' +
      '</div></div>' +
      '<div class="lead-detail-actions">' +
      '<button type="button" class="btn-icon" style="opacity:' + (lead.favorite ? 1 : 0.4) + '" data-action="toggle-favorite">' +
      icon({ size: 16, color: favColor }).replace('fill="none"', 'fill="' + favFill + '"') + '</button>' +
      '<button type="button" class="btn-icon" data-action="open-modal" data-modal-type="assign">' + icon({ size: 16 }) + '</button>' +
      '<button type="button" class="btn-icon" data-action="open-modal" data-modal-type="status">' + icon({ size: 16 }) + '</button>' +
      '<button type="button" class="btn-icon" data-action="more">' + icon({ size: 16 }) + '</button>' +
      '</div></div>' +
      '<div class="lead-detail-info-row">' + infoItems.join('') + '</div>' +
      '<div class="lead-detail-info-row">' +
      '<span class="lead-detail-row-label">Owner Info:</span>' + ownerItems +
      '</div>' +
      '<div class="research-bar"><span class="lead-detail-row-label">Research:</span>' + researchBtns + '</div>' +
      '</div>' +
      '<div class="quick-actions">' +
      '<button type="button" class="quick-action-btn" data-action="open-modal" data-modal-type="call">' + icon({ size: 14 }) + ' Call</button>' +
      '<button type="button" class="quick-action-btn" data-action="open-modal" data-modal-type="sms">' + icon({ size: 14 }) + ' SMS</button>' +
      '<button type="button" class="quick-action-btn" data-action="open-modal" data-modal-type="whatsapp">' + icon({ size: 14 }) + ' WhatsApp</button>' +
      '<button type="button" class="quick-action-btn" data-action="open-modal" data-modal-type="email">' + icon({ size: 14 }) + ' Email</button>' +
      '<button type="button" class="quick-action-btn" data-action="open-modal" data-modal-type="note">' + icon({ size: 14 }) + ' Note</button>' +
      '<button type="button" class="quick-action-btn" data-action="open-modal" data-modal-type="followup">' + icon({ size: 14 }) + ' Follow-up</button>' +
      '<div style="margin-left:auto;display:flex;gap:6px">' +
      '<span class="status-badge" style="background:' + status.bg + ';color:' + status.color + '">' + status.label + '</span>' +
      followUpBadge +
      '</div></div>' +
      '<div class="record-body"></div>';

    if (!container.__mockBound) {
      container.__mockBound = true;
      container.addEventListener('click', function (e) {
        var el = e.target.closest('[data-action]');
        if (!el) return;
        var action = el.getAttribute('data-action');
        if (action === 'toggle-favorite') handlers.onToggleFavorite();
        else if (action === 'open-modal') handlers.onShowModal(el.getAttribute('data-modal-type'));
        else if (action === 'research') window.open(el.getAttribute('data-url') + encodeURIComponent(lead.company), '_blank');
      });
    }

    return container.querySelector('.record-body');
  }

  window.LeadsMock = window.LeadsMock || {};
  window.LeadsMock.detail = { render: render };
})();
