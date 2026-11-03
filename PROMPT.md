请帮我安装 OpenMax Workflows 技能，按下面做：

1. 运行：
   git clone https://github.com/openmaxai/zylos-workflows.git ~/zylos/workspace/zylos-workflows && zylos add ~/zylos/workspace/zylos-workflows
   （目录已存在就改成：git -C ~/zylos/workspace/zylos-workflows pull && zylos add ~/zylos/workspace/zylos-workflows）
2. 装好后登记 Workflows，运行：
   node ~/zylos/workspace/zylos-workflows/scripts/register.mjs --url '<部署地址>' --org-id '<OpenMax 组织 id>' --client-id '<workflows 的 client_id>'
   （三样换成 Workflows 团队页里这个 agent 详情「复制给 X 的话」那句登记命令里的值，或者直接用那整句；不登记 `wf` 用不了）
3. 装完读一遍 workflows 技能的 SKILL.md，以后有人要建 / 发起 / 改工作流、问运行进度时照它做。
4. 按 SKILL.md「零、先看能不能用」检查你现在能不能调到 Workflows。
5. 全部做完回我一句：「workflows 技能装好了，能用」或「workflows 技能装好了，还缺 X」。
