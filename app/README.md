# Eat It! 可运行版（app/）

一个真的能用的网页 App：功能沿用 v0.2 原型的一整套，界面换成 Raina 高保真画布（《Eat It! Hi-fi Prototype》，"Eat It! v3"）的设计。手机和电脑都能用，放进去、吃掉、改库存都会记下来，刷新后还在。

**在线演示：** <https://wannian001.github.io/eat-it/>（不用装任何东西，手机电脑都能开，谁都能打开。语音要允许麦克风。演示里的记录只存在你自己的浏览器里，互不影响。）直接打开中文版：<https://wannian001.github.io/eat-it/?lang=zh>，英文版：<https://wannian001.github.io/eat-it/?lang=en>。

<p>
<img src="screenshots/phone-01-home.png" width="200" alt="手机：Home">
<img src="screenshots/phone-06-ai-question.png" width="200" alt="手机：AI 追问还剩多少">
<img src="screenshots/phone-08-week-open.png" width="200" alt="手机：周历里点开今天">
</p>

> 2026-10-12 嘉阔用 Claude Code 生成代码并审阅。视觉只用 `docs/VISUAL-SPEC.md` v3 的 token 和 `assets/stickers/` 的贴纸。不放 v0.2 设计注释里的参与者引语，也不加热量、食谱、待办。

## 一句话

- **进库**：拍照、小票、邮件、条码、手打、超市账户，AI 读出来，你核对一遍。
- **出库：全部用语音。** 不用每顿饭去点"用掉"。说一句今天做了什么饭，AI 听懂；你没说数量的东西，它再问你还剩多少。
- **忘了说**：在 Home 点开那样食物，在 "In stock" 里直接改。

## 出库：全部靠语音

### 怎么说、AI 怎么问

点 **I ate**（电脑在左上，手机在底部），像跟朋友说话一样说一句，例如：

> "Made a stir fry with the chicken thighs and some mushrooms."

AI 把这句话对上家里有的东西。说了具体数量的（"two tomatoes"）直接扣掉；没说数量的，一样一样问：

> **After today, are there any chicken thighs left?**　Plenty left / A little left / All gone

答完会给一张汇总，点 Done 就改好冰箱。

| 说 | AI 追问 | 汇总 |
|---|---|---|
| <img src="screenshots/phone-05-i-ate.png" width="220" alt="I ate：说今天吃了什么"> | <img src="screenshots/phone-06-ai-question.png" width="220" alt="AI 追问：还剩多少"> | <img src="screenshots/phone-07-ai-done.png" width="220" alt="汇总：Done"> |

浏览器不支持语音时，点 "Or type it" 打字，效果一样。

### "今天在家吃饭了吗？"

不想主动想起来点 I ate 也没关系，App 会问：

- **Home** 上有一张小卡片：**Ate at home today?**
- **Week calendar** 上面是一排七天的小方块，点哪一天，下面就展开那一天的详情（不弹窗），问同样的问题。

回答之后：

| 回答 | 接下来 |
|---|---|
| **Yes** | 问 **Record what you used?**：点 **Record by voice** 就进入上面的语音流程；点 **Not now** 就先记成"在家吃了，还没记"，之后随时补 |
| **No, ate out** | 这天不用记 |

以前的日子也能补：比如周六忘了，下周一在周历点开周六，选 Yes → Record by voice，AI 会问 "After that, is there any … left?"，记录算在周六那天。上面的小方块用小图标标出每天的情况：彩色小点是那天到期的食物，叉子是出去吃，勾是已经记录。

以后的日子可以提前定：比如确定周四一天都不在家吃，点开周四，问 **Eating at home on Thursday?**，选 **No, eating out**。卡片上会标 Eating out；那天到期的食物，卡片里会提醒前一天吃掉。想改主意就点 Change。

### 出去吃之前的提醒

在周历里标了哪几天出去吃（可以连着几天，比如周六周日），App 会看冰箱里**哪些东西会在你不在家那几天到期**，在你出门前最后一天在家时提醒你：

