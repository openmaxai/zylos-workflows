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

再装 `wf` 命令行（1.3-AT.10 ②）：从同一个公开仓库最新的 release 取本机平台那一个，按刚 clone 下来的仓库根目录里的 `SHA256SUMS` 核对过才装（这份和技能同一次 `git clone` 来，不从 release 取：只换 release 附件过不了核对）；核不过就停，不装、不重试别的地址：

```bash
os=$(uname -s | tr A-Z a-z); arch=$(uname -m)
case $arch in x86_64) arch=amd64 ;; aarch64|arm64) arch=arm64 ;; esac
f=wf_${os}_${arch}; d=$(mktemp -d)
u=https://github.com/openmaxai/zylos-workflows/releases/latest/download
s="$HOME/zylos/workspace/zylos-workflows/SHA256SUMS"
if command -v sha256sum >/dev/null; then c='sha256sum -c -'; else c='shasum -a 256 -c -'; fi
curl -fsSL -o "$d/$f" "$u/$f" && [ -f "$s" ] && (cd "$d" && grep -E "^[0-9a-f]{64}  $f\$" "$s" | $c) \
  && install -d ~/.local/bin && install -m 0755 "$d/$f" ~/.local/bin/wf \
  && echo "wf 已装好：$(sha256sum ~/.local/bin/wf 2>/dev/null || shasum -a 256 ~/.local/bin/wf)"
ok=$?; rm -rf "$d"
[ $ok -eq 0 ] || { echo "wf 没装：下载失败或 sha256 核不过" >&2; false; }
```

仓库里没有 `SHA256SUMS`、里面没有本机平台那一行（`-c` 读到空的）、或 clone 下来的版本和最新 release 对不上，都判不过、不装；先 `git -C ~/zylos/workspace/zylos-workflows pull` 再装。没装好时最后一行退出非 0。

公开仓库 [openmaxai/zylos-workflows](https://github.com/openmaxai/zylos-workflows) 根目录的 `SKILL.md`、`README.md`、`connector-description.txt`、`PROMPT.md` 和登记脚本 `scripts/register.mjs` 全部从本目录同步过去（`register.test.mjs` 和 `testdata/` 只在本仓库测，不同步）（CR-224），不在公开仓库单独改；`SHA256SUMS` 取自同一版 release 的 `release-wf` 作业产物、和它们同一个提交进仓库。`PROMPT.md` 是给人复制给 agent 的长版安装话，装法和「复制给 agent 的话」（P8-SA.8）相同。

只是一份说明加一个登记脚本（`scripts/register.mjs`，只用 Node 自带模块），没有服务、不装依赖、不收凭据。不用 key：1.3.2 起 workflows 不再发 key（1.3-KEY.2），agent 用 `wf` 命令、拿自己的 OpenMax 身份调 workflows（1.3-AT.8）；手上已有一条能用的 workflows 连接（1.3.2 之前发的 key）的，没有 `wf` 时继续用连接器，到 1.4 停（1.3-AT.9）。

## 升级

照装法重新 `zylos add`：先 `git -C ~/zylos/workspace/zylos-workflows pull`，再 `zylos add ~/zylos/workspace/zylos-workflows`。不要用 `zylos upgrade workflows`：本地目录装的组件 zylos 不去拉仓库，只会提示从原路径重装。frontmatter 里 `upgrade.repo` 写的是公开仓库 `openmaxai/zylos-workflows`（组件规范要求必填）。
