/* Inline SVG icon helper for the standalone leads prototype.
   Single placeholder glyph (circle + crosshair), matching the audited
   Crmhub.html build where every icon name resolved to the same mark. */
(function () {
  'use strict';

  function svg(opts) {
    opts = opts || {};
    var size = opts.size || 16;
    var color = opts.color || 'currentColor';
    var strokeWidth = opts.strokeWidth || 1.8;
    var extraClass = opts.className ? ' ' + opts.className : '';
    return '<svg class="mock-icon' + extraClass + '" width="' + size + '" height="' + size +
      '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="' + strokeWidth +
      '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="8"></circle>' +
      '<path d="M8 12h8"></path>' +
      '<path d="M12 8v8"></path>' +
      '</svg>';
  }

  window.LeadsMock = window.LeadsMock || {};
  window.LeadsMock.icons = { svg: svg };
})();