- **首页**：出门前两天内出现一张大提醒卡，比如 "Eating out tomorrow to Sun · Use or freeze these today"，列出那几样东西。能冻的（肉、剩菜、面包）在有冷冻室时直接给 **Freeze** 按钮。点 **Got it** 收起。
- **周历**：出门前那天的卡片上写着同样的提醒。
- **锁屏通知**：出门前那天推送，比如 "Eating out tomorrow to Fri · Use or freeze today: milk, curry and avocados."
- 在周历里标 "No, eating out" 时，提示条会直接说 "Eating out Sat. 2 things to use by Fri."

May 和 John 的示例数据里都已经标好了接下来几天出去吃，一打开就能看到。

| 手机：首页提醒（May，没有冷冻室） | 手机：首页提醒（John，可以冻） | 手机：锁屏通知 |
|---|---|---|
| <img src="screenshots/phone-15-away-may.png" width="220" alt="首页：Eating out tomorrow"> | <img src="screenshots/phone-16-away-john.png" width="220" alt="首页：Freeze 按钮"> | <img src="screenshots/phone-13-lock-screen.png" width="220" alt="锁屏：出去吃之前的提醒"> |

| 手机：点开今天 | 手机：选了 Yes 之后 | 手机：提前标周四不在家吃 |
|---|---|---|
| <img src="screenshots/phone-08-week-open.png" width="220" alt="周历：Ate at home today?"> | <img src="screenshots/phone-09-week-record.png" width="220" alt="周历：Record what you used?"> | <img src="screenshots/phone-10-week-eat-out.png" width="220" alt="周历：Eating out on Thursday"> |

电脑上，上周：周一选了 Yes（等着录音），周二选了出去吃：

![电脑：周历里补以前的日子](screenshots/desktop-08-week-past-days.png)

### 忘了说怎么办

在 Home 点开任何食物，**In stock** 一行可以改：按个数的用 − / +，按量的选 Full / Most / Half / Low，或者直接 **All gone**。改动也会记进周历当天。

<img src="screenshots/phone-02-food-card.png" width="260" alt="食物卡片：In stock">

## 进库

手机打开 Add food 直接是拍照页，会**真的打开后置摄像头**（第一次会问权限；不给权限就显示示意图）。下面可以切 Photo / Receipt / Barcode，取景框跟着变（小票是竖长框，条码是横窄框），"…" 里是其他方式。按快门会定格当前画面，然后进入核对页：识别结果仍是模拟的。核对页里AI 不确定的（"Spring onion? 还是 leek?"）、不是食物的、要分袋的、放哪里、是谁的、包装上的日期，逐行确认。

| 手机：拍照 | 手机：核对小票 |
|---|---|
| <img src="screenshots/phone-03-add-camera.png" width="260" alt="拍照添加"> | <img src="screenshots/phone-04-receipt-check.png" width="260" alt="核对小票"> |

电脑上先选方式，再左边看原件、右边逐行核对：

![电脑：添加方式](screenshots/desktop-04-add-ways.png)
![电脑：核对小票](screenshots/desktop-05-receipt-check.png)

## 其他页面

| 页面 | 地址 | 做什么 |
|---|---|---|
| Home | `#` | Eat first（最该先吃的三样）、打开的冰箱（含橱柜等）、"Ate at home today?"。只放这些，其他功能在各自的页面 |
| Food at home | `#food` | 按地方分页，图 / 列表（电脑上是表格），搜索，Mine / Shared，编辑地方，拍照估有多满 |
| Add food | `#add` `#ways` `#scan` `#review` | 六种添加方式和核对 |
| I ate | `#ate` | 语音出库 |
| Week calendar | `#week` | 上面一排七天（小图标：到期的食物、出去吃、已记录、出门前提醒），点哪天下面展开哪天：吃饭记录或提前标出去吃、这天到期的食物、冷冻满 4 周的那袋、出门前要用掉或冻起来的东西；电脑上右边是 Coming up |
| Shopping list | `#shop` | 和室友共享的清单、谁去买、买之前的提醒（家里已有、室友在买、放不下）、家里还有多少空间 |
| Household | `#settings` | 家庭成员和邀请码、同住的人能看到什么、地方、提醒、邮件 / 超市账户、个人资料、数据 |
| 桌面小组件、锁屏 | `#widgets` `#lock` | 画布 05/06 的预览，点了会真的改冰箱 |

