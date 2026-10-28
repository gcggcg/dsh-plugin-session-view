// Headless smoke harness for dsh-plugin-session-view/client.js
// Runs the browser bundle with a stub module loader, stub React, and stub Cordis
// context, then exercises apply(), the header-utilities registration, the data
// loader, the toggle actions, and every render branch.
// Run with: node session-plugin-view/smoke.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';

// Resolve the bundle from this file so the harness works from any checkout path.
const CLIENT = fileURLToPath(new URL('./client.js', import.meta.url));
const source = fs.readFileSync(CLIENT, 'utf8');

let captured;
const sandbox = {
  window: { __ModuleLoader__: { load: (row) => { captured = row; } } },
  console,
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: 'client.js' });

assert.ok(captured, 'bundle called __ModuleLoader__.load');
const manifest = JSON.parse(fs.readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf8'));
assert.equal(captured.id, manifest.name, 'client module id equals the package name (the loader resolves bundles by package name)');

// ---- React stub: enough to call components outside a renderer --------------
function createReact() {
  const slots = [];
  let cursor = 0;
  return {
    slots,
    reset: () => { cursor = 0; },
    createElement: (type, props, ...children) => ({ type, props: props ?? {}, children }),
    useState: (initial) => {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], (next) => {
        slots[index] = typeof next === 'function' ? next(slots[index]) : next;
      }];
    },
    useEffect: () => { cursor++; },
    useLayoutEffect: () => { cursor++; },
    useMemo: (factory) => { cursor++; return factory(); },
    useRef: () => { const index = cursor++; if (!(index in slots)) slots[index] = { current: null }; return slots[index]; },
  };
}

const React = createReact();
const ReactDOM = { createPortal: (element) => element };
const required = new Set();
const factoryRequire = (specifier) => {
  required.add(specifier);
  if (specifier === 'react') return React;
  if (specifier === 'react-dom') return ReactDOM;
  throw new Error(`unexpected require: ${specifier}`);
};

const client = captured.factory(factoryRequire);
assert.deepEqual(
  client.inject,
  ['slots', 'locale', 'remote', 'remote.pluginInventory', 'remote.skills', 'remote.pluginManager', 'sessions'],
  'client inject roster',
);

// Regression guard: Cordis resolves a generated `remote.<namespace>` as a child
// Service, and reading one that the fiber does not list in `inject` throws
// `cannot get property "<name>" without inject`. Every remote namespace the
// bundle reads must therefore be declared.
const remoteReads = new Set(
  [...source.matchAll(/(?<![\w$])remote\.([A-Za-z_$][\w$]*)/g)].map((match) => match[1]),
);
assert.ok(remoteReads.size > 0, 'the bundle reads at least one remote namespace');
for (const namespace of remoteReads) {
  assert.ok(
    client.inject.includes(`remote.${namespace}`),
    `inject declares remote.${namespace} (read by client.js)`,
  );
}

// ---- Cordis context stub --------------------------------------------------
const registrations = [];
const effects = [];
const dictionaries = [];
const ctx = {
  effect: (factory) => { effects.push(factory); },
  locale: {
    register: (ns, dicts) => { dictionaries.push({ ns, dicts }); return () => {}; },
    bind: (ns) => (key, params) => (params === undefined ? `[${ns}.${key}]` : `[${ns}.${key}:${JSON.stringify(params)}]`),
    resolveText: (value) => (typeof value === 'string' ? value : value?.['zh-CN'] ?? value?.en ?? Object.values(value ?? {})[0] ?? ''),
  },
  slots: {
    inject: (slotName, callback) => { effects.push(() => callback()); },
    register: (options, Component) => { registrations.push({ options, Component }); return () => {}; },
  },
  remote: {},
  sessions: {},
};

client.apply(ctx);
for (const effect of effects) effect();

