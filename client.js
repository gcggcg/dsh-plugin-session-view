window.__ModuleLoader__.load({
  id: '@local/session-plugin-view',
  factory(require) {
    const React = require('react');
    const ReactDOM = require('react-dom');
    const h = React.createElement;

    /** Dictionary namespace owned by this plugin. */
    const NS = 'sessionPluginView';

    /** Simplified Chinese dictionary (the key-set source of truth). */
    const zh = {
      toggle: '插件与能力',
      tabMcp: 'MCP',
      tabSkills: '技能',
      tabPlugins: '插件',
      refresh: '刷新',
      loading: '读取中…',
      error: '暂时无法读取插件信息',
      retry: '重试',
      emptyMcp: '没有配置 MCP 服务。在 profile 的 cordis.patch.yml 里添加 @deepseek-ai/dsh-mcp-client 条目后会出现在这里。',
      emptySkills: '当前会话没有可用技能。',
      emptyBundles: '没有安装插件包。',
      emptyPlugins: '当前预设没有挂载插件。',
      groupBundles: '已安装插件包',
      groupSession: '当前会话插件',
      groupMcp: 'MCP 服务',
      groupSkills: '会话技能',
      enable: '启用',
      disable: '停用',
      restartRequired: '已保存，需重启后生效。',
      overridden: '已保存，但被更高优先级的配置覆盖。',
      toggleFailed: '切换失败：{message}',
      toggleUnavailable: '此环境不支持修改启停状态。',
      readOnlyManagement: '由 Harness 管理，不能在此修改',
      readOnlyUnaddressable: '由预设或安装层提供，不能在此修改',
      readOnlyPreset: '由 Agent 预设提供，不能在此修改',
      manualOnly: '仅手动',
      preset: '预设 {name}',
      defaultPreset: '默认预设',
      tagMounted: '已挂载',
      tagConditional: '条件启用',
      tagFailed: '启动失败',
      tagDisabled: '已停用',
      tagGlobal: '全局',
      version: '版本 {version}',
      rows: '{count} 行',
    };

    /** English dictionary, checked complete against the zh key set. */
    const en = {
      toggle: 'Plugins & capabilities',
      tabMcp: 'MCP',
      tabSkills: 'Skills',
      tabPlugins: 'Plugins',
      refresh: 'Refresh',
      loading: 'Reading…',
      error: 'Plugins are temporarily unavailable',
      retry: 'Retry',
      emptyMcp: 'No MCP server is configured. Entries added to the profile cordis.patch.yml as @deepseek-ai/dsh-mcp-client appear here.',
      emptySkills: 'No skill is available in this session.',
      emptyBundles: 'No plugin bundle is installed.',
      emptyPlugins: 'This preset mounts no plugin.',
      groupBundles: 'Installed bundles',
      groupSession: 'Session plugins',
      groupMcp: 'MCP servers',
      groupSkills: 'Session skills',
      enable: 'Enable',
      disable: 'Disable',
      restartRequired: 'Saved; a restart is required to apply.',
      overridden: 'Saved, but a higher-priority setting overrides it.',
      toggleFailed: 'Toggle failed: {message}',
      toggleUnavailable: 'This environment cannot change enablement.',
      readOnlyManagement: 'Managed by the Harness; cannot be changed here',
      readOnlyUnaddressable: 'Provided by a preset or installation layer; cannot be changed here',
      readOnlyPreset: 'Provided by an agent preset; cannot be changed here',
      manualOnly: 'Manual only',
      preset: 'Preset {name}',
      defaultPreset: 'Default preset',
      tagMounted: 'Mounted',
      tagConditional: 'Conditional',
      tagFailed: 'Failed',
      tagDisabled: 'Disabled',
      tagGlobal: 'Global',
      version: 'Version {version}',
      rows: '{count} rows',
    };

    /** Stylesheet for the trigger and the popover; registered as one disposal-owned tag. */
    const CSS = [
      '.spv-root{display:inline-flex;flex:none;align-items:center;min-width:0}',
      '.spv-trigger{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;border:none;border-radius:8px;background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;cursor:pointer}',
      '.spv-trigger:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary)}',
      '.spv-trigger[aria-expanded="true"]{background:var(--dsw-alias-interactive-bg-hover,var(--dsw-alias-bg-layer-2));color:var(--dsw-alias-label-primary)}',
      '.spv-trigger:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.spv-panel{position:fixed;z-index:1100;display:flex;flex-direction:column;width:360px;max-width:calc(100vw - 16px);max-height:min(70vh,calc(100vh - var(--dsh-frame-overlay-top,32px) - 56px));background:var(--dsw-specific-menu,var(--dsw-alias-bg-layer-1));border:.5px solid var(--dsw-alias-border-l1);border-radius:14px;box-shadow:var(--dsw-elevation-prominent,0 12px 32px rgba(0,0,0,.16));backdrop-filter:var(--dsw-menu-backdrop-filter);overflow:hidden;color:var(--dsw-alias-label-primary);font-family:inherit}',
      '.spv-tabs{display:flex;align-items:center;gap:2px;flex:none;padding:4px 8px 0;border-bottom:.5px solid var(--dsw-alias-border-l1)}',
      '.spv-tab{display:inline-flex;align-items:baseline;gap:4px;padding:7px 8px 9px;border:none;border-bottom:2px solid transparent;background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;font-size:12px;line-height:18px;cursor:pointer}',
      '.spv-tab:hover{color:var(--dsw-alias-label-secondary)}',
      '.spv-tab[aria-selected="true"]{color:var(--dsw-alias-label-primary);border-bottom-color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary))}',
      '.spv-tab:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}',
      '.spv-tabCount{font-size:12px;font-weight:600}',
      '.spv-tabFiller{flex:1 1 auto}',
      '.spv-iconButton{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;padding:0;border:none;border-radius:6px;background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;cursor:pointer}',
      '.spv-iconButton:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary)}',
      '.spv-iconButton:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.spv-iconButton[disabled]{opacity:.45;cursor:default}',
      '.spv-body{flex:1 1 auto;min-height:0;overflow:auto;overscroll-behavior:contain;padding:2px 0 6px}',
      '.spv-group+.spv-group{border-top:.5px solid var(--dsw-alias-border-l1)}',
      '.spv-groupTitle{display:flex;align-items:center;gap:6px;margin:0;padding:9px 12px 3px;font-size:10.5px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--dsw-alias-label-tertiary)}',
      '.spv-count{padding:0 6px;border-radius:999px;background:var(--dsw-alias-bg-layer-2);font-size:10px;font-weight:500;line-height:16px;letter-spacing:0;text-transform:none;color:var(--dsw-alias-label-tertiary)}',
      '.spv-row{display:flex;align-items:center;gap:8px;min-height:34px;padding:6px 12px}',
      '.spv-row:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.spv-dot{flex:none;width:7px;height:7px;border-radius:999px;background:var(--dsw-alias-label-quaternary,var(--dsw-alias-label-tertiary))}',
      '.spv-dot[data-tone="on"]{background:var(--dsw-alias-state-success-primary)}',
      '.spv-dot[data-tone="warn"]{background:var(--dsw-alias-state-warn-primary)}',
      '.spv-dot[data-tone="error"]{background:var(--dsw-alias-state-error-primary)}',
      '.spv-rowMain{display:flex;flex:1 1 auto;flex-direction:column;gap:1px;min-width:0}',
      '.spv-rowName{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12.5px;line-height:18px;color:var(--dsw-alias-label-primary)}',
      '.spv-rowSub{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary)}',
      '.spv-rowEnd{display:inline-flex;flex:none;align-items:center;gap:6px}',
      '.spv-tag{flex:none;padding:0 5px;border:.5px solid currentColor;border-radius:999px;font-size:10px;line-height:15px;color:var(--dsw-alias-label-tertiary)}',
      '.spv-tag[data-tone="mount"]{color:var(--dsw-alias-state-success-primary)}',
      '.spv-tag[data-tone="warn"]{color:var(--dsw-alias-state-warn-primary)}',
      '.spv-tag[data-tone="error"]{color:var(--dsw-alias-state-error-primary)}',
      '.spv-switch{position:relative;flex:none;width:30px;height:17px;padding:0;border:none;border-radius:999px;background:var(--dsw-alias-border-l3);font:inherit;cursor:pointer;transition:background .15s ease}',
      '.spv-switch[aria-checked="true"]{background:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary))}',
      '.spv-switch:disabled{cursor:default;opacity:.5}',
      '.spv-switch:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
      '.spv-knob{position:absolute;top:2px;left:2px;width:13px;height:13px;border-radius:999px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.2);transition:transform .15s ease}',
      '.spv-switch[aria-checked="true"] .spv-knob{transform:translateX(13px)}',
      '.spv-note{margin:0;padding:10px 12px;font-size:12px;line-height:17px;color:var(--dsw-alias-label-tertiary)}',
      '.spv-banner{display:flex;align-items:center;gap:8px;margin:8px 12px 2px;padding:7px 10px;border-radius:8px;background:var(--dsw-alias-bg-layer-2);font-size:12px;line-height:17px;color:var(--dsw-alias-state-error-primary)}',
      '.spv-banner[data-tone="warn"]{color:var(--dsw-alias-state-warn-primary)}',
      '.spv-bannerText{flex:1 1 auto;min-width:0}',
      '.spv-button{padding:2px 8px;border:.5px solid var(--dsw-alias-border-l2);border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:11px;line-height:16px;cursor:pointer}',
      '.spv-button:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.spv-button:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.spv-skeleton{height:13px;border-radius:4px;background:var(--dsw-alias-bg-layer-2)}',
      '.spv-visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}',
    ].join('');

    /** The one module specifier that marks a configured MCP server row. */
    const MCP_MODULE_SUFFIX = 'dsh-mcp-client';

    /** Maximum rows the panel keeps rendering for one section before it truncates. */
    const ROW_LIMIT = 200;

    /** Strip the composition-only `include:` marker from a Loader entry id. */
    function cleanEntryId(entryId) {
      if (typeof entryId !== 'string' || entryId === '') return undefined;
      return entryId.replace(/^include:/, '');
    }

    /** Shorten a package specifier the way the host Settings surfaces do. */
    function shortModule(moduleName) {
      if (typeof moduleName !== 'string' || moduleName === '') return '';
      const bare = moduleName.startsWith('@') ? moduleName.slice(moduleName.indexOf('/') + 1) : moduleName;
      return bare
        .replace(/^cordis:/, '')
        .replace(/^cordis-plugin-/, '')
        .replace(/^dsh-(?:host-|client-)?/, '');
    }

    /** Whether one Loader row is an MCP server bridge. */
    function isMcpRow(moduleName) {
      return typeof moduleName === 'string' && moduleName.endsWith(MCP_MODULE_SUFFIX);
    }

    /** Safe error text for notices and the error state. */
    function errorText(error) {
      if (error === undefined || error === null) return 'unknown error';
      if (typeof error === 'string') return error;
      return typeof error.message === 'string' && error.message !== '' ? error.message : String(error);
    }

    /** Resolve one maybe-localized display text through the Client locale service. */
    function textOf(value, resolveText) {
      if (value === undefined || value === null) return undefined;
      if (typeof value === 'string') return value;
      const resolved = resolveText(value);
      return typeof resolved === 'string' && resolved !== '' ? resolved : undefined;
    }

    /** Read one projected value from a standard keyed-hook source. */
    function projectionValue(source) {
      if (source === undefined || source === null) return undefined;
      try {
        const value = typeof source.getSnapshot === 'function' ? source.getSnapshot() : source;
        return typeof value === 'string' ? value : undefined;
      } catch {
        return undefined;
      }
    }

    /** Map one Loader row's runtime phase and enablement to the panel vocabulary. */
    function rowState(row) {
      if (row.readOnlyReason !== undefined && row.readOnlyReason !== 'management-required') return 'conditional';
      if (row.fiberPhase === 'failed') return 'failed';
      if (row.fiberPhase === 'pending' || row.fiberPhase === 'loading') return 'conditional';
      if (row.enabled === false) return 'disabled';
      if (row.enabled === true) return 'mounted';
      return 'conditional';
    }

    /** Human reason a row cannot be toggled here, or undefined when it can. */
    function readOnlyKey(reason) {
      if (reason === 'management-required') return 'readOnlyManagement';
      if (reason === 'unaddressable') return 'readOnlyUnaddressable';
      if (reason === 'preset') return 'readOnlyPreset';
      return reason === undefined ? undefined : 'readOnlyUnaddressable';
    }

    /**
     * Read the Host plugin inventory and project the current preset composition.
     * @returns session plugin rows plus the preset-provided MCP rows.
     */
    async function readInventory(ctx, presetId, resolveText) {
      const remote = ctx.remote;
      const inventory = remote === undefined || remote === null ? undefined : remote.pluginInventory;
      if (inventory === undefined || typeof inventory.list !== 'function') throw new Error('pluginInventory remote is unavailable');
      const result = await inventory.list();
      if (result === null || typeof result !== 'object') throw new Error('pluginInventory returned no snapshot');
      if (result.ok !== true) {
        const code = result.error && result.error.code ? result.error.code : 'error';
        const message = result.error && result.error.message ? result.error.message : 'unknown failure';
        throw new Error(`${code}: ${message}`);
      }
      const snapshot = result.value === null || typeof result.value !== 'object' ? {} : result.value;
      const presets = Array.isArray(snapshot.agentPresets) ? snapshot.agentPresets : [];
      const preset =
        presets.find((candidate) => candidate.id === presetId) ||
        presets.find((candidate) => candidate.isDefault === true) ||
        presets[0];
      const presetRows = preset !== undefined && Array.isArray(preset.rows) ? preset.rows : [];

      const plugins = [];
      const presetMcp = [];
      for (const row of presetRows) {
        if (row === null || typeof row !== 'object') continue;
        if (row.enabled === false) continue;
        const common = {
          key: `row#${String(row.entryId ?? row.moduleName ?? '')}`,
          title: textOf(row.meta && row.meta.title, resolveText) || shortModule(row.moduleName) || String(row.moduleName ?? ''),
          description: textOf(row.meta && row.meta.description, resolveText),
          moduleName: typeof row.moduleName === 'string' ? row.moduleName : '',
          entryId: cleanEntryId(row.entryId),
          state: row.fiberPhase === 'failed' ? 'failed' : row.enabled === 'conditional' ? 'conditional' : 'mounted',
          global: false,
        };
        if (isMcpRow(row.moduleName)) {
          // The MCP bridge package title is shared by every server, so the row id
          // names the configured server instead.
          presetMcp.push({
            ...common,
            title: cleanEntryId(row.entryId) || shortModule(row.moduleName),
            description: undefined,
            enabled: true,
            editable: false,
            reasonKey: 'readOnlyPreset',
          });
        } else plugins.push(common);
      }

      return {
        presetName: preset === undefined ? undefined : typeof preset.name === 'string' && preset.name !== '' ? preset.name : preset.id,
        presetIsDefault: preset === undefined ? false : preset.isDefault === true,
        plugins,
        presetMcp,
      };
    }

    /**
     * Read the profile-side rows the plugin manager can actually persist:
     * MCP servers (togglable) and installed plugin bundles (togglable).
     */
    async function readManagerRows(ctx, resolveText) {
      const remote = ctx.remote;
      const manager = remote === undefined || remote === null ? undefined : remote.pluginManager;
      if (manager === undefined || typeof manager.listPlugins !== 'function') throw new Error('pluginManager remote is unavailable');

      const pluginsResult = await manager.listPlugins();
      if (pluginsResult === null || typeof pluginsResult !== 'object' || pluginsResult.ok !== true) {
        const code = pluginsResult && pluginsResult.error ? pluginsResult.error.code : 'error';
        throw new Error(`pluginManager/listPlugins failed: ${code}`);
      }
      const rows = Array.isArray(pluginsResult.value) ? pluginsResult.value : [];
      const mcp = [];
      for (const row of rows) {
        if (row === null || typeof row !== 'object' || !isMcpRow(row.moduleName)) continue;
        if (mcp.length >= ROW_LIMIT) break;
        const reason = typeof row.readOnlyReason === 'string' ? row.readOnlyReason : undefined;
        // `meta.title` on this package is a shared constant, so the configured
        // patch id (the `include:` entry id) is the only per-server name here.
        const title = cleanEntryId(row.entryId) || shortModule(row.moduleName) || String(row.moduleName ?? '');
        mcp.push({
          key: `mcp#${String(row.entryId ?? row.moduleName)}`,
          name: typeof row.entryId === 'string' ? row.entryId : String(row.moduleName ?? ''),
          title,
          description: undefined,
          moduleName: typeof row.moduleName === 'string' ? row.moduleName : '',
          entryId: typeof row.entryId === 'string' ? row.entryId : '',
          enabled: row.enabled === true,
          editable: reason === undefined && typeof row.patchId === 'string',
          reasonKey: readOnlyKey(reason),
        });
      }

      let bundles = [];
      let bundlesError;
      try {
        if (typeof manager.listBundles !== 'function') throw new Error('pluginManager/listBundles is unavailable');
        const bundlesResult = await manager.listBundles();
        if (bundlesResult === null || typeof bundlesResult !== 'object' || bundlesResult.ok !== true) {
          throw new Error('pluginManager/listBundles failed');
        }
        const list = Array.isArray(bundlesResult.value) ? bundlesResult.value : [];
        bundles = list
          .filter((bundle) => bundle !== null && typeof bundle === 'object' && bundle.installed === true && typeof bundle.name === 'string')
          .map((bundle) => {
            const reason = typeof bundle.readOnlyReason === 'string' ? bundle.readOnlyReason : undefined;
            const meta = bundle.meta !== null && typeof bundle.meta === 'object' ? bundle.meta : {};
            const rowCount = Array.isArray(bundle.rows) ? bundle.rows.length : 0;
            return {
              key: `bundle#${bundle.name}`,
              name: bundle.name,
              title: textOf(meta.title, resolveText) || shortModule(bundle.name) || bundle.name,
              description: textOf(meta.description, resolveText) || (typeof bundle.description === 'string' ? bundle.description : ''),
              enabled: bundle.enabled === true,
              editable: reason === undefined && bundle.availability !== 'missing',
              reasonKey: readOnlyKey(reason),
              version: typeof bundle.version === 'string' ? bundle.version : undefined,
              rowCount,
            };
          });
      } catch (error) {
        bundlesError = errorText(error);
      }

      return { mcp, bundles, bundlesError };
    }

    /** Read the current session's skill catalog; any transport or state failure yields no skills. */
    async function loadSkills(ctx, sessionId) {
      if (typeof sessionId !== 'string' || sessionId === '') return [];
      try {
        // `remote.skills` is a generated `remote.<namespace>` Service: reading it
        // without the matching `inject` entry throws, so the whole read stays inside
        // the try even though this section only degrades the panel.
        const skillsRemote = ctx.remote === undefined || ctx.remote === null ? undefined : ctx.remote.skills;
        if (skillsRemote === undefined || typeof skillsRemote.list !== 'function') return [];
        const result = await ctx.sessions.using(sessionId, { source: 'sessionPluginView' }, async (reference) => {
          const state = reference.binding.session.getSnapshot();
          if (state.openState !== 'open') return undefined;
          return await skillsRemote.list({ sessionId });
        });
        if (result === undefined || result === null || result.ok !== true) return [];
        const list = result.value !== null && typeof result.value === 'object' && Array.isArray(result.value.skills) ? result.value.skills : [];
        const packed = [];
        for (const skill of list) {
          if (skill === null || typeof skill !== 'object' || typeof skill.name !== 'string') continue;
          packed.push({
            key: `skill#${skill.name}`,
            title: skill.name,
            description: typeof skill.description === 'string' ? skill.description : undefined,
            manualOnly: skill.modelInvocable === false,
            path: typeof skill.path === 'string' ? skill.path : undefined,
          });
        }
        return packed;
      } catch {
        return [];
      }
    }

    /** Build the whole panel snapshot for one session. */
    async function loadSnapshot(ctx, sessionId, presetId, resolveText) {
      const errors = {};
      let inventory = { presetName: undefined, presetIsDefault: false, plugins: [], presetMcp: [] };
      try {
        inventory = await readInventory(ctx, presetId, resolveText);
      } catch (error) {
        errors.inventory = errorText(error);
      }

      let manager = { mcp: [], bundles: [] };
      try {
        manager = await readManagerRows(ctx, resolveText);
        if (manager.bundlesError !== undefined) errors.bundles = manager.bundlesError;
      } catch (error) {
        errors.manager = errorText(error);
      }

      const skills = await loadSkills(ctx, sessionId);

      const mcp = [];
      const seen = new Set();
      const identityOf = (row) => cleanEntryId(row.entryId) ?? row.moduleName;
      for (const row of manager.mcp) {
        const identity = identityOf(row);
        if (seen.has(identity)) continue;
        seen.add(identity);
        mcp.push(row);
      }
      for (const row of inventory.presetMcp) {
        const identity = identityOf(row);
        if (seen.has(identity)) continue;
        seen.add(identity);
        mcp.push(row);
      }

      return {
        presetName: inventory.presetName,
        presetIsDefault: inventory.presetIsDefault,
        plugins: inventory.plugins,
        mcp,
        skills,
        bundles: manager.bundles,
        errors,
      };
    }

    /** Small leading glyph: a plugin block with one live seat. */
    function LeadingIcon() {
      return h(
        'svg',
        { viewBox: '0 0 16 16', width: 15, height: 15, 'aria-hidden': 'true', style: { display: 'block' } },
        h('rect', { x: 1.6, y: 1.6, width: 5.2, height: 5.2, rx: 1.3, fill: 'none', stroke: 'currentColor', strokeWidth: 1.2 }),
        h('rect', { x: 9.2, y: 1.6, width: 5.2, height: 5.2, rx: 1.3, fill: 'none', stroke: 'currentColor', strokeWidth: 1.2 }),
        h('rect', { x: 1.6, y: 9.2, width: 5.2, height: 5.2, rx: 1.3, fill: 'none', stroke: 'currentColor', strokeWidth: 1.2 }),
        h('circle', { cx: 11.8, cy: 11.8, r: 2.1, fill: 'currentColor' }),
      );
    }

    /** Refresh glyph for the panel header. */
    function RefreshIcon() {
      return h(
        'svg',
        { viewBox: '0 0 16 16', width: 13, height: 13, 'aria-hidden': 'true', style: { display: 'block' } },
        h('path', {
          d: 'M13.2 8a5.2 5.2 0 1 1-1.6-3.76M13.4 1.9v3.1h-3.1',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.3,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
      );
    }

    /** One section header with its row count. */
    function GroupTitle({ label, count }) {
      return h('h3', { className: 'spv-groupTitle' }, [
        h('span', { key: 'label' }, label),
        h('span', { key: 'count', className: 'spv-count' }, String(count)),
      ]);
    }

    /** One state pill naming a session plugin row. */
    function StateTag({ state, t }) {
      const table = {
        mounted: { tone: 'mount', label: t('tagMounted') },
        conditional: { tone: 'warn', label: t('tagConditional') },
        failed: { tone: 'error', label: t('tagFailed') },
        disabled: { tone: 'idle', label: t('tagDisabled') },
      };
      const entry = table[state] === undefined ? table.disabled : table[state];
      return h('span', { className: 'spv-tag', 'data-tone': entry.tone }, entry.label);
    }

    /** One toggle switch matching the host's on/off control. */
    function Switch({ checked, disabled, label, title, onChange }) {
      return h(
        'button',
        {
          type: 'button',
          role: 'switch',
          'aria-checked': checked,
          'aria-label': label,
          title,
          className: 'spv-switch',
          disabled,
          onClick: () => {
            if (disabled) return;
            onChange(!checked);
          },
        },
        h('span', { className: 'spv-knob' }),
      );
    }

    /** One MCP server row: state dot, identity, and the enable switch. */
    function McpRow({ item, t, onToggle }) {
      const reason = item.reasonKey === undefined ? undefined : t(item.reasonKey);
      return h('div', { className: 'spv-row' }, [
        h('span', { key: 'dot', className: 'spv-dot', 'data-tone': item.enabled ? 'on' : undefined }),
        h('span', { key: 'main', className: 'spv-rowMain' }, [
          h('span', { key: 'name', className: 'spv-rowName', title: item.moduleName }, item.title),
          item.description === '' ? null : h('span', { key: 'sub', className: 'spv-rowSub', title: item.description }, item.description),
        ]),
        h(
          'span',
          { key: 'end', className: 'spv-rowEnd' },
          h(Switch, {
            checked: item.enabled,
            disabled: !item.editable,
            label: `${t(item.enabled ? 'disable' : 'enable')}: ${item.title}`,
            title: item.editable ? (item.enabled ? t('disable') : t('enable')) : reason,
            onChange: (next) => onToggle('plugin', item, next),
          }),
        ),
      ]);
    }

    /** One skill row: identity, description, and the manual-only marker. */
    function SkillRow({ item, t }) {
      return h('div', { className: 'spv-row' }, [
        h('span', { key: 'dot', className: 'spv-dot', 'data-tone': 'on' }),
        h('span', { key: 'main', className: 'spv-rowMain' }, [
          h('span', { key: 'name', className: 'spv-rowName', title: item.path ?? item.title }, item.title),
          item.description === undefined ? null : h('span', { key: 'sub', className: 'spv-rowSub', title: item.description }, item.description),
        ]),
        item.manualOnly ? h('span', { key: 'manual', className: 'spv-tag' }, t('manualOnly')) : null,
      ]);
    }

    /** One installed bundle row with its bundle-level switch. */
    function BundleRow({ item, t, onToggle }) {
      const reason = item.reasonKey === undefined ? undefined : t(item.reasonKey);
      const sub = [
        item.description,
        item.version === undefined ? undefined : t('version', { version: item.version }),
        item.rowCount === 0 ? undefined : t('rows', { count: String(item.rowCount) }),
      ].filter((part) => typeof part === 'string' && part !== '').join(' · ');
      return h('div', { className: 'spv-row' }, [
        h('span', { key: 'dot', className: 'spv-dot', 'data-tone': item.enabled ? 'on' : undefined }),
        h('span', { key: 'main', className: 'spv-rowMain' }, [
          h('span', { key: 'name', className: 'spv-rowName', title: item.name }, item.title),
          sub === '' ? null : h('span', { key: 'sub', className: 'spv-rowSub', title: sub }, sub),
        ]),
        h(
          'span',
          { key: 'end', className: 'spv-rowEnd' },
          h(Switch, {
            checked: item.enabled,
            disabled: !item.editable,
            label: `${t(item.enabled ? 'disable' : 'enable')}: ${item.title}`,
            title: item.editable ? (item.enabled ? t('disable') : t('enable')) : reason,
            onChange: (next) => onToggle('bundle', item, next),
          }),
        ),
      ]);
    }

    /** One session plugin row: state tag only, since a preset composition is read-only here. */
    function SessionPluginRow({ item, t }) {
      return h('div', { className: 'spv-row' }, [
        h('span', { key: 'dot', className: 'spv-dot', 'data-tone': item.state === 'failed' ? 'error' : item.state === 'mounted' ? 'on' : 'warn' }),
        h('span', { key: 'main', className: 'spv-rowMain' }, [
          h('span', { key: 'name', className: 'spv-rowName', title: item.moduleName }, item.title),
          item.description === undefined ? null : h('span', { key: 'sub', className: 'spv-rowSub', title: item.description }, item.description),
        ]),
        h('span', { key: 'end', className: 'spv-rowEnd' }, h(StateTag, { state: item.state, t })),
      ]);
    }

    /** One tab button in the header row. */
    function Tab({ tab, active, onSelect }) {
      return h(
        'button',
        {
          type: 'button',
          role: 'tab',
          'aria-selected': active,
          className: 'spv-tab',
          onClick: () => onSelect(tab.id),
        },
        [
          h('span', { key: 'count', className: 'spv-tabCount' }, String(tab.count)),
          h('span', { key: 'label' }, tab.label),
        ],
      );
    }

    /** The whole MCP tab body. */
    function McpTab({ snapshot, t, onToggle }) {
      if (snapshot.errors.manager !== undefined) return h(ErrorBanner, { text: snapshot.errors.manager, t });
      const items = snapshot.mcp;
      if (items.length === 0) return h('p', { className: 'spv-note' }, t('emptyMcp'));
      return h('div', { className: 'spv-group' }, [
        h(GroupTitle, { key: 'title', label: t('groupMcp'), count: items.length }),
        ...items.map((item) => h(McpRow, { key: item.key, item, t, onToggle })),
      ]);
    }

    /** The whole skills tab body. */
    function SkillsTab({ snapshot, t }) {
      const items = snapshot.skills;
      if (items.length === 0) return h('p', { className: 'spv-note' }, t('emptySkills'));
      return h('div', { className: 'spv-group' }, [
        h(GroupTitle, { key: 'title', label: t('groupSkills'), count: items.length }),
        ...items.map((item) => h(SkillRow, { key: item.key, item, t })),
      ]);
    }

    /** The whole plugins tab body: installed bundles first, then session usage. */
    function PluginsTab({ snapshot, t, onToggle }) {
      const sections = [];
      if (snapshot.errors.bundles !== undefined) {
        sections.push(h(ErrorBanner, { key: 'bundleError', text: snapshot.errors.bundles, t }));
      } else if (snapshot.bundles.length === 0) {
        sections.push(h('p', { key: 'emptyBundles', className: 'spv-note' }, t('emptyBundles')));
      } else {
        sections.push(
          h('div', { key: 'bundles', className: 'spv-group' }, [
            h(GroupTitle, { key: 'title', label: t('groupBundles'), count: snapshot.bundles.length }),
            ...snapshot.bundles.map((item) => h(BundleRow, { key: item.key, item, t, onToggle })),
          ]),
        );
      }

      if (snapshot.errors.inventory !== undefined) {
        sections.push(h(ErrorBanner, { key: 'inventoryError', text: snapshot.errors.inventory, t }));
      } else if (snapshot.plugins.length === 0) {
        sections.push(h('p', { key: 'emptyPlugins', className: 'spv-note' }, t('emptyPlugins')));
      } else {
        sections.push(
          h('div', { key: 'session', className: 'spv-group' }, [
            h(GroupTitle, { key: 'title', label: t('groupSession'), count: snapshot.plugins.length }),
            ...snapshot.plugins.map((item) => h(SessionPluginRow, { key: item.key, item, t })),
          ]),
        );
      }
      return sections;
    }

    /** Inline failure banner with an optional retry action. */
    function ErrorBanner({ text, t, onRetry }) {
      return h('div', { className: 'spv-banner' }, [
        h('span', { key: 'text', className: 'spv-bannerText', title: text }, text),
        typeof onRetry === 'function' ? h('button', { key: 'retry', type: 'button', className: 'spv-button', onClick: onRetry }, t('retry')) : null,
      ]);
    }

    /** The header trigger plus the dropdown panel. */
    function SessionPluginView(props) {
      const t = typeof props.t === 'function' ? props.t : (key) => key;
      const resolveText = typeof props.resolveText === 'function' ? props.resolveText : (value) => (typeof value === 'string' ? value : '');
      const load = typeof props.load === 'function' ? props.load : () => Promise.reject(new Error('no loader'));
      const sessionId = typeof props.sessionId === 'string' ? props.sessionId : undefined;

      const [open, setOpen] = React.useState(false);
      const [tab, setTab] = React.useState('mcp');
      const [request, setRequest] = React.useState(0);
      const [state, setState] = React.useState({ status: 'idle' });
      const [busy, setBusy] = React.useState('');
      const [notice, setNotice] = React.useState(undefined);
      const [anchor, setAnchor] = React.useState(undefined);
      const buttonRef = React.useRef(null);
      const panelRef = React.useRef(null);

      let presetSource;
      try {
        presetSource = typeof props.useProjection === 'function' ? props.useProjection('agentPreset') : undefined;
      } catch {
        presetSource = undefined;
      }

      const placePanel = () => {
        const node = buttonRef.current;
        if (node === null || node === undefined || typeof window === 'undefined') return;
        const rect = node.getBoundingClientRect();
        const width = 360;
        const minLeft = 8;
        const maxLeft = Math.max(minLeft, Math.round(window.innerWidth - width - 8));
        setAnchor({
          left: Math.min(Math.max(minLeft, Math.round(rect.right - width)), maxLeft),
          top: Math.max(8, Math.round(rect.bottom + 8)),
        });
      };

      // The header row establishes layout containment (`container-type: inline-size`),
      // which makes it the containing block for `position: fixed` descendants and
      // clips them, so the panel is portalled to `document.body` and placed from the
      // trigger rect instead of relying on an ancestor.
      React.useLayoutEffect(() => {
        if (!open) {
          setAnchor(undefined);
          return undefined;
        }
        placePanel();
        const onLayout = () => placePanel();
        window.addEventListener('resize', onLayout);
        window.addEventListener('scroll', onLayout, true);
        return () => {
          window.removeEventListener('resize', onLayout);
          window.removeEventListener('scroll', onLayout, true);
        };
      }, [open]);

      React.useEffect(() => {
        if (!open) return undefined;
        const onPointerDown = (event) => {
          const panel = panelRef.current;
          const button = buttonRef.current;
          const target = event.target;
          if (panel !== null && panel !== undefined && panel.contains(target)) return;
          if (button !== null && button !== undefined && button.contains(target)) return;
          setOpen(false);
        };
        const onKeyDown = (event) => {
          if (event.key !== 'Escape') return;
          event.preventDefault();
          setOpen(false);
          const button = buttonRef.current;
          if (button !== null && button !== undefined && typeof button.focus === 'function') button.focus();
        };
        document.addEventListener('pointerdown', onPointerDown, true);
        document.addEventListener('keydown', onKeyDown, true);
        return () => {
          document.removeEventListener('pointerdown', onPointerDown, true);
          document.removeEventListener('keydown', onKeyDown, true);
        };
      }, [open]);

      React.useEffect(() => {
        if (!open) return undefined;
        let current = true;
        setState((previous) => (previous.status === 'ready' ? { status: 'ready', snapshot: previous.snapshot, refreshing: true } : { status: 'loading' }));
        setNotice(undefined);
        Promise.resolve()
          .then(() => load({ presetId: projectionValue(presetSource) }))
          .then(
            (snapshot) => {
              if (current) setState({ status: 'ready', snapshot });
            },
            (error) => {
              if (current) setState({ status: 'error', message: errorText(error) });
            },
          );
        return () => {
          current = false;
        };
        // `presetSource` is a live projection source; `load` is stable per registration.
      }, [open, request, sessionId]);

      const snapshot = state.status === 'ready' ? state.snapshot : undefined;
      const mcp = snapshot === undefined ? [] : snapshot.mcp;
      const skills = snapshot === undefined ? [] : snapshot.skills;
      const bundles = snapshot === undefined ? [] : snapshot.bundles;
      const plugins = snapshot === undefined ? [] : snapshot.plugins;
      const presetLabel =
        snapshot === undefined
          ? undefined
          : snapshot.presetName === undefined
            ? undefined
            : t('preset', { name: snapshot.presetIsDefault ? `${snapshot.presetName} · ${t('defaultPreset')}` : snapshot.presetName });

      const tabs = [
        { id: 'mcp', label: t('tabMcp'), count: mcp.length },
        { id: 'skills', label: t('tabSkills'), count: skills.length },
        { id: 'plugins', label: t('tabPlugins'), count: bundles.length },
      ];
      const activeTab = tabs.some((entry) => entry.id === tab) ? tab : 'mcp';

      const onToggle = (kind, item, enabled) => {
        const action = kind === 'bundle' ? props.setBundleEnabled : props.setPluginEnabled;
        if (typeof action !== 'function') {
          setNotice({ tone: 'error', text: t('toggleUnavailable') });
          return;
        }
        const target = kind === 'bundle' ? item.name : item.entryId;
        setBusy(item.key);
        setNotice(undefined);
        Promise.resolve()
          .then(() => action(target, enabled))
          .then((change) => {
            const application = change !== null && typeof change === 'object' ? change.application : undefined;
            if (application === 'restart-required') setNotice({ tone: 'warn', text: t('restartRequired') });
            else if (application === 'overridden') setNotice({ tone: 'warn', text: t('overridden') });
            setRequest((value) => value + 1);
          })
          .catch((error) => {
            setNotice({ tone: 'error', text: t('toggleFailed', { message: errorText(error) }) });
            setRequest((value) => value + 1);
          })
          .then(() => {
            setBusy('');
          });
      };

      const toggleWithBusy = (kind, item, enabled) => {
        if (busy === item.key) return;
        onToggle(kind, item, enabled);
      };

      const body = [];
      if (state.status === 'error') {
        body.push(h(ErrorBanner, { key: 'error', text: state.message === undefined ? t('error') : `${t('error')} · ${state.message}`, t, onRetry: () => setRequest((value) => value + 1) }));
      } else if (state.status === 'loading' || state.status === 'idle') {
        body.push(h('p', { key: 'loading', className: 'spv-note', role: 'status' }, t('loading')));
      } else if (activeTab === 'mcp') {
        body.push(h(McpTab, { key: 'mcp', snapshot, t, onToggle: toggleWithBusy }));
      } else if (activeTab === 'skills') {
        body.push(h(SkillsTab, { key: 'skills', snapshot, t }));
      } else {
        body.push(h(PluginsTab, { key: 'plugins', snapshot, t, onToggle: toggleWithBusy }));
      }

      const refresh = () => {
        setRequest((value) => value + 1);
      };

      const panelElement =
        open === false
          ? null
          : h(
              'div',
              {
                key: 'panel',
                ref: panelRef,
                className: 'spv-panel',
                role: 'dialog',
                'aria-label': t('toggle'),
                style: anchor === undefined ? { visibility: 'hidden', top: '0px', left: '0px' } : { top: `${anchor.top}px`, left: `${anchor.left}px` },
              },
              [
                h('div', { key: 'tabs', className: 'spv-tabs', role: 'tablist' }, [
                  ...tabs.map((entry) => h(Tab, { key: entry.id, tab: entry, active: entry.id === activeTab, onSelect: setTab })),
                  h('span', { key: 'filler', className: 'spv-tabFiller' }),
                  h(
                    'button',
                    {
                      key: 'refresh',
                      type: 'button',
                      className: 'spv-iconButton',
                      title: t('refresh'),
                      'aria-label': t('refresh'),
                      disabled: state.status === 'loading',
                      onClick: refresh,
                    },
                    h(RefreshIcon, {}),
                  ),
                  presetLabel === undefined ? null : h('span', { key: 'preset', className: 'spv-visually-hidden' }, presetLabel),
                ]),
                notice === undefined
                  ? null
                  : h('div', { key: 'notice', className: 'spv-banner', 'data-tone': notice.tone }, h('span', { key: 'text', className: 'spv-bannerText' }, notice.text)),
                h('div', { key: 'body', className: 'spv-body' }, body),
              ],
            );
      const portalHost = typeof document === 'undefined' ? undefined : document.body;
      const panel = panelElement === null ? null : portalHost === undefined ? panelElement : ReactDOM.createPortal(panelElement, portalHost);

      return h('div', { className: 'spv-root' }, [
        h(
          'button',
          {
            key: 'trigger',
            ref: buttonRef,
            type: 'button',
            className: 'spv-trigger',
            'aria-expanded': open,
            'aria-haspopup': 'dialog',
            title: t('toggle'),
            'aria-label': t('toggle'),
            onClick: () => {
              setOpen((value) => !value);
            },
          },
          h(LeadingIcon, {}),
        ),
        panel,
      ]);
    }

    /**
     * Services the header trigger and its data reads require.
     *
     * `remote.pluginInventory`, `remote.skills` and `remote.pluginManager` are
     * generated `remote.<namespace>` Services, not plain properties of
     * `ctx.remote`: Cordis only resolves such a child service for a fiber that
     * names it in `inject`, and an undeclared read throws
     * `cannot get property "<name>" without inject`.
     */
    const inject = ['slots', 'locale', 'remote', 'remote.pluginInventory', 'remote.skills', 'remote.pluginManager', 'sessions'];

    /**
     * Client plugin body: register dictionaries, the panel stylesheet, and the
     * conversation-header trigger.
     * @param ctx - Client root context.
     */
    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'session-plugin-view: dictionaries');

      ctx.effect(() => {
        if (typeof document === 'undefined') return () => {};
        const styleId = '@local/session-plugin-view/styles';
        if (document.querySelector(`style[data-plugin-css="${styleId}"]`) !== null) return () => {};
        const tag = document.createElement('style');
        tag.dataset.plugin = '@local/session-plugin-view';
        tag.dataset.pluginCss = styleId;
        tag.textContent = CSS;
        document.head.appendChild(tag);
        return () => {
          tag.remove();
        };
      }, 'session-plugin-view: styles');

      const resolveText = (value) => {
        try {
          const resolved = ctx.locale.resolveText(value);
          return typeof resolved === 'string' ? resolved : '';
        } catch {
          return typeof value === 'string' ? value : '';
        }
      };

      /**
       * Normalize one plugin-manager change envelope.
       *
       * Transport and schema failures arrive as `ok === false`; business failures
       * (unknown row, read-only row, …) arrive in-band as
       * `application: 'failed'` with `error.code`. Both become thrown errors so the
       * component can show one failure notice.
       */
      const unwrapChange = (result) => {
        if (result === null || typeof result !== 'object' || result.ok !== true) {
          const code = result && result.error ? result.error.code : 'error';
          const message = result && result.error ? result.error.message : 'unknown failure';
          throw new Error(`${code}: ${message}`);
        }
        const value = result.value !== null && typeof result.value === 'object' ? result.value : {};
        if (value.application === 'failed') {
          const code = value.error !== undefined && value.error !== null && typeof value.error.code === 'string' ? value.error.code : 'operation-error';
          throw new Error(code);
        }
        if (value.application === 'cancelled') throw new Error('cancelled');
        return value;
      };

      const setPluginEnabled = async (entryId, enabled) => unwrapChange(await ctx.remote.pluginManager.setPluginEnabled(entryId, enabled));

      const setBundleEnabled = async (name, enabled) => unwrapChange(await ctx.remote.pluginManager.setBundleEnabled(name, enabled));

      ctx.slots.inject('conversation.session.header.utilities', () => ctx.slots.register({
        name: 'conversation.session.header.utilities',
        id: 'session-plugin-view',
        order: 20,
        locale: NS,
        inject: (sessionId) => ({
          resolveText,
          load: (options) => loadSnapshot(
            ctx,
            sessionId,
            options !== undefined && typeof options === 'object' ? options.presetId : undefined,
            resolveText,
          ),
          setPluginEnabled,
          setBundleEnabled,
        }),
      }, SessionPluginView));
    }

    return { inject, apply };
  },
});