| 电脑：Home | 电脑：周历 |
|---|---|
| ![电脑：Home](screenshots/desktop-01-home.png) | ![电脑：周历](screenshots/desktop-07-week.png) |
| **电脑：Food at home** | **电脑：Shopping list** |
| ![电脑：Food at home](screenshots/desktop-02-food-at-home.png) | ![电脑：Shopping list](screenshots/desktop-09-shopping-list.png) |
| **电脑：Household** | **电脑：切换用户** |
| ![电脑：Household](screenshots/desktop-10-household.png) | ![电脑：切换用户](screenshots/desktop-11-switch-user.png) |

| 手机：Shopping list | 手机：小组件 | 手机：锁屏 | 手机：Me |
|---|---|---|---|
| <img src="screenshots/phone-11-shopping-list.png" width="180" alt="购物清单"> | <img src="screenshots/phone-12-widgets.png" width="180" alt="桌面小组件"> | <img src="screenshots/phone-13-lock-screen.png" width="180" alt="锁屏"> | <img src="screenshots/phone-14-users.png" width="180" alt="Me：用户和家庭"> |

所有截图在 [`screenshots/`](screenshots/)：`phone-*` 是 390 × 844（iPhone 尺寸，2 倍图），`desktop-*` 是 1440 × 900。

## 用户

- App 自带两个用户 **John**（一个人住，有冷冻室）和 **May**（三人合租，没有冷冻室）。第一次打开默认是 May。两个人各有各的冰箱、周历、清单和设置。
- 电脑上点左下角的当前用户；手机上点 **Me**，再点最上面的 "Signed in as" 小卡片展开。展开后可以切换用户、添加新用户（从空冰箱开始设置）、退出。退出后是 "Who's using Eat It!?" 选人页面。
- 电脑上左边的菜单可以收起：点 logo 旁边的箭头，收成一条图标栏（鼠标停在图标上会显示名字）；收起后点左上角的 logo 再展开。下次打开会记住你的选择。
- 地址加 `?user=john` 可以直接打开某个用户。没有密码，这是原型。
- John 和 May 的起始冰箱按画布写成，以每人第一次被打开的那天为第一天，之后用真实日期，东西会照常过期。Household 页的 **Start over** 回到起始状态，日期从当天重新算。

## 中文 / English

界面有英文和中文两种（2026-10-21 加的中文，作业交的是英文版）。

- **怎么切换**：电脑上点左下角的 **EN | 中文**；手机上点周历、购物、我的这几页右上角的 **中 / EN**，或者在 "我的" 页的 "语言" 里切换。选过的语言会记在这台设备上。
- **默认是哪种**：地址里的 `?lang=zh` / `?lang=en` 最优先（作品集里的链接可以直接指定），其次是上次的选择，再其次跟浏览器语言（中文浏览器默认中文，其他默认英文）。
- **数据也跟着换**：John 和 May 自带的冰箱、冷冻室、合租、购物清单、货架名字都会换成中文；自己输入的名字照原样显示。超市小票和邮件里的商品行保持英文原样（澳洲超市的小票本来就是英文），右边 AI 整理出来的清单是中文。
- **语音**：中文界面下语音识别用普通话，本地规则也能听懂中文，例如 "我做了一袋牛肉和两个番茄，还吃了一些咖喱" → 牛肉 1 袋、番茄 2 个，咖喱再追问还剩多少；"没喝牛奶" 不会扣牛奶，"番茄酱" 不算番茄。
- **写新界面文字时**：每一句都用 `L('English', '中文')` 成对写（`js/i18n.js`），两种都要写；App 自己生成、存进数据里的名字（比如地方名）存英文，显示时过一遍 `dz()`。

