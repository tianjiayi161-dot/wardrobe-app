# 电子衣橱 - 配置指南

这是一个智能衣橱管理应用，支持衣服管理、搭配展示和 AI 智能推荐功能。

## 功能特点

- 📸 **上传衣服照片**，AI 自动识别类型、颜色和风格
- 👔 **管理衣橱**，分类查看你的衣服
- ✨ **创建搭配**，手动组合或使用 AI 推荐
- 🤖 **AI 推荐**，Gemini 智能分析生成搭配建议
- 📱 **响应式设计**，手机、平板、桌面全平台支持

## 技术栈

- **前端**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **数据库**: MongoDB Atlas (免费版)
- **存储**: 阿里云 OSS
- **AI**: Google Gemini API
- **部署**: Vercel

## 快速开始

### 1. 安装依赖

项目已经创建完成，依赖已安装。

```bash
cd /Users/tangjiaoyu/wardrobe-app
```

### 2. 配置环境变量

复制环境变量模板并填写配置：

```bash
cp .env.local.example .env.local
```

然后编辑 `.env.local` 文件，填写以下配置（详细步骤见下方）。

## 环境配置详细步骤

### 步骤 1: 配置 MongoDB Atlas（数据库）

1. 访问 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. 注册并登录账号
3. 点击 "Build a Database" → 选择 "M0 Free" 免费版
4. 选择离你最近的区域（如 AWS Hong Kong）
5. 点击 "Create"，等待集群创建完成
6. 左侧菜单点击 "Database Access" → "Add New Database User"
   - 用户名：`wardrobe_user`
   - 密码：生成一个强密码（记住这个密码）
   - 权限选择 "Read and write to any database"
   - 点击 "Add User"
7. 左侧菜单点击 "Network Access" → "Add IP Address"
   - 选择 "Allow Access from Anywhere" (0.0.0.0/0)
   - 点击 "Confirm"
8. 回到 "Database" 页面，点击 "Connect"
9. 选择 "Connect your application"
10. 复制连接字符串（类似这样）：
    ```
    mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
    ```
   
   
11. 将 `<username>` 替换为你的用户名，`<password>` 替换为你的密码
12. 在 `.env.local` 中设置：
    ```
    MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?appName=Cluster0
    ```

### 步骤 2: 配置阿里云 OSS（图片存储）

