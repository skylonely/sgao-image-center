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
