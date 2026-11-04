Please install the OpenMax Workflows skill as follows:

1. Run:
   git clone https://github.com/openmaxai/zylos-workflows.git ~/zylos/workspace/zylos-workflows && zylos add ~/zylos/workspace/zylos-workflows
   (If the directory already exists, run instead: git -C ~/zylos/workspace/zylos-workflows pull && zylos add ~/zylos/workspace/zylos-workflows)
2. After installing, register Workflows by running:
   node ~/zylos/workspace/zylos-workflows/scripts/register.mjs --url '<deployment URL>' --org-id '<OpenMax org id>' --client-id '<workflows client_id>'
   (Replace the three values with those in the registration command (`node …/scripts/register.mjs …`) in the message to copy to this agent, on its detail page in the Workflows team page, or just use that whole command; `wf` does not work until you register. You cannot open your owner's team page yourself: if you don't have these three values, reply to your owner "Please send me the registration command from the team page", and register once you have it.)
3. After installing, read the workflows skill's SKILL.md once, and follow it whenever someone asks to create / start / change a workflow or asks how a run is going.
4. Follow SKILL.md "0. First check whether you can use it" to check whether you can reach Workflows right now.
5. When everything is done, reply to me with one sentence: "The workflows skill is installed and working" or "The workflows skill is installed, but X is still missing".
