# Eat It! · INFO90006 设计概念

帮大学生管好家里的食物、少浪费：知道冰箱里有什么、哪些该先吃。进库拍照或扫小票；**出库全部用语音**，说一句今天做了什么饭，AI 追问还剩多少。

**在线演示：<https://wannian001.github.io/eat-it/>**（手机、电脑都能开。语音要允许麦克风，不行就点 "Or type it" 打字。）界面有中英两种，左下角或 "我的" 页切换；直接打开中文版：<https://wannian001.github.io/eat-it/?lang=zh>。

<p>
<img src="app/screenshots/phone-01-home.png" width="200" alt="手机：Home">
<img src="app/screenshots/phone-06-ai-question.png" width="200" alt="手机：AI 追问还剩多少">
<img src="app/screenshots/phone-08-week-open.png" width="200" alt="手机：周历里点开今天">
</p>

![电脑：周历，提前标出哪天不在家吃](app/screenshots/desktop-07-week.png)

- 可运行的 App 在 [`app/`](app/)。功能、全部截图、怎么本地打开、哪些是模拟的，都在 **[app/README.md](app/README.md)**。
- 设计文档在 `docs/Eat-It_*.md` 和 `docs/VISUAL-SPEC.md`。AI 助手请先读 [AGENTS.md](AGENTS.md)。
- 课程交付物（3 分钟视频 + 2 页报告）已在 2026-10-19 提交。之后的改动只在这个仓库和在线演示里，不影响已交的作业。

> 在线演示就是这个仓库发布的：合并到 `main` 后运行 `sh app/publish-site.sh`，它把 `app/` 和贴纸构建好，推到本仓库的 `gh-pages` 分支，GitHub Pages 从那里发布。网站上只有 App，没有文档和旧原型。这个仓库 2026-10-13 起公开（原名 info90006-shelflife），提交记录就是我们小组的工作记录。

## In English

Eat It! is a phone app concept from a University of Melbourne group project (INFO90006 Fieldwork for Design, Semester 2, 2026). It helps students who live alone or share a house know what food is at home and what to eat first, so less of it is thrown out.

- It builds on our fieldwork: two interviews each and a one-week diary study with eight students, giving six findings and five design requirements. This public repo holds no participant data.
- Add food by photo or receipt, then check what the app read. Mark food as used by saying what you cooked, by tapping the food card, or by tapping a home-screen widget.
- Live demo: <https://wannian001.github.io/eat-it/> (`?lang=en` for English, `?lang=zh` for Chinese). Photo and receipt reading are simulated; there is no back end.
- The course deliverables, a 3-minute video and a 2-page report, were submitted on 19 October 2026.
- The course did not ask for a prototype. Jiakuo built this one to film the concept video: Raina set the visual design principles (`docs/VISUAL-SPEC.md`), and Jiakuo did the features, screens and code. The code was generated with an AI coding tool (Claude Code) and reviewed by Jiakuo.

## 仓库里有什么

| 文件 | 说明 |
|---|---|
| `app/` | **可运行的 Eat It! App**，说明和截图见 [app/README.md](app/README.md)；`app/screenshots/` 是全部截图 |
| `docs/Eat-It_*.md`、`docs/VISUAL-SPEC.md` | Eat It! 的设计文档和视觉规范 |
| `index.html` | 旧版 v0.2 lo-fi 原型（单个文件），仅作历史记录 |
| `PLAN.md` | 旧版：Jenny 的建议、10/6 会议讨论、v0.2 改动清单和视频大纲（历史记录） |
| `docs/DESIGN.md` | 旧版 v0.2 的设计细节（历史记录） |
| `AGENTS.md` / `CLAUDE.md` | 给 AI 助手看的项目说明：规则、代码结构、怎么检查、怎么协作 |
| `截图/` | 旧版 v0.2 的 21 张截图和一张总览 |
| `phone-v0.1.html` | 最早的手机外框版本，已不再更新 |

## 用 AI 一起改

可以直接让 AI（Claude Code、Codex、Cursor 等）改这个仓库：

1. 把仓库克隆到电脑上，用 AI 工具打开这个文件夹。Claude Code 会自动读 `CLAUDE.md`，Codex 会自动读 `AGENTS.md`。其他工具的话，先让它读 `AGENTS.md`。
2. 第一句可以这样说：
   > 先读 AGENTS.md 和 app/README.md，告诉我你理解的项目现状。然后把周历的日卡改成……。先给我看方案，我同意了再改。
3. 改完让它跑 `cd app && node --test`，你自己在手机和电脑上各点一遍，再提交。

**规则**（AI 也要遵守，`AGENTS.md` 里有完整版）：
- 这个仓库是**公开**的。不要放任何真实的参与者数据；旧原型里的参与者引语公开前已删掉，不要加回来。
- 不加入真实参与者数据（录音、转写、真名等）。
- 视频旁白台词和 2 页报告的正文，由我们自己写。AI 可以给结构、帮忙检查，不代写成稿。

## 协作方式

- 改之前先 `git pull`；每个功能开一个分支（例如 `xuan/fridge-home`），改完提 Pull Request。
- `index.html` 是一个大文件，两个人同时改同一段容易冲突。动手前在群里说一声改哪一块。
- 提交说明写清改了什么，例如 `Plan: per-meal eat-out (PLAN #4)`。

## AI 使用说明

这个原型由 AI（Claude）按我们已提交报告里的需求、发现和 persona 搭建，是讨论底稿，不是定稿。功能取舍、视频台词和报告的 Reflection 由小组决定和撰写。提交时会按课程规则在报告里写明 AI 的用途。
