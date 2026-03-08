一、先定义范围

如果只做“API 文档发布”这块，建议范围控制在 6 个域：

文档资产管理

文档编辑与结构化编排

发布流程与版本管理

文档站点展示

权限与可见性控制

变更通知与审计

暂时先不做：

API 网关运行时管理

在线真实调试调用

商业化计费

开发者应用注册

高级监控分析

这些都可以后挂。

二、这个系统要解决的核心问题

API 文档发布平台本质上解决 8 个问题：

1. 文档来源不统一

有的写 Markdown

有的写 OpenAPI

有的写 Protobuf 注释

有的直接 Confluence 复制

平台要统一入口和产物格式。

2. 文档质量不稳定

缺参数说明

缺错误码

示例不完整

命名混乱

平台要能校验质量。

3. 文档和接口版本不同步

代码改了，文档没发

文档改了，接口没上线

多版本并存混乱

平台要支持版本与发布态管理。

4. 文档发布缺少流程控制

谁都能改

改完直接上线

没审核

没回滚

平台要支持审核和发布流。

5. 不同读者看到的内容不同

内部 API

合作伙伴 API

公开 API

Beta 文档

平台要支持可见范围和访问控制。

6. 文档不易消费

搜不到

结构乱

代码示例缺失

版本切换困难

平台要把“阅读体验”做成产品。

7. 变更不可追踪

不知道改了什么

不知道谁发布的

不知道何时废弃

平台要有 diff、changelog、审计。

8. 文档无法规模化治理

API 一多就失控

没 owner

没分类

没生命周期

平台要有目录和治理属性。

三、核心功能架构

我建议先拆成 7 个模块。

1. 文档资产中心

这是底座。

1.1 文档对象模型

平台里至少要有这些核心对象：

API Product

一组对外能力的产品级集合

例如：Order API、Payment API、Affiliate API

API Document

某个文档实体

例如：获取订单列表、创建订单

Document Version

文档版本，如 v1、v2、2026-03

Document Page

页面级内容，如概述、快速开始、鉴权、错误码、接口详情

Schema Asset

OpenAPI / JSON Schema / Protobuf / GraphQL Schema

Release

一次发布记录

ChangeLog Entry

一次变更说明

1.2 资产元数据

每篇文档需要这些元信息：

标题

slug / path

产品线

API 分类

tag

owner

状态

可见范围

当前版本

来源类型

语言

发布时间

废弃时间

关联 schema

关联服务/仓库

1.3 分类体系

建议至少支持 3 层：

产品/Product

分类/Category

文档/Page

例如：

Admin API

Order

Get Orders

Create Order

Product

Get Products

Developer Guide

Authentication

Rate Limits

Webhook Guide

2. 文档编辑系统

这是用户最常操作的部分。

建议支持 双模式编辑：

2.1 Schema 驱动编辑

适合接口文档页：

导入 OpenAPI / Swagger

导入 Protobuf

从 GraphQL schema 生成

自动解析：

path

method

params

request body

response body

examples

error codes

这种模式的核心是：
接口详情不要靠手写，尽量靠 schema 生成。

2.2 富文本 / Markdown 编辑

适合非接口页：

概述

快速开始

鉴权说明

签名规则

错误码说明

FAQ

升级指南

需要支持：

Markdown

表格

提示块

代码块

图片

Tabs

折叠块

锚点目录

内链

2.3 页面编排能力

要支持：

文档目录树拖拽排序

页面分组

页面模板

顶部导航 / 侧边导航配置

版本文档复用页面

2.4 示例生成

每个接口最好自动生成：

cURL

JavaScript

Python

Java

Go

PHP

2.5 预览能力

至少要有：

页面预览

站点预览

多语言预览

不同版本预览

发布前预览链接

3. 文档质量校验

这是很多平台一开始忽略，后期又不得不补的模块。

3.1 结构校验

例如：

是否有 summary

是否有 description

参数是否有说明

响应字段是否有说明

是否有示例

是否有错误码

是否有鉴权说明

3.2 规范校验

例如：

path 命名规范

tag 命名规范

operationId 唯一

enum 是否有说明

deprecated 是否标注

breaking change 检测

3.3 发布门禁

可以配置规则：

校验不通过不能发布

缺少 reviewer 不能发布

缺少 changelog 不能发布

3.4 文档评分

可以做一个文档健康度：

完整性

可读性

示例完备度

规范合规度

4. 发布工作流

这是“文档平台”和“静态站生成器”的分水岭。

建议定义一套状态机：

Draft

In Review

Approved

Scheduled

Published

Deprecated

Archived

4.1 草稿能力

自动保存

草稿箱

未发布修改

与线上版本隔离

4.2 审核流

至少支持：

提交审核

指定 reviewer

评论

驳回

重新提交

审核通过

4.3 发布方式

支持：

立即发布

定时发布

灰度发布（先内部可见）

多环境发布（staging / prod docs）

4.4 回滚

支持按 release 回滚：

回滚某一页

回滚整个版本

回滚目录结构

4.5 发布记录

每次发布记录：

发布人

发布时间

变更摘要

影响范围

版本号

审核人

关联工单 / PR

5. 版本管理

API 文档不做版本管理，后面一定炸。

5.1 版本层级