1. 登录 [阿里云控制台](https://oss.console.aliyun.com/)
2. 创建 Bucket：
   - 点击 "创建 Bucket"
   - Bucket 名称：`wardrobe-images-唯一标识` （需全局唯一）
   - 区域：选择离你最近的区域（如 `华东2-北京`）
   - 存储类型：标准存储
   - 读写权限：**公共读**（重要！）
   - 点击 "确定"
3. 配置跨域访问（CORS）：
   - 进入你创建的 Bucket
   - 左侧菜单选择 "权限管理" → "跨域设置"
   - 点击 "创建规则"
   - 来源：`*`
   - 允许 Methods：勾选 GET、POST、PUT、DELETE、HEAD
   - 允许 Headers：`*`
   - 暴露 Headers：`ETag`
   - 点击 "确定"
4. 获取 AccessKey：
   - 右上角头像 → "AccessKey 管理"
   - 建议创建 RAM 用户（更安全）或使用主账号 AccessKey
   - 记录 AccessKey ID 和 AccessKey Secret（**不要**粘贴到 README，只放在 .env.local 中）
5. 在 `.env.local` 中设置：
    ```
    OSS_BUCKET_NAME=你的bucket名称
    OSS_REGION=oss-cn-hangzhou
    OSS_ACCESS_KEY_ID=你的AccessKey_ID
    OSS_ACCESS_KEY_SECRET=你的AccessKey_Secret
    OSS_BUCKET_DOMAIN=https://你的bucket名称.oss-cn-hangzhou.aliyuncs.com
    ```

### 步骤 3: 配置 Gemini API（AI 功能）

1. 访问 [Google AI Studio](https://aistudio.google.com/)
2. 使用 Google 账号登录
3. 点击左侧 "Get API Key" → "Create API Key"
4. 选择一个项目（或创建新项目）
5. 复制生成的 API Key
6. 在 `.env.local` 中设置：
    ```
    GEMINI_API_KEY=你的Gemini_API_Key
    ```

**注意**：Gemini API 有免费额度限制，请查看 [定价页面](https://ai.google.dev/pricing)。

### 步骤 4: 配置应用 URL

在 `.env.local` 中设置：

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 本地运行

配置完环境变量后，运行开发服务器：

```bash
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 部署到 Vercel

### 1. 推送代码到 GitHub

```bash
cd /Users/tangjiaoyu/wardrobe-app
git add .
git commit -m "Initial commit: 电子衣橱应用"

# 创建 GitHub 仓库后推送
git remote add origin https://github.com/tianjiayi161-dot/wardrobe-app.git
git branch -M main
git push -u origin main
```

### 2. 连接 Vercel

1. 访问 [Vercel](https://vercel.com/)
2. 使用 GitHub 账号登录
3. 点击 "New Project"
4. 选择你的 `wardrobe-app` 仓库
5. 点击 "Import"

### 3. 配置环境变量

在 Vercel 项目设置中添加环境变量：

1. 进入项目 → Settings → Environment Variables
2. 添加以下变量（从 `.env.local` 复制）：
   - `MONGODB_URI`
   - `OSS_BUCKET_NAME`
   - `OSS_REGION`
   - `OSS_ACCESS_KEY_ID`
   - `OSS_ACCESS_KEY_SECRET`
   - `OSS_BUCKET_DOMAIN`
   - `GEMINI_API_KEY`
   - `https://tangjiaoyu.top`（改为你的域名，如 `https://tangjiaoyu.top`）

### 4. 绑定自定义域名

1. 在 Vercel 项目中，进入 Settings → Domains
2. 添加你的域名：`tangjiaoyu.top` 和 `www.tangjiaoyu.top`
3. Vercel 会提示你配置 DNS 记录
4. 登录阿里云域名控制台
5. 找到 `tangjiaoyu.top` → 解析设置
6. 添加以下记录：
   - 类型：`CNAME`
   - 主机记录：`@`
   - 记录值：`cname.vercel-dns.com`
   - 类型：`CNAME`
   - 主机记录：`www`
   - 记录值：`cname.vercel-dns.com`
7. 等待 DNS 生效（通常几分钟到几小时）

### 5. 部署

1. Vercel 会自动部署你的应用
2. 每次推送到 GitHub 都会自动触发部署
3. 部署完成后访问你的域名即可

## 功能使用指南

### 添加衣服

1. 点击首页 "添加衣服" 或导航栏 "我的衣服" → "添加衣服"
2. 上传衣服照片（支持 JPG、PNG 等格式）
3. AI 会自动识别衣服的类型、颜色、风格等
4. 确认或修改识别结果
5. 点击 "添加" 保存

### 创建搭配

1. 点击导航栏 "我的搭配" → "创建搭配"
2. 填写搭配名称和描述
3. 从衣橱中选择多件衣服
4. 点击 "创建搭配"

### AI 推荐搭配

1. 在首页点击 "生成推荐"
2. AI 会分析你的衣橱并生成 3 套搭配建议
3. 可以将喜欢的推荐保存为搭配

## 常见问题

### Q: 图片上传失败？
A: 检查阿里云 OSS 配置是否正确，特别是：
- Bucket 权限是否设置为 "公共读"
- CORS 是否正确配置
- AccessKey 是否有效

### Q: AI 识别不准确？
A: Gemini AI 的识别准确率取决于图片质量，建议：
- 使用清晰、正面的衣服照片
- 背景尽量简洁
- 光线充足
- 可以手动修改识别结果

### Q: 数据库连接失败？
A: 检查 MongoDB Atlas 配置：
- 网络访问是否允许所有 IP (0.0.0.0/0)
- 数据库用户密码是否正确
- 连接字符串格式是否正确

### Q: Vercel 部署后环境变量不生效？
A: 确保：
- 在 Vercel 项目设置中正确添加了所有环境变量
- 环境变量的值没有多余的空格或引号
- 重新部署项目

## 成本估算

- **MongoDB Atlas**: 免费 512MB 存储（个人使用足够）
- **阿里云 OSS**: 约 ¥0.12/GB/月 存储 + ¥0.5/GB 流量
  - 100 张照片约 50MB，成本 < ¥1/月
- **Gemini API**: 免费额度很大（每分钟 15 次请求）
- **Vercel**: 免费托管（个人项目无限制）

**总成本**: 几乎免费！

## 技术支持

如有问题，请检查：
1. 环境变量是否正确配置
2. 控制台是否有错误信息
3. 网络是否正常

## 后续优化建议

- [ ] 添加用户认证功能
- [ ] 支持批量上传图片
- [ ] 添加衣服使用统计
- [ ] 支持搭配评分
- [ ] PWA 支持（可安装到手机）
- [ ] 图片自动去背景

---

祝你使用愉快！ 🎉
