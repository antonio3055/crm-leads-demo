/* Messages / Email / Scanner / Command pages.
   Shared layout helpers (folder nav, card grid) avoid duplicating the same
   markup across Messages+Email and Scanner+Command. */
(function () {
  'use strict';

  var icon = function (opts) { return window.LeadsMock.icons.svg(opts); };

  function folderNav(title, folders) {
    var items = folders.map(function (f) {
      return '<div class="folder-item">' + icon({ size: 16 }) +
        '<span class="folder-item-label">' + f.label + '</span>' +
        (f.count > 0 ? '<span class="folder-item-count">' + f.count + '</span>' : '') +
        '</div>';
    }).join('');
    return '<div class="folder-nav">' +
      '<div class="folder-nav-header"><span class="folder-nav-title">' + title + '</span>' +
      '<button type="button" class="btn btn-primary btn-sm">' + icon({ size: 12 }) + ' New</button></div>' +
      '<div class="folder-list">' + items + '</div></div>';
  }

  function placeholderHeader(title, desc) {
    return icon({ size: 48 }) + '<h2>' + title + '</h2><p>' + desc + '</p>';
  }

  function cardGrid(cards) {
    return '<div class="card-grid">' + cards.map(function (c) {
      return '<div class="info-card">' + icon({ size: 24 }) +
        '<div class="info-card-label">' + c.label + '</div>' +
        (c.desc ? '<div class="info-card-desc">' + c.desc + '</div>' : '') +
        (c.count !== undefined && c.count > 0 ? '<div class="info-card-count">' + c.count + ' active</div>' : '') +
        '</div>';
    }).join('') + '</div>';
  }

  function messages(container) {
    container.innerHTML = '<div class="static-page">' +
      folderNav('Messages', [
        { label: 'Inbox', count: 12 },
        { label: 'Sent', count: 0 },
        { label: 'Drafts', count: 2 },
        { label: 'Archive', count: 0 },
        { label: 'Trash', count: 0 },
        { label: 'Spam', count: 3 },
      ]) +
      '<div class="placeholder-page">' + placeholderHeader('Messages', 'SMS and WhatsApp messaging center &mdash; Phase 2') + '</div>' +
      '</div>';
  }

  function email(container) {
    container.innerHTML = '<div class="static-page">' +
      folderNav('Email', [
        { label: 'Inbox', count: 24 },
        { label: 'Sent', count: 0 },
        { label: 'Drafts', count: 4 },
        { label: 'Archive', count: 0 },
        { label: 'Trash', count: 0 },
        { label: 'Spam', count: 7 },
      ]) +
      '<div class="placeholder-page">' + placeholderHeader('Email', 'Professional CRM email workspace &mdash; Phase 3') + '</div>' +
      '</div>';
  }

  function scanner(container) {
    container.innerHTML = '<div class="placeholder-page" style="padding:40px">' +
      placeholderHeader('Scanner', 'Document intake, OCR review, and lead creation &mdash; Phase 4') +
      cardGrid([
        { label: 'Upload', desc: 'Drop or select files' },
        { label: 'Queue', desc: 'Processing queue' },
        { label: 'Review', desc: 'Verify extraction' },
        { label: 'Issues', desc: 'Needs attention' },
      ]) + '</div>';
  }

  function command(container) {
    container.innerHTML = '<div class="placeholder-page" style="padding:40px">' +
      placeholderHeader('Command', 'Owner controls, user management, and system oversight &mdash; Phase 6') +
      cardGrid([
        { label: 'Team', desc: '5 reps' },
        { label: 'Activity', desc: 'Live overview' },
        { label: 'Security', desc: 'Permissions' },
        { label: 'Settings', desc: 'Configuration' },
      ]) + '</div>';
  }

  window.LeadsMock = window.LeadsMock || {};
  window.LeadsMock.staticPages = { messages: { render: messages }, email: { render: email }, scanner: { render: scanner }, command: { render: command } };
})();
