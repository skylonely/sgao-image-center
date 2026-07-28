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
