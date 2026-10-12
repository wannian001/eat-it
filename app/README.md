# Eat It! 可运行版（app/）

按 Raina 的高保真画布《Eat It! Hi-fi Prototype》v2 页（标题 "Eat It! v3"）的 7 块画板做成的手机网页 App。真的能用：放进去、吃掉、用掉都会记下来，刷新后还在。纯前端，没有后端，不需要安装或构建。

> 2026-10-12 嘉阔用 Claude Code 生成代码并审阅。视觉只用 `docs/VISUAL-SPEC.md` v3 的 token 和 `assets/stickers/` 的贴纸，没有新增屏幕以外的功能（无热量、食谱、待办）。

## 打开

在**仓库根目录**（不是 `app/`）起一个静态服务器，因为贴纸在 `../assets/stickers/`：

```bash
python3 -m http.server 8000
```

然后打开 <http://localhost:8000/app/>。

- 电脑上会显示成一部手机；手机上打开就是全屏。同一 Wi-Fi 下手机访问 `http://电脑的IP:8000/app/`，再"添加到主屏幕"。
- `?p=john`、`?p=may`、`?p=me` 直接切换人物；`?frame=0` 去掉电脑上的手机外框（录屏用）。
- 点右上角头像：切换 John / May / You，打开"Widgets""Lock screen"两页，重置演示数据。

## 画板对照

| 画板 | 地址 | 文件 |
|---|---|---|
| 01 My fridge（John）、02 Our fridge（May） | `#/` | `js/views/fridge.js` |
| 点食物弹出的卡片（Used it / Used some） | `#/` 上的弹层 | `js/views/fridge.js` `foodSheet` |
| 03 Add：拍照 → New food 清单 → Put it all in | `#/add` → `#/review` | `js/views/add.js` |
| 04 I ate：语音 → Got it | `#/ate` | `js/views/ate.js` |
| 05 桌面小组件 | `#/widgets` | `js/views/phone.js` |
| 06 锁屏 + 提醒（Thaw tonight / Later） | `#/lock` | `js/views/phone.js` |
| 07 品牌：图标、字标 | 头像弹层顶部、`icon.svg` | `js/icons.js` |

## 哪些是真的，哪些是演示

| 功能 | 现在 |
|---|---|
| 冰箱、Eat first、列表视图、日期标签 | 真的，按记录实时算 |
| Used it / Used some、改估计日期、分袋、冷冻 4 周提醒、Thaw tonight、Later、Out tonight | 真的，会记下来 |
| 语音"I ate …" | "You" 用浏览器自带的语音识别（Chrome、Safari），解析是规则匹配，不用 AI；John 和 May 播放分镜里那句话，方便录屏每次一样 |
| 拍照 / 小票识别 | **演示**：John、May 返回画布上那几行；"You" 还没有识别器，改成点选食物 |
| 桌面小组件、锁屏 | 网页不能放真小组件，这两页是预览，但点了会改冰箱 |
| 室友同步 | 演示数据；室友的东西只显示数量 |

John 和 May 的日期固定在 2026-10-10（周六，和画布一致），"You" 用今天的真实日期。

## 数据怎么存（以后接自己的服务器用）

冰箱不直接存，存的是一条条只追加的事件，打开时按顺序重放（`js/state.js`）。改错也是再加一条，不改旧的。

| 事件 | 字段 | 什么时候 |
|---|---|---|
| `put` | `lines: [{ food, qty, unit, date, bags, owner, spot }]` | Put it all in |
| `use` | `lot, how: 'one' \| 'some'` | Used it / Used some、小组件点一下 |
| `ate` | `items: [{ food, qty, unit, part }]` | 语音 Done |
| `fix` | `lot, on` | 改估计日期 |
| `thaw` | `lot, spot` | Thaw tonight |
| `out` | `on` | Out tonight 开关 |
| `snooze` | `until` | 提醒点 Later |

每条事件都有 `id`、`at`（ISO 时间）、`day`（`YYYY-MM-DD`）。`date` 的 `kind` 是 `use_by`、`best_before`、`est`（估计，必须标 "~"）或 `frozen`。

默认存在这台设备的 localStorage。要存到自己的服务器，在 `js/config.js` 填 `store`，服务器只需要两个接口：

```
GET  {store}/events?person=me   ->  { "events": [ ...按时间顺序 ] }
POST {store}/events             <-  { "person": "me", "event": { ... } }
```

只有 "You" 会用服务器，John 和 May 永远是本地演示。头像弹层里的 "Export my data" 可以导出 JSON。仓库里不放任何服务器代码，也不放任何人的真实数据。

## 测试

```bash
cd app && node --test
```

Node 18 以上，无依赖。覆盖日期标签、Eat first 排序、语音解析、分袋、解冻、提醒、HTTP 存储。

## 已知限制

- Chrome 的语音识别会把声音交给浏览器的识别服务，和概念里"语音只在手机上处理"不一样，视频和报告里别把这个原型当证据。
- 估计天数（番茄约 1 周等）是我们的猜测，界面都标了 "our guess"；只有剩菜 2–3 天有来源（UQ，见 VISUAL-SPEC）。放进视频前要按 FSANZ 核对。
- 字体从 Google Fonts 加载，断网时退回系统字体；还没做离线缓存。
- 本地用 `python3 -m http.server` 时浏览器可能缓存旧的 JS，改了代码看不到就强制刷新。
