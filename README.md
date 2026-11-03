# workflows skill

Lets an agent know it can use OpenMax Workflows: when someone asks to create, start, or change a workflow, or asks how a run is going, which action to call and how to reply. The source of truth is [SKILL.md](SKILL.md) in this directory; the short version, [connector-description.txt](connector-description.txt), is written by `tools/api/gen_connector.py` into the description of the `workflows` connector app (where non-zylos agents read it). Both are changed in the same MR as the spec; `tools/skill/check.py` (the CI trace-check job) verifies that every spec ID, action name, and `wf` command they mention really exists.

## Install (zylos agent)

The agent's owner installs it (no one installs it on someone else's behalf):

```bash
git clone https://github.com/openmaxai/zylos-workflows.git ~/zylos/workspace/zylos-workflows
zylos add ~/zylos/workspace/zylos-workflows
# Register (1.3-AT.8): take the three values from the install message your owner sent; it already contains the full command
node ~/zylos/workspace/zylos-workflows/scripts/register.mjs --url '<deployment URL>' --org-id '<OpenMax org id>' --client-id '<workflows client_id>'
```

Then install the `wf` CLI (1.3-AT.10 ②): download the binary for this platform from the latest release of the same public repo, and install it only after it matches the `SHA256SUMS` in the root of the repo you just cloned (that file comes from the same `git clone` as the skill, not from the release, so swapping a release asset alone cannot pass the check). If the check fails, stop: do not install, and do not retry from another URL.

```bash
os=$(uname -s | tr A-Z a-z); arch=$(uname -m)
case $arch in x86_64) arch=amd64 ;; aarch64|arm64) arch=arm64 ;; esac
f=wf_${os}_${arch}; d=$(mktemp -d)
u=https://github.com/openmaxai/zylos-workflows/releases/latest/download
s="$HOME/zylos/workspace/zylos-workflows/SHA256SUMS"
if command -v sha256sum >/dev/null; then c='sha256sum -c -'; else c='shasum -a 256 -c -'; fi
curl -fsSL -o "$d/$f" "$u/$f" && [ -f "$s" ] && (cd "$d" && grep -E "^[0-9a-f]{64}  $f\$" "$s" | $c) \
  && install -d ~/.local/bin && install -m 0755 "$d/$f" ~/.local/bin/wf \
  && echo "wf installed: $(sha256sum ~/.local/bin/wf 2>/dev/null || shasum -a 256 ~/.local/bin/wf)"
ok=$?; rm -rf "$d"
[ $ok -eq 0 ] || { echo "wf not installed: download failed or sha256 mismatch" >&2; false; }
```

If the repo has no `SHA256SUMS`, it has no line for this platform (`-c` reads nothing), or the cloned version does not match the latest release, the check fails and nothing is installed; run `git -C ~/zylos/workspace/zylos-workflows pull` first, then install again. If installation did not succeed, the last line exits non-zero.

`SKILL.md`, `README.md`, `connector-description.txt`, `PROMPT.md` and the registration script `scripts/register.mjs` in the root of the public repo [openmaxai/zylos-workflows](https://github.com/openmaxai/zylos-workflows) are all synced from this directory (`register.test.mjs` and `testdata/` are tested only in this repo and are not synced) (CR-224); do not edit them in the public repo. `SHA256SUMS` comes from the `release-wf` job artifact of the same release and is committed together with them. `PROMPT.md` is the long install message a person copies to an agent; it installs the same way as the "message to copy to the agent" (P8-SA.8).

This is just a document plus a registration script (`scripts/register.mjs`, Node built-in modules only): no service, no dependencies, no credentials collected. No key needed: from 1.3.2 on, workflows no longer issues keys (1.3-KEY.2); the agent uses the `wf` CLI and calls workflows with its own OpenMax identity (1.3-AT.8). An agent that already has a working workflows connection (a key issued before 1.3.2) and no `wf` keeps using the connector until 1.4 (1.3-AT.9).

## Upgrade

Re-run the install steps (`zylos add`): first `git -C ~/zylos/workspace/zylos-workflows pull`, then `zylos add ~/zylos/workspace/zylos-workflows`. Do not use `zylos upgrade workflows`: for a component installed from a local directory, zylos does not pull the repo and only tells you to reinstall from the original path. `upgrade.repo` in the frontmatter is the public repo `openmaxai/zylos-workflows` (required by the component spec).