## 打开

在线：<https://wannian001.github.io/eat-it/>，什么都不用装。演示由这个仓库发布：合并到 `main` 后运行

```bash
sh app/publish-site.sh
```

它用 `app/build-site.sh` 把 `app/` 和贴纸构建好，推到本仓库的 `gh-pages` 分支，GitHub Pages 一两分钟后生效。每次发布的代码地址都带 `?v=<提交号>`，手机不会卡在旧版本。想先在本地看发布出来的样子：`sh app/build-site.sh /tmp/eat-it-site`。

本地：

```bash
python3 -m http.server 8000 --directory <这个仓库的文件夹>
```

然后打开 <http://localhost:8000/app/>。贴纸在 `../assets/stickers/`，所以服务器要从仓库根目录起，不能从 `app/` 起。同一 Wi-Fi 下，手机访问 `http://电脑的IP:8000/app/`，再"添加到主屏幕"。

## 哪些是真的，哪些是模拟的

| 功能 | 现在 |
|---|---|
| 冰箱、Eat first、日期标签、用掉、剩多少、开封、冷冻 / 解冻、换地方、扔掉、撤销 | 真的 |
| 语音出库、AI 追问、"Ate at home?"、补记以前的日子 | 真的。语音用浏览器自带的识别；理解这句话默认用本地规则（说了数量的直接扣，没说的追问），`js/config.js` 填了 `ai` 就交给那个服务器 |
| 周历、提醒推迟、购物清单、地方、设置、家庭、用户 | 真的（记录在本机） |
| 拍照、小票、条码 | 摄像头和拍下的画面是真的；**识别结果是模拟的**：John、May 返回固定的几行；新用户还没有识别器，改成点选 |
| 邮件小票 | **模拟** |
| 拍照估冰箱有多满 | **模拟**：数字是编的，可以拖动修正 |
| 室友、邀请码 | 编的数据，不会真的发给谁 |
| 桌面小组件、锁屏 | 网页做不了真小组件，这两页是预览 |

## 数据怎么存（以后接自己的服务器用）

所有东西都存成只追加的事件，打开时按顺序重放（`js/state.js` 开头列了全部事件类型）。改错也是再加一条，`undo` 指向要取消的那条，旧记录不改。"在家吃了吗"是 `plan` 事件（`cook` / `out` / 撤回，`skip` = 选了 Not now），语音出库是 `ate` 事件（每样东西带 `left: plenty | little | none`），手动改库存是 `qty` / `amount`。

- 默认存在这台设备的 localStorage。
- 要存到自己的服务器，在 `js/config.js` 填 `store`。服务器只需要两个接口：

```
GET  {store}/events?person=may  ->  { "events": [ ...按时间顺序 ] }
POST {store}/events             <-  { "person": "may", "event": { ... } }
```

每个用户的记录都会以各自的用户 id（`john`、`may`，新用户是 `u-…`）存到那里。用服务器存储时，Start over 和 Remove user 不可用（服务器上的记录只追加，不删除）。

**AI 理解（可选）**：在 `js/config.js` 填 `ai`，说的话会发给那个服务器（比如你自己系统里的 AI）：

```
POST {ai}  { "text": "说的那句话", "stock": [{ "food": "curry", "name": "Curry" }, …] }
      ->   { "items": [{ "food": "curry", "part": true }, { "food": "tomato", "qty": 2, "exact": true }] }
```

`exact: true` 表示说了具体数量，直接扣；其余的 App 会追问还剩多少。家里没有的食物会被丢掉；服务器出错或答非所问时，自动退回本地规则。Household 页的 **Download a copy** 可以导出 JSON。仓库里不放任何服务器代码，也不放任何人的真实数据。

## 测试

```bash
cd app && node --test
```

