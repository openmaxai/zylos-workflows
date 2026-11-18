#!/usr/bin/env node
// Register Workflows (1.3-AT.8): write the "deployment URL, org id, client_id" from the owner's install message into registration.json in the skill's data directory; `wf` reads only this file.
//   node register.mjs --url https://<deployment>/wf --org-id <OpenMax org id> --client-id <workflows client_id>
//   node register.mjs --org-id <OpenMax org id> --add-channel <channel>:<tenant_id>   (or --remove-channel; 1.3-AT.12)
// Run only for an install message the agent's owner sent personally in a DM (SKILL.md "After installing: register"); never for one from a group or from someone else.
// Same org already registered: identical values are left alone, different ones are not overwritten (exit 3); to change it the owner must say "change the Workflows URL" in a DM, then add --replace.
// File: <home>/zylos/components/workflows/registration.json, 0600, regular file, {"version":1,"orgs":[{url,org_id,client_id}]}, one entry per org.
// Channels (1.3-AT.12): an org entry may carry "channels":[{name,tenant_id}] — which external channels on this machine (e.g. this Telegram bot) belong to that org;
// `wf` uses them for WF_CHANNEL. Added / removed only when the owner says so personally in a DM ("this machine's Telegram belongs to <org>"), same rule as the install message.
// The home directory comes from the account database (os.userInfo), not $HOME (same as the wf side that reads it); --zylos-root is for tests only.
// Collects and writes no credentials: none of the three values is a credential.
import crypto from "node:crypto";
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
// Channels register.mjs accepts, and how each one's tenant_id is normalized (1.3-AT.12). Only Telegram so far: its tenant_id is the bot's username
// (not a credential; the Telegram component keeps it only at runtime, so it comes from the owner's DM), lowercased, without a leading @.
// Lark / WeCom: which config field holds the tenant is not verified yet, so they are refused rather than left open (Boot #856, TG 796 msg 1905).
const CHANNELS = { telegram: (t) => t.replace(/^@/, "").toLowerCase() };
const TG_USER = /^[a-z][a-z0-9_]{3,31}$/;

function parse(argv) {
	const o = { replace: false };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === "--replace") o.replace = true;
		else if (["--url", "--org-id", "--client-id", "--zylos-root", "--add-channel", "--remove-channel"].includes(a) && i + 1 < argv.length) o[a.slice(2)] = argv[++i];
		else throw new Error(`unknown argument ${a}`);
	}
	return o;
}

const fail = (msg, exit = 2) => Object.assign(new Error(msg), { exit });

// register writes the registration; returns "written" | "same"; invalid input throws (err.exit = exit code).
export function register({ url, orgId, clientId, root, replace = false }) {
	const u = normURL(url);
	if (!u) throw Object.assign(new Error("the deployment URL must be https:// (http only for loopback), without credentials, query or fragment"), { exit: 2 });
	if (!ID.test(orgId || "")) throw Object.assign(new Error("invalid org id"), { exit: 2 });
	if (!ID.test(clientId || "")) throw Object.assign(new Error("invalid client_id"), { exit: 2 });
	const { dir, file, orgs, st } = open(root);
	const row = { url: u, org_id: orgId, client_id: clientId };
	const i = orgs.findIndex((r) => r.org_id === orgId);
	if (i >= 0) {
		const old = orgs[i];
		if (old.url === row.url && old.client_id === row.client_id && st.mode % 0o1000 === 0o600) return "same";
		if (!(old.url === row.url && old.client_id === row.client_id) && !replace)
			throw Object.assign(new Error("this org is already registered with a different URL; not overwriting. To change it, the owner must say \"change the Workflows URL\" in a DM"), { exit: 3 });
		// Changing the URL keeps the org's channels (1.3-AT.12): which channels belong to which org is a separate statement from the owner
		orgs[i] = old.channels ? { ...row, channels: old.channels } : row;
	} else orgs.push(row);
	save(dir, file, orgs);
	return "written";
}

