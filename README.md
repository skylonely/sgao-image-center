# 🖼️ sgao-image-center

基于 **Cloudflare Workers** 构建的图片服务与管理中心。

用于管理个人图片资源，并结合 Cloudflare CDN 提供高速、稳定的图片访问服务。

🌐 Image CDN:

https://img.sgao.cc

## ✨ Features

- 图片资源统一管理
- 基于 Cloudflare Workers 部署
- 全球 CDN 加速访问
- 轻量、高性能
- 支持自定义图片访问路径
- 低成本运行

## 🏗️ Architecture

```
User
 │
 ▼
img.sgao.cc
 │
 ▼
Cloudflare CDN
 │
 ▼
Cloudflare Workers
 │
 ▼
Image Storage
```

## 🛠️ Tech Stack

- Cloudflare Workers
- TypeScript
- Vite
- Wrangler

## 📦 Installation

Install dependencies:

```bash
npm install
```

## 🚀 Development

Run local development server:

```bash
npm run dev
```

## 📤 Deployment

### 图片管理账号登录

上传页与文件管理页使用现有 Cloudflare Access 登录，只允许 `gsios602@gmail.com`。不再输入或保存 `UPLOAD_TOKEN`，旧 Bearer 密钥不再授权上传、列出文件、重命名或删除。未登录/过期时显示登录入口，成功登录后自动读取目录与文件；认证失效会清除页面上的管理数据。公开图片链接和 CDN 路径保持不变。

上线前，在现有 Zero Trust 团队内创建一个路径级 self-hosted Access 应用，使用同一个应用保护 `img.sgao.cc/admin`、`img.sgao.cc/admin/*`、`img.sgao.cc/api/*`，Allow 策略仅包含上述邮箱。不要保护整个域名或整个 Worker，否则会阻断公开图片。浏览器访问 `/api/login` 后返回固定管理页面；已有团队登录会话可以复用，但首次进入图片应用仍需由 Access 完成应用会话跳转。

配置 `ACCESS_TEAM_DOMAIN`（`https://你的团队.cloudflareaccess.com`）和 `ACCESS_AUD`（该图片应用的 AUD）。当前配置使用 `https://gsios602.cloudflareaccess.com` 及图片应用 `img` 的 AUD；配置为空时会拒绝所有管理请求，不应发布空配置。Worker 验证 Access JWT 的 RS256 签名、issuer、audience、有效期及账号身份，拒绝跨站或缺少 Origin 的写入，不信任请求中自行声明的邮箱。静态资源路由不会传递 `ctx.access`，因此图片 Worker 使用 `jose` 验证签名，而不是沿用 API 的上下文读取方式。参见 [Cloudflare 官方说明](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)。

保持 R2 绑定不变，无数据库迁移，不删除线上旧密钥（旧版回滚仍可使用）。`workers.dev` 或其他未经过图片 Access 应用的管理请求也会因缺少有效凭证被拒绝。配置变化后执行 `npx wrangler types --strict-vars=false`。本地验证：`npx vitest run`、`npm run test:auth-ui`、`npx tsc --noEmit`、`npx tsc --noEmit -p test/tsconfig.json`。生产账号登录仍需配置和发布后人工验证。

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

## 图片回收站

普通删除改为移入回收站；文件管理页可切换回收站、查看受保护的缩略图、恢复到原路径，以及二次确认后彻底删除。不自动清空。批量移入单次最多 50 张，并返回成功项和失败项。旧版已永久删除的图片不能通过此功能找回。

R2 内部保留 `__sgao_trash/data/{UUID}` 图片副本和 `__sgao_trash/records/{UUID}` 记录；该命名空间禁止公开图片访问、普通文件管理和目录显示。管理接口 `/api/trash` 继续使用同一 Access 应用和 owner 邮箱验证，无新增数据库或绑定。

删除先保存副本和元数据，再以原图 ETag 条件写入唯一删除占位符，防止删除与同名上传并发时丢失新图。恢复也使用条件写入，原路径有新图片时返回冲突，绝不覆盖。彻底删除仅移除内部图片副本和记录，保留不包含原图字节的小占位符，以避免清理时误删后来上传的新图；同名上传可条件复用原路径。

公开读取在 Cache API 和 GitHub 回源前检查删除占位符，并校验缓存 ETag；每次请求增加一次 R2 HEAD。浏览器已经缓存的图片仍可能在本地缓存有效期内显示，无法由 Worker 主动清除。不自动清空的回收站副本继续占用 R2 存储并产生正常读写请求。

删除涉及多个 R2 写入而非跨对象事务。副本/记录写入失败时原图保留；删除占位符的写入结果不确定时保留回收站副本，由用户刷新检查。恢复成功但清理失败会提示副本待清理，可在确认原图正常后彻底删除残留副本。不要手动删除原路径占位符，否则 GitHub 回源可能重新显示旧图。启用后不得直接回滚到不识别回收站的旧 Worker：旧版可能公开内部副本并显示占位符，回滚必须保留私有前缀拦截和删除判断。

本地检查：`npx tsc --noEmit`、`npx tsc --noEmit -p test/tsconfig.json`、`npx vitest run`、`npm run test:auth-ui`。真实浏览器布局和生产操作需发布后人工验收。

## 文件搜索