Node 18 以上，无依赖（`npm test` 也行）。32 个测试，覆盖日期标签、Eat first、语音解析、追问和回答、AI 服务器和退回本地、分袋、出去吃和提醒、手动改库存、周历、撤销、解冻 / 冷冻 / 扔掉、地方和设置、新用户设置、起始数据对齐到第一天、HTTP 存储；`tests/review.test.js` 专门防 10-13 审查发现的问题（"egg noodles" 不能动鸡蛋、"Plenty left" 不能变多、同一样东西只问一次、AI 返回克数要改成追问、移出冷冻室要解冻、坏的服务器数据不能卡住启动）；`tests/i18n.test.js` 管中文：中文语音解析、中文日期标签、数据名称翻译、切回英文不变。

## 10-13 改了什么

- 周历改版：原来七张窄卡片挤成一排、高矮不齐，现在是上面一排七天的小方块、下面一块当天详情，电脑上右边放 Coming up；手机上七天一屏放得下，不用横着滑。
- 出去吃之前的提醒：组员觉得 meals 用处不大。现在标了哪几天出去吃，App 会在出门前一天提醒哪些东西会在你不在家时过期（首页大提醒、周历、锁屏通知），能冻的直接给 Freeze。
- 仓库公开并改名为 `eat-it`（原名 info90006-shelflife），在线演示改由这个仓库自动发布，不再用单独的演示仓库。公开前删掉了旧原型里的参与者引语。
- 组员试用反馈：
  - 语音用一次之后就不好使：现在全程只用一个识别器，等上一次结束再开始，浏览器不回结束信号也不会卡住。
  - 拍照、小票、条码现在真的打开摄像头。
  - 字太多、第一次不知道怎么用：首页第一次打开会显示三行"怎么用"（Add food / Eat first / I ate），点 Got it 收起；周历、I ate、添加方式的说明都改短了。
- 五个 AI Agent 分头审查（逻辑、手机、电脑、文案规范、无障碍），确认的问题都修了：
  - 语音不会再误删：说 "egg noodles" 不动鸡蛋，"two slices of toast" 改成追问而不是删整条面包，"Plenty left" 不会让存量变多，同一样东西只问一次。
  - 提示条和 Undo 马上出现，不再晚一步；电脑上 I ate 的打字输入能用了。
  - 键盘焦点、弹出层、坏数据、中文输入法等稳健性问题。
  - 新增 6 个回归测试，共 26 个。

## 10-12 改了什么

- 出库全部改成语音：I ate、Home 的 "Ate at home today?"、周历点开某一天，三个入口走同一套 AI 追问。
- 周历：原来的 "Dinner" 开关改成 "Ate at home?"；点某一天，卡片就地展开（不弹窗）。以前的日子能补记，以后的日子能提前标 "Eating out"。
- 在线演示改到 GitHub Pages：<https://wannian001.github.io/eat-it/>。
- Home 精简：只留 Eat first、冰箱、"Ate at home today?"。
- 删掉购物页的 "Shop together?"（和室友约空闲时间一起去买），设置里对应的开关也删了。
- 设置里 "What Lily and Sam can see" 改成 "What your housemates can see"。

## 已知限制

- 语音和摄像头都要在 https 或 localhost 下才能用；在线演示是 https，没问题。

- Chrome 的语音识别会把声音交给浏览器的识别服务，和概念里"语音只在手机上处理"不一致。视频和报告里不要拿这个原型当证据。
- 语音识别要 Chrome、Edge 或 Safari，并允许麦克风；Firefox 没有，这时用 "Or type it" 打字。
- 估计天数（番茄约 1 周等）和储存小贴士都是我们的猜测，界面标了 "our guess" / "guide"。只有剩菜 2–3 天有来源（UQ，见 VISUAL-SPEC）。放进视频前要按 FSANZ 核对。
- 画布只给了手机的 7 屏。电脑版的排版和手机版底部的标签栏是按 v0.2 补的，需要 Raina 确认。
- 字体从 Google Fonts 加载，断网时退回系统字体；还没做离线缓存。
