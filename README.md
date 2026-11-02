# OpenMax Workflows skill

让 agent 能用 OpenMax Workflows（工作流）：有人说要建、发起、改工作流，或问运行进度时，该调哪个动作、怎么回。

- [SKILL.md](SKILL.md)：给 agent 照做的完整说明（zylos 技能入口）。
- [connector-description.txt](connector-description.txt)：同一套规则的短版，用作 `workflows` 连接器的应用描述，供不装本技能的 agent 读。
- [PROMPT.md](PROMPT.md)：发给你自己 agent 的一段话，让它自己装好。

本技能只是一份说明：没有服务、不装依赖、不收凭据。

## 一句话让你的 agent 装好

把下面这段原样私聊发给你的 zylos agent（同 [PROMPT.md](PROMPT.md)）：

```text
请帮我安装 OpenMax Workflows 技能，按下面做：

1. 运行：
   cd ~/zylos/workspace && git clone https://github.com/openmaxai/zylos-workflows.git && zylos add ./zylos-workflows
   （目录已存在就改成：git -C ~/zylos/workspace/zylos-workflows pull && zylos add ~/zylos/workspace/zylos-workflows）
2. 装完读一遍 workflows 技能的 SKILL.md，以后有人要建 / 发起 / 改工作流、问运行进度时照它做。
3. 用 conn.list 看有没有 app 为 workflows 的连接；有的话再用 conn.check 检查它能不能用。
4. 没有连接、或检查不通过：告诉我去 OpenMax「Connectors」（连接页）新建一条 workflows 连接，填入 key 并授权给你；key 由我（你的主人）在 Workflows 团队页你的详情里生成（组织管理员只能吊销），别让我发到聊天里。
5. 不要让我把 key 发到聊天里，你也不要在聊天里贴任何 key。
6. 全部做完回我一句：「workflows 技能装好了，连接 ok」或「workflows 技能装好了，连接缺」（缺的话附一句缺什么）。
```

## 手动安装（zylos agent）

```bash
git clone https://github.com/openmaxai/zylos-workflows.git
zylos add ./zylos-workflows
```

装好技能还不够，agent 要真能调 Workflows，还需要：

1. 这个 agent 的**主人**在 Workflows「团队」页它的详情里生成一把成员 key（组织管理员只能吊销）。
2. agent 的主人在 OpenMax「Connectors」（连接页）新建一条 `workflows` 连接，填入这把 key，并**授权给这个 agent**。

key 只填在连接页里，**不要把 key 发到任何聊天里**（包括发给 agent）。agent 不会替人装连接、不会替人授权。

## 升级

照装法重新 `zylos add`：

```bash
git -C zylos-workflows pull
zylos add ./zylos-workflows
```

不要用 `zylos upgrade workflows`：从本地目录装的组件，zylos 不去拉仓库，只会提示从原路径重装。

## License

MIT，见 [LICENSE](LICENSE)。
