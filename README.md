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