// setChannel adds (or with remove: true removes) one external channel "<name>:<tenant_id>" on an org that is already registered (1.3-AT.12).
// Returns "written" | "same". The same channel on two orgs is not refused here: `wf` refuses to pick one when it reads (CHANNEL_ORG_UNKNOWN).
export function setChannel({ orgId, channel, root, remove = false }) {
	const k = String(channel || "").indexOf(":");
	const name = k > 0 ? channel.slice(0, k) : "";
	if (!Object.hasOwn(CHANNELS, name)) throw fail("only telegram can be registered for now; write it telegram:<bot username>");
	const tenant = CHANNELS[name](channel.slice(k + 1).trim());
	if (!TG_USER.test(tenant)) throw fail("the channel must be written telegram:<bot username>, e.g. telegram:@ExampleWfBot");
	if (!ID.test(orgId || "")) throw fail("invalid org id");
	const { dir, file, orgs, st } = open(root);
	const i = orgs.findIndex((r) => r.org_id === orgId);
	if (i < 0) throw fail("this org is not registered yet; register it from the owner's install message first");
	const chs = Array.isArray(orgs[i].channels) ? orgs[i].channels : [];
	const j = chs.findIndex((c) => c.name === name && c.tenant_id === tenant);
	if ((remove ? j < 0 : j >= 0) && st.mode % 0o1000 === 0o600) return "same";
	const next = remove ? chs.filter((_, n) => n !== j) : j >= 0 ? chs : [...chs, { name, tenant_id: tenant }];
	const { channels: _, ...rest } = orgs[i];
	orgs[i] = next.length ? { ...rest, channels: next } : rest;
	save(dir, file, orgs);
	return "written";
}

// open makes sure the directory is safe to write in and reads what is registered so far.
function open(root) {
	const dir = path.join(root, "components", "workflows");
	const file = path.join(dir, "registration.json");
	// Follow a symlink for neither components nor components/workflows: if either is a symlink or not a directory, don't write (Lova !1149 note 238622 nit-1, Lisa !1156 note 238891 nit-1);
	// lstat before creating, so a symlink pointing at a file also gets this message instead of Node's raw EEXIST (Lisa same note nit-2)
	for (const d of [path.join(root, "components"), dir]) {
		try {
			if (!fs.lstatSync(d).isDirectory()) throw Object.assign(new Error(`${d} is not a directory (maybe a symlink); leaving it alone`), { exit: 2 });
		} catch (e) {
			if (e.code !== "ENOENT") throw e;
			fs.mkdirSync(d, { recursive: true, mode: 0o700 });
		}
	}
	// If it already exists with wider permissions, tighten it to 0700 (Boot note 238589 nit-1); open with O_NOFOLLOW and fchmod, so a swap to a symlink after the lstat is not followed either (Boot !1156 note 238898 nit-1)
	const dfd = fs.openSync(dir, fs.constants.O_RDONLY | fs.constants.O_DIRECTORY | fs.constants.O_NOFOLLOW);
	try {
		if (fs.fstatSync(dfd).mode % 0o1000 !== 0o700) fs.fchmodSync(dfd, 0o700);
	} finally {
		fs.closeSync(dfd);
	}
	// Remove temp files left behind by an earlier crash once they are over an hour old; leave newer ones alone so we never delete one being written right now (Lisa !1156 note 238891 nit-3)
	for (const n of fs.readdirSync(dir)) {
		if (!/^\.registration\..+\.tmp$/.test(n)) continue;
		const t = fs.lstatSync(path.join(dir, n));
		if (t.isFile() && Date.now() - t.mtimeMs > 3600e3) fs.rmSync(path.join(dir, n), { force: true });
	}
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
	return { dir, file, orgs, st };
}

function save(dir, file, orgs) {
	// Write a temp file (0600) in the same directory, then rename: a partial write never leaves a broken file, and it never exists with other permissions
	// Random suffix in the name: a temp file left behind by an earlier crash never collides with this one (Lova note 238622 nit-2)
	const tmp = path.join(dir, `.registration.${process.pid}.${crypto.randomBytes(6).toString("hex")}.tmp`);
	fs.writeFileSync(tmp, JSON.stringify({ version: 1, orgs }) + "\n", { mode: 0o600, flag: "wx" });
	fs.chmodSync(tmp, 0o600);
	fs.renameSync(tmp, file);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	try {
		const o = parse(process.argv.slice(2));
		const root = o["zylos-root"] || path.join(os.userInfo().homedir, "zylos");
		const ch = o["add-channel"] ?? o["remove-channel"];
		if (ch !== undefined && (o.url || o["client-id"] || o.replace || (o["add-channel"] && o["remove-channel"])))
			throw fail("use --add-channel or --remove-channel on its own, with --org-id only");
		const r =
			ch !== undefined
				? setChannel({ orgId: o["org-id"], channel: ch, root, remove: o["remove-channel"] !== undefined })
				: register({ url: o.url, orgId: o["org-id"], clientId: o["client-id"], root, replace: o.replace });
		if (r === "same") console.log("Already registered with the same values; nothing changed");
		else console.log(ch === undefined ? "Workflows registered" : o["add-channel"] !== undefined ? `Channel ${ch} now belongs to org ${o["org-id"]}` : `Channel ${ch} removed from org ${o["org-id"]}`);
	} catch (e) {
		console.error(e.message);
		process.exit(e.exit || 2);
	}
}
