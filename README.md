# 一餐一故事 / Stories at the Table

以菜肴和故事为主的中英文网站，右下角厨房助手通过 Flask 后端调用 OpenAI Responses API。前端与后端可部署在同一个 Render Web Service，直接访问服务网址即可浏览和聊天。

## 目前完成

### TheMealDB 菜谱接入

首页新增独立的英文菜谱搜索区，搜索 chicken、pasta 或 Arrabiata，最多显示 24 条结果。点击 View recipe 查看图片、食材和原始步骤。Ask about this recipe 和 Translate this recipe 会打开聊天并填入问题，用户点击发送后才调用模型、产生费用。

界面默认英文，暂时隐藏语言切换；原中文示例数据保留。外部菜谱没有历史故事、可靠的耗时或份数时不自行补造。

- `mealdb.py`：固定地址访问 TheMealDB，10 秒上游超时，15 分钟内存缓存（最多 128 项，重启清空，不是数据库）。
- `mealdb.js`：搜索与详情 UI；外部文本通过 textContent 展示。
- `GET /api/recipes?q=pasta`：按英文菜名搜索。
- `GET /api/recipes/mealdb-52771`：按 ID 查询。
- 聊天只提交菜谱 ID，后端重新获取可信来源的菜谱作为上下文，不接受前端自编菜谱。

