#!/usr/bin/env node
// Build the publishable npm package and a format-1 plugin-market index for
// `session-plugin-view`.
//
// Two outputs:
//   publish/dist/npm/     -> `npm publish` this directory (public package)
//   publish/dist/market/  -> serve this directory as your own market index
//
// Usage:
//   node publish/prepare.mjs --name dsh-plugin-session-view \
//     --author "Your Name" --repo https://github.com/you/dsh-plugin-session-view
//
// Optional flags:
//   --version 1.0.0              default: source package.json version
//   --license MIT                default: MIT
//   --category interface         market category id (default: interface)
//   --market-title "My DSH Plugins"
//   --timestamp 1793072838       market publishTimestamp (default: npm time of
//                                --version when reachable, else now in seconds)
//   --all-versions               list every published npm version in the index
//   --dsh-range ">=0.2.1-rc.3 <0.3.0-0"
//   --dry-run                    build and validate without querying npm
//
// The script is dependency-free and only reads the plugin sources next to it.
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PLUGIN_DIR = resolve(HERE, '..');
const DIST = join(HERE, 'dist');
const NPM_DIR = join(DIST, 'npm');
const MARKET_DIR = join(DIST, 'market');

const DEFAULT_DSH_RANGE = '>=0.2.1-rc.3 <0.3.0-0';
const DEFAULT_NAME = 'dsh-plugin-session-view';

function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      args._.push(token);
      continue;
    }
    const [rawKey, inline] = token.slice(2).split('=');
    const key = rawKey.replace(/-([a-z])/gu, (_, letter) => letter.toUpperCase());
    if (inline !== undefined) args[key] = inline;
    else if (argv[index + 1] !== undefined && !argv[index + 1].startsWith('--')) args[key] = argv[++index];
    else args[key] = true;
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const source = JSON.parse(await readFile(join(PLUGIN_DIR, 'package.json'), 'utf8'));
const name = typeof args.name === 'string' ? args.name : DEFAULT_NAME;
const version = typeof args.version === 'string' ? args.version : source.version;
const author = typeof args.author === 'string' ? args.author : '';
const repo = typeof args.repo === 'string' ? args.repo.replace(/\.git$/u, '') : '';
const license = typeof args.license === 'string' ? args.license : 'MIT';
const category = typeof args.category === 'string' ? args.category : 'interface';
const dshRange = typeof args.dshRange === 'string' ? args.dshRange : DEFAULT_DSH_RANGE;
const marketTitle = typeof args.marketTitle === 'string' ? args.marketTitle : 'My DSH Plugins';
const marketTitleZh = typeof args.marketTitleZh === 'string' ? args.marketTitleZh : (typeof args.marketTitle === 'string' ? args.marketTitle : '我的 DSH 插件源');
const marketDescription = typeof args.marketDescription === 'string'
  ? args.marketDescription
  : 'DSH plugins published from this repository.';
const marketDescriptionZh = typeof args.marketDescriptionZh === 'string'
  ? args.marketDescriptionZh
  : (typeof args.marketDescription === 'string' ? args.marketDescription : '来自本仓库的 DSH 插件。');
const dryRun = args.dryRun === true;
const warnings = [];

