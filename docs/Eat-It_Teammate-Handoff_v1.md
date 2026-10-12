# Eat It! · 组员交接单 v1

> 2026-10-09 · 设计负责人：Raina · 先读 Design Brief v1 和 Storyboard v2，再读本页
> 10/10 更新：视觉以 `docs/VISUAL-SPEC.md` v2 和 Design 画布 v2 页为准；B 部分里与之冲突的旧描述以 v2 为准。
> 本页分两部分：A 给拍摄和剪辑的人，B 给负责生成界面和动画的人（含可直接粘贴给 AI 的指令）。
> 课程规定：旁白和报告正文必须由我们自己写。下面的英文只是参考，录音时请用自己的话说。最终视频使用澳式英语（Australian English）。

## A. 拍摄和剪辑

### A1. 拍摄清单（实拍总共约 50 秒，一天拍完）
| 场景 | 要拍什么 | 时长 | 备注 |
|---|---|---|---|
| John 厨房 | 台面上一堆肉和食材；手机放台面拍标签朝上；肉装进小袋；开冷冻室放入（2 个镜头） | 约 25 s | 每个镜头至少 4 秒，不要快切 |
| May 合租厨房 | 合租厨房一角；朋友发消息的手机特写；睡前床边对手机说话 | 约 25 s | 床边那段不用露脸也可以 |
| 通用 | 手机屏幕全部拍黑屏或绿幕，后期换成界面录屏 | - | 不拍品牌 Logo，不拍真实包装上的商标特写 |

### A2. 每段的口语提示（短，用自己的话说）
| 段 | 你要表达的意思 | 参考英文（别照读） |
|---|---|---|
| 1 | 你有没有因为忘了而扔掉本来想吃的肉 | Have you ever thrown out meat you meant to eat? |
| 2 | 我们想解决年轻人和学生的问题，很多人独居或合租 | Many young people live alone or share houses. |
| 3 | 访谈了 8 位学生，每人 2 次，加一周日记 | We interviewed eight students twice, plus a week-long diary. |
| 4 | 想知道家里有什么，但不想每顿都手动记 | They want to know what they have, but not type it all in. |
| 5 | 不用输入，也不用买几千块的冰箱 | No typing. No A$5,000 fridge. |
| 6 | Eat It! 是替你记食物的 AI 助手 | Eat It! tracks your food for you. |
| 8 | 看看真实生活里怎么用 | Let's see how it works in real life. |
| 9a | 这是 John，独居，大冷冻室，批量买菜 | This is John. He lives alone and buys in bulk. |
| 9b | 拍一张，保质期自动读出来 | One photo, and the dates are read for him. |
| 9c | 它记得你上次怎么分装 | It remembers how he split it last time. |
| 9e | 不开 App 就知道先吃哪袋 | He sees what to eat first without opening the app. |
| 10a | 另一边，May 合租，没有冷冻室 | On the other hand, May shares a house and has no freezer. |
| 10b | 今晚外食，点一下，计划自动顺延 | Eating out tonight? One tap, and the plan moves. |
| 10c | 睡前说 10 秒，不用每顿都开 App | Ten seconds at bedtime, no need to log every meal. |
| 11 | 好学、少浪费、隐私留在手机、计划可选 | Easy, less waste, private, planning optional. |
| 12 | 一句让人记住的话 | 由组员自拟 |

### A3. 剪辑规则
- 节奏慢：任何镜头不短于 4 秒；文字卡只用打字机、淡入、平移。
- 颜色：白底、黑字、浅绿点缀。不用花哨转场。
- 字幕：英文字幕，位置固定。
- 不用 AI 生成的真人、AI 配音或编造数据。AI 动画总共不超过 30 秒，或者干脆不用。

## B. 生成界面和动画的人（AI 额度多的组员）

### B1. 你的任务是优化，不是新增
我（Raina）已经有一套高保真原型（Design 画布《Eat It! Hi-fi Prototype》，5 屏）。你拿到的是截图，不是让你重做。当前只做三件事：
1. 把主屏 "Your kitchen"（虚拟冰箱）做得更好看：真实食物图片为主，文字压到最少。
2. 把桌面小组件做完整：除了锁屏，必须有主屏方格小组件（见 B3）。
3. 补两屏：May 的虚拟冰箱（Mine + Housemates，无冷冻室）；拍照识别的"扫描中"状态。
除此以外不要新增任何屏幕。

### B2. 视觉规则（硬性）
- 颜色、字体、按钮以 `docs/VISUAL-SPEC.md` v2 为准（Bricolage Grotesque 标题 + Plus Jakarta Sans 正文；Leaf #CDEB7B 主色；估计日期用虚线加 "~"）。
- 食物统一用带白边的贴纸：常见食物用画布里的图库贴纸，偏门食物用照片抠成的贴纸（见 `docs/VISUAL-SPEC.md` 第 4 节）。不要 emoji，不要三星产品图或 Logo。
- 少字：每屏正文不超过 12 个英文单词（标题、按钮、数字除外）。能用图或图标说的就不要写字。

### B3. 桌面小组件（这是这次要补的重点）
- 小方格：2×2 的小组件内放 4 个不同水果（或食物）的方形图块，一格一种，快过期的那格带琥珀色小圆点。点哪一格就是 "Used it"。
- 中号：一排 4 个食物图块加一行小字（如 "2 use soon"）。
- 大号：整个虚拟冰箱，真实食物图摆在隔层上。
- 锁屏：圆形 "2 USE SOON" 和矩形一条，已有，保留。

### B4. 工作流（防止烧额度）
1. 先读 Design Brief v1 的 §4、§7、§8 和 Storyboard v2，然后用三句话复述你要做什么，等我确认。
2. 一次只交付一个屏，发截图给我，我说继续再做下一个。
3. 只用 B2 的颜色和字体，不自己加颜色。
4. 不写后端、不接 API，不加计划里没有的功能：热量、食谱、待办、室友匹配、桌面网页、智能冰箱联动。
5. 每次改动先说明"改了哪里、为什么"，不要整屏推翻重来。

### B5. 可直接粘贴给 AI 的指令
```
You are helping polish a mobile app concept called "Eat It!" (design concept only, no backend).
Read the Design Brief v1 and Storyboard v2 first. Do NOT create new screens beyond this list:
(1) improve the "Your kitchen" main screen, (2) build home-screen widgets including a 2x2 grid
widget with four square food tiles, (3) add May's fridge screen and a "scanning" state.
Rules: white background, ink #16200F, light-green accents, Plus Jakarta Sans, 20-24px radii,
44px touch targets, real food photo cut-outs, no emoji, no cartoon food, under 12 words of body
text per screen. Deliver ONE screen at a time, show a screenshot, and wait for approval.
Before building, summarise your plan in three sentences.
```

## C. 待确认
1. 引语卡（P2、P6）的知情同意检查。
2. 分镜 6 的 pitch 和分镜 7 的三个词，选定一个版本。
3. 谁演 John 和 May，拍摄日期（10/12 或 10/15–16）。
4. 仓库里的 AGENTS.md 和 PLAN.md 还是旧版（一个人物、ShelfLife），需要改成 Eat It! 版。
