请帮我安装 OpenMax Workflows 技能，按下面做：

1. 运行：
   cd ~/zylos/workspace && git clone https://github.com/openmaxai/zylos-workflows.git && zylos add ./zylos-workflows
   （目录已存在就改成：git -C ~/zylos/workspace/zylos-workflows pull && zylos add ~/zylos/workspace/zylos-workflows）
2. 装完读一遍 workflows 技能的 SKILL.md，以后有人要建 / 发起 / 改工作流、问运行进度时照它做。
3. 用 conn.list 看有没有 app 为 workflows 的连接；有的话再用 conn.check 检查它能不能用。
4. 没有连接、或检查不通过：告诉我去 OpenMax「Connectors」（连接页）新建一条 workflows 连接，填入 key 并授权给你；key 由我（你的主人）在 Workflows 团队页你的详情里生成（组织管理员只能吊销），别让我发到聊天里。
5. 不要让我把 key 发到聊天里，你也不要在聊天里贴任何 key。
6. 全部做完回我一句：「workflows 技能装好了，连接 ok」或「workflows 技能装好了，连接缺」（缺的话附一句缺什么）。