输入文件名或目录关键词后，停顿 300 ms 会自动串行读取当前视图尚未加载的分页，边读取边显示匹配结果（不区分大小写）。图片文件和回收站分别搜索，不混合结果；搜索完成前明确提示结果尚未完整，空分页也会继续读取。进度显示已检查的可见文件数及匹配数，不虚构总数或百分比。

支持暂停/继续搜索；清空关键词、切换视图或退出登录时取消读取，迟到的响应不会重新填充列表。失败保留已读取结果，可从失败的分页继续；刷新会重新读取，分页重复记录会去重。全部读取完成后修改关键词只做本地筛选，新增或其他设备的变化需刷新；分页读取不是跨请求快照。搜索只读取文件元数据，不下载全部原图，不新增数据库或绑定，但全量搜索会增加正常 R2 列表请求。极大量图片的全文索引留待后续需求。

## 图片筛选

文件管理与回收站支持目录和图片格式筛选，并与搜索关键词取交集。目录包含“全部目录”“根目录”和实际目录；指定目录包含其子目录，按完整路径加 `/` 匹配，不会把 `travel-2` 混入 `travel`。目录选项逐页补齐，支持主动读取全部目录；刷新保留已选择的目录，切换视图或退出登录则清空筛选及目录信息。

格式按存储路径的扩展名识别，不区分大小写，JPEG 同时包含 `.jpg` 与 `.jpeg`；支持 PNG、WebP、GIF、SVG。不依赖可能为空或不准确的 Content-Type。选定筛选后自动读取剩余分页，沿用搜索进度、暂停/继续及失败重试，完整读取前明确提示结果可能不完整。“清除筛选”只清空目录和格式，保留搜索词；改变筛选会清空选择，避免隐藏项目被误删。没有新增数据库或绑定，不改变图片和 CDN 地址。

## 图片排序

图片文件默认按 R2 上传时间最新在前，回收站默认按删除时间最新在前；均支持时间正/倒序、文件名升/降序和文件大小升/降序。文件名采用中文友好的自然排序（例如 `photo2` 在 `photo10` 前），同值时以完整路径和回收站编号稳定排序，未知时间或大小排最后。

排序视图是跨目录的完整顺序，每行显示原始完整路径，并与关键词、目录、格式筛选联动。默认排序也会自动逐页补齐元数据；未完成时显示部分结果及不完整提示，支持暂停、继续和失败重试。不下载全部原图、不更改线上数据，但比单页目录浏览增加正常列表请求。保留“按目录浏览”选项作为原来的分组折叠、手动分页方式；排序选择在刷新时保留，切换视图或退出登录恢复最新在前，不新增持久偏好或跨设备配置。

大图预览在后续分页使顺序变化时仍定位同一张图片，上一张/下一张遵循当前展示顺序。“清除筛选”保留排序和搜索词。完整读取不是跨请求快照，其他设备的变化需要刷新。

## 批量移动目录

图片文件页勾选 1～50 张图片后使用“移动所选”，选择已读取的现有目录、根目录或输入新目录（支持多级路径）。确认前展示逐张原路径与目标路径，必须勾选链接变化确认。只移动选中的图片，保留文件名，不递归搬移整个目录；不会自动修改网页或 Markdown 引用。回收站不提供此操作。

后台验证账号、同源请求、目录和图片版本，逐张串行处理；同目录跳过，目标已有文件（包括回收站的旧路径标记）不覆盖，也不自动重命名。目标采用条件写入，原路径使用条件写入的小型隐藏标记而不是无条件删除，避免缓存或 GitHub 回源复活旧图。复制保留图片字节、HTTP 和自定义元数据；目标 R2 上传时间为复制时间，原始文件名元数据保留。

R2 不提供跨路径原子事务，移动不是整体批次事务；源文件在处理期间变化或请求中断时可能保留目标副本。界面逐张报告已移动、同目录跳过及未完成，明确提示复制但未确认移除的情况，不自动回滚或删除目标副本。未完成项保留选择，结果不明时先刷新检查两个目录，不直接重复提交。移动后的分页从头重新读取以避免路径变化漏读。

移动会改变公开图片 URL，旧引用可能失效；浏览器已经缓存的旧图片无法立即清除。不新增数据库、绑定或 Access 配置。移动标记不是回收站记录，不提供自动撤销；后续移动可通过条件写入安全复用旧的移动标记，因此支持手动移回原路径，但不会复用回收站标记。文件列表完整读取不是跨请求快照，相同内容的极端并发写入不能保证跨路径事务一致性。

## 📁 Project Structure

```
sgao-image-center
│
├── src/                    # Worker source code
│
├── test/                   # Test files
│
├── package.json             # Project configuration
│
├── wrangler.jsonc           # Cloudflare Workers configuration
│
├── tsconfig.json            # TypeScript configuration
│
└── README.md
```

## 🌐 Related Projects

### sgao.cc

Personal website:

https://sgao.cc

### sgao-images

Image storage repository:

https://github.com/skylonely/sgao-images

### sgao-image-center

Image service and management center:

https://github.com/skylonely/sgao-image-center

## 📝 Notes

This project is part of the **sgao.cc personal cloud infrastructure**.

It provides image management and CDN acceleration services through Cloudflare Workers.

---

Built with ❤️ by skylonely