使用官方教育/开发测试 Key `1`，无需新增环境变量或依赖。适用于当前作业；正式商业发布前重新核对 [TheMealDB 使用说明](https://www.themealdb.com/api.php)。来源链接显示在详情中。

部署时请同时上传新文件 `mealdb.py` 和 `mealdb.js`，以及更新后的 `app.py`、`app.js`、`index.html`、`styles.css`。Render 构建、启动命令和 OpenAI 环境变量无需更改。必须通过 Flask/Render 网址访问，不能双击 HTML 使用搜索。

- 三道示例菜、分类筛选、故事和菜谱详情。
- 中英文切换和语言偏好记忆。
- 实际聊天请求、最近五轮对话上下文、当前菜谱、等待状态、新对话。
- 错误提示、失败时保留问题、禁止重复发送、请求超时。
- 服务器读取 API Key；用户打开页面即可聊天，无需访问口令。

故事是编辑方向示例，并非核实后的历史资料。助手知道这一点，不应将这些内容描述成已核实历史。当前没有联网搜索或购物功能。插画使用 emoji；Google Fonts 不可用时使用本地字体。

## 人工维护与代码格式

| 想修改的内容 | 对应文件 |
| --- | --- |
| 页面结构、导航、聊天入口 | `index.html` |
| 主题颜色、卡片、移动端布局 | `styles.css` |
| 聊天面板与等待、错误提示样式 | `chat.css` |
| 菜谱展示、双语文案、筛选和聊天请求 | `app.js`，按编号注释分区 |
| 助手性格、回答规则、后端校验 | `app.py` 的 `INSTRUCTIONS` 和 `chat()` |
| 服务器使用的中英文菜谱目录 | `recipes.json`，修改时与 `app.js` 保持一致 |
| 分离部署时的后端地址 | `config.js` |
| 实际使用的模型和 API Key | Render 的 Environment；本地为 `.env` |

HTML、CSS 和 JavaScript 使用两空格缩进，Python 使用四空格缩进。各个菜谱字段、样式属性和控制流程展开书写；动态生成的卡片和详情 HTML 使用多行模板，方便逐段修改。

`.editorconfig` 统一缩进、UTF-8 和换行。`.prettierrc.json` 用于前端格式化，`ruff.toml` 用于 Python 格式化；它们仅用于开发，不改变 Render 的运行方式。编辑器中可使用 Prettier 和 Ruff 的格式化功能，或安装工具后在本目录运行：

```powershell
npx prettier --write index.html app.js config.js styles.css chat.css recipes.json tests/test_frontend.cjs
ruff format app.py tests/test_backend.py
```

本次整理保留现有文件入口和接口。上传整理版后，Render 的构建命令、启动命令以及模型环境变量均可沿用。

## 本地运行

在 `cooking-story` 目录打开终端：

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
```

在本地 `.env` 中填写真实 `OPENAI_API_KEY`。不要将真实密钥粘贴到聊天中或写入前端文件。

```powershell
.\.venv\Scripts\python.exe app.py
```

访问 `http://127.0.0.1:5001`，展开厨房助手即可发送问题。

双击 `index.html` 仍可查看页面，但聊天需要通过 Flask/Render 的网址打开。单独运行 `python -m http.server` 不会提供聊天接口。

## Render 部署：新建独立服务

推荐将本目录的项目文件上传到新的 GitHub 仓库根目录，例如 `stories-at-the-table`。必须包含 `app.py`、`index.html`、`recipes.json`、两个 CSS 文件、两个 JS 文件、`requirements.txt` 和 `.python-version`。不要上传 `.env`、`.venv`、`__pycache__` 或 `.tools`。

在 Render 选择 **New → Web Service**，连接新仓库：

| 设置 | 值 |
| --- | --- |
| Name | `stories-at-the-table`，或自己喜欢的名称 |
| Language | Python 3 |
| Root Directory | 留空：如果本目录内容位于新仓库根目录 |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --threads 4 --timeout 90` |
| Health Check Path | `/health` |

如果上传的是包含 After Hours 的整个现有目录，则新服务的 Root Directory 要填写 `cooking-story`。建议用新仓库，避免两项目的自动部署混在一起。

在 Environment 设置：

| 变量 | 值 |
| --- | --- |
| `OPENAI_API_KEY` | 你的 OpenAI 项目 API Key，账户需有可用额度 |
| `OPENAI_MODEL` | 默认 `gpt-4.1-mini`；也可填写账户可使用的其他 Responses API 模型 |

`PORT` 由 Render 提供，不要复制 `.env.example` 中的本地端口。默认同一服务提供前端和后端，不需要填写 `FRONTEND_ORIGINS`。

`render.yaml` 也可用于 Blueprint 部署，适用于将本目录内容作为新仓库根目录的情况。API Key 需要在 Render 中填写。

## 部署后的检查

1. 打开 Render 分配的服务网址，应看到双语首页。
2. 访问 `/health`：`status: ok` 表示服务存活；`chat_configured: true` 只表示已配置密钥，不验证密钥或额度。
3. 打开厨房助手，问一个简单问题，确认真实 AI 回复。
4. 打开番茄炒蛋，点击“问问这道菜的做法”，询问鸡蛋用量，再追问替代食材。
5. 切换 English 并测试英文问题。

Render 免费服务唤醒可能需要等待；前端显示等待状态。聊天公开开放，所有聊天请求的 API 费用由网站配置的 OpenAI 账户承担。

## 从原来的口令版本更新

在 GitHub 上传新版文件并覆盖同名文件，然后提交。前端 `index.html`、`app.js` 与后端 `app.py` 必须一起更新。Render 环境变量只需 `OPENAI_API_KEY` 和 `OPENAI_MODEL`，可以删除旧的 `CHAT_PASSWORD`。如果尚未创建 Render 服务，先上传更新再部署；如果已经创建，使用最新提交重新部署。

## 以后将前端放到 GitHub Pages

修改公开的 `config.js` 中 `apiBaseUrl` 为 Render 后端地址，例如 `https://YOUR-SERVICE.onrender.com`。在 Render 的 `FRONTEND_ORIGINS` 中设置实际前端来源，例如 `https://YOUR-USERNAME.github.io`，不带仓库路径。本地文件的 `null` 来源不受支持，请用 HTTP 服务预览。

## 数据与对话

- `recipes.json` 是服务器使用的可信菜谱目录，客户端只发送菜谱 ID。当前 `app.js` 保留相同的本地展示数据；修改菜谱时同时更新，测试会核对一致性。
- 浏览器仅在当前页面保存对话，刷新或“新对话”后清空；发送时最多包含五轮完整问答加当前问题，并限制总字符数。
- 请求使用 `store=False`，未创建 OpenAI Conversations 对象；这不等于完全没有提供商日志，数据政策见官方文档。
- 模型回复和用户文字均通过 `textContent` 显示，不会作为 HTML 执行。

## 测试

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -p "test_*.py" -v
node tests/test_frontend.cjs
```

测试模拟 OpenAI 返回值，不产生 API 消费。真实联网、模型权限、额度和 Render 部署需要通过实际聊天验证。

## 官方参考

- [OpenAI 文本生成与 Responses API](https://developers.openai.com/api/docs/guides/text)
- [OpenAI 对话上下文](https://developers.openai.com/api/docs/guides/conversation-state)
- [OpenAI API 数据政策](https://developers.openai.com/api/docs/guides/your-data)
- [Render Flask 部署](https://render.com/docs/deploy-flask)
- [Render 子目录部署](https://render.com/docs/monorepo-support)
