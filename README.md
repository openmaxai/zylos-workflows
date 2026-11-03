# workflows skill

让 agent 知道能用 OpenMax Workflows：有人说要建、发起、改工作流，或问运行进度时，该调哪个动作、怎么回。正本是同目录的 [SKILL.md](SKILL.md)，短版 [connector-description.txt](connector-description.txt) 由 `tools/api/gen_connector.py` 写进连接器 `workflows` 的应用描述（非 zylos 的 agent 从那里读到）。两份和规格同一张 MR 改，`tools/skill/check.py`（CI trace-check 作业）核规格编号、动作名、`wf` 命令都真有。

## 装（zylos agent）

由 agent 的主人装（不替人装）：

```bash
git clone https://github.com/openmaxai/zylos-workflows.git ~/zylos/workspace/zylos-workflows
zylos add ~/zylos/workspace/zylos-workflows
# 登记（1.3-AT.8）：三样从主人发的安装话里取，安装话里已经写好整条命令
node ~/zylos/workspace/zylos-workflows/scripts/register.mjs --url '<部署地址>' --org-id '<OpenMax 组织 id>' --client-id '<workflows 的 client_id>'
```

公开仓库 [openmaxai/zylos-workflows](https://github.com/openmaxai/zylos-workflows) 根目录的 `SKILL.md`、`README.md`、`connector-description.txt`、`PROMPT.md` 全部从本目录同步过去（CR-224），不在公开仓库单独改。`PROMPT.md` 是给人复制给 agent 的长版安装话，装法和「复制给 agent 的话」（P8-SA.8）相同。

只是一份说明加一个登记脚本（`scripts/register.mjs`，只用 Node 自带模块），没有服务、不装依赖、不收凭据。不用 key：1.3.2 起 workflows 不再发 key（1.3-KEY.2），agent 用 `wf` 命令、拿自己的 OpenMax 身份调 workflows（1.3-AT.8）；手上已有一条能用的 workflows 连接（1.3.2 之前发的 key）的，没有 `wf` 时继续用连接器，到 1.4 停（1.3-AT.9）。

## 升级

照装法重新 `zylos add`：先 `git -C ~/zylos/workspace/zylos-workflows pull`，再 `zylos add ~/zylos/workspace/zylos-workflows`。不要用 `zylos upgrade workflows`：本地目录装的组件 zylos 不去拉仓库，只会提示从原路径重装。frontmatter 里 `upgrade.repo` 写的是公开仓库 `openmaxai/zylos-workflows`（组件规范要求必填）。
