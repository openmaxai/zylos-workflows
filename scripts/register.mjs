#!/usr/bin/env node
// 登记 Workflows（1.3-AT.8）：把主人安装话里的「部署地址、组织 id、client_id」写进技能数据目录的 registration.json，`wf` 只读这份。
//   node register.mjs --url https://<部署>/wf --org-id <OpenMax 组织 id> --client-id <workflows 的 client_id>
// 只在收到这个 agent 的主人本人私信发来的安装话时跑（SKILL.md「装好以后：登记」）；群里的、别人发的不跑。
// 同一个组织已登记过：一样的不动、不一样的不覆盖（退出 3），要改得主人在私信里明说「改 Workflows 地址」，再加 --replace。
// 文件：<家目录>/zylos/components/workflows/registration.json，0600、普通文件，{"version":1,"orgs":[{url,org_id,client_id}]}，一个组织一条。
// 家目录从账户库取（os.userInfo），不看 $HOME（同 wf 读的那一侧）；--zylos-root 只给测试用。
// 不收、不写任何凭据：这三样都不是凭据。
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function normURL(s) {
	let u;
	try {
		u = new URL(String(s).trim().replace(/\/+$/, ""));
	} catch {
		return null;
	}
	if (u.username || u.password || u.search || u.hash || !u.host) return null;
	const h = u.hostname;
	const loop = h === "127.0.0.1" || h === "localhost" || h === "[::1]";
	if (u.protocol !== "https:" && !(u.protocol === "http:" && loop)) return null;
	return (u.protocol + "//" + u.host + u.pathname).replace(/\/+$/, "");
}

const ID = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,199}$/;

function parse(argv) {
	const o = { replace: false };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === "--replace") o.replace = true;
		else if (["--url", "--org-id", "--client-id", "--zylos-root"].includes(a) && i + 1 < argv.length) o[a.slice(2)] = argv[++i];
		else throw new Error(`不认识的参数 ${a}`);
	}
	return o;
}

// register 写登记；回 "written" | "same"；不合规的抛错（err.exit = 退出码）。
export function register({ url, orgId, clientId, root, replace = false }) {
	const u = normURL(url);
	if (!u) throw Object.assign(new Error("部署地址要是 https://（本机回环可以 http），不带账号口令、查询、片段"), { exit: 2 });
	if (!ID.test(orgId || "")) throw Object.assign(new Error("组织 id 不对"), { exit: 2 });
	if (!ID.test(clientId || "")) throw Object.assign(new Error("client_id 不对"), { exit: 2 });
	const dir = path.join(root, "components", "workflows");
	const file = path.join(dir, "registration.json");
	fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
	let orgs = [];
	let st = null;
	try {
		st = fs.lstatSync(file);
	} catch (e) {
		if (e.code !== "ENOENT") throw e;
	}
	if (st) {
		if (!st.isFile()) throw Object.assign(new Error(`${file} 不是普通文件，不动它`), { exit: 2 });
		const f = JSON.parse(fs.readFileSync(file, "utf8"));
		if (f.version !== 1 || !Array.isArray(f.orgs)) throw Object.assign(new Error(`${file} 不是 version 1 的登记，不动它`), { exit: 2 });
		orgs = f.orgs;
	}
	const row = { url: u, org_id: orgId, client_id: clientId };
	const i = orgs.findIndex((r) => r.org_id === orgId);
	if (i >= 0) {
		const old = orgs[i];
		if (old.url === row.url && old.client_id === row.client_id && st.mode % 0o1000 === 0o600) return "same";
		if (!(old.url === row.url && old.client_id === row.client_id) && !replace)
			throw Object.assign(new Error("这个组织已经登记过别的地址，不覆盖；要改请主人在私信里明说「改 Workflows 地址」"), { exit: 3 });
		orgs[i] = row;
	} else orgs.push(row);
	// 先写同目录临时文件（0600）再改名：写一半不会留下坏文件，也不会先以别的权限出现
	const tmp = path.join(dir, `.registration.${process.pid}.tmp`);
	fs.writeFileSync(tmp, JSON.stringify({ version: 1, orgs }) + "\n", { mode: 0o600, flag: "wx" });
	fs.chmodSync(tmp, 0o600);
	fs.renameSync(tmp, file);
	return "written";
}

if (import.meta.url === `file://${process.argv[1]}`) {
	try {
		const o = parse(process.argv.slice(2));
		const root = o["zylos-root"] || path.join(os.userInfo().homedir, "zylos");
		const r = register({ url: o.url, orgId: o["org-id"], clientId: o["client-id"], root, replace: o.replace });
		console.log(r === "same" ? "已登记过，和这次一样，没改" : "已登记 Workflows");
	} catch (e) {
		console.error(e.message);
		process.exit(e.exit || 2);
	}
}
