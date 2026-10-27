# 发布这个插件 / Publish this plugin

本目录把 `session-plugin-view` 打包成两种产物，对应两条发布路线：

| 产物 | 用途 |
| --- | --- |
| `publish/dist/npm/` | 一个可 `npm publish` 的公开包（`dsh-plugin-session-view`），带 `dsh.bundle.patch`、`dsh.client`、`./client` 与 `./icon` 导出 |
| `publish/dist/market/` | 一个 format 1 的插件市场 `index.json` + 图标，可托管成你自己的市场源 |

先生成一次（用你自己的信息替换占位符）：

```bash
node publish/prepare.mjs \
  --name dsh-plugin-session-view \
  --author "你的名字" \
  --repo https://github.com/你的账号/dsh-plugin-session-view
```

脚本会：

- 复制 `index.js` / `client.js` / `locale/` / `icon.svg`；
- 生成发布版 `package.json`（去掉 `private`、补 `license`/`repository`/`engines.dsh`/`files`）；
- 把 `cordis.patch.yml` 里的 `name` 改成发布包名（**必须**与 npm 包名一致）；
- 生成 MIT `LICENSE` 与安装用 `README.md`；
- 查询 npm 已发布版本的时间（离线时用当前时间），生成 `market/index.json` 并做内建校验。

`--all-versions` 会列出 npm 上所有版本；`--dry-run` 不访问网络；`--timestamp` 手工指定某个版本的发布时间。

发布前自检：

```bash
cd publish/dist/npm
npm pack --dry-run          # 确认 tarball 里有 cordis.patch.yml / client.js / index.js / icon.svg
node ../../prepare.mjs --dry-run   # 再生成一次也行，内建 index 校验会报出 JSON 路径
```

`npm` 包名是全局唯一的：本机查询 `dsh-plugin-session-view` 在 npm 上仍为 404（可用）。若被占用，改 `--name`，或使用带 scope 的名字（如 `@你的账号/dsh-plugin-session-view`，`npm publish --access public`）。

> **仓库根目录的 package.json 仍是开发用清单**（`@local/session-plugin-view` + `private`），
> 因为本机 profile 以 `link:` 方式依赖这个名字。若你希望公开仓库根目录本身就是标准 npm 包
> （更符合常规习惯），把 `publish/dist/npm/package.json` 覆盖到根目录，并把 profile 里
> `"@local/session-plugin-view": "link:…"` 与 `dsh.profile.bundles` 中的名字同步改成
> `dsh-plugin-session-view` 后重新 `pnpm install`；两种做法都能通过 dshopen 的检查（它检查的是
> 已发布 npm 归档，而不是仓库根清单）。

---

## 上传前检查（哪些文件要传 / 不要传）

**应该提交到公开仓库**：

```text
client.js  index.js  cordis.patch.yml  icon.svg  locale/{zh,en}.json
package.json  README.md  LICENSE  .gitignore
smoke.mjs  publish/prepare.mjs  publish/README.md  docs/*.png
```

**不要提交 / 不要上传**：

| 路径 | 原因 |
| --- | --- |
| `publish/dist/npm/` | 生成物，`npm publish` 用；`.gitignore` 已忽略 |
| `publish/dist/market/` | 可选：只有想在同一仓库用 GitHub Pages 托管市场时才提交，否则忽略或放到独立仓库 |
| `node_modules/` | 依赖 |
| `.dsh-investigation/`（工作区里，插件目录之外） | 本机调查材料；虽然已清除其中复制过的凭据，仍不应公开 |
| `.credentials.yaml`、cookie、token、`*.log` | 凭据与日志 |
| 任何形如 `E:/...`、`C:\Users\...` 的本机绝对路径 | 代码里用相对路径（`smoke.mjs` 已改为按 `import.meta.url` 解析） |

提交前自检：

```bash
# 1) 不应再有本机绝对路径（README 里的占位符 <本仓库绝对路径> 除外）
grep -rnE '[A-Za-z]:[/\\](project|Users|Deepseek|app)' . \
  --include='*.js' --include='*.mjs' --include='*.json' --include='*.md' --include='*.yml'

# 2) 冒烟测试在任何 checkout 路径下都能跑
node smoke.mjs

# 3) 确认发布包内容
node publish/prepare.mjs --dry-run && (cd publish/dist/npm && npm pack --dry-run)
```

---

## 方式一：提交到开放插件市场（dshopen.org）

