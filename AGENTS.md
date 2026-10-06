# AGENTS.md · 给 AI 助手的项目说明

> 这份文件写给组员用的 AI 助手（Claude Code、Codex、Cursor 等）。开始改仓库之前先读完它，再读 [PLAN.md](PLAN.md)。
> 用组员跟你说话的语言回答，组员多半用中文。

## 1. 项目是什么

- INFO90006 Fieldwork for Design（墨尔本大学）的小组项目，最后交付是 **3 分钟 design concept video + 2 页报告**，截止 **2026-10-20 15:00**。
- 设计概念：帮大学生管理家里的食物、减少浪费的 app，暂名 **ShelfLife**。它依据小组已提交的 fieldwork 报告：6 个发现（F1–F6）、5 条功能需求（R1–R5）、伦理需求，以及两个 persona（May、John）。
- 这个仓库是 **lo-fi 可点击原型**，用来讨论和录视频。最新的方向和待办在 [PLAN.md](PLAN.md)；现在这版的设计细节在 [docs/DESIGN.md](docs/DESIGN.md)。

## 2. 必须遵守的规则

1. **仓库是私有的，不要公开**，也不要把内容贴到公开的地方。`index.html` 的设计注释（`NOTES`）里有约 30 条参与者的匿名引用（P1–P8），来自已提交的报告。保持原样，不要新增。
2. **不要加入任何真实的参与者数据**：访谈录音、转写、日记原文、同意书、真名、学校、联系方式。原型里的食物、日期、人物都是编的。
3. **课程的 AI 规定**：
   - 不能用 AI 编造 fieldwork 数据，也不能编造新的发现或需求。
   - 视频里的**旁白台词**、2 页报告的**正文和 Reflection**，由组员自己写。你可以给结构、要点，帮忙检查，但不要替组员写成稿。
   - 小组提交时会在报告里写明 AI 的用途。如果你做了实质性的修改，在提交说明里写清楚。
4. **改动前先看 PLAN.md 的状态**。标"待定"的事（比如砍哪些功能、首页要不要改成冰箱背景）要等小组周五开会定下来。组员明确叫你做的，照做；没叫你做的，先提出方案，不要自己大改。
5. 原型是**单个文件** `index.html`：没有构建步骤，没有 npm，不用框架。CSS 和 JS 都写在文件里；唯一的外部资源是 Google Fonts。保持这样。
6. **界面文案用英文**（视频要给英文阅卷人看）；设计注释、演示栏这些"注释层"用中文。

## 3. 文件

```
index.html        当前原型（网站版 v0.2），用 Chrome 打开就能运行
phone-v0.1.html   早期手机外框版本，已不再更新
截图/             21 张页面截图 + 总览（浅色主题）
PLAN.md           Jenny 的建议、会议讨论、改动清单、视频大纲、时间线
docs/DESIGN.md    现在这版原型的设计细节：页面、需求对照、设计判断
AGENTS.md         本文件
CLAUDE.md         Claude Code 的入口，内容就是引用本文件
```

## 4. index.html 的结构

`index.html` 是一个单页应用，状态都在内存里，每次操作后整页重新渲染。脚本按下面这些注释分区（在文件里搜 `/* =====` 就能找到）：