// ---- stylesheet effect (browser document stub) ----------------------------
const appended = [];
const fakeDocument = {
  querySelector: () => null,
  createElement: () => ({ dataset: {}, textContent: '', remove() { this.removed = true; } }),
  head: { appendChild: (tag) => appended.push(tag) },
};
const styleEffects = [];
const styleCtx = {
  effect: (factory) => { styleEffects.push(factory); },
  locale: { register: () => () => {}, bind: () => () => '', resolveText: (value) => value },
  slots: { inject: () => {}, register: () => () => {} },
  remote: {},
  sessions: {},
};
const previousGlobal = globalThis.document;
sandbox.document = fakeDocument;
globalThis.document = fakeDocument;
client.apply(styleCtx);
for (const effect of styleEffects) effect();
globalThis.document = previousGlobal;
delete sandbox.document;
assert.equal(appended.length, 1, 'one stylesheet tag appended');
assert.equal(appended[0].dataset.plugin, 'session-plugin-view');
assert.ok(appended[0].textContent.includes('.spv-trigger'), 'stylesheet carries the trigger rules');
assert.ok(appended[0].textContent.includes('.spv-panel'), 'stylesheet carries the popover rules');
assert.ok(appended[0].textContent.includes('.spv-switch'), 'stylesheet carries the switch rules');

assert.equal(dictionaries.length, 1, 'one dictionary namespace registered');
const dict = dictionaries[0];
assert.equal(dict.ns, 'sessionPluginView');
assert.deepEqual(Object.keys(dict.dicts).sort(), ['en', 'zh']);
assert.deepEqual(
  Object.keys(dict.dicts.zh).sort(),
  Object.keys(dict.dicts.en).sort(),
  'zh and en dictionaries carry the same keys',
);

assert.equal(registrations.length, 1, 'one slot registration');
const registration = registrations[0];
assert.equal(registration.options.name, 'conversation.session.header.utilities');
assert.equal(registration.options.id, 'session-plugin-view');
assert.equal(registration.options.locale, 'sessionPluginView');
assert.equal(typeof registration.options.inject, 'function');

// ---- Data path ------------------------------------------------------------
const presetRows = [
  { entryId: 'include:tool-bash', moduleName: '@deepseek-ai/dsh-tool-bash', enabled: true, fiberPhase: 'active', meta: { title: { en: 'Shell', 'zh-CN': '命令行' }, description: { en: 'Runs shell commands.', 'zh-CN': '执行命令。' } } },
  { entryId: 'include:tool-web', moduleName: '@deepseek-ai/dsh-tool-web', enabled: true, fiberPhase: 'active' },
  { entryId: 'include:tool-todo', moduleName: '@deepseek-ai/dsh-tool-todo', enabled: false, fiberPhase: null },
  { entryId: 'include:tool-goal', moduleName: '@deepseek-ai/dsh-tool-goal', enabled: true, fiberPhase: 'failed', meta: { error: 'boom' } },
  { entryId: 'include:mcp-github', moduleName: '@deepseek-ai/dsh-mcp-client', enabled: true, fiberPhase: 'active' },
];
const inventory = {
  entries: [
    { entryId: 'include:ui-theme', moduleName: '@deepseek-ai/dsh-client-ui-theme', enabled: true, fiberPhase: 'active', meta: {} },
  ],
  agentPresets: [
    { id: 'standard', name: 'Standard', isDefault: true, rows: presetRows },
    { id: 'minimal', rows: [] },
  ],
};
const pluginRows = [
  { entryId: 'include:mcp-github', moduleName: '@deepseek-ai/dsh-mcp-client', enabled: true, fiberPhase: 'active', patchId: 'mcp-github', meta: { title: { en: 'GitHub MCP', 'zh-CN': 'GitHub MCP' }, description: { zh: '仓库与 issue 读取' } } },
  { entryId: 'include:mcp-web', moduleName: '@deepseek-ai/dsh-mcp-client', enabled: false, fiberPhase: null, readOnlyReason: 'management-required', meta: { title: 'Web MCP' } },
  { entryId: 'include:tool-plugin-manager', moduleName: '@deepseek-ai/dsh-plugin-manager/tools', enabled: false, fiberPhase: null, patchId: 'tool-plugin-manager' },
];
const bundles = [
  { name: 'dsh-plugin-whale-pet', enabled: true, installed: true, availability: 'profile', version: '0.2.9', rows: [{ rowId: 'whale' }], meta: { title: 'Whale Pet', description: 'Desktop pet' } },
  { name: '@xbzbing/dsh-git-panel', enabled: false, installed: true, availability: 'profile', version: '1.9.3', rows: [{ rowId: 'git' }], meta: {} },
  { name: '@deepseek-ai/dsh-base', enabled: true, installed: false, availability: 'installation', rows: [], readOnlyReason: 'management-required' },
];

