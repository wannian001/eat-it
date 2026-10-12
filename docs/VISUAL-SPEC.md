# Eat It! 视觉规范 v3

> 2026-10-10 · 设计负责人：Raina · 取代 v1、v2。所有界面、小组件、文字卡、动画都按本页做。
> 对照稿：Design 画布《Eat It! Hi-fi Prototype》的 v2 页（7 块画板，07 是品牌与组件板，含字号表和日期语言）。旧文件（`index.html`、`docs/DESIGN.md`、`phone-v0.1.html`）的外观一律不参考。

## 1. 一句话
白、黑、灰加一点偏黄的嫩绿。打开 App 就是"打开冰箱"：真实感的食物图片摆在隔层上，关键位置配一两个词。不是纯图标，也不是表格。

## 2. 颜色
| 名字 | 值 | 用在哪 |
|---|---|---|
| White | #FFFFFF | 页面、卡片、格子 |
| Mist | #F4F5F1 | 冰箱底、次级背景 |
| Ink | #1F241C | 文字、图标（不用纯黑，不做大面积黑块） |
| Stone | #6F766A | 次要文字 |
| Leaf | #CDEB7B | 主按钮、选中态、App 图标底（偏黄的蔬菜绿） |
| Leaf soft | #E8F5C0 | 选中芯片底、头像底 |
| Leaf deep | #557F12 | 次按钮描边、绿色文字 |
| Sprout | #8DC63F | 语音麦克风按钮、开关、波形 |
| Tomato | #F0533A | "先吃"的点和环 |
| Tomato badge | #CF3A22 | 红色日期标签底（配白字，对比度够） |
| Tomato soft | #FFEDE8 | "Eat first" 区块底 |
| Frost | #E7F0F7 | 冷冻室格子底 |

规则：
- 不出现大面积黑色。黑色只用于文字和细线图标。
- 主按钮：Leaf 填充 + Ink 文字。次按钮：白底 + 1.5px Leaf deep 描边。不要一黑一白的按钮组合。
- 红色只表示"该先吃了"，每屏一处集中出现（Eat first 区块）。

## 3. 字体和字号
- 标题、数字、Logo 用 **Bricolage Grotesque** 800；正文、按钮用 **Plus Jakarta Sans** 600/700。
- 字号表：Display 34/800（语音页大问题）· Title 28/800（页面标题）· Section 17/800（Eat first）· Button 16/700 · Body 15/600（说明句）· Label 13/700（食物名）· Tag 11/700（日期标签）。
- 数量写数字，例如 "3"；时间写全称，例如 "4 weeks"、"Best before today"。不用 "×3"、"2d est"、"BB" 这类缩写。
- 英文用澳式拼写：colour、yoghurt；日期写 "Sun"、"17 Oct"。

## 4. 文字的量：一两个词，放在该放的地方
- 冰箱视图只显示图；"Eat first" 卡片里写食物名和日期标签。
- 列表视图（右上角按钮切换）每格都写名字和日期，给想看字的人和读屏用户。
- 点开任何食物，弹出一张卡：大图、名字、日期标签、一句话解释、两个按钮（Used it / Used some）。这是唯一出现完整句子的地方。
- 不写解释性副标题、口号、底部说明（例如 "12 items found"、"Photo read on your phone, then deleted"）。隐私说明放设置页和视频旁白。

## 5. 食物图片：干净写实
- 方向：像 Uber Eats、Woolworths 那样的干净写实。最终用真实照片抠图，加白边和柔和阴影。
- 画布里现在的扁平贴纸是占位，位置和尺寸照旧，换成照片即可。扫描页背景标了 "Real photo goes here"。
- 三层来源：常见食物用图库照片；偏门食物（柚子茶、豆腐、亚洲超市酱料）把用户自己拍的照片自动抠图；都失败时显示分类图标（肉、奶、果蔬、其他）。

