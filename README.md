# 林水月的小站

写给朋友看的“月下桌面”：看时间、搜索、听音乐、和宠物互动，再翻看文章、笔记与相片。

项目使用 Astro，页面交互保持原生 JavaScript 与 CSS。公开内容来自 Markdown，主题、音乐、宠物位置、个人档案和留言保存在当前浏览器的 `localStorage`。

## 本地开发

```powershell
npm install
npm run dev
```

Astro 配置了 GitHub Pages 子路径，本地首页通常位于：

```text
http://localhost:4321/lin-shuiyue-site/
```

## 添加公开内容

在 `src/content/blog/` 新建 Markdown 文件：

```yaml
---
title: 这个小站为什么存在
description: 想给朋友留一个随时可以推门进来的角落。
publishDate: 2026-07-06
type: article
cover: ../../assets/images/blog-stage-bg.png
tags:
  - 小站
draft: false
---
```

正文写在 frontmatter 下方。`type` 可选 `article`、`note` 或 `image`；`cover` 和 `tags` 可以省略。保存后，文章会自动出现在首页内容架、`/blog/` 列表和对应详情页。

设置面板不再提供“浏览器新增文章”，因为那类内容只有自己可见。公开文章统一通过 Markdown 管理。

## 检查与构建

```powershell
npm run check
npm run build
npm run preview
```

构建结果位于 `dist/`。运行以下脚本会先重新构建，再把 `dist/` 内容压缩成 `lin-shuiyue-site.zip`：

```powershell
.\package-site.ps1
```

## 发布

`astro.config.mjs` 已配置：

- `site: https://linrjie.github.io`
- `base: /lin-shuiyue-site`

推送到 `main` 后，`.github/workflows/deploy.yml` 会通过 GitHub Actions 构建并部署 `dist/`。

前端修改继续遵守 `.agents/skills/frontend-design/SKILL.md` 与 `AGENTS.md` 中的项目设计约定。