let skillsCalls = 0;
const toggleCalls = [];
ctx.remote = {
  pluginInventory: { list: async () => ({ ok: true, value: inventory }) },
  skills: {
    list: async () => {
      skillsCalls++;
      return { ok: true, value: { skills: [
        { name: 'office', description: 'Word and Excel work.', modelInvocable: true, path: 'x' },
        { name: 'hidden', description: 'Manual only.', modelInvocable: false },
        { name: 'broken' },
      ] } };
    },
  },
  pluginManager: {
    listPlugins: async () => ({ ok: true, value: pluginRows }),
    listBundles: async () => ({ ok: true, value: bundles }),
    setPluginEnabled: async (entryId, enabled) => {
      toggleCalls.push(['plugin', entryId, enabled]);
      return { ok: true, value: { stage: 'enable', target: entryId, enabled, changed: true, application: 'applied' } };
    },
    setBundleEnabled: async (name, enabled) => {
      toggleCalls.push(['bundle', name, enabled]);
      return { ok: true, value: { stage: 'enable', target: name, enabled, changed: true, application: 'applied' } };
    },
  },
};
let usedRetain = 0;
ctx.sessions = {
  using: async (sessionId, options, operation) => {
    usedRetain++;
    assert.equal(typeof options.source, 'string');
    return operation({ binding: { session: { getSnapshot: () => ({ openState: 'open' }) } } });
  },
};

const injected = registration.options.inject('session-1');
assert.equal(typeof injected.load, 'function');
assert.equal(typeof injected.resolveText, 'function');
assert.equal(typeof injected.setPluginEnabled, 'function');
assert.equal(typeof injected.setBundleEnabled, 'function');

let snapshot = await injected.load({ presetId: 'standard' });
assert.equal(snapshot.presetName, 'Standard');
assert.equal(snapshot.presetIsDefault, true);
assert.deepEqual(snapshot.plugins.map((item) => item.title), ['命令行', 'tool-web', 'tool-goal']);
assert.equal(snapshot.plugins[0].description, '执行命令。');
assert.deepEqual(snapshot.plugins.map((item) => item.state), ['mounted', 'mounted', 'failed']);
assert.deepEqual(snapshot.skills.map((item) => item.title), ['office', 'hidden', 'broken']);
assert.equal(skillsCalls, 1);
assert.equal(usedRetain, 1);

// MCP rows: profile rows are togglable, preset-provided rows are read-only, and
// the same server is not listed twice.
assert.deepEqual(snapshot.mcp.map((item) => item.title), ['mcp-github', 'mcp-web']);
assert.deepEqual(snapshot.mcp.map((item) => item.enabled), [true, false]);
assert.deepEqual(snapshot.mcp.map((item) => item.editable), [true, false]);
assert.equal(snapshot.mcp[1].reasonKey, 'readOnlyManagement');

