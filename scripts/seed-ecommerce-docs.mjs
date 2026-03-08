#!/usr/bin/env node
/**
 * Seed script — creates rich Amazon-style e-commerce API documentation.
 * Run: node scripts/seed-ecommerce-docs.mjs
 * Assumes dev server is running on http://localhost:3001
 */

const BASE = "http://localhost:3001";

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

async function put(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PUT ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

function flattenCategories(categories, items = []) {
  for (const category of categories) {
    items.push(category);
    flattenCategories(category.children || [], items);
  }
  return items;
}

// ─── Content Templates ───────────────────────────────────────────────

const PRODUCTS = [
  {
    name: "商品目录服务",
    slug: "product-catalog",
    description: "商品信息管理、搜索与分类服务，支持 SPU/SKU 模型、多属性检索和富媒体展示",
    docType: "guideline",
    visibility: "public",
    icon: "📦",
    currentVersion: "v2.4.0",
    categories: [
      {
        name: "快速入门",
        slug: "getting-started",
        description: "从零开始接入商品目录服务",
        pages: [
          {
            title: "概述",
            slug: "overview",
            pageType: "overview",
            content: `# 商品目录服务概述

商品目录服务（Product Catalog Service）是电商平台的核心基础设施，提供商品全生命周期管理能力。

## 核心能力

| 能力 | 说明 |
|------|------|
| SPU/SKU 管理 | 支持标准商品单元与库存单元的层级关系 |
| 多维属性 | 颜色、尺码、材质等可扩展属性体系 |
| 富媒体 | 图片、视频、3D 模型等多种媒体格式 |
| 全文检索 | 基于 Elasticsearch 的高性能商品搜索 |
| 分类树 | 无限层级的商品类目管理 |

## 服务架构

\`\`\`
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   API 网关    │────▶│  商品目录服务  │────▶│  搜索引擎     │
└──────────────┘     └──────┬───────┘     └──────────────┘
                           │
                    ┌──────┴───────┐
                    │   PostgreSQL  │
                    └──────────────┘
\`\`\`

## 适用场景

- **B2C 电商** — 标准商品展示与搜索
- **B2B 批发** — 批量商品管理与价格策略
- **跨境电商** — 多语言、多币种商品信息
- **内容电商** — 富媒体商品详情页

## 接入前提

1. 已完成平台注册并获取 API 密钥
2. 了解 RESTful API 基本概念
3. 熟悉 JSON 数据格式`,
          },
          {
            title: "快速开始",
            slug: "quickstart",
            pageType: "guide",
            content: `# 快速开始

本指南帮助你在 **5 分钟内**完成商品目录服务的接入。

## 第一步：获取凭证

在 [开发者控制台](https://console.example.com) 创建应用并获取 \`API_KEY\` 和 \`API_SECRET\`。

## 第二步：安装 SDK

\`\`\`bash
# Node.js
npm install @ecommerce/catalog-sdk

# Python
pip install ecommerce-catalog

# Java
<dependency>
  <groupId>com.ecommerce</groupId>
  <artifactId>catalog-sdk</artifactId>
  <version>2.4.0</version>
</dependency>
\`\`\`

## 第三步：初始化客户端

\`\`\`typescript
import { CatalogClient } from '@ecommerce/catalog-sdk';

const client = new CatalogClient({
  apiKey: process.env.CATALOG_API_KEY,
  apiSecret: process.env.CATALOG_API_SECRET,
  region: 'cn-east-1',
});
\`\`\`

## 第四步：创建第一个商品

\`\`\`typescript
const product = await client.products.create({
  title: 'Apple iPhone 15 Pro Max',
  categoryId: 'electronics-phones',
  brand: 'Apple',
  attributes: {
    color: ['暗夜黑', '原色钛金属', '白色钛金属', '蓝色钛金属'],
    storage: ['256GB', '512GB', '1TB'],
  },
  price: {
    currency: 'CNY',
    listPrice: 9999,
    salePrice: 9499,
  },
  images: [
    { url: 'https://cdn.example.com/iphone15.jpg', isPrimary: true },
  ],
});

console.log('商品已创建:', product.id);
// → 商品已创建: prod_8f3a2b1c
\`\`\`

## 第五步：查询商品

\`\`\`typescript
const result = await client.products.search({
  keyword: 'iPhone',
  filters: {
    brand: 'Apple',
    priceRange: { min: 5000, max: 10000 },
  },
  sort: { field: 'price', order: 'asc' },
  page: 1,
  pageSize: 20,
});

console.log(\`找到 \${result.total} 个商品\`);
\`\`\`

## 下一步

- 📖 阅读 [API 参考文档](/docs/api-reference) 了解所有端点
- 🏗️ 查看 [SPU/SKU 模型设计](/docs/guides/spu-sku-model) 理解数据模型
- 🔍 了解 [高级搜索语法](/docs/guides/search-syntax) 优化搜索体验`,
          },
          {
            title: "认证与鉴权",
            slug: "authentication",
            pageType: "guide",
            content: `# 认证与鉴权

所有 API 请求必须携带有效的认证信息。我们支持两种认证方式。

## API Key 认证

适用于服务端到服务端的调用场景。

\`\`\`bash
curl -X GET "https://api.example.com/v2/products" \\
  -H "X-Api-Key: your_api_key" \\
  -H "X-Api-Secret: your_api_secret"
\`\`\`

## OAuth 2.0 认证

适用于需要代表用户操作的场景（如商家后台）。

### 获取访问令牌

\`\`\`bash
curl -X POST "https://auth.example.com/oauth/token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "grant_type": "client_credentials",
    "client_id": "your_client_id",
    "client_secret": "your_client_secret",
    "scope": "catalog:read catalog:write"
  }'
\`\`\`

**响应：**

\`\`\`json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "catalog:read catalog:write"
}
\`\`\`

### 使用令牌

\`\`\`bash
curl -X GET "https://api.example.com/v2/products" \\
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
\`\`\`

## 权限范围

| Scope | 说明 |
|-------|------|
| \`catalog:read\` | 读取商品信息 |
| \`catalog:write\` | 创建和修改商品 |
| \`catalog:delete\` | 删除商品 |
| \`catalog:publish\` | 发布/下架商品 |
| \`media:upload\` | 上传媒体文件 |

## 频率限制

| 计划 | 请求/秒 | 请求/天 |
|------|---------|---------|
| 免费 | 10 | 10,000 |
| 基础 | 100 | 100,000 |
| 专业 | 1,000 | 1,000,000 |
| 企业 | 自定义 | 无限制 |

超出限制时返回 \`429 Too Many Requests\`，响应头包含：

\`\`\`
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1709856000
\`\`\``,
          },
        ],
      },
      {
        name: "开发指南",
        slug: "guides",
        description: "深入了解商品目录服务的核心概念",
        pages: [
          {
            title: "SPU/SKU 数据模型",
            slug: "spu-sku-model",
            pageType: "guide",
            content: `# SPU/SKU 数据模型

理解 SPU（Standard Product Unit）和 SKU（Stock Keeping Unit）是使用商品目录服务的基础。

## 核心概念

\`\`\`
SPU (标准产品单元)
├── iPhone 15 Pro Max
│   ├── SKU: 暗夜黑 256GB  ← 可购买的最小单元
│   ├── SKU: 暗夜黑 512GB
│   ├── SKU: 白色钛金属 256GB
│   └── SKU: 白色钛金属 1TB
└── ...
\`\`\`

### SPU 属性

SPU 代表一类商品，包含所有 SKU 共享的信息：

\`\`\`json
{
  "spuId": "spu_iphone15pm",
  "title": "Apple iPhone 15 Pro Max",
  "brand": "Apple",
  "categoryPath": ["电子产品", "手机", "智能手机"],
  "description": "A17 Pro 芯片，钛金属设计...",
  "media": {
    "images": [],
    "videos": []
  },
  "saleAttributes": [
    { "name": "颜色", "values": ["暗夜黑", "白色钛金属", "蓝色钛金属"] },
    { "name": "存储", "values": ["256GB", "512GB", "1TB"] }
  ],
  "specifications": {
    "屏幕尺寸": "6.7 英寸",
    "处理器": "A17 Pro",
    "操作系统": "iOS 17"
  }
}
\`\`\`

### SKU 属性

SKU 代表可独立库存管理和销售的最小单元：

\`\`\`json
{
  "skuId": "sku_ip15pm_black_256",
  "spuId": "spu_iphone15pm",
  "attributes": {
    "颜色": "暗夜黑",
    "存储": "256GB"
  },
  "price": {
    "listPrice": 9999,
    "salePrice": 9499,
    "currency": "CNY"
  },
  "inventory": {
    "available": 1520,
    "reserved": 30,
    "warehouse": "SH-01"
  },
  "barcode": "6941487XXXXXX"
}
\`\`\`

## 属性体系

### 关键属性（Key Properties）

决定 SPU 唯一性的属性组合：

\`\`\`
品牌 + 型号 + 系列 → SPU 唯一标识
\`\`\`

### 销售属性（Sale Attributes）

决定 SKU 分化的属性：

\`\`\`
颜色 + 存储容量 → SKU 变体
\`\`\`

### 非关键属性（Descriptive Attributes）

仅用于展示和搜索的属性：

\`\`\`
屏幕尺寸、重量、操作系统 → 商品详情页展示
\`\`\`

## 最佳实践

1. **合理设计属性** — 销售属性不超过 3 个维度，避免 SKU 爆炸
2. **统一属性值** — 使用属性词典确保"黑色"不会出现"黑""Black"等变体
3. **预生成 SKU** — 批量创建所有属性组合的 SKU，而非按需创建
4. **分离库存** — SKU 库存数据应与商品详情分离管理`,
          },
          {
            title: "商品搜索指南",
            slug: "search-guide",
            pageType: "guide",
            content: `# 商品搜索指南

商品搜索服务基于 Elasticsearch 构建，支持全文检索、结构化过滤和智能排序。

## 基础搜索

\`\`\`bash
GET /v2/products/search?q=蓝牙耳机&page=1&size=20
\`\`\`

## 高级过滤

使用 \`filters\` 参数进行结构化过滤：

\`\`\`json
{
  "keyword": "蓝牙耳机",
  "filters": {
    "categoryId": "electronics-audio",
    "brand": ["Sony", "Apple", "华为"],
    "priceRange": { "min": 200, "max": 2000 },
    "attributes": {
      "降噪": "主动降噪",
      "蓝牙版本": ["5.3", "5.4"]
    },
    "inStock": true,
    "rating": { "min": 4.0 }
  },
  "sort": [
    { "field": "salesCount", "order": "desc" },
    { "field": "price", "order": "asc" }
  ],
  "facets": ["brand", "priceRange", "attributes.降噪"]
}
\`\`\`

## 搜索响应

\`\`\`json
{
  "total": 1523,
  "page": 1,
  "pageSize": 20,
  "items": [
    {
      "spuId": "spu_sony_wh1000xm5",
      "title": "Sony WH-1000XM5 无线降噪耳机",
      "brand": "Sony",
      "price": { "min": 1799, "max": 1999 },
      "thumbnail": "https://cdn.example.com/sony-xm5.jpg",
      "rating": 4.8,
      "salesCount": 52340,
      "highlights": ["<em>蓝牙耳机</em>", "主动<em>降噪</em>"]
    }
  ],
  "facets": {
    "brand": [
      { "value": "Sony", "count": 234 },
      { "value": "Apple", "count": 189 }
    ],
    "priceRange": [
      { "range": "0-500", "count": 432 },
      { "range": "500-1000", "count": 521 },
      { "range": "1000-2000", "count": 389 }
    ]
  },
  "suggestions": ["蓝牙降噪耳机", "蓝牙耳机 运动"]
}
\`\`\`

## 搜索提示（Auto-Suggest）

\`\`\`bash
GET /v2/products/suggest?q=iPh&limit=5
\`\`\`

响应：

\`\`\`json
{
  "suggestions": [
    { "text": "iPhone 15", "type": "product", "count": 12 },
    { "text": "iPhone 手机壳", "type": "keyword", "count": 890 },
    { "text": "iPhone 充电器", "type": "keyword", "count": 456 }
  ]
}
\`\`\`

## 性能优化建议

- 使用 \`fields\` 参数限制返回字段，减少带宽消耗
- 合理设置分页大小（推荐 20-50）
- 高频搜索词使用缓存层（Redis）
- 避免深分页（offset > 10000），改用 \`search_after\` 游标`,
          },
        ],
      },
      {
        name: "API 参考",
        slug: "api-reference",
        description: "完整的接口定义文档",
        pages: [
          {
            title: "商品管理接口",
            slug: "products-api",
            pageType: "api_reference",
            content: `# 商品管理接口

## 创建商品

\`\`\`
POST /v2/products
\`\`\`

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | ✅ | 商品标题，2-200 字符 |
| categoryId | string | ✅ | 类目 ID |
| brand | string | ✅ | 品牌名称 |
| description | string | | 商品描述，支持 Markdown |
| saleAttributes | object[] | | 销售属性定义 |
| specifications | object | | 规格参数 |
| images | object[] | | 商品图片列表 |

### 请求示例

\`\`\`json
{
  "title": "Sony WH-1000XM5 头戴式无线降噪耳机",
  "categoryId": "cat_audio_headphone",
  "brand": "Sony",
  "description": "行业领先的降噪技术，30 小时续航...",
  "saleAttributes": [
    { "name": "颜色", "values": ["黑色", "银色", "午夜蓝"] }
  ],
  "specifications": {
    "佩戴方式": "头戴式",
    "降噪类型": "主动降噪",
    "蓝牙版本": "5.2",
    "续航时间": "30小时",
    "重量": "250g"
  },
  "images": [
    {
      "url": "https://cdn.example.com/xm5-main.jpg",
      "isPrimary": true,
      "alt": "Sony WH-1000XM5 黑色正面"
    }
  ]
}
\`\`\`

### 成功响应 \`201 Created\`

\`\`\`json
{
  "id": "prod_xm5_2024",
  "title": "Sony WH-1000XM5 头戴式无线降噪耳机",
  "status": "draft",
  "createdAt": "2024-03-07T10:30:00Z"
}
\`\`\`

### 错误码

| 状态码 | 错误码 | 说明 |
|--------|--------|------|
| 400 | INVALID_TITLE | 标题格式不正确 |
| 400 | CATEGORY_NOT_FOUND | 类目不存在 |
| 409 | DUPLICATE_SKU | SKU 编码重复 |
| 429 | RATE_LIMITED | 超出频率限制 |

---

## 获取商品详情

\`\`\`
GET /v2/products/{productId}
\`\`\`

### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| productId | string | 商品 ID |

### 查询参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| include | string | | 附加数据: \`skus\`,\`media\`,\`reviews\` |
| currency | string | CNY | 价格币种 |

### 成功响应 \`200 OK\`

\`\`\`json
{
  "id": "prod_xm5_2024",
  "title": "Sony WH-1000XM5 头戴式无线降噪耳机",
  "brand": "Sony",
  "status": "published",
  "price": { "min": 1799, "max": 1999, "currency": "CNY" },
  "rating": { "average": 4.8, "count": 12540 },
  "salesCount": 52340,
  "skus": [
    { "id": "sku_xm5_black", "color": "黑色", "price": 1799, "stock": 520 },
    { "id": "sku_xm5_silver", "color": "银色", "price": 1899, "stock": 310 }
  ]
}
\`\`\`

---

## 更新商品

\`\`\`
PUT /v2/products/{productId}
\`\`\`

> ⚠️ 已发布商品的修改需要重新审核后才会生效。

---

## 删除商品

\`\`\`
DELETE /v2/products/{productId}
\`\`\`

> ⚠️ 仅 \`draft\` 状态的商品可直接删除。已发布商品需先下架。`,
          },
          {
            title: "SKU 管理接口",
            slug: "skus-api",
            pageType: "api_reference",
            content: `# SKU 管理接口

## 批量创建 SKU

\`\`\`
POST /v2/products/{productId}/skus/batch
\`\`\`

根据销售属性组合批量生成 SKU。

### 请求示例

\`\`\`json
{
  "combinations": [
    {
      "attributes": { "颜色": "黑色", "存储": "256GB" },
      "price": 9499,
      "barcode": "694148700001",
      "stock": 500
    },
    {
      "attributes": { "颜色": "黑色", "存储": "512GB" },
      "price": 10999,
      "barcode": "694148700002",
      "stock": 300
    }
  ]
}
\`\`\`

### 成功响应 \`201 Created\`

\`\`\`json
{
  "created": 2,
  "skus": [
    { "id": "sku_001", "attributes": { "颜色": "黑色", "存储": "256GB" } },
    { "id": "sku_002", "attributes": { "颜色": "黑色", "存储": "512GB" } }
  ]
}
\`\`\`

## 查询 SKU 列表

\`\`\`
GET /v2/products/{productId}/skus
\`\`\`

## 更新 SKU 价格

\`\`\`
PATCH /v2/skus/{skuId}/price
\`\`\`

\`\`\`json
{
  "listPrice": 9999,
  "salePrice": 8999,
  "effectiveFrom": "2024-11-01T00:00:00Z",
  "effectiveTo": "2024-11-11T23:59:59Z"
}
\`\`\`

## 更新 SKU 库存

\`\`\`
POST /v2/skus/{skuId}/inventory
\`\`\`

\`\`\`json
{
  "action": "adjust",
  "quantity": -5,
  "reason": "manual_adjustment",
  "note": "库存盘点差异调整"
}
\`\`\``,
          },
        ],
      },
      {
        name: "更新日志",
        slug: "changelog",
        description: "版本更新记录",
        pages: [
          {
            title: "更新日志",
            slug: "changelog",
            pageType: "changelog",
            content: `# 更新日志

## v2.4.0 — 2026-03-01

### ✨ 新功能
- 新增商品 3D 模型预览能力
- 支持 SPU 属性模板，快速创建同类商品
- 搜索接口新增 \`facets\` 聚合功能

### 🐛 修复
- 修复批量更新库存时偶发的并发冲突问题
- 修复多语言商品标题搜索不准确的问题

### ⚡ 优化
- 商品详情接口响应时间降低 40%（P99: 120ms → 72ms）
- 图片上传支持并行上传，最多 10 张同时上传

---

## v2.3.0 — 2026-01-15

### ✨ 新功能
- 新增批量导入商品接口（CSV / Excel）
- 支持商品比较功能
- 新增价格历史记录查询

### 🐛 修复
- 修复 SKU 属性排序不稳定的问题

---

## v2.2.0 — 2025-11-20

### ✨ 新功能
- 新增跨境电商多币种支持
- 商品审核工作流 API
- 富文本描述支持视频嵌入

---

## v2.1.0 — 2025-09-10

### ✨ 新功能
- 初始版本发布
- 基础 CRUD 接口
- 全文搜索
- 图片管理`,
          },
        ],
      },
    ],
  },
  {
    name: "订单服务",
    slug: "order-service",
    description: "订单创建、支付、履约全流程管理，支持拆单、合单和逆向退款",
    docType: "rest_api",
    visibility: "public",
    icon: "🛒",
    currentVersion: "v3.1.0",
    categories: [
      {
        name: "快速入门",
        slug: "getting-started",
        description: "订单服务入门指南",
        pages: [
          {
            title: "概述",
            slug: "overview",
            pageType: "overview",
            content: `# 订单服务概述

订单服务是电商交易的核心枢纽，编排从下单到完成的完整交易流程。

## 订单生命周期

\`\`\`
创建 → 待支付 → 已支付 → 待发货 → 已发货 → 已签收 → 已完成
  │                │                              │
  └→ 已取消         └→ 退款中 → 已退款              └→ 售后中
\`\`\`

## 核心能力

- **正向流程** — 下单、支付、发货、签收
- **逆向流程** — 取消、退款、退货退款、换货
- **拆单合单** — 按仓库、供应商自动拆分子订单
- **订单查询** — 多维度检索、实时状态跟踪
- **事件通知** — Webhook 实时推送订单状态变更

## 系统集成

\`\`\`
                    ┌─────────────┐
                    │   订单服务    │
                    └──────┬──────┘
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │  支付服务  │  │  库存服务  │  │  物流服务  │
  └──────────┘  └──────────┘  └──────────┘
\`\`\``,
          },
          {
            title: "快速开始",
            slug: "quickstart",
            pageType: "guide",
            content: `# 快速开始

## 创建订单

\`\`\`typescript
import { OrderClient } from '@ecommerce/order-sdk';

const orderClient = new OrderClient({
  apiKey: process.env.ORDER_API_KEY,
  region: 'cn-east-1',
});

// 创建订单
const order = await orderClient.orders.create({
  buyerId: 'user_12345',
  items: [
    {
      skuId: 'sku_xm5_black',
      quantity: 1,
      price: 1799,
    },
    {
      skuId: 'sku_case_001',
      quantity: 2,
      price: 99,
    },
  ],
  shippingAddress: {
    name: '张三',
    phone: '138****1234',
    province: '上海市',
    city: '上海市',
    district: '浦东新区',
    street: '世纪大道 100 号',
    zipCode: '200120',
  },
  couponIds: ['coupon_50off'],
  note: '请小心轻放',
});

console.log('订单号:', order.orderNo);  // → ORD20260307001234
console.log('应付金额:', order.payableAmount);  // → 1947
\`\`\`

## 发起支付

\`\`\`typescript
const payment = await orderClient.orders.pay(order.id, {
  method: 'alipay',
  returnUrl: 'https://shop.example.com/order/success',
});

// 跳转支付页面
window.location.href = payment.payUrl;
\`\`\`

## 查询订单

\`\`\`typescript
const detail = await orderClient.orders.get(order.id, {
  include: ['items', 'payment', 'shipping'],
});
\`\`\`

## 注册 Webhook

\`\`\`typescript
await orderClient.webhooks.create({
  url: 'https://your-server.com/webhooks/order',
  events: [
    'order.paid',
    'order.shipped',
    'order.delivered',
    'order.refunded',
  ],
  secret: 'whsec_your_webhook_secret',
});
\`\`\``,
          },
        ],
      },
      {
        name: "开发指南",
        slug: "guides",
        description: "订单服务开发指南",
        pages: [
          {
            title: "订单状态机",
            slug: "order-state-machine",
            pageType: "guide",
            content: `# 订单状态机

订单在其生命周期中经历多个状态转换，每次转换都由特定事件触发。

## 状态定义

| 状态 | 编码 | 说明 |
|------|------|------|
| 待支付 | \`pending_payment\` | 订单已创建，等待买家支付 |
| 已支付 | \`paid\` | 支付成功，等待商家确认 |
| 待发货 | \`pending_shipment\` | 商家已确认，准备发货 |
| 已发货 | \`shipped\` | 商品已交付物流 |
| 已签收 | \`delivered\` | 买家已签收 |
| 已完成 | \`completed\` | 交易完成（签收后 7 天自动） |
| 已取消 | \`cancelled\` | 订单已取消 |
| 退款中 | \`refunding\` | 退款处理中 |
| 已退款 | \`refunded\` | 退款完成 |

## 状态转换规则

\`\`\`
pending_payment ──支付成功──→ paid
pending_payment ──超时取消──→ cancelled（30分钟未支付自动取消）
pending_payment ──主动取消──→ cancelled

paid ──商家确认──→ pending_shipment
paid ──申请退款──→ refunding

pending_shipment ──发货──→ shipped
pending_shipment ──申请退款──→ refunding

shipped ──签收──→ delivered
shipped ──拒签──→ refunding

delivered ──确认收货──→ completed（7天自动）
delivered ──申请售后──→ refunding

refunding ──退款成功──→ refunded
refunding ──退款拒绝──→ 原状态
\`\`\`

## 使用 Webhook 监听状态变更

\`\`\`json
{
  "event": "order.status_changed",
  "data": {
    "orderId": "ord_abc123",
    "orderNo": "ORD20260307001234",
    "previousStatus": "shipped",
    "currentStatus": "delivered",
    "changedAt": "2026-03-07T14:30:00Z",
    "operator": "system",
    "reason": "物流签收确认"
  }
}
\`\`\`

## 超时策略

| 场景 | 超时时间 | 自动操作 |
|------|----------|----------|
| 待支付 | 30 分钟 | 自动取消 |
| 待发货 | 72 小时 | 通知商家 |
| 已签收 | 7 天 | 自动确认收货 |
| 售后期 | 15 天 | 关闭售后窗口 |`,
          },
          {
            title: "拆单与合单",
            slug: "order-splitting",
            pageType: "guide",
            content: `# 拆单与合单

当一个订单涉及多个仓库或供应商时，系统会自动进行拆单处理。

## 拆单策略

### 按仓库拆单

\`\`\`
主订单 ORD001（3 件商品）
├── 子订单 ORD001-1（华东仓）
│   ├── iPhone 15 × 1
│   └── AirPods × 1
└── 子订单 ORD001-2（华南仓）
    └── iPad × 1
\`\`\`

### 按供应商拆单

\`\`\`
主订单 ORD002（2 件商品）
├── 子订单 ORD002-1（自营）
│   └── Sony 耳机 × 1
└── 子订单 ORD002-2（第三方商家 A）
    └── 耳机收纳包 × 1
\`\`\`

## 拆单后的支付分账

\`\`\`json
{
  "orderId": "ord_main_001",
  "totalAmount": 2097,
  "subOrders": [
    {
      "subOrderId": "ord_sub_001",
      "sellerId": "seller_self",
      "amount": 1799,
      "commission": 0
    },
    {
      "subOrderId": "ord_sub_002",
      "sellerId": "seller_third_a",
      "amount": 298,
      "commission": 29.8,
      "commissionRate": 0.10
    }
  ]
}
\`\`\`

## 合单场景

同一买家在短时间内对同一商家的多个订单可合并发货：

\`\`\`bash
POST /v3/orders/merge
{
  "orderIds": ["ord_001", "ord_002"],
  "reason": "同一收货地址合并发货"
}
\`\`\``,
          },
        ],
      },
      {
        name: "API 参考",
        slug: "api-reference",
        description: "订单服务完整接口文档",
        pages: [
          {
            title: "订单接口",
            slug: "orders-api",
            pageType: "api_reference",
            content: `# 订单接口

## 创建订单

\`\`\`
POST /v3/orders
\`\`\`

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| buyerId | string | ✅ | 买家用户 ID |
| items | OrderItem[] | ✅ | 商品列表（至少 1 项） |
| items[].skuId | string | ✅ | SKU ID |
| items[].quantity | integer | ✅ | 购买数量（≥1） |
| shippingAddress | Address | ✅ | 收货地址 |
| couponIds | string[] | | 优惠券 ID 列表 |
| note | string | | 买家备注（≤200字） |
| idempotencyKey | string | | 幂等键，防止重复下单 |

### 成功响应 \`201 Created\`

\`\`\`json
{
  "id": "ord_8f3a2b1c",
  "orderNo": "ORD20260307001234",
  "status": "pending_payment",
  "items": [],
  "amount": {
    "subtotal": 1997,
    "shipping": 0,
    "discount": -50,
    "payable": 1947
  },
  "expireAt": "2026-03-07T11:00:00Z",
  "createdAt": "2026-03-07T10:30:00Z"
}
\`\`\`

---

## 查询订单列表

\`\`\`
GET /v3/orders
\`\`\`

| 参数 | 类型 | 说明 |
|------|------|------|
| status | string | 按状态筛选 |
| startDate | string | 起始日期 |
| endDate | string | 截止日期 |
| page | integer | 页码 |
| pageSize | integer | 每页数量（默认 20，最大 100） |

---

## 取消订单

\`\`\`
POST /v3/orders/{orderId}/cancel
\`\`\`

\`\`\`json
{
  "reason": "buyer_regret",
  "note": "不想要了"
}
\`\`\`

> ⚠️ 仅 \`pending_payment\` 和 \`paid\` 状态可取消。已发货需走退货退款流程。

---

## 申请退款

\`\`\`
POST /v3/orders/{orderId}/refund
\`\`\`

\`\`\`json
{
  "type": "refund_only",
  "reason": "quality_issue",
  "amount": 1799,
  "description": "商品有质量问题",
  "evidence": [
    { "type": "image", "url": "https://..." }
  ]
}
\`\`\``,
          },
        ],
      },
    ],
  },
  {
    name: "支付网关",
    slug: "payment-gateway",
    description: "统一支付接入与事件通知中心，负责支付回调、退款通知和签名验签",
    docType: "webhook",
    visibility: "public",
    icon: "💳",
    currentVersion: "v4.2.0",
    categories: [
      {
        name: "快速入门",
        slug: "getting-started",
        description: "支付网关接入指南",
        pages: [
          {
            title: "概述",
            slug: "overview",
            pageType: "overview",
            content: `# 支付网关概述

支付网关为电商平台提供统一的支付接入能力，屏蔽底层支付渠道的差异性。

## 支持的支付方式

| 渠道 | 方式 | 适用场景 |
|------|------|----------|
| 支付宝 | APP / H5 / 扫码 / 小程序 | 全场景 |
| 微信支付 | JSAPI / H5 / Native / 小程序 | 全场景 |
| 银联 | 快捷支付 / 网银 / 云闪付 | 大额支付 |
| Apple Pay | In-App / Web | iOS 用户 |
| 信用卡 | Visa / Mastercard / JCB | 跨境支付 |
| 余额支付 | 平台余额 | 内部结算 |

## 核心特性

- **统一接口** — 一套 API 接入所有支付渠道
- **智能路由** — 自动选择最优支付通道
- **安全合规** — PCI-DSS Level 1 认证
- **多币种** — 支持 CNY、USD、EUR 等 30+ 币种
- **自动对账** — T+1 自动对账，异常交易报警

## 交易流程

\`\`\`
用户下单 → 创建支付单 → 收银台 → 渠道支付 → 回调通知 → 完成
               │                              │
               └────── 支付超时 → 关闭 ←────── 支付失败
\`\`\``,
          },
          {
            title: "接入指南",
            slug: "integration-guide",
            pageType: "guide",
            content: `# 接入指南

## 创建支付单

\`\`\`typescript
import { PaymentClient } from '@ecommerce/payment-sdk';

const payClient = new PaymentClient({
  merchantId: 'mch_your_id',
  apiKey: process.env.PAYMENT_API_KEY,
  privateKey: fs.readFileSync('./private_key.pem'),
});

// 创建支付单
const payment = await payClient.payments.create({
  outTradeNo: 'ORD20260307001234',
  amount: 1947,
  currency: 'CNY',
  subject: 'Sony WH-1000XM5 等 2 件商品',
  method: 'alipay_h5',
  expireMinutes: 30,
  notifyUrl: 'https://api.your-site.com/webhooks/payment',
  returnUrl: 'https://your-site.com/order/success',
  metadata: {
    orderId: 'ord_8f3a2b1c',
    buyerId: 'user_12345',
  },
});
\`\`\`

**响应：**

\`\`\`json
{
  "paymentId": "pay_9a8b7c6d",
  "status": "pending",
  "payUrl": "https://pay.example.com/cashier?token=xxx",
  "expireAt": "2026-03-07T11:00:00Z"
}
\`\`\`

## 接收支付回调

\`\`\`typescript
app.post('/webhooks/payment', (req, res) => {
  // 验证签名
  const isValid = payClient.webhooks.verify(
    req.body,
    req.headers['x-signature']
  );
  
  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }

  const { event, data } = req.body;

  switch (event) {
    case 'payment.success':
      // 更新订单状态为已支付
      await orderService.markPaid(data.metadata.orderId, {
        paymentId: data.paymentId,
        paidAt: data.paidAt,
        method: data.method,
      });
      break;

    case 'payment.failed':
      console.log('支付失败:', data.failReason);
      break;

    case 'refund.success':
      await orderService.markRefunded(data.metadata.orderId);
      break;
  }

  res.json({ received: true });
});
\`\`\`

## 发起退款

\`\`\`typescript
const refund = await payClient.refunds.create({
  paymentId: 'pay_9a8b7c6d',
  amount: 1799,
  reason: '商品质量问题退款',
  outRefundNo: 'REF20260308001',
});
\`\`\`

## 安全最佳实践

1. **永远验签** — 回调通知必须验证签名，防止伪造
2. **幂等处理** — 同一笔支付回调可能多次，需保证幂等
3. **不信任客户端** — 支付金额以服务端为准，不要使用前端传递的金额
4. **使用 HTTPS** — 所有支付相关通信必须使用 TLS 1.2+
5. **密钥管理** — 私钥存储在安全的密钥管理系统中，不要硬编码`,
          },
        ],
      },
      {
        name: "API 参考",
        slug: "api-reference",
        description: "支付接口文档",
        pages: [
          {
            title: "支付回调事件",
            slug: "payments-api",
            pageType: "api_reference",
            content: `# 支付回调事件

支付网关通过 Webhook 将异步支付结果推送到你的业务系统，适用于支付成功、支付失败、退款完成和风控拦截等事件。

## 推送方式

\`\`\`
POST https://your-site.com/webhooks/payment
Content-Type: application/json
X-Signature-256: t=1710206400,v1=8f5f0e...
X-Event-Id: evt_202603080001
X-Retry-Count: 0
\`\`\`

所有事件采用统一信封结构：

\`\`\`json
{
  "id": "evt_202603080001",
  "event": "payment.succeeded",
  "occurredAt": "2026-03-08T10:30:22Z",
  "requestId": "req_abc123",
  "data": {}
}
\`\`\`

## \`payment.succeeded\`

支付成功后发送，建议以此事件作为订单改写的唯一事实来源。

\`\`\`json
{
  "id": "evt_202603080001",
  "event": "payment.succeeded",
  "occurredAt": "2026-03-08T10:30:22Z",
  "data": {
    "paymentId": "pay_9a8b7c6d",
    "outTradeNo": "ORD20260307001234",
    "amount": 1947,
    "currency": "CNY",
    "channel": "alipay_h5",
    "paidAt": "2026-03-08T10:30:21Z",
    "metadata": {
      "orderId": "ord_8f3a2b1c",
      "buyerId": "user_12345"
    }
  }
}
\`\`\`

## \`payment.failed\`

支付失败或风控拦截时发送，业务系统应记录失败原因并允许用户重新发起支付。

\`\`\`json
{
  "id": "evt_202603080002",
  "event": "payment.failed",
  "occurredAt": "2026-03-08T10:31:02Z",
  "data": {
    "paymentId": "pay_9a8b7c6d",
    "outTradeNo": "ORD20260307001234",
    "reasonCode": "CHANNEL_TIMEOUT",
    "reasonMessage": "Upstream acquirer timed out."
  }
}
\`\`\`

## \`refund.succeeded\`

退款完成后发送，适合驱动售后单、账务流水和消息通知。

\`\`\`json
{
  "id": "evt_202603080003",
  "event": "refund.succeeded",
  "occurredAt": "2026-03-08T11:08:40Z",
  "data": {
    "refundId": "ref_20260308001",
    "paymentId": "pay_9a8b7c6d",
    "outRefundNo": "REF20260308001",
    "amount": 1799,
    "status": "succeeded"
  }
}
\`\`\`

## Signature Verification

收到回调后必须先验签，再处理业务逻辑：

\`\`\`typescript
import crypto from "node:crypto";

function verifySignature(rawBody: string, signature: string, secret: string) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}
\`\`\`

## Retry Strategy

当你的服务未在 10 秒内返回 2xx，支付网关会自动重试：

| 重试次数 | 间隔 |
|----------|------|
| 第 1 次 | 30 秒 |
| 第 2 次 | 2 分钟 |
| 第 3 次 | 10 分钟 |
| 第 4 次 | 1 小时 |
| 第 5 次 | 6 小时 |

建议按 \`X-Event-Id\` 做幂等处理，避免重复更新订单状态。`,
          },
        ],
      },
    ],
  },
  {
    name: "用户与会员服务",
    slug: "user-membership",
    description: "面向前端与运营系统的 GraphQL 用户与会员域，聚合身份、权益、积分和地址数据",
    docType: "graphql_api",
    visibility: "public",
    icon: "👤",
    currentVersion: "v2.0.0",
    categories: [
      {
        name: "快速入门",
        slug: "getting-started",
        description: "用户与会员服务入门",
        pages: [
          {
            title: "概述",
            slug: "overview",
            pageType: "overview",
            content: `# 用户与会员服务概述

用户与会员服务提供完整的用户身份管理和会员运营能力。

## 功能矩阵

| 模块 | 功能 |
|------|------|
| 用户管理 | 注册、登录、实名认证、多端登录 |
| 会员体系 | 等级、积分、权益、成长值 |
| 账户安全 | 两步验证、异常检测、设备管理 |
| 地址管理 | 多地址、默认地址、地址补全 |

## 会员等级

\`\`\`
普通会员 → 银牌会员 → 金牌会员 → 铂金会员 → 钻石会员
 0 成长值  1000       5000       20000       100000
\`\`\`

| 等级 | 积分倍率 | 包邮门槛 | 专属客服 | 生日礼券 |
|------|----------|----------|----------|----------|
| 普通 | 1x | ¥99 | ❌ | ❌ |
| 银牌 | 1.2x | ¥59 | ❌ | ¥10 |
| 金牌 | 1.5x | ¥0 | ✅ | ¥50 |
| 铂金 | 2x | ¥0 | ✅ | ¥100 |
| 钻石 | 3x | ¥0 | ✅ | ¥200 |

## 积分规则

- 每消费 1 元获得 1 基础积分（乘以会员倍率）
- 每日签到 +10 积分
- 评价晒单 +20 积分
- 100 积分 = 1 元抵扣`,
          },
        ],
      },
      {
        name: "API 参考",
        slug: "api-reference",
        description: "用户接口文档",
        pages: [
          {
            title: "用户 GraphQL",
            slug: "users-api",
            pageType: "api_reference",
            content: `# 用户 GraphQL API

用户与会员服务统一通过 GraphQL 暴露查询与变更能力，便于 App、H5 和运营后台按需聚合资料。

## 访问入口

\`\`\`
POST /graphql
Authorization: Bearer {accessToken}
\`\`\`

## Schema

\`\`\`graphql
type Query {
  viewer: Viewer!
  membership(userId: ID!): Membership!
  memberBenefits(level: MembershipLevel!): [Benefit!]!
}

type Mutation {
  registerUser(input: RegisterUserInput!): RegisterUserPayload!
  redeemPoints(input: RedeemPointsInput!): RedeemPointsPayload!
  addAddress(input: AddAddressInput!): Address!
}

type Viewer {
  id: ID!
  nickname: String!
  phone: String!
  membership: Membership!
  defaultAddress: Address
}

type Membership {
  level: MembershipLevel!
  points: Int!
  growthValue: Int!
  nextLevel: MembershipLevel
}
\`\`\`

## Query viewer

\`\`\`graphql
query ViewerProfile {
  viewer {
    id
    nickname
    phone
    membership {
      level
      points
      growthValue
      nextLevel
    }
    defaultAddress {
      city
      district
      street
    }
  }
}
\`\`\`

### Response

\`\`\`json
{
  "data": {
    "viewer": {
      "id": "usr_abc123",
      "nickname": "张三",
      "phone": "138****0000",
      "membership": {
        "level": "GOLD",
        "points": 15420,
        "growthValue": 8350,
        "nextLevel": "PLATINUM"
      },
      "defaultAddress": {
        "city": "上海市",
        "district": "浦东新区",
        "street": "世纪大道 100 号 A 座 2001"
      }
    }
  }
}
\`\`\`

## Query memberBenefits

\`\`\`graphql
query GoldBenefits {
  memberBenefits(level: GOLD) {
    code
    title
    description
  }
}
\`\`\`

## Mutation registerUser

\`\`\`graphql
mutation RegisterUser {
  registerUser(
    input: {
      phone: "13800138000"
      verifyCode: "123456"
      password: "P@ssw0rd!"
      nickname: "张三"
      inviteCode: "INV_ABC123"
    }
  ) {
    user {
      id
      nickname
    }
    accessToken
    refreshToken
  }
}
\`\`\`

### Response

\`\`\`json
{
  "data": {
    "registerUser": {
      "user": {
        "id": "usr_abc123",
        "nickname": "张三"
      },
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi..."
    }
  }
}
\`\`\`

## Mutation redeemPoints

\`\`\`graphql
mutation RedeemPoints {
  redeemPoints(
    input: {
      userId: "usr_abc123"
      points: 1000
      orderId: "ord_8f3a2b1c"
    }
  ) {
    deductionAmount
    remainingPoints
    ledgerId
  }
}
\`\`\`

GraphQL 客户端建议启用 persisted queries，并基于字段级权限控制手机号、地址和成长值等敏感信息。`,
          },
        ],
      },
    ],
  },
  {
    name: "物流追踪服务",
    slug: "logistics-tracking",
    description: "物流轨迹查询、运费计算、电子面单和智能路由",
    docType: "rest_api",
    visibility: "public",
    icon: "🚚",
    currentVersion: "v1.5.0",
    categories: [
      {
        name: "快速入门",
        slug: "getting-started",
        description: "物流服务入门",
        pages: [
          {
            title: "概述",
            slug: "overview",
            pageType: "overview",
            content: `# 物流追踪服务概述

物流追踪服务为电商平台提供端到端的物流解决方案。

## 核心能力

### 📮 电子面单

对接顺丰、中通、圆通、韵达等主流快递公司的电子面单接口，支持批量打印。

### 📍 轨迹追踪

实时推送物流节点更新，支持地图可视化。

### 💰 运费计算

基于重量、体积、距离的智能运费计算引擎。

### 🗺️ 智能路由

根据收发地址、时效要求和成本自动选择最优物流方案。

## 支持的快递公司

| 快递公司 | 编码 | 电子面单 | 轨迹查询 | 运费计算 |
|----------|------|----------|----------|----------|
| 顺丰速运 | SF | ✅ | ✅ | ✅ |
| 中通快递 | ZTO | ✅ | ✅ | ✅ |
| 圆通速递 | YTO | ✅ | ✅ | ✅ |
| 韵达快递 | YD | ✅ | ✅ | ✅ |
| 京东物流 | JD | ✅ | ✅ | ✅ |
| EMS | EMS | ✅ | ✅ | ✅ |

## 物流状态流转

\`\`\`
揽收 → 运输中 → 派送中 → 已签收
                  │
                  └→ 异常（拒签/丢失/破损）
\`\`\``,
          },
        ],
      },
      {
        name: "API 参考",
        slug: "api-reference",
        description: "物流接口文档",
        pages: [
          {
            title: "物流接口",
            slug: "logistics-api",
            pageType: "api_reference",
            content: `# 物流接口

## 创建运单

\`\`\`
POST /v1/shipments
\`\`\`

\`\`\`json
{
  "carrier": "SF",
  "serviceType": "standard",
  "sender": {
    "name": "电商仓库",
    "phone": "021-12345678",
    "address": "上海市嘉定区物流园区 A3"
  },
  "receiver": {
    "name": "张三",
    "phone": "13800138000",
    "address": "北京市朝阳区建国路 88 号"
  },
  "packages": [
    {
      "weight": 0.5,
      "dimensions": { "length": 30, "width": 20, "height": 10 },
      "items": [
        { "name": "Sony 耳机", "quantity": 1, "value": 1799 }
      ]
    }
  ]
}
\`\`\`

### 响应

\`\`\`json
{
  "shipmentId": "shp_abc123",
  "trackingNo": "SF1234567890",
  "carrier": "SF",
  "labelUrl": "https://cdn.example.com/labels/sf1234567890.pdf",
  "estimatedDelivery": "2026-03-09",
  "freight": 12.00
}
\`\`\`

---

## 查询物流轨迹

\`\`\`
GET /v1/tracking/{trackingNo}?carrier=SF
\`\`\`

\`\`\`json
{
  "trackingNo": "SF1234567890",
  "carrier": "SF",
  "status": "in_transit",
  "estimatedDelivery": "2026-03-09",
  "events": [
    {
      "time": "2026-03-08T09:15:00Z",
      "status": "in_transit",
      "location": "北京转运中心",
      "description": "快件已到达北京转运中心，准备派送"
    },
    {
      "time": "2026-03-07T18:30:00Z",
      "status": "in_transit",
      "location": "上海转运中心",
      "description": "快件已从上海转运中心发出"
    },
    {
      "time": "2026-03-07T15:00:00Z",
      "status": "picked_up",
      "location": "上海嘉定",
      "description": "快递员已揽收"
    }
  ]
}
\`\`\`

---

## 运费计算

\`\`\`
POST /v1/freight/calculate
\`\`\`

\`\`\`json
{
  "from": { "province": "上海", "city": "上海" },
  "to": { "province": "北京", "city": "北京" },
  "weight": 0.5,
  "carriers": ["SF", "ZTO", "YTO"]
}
\`\`\`

### 响应

\`\`\`json
{
  "options": [
    { "carrier": "SF", "service": "standard", "price": 12, "days": "1-2" },
    { "carrier": "SF", "service": "express", "price": 23, "days": "次日达" },
    { "carrier": "ZTO", "service": "standard", "price": 8, "days": "2-3" },
    { "carrier": "YTO", "service": "standard", "price": 8, "days": "2-3" }
  ]
}
\`\`\``,
          },
        ],
      },
    ],
  },
];

// ─── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 开始创建电商平台文档...\n");

  let existingTrees = [];

  // First, delete the old sample "Order API" product
  try {
    existingTrees = await get("/api/product-trees");
    for (const p of existingTrees) {
      if (p.name === "Order API") {
        for (const cat of p.categories) {
          for (const page of cat.pages || []) {
            await fetch(`${BASE}/api/doc-pages/${page.id}`, { method: "DELETE" });
          }
          await fetch(`${BASE}/api/categories/${cat.id}`, { method: "DELETE" });
        }
        await fetch(`${BASE}/api/products/${p.id}`, { method: "DELETE" });
        console.log("🗑️  已删除旧示例 'Order API'\n");
      }
    }
    existingTrees = existingTrees.filter((product) => product.name !== "Order API");
  } catch (e) {
    console.log("(跳过旧数据清理)");
  }

  let totalPages = 0;

  for (const productDef of PRODUCTS) {
    const { categories, ...productFields } = productDef;
    let productTree = existingTrees.find((product) => product.slug === productFields.slug);

    const product = productTree
      ? await put(`/api/products/${productTree.id}`, productFields)
      : await post("/api/products", productFields);
    console.log(`📦 ${product.name} (${product.id}) ${productTree ? "[updated]" : "[created]"}`);

    if (!productTree) {
      productTree = { ...product, categories: [] };
      existingTrees.push(productTree);
    }

    const existingCategories = flattenCategories(productTree.categories);

    for (const catDef of categories) {
      const { pages, ...catFields } = catDef;
      let categoryNode = existingCategories.find((category) => category.slug === catFields.slug);

      const category = categoryNode
        ? await put(`/api/categories/${categoryNode.id}`, {
            ...catFields,
            productId: product.id,
            parentId: categoryNode.parentId ?? null,
          })
        : await post("/api/categories", {
            ...catFields,
            productId: product.id,
          });
      console.log(`  📁 ${category.name} ${categoryNode ? "[updated]" : "[created]"}`);

      if (!categoryNode) {
        categoryNode = { ...category, children: [], pages: [] };
        existingCategories.push(categoryNode);
        productTree.categories.push(categoryNode);
      }

      for (const pageDef of pages) {
        const existingPage = (categoryNode.pages || []).find((page) => page.slug === pageDef.slug);
        const page = existingPage
          ? await put(`/api/doc-pages/${existingPage.id}`, {
              ...pageDef,
              categoryId: category.id,
            })
          : await post("/api/doc-pages", {
              ...pageDef,
              categoryId: category.id,
            });
        console.log(`    📄 ${page.title} ${existingPage ? "[updated]" : "[created]"}`);

        if (!existingPage) {
          categoryNode.pages.push(page);
        }

        // Update content
        await put(`/api/doc-pages/${page.id}`, {
          _action: "updateContent",
          content: pageDef.content,
        });

        // Publish the page
        await put(`/api/doc-pages/${page.id}`, {
          _action: "publish",
          changelog: existingPage ? "Seed refresh" : "Initial release",
        });

        totalPages++;
      }
    }
    console.log();
  }

  console.log(
    `✅ 完成！创建了 ${PRODUCTS.length} 个产品、${totalPages} 篇文档页面，全部已发布。`
  );
}

main().catch((err) => {
  console.error("❌ 失败:", err.message);
  process.exit(1);
});
