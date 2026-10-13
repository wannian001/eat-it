# AGENTS.md · 给 AI 助手的项目说明

> 这份文件写给组员用的 AI 助手（Claude Code、Codex、Cursor 等）。开始改仓库之前先读完它。
> 用组员跟你说话的语言回答，组员多半用中文。
> 最近更新：2026-10-09（按 Eat It! 方向重写）。如果别的文件和本页冲突，以本页和 `docs/` 里带 Eat-It 的文件为准。

## 0. 先读什么（顺序固定）
1. 本页。
2. [docs/Eat-It_Design-Brief_v1.md](docs/Eat-It_Design-Brief_v1.md)：产品定义、核心功能、不做什么、用户流程。
3. [docs/VISUAL-SPEC.md](docs/VISUAL-SPEC.md)：颜色、字体、食物图片、小组件、文字预算。
4. [docs/Eat-It_Teammate-Handoff_v1.md](docs/Eat-It_Teammate-Handoff_v1.md)：你要做什么、一次做多少、怎么交付。
5. [docs/Eat-It_Storyboard_v2.md](docs/Eat-It_Storyboard_v2.md)：3 分钟视频的分镜（需要做视频素材时再读）。

**不要参考** `PLAN.md`、`docs/DESIGN.md`、`README.md` 里的产品描述、`index.html`、`phone-v0.1.html`、`截图/`：它们是 10/6 之前的旧版 lo-fi 记录（一个 persona、ShelfLife、网站形态、文字密集），方向已经改了。旧文件只用来查 fieldwork 证据和历史。

## 1. 项目是什么
- INFO90006 Fieldwork for Design（墨尔本大学）的小组项目，交付 **3 分钟 design concept video + 2 页报告**，截止 **2026-10-20 15:00**。
- 产品：**Eat It!**，手机 App 概念（不做桌面网页、不接智能冰箱）。AI 拍照/读小票/语音复盘，自动记录家里有什么食物；虚拟冰箱界面加桌面小组件，让用户不用打开 App 就知道先吃什么。
- 依据小组已提交的 fieldwork 报告：6 个发现（F1–F6）、5 条需求（R1–R5）、伦理需求，两个 persona：John（独居、有冷冻室、批量采购）和 May（合租、无冷冻室、几乎天天买）。
- 只做设计概念：低保真 → 高保真 → 展示用前端。**不做后端、不接 API**。

## 2. 必须遵守的规则
1. **仓库从 2026-10-13 起是公开的**（github.com/wannian001/eat-it，原名 info90006-shelflife）。公开前已把旧 `index.html` 和 `phone-v0.1.html` 设计注释里约 30 条参与者匿名引语（P1–P8）换成“（访谈原话，公开版已删）”。**不要把引语加回来**，也不要从旧提交里翻出来搬到新文件。旧提交里仍有这些引语，不要在任何地方链接或引用它们。
2. **不要加入任何真实的参与者数据**：访谈录音、转写、日记原文、同意书、真名、学校、联系方式、参与者的冰箱照片。示例里的食物、日期、人物都是编的。
3. **课程的 AI 规定**：
   - 不能用 AI 编造 fieldwork 数据，也不能编造新的发现或需求。
   - 视频**旁白台词**、2 页报告**正文和 Reflection** 由组员自己写。你可以给结构、要点，帮忙检查，但不要替组员写成稿。
   - 如果你做了实质性的修改，在提交说明里写清楚。
4. **范围**：只做 Brief §4.2 的核心功能和 §5.1 列出的页面。不加：热量、食谱、待办清单、室友空闲时间匹配、用照片估冰箱容量、桌面网页版、智能冰箱联动。计划功能是可选的，默认关闭。
5. **一次只做一个产出**（一屏、一个小组件、一段动效）。做完把截图发给设计负责人（Raina），确认后再做下一个。不要一口气生成一堆新页面。
6. **改动前先说你要做什么**：用三句话复述任务，等确认。组员明确叫你做的，照做；没叫你做的，先提方案，不要自己大改。
7. **视觉只用 `docs/VISUAL-SPEC.md` 的 token**。不要自己加颜色、字体或图标风格。食物统一用带白边的"贴纸"（见视觉规范第 4 节），不用 emoji，不生成真人，不用 AI 配音。
8. **界面文案用英文**（视频给英文阅卷人看），每屏正文不超过 12 个英文单词；设计注释和说明用中文。最终视频使用澳式英语（Australian English）。
9. 前端只在 Figma 高保真定稿之后开始，按 Figma 还原，不自由发挥。

## 3. 文件
```
AGENTS.md                              本文件
CLAUDE.md                              Claude Code 入口，引用本文件
docs/Eat-It_Design-Brief_v1.md         产品定义（最重要）
docs/VISUAL-SPEC.md                    视觉规范
docs/Eat-It_Teammate-Handoff_v1.md     组员交接单（含可粘贴的 AI 指令）
docs/Eat-It_Storyboard_v2.md           视频分镜
assets/stickers/                       食物贴纸 SVG（25 个，_overview.png 是总览）
app/                                   可运行版（按画布 v3 七块画板还原，纯前端），先读 app/README.md
PLAN.md / docs/DESIGN.md / README.md   旧版（v0.2）记录，仅作证据和历史
index.html / phone-v0.1.html / 截图/    旧版 lo-fi 原型，不再扩展
```

## 4. Git 协作

- 开始前先 `git pull`。
- 每个功能开一个分支：`名字/功能`，例如 `xuan/fridge-home`。改完提交，开 Pull Request 合并到 `main`。
- `index.html` 是单个大文件，两个人同时改同一段很容易冲突。动手前在群里说一声你要改哪一块（比如 `vFood`、`BASE.john`），尽量小步提交。
- 提交说明写清"改了什么、为什么"，例如：`Plan: per-meal eat-out instead of per-day (PLAN #4)`。
- 不要提交录音、转写、`.DS_Store`、个人文件。
- 在线版（claude.ai 上的 artifact）属于嘉阔的账号，不会随仓库更新；以仓库为准。

## 附录说明
以下是旧版 lo-fi 原型 `index.html` 的代码结构，**只在需要读或查旧原型时使用**。新方向不在这个文件里继续开发。

## 附录 A　旧版 index.html 的结构（仅在需要读旧原型时看）

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

## 附录 B　改旧原型后怎么检查

1. 用 Chrome 打开 `index.html`，打开开发者工具（Cmd+Option+I），确认 Console 没有报错。
2. 在演示栏里把 May 的 1–4、John 的 1–4 各点一遍，再点"新用户注册"走一遍注册流程。
3. 窗口拉窄到手机宽度（或在开发者工具里切到手机模式），看导航是否变成底部标签栏。
4. 浅色和深色都看一眼（跟随系统设置）。
5. 页面外观有大的改动时，更新 `截图/` 里对应的图（手动截图即可，命名保持一致）。