// Bundles: only installed bundles are listed, and only installed profile bundles toggle.
assert.deepEqual(snapshot.bundles.map((item) => item.name), ['dsh-plugin-whale-pet', '@xbzbing/dsh-git-panel']);
assert.deepEqual(snapshot.bundles.map((item) => item.enabled), [true, false]);
assert.deepEqual(snapshot.bundles.map((item) => item.editable), [true, true]);
assert.deepEqual(snapshot.bundles.map((item) => item.rowCount), [1, 1]);

// Toggle actions forward the exact ids the Host expects.
const applied = await injected.setPluginEnabled('include:mcp-web', true);
assert.equal(applied.application, 'applied');
assert.deepEqual(toggleCalls.at(-1), ['plugin', 'include:mcp-web', true]);
await injected.setBundleEnabled('dsh-plugin-whale-pet', false);
assert.deepEqual(toggleCalls.at(-1), ['bundle', 'dsh-plugin-whale-pet', false]);

// In-band business failures become rejections carrying the error code.
ctx.remote.pluginManager.setPluginEnabled = async () => ({
  ok: true,
  value: { stage: 'enable', target: 'include:mcp-web', enabled: true, changed: false, application: 'failed', error: { code: 'management-required' } },
});
await assert.rejects(() => injected.setPluginEnabled('include:mcp-web', true), /management-required/);

// A failing manager read degrades the panel instead of rejecting.
ctx.remote.pluginManager = {
  listPlugins: async () => { throw new Error('manager offline'); },
  listBundles: async () => ({ ok: true, value: [] }),
  setPluginEnabled: async () => ({ ok: true, value: { application: 'applied' } }),
  setBundleEnabled: async () => ({ ok: true, value: { application: 'applied' } }),
};
snapshot = await injected.load({ presetId: 'standard' });
assert.equal(snapshot.mcp.length, 1, 'preset MCP row still listed when the manager read fails');
assert.equal(snapshot.errors.manager, 'manager offline');
assert.deepEqual(snapshot.plugins.map((item) => item.title), ['命令行', 'tool-web', 'tool-goal']);

// unknown preset falls back to the default preset
snapshot = await injected.load({ presetId: 'nope' });
assert.equal(snapshot.presetName, 'Standard');

// a failing skills transport degrades to an empty list, never throws
ctx.remote.skills = { list: async () => { throw new Error('offline'); } };
snapshot = await injected.load({});
assert.deepEqual(snapshot.skills, []);

// a closed session skips the skill read
ctx.sessions.using = async (sessionId, options, operation) => operation({ binding: { session: { getSnapshot: () => ({ openState: 'closed' }) } } });
snapshot = await injected.load({});
assert.deepEqual(snapshot.skills, []);

// ---- Render branches ------------------------------------------------------
// Restore a healthy fake surface for the render assertions; the degradation
// probes above intentionally broke it.
ctx.remote = {
  pluginInventory: { list: async () => ({ ok: true, value: inventory }) },
  skills: { list: async () => ({ ok: true, value: { skills: [{ name: 'office', description: 'Office work.', modelInvocable: true, path: 'skills/office' }] } }) },
  pluginManager: {
    listPlugins: async () => ({ ok: true, value: pluginRows }),
    listBundles: async () => ({ ok: true, value: bundles }),
    setPluginEnabled: async (entryId, enabled) => ({ ok: true, value: { stage: 'enable', target: entryId, enabled, changed: true, application: 'applied' } }),
    setBundleEnabled: async (name, enabled) => ({ ok: true, value: { stage: 'enable', target: name, enabled, changed: true, application: 'applied' } }),
  },
};
ctx.sessions = {
  using: async (sessionId, options, operation) => operation({ binding: { session: { getSnapshot: () => ({ openState: 'open' }) } } }),
};

const baseProps = {
  sessionId: 'session-1',
  resolveText: injected.resolveText,
  load: async () => snapshot,
  setPluginEnabled: injected.setPluginEnabled,
  setBundleEnabled: injected.setBundleEnabled,
  t: (key, params) => (params === undefined ? `[${key}]` : `[${key}:${JSON.stringify(params)}]`),
};

