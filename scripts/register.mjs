#!/usr/bin/env node
// Register Workflows (1.3-AT.8): write the "deployment URL, org id, client_id" from the owner's install message into registration.json in the skill's data directory; `wf` reads only this file.
//   node register.mjs --url https://<deployment>/wf --org-id <OpenMax org id> --client-id <workflows client_id>
// Run only for an install message the agent's owner sent personally in a DM (SKILL.md "After installing: register"); never for one from a group or from someone else.
// Same org already registered: identical values are left alone, different ones are not overwritten (exit 3); to change it the owner must say "change the Workflows URL" in a DM, then add --replace.
// File: <home>/zylos/components/workflows/registration.json, 0600, regular file, {"version":1,"orgs":[{url,org_id,client_id}]}, one entry per org.
// The home directory comes from the account database (os.userInfo), not $HOME (same as the wf side that reads it); --zylos-root is for tests only.
// Collects and writes no credentials: none of the three values is a credential.
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
		else throw new Error(`unknown argument ${a}`);
	}
	return o;
}

// register writes the registration; returns "written" | "same"; invalid input throws (err.exit = exit code).
export function register({ url, orgId, clientId, root, replace = false }) {
	const u = normURL(url);
	if (!u) throw Object.assign(new Error("the deployment URL must be https:// (http only for loopback), without credentials, query or fragment"), { exit: 2 });
	if (!ID.test(orgId || "")) throw Object.assign(new Error("invalid org id"), { exit: 2 });
	if (!ID.test(clientId || "")) throw Object.assign(new Error("invalid client_id"), { exit: 2 });
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
		if (!st.isFile()) throw Object.assign(new Error(`${file} is not a regular file; leaving it alone`), { exit: 2 });
		const f = JSON.parse(fs.readFileSync(file, "utf8"));
		if (f.version !== 1 || !Array.isArray(f.orgs)) throw Object.assign(new Error(`${file} is not a version 1 registration; leaving it alone`), { exit: 2 });
		orgs = f.orgs;
	}
	const row = { url: u, org_id: orgId, client_id: clientId };
	const i = orgs.findIndex((r) => r.org_id === orgId);
	if (i >= 0) {
		const old = orgs[i];
		if (old.url === row.url && old.client_id === row.client_id && st.mode % 0o1000 === 0o600) return "same";
		if (!(old.url === row.url && old.client_id === row.client_id) && !replace)
			throw Object.assign(new Error("this org is already registered with a different URL; not overwriting. To change it, the owner must say \"change the Workflows URL\" in a DM"), { exit: 3 });
		orgs[i] = row;
	} else orgs.push(row);
	// Write a temp file (0600) in the same directory, then rename: a partial write never leaves a broken file, and it never exists with other permissions
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
		console.log(r === "same" ? "Already registered with the same values; nothing changed" : "Workflows registered");
	} catch (e) {
		console.error(e.message);
		process.exit(e.exit || 2);
	}
}