## 6. 冰箱只有两区：冷藏和冷冻
- 去掉 Pantry（常温储物柜）。大多数人想到"冰箱"只有冷藏和冷冻，米、面这类东西也不容易坏，不值得记录。
- 首页是一个打开的冰箱：上面一格冷冻（浅蓝），下面两层隔板加一个浅绿保鲜抽屉。
- May 没有冷冻室：她的冰箱按归属分层，最上层是室友的（锁住，只显示数量），中间一层共享，下面是她自己的，并显示 "Nearly full" 空间条（对应 F6）。

## 7. 日期语言（依据 FSANZ）
| 标签 | 样式 | 意思 | App 怎么提醒 |
|---|---|---|---|
| Use by Sun | 红色实心 | 安全期限，过了不能吃，也不能卖 | 进 "Eat first"，提前一天提醒 |
| Best before today | 琥珀色描边 | 质量期限，过了通常仍可以吃，只是品质可能变差 | 只说"看一眼"，绝不说"扔掉" |
| ~3 days | 灰色虚线加 "~" | 包装上没有日期（散装果蔬、剩菜），由 App 估计 | 标明是估计，点一下可以改 |
| Frozen 4 weeks | 浅蓝 | 放进冷冻室多久了 | 只提示最老的一袋先用 |
- 例：胡萝卜包装可能印一周的 best before，但在保鲜抽屉里能放更久。App 不会在第 8 天叫用户扔掉胡萝卜。
- 剩菜按冷藏 2–3 天估计（UQ 食品科学研究者的建议），始终显示为估计值。

## 8. 交互
- 底部是一个分段按钮：左 **Add food**（拍照、扫小票，加一排 "Usual" 一键再买），右 **I ate**（语音）。不做液态玻璃效果。
- 分装建议：Whole / 2 / 5 / +，默认选中上次的数字，并显示 "5 bags, like last time"。
- "Out tonight" 只做成可选小组件；打开后会显示 "Moved to tomorrow"。

## 9. 无障碍
- 颜色从不单独表达意思：每个日期状态都同时有文字和形状（实心、描边、虚线）。
- 每个食物都是真正的按钮，带读屏标签（例如 "Milk, use by Sun"）。
- 列表视图给不擅长看图的人用；文字跟随系统字号。
- 触控区不小于 44px；说明文字对比度不低于 4.5:1（白底红标签用 #CF3A22）。
- 语音输入本身就是一种替代方式，适合不方便看屏幕或打字的人。

## 10. 颜色补充
在 v2 的颜色基础上增加：Use-by red #CF3A22、Best-before amber #E9A23B（浅底 #FFF1D6，文字 #7A4A00）、Frost #E7F0F7。

## 11. Logo
- 选定 A：手机冰箱。冰箱画得窄，本身就像一部手机。
- 去掉冰箱里的苹果，改成右上角的红色角标，意思是"有东西该先吃了"，和字标感叹号的红点呼应。
- 字标："eat it" 用 Bricolage 800 小写，感叹号由一根绿色竖条加一个番茄红圆点组成。

## 12. 以后再做（视频里一句带过）
- 电子小票自动导入：例如 Woolworths 的 Everyday Rewards App 会保存门店电子小票。可以设计成用户主动转发小票，或单独授权，而不是读取整个邮箱。隐私问题写进报告。

## 13. 禁止清单
大面积黑块、液态玻璃、渐变堆叠、紫色、多彩标签、密集文字表格、emoji、AI 生成真人、AI 配音、三星产品图和 Logo、热量、食谱、待办清单、桌面网页版、提醒用户"扔掉"best before 的食物。

## 来源
- FSANZ, Date marking: https://www.foodstandards.gov.au/consumer/labelling/dates
- NSW Food Authority, Date marking guideline: https://www.foodauthority.nsw.gov.au/media/411
- UQ News, "Consume any leftovers within two to three days": https://news.uq.edu.au/node/121422
- Queensland Government, Food waste facts: https://www.qld.gov.au/environment/circular-economy-waste-reduction/reduction/reduce-food-waste/facts
- Point Hacks, Everyday Rewards app guide (e-receipts): https://www.pointhacks.com.au/everyday-rewards/app/