建议分两层：

文档产品版本

例如：

v1

v2

beta

页面修订版本

例如：

rev 12

rev 13

这样能解决：

用户看到的是 v1 / v2

内部还能追踪每次编辑修订

5.2 Diff 能力

至少支持：

页面内容 diff

schema diff

字段新增/删除/变更 diff

目录 diff

5.3 兼容性标记

对 API 接口页建议自动识别：

additive change

non-breaking change

breaking change

5.4 弃用机制

支持：

deprecated 标记

替代接口链接

下线日期

升级指南链接

6. 文档站点展示层

这部分决定使用体验。

6.1 门户首页

产品卡片

分类导航

最近更新

热门 API

快速开始入口

6.2 文档详情页

接口页建议有这些区块：

接口名称

方法 + 路径

功能描述

权限/鉴权要求

请求参数

请求示例

响应示例

错误码

SDK 示例

更新记录

废弃说明

6.3 搜索

至少支持：

按标题搜

按 path 搜

按 tag 搜

按字段名搜

按错误码搜

6.4 多版本切换

同一页支持：

v1 / v2 切换

beta 标签

deprecated 标签

6.5 多语言

建议底层支持：

中文

英文

不要后面再补，不然内容模型会变形。

6.6 阅读体验

固定目录

锚点导航

复制代码

响应折叠

深链分享

面包屑

暗色模式可后置

7. 权限、可见性、审计

这部分是企业场景必备。

7.1 角色

建议先支持：

平台管理员

文档管理员

编辑者

审核者

只读用户

外部开发者

7.2 可见范围

每份文档支持：

Public

Private

Partner

Internal

Beta users only

7.3 权限粒度

至少到：

产品级

分类级

页面级

版本级

发布操作级

7.4 审计日志

记录：

谁创建了文档

谁修改了哪些字段

谁提交审核

谁发布

谁回滚

谁改了权限

四、建议的信息架构

一个比较合理的后台菜单可以这样拆：

1）文档中心

文档列表

分类管理

标签管理

模板管理

2）API 资产

Schema 管理

OpenAPI 导入

Protobuf 导入

示例管理

错误码库

3）发布管理

草稿箱

审核队列

发布记录

回滚记录

定时发布

4）站点管理

导航配置

首页配置

SEO 配置

域名配置

版本展示配置

5）权限与成员

角色管理

成员管理

访问策略

可见范围配置

6）治理中心

规则校验

质量评分

变更日志

废弃管理

审计日志

五、MVP 最小功能集

如果你现在就要开始做，第一阶段不要做太大。
我建议 MVP 只做这些：

必做

文档目录管理

Markdown 编辑

OpenAPI 导入并生成接口页

文档预览

草稿 / 发布 两态

版本切换

基础搜索

基础权限控制

发布记录

审计日志

第二阶段

审核流

定时发布

schema diff

changelog 自动生成

多语言

文档质量校验

模板系统

第三阶段

灰度发布

partner 文档门户

外部访问授权

SDK 自动生成

与 Git / CI 联动

弃用与升级治理

六、核心数据模型建议

你如果要开始设计表结构/领域模型，最少要有这些实体：

Document

id

title

slug

product_id

category_id

doc_type

visibility

status

owner_id

current_version_id

DocumentVersion

id

document_id

version_name

revision

content_source

schema_asset_id

changelog

is_published

published_at

DocumentPage

id

version_id

parent_id

title

page_type

content

order_no

SchemaAsset

id

asset_type

source_type

raw_content

parsed_content

checksum

imported_at

Release

id

target_type

target_id

version_id

release_note

released_by

released_at

ReviewTask

id

document_id

version_id

reviewer_id

status

comments

AuditLog

id

actor_id

action

resource_type

resource_id

before_data

after_data

created_at

七、几个关键设计决策

这几个问题要尽早定，不然后面会返工。

决策 1：文档是否 schema-first

建议：

接口详情页 schema-first

说明类页面 markdown-first

不要全手写。

决策 2：版本是“站点级”还是“文档级”

建议：

对外展示用 产品级版本

内部编辑用 文档级修订

否则很难管理。

决策 3：发布是整站发布还是页面发布

建议先做：

页面级发布

但支持“按产品版本批量发布”

灵活性更高。

决策 4：内容存储格式

建议：

Markdown / 富文本存正文

OpenAPI / Protobuf 原文单独存

渲染时生成统一中间结构

不要把一切揉成 HTML。

决策 5：是否接 Git

MVP 不必强依赖 Git。
先把平台自身工作流跑通，再做：

Git 导入

PR 审核联动

CI 自动发布文档

八、从产品视角看，最重要的页面

如果你要画原型，我建议优先画这 8 个页面：

文档列表页

文档编辑页

OpenAPI 导入页

文档预览页

审核详情页

发布记录页

文档站点详情页

版本 diff 页

这 8 个页面基本就把骨架搭起来了。

九、一个现实可落地的迭代路线
Phase 1：先把“能发”做出来

文档目录

编辑器

schema 导入

预览

发布

站点展示

Phase 2：再把“发得规范”做出来

审核流

校验规则

diff

changelog

权限

Phase 3：最后把“发得可治理”做出来

多版本

多语言

废弃治理

资产目录

Git/CI 集成