function render(props, openState, readySnapshot, tab) {
  React.reset();
  React.slots.length = 0;
  React.slots[0] = openState === true;
  if (tab !== undefined) React.slots[1] = tab;
  if (readySnapshot !== undefined) React.slots[3] = { status: 'ready', snapshot: readySnapshot };
  return registration.Component(props);
}

function walk(node, visit) {
  if (node === null || node === undefined) return;
  if (Array.isArray(node)) { node.forEach((child) => walk(child, visit)); return; }
  if (typeof node !== 'object') return;
  if (typeof node.type === 'function') { walk(node.type({ ...node.props, children: node.children }), visit); return; }
  visit(node);
  (node.children ?? []).forEach((child) => walk(child, visit));
}

// collapsed (default state)
let tree = render({ ...baseProps, useProjection: () => ({ getSnapshot: () => 'standard' }) });
assert.ok(tree.props.className === 'spv-root');
let seen = [];
walk(tree, (node) => seen.push(node));
assert.ok(seen.some((node) => node.props?.className === 'spv-trigger'), 'header trigger renders');
assert.ok(seen.some((node) => node.props?.['aria-expanded'] === false), 'trigger starts collapsed');
assert.ok(!seen.some((node) => node.props?.className === 'spv-panel'), 'panel stays closed');

// expanded with data
const readySnapshot = await injected.load({ presetId: 'standard' });
tree = render({ ...baseProps, useProjection: () => ({ getSnapshot: () => 'standard' }) }, true, readySnapshot, 'mcp');
seen = [];
walk(tree, (node) => seen.push(node));
const classNames = seen.map((node) => node.props?.className).filter(Boolean);
assert.ok(classNames.includes('spv-panel'), 'expanded panel renders');
assert.ok(classNames.includes('spv-tabs'), 'tab row renders');
assert.equal(seen.filter((node) => node.props?.role === 'tab').length, 3, 'three tabs render');
assert.ok(seen.some((node) => node.props?.role === 'switch'), 'MCP switch renders');
assert.equal(seen.filter((node) => node.props?.role === 'switch').length, 2, 'one switch per MCP row');

// plugins tab shows installed bundles and session plugins
tree = render({ ...baseProps }, true, readySnapshot, 'plugins');
seen = [];
walk(tree, (node) => seen.push(node));
let pluginSwitches = seen.filter((node) => node.props?.role === 'switch');
assert.equal(pluginSwitches.length, 2, 'one switch per installed bundle');
assert.ok(seen.some((node) => typeof node.props?.className === 'string' && node.props.className.includes('spv-tag')), 'session plugin state tag renders');

// skills tab renders skill rows without switches
tree = render({ ...baseProps }, true, readySnapshot, 'skills');
seen = [];
walk(tree, (node) => seen.push(node));
assert.equal(seen.filter((node) => node.props?.role === 'switch').length, 0, 'skills tab has no switches');
assert.ok(seen.some((node) => node.props?.title === 'skills/office'), 'skill row renders its path as the title');

// loading and error branches
for (const status of ['loading', 'error']) {
  React.reset();
  React.slots.length = 0;
  React.slots[0] = true;
  React.slots[3] = status === 'error' ? { status, message: 'boom' } : { status };
  seen = [];
  walk(registration.Component(baseProps), (node) => seen.push(node));
  assert.ok(seen.some((node) => node.props?.className === 'spv-panel'), `${status}: panel renders`);
}

// a missing standard prop set never throws
tree = render({ t: undefined, useProjection: undefined });
assert.ok(tree);

// dispose the registered effects
console.log('smoke ok:', {
  requires: [...required],
  dictionaries: dict.ns,
  registration: `${registration.options.name}#${registration.options.id}`,
  plugins: readySnapshot.plugins.length,
  mcp: readySnapshot.mcp.length,
  skills: readySnapshot.skills.length,
  bundles: readySnapshot.bundles.length,
});