| 分区 | 主要内容 |
|---|---|
| CSS 开头的 `:root` | 颜色和字体 token。**浅色、深色各要写一遍**：`:root`、`@media (prefers-color-scheme: dark)`、`:root[data-theme="dark"]` 三处都要改 |
| annotation data | `RQ`（R1–R5、E 的说明）、`NOTES`（每页右侧"设计注释"的内容，按页面 key 存）、`PLAN_HTML`（注释栏里的"成片安排"） |
| product data | `BASE.may` / `BASE.john`：persona 的示例数据，包括 `locs`（存放位置）、`items`（食物）、`receipt` / `email` / `photoLines`（三种录入来源）、`plan`（周计划）、`shop`、`set`（设置）等。`STEPS`：演示栏里每个场景的步骤 |
| state & helpers | `S`：全局 UI 状态（当前人物、页面、抽屉、日期等）。`D`：当前人物数据的可变副本。常用工具：`P()`（当前人物数据）、`item(id)`、`locOf(id)`、`esc()`（HTML 转义）、`rq('R1')`（需求标签）、`dateInfo()` / `chip()`（日期标签） |
| data actions | `start(persona, day, clock)` 重置到某个人物和时刻；`changeDays()` 改计划并重排食物；`confirmReceipt()` 把核对页里的行加进食物；`makePhoto()` / `startPhoto()` 模拟照片识别；`suggestAlert()` 购物提醒；`toast()` 底部提示 |
| icons | `ICON` / `LI`：线条图标；`FOOD_EMOJI`：按食物名匹配 emoji；`fi()` / `fe()` 输出食物图标；`pIcon()` 输出存放位置图标 |
| product views | 每个页面一个函数：`vToday`、`vFood`（冰箱可视化在 `vizHtml`，列表在 `foodRows`，摆放规则在 `SPOTS` 和 `spotOf`）、`vAdd`、`vReceipt`（小票、邮件、照片共用的核对页）、`vPlan`、`vShop`、`vSettings`、`vAccount`、`vAuth`（登录和首次设置） |
| drawers & overlays | 右侧抽屉：`drawerItem`、`drawerPlaces`、`drawerMeasure`、`drawerPhoto`、`drawerEmailConsent` 等；`notifHtml` 推送提醒 |
| render | `render()` 依次调用 `renderDemo`、`renderSide`、`renderMain`、`renderNotes`、`renderOverlay`；`mainView()` 按 `S.tab` 选页面；`notesKey()` 决定注释栏显示 `NOTES` 里的哪一条 |
| events | 点击统一走 `data-act="动作名" data-arg="参数"`，对应 `ACT` 里的同名函数；下拉和输入框的 change 走 `data-change`，对应 `CHG`。处理完自动 `render()` |

**几个约定**
- 日期用"2026 年 10 月的第几天"表示（`6` = 10 月 6 日周二；`0` = 9 月 30 日；`32` = 11 月 1 日）。用 `fmt(d)` 显示。
- 日期类型（`date.t`）：`useby`（包装上的 use-by）、`bb`（best before）、`est`（估计，`lo`–`hi`，要写 `basis` 说明依据）、`frozen`（`on` 是冻进去的那天）、`none`。**估计值一定要标成估计**（虚线），这是伦理需求。
- 不要用 `alert()` / `confirm()` / `prompt()`：原型可能在嵌入页面里运行，这些会被拦掉。需要确认时，在页面里做一个确认框（参考 `S.acConfirm`）。
- `localStorage` 只通过 `store.get` / `store.set` 用（已经包了 try/catch），而且只存界面偏好。
- 所有插进 HTML 的文字都要用 `esc()` 转义。

**常见改法**
- 新增一个页面：在 `TABS` 里加 key，在 `renderSide` 的 `NAV` 里加一项，写一个 `vXxx()` 并接到 `mainView()`，在 `NOTES` 里加注释，必要时在 `notesKey()` 里映射。
- 新增一个演示步骤：在 `STEPS.may` 或 `STEPS.john` 里加 `{t, d, go(){...}}`；`go` 里先调用 `start(...)` 重置，再设好状态。
- 新增食物图标：在 `FOOD_EMOJI` 里加 `[/关键词/, 'emoji']`。更具体的规则要放在更笼统的规则前面。
- 改 persona 的示例数据：改 `BASE`，保持和报告里的 persona 一致（May：合租、没有冷冻室；John：一个人住、有冷冻室）。

## 5. 改完怎么检查

1. 用 Chrome 打开 `index.html`，打开开发者工具（Cmd+Option+I），确认 Console 没有报错。
2. 在演示栏里把 May 的 1–4、John 的 1–4 各点一遍，再点"新用户注册"走一遍注册流程。
3. 窗口拉窄到手机宽度（或在开发者工具里切到手机模式），看导航是否变成底部标签栏。
4. 浅色和深色都看一眼（跟随系统设置）。
5. 页面外观有大的改动时，更新 `截图/` 里对应的图（手动截图即可，命名保持一致）。

## 6. Git 协作

- 开始前先 `git pull`。
- 每个功能开一个分支：`名字/功能`，例如 `xuan/fridge-home`。改完提交，开 Pull Request 合并到 `main`。
- `index.html` 是单个大文件，两个人同时改同一段很容易冲突。动手前在群里说一声你要改哪一块（比如 `vFood`、`BASE.john`），尽量小步提交。
- 提交说明写清"改了什么、为什么"，例如：`Plan: per-meal eat-out instead of per-day (PLAN #4)`。
- 不要提交录音、转写、`.DS_Store`、个人文件。
- 在线版（claude.ai 上的 artifact）属于嘉阔的账号，不会随仓库更新；以仓库为准。