dshopen.org 是社区维护的「开放插件市场」，索引地址 `https://dshopen.org/index.json`，仓库是
[polang233/dsh-plugin-index](https://github.com/polang233/dsh-plugin-index)（GPL-3.0，独立社区项目，与 DeepSeek 官方无隶属关系）。

### 1. 先发布到 npm

```bash
npm login
cd publish/dist/npm
npm publish            # scoped 包加 --access public
npm view dsh-plugin-session-view version   # 确认已发布
```

发布后 npm 会给出 `https://www.npmjs.com/package/dsh-plugin-session-view`。

### 2. 建公开源码仓库

- 公开 GitHub/GitLab 仓库，提交插件源码（`client.js`、`index.js`、`cordis.patch.yml`、`locale/`、`icon.svg`、`publish/prepare.mjs`、`README.md`、`LICENSE`、`smoke.mjs`）。
- 明确的许可证（本脚本默认 MIT）。
- README 写清楚用途、截图、安装方式和限制（例如「MCP 需在 profile 里先配置」）。
- 建议打 tag，并在仓库放 `docs/session-panel-*.png` 截图（README 模板会引用）。

### 3. 提交收录申请

填写表单：<https://github.com/polang233/dsh-plugin-index/issues/new?template=plugin-add.yml>

- 「插件地址」填 npm 包名 `dsh-plugin-session-view`（或仓库 URL）；
- 「简短说明」一句话说明用途（中英文均可）；
- 「补充信息」可选：Logo、截图、实测说明。

可直接粘贴的申请内容：

```text
插件地址 / Plugin link:
dsh-plugin-session-view
（https://github.com/gcggcg/dsh-plugin-session-view）

简短说明 / Summary:
会话级插件/MCP/技能面板：在会话标题栏右上角查看当前会话的插件、MCP 服务与技能，并可逐行启停 MCP 服务与插件包。
A top-right conversation-header panel listing the session's plugins, MCP servers and skills, with per-row enable switches for MCP servers and plugin bundles.

补充信息 / Additional details:
仓库 https://github.com/gcggcg/dsh-plugin-session-view · 许可证 MIT
分类：界面 / interface · 截图：仓库 docs/session-panel-*.png
```

收录条件（见 [CONTRIBUTING](https://github.com/polang233/dsh-plugin-index/blob/main/.github/CONTRIBUTING.md)）：

- 有公开的 npm 版本与发布时间；
- 包内声明 `dsh.bundle.patch`，且补丁文件确实在发布包中（`npm pack` 里可见）；
- 有公开源码仓库和明确许可证；
- 用途清楚；
- **不要**提交密钥、私有仓库、跟踪链接或无依据的安全承诺。

维护者会核对包归属、用途、发布记录、许可证、补丁和入口文件（含 `exports["./client"]`、`./icon`），必要时请作者补充信息，并补齐中英文介绍。

### 4. 收录之后

- 索引每 **6 小时**构建一次；默认跟踪 npm 的 `latest`，所以以后你只要 `npm version patch && npm publish` 就会自动更新，**无需重复申请**（改名字/介绍/下架才需要再提 issue）。
- 若某次构建时你的包暂时不可下载（超时、429/5xx），会保留上次版本并记录在 `status.json`，不会整站失败。
- 可在自己 README 里加徽章（把包名换成你的）：

  ```md
  [![开放插件市场](https://img.shields.io/endpoint?url=https%3A%2F%2Fdshopen.org%2Fbadge%2Fdsh-plugin-session-view.json)](https://dshopen.org/zh/plugins/dsh-plugin-session-view/)
  ```

- 下架：用 [plugin-remove 模板](https://github.com/polang233/dsh-plugin-index/issues/new?template=plugin-remove.yml) 提交，标题以 `[plugin-remove]` 开头；需用发布该包的 npm 或仓库 GitHub 账号提交。

### 5. 用户如何安装

- DSH「插件 → 发现」里搜索插件名安装；或
- `dsh plugin --profile desktop add dsh-plugin-session-view`。

---

## 方式二：自建插件源市场

DSH 的插件市场只是一个 **format 1 的 JSON 索引**：你把它放在任意静态地址上，在 DSH 里「发现 → 添加索引源」粘贴 URL 即可浏览、安装。不需要服务器端代码（也没有查询接口，整份索引会被下载并缓存 10 分钟）。

### 1. 生成 index.json

```bash
node publish/prepare.mjs --name dsh-plugin-session-view --author "…" --repo "…"
# -> publish/dist/market/index.json
#    publish/dist/market/icons/dsh-plugin-session-view.svg
```

最小结构（`publish/dist/market/index.json` 就是完整示例）：

```json
{
  "format": 1,
  "title": { "en": "My DSH Plugins", "zh": "我的 DSH 插件源" },
  "description": { "en": "…", "zh": "…" },
  "metadata": {
    "categories": { "interface": { "title": { "en": "Interface", "zh": "界面" } } },
    "labels": {},
    "sortKeys": {}
  },
  "plugins": [
    {
      "name": "dsh-plugin-session-view",
      "title": { "en": "Session Plugin View", "zh": "会话插件与能力" },
      "description": { "en": "…", "zh": "…" },
      "icon": "icons/dsh-plugin-session-view.svg",
      "author": "…",
      "homepage": "https://github.com/…",
      "repository": { "url": "https://github.com/…" },
      "metadata": { "category": "interface", "keywords": ["dsh"], "labels": [], "sortKeys": {} },
      "versions": [
        {
          "version": "1.0.0",
          "publishTimestamp": 1793083135,
          "source": { "type": "npm", "registry": "https://registry.npmjs.org/" },
          "engines": { "dsh": ">=0.2.1-rc.3 <0.3.0-0" }
        }
      ]
    }
  ]
}
```

格式要点（DSH 会逐条校验，错误会带 JSON 路径，如 `$.plugins[0].versions[0].version`）：

- `format` 必须是 `1`；`title` 必填（对象形式必须含 `en`）；`plugins` 非空数组。
- `name` 必须是合法 npm 包名；同一索引内不能重复。
- `versions` 非空、版本必须是**精确 SemVer**、同一插件内不重复、`publishTimestamp` 是 Unix 秒。
- `source`：`{"type":"npm"}`（可带 `registry`）或 `{"type":"git","url":<https 仓库>,"commit":<40 位小写 SHA>,"path":<可选包目录>}`。
- `engines.dsh` 是可选的 SemVer 范围；它决定 DSH 在详情页显示「兼容/不兼容」并阻止安装。
- `icon`：相对路径（相对索引地址解析，http 索引要求同源，https 索引可跨域 https）或 ≤32 KiB 的 base64 `data:image/svg+xml|png|jpeg|webp`。
- `metadata.category` / `labels` 只能引用 `metadata.categories` / `labels` 里声明过的 id。
- 外部地址不能带账号密码、query 或 fragment。
- 索引本身必须**直接返回 200**（DSH 拒绝重定向），http/https 皆可，Host 进程直接 fetch，不走浏览器 CORS。

参考实现：官方格式说明与生成器 <https://github.com/deepseek-ai/deepseek-harness/tree/master/apps/plugin-market-generator>，社区完整站点 <https://github.com/polang233/dsh-plugin-index>。

### 2. 托管（任选其一）

| 方式 | index.json 地址 | 说明 |
| --- | --- | --- |
| GitHub Pages | `https://<账号>.github.io/<仓库>/index.json` | 最简单；`main` 分支根目录放 `index.json` + `icons/`，Pages 选「GitHub Actions」或 `main` 根目录 |
| jsDelivr（GitHub） | `https://cdn.jsdelivr.net/gh/<账号>/<仓库>@main/index.json` | 免费 CDN；相对图标会解析到同一 CDN |
| jsDelivr（npm） | `https://cdn.jsdelivr.net/npm/<包名>/index.json` | 把 index.json 也打进 npm 包（可加一个 `dsh-market` 包专门放索引） |
| 自己的服务器 / 对象存储 | `https://你的域名/index.json` | Nginx、Cloudflare、OSS/COS 都行，注意不要 301/302、不要登录鉴权 |

> 本仓库的 `publish/dist/market/` 就是可直接上传的目录。开发时可以用
> `node -e "…"` 或任意静态服务器本地预览；本插件仓库里还提供
> `.dsh-investigation/verify/serve-market.mjs`（仅本机调查目录，不随包发布）。

### 3. 在 DSH 里添加索引

- **界面**：DSH → 插件 → 实验性插件 → 打开「自定义插件市场」→ 发现 → 添加索引源 → 粘贴 URL。
  这会写进当前 profile 的 `plugin-market` 配置（`cordis.patch.yml` 的 `plugin-market.config.indexes`）。
- **配置文件**（等价，改完重启/等热重载）：

  ```yaml
  - id: plugin-market
    name: "@deepseek-ai/dsh-plugin-market"
    config:
      indexes:
        - https://cdn.jsdelivr.net/npm/dsh-plugin-catalog/index.json
        - https://dshopen.org/index.json
        - https://你的域名/index.json
  ```

- 添加后「发现」里会出现你的市场名称（`title`）和插件；安装按钮使用 `name@version`（或固定 Git 提交），走 DSH 的插件管理器与 pnpm。

### 4. 维护流程

```bash
# 1) 改代码、跑测试
node smoke.mjs
# 2) 升版本并发 npm
cd publish/dist/npm && npm version patch && npm publish
# 3) 重新生成索引（--all-versions 会从 npm 拉全部版本；只有单版本时省略）
cd ../.. && node publish/prepare.mjs --name dsh-plugin-session-view --author "…" --repo "…" --all-versions
# 4) 把 publish/dist/market/ 推到托管仓库/服务器
```

- DSH 默认缓存索引约 10 分钟；「发现」里刷新即可看到新版本。
- 删掉某个版本：从 `versions` 去掉该条（已安装的不会被强制卸载）。
- 想同时维护多个插件：把 `plugins` 数组追加多条即可（`name` 不重复）；本目录的生成器目前只写本插件，可以复制那段 JSON 手工合并，或在此基础上扩展成读取 `plugins/*.json` 的小脚本。

### 5. 校验

- DSH 自己的校验器就是标准：任何格式问题都会在「发现」里报出带 JSON 路径的错误；也可以在我们的生成脚本里先跑（内建同规则校验）。
- 部署后用 curl 确认「直接 200、无重定向、UTF-8 JSON」：

  ```bash
  curl -sS -o /dev/null -w "%{http_code} %{content_type}\n" https://你的域名/index.json
  ```

### 6. 进阶：完整市场站点

如果要做成 dshopen.org 那种带首页、分类、每日推荐、点赞的网站，可以 fork
[polang233/dsh-plugin-index](https://github.com/polang233/dsh-plugin-index)：

- `data/sources.json` 维护收录（npm/Git 来源、版本、中英文文案、分类）；
- `scripts/` 生成 `public/index.json`、图标、页面与 `status.json`；
- `pnpm build` 全量构建，GitHub Actions 校验并通过 GitHub Pages / Cloudflare 发布；
- 详见仓库 `docs/maintenance.zh-CN.md`（构建、校验、图标、Git 来源、下架、Pages 部署）。

---

## 本插件发布时的注意事项

- **先移除/停用本机的 `link:` 版本**：开发时 profile 里会挂着
  `"@local/session-plugin-view": "link:<本仓库绝对路径>"`，发布版补丁同样插入
  `id: session-plugin-view`。两者同时存在会出现重复条目；换成 npm 版前先在
  「插件」页停用或移除 `@local/session-plugin-view`。
- **npm 包名与补丁 `name` 必须一致**：`prepare.mjs` 会同步改写；手工改名时别忘了 `cordis.patch.yml`。
- **`engines.dsh`**：默认 `>=0.2.1-rc.3 <0.3.0-0`（本机运行 0.2.1-rc.3）。范围写错会被 DSH 判为不兼容并拒绝安装，
  可用 `plugin_manager` 的版本豁免临时放行。
- **图标**：dshopen 会从发布包的 `icon` 字段或导出的 `./icon` 读取（≤256 KiB，SVG/PNG/JPEG/WebP）；
  自建索引则由你自己托管图标（相对路径）。
- **发布前跑一次真实安装**（建议新开一个空 profile，避免污染桌面 profile）：

  ```bash
  dsh plugin --profile market-test add file:./publish/dist/npm/dsh-plugin-session-view-1.0.0.tgz
  ```

  需要本机有 `dsh` 命令行（桌面安装默认不一定在 PATH；也可在已装 DSH 的插件页用「从文件安装」）。

## 本机已做过的验证

- 生成的 `publish/dist/market/index.json` 通过 DSH 内置 format 1 校验器
  （`@deepseek-ai/dsh-plugin-market-index`），图标解析为绝对 URL。
- 把该目录用本地 HTTP 服务托管后，通过运行中的 DSH 真实添加索引并查询：
  索引标题被正确读出、插件 `dsh-plugin-session-view` 显示为 `not-installed`、
  `defaultVersion=1.0.0`、`compatibility.compatible=true`、
  安装参数 `dsh-plugin-session-view@1.0.0`（registry `https://registry.npmjs.org/`）。
- 验证后索引列表与 `cordis.patch.yml` 均已恢复原样（文件 SHA-256 与验证前一致）。
