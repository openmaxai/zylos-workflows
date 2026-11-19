# workflows skill — "Ask the steward" jobs from the web

Part of the workflows skill (`SKILL.md`). Sections keep their numbers; "section N" means the section with that number in `SKILL.md` or in another file under `references/`.

## 8. "Ask the steward" jobs from the web: claim the job, submit cards

When someone asks the steward on the web, workflows opens a Task for you in OpenMax ("workflows has a steward job for you"). Claim it by Task number with `claim_task` (`wf task claim`); the content carries the message `text`, `workflow_id` and `mode`, and a full thread also carries `steps`.
When done, submit with `submit_task_result` (`wf task submit <id>`); `output` has two parts: `text` is your reply; `cards` are cards that only take effect when the person clicks them, each one `{"action": …}`. The server checks first using the speaker's identity; if that fails it shows no card and returns a sentence explaining why.

- Rerun from step N (G2-RE.22): for "run run 18 again from step 3", submit `{"action": "rerun_from", "run_id": "<id of run 18>", "n": 3}`. If the person also says how this run should go (e.g. "run 13 from step 3, make it a poster this time"), put just that sentence in `"note": "make it a poster this time"` (max 500 characters); it goes only to the step the rerun starts from, and the person can edit it on the card. Leave `note` out when they said nothing extra. Find the id of run 18 by run number with `list_workflow_runs` (`wf run list --workflow <id>`).
  - No run named ("rerun from step 3"): omit `run_id`. The server uses the latest run (if the thread is opened on a specific run, that one), and the card's sentence states "run N".
  - In your reply, use the run number on the card; do not guess another number.
  - The card's sentence and its two buttons "Think again" and "Rerun" come from the server; a new run starts only when "Rerun" is clicked.
- Templates (G2-RE.23): submit a card; nothing is saved, submitted, listed, rejected or unlisted until the person clicks the card's button, and the server judges who may do it exactly as on the web.
  - "Save this as a template": `{"action": "save_template"}`; add `name`, `summary` or `category` only if they said them (otherwise the server fills them from the workflow and the card shows the P2.1-H.11 list).
  - "Submit 'Expense approval' to the org": `{"action": "submit_template", "name": "Expense approval"}`; "withdraw it": `withdraw_template`. An org admin's "list it": `approve_template`; "reject it, because …": `reject_template` with `reason` (the reason in their words; without one the server asks for it); "unlist it": `unlist_template`.
  - Give the template's `name` as they said it (no `template_id` needed); if they did not name one, omit `name` and the server uses the template saved from this workflow. If several match, or none, the server replies with a sentence asking which one; paste it.
  - If they may not do it (for example "Please ask Zhang Min, the owner of workflow 'Expense approval', to submit it"), the server shows no card and gives that sentence; do not offer another way round it.
- "Try again" / "fixed it, carry on" about a step that is stopped: do not submit `rerun_from`; do "Retry this step" from 6. That continues the same run; it does not start a new one (G2-RE.17).

### 8-1. Chat jobs from a web page: the Project is already decided

Both kinds of steward job above come from a chat on a workflows web page: the new-workflow page (`task.content.kind = new_chat`, with `text`, the page's current `draft`, the earlier turns in `prior`, and `openmax_project_id`) and a workflow's or run's thread (`workflow_id`, `mode`). The person already chose where runs are recorded on that page: on the new-workflow page it is `openmax_project_id` (decided before the first message is sent, P2.3-M.5), and an existing workflow keeps its own Project in its settings.

- Do not ask which Project, and do not start your usual Issue / Project intake for this Task: workflows already opened it under its own steward Issue in that Project (「新建工作流 · 管家」 for the new-workflow page, 「工作流管家」 for a workflow's thread; BT-12.3), owned by the workflows service, with no delivery or acceptance on your side. It is a workflows job, not a new request to you.
- Answer only by submitting the job (`submit_task_result`); do not reply in a DM. The person reads your `text` on the page.
- If they want runs recorded in another Project: on the new-workflow page they change it in the "runs recorded in" picker above the chat; on an existing workflow it is the "runs recorded in" setting, a high-risk change the person confirms themselves (BT-13.12). Do not pick a Project for them.
