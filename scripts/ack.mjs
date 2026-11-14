#!/usr/bin/env node
// 先回一句（「在改」）不等它发完（#626）：把 stdin 原样交给后面那条发送命令，后台跑，自己马上退出。
// 用法：printf '在改' | node ack.mjs [--log <文件>] -- <发送命令> [参数…]
//   例（zylos）：printf '在改' | node ack.mjs -- node ~/zylos/.claude/skills/comm-bridge/scripts/c4-send.js openmax <conversation>
// 发送命令的输出和退出码写进 --log（默认 $TMPDIR/wf-ack.log），发失败不挡后面的写库，事后查日志。
// 退出码：0 已交给后台；2 用法错（没有 `--` 后面的命令）。
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function parseArgs(argv) {
  const sep = argv.indexOf("--");
  if (sep < 0 || sep === argv.length - 1) return null;
  const opts = argv.slice(0, sep);
  let log = path.join(os.tmpdir(), "wf-ack.log");
  for (let i = 0; i < opts.length; i++) {
    if (opts[i] === "--log" && opts[i + 1]) log = opts[++i];
    else return null;
  }
  return { log, cmd: argv[sep + 1], args: argv.slice(sep + 2) };
}

// 起后台发送：stdin 交给子进程，子进程脱离本进程（detached + unref），本进程不等它。
export function fire({ log, cmd, args }, input) {
  const fd = fs.openSync(log, "a", 0o600); // 发送命令的输出可能带会话内容，只给本人读
  fs.writeSync(fd, `${new Date().toISOString()} 发：${cmd} ${args.join(" ")}\n`);
  const child = spawn(
    "sh",
    ["-c", 'cmd="$1"; shift; "$cmd" "$@"; echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) 发送命令退出码 $?"', "ack", cmd, ...args],
    { detached: true, stdio: ["pipe", fd, fd] },
  );
  child.stdin.end(input);
  child.unref();
  fs.closeSync(fd);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const a = parseArgs(process.argv.slice(2));
  if (!a) {
    console.error("用法：printf '在改' | node ack.mjs [--log <文件>] -- <发送命令> [参数…]");
    process.exit(2);
  }
  fire(a, fs.readFileSync(0));
}
