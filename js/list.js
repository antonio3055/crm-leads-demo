/* Leads mock prototype: left panel (search, filter, sort, lead cards).
   Plain DOM rendering + event delegation, no framework.

   The header chrome (search input, filter/sort buttons) is built exactly
   once and never replaced afterwards -- only the dynamic pieces (card
   list, count, filter panel, sort menu) are patched on each render call.
   Rebuilding the search <input> node on every keystroke would destroy it
   mid-type and drop focus after the first character; this was caught by
   an actual typing test, not just checking the filtered value. */
(function () {
  'use strict';

  var icon = function (opts) { return window.LeadsMock.icons.svg(opts); };

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function formatRelativeDate(d) {
    var date = new Date(d);
    var diff = new Date() - date;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    if (diff < 604800000) return Math.floor(diff / 86400000) + 'd ago';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Compact form for the lead-card row (1m/1h/1d/1w), distinct from
  // formatRelativeDate's "3h ago" style used in the activity timeline --
  // a list row wants density, a timeline entry wants readability.
  function formatCompactAge(d) {
    var diffMin = Math.max(1, Math.floor((new Date() - new Date(d)) / 60000));
    if (diffMin < 60) return diffMin + 'm';
    var diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return diffHr + 'h';
    var diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return diffDay + 'd';
    var diffWeek = Math.floor(diffDay / 7);
    if (diffWeek < 5) return diffWeek + 'w';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function formatCurrency(n) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  }

  function repFor(reps, id) {
    for (var i = 0; i < reps.length; i++) if (reps[i].id === id) return reps[i];
    return reps[0];
  }

  function filterAndSortLeads(state) {
    var q = (state.searchQuery || '').toLowerCase();
    var filtered = state.leads.filter(function (l) {
      var matchesSearch = !q ||
        l.company.toLowerCase().indexOf(q) !== -1 ||
        l.contact.name.toLowerCase().indexOf(q) !== -1 ||
        l.phones.some(function (p) { return p.number.indexOf(q) !== -1; }) ||
        l.emails.some(function (e) { return e.address.toLowerCase().indexOf(q) !== -1; });
      var matchesStatus = !state.filters.status || l.status === state.filters.status;
      var matchesRep = !state.filters.rep || l.assignedTo === state.filters.rep;
      var matchesPriority = !state.filters.priority || l.priority === state.filters.priority;
      return matchesSearch && matchesStatus && matchesRep && matchesPriority;
    });
    var dir = state.sortDir === 'asc' ? 1 : -1;
    filtered.sort(function (a, b) {
      if (state.sortBy === 'company') return dir * a.company.localeCompare(b.company);
      if (state.sortBy === 'contact') return dir * a.contact.name.localeCompare(b.contact.name);
      if (state.sortBy === 'status') return dir * a.status.localeCompare(b.status);
      if (state.sortBy === 'revenue') return dir * (a.revenue - b.revenue);
      return dir * (new Date(a.updatedAt) - new Date(b.updatedAt));
    });
    return filtered;
  }

  var SORT_OPTIONS = [
    { id: 'updatedAt', label: 'Last Updated' },
    { id: 'company', label: 'Company Name' },
    { id: 'contact', label: 'Contact Name' },
    { id: 'status', label: 'Status' },
    { id: 'revenue', label: 'Revenue' },
  ];

  function renderFilterPanel(state) {
    if (!state.showFilters) return '';
    var statusOpts = state.statusOptions.map(function (s) {
      return '<option value="' + s.id + '"' + (state.filters.status === s.id ? ' selected' : '') + '>' + s.label + '</option>';
    }).join('');
    var repOpts = state.reps.filter(function (r) { return r.active; }).map(function (r) {
      return '<option value="' + r.id + '"' + (state.filters.rep === r.id ? ' selected' : '') + '>' + r.name + '</option>';
    }).join('');
    var priority = state.filters.priority;
    return '' +
      '<div class="filter-panel">' +
      '<div class="filter-row">' +
      '<div style="flex:1"><label class="form-label">Status</label>' +
      '<select class="form-select" data-action="filter-status"><option value="">All Statuses</option>' + statusOpts + '</select></div>' +
      '<div style="flex:1"><label class="form-label">Rep</label>' +
      '<select class="form-select" data-action="filter-rep"><option value="">All Reps</option>' + repOpts + '</select></div>' +
      '</div>' +
      '<div class="filter-row">' +
      '<div style="flex:1"><label class="form-label">Priority</label>' +
      '<select class="form-select" data-action="filter-priority">' +
      '<option value="">All Priorities</option>' +
      '<option value="high"' + (priority === 'high' ? ' selected' : '') + '>High</option>' +
      '<option value="medium"' + (priority === 'medium' ? ' selected' : '') + '>Medium</option>' +
      '<option value="normal"' + (priority === 'normal' ? ' selected' : '') + '>Normal</option>' +
      '</select></div>' +
      '<div style="flex:1;display:flex;align-items:flex-end">' +
      '<button type="button" class="btn btn-ghost btn-sm" data-action="filter-clear">Clear All</button></div>' +
      '</div></div>';
  }

  function renderSortMenu(state) {
    if (!state.showSortMenu) return '';
    return '<div class="dropdown-menu" style="right:0;left:auto;min-width:160px">' +
      SORT_OPTIONS.map(function (s) {
        var active = state.sortBy === s.id;
        var chevron = state.sortDir === 'desc' ? '&#9662;' : '&#9652;';
        return '<div class="dropdown-item" data-action="sort-by" data-sort-id="' + s.id + '">' +
          (active ? icon({ size: 14 }) : '') + s.label +
          (active ? '<span style="margin-left:auto">' + chevron + '</span>' : '') + '</div>';
      }).join('') + '</div>';
  }

  function renderCard(lead, state) {
    var activeClass = state.selectedLeadId === lead.id ? ' active' : '';
    var favColor = lead.favorite ? 'var(--accent-warning)' : 'var(--text-muted)';
    var favFill = lead.favorite ? 'var(--accent-warning)' : 'none';
    return '' +
      '<div class="lead-card' + activeClass + '" data-action="select-lead" data-lead-id="' + lead.id + '">' +
      '<div class="lead-card-header">' +
      '<div class="lead-card-company">' + escapeHtml(lead.company) + '</div>' +
      '<div class="lead-card-header-right">' +
      '<span class="lead-card-revenue">' + formatCurrency(lead.revenue) + '</span>' +
      '<button type="button" class="btn-icon" style="opacity:' + (lead.favorite ? 1 : 0.3) + '" data-action="toggle-favorite" data-lead-id="' + lead.id + '">' +
      icon({ size: 14, color: favColor }).replace('fill="none"', 'fill="' + favFill + '"') +
      '</button>' +
      '</div>' +
      '</div>' +
      '<div class="lead-card-contact">' + escapeHtml(lead.contact.name) + '</div>' +
      '<div class="lead-card-meta">' +
      '<span class="priority-dot priority-' + lead.priority + '"></span>' +
      '<span style="font-size:10px;color:var(--text-muted);margin-left:auto">' + formatCompactAge(lead.updatedAt) + '</span>' +
      '</div></div>';
  }

  function buildChrome(container, handlers) {
    container.innerHTML = '' +
      '<div class="leads-list-header">' +
      '<div class="search-box">' + icon({ size: 14 }) +
      '<input type="text" data-field="search" placeholder="Search leads..."></div>' +
      '<div class="leads-list-toolbar">' +
      '<div style="position:relative" data-slot="filter-wrap">' +
      '<button type="button" class="btn-icon" data-action="toggle-filters"></button>' +
      '<div data-slot="filter-panel"></div>' +
      '</div>' +
      '<div style="position:relative" data-slot="sort-wrap">' +
      '<button type="button" class="btn-icon" data-action="toggle-sort-menu">' + icon({ size: 16 }) + '</button>' +
      '<div data-slot="sort-menu"></div>' +
      '</div>' +
      '<span class="leads-count" data-slot="count"></span>' +
      '</div></div>' +
      '<div class="leads-list-scroll" data-slot="cards"></div>';
    container.querySelector('[data-action="toggle-filters"]').innerHTML = icon({ size: 16 });

    var els = {
      search: container.querySelector('[data-field="search"]'),
      filterBtn: container.querySelector('[data-action="toggle-filters"]'),
      filterPanel: container.querySelector('[data-slot="filter-panel"]'),
      sortMenu: container.querySelector('[data-slot="sort-menu"]'),
      count: container.querySelector('[data-slot="count"]'),
      cards: container.querySelector('[data-slot="cards"]'),
    };
    container.__els = els;

    els.search.addEventListener('input', function (e) { handlers.onSearch(e.target.value); });
    container.addEventListener('change', function (e) {
      if (e.target.matches('[data-action="filter-status"]')) handlers.onFilters({ status: e.target.value });
      if (e.target.matches('[data-action="filter-rep"]')) handlers.onFilters({ rep: e.target.value });
      if (e.target.matches('[data-action="filter-priority"]')) handlers.onFilters({ priority: e.target.value });
    });
    container.addEventListener('click', function (e) {
      var el = e.target.closest('[data-action]');
      if (!el) return;
      var action = el.getAttribute('data-action');
      if (action === 'toggle-filters') { e.stopPropagation(); handlers.onToggleFilters(); }
      else if (action === 'toggle-sort-menu') { e.stopPropagation(); handlers.onToggleSortMenu(); }
      else if (action === 'filter-clear') handlers.onFilters({ status: '', rep: '', priority: '' }, true);
      else if (action === 'sort-by') handlers.onSort(el.getAttribute('data-sort-id'));
      else if (action === 'select-lead') handlers.onSelectLead(el.getAttribute('data-lead-id'));
      else if (action === 'toggle-favorite') { e.stopPropagation(); handlers.onToggleFavorite(el.getAttribute('data-lead-id')); }
    });
    // 'click' (not 'mousedown'): a mousedown-triggered re-render can destroy
    // the element the user is mid-click on (e.g. a sidebar nav button)
    // before the browser dispatches its 'click' -- the event is then
    // silently swallowed. Bubbling a 'click' lets the actual target's own
    // handler run first; this listener only runs afterwards.
    document.addEventListener('click', function (e) {
      if (!container.contains(e.target)) handlers.onCloseMenus && handlers.onCloseMenus();
    });
  }

  function render(container, state, handlers) {
    if (!container.__mockBound) {
      container.__mockBound = true;
      buildChrome(container, handlers);
    }
    var els = container.__els;
    var filtered = filterAndSortLeads(state);
    var hasActiveFilters = state.filters.status || state.filters.rep || state.filters.priority;

    if (document.activeElement !== els.search && els.search.value !== state.searchQuery) {
      els.search.value = state.searchQuery;
    }
    els.filterBtn.classList.toggle('active', !!(state.showFilters || hasActiveFilters));
    els.filterPanel.innerHTML = renderFilterPanel(state);
    els.sortMenu.innerHTML = renderSortMenu(state);
    els.count.textContent = filtered.length + ' leads';
    els.cards.innerHTML = filtered.length === 0
      ? '<div class="empty-state">' + icon({ size: 32 }) + '<p>No leads match your criteria</p></div>'
      : filtered.map(function (l) { return renderCard(l, state); }).join('');
  }

  window.LeadsMock = window.LeadsMock || {};
  window.LeadsMock.list = { render: render, filterAndSortLeads: filterAndSortLeads, formatRelativeDate: formatRelativeDate, repFor: repFor };
})();
