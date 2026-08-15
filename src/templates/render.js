// =============================================================================
// Shared, dependency-free template engine.
//
// Used by:
//   - scripts/build.js        (build-time static generation, Node)
//   - future Cloudflare Worker (request-time rendering from D1 rows)
//
// It is intentionally environment-agnostic: NO `fs`, NO `process`, NO Node-
// specific APIs. Pure string in -> string out, so the exact same module runs
// unchanged in the Workers runtime.
//
// Syntax:
//   {{var}}        escaped variable
//   {{{raw}}}      unescaped (raw HTML — used for pre-rendered block inner)
//   {{#each name}} {{/each}}      loop over array `name`
//   {{#if cond}}   {{else}} {{/if}}   conditional
// =============================================================================

export function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function getPath(obj, p) {
  return String(p).split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

// Single inner capture group; the directive type is inferred from the
// leading delimiter ({{{ raw }}} vs {{ directive/var }}).
const TOKEN_RE = /\{\{\{([^}]+)\}\}\}|\{\{([^}]+)\}\}/g;

export function tokenize(s) {
  const tokens = [];
  let last = 0;
  let m;
  while ((m = TOKEN_RE.exec(s))) {
    if (m.index > last) tokens.push({ t: 'text', v: s.slice(last, m.index) });
    if (m[0].startsWith('{{{')) {
      tokens.push({ t: 'rawvar', v: m[1].trim() });
    } else {
      const raw = m[2].trim();
      if (raw.startsWith('#each')) tokens.push({ t: 'each', v: raw.slice(5).trim() });
      else if (raw.startsWith('#if')) tokens.push({ t: 'if', v: raw.slice(3).trim() });
      else if (raw === 'else') tokens.push({ t: 'else' });
      else if (raw === '/each' || raw === '/if') tokens.push({ t: 'close' });
      else tokens.push({ t: 'var', v: raw });
    }
    last = TOKEN_RE.lastIndex;
  }
  if (last < s.length) tokens.push({ t: 'text', v: s.slice(last) });
  return tokens;
}

export function parseNodesFrom(tokens) {
  let i = 0;
  function parseNodes() {
    const nodes = [];
    while (i < tokens.length) {
      const tk = tokens[i];
    if (tk.t === 'close') { i++; return nodes; }
    if (tk.t === 'else') { return nodes; } // leave 'else' for the #if handler to consume
      if (tk.t === 'text') { nodes.push({ type: 'text', v: tk.v }); i++; }
      else if (tk.t === 'var') { nodes.push({ type: 'var', v: tk.v }); i++; }
      else if (tk.t === 'rawvar') { nodes.push({ type: 'rawvar', v: tk.v }); i++; }
      else if (tk.t === 'each') {
        i++;
        const body = parseNodes();
        nodes.push({ type: 'each', name: tk.v, body });
      } else if (tk.t === 'if') {
        i++;
        const thenB = parseNodes();
        let elseB = null;
        if (i < tokens.length && tokens[i].t === 'else') { i++; elseB = parseNodes(); }
        nodes.push({ type: 'if', cond: tk.v, then: thenB, else: elseB });
      }
    }
    return nodes;
  }
  return parseNodes();
}

export function render(nodes, data) {
  let out = '';
  for (const n of nodes) {
    if (n.type === 'text') out += n.v;
    else if (n.type === 'var') out += escapeHtml(getPath(data, n.v));
    else if (n.type === 'rawvar') out += getPath(data, n.v) || '';
    else if (n.type === 'each') {
      const arr = getPath(data, n.name) || [];
      arr.forEach((item, idx) => {
        const scope = Object.assign({}, data, item, {
          '@index': idx,
          '@first': idx === 0,
          '@last': idx === arr.length - 1,
        });
        out += render(n.body, scope);
      });
    } else if (n.type === 'if') {
      if (getPath(data, n.cond)) out += render(n.then, data);
      else if (n.else) out += render(n.else, data);
    }
  }
  return out;
}

// Compile a template string ONCE into a render function (caches parsing).
export function compileTemplate(templateString) {
  const nodes = parseNodesFrom(tokenize(templateString));
  return (data) => render(nodes, data);
}

// Convenience: render a template string with data in a single call.
export function renderTemplate(templateString, data) {
  return compileTemplate(templateString)(data);
}
