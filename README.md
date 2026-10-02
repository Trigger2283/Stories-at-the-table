# 一餐一故事 / Stories at the Table

以菜肴和故事为主的中英文网站，右下角厨房助手通过 Flask 后端调用 OpenAI Responses API。前端与后端可部署在同一个 Render Web Service，直接访问服务网址即可浏览和聊天。

## 目前完成

- 三道示例菜、分类筛选、故事和菜谱详情。
- 中英文切换和语言偏好记忆。
- 实际聊天请求、最近五轮对话上下文、当前菜谱、等待状态、新对话。
- 错误提示、失败时保留问题、禁止重复发送、请求超时。
- 服务器读取 API Key；用户打开页面即可聊天，无需访问口令。

故事是编辑方向示例，并非核实后的历史资料。助手知道这一点，不应将这些内容描述成已核实历史。当前没有联网搜索或购物功能。插画使用 emoji；Google Fonts 不可用时使用本地字体。

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
