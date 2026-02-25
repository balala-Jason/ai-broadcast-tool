# 农产品直播话术AI生成系统

面向抖音农产品直播运营人员的智能话术生成系统，集成素材采集、AI分析和话术生成功能。

## 功能特性

### 🎯 核心功能
- **话术生成**：基于产品信息、风格模板和知识库素材，AI生成抖音实战5段式直播话术
- **素材采集**：支持抖音直播间录制、语音转文字、自动分析提取关键词和标签
- **知识库管理**：文档导入、向量化存储、语义搜索
- **产品管理**：农产品信息管理，包含产地、规格、卖点、证书等
- **风格模板**：6种农产品专属风格模板（亲民朴实型、激情促销型、故事情怀型等）

### 📱 多端适配
- 响应式设计，支持桌面端和移动端
- 移动端底部导航 + 桌面端侧边栏

### 🔄 后台生成
- 支持后台话术生成，即使切换页面也不中断
- BroadcastChannel + localStorage 跨页面状态同步

## 技术栈

- **前端框架**：Next.js 16 + React 19 + TypeScript
- **UI组件**：shadcn/ui + Tailwind CSS 4
- **数据库**：Supabase (PostgreSQL)
- **AI能力**：coze-coding-dev-sdk
  - LLM（大语言模型）：流式生成话术
  - ASR（语音识别）：录制转文字
  - Knowledge（知识库）：向量检索
  - Search（搜索）：Web搜索

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

创建 `.env.local` 文件：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services (通过 coze-coding-dev-sdk 自动获取)
# 无需额外配置
```

### 启动开发服务器

```bash
coze dev
```

访问 http://localhost:5000

### 构建生产版本

```bash
coze build
```

## 项目结构

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API 路由
│   │   ├── scripts/              # 话术相关API
│   │   ├── products/             # 产品管理API
│   │   ├── materials/            # 素材采集API
│   │   ├── knowledge/            # 知识库API
│   │   └── style-templates/      # 风格模板API
│   ├── scripts/                  # 话术生成页面
│   ├── materials/                # 素材采集页面
│   ├── products/                 # 产品管理页面
│   ├── knowledge/                # 知识库页面
│   └── style-templates/          # 风格模板页面
├── components/
│   ├── layout/                   # 布局组件
│   └── ui/                       # shadcn/ui 组件
├── lib/                          # 工具函数
└── storage/
    └── database/
        └── schema.ts             # 数据库 Schema (Drizzle ORM)
```

## 话术生成流程

1. 选择产品和风格模板
2. 设置目标人群、时长等参数
3. 点击生成，AI基于知识库素材生成5段式话术：
   - 预热环节（停留时长）
   - 留人环节（互动率）
   - 锁客环节（转化率）
   - 逼单环节（GPM）
   - 气氛组（参与度）
4. 每个环节提供5+条话术选项，支持一键复制

## 数据库表结构

- `products` - 产品信息
- `style_templates` - 风格模板
- `scripts` - 话术记录
- `materials` - 素材记录
- `knowledge_base` - 知识库文档

## 开发规范

- 使用 pnpm 管理依赖
- 使用 shadcn/ui 组件
- 遵循 TypeScript 严格模式
- API 必须进行真实调用，禁止 Mock

## License

MIT
