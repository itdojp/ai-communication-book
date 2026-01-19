/**
 * Mermaid support for book-formatter (Jekyll) pages.
 * - Convert ```mermaid fenced blocks (rendered as <pre><code class="language-mermaid">)
 *   into <div class="mermaid"> for client-side rendering.
 */

(function () {
  'use strict';

  var initialized = false;
  var lastTheme = null;

  function getTheme() {
    var theme = document.documentElement.getAttribute('data-theme') || 'light';
    return theme === 'dark' ? 'dark' : 'default';
  }

  function ensureInitialized() {
    if (!window.mermaid) return;

    var theme = getTheme();
    if (initialized && lastTheme === theme) return;

    lastTheme = theme;
    try {
      window.mermaid.initialize({ startOnLoad: false, theme: theme });
      initialized = true;
    } catch (e) {
      // ignore init failures and try rendering anyway
    }
  }

  function convertMermaidBlocks() {
    var codeBlocks = document.querySelectorAll('pre > code.language-mermaid, pre > code.mermaid');
    if (!codeBlocks || codeBlocks.length === 0) return [];

    var mermaidNodes = [];
    for (var i = 0; i < codeBlocks.length; i++) {
      var code = codeBlocks[i];
      var pre = code.parentElement;
      if (!pre) continue;

      var source = code.textContent || '';
      if (!source.trim()) continue;

      var container = document.createElement('div');
      container.className = 'mermaid';
      container.setAttribute('data-mermaid-src', source);
      container.textContent = source;
      pre.replaceWith(container);
      mermaidNodes.push(container);
    }
    return mermaidNodes;
  }

  function getExistingMermaidNodes() {
    var nodes = document.querySelectorAll('div.mermaid[data-mermaid-src]');
    if (!nodes || nodes.length === 0) return [];
    return Array.prototype.slice.call(nodes);
  }

  function renderMermaid() {
    if (!window.mermaid) return;

    var nodes = convertMermaidBlocks();
    if (nodes.length === 0) {
      nodes = getExistingMermaidNodes();
      if (nodes.length === 0) return;
      for (var i = 0; i < nodes.length; i++) {
        var src = nodes[i].getAttribute('data-mermaid-src') || '';
        if (src) nodes[i].textContent = src;
      }
    }

    ensureInitialized();

    try {
      if (typeof window.mermaid.run === 'function') {
        window.mermaid.run({ nodes: nodes });
      } else if (typeof window.mermaid.init === 'function') {
        window.mermaid.init(undefined, nodes);
      }
    } catch (e) {
      if (window.console && typeof window.console.warn === 'function') {
        window.console.warn('mermaid render failed', e);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderMermaid);
  } else {
    renderMermaid();
  }

  // Re-render on theme changes (best-effort).
  var themeObserver = new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      if (mutations[i].attributeName === 'data-theme') {
        renderMermaid();
        break;
      }
    }
  });
  themeObserver.observe(document.documentElement, { attributes: true });
})();