/** npm package name rule from the DSH market validator. */
const PACKAGE_NAME = /^(?:@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*$/u;
/** Exact SemVer 2.0.0 version. */
const SEMVER = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:\d*[a-zA-Z-][0-9a-zA-Z-]*|0|[1-9]\d*)(?:\.(?:\d*[a-zA-Z-][0-9a-zA-Z-]*|0|[1-9]\d*))*)?(?:\+[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*)?$/u;

if (!PACKAGE_NAME.test(name)) throw new Error(`--name ${JSON.stringify(name)} is not a valid npm package name`);
if (!SEMVER.test(version)) throw new Error(`--version ${JSON.stringify(version)} is not an exact SemVer version`);
if (!author) warnings.push('缺少 --author：LICENSE 与 npm author 字段会留空，dshopen 要求明确的许可证，发布前请补上。');
if (!repo) warnings.push('缺少 --repo：npm repository 与市场 index 的 repository 字段会留空，dshopen 要求公开源码仓库。');

/** Minimal format-1 market index validation, mirroring DSH's validator. */
function validateIndex(index, indexUrl) {
  const problem = (path, reason) => {
    throw new Error(`market index invalid: ${path} ${reason}`);
  };
  const localized = (value, path) => {
    if (typeof value === 'string') return;
    if (typeof value !== 'object' || value === null || Array.isArray(value)) problem(path, 'must be a string or a localized object');
    if (typeof value.en !== 'string' || value.en.trim() === '') problem(path, 'must contain a non-empty en');
  };
  if (index.format !== 1) problem('$.format', 'must be 1');
  localized(index.title, '$.title');
  if (index.description !== undefined) localized(index.description, '$.description');
  const declaredCategories = Object.keys(index.metadata?.categories ?? {});
  if (!Array.isArray(index.plugins) || index.plugins.length === 0) problem('$.plugins', 'must be a non-empty array');
  const seen = new Set();
  index.plugins.forEach((pluginEntry, position) => {
    const at = `$.plugins[${position}]`;
    if (typeof pluginEntry.name !== 'string' || !PACKAGE_NAME.test(pluginEntry.name)) problem(`${at}.name`, 'must be a valid npm package name');
    if (seen.has(pluginEntry.name)) problem(`${at}.name`, `duplicates ${pluginEntry.name}`);
    seen.add(pluginEntry.name);
    if (pluginEntry.title !== undefined) localized(pluginEntry.title, `${at}.title`);
    if (pluginEntry.description !== undefined) localized(pluginEntry.description, `${at}.description`);
    if (pluginEntry.homepage !== undefined) {
      if (!URL.canParse(pluginEntry.homepage) || !/^https?:$/u.test(new URL(pluginEntry.homepage).protocol)) problem(`${at}.homepage`, 'must be an absolute http(s) URL');
    }
    if (pluginEntry.repository !== undefined) {
      if (!URL.canParse(pluginEntry.repository.url) || !/^https?:$/u.test(new URL(pluginEntry.repository.url).protocol)) problem(`${at}.repository.url`, 'must be an absolute http(s) URL');
    }
    if (pluginEntry.icon !== undefined) {
      const icon = pluginEntry.icon;
      if (icon.startsWith('data:')) {
        if (!/^data:image\/(?:svg\+xml|png|jpeg|webp);base64,[A-Za-z0-9+/]*={0,2}$/u.test(icon)) problem(`${at}.icon`, 'must be a base64 SVG/PNG/JPEG/WebP data URL');
      } else {
        const resolved = new URL(icon, indexUrl);
        if (resolved.protocol !== 'https:' && resolved.origin !== new URL(indexUrl).origin) problem(`${at}.icon`, 'must resolve to https or the index origin');
      }
    }
    const meta = pluginEntry.metadata ?? {};
    if (meta.category !== undefined && !declaredCategories.includes(meta.category)) problem(`${at}.metadata.category`, 'references an undeclared category');
    if (!Array.isArray(pluginEntry.versions) || pluginEntry.versions.length === 0) problem(`${at}.versions`, 'must be a non-empty array');
    const versions = new Set();
    pluginEntry.versions.forEach((entry, entryPosition) => {
      const versionAt = `${at}.versions[${entryPosition}]`;
      if (typeof entry.version !== 'string' || !SEMVER.test(entry.version)) problem(`${versionAt}.version`, 'must be an exact SemVer version');
      if (versions.has(entry.version)) problem(`${versionAt}.version`, `duplicates ${entry.version}`);
      versions.add(entry.version);
      if (!Number.isInteger(entry.publishTimestamp) || entry.publishTimestamp < 0) problem(`${versionAt}.publishTimestamp`, 'must be an integer number of Unix seconds');
      const sourceEntry = entry.source ?? {};
      if (sourceEntry.type === 'npm') {
        if (sourceEntry.registry !== undefined && !/^https?:\/\//u.test(sourceEntry.registry)) problem(`${versionAt}.source.registry`, 'must be an http(s) URL');
      } else if (sourceEntry.type === 'git') {
        if (!/^https:\/\//u.test(sourceEntry.url ?? '')) problem(`${versionAt}.source.url`, 'must be an https repository URL');
        if (!/^[0-9a-f]{40}$/u.test(sourceEntry.commit ?? '')) problem(`${versionAt}.source.commit`, 'must be a 40-hex commit');
      } else {
        problem(`${versionAt}.source.type`, 'must be "npm" or "git"');
      }
      if (entry.engines?.dsh !== undefined) {
        if (typeof entry.engines.dsh !== 'string' || entry.engines.dsh.startsWith('workspace:')) problem(`${versionAt}.engines.dsh`, 'must be a SemVer range');
      }
    });
  });
}

/** Ask the npm registry for a version's publish time; returns undefined offline. */
async function npmPublishedAt(packageName, wantedVersion) {
  if (dryRun) return undefined;
  try {
    const url = `https://registry.npmjs.org/${packageName.replace('/', '%2F')}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return undefined;
    const document = await response.json();
    const time = document?.time?.[wantedVersion];
    if (typeof time !== 'string') return undefined;
    const epoch = Math.floor(new Date(time).getTime() / 1000);
    return Number.isFinite(epoch) ? epoch : undefined;
  } catch {
    return undefined;
  }
}

/** Every published npm version with its own publish time, when the registry answers. */
async function npmVersions(packageName) {
  if (dryRun) return undefined;
  try {
    const url = `https://registry.npmjs.org/${packageName.replace('/', '%2F')}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return undefined;
    const document = await response.json();
    if (document === null || typeof document !== 'object' || document.time === undefined) return undefined;
    const entries = [];
    for (const [publishedVersion, publishedAt] of Object.entries(document.time)) {
      if (publishedVersion === 'created' || publishedVersion === 'modified') continue;
      if (typeof publishedAt !== 'string' || !SEMVER.test(publishedVersion)) continue;
      const epoch = Math.floor(new Date(publishedAt).getTime() / 1000);
      if (Number.isFinite(epoch)) entries.push({ version: publishedVersion, publishTimestamp: epoch });
    }
    return entries.length === 0 ? undefined : entries;
  } catch {
    return undefined;
  }
}

const readme = `# 会话插件与能力 · Session Plugin View

> DeepSeek Harness 的会话级插件 / MCP / 技能面板：会话标题栏右上角一个小图标，展开即看当前会话用到的插件、MCP 服务与技能，并可直接开关 MCP 与插件包。

> A session-scoped plugin, MCP and skills panel for DeepSeek Harness, opened from a small icon at the top-right of the conversation header.

## 功能 / Features

- **MCP**：列出 profile 里配置的 MCP 服务（\`@deepseek-ai/dsh-mcp-client\` 条目），逐行开关，立即生效。
- **技能 / Skills**：列出当前会话可用技能及其说明、是否仅供手动调用。
- **插件 / Plugins**：「已安装插件包」可整体启停；「当前会话插件」显示预设组成的挂载状态（已挂载 / 条件启用 / 启动失败 / 已停用）。
- 面板挂到 \`document.body\`，点击外部或 Esc 关闭；只读行会说明不能修改的原因。

## 截图 / Screenshots

${repo ? `![插件页](${repo}/raw/main/docs/session-panel-plugins.png)\n\n![MCP 页](${repo}/raw/main/docs/session-panel-mcp.png)\n\n![技能页](${repo}/raw/main/docs/session-panel-skills.png)` : '_截图请放在仓库 docs/ 下（session-panel-plugins.png / session-panel-mcp.png / session-panel-skills.png）。_'}

## 安装 / Install

在 DSH 的「插件 → 发现」里搜索 \`${name}\`，或：

\`\`\`bash
dsh plugin --profile desktop add ${name}
\`\`\`

手动方式（开发）：\`dsh plugin --profile desktop add link:<本仓库绝对路径>\`。

## 兼容性 / Compatibility

- DSH \`${dshRange}\`
- 声明了 \`dsh.bundle.patch\`，可作为 bundle 安装。
- 面板写入配置的能力来自 \`pluginManager\`；MCP 服务本身需要在 profile 的 \`cordis.patch.yml\` 中先配置。

## 开发 / Development

仓库源码（npm 包不含测试脚本）：

\`\`\`bash
node smoke.mjs          # 无浏览器冒烟测试
\`\`\`

## 许可证 / License

${license}${author ? ` · Copyright (c) ${new Date().getFullYear()} ${author}` : ''}
`;

const mitLicense = `MIT License

Copyright (c) ${new Date().getFullYear()} ${author || 'TODO: author'}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

const publishedAt = (await npmPublishedAt(name, version)) ?? Math.floor(Date.now() / 1000);
const registryVersions = args.allVersions === true ? await npmVersions(name) : undefined;
const versions = registryVersions ?? [{ version, publishTimestamp: publishedAt }];
if (args.timestamp !== undefined) {
  const timestamp = Number(args.timestamp);
  if (!Number.isInteger(timestamp) || timestamp < 0) throw new Error('--timestamp must be Unix seconds');
  for (const entry of versions) if (entry.version === version) entry.publishTimestamp = timestamp;
}

// ---- npm package -----------------------------------------------------------
await rm(NPM_DIR, { recursive: true, force: true });
await mkdir(NPM_DIR, { recursive: true });
for (const file of ['index.js', 'client.js', 'icon.svg']) await cp(join(PLUGIN_DIR, file), join(NPM_DIR, file));
await cp(join(PLUGIN_DIR, 'locale'), join(NPM_DIR, 'locale'), { recursive: true });

const patchSource = await readFile(join(PLUGIN_DIR, 'cordis.patch.yml'), 'utf8');
const patch = patchSource.replace(
  /(^\s*name:\s*['"]?)([^'"\n]+)(['"]?\s*$)/mu,
  (_, before, _old, after) => `${before}${name}${after}`,
);
await writeFile(join(NPM_DIR, 'cordis.patch.yml'), patch);
await writeFile(join(NPM_DIR, 'README.md'), readme);
await writeFile(join(NPM_DIR, 'LICENSE'), license.toUpperCase() === 'MIT' ? mitLicense : `License: ${license}\n`);

const packageJson = {
  name,
  version,
  private: false,
  description: 'Session plugins, MCP servers and skills panel for DeepSeek Harness: a top-right header popover with per-item enable switches and session plugin usage.',
  type: 'module',
  license,
  ...(author ? { author } : {}),
  ...(repo ? { repository: { type: 'git', url: `git+${repo}.git` }, homepage: `${repo}#readme`, bugs: { url: `${repo}/issues` } } : {}),
  keywords: ['dsh', 'deepseek-harness', 'dsh-plugin', 'cordis', 'session', 'plugins', 'mcp', 'skills', 'ui', 'panel'],
  engines: { dsh: dshRange },
  exports: { '.': './index.js', './client': './client.js', './locale/*.json': './locale/*.json', './icon': './icon.svg' },
  files: ['index.js', 'client.js', 'cordis.patch.yml', 'locale/*.json', 'icon.svg'],
  dsh: {
    bundle: { patch: './cordis.patch.yml' },
    client: { platform: 'web', immediately: true, inject: ['@deepseek-ai/dsh-client-ui-conversation'] },
  },
};
await writeFile(join(NPM_DIR, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`);

// ---- market index ----------------------------------------------------------
await rm(MARKET_DIR, { recursive: true, force: true });
await mkdir(join(MARKET_DIR, 'icons'), { recursive: true });
const iconFile = `${name.replace(/\//gu, '__')}.svg`;
await cp(join(PLUGIN_DIR, 'icon.svg'), join(MARKET_DIR, 'icons', iconFile));

const indexUrl = 'https://example.com/index.json';
const index = {
  format: 1,
  title: { en: marketTitle, zh: marketTitleZh },
  description: { en: marketDescription, zh: marketDescriptionZh },
  metadata: {
    categories: { interface: { title: { en: 'Interface', zh: '界面' } }, tools: { title: { en: 'Tools', zh: '工具' } }, appearance: { title: { en: 'Appearance', zh: '外观' } } },
    labels: {},
    sortKeys: {},
  },
  plugins: [
    {
      name,
      title: { en: 'Session Plugin View', zh: '会话插件与能力' },
      description: {
        en: 'List the plugins, MCP servers and skills of the current session from the conversation header, with enable switches for MCP servers and plugin bundles.',
        zh: '从会话标题栏查看当前会话的插件、MCP 服务与技能，并可直接开关 MCP 服务与插件包。',
      },
      icon: `icons/${iconFile}`,
      ...(author ? { author } : {}),
      ...(repo ? { homepage: `${repo}#readme`, repository: { url: repo } } : {}),
      metadata: {
        category,
        keywords: ['dsh', 'deepseek-harness', 'dsh-plugin', 'session', 'plugins', 'mcp', 'skills', 'ui'],
        labels: [],
        sortKeys: {},
      },
      versions: versions
        .slice()
        .sort((left, right) => right.publishTimestamp - left.publishTimestamp)
        .map((entry) => ({
          version: entry.version,
          publishTimestamp: entry.publishTimestamp,
          source: { type: 'npm', registry: 'https://registry.npmjs.org/' },
          engines: { dsh: dshRange },
        })),
    },
  ],
};
validateIndex(index, indexUrl);
await writeFile(join(MARKET_DIR, 'index.json'), `${JSON.stringify(index, null, 2)}\n`);

// ---- report ----------------------------------------------------------------
const files = await readdir(NPM_DIR, { withFileTypes: true });
console.log(`\n✓ npm 包目录: ${NPM_DIR}`);
console.log(`  ${files.map((entry) => (entry.isDirectory() ? `${entry.name}/` : entry.name)).join(', ')}`);
console.log(`✓ 市场目录: ${MARKET_DIR}`);
console.log(`  index.json, icons/${name}.svg`);
console.log(`  version ${version} · publishTimestamp ${publishedAt} · dsh ${dshRange}`);
for (const warning of warnings) console.log(`  ⚠ ${warning}`);
console.log('\n下一步:');
console.log(`  1) cd "${NPM_DIR}" && npm publish --access public`);
console.log(`  2) 把 "${MARKET_DIR}" 推到任意静态托管（GitHub Pages / jsDelivr / 自己的服务器），`);
console.log('     再把它的 index.json 地址加进 DSH「发现 → 添加索引源」。');
console.log('  3) 提交收录到 dshopen.org: https://github.com/polang233/dsh-plugin-index/issues/new?template=plugin-add.yml');
