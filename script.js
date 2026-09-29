const $ = (id) => document.getElementById(id);

const state = { web: null, api: null };

function loading(el, text="Working...") {
  el.className = "agent-output loading";
  el.innerHTML = `<span class="spinner"></span>${text}`;
}
function escapeHtml(s="") {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

function extractTopic(goal){
  let g = goal.trim().replace(/\s+/g," ");
  const patterns = [
    /about\s+(.+)/i, /for\s+(.+)/i, /search\s+(.+)/i, /explore\s+(.+)/i,
    /find\s+(.+)/i, /information\s+on\s+(.+)/i
  ];
  for(const p of patterns){const m=g.match(p); if(m) return m[1].replace(/[?.]+$/,"").trim();}
  return g.replace(/[?.]+$/,"");
}

async function wikiSearch(topic){
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(topic)}&format=json&origin=*`;
  const res = await fetch(url);
  if(!res.ok) throw new Error("Wikipedia request failed");
  const data = await res.json();
  return data.query?.search?.slice(0,5) || [];
}

async function wikiSummary(title){
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const res = await fetch(url);
  if(!res.ok) return null;
  return await res.json();
}

async function githubSearch(topic){
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(topic)}&sort=stars&order=desc&per_page=5`;
  const res = await fetch(url, {headers: {"Accept":"application/vnd.github+json"}});
  if(!res.ok) throw new Error("GitHub API request failed");
  const data = await res.json();
  return data.items || [];
}

function renderList(items, type){
  if(!items.length) return "<span class='muted'>No results found.</span>";
  if(type==="wiki"){
    return items.map(x => `<div><b>${escapeHtml(x.title)}</b><div class="muted">${escapeHtml((x.snippet||"").replace(/<[^>]+>/g,""))}</div><a class="source" target="_blank" href="https://en.wikipedia.org/wiki/${encodeURIComponent(x.title)}">Open Wikipedia ↗</a></div>`).join("<hr style='border:0;border-top:1px solid #203852;margin:13px 0'>");
  }
  return items.map(x => `<div><b>${escapeHtml(x.full_name)}</b> ⭐ ${x.stargazers_count.toLocaleString()}<div class="muted">${escapeHtml(x.description||"No description")}</div><a class="source" target="_blank" href="${x.html_url}">Open repository ↗</a></div>`).join("<hr style='border:0;border-top:1px solid #203852;margin:13px 0'>");
}

function createPlan(topic){
  return [
    "1. Identify the main topic from the user goal.",
    "2. Web Agent: search Wikipedia for authoritative topic pages.",
    "3. API Agent: search GitHub public REST API for related repositories.",
    "4. Analyst Agent: compare and summarize the collected evidence.",
    "5. Generate a final report with source links."
  ];
}

async function runExplorer(){
  const goal = $("goal").value.trim();
  if(!goal){alert("Please enter a goal."); return;}
  $("runBtn").disabled = true;
  $("report").className = "report muted";
  $("report").textContent = "Agents are working...";
  const topic = extractTopic(goal);

  $("planBox").className = "agent-output ok";
  $("planBox").innerHTML = `<b>Goal:</b> ${escapeHtml(goal)}<ul>${createPlan(topic).map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul>`;

  loading($("webBox"), "Searching Wikipedia...");
  loading($("apiBox"), "Querying GitHub API...");
  $("analysisBox").className = "agent-output muted";
  $("analysisBox").textContent = "Waiting for agents...";

  try {
    const [wiki, repos] = await Promise.allSettled([wikiSearch(topic), githubSearch(topic)]);
    state.web = wiki.status==="fulfilled" ? wiki.value : [];
    state.api = repos.status==="fulfilled" ? repos.value : [];

    $("webBox").className = "agent-output";
    $("webBox").innerHTML = wiki.status==="fulfilled" ? renderList(state.web,"wiki") : `<span class="error">Wikipedia unavailable.</span>`;

    $("apiBox").className = "agent-output";
    $("apiBox").innerHTML = repos.status==="fulfilled" ? renderList(state.api,"github") : `<span class="error">GitHub API unavailable.</span>`;

    await sleep(450);
    $("analysisBox").className = "agent-output ok";
    $("analysisBox").innerHTML = `
      <b>Analysis complete.</b>
      <ul>
        <li>Wikipedia results: <b>${state.web.length}</b></li>
        <li>GitHub repositories: <b>${state.api.length}</b></li>
        <li>Sources were collected directly from public web/API endpoints.</li>
      </ul>`;

    const topWiki = state.web[0];
    const topRepo = state.api[0];
    $("report").className = "report";
    $("report").textContent =
`MULTI-AGENT EXPLORER REPORT

User Goal:
${goal}

Topic:
${topic}

WEB AGENT
${state.web.length ? state.web.map((x,i)=>`${i+1}. ${x.title}`).join("\n") : "No Wikipedia results."}

API AGENT
${state.api.length ? state.api.map((x,i)=>`${i+1}. ${x.full_name} — ${x.stargazers_count.toLocaleString()} stars`).join("\n") : "No GitHub results."}

ANALYST SUMMARY
The planner delegated the task to a Web Agent and an API Agent. The Web Agent searched Wikipedia, while the API Agent searched GitHub's public repository API. The Analyst Agent combined the returned results into this report.

Top Wikipedia result:
${topWiki ? topWiki.title : "N/A"}

Top GitHub result:
${topRepo ? topRepo.full_name : "N/A"}

This is a browser-only demonstration suitable for GitHub Pages.`;
  } catch(e) {
    $("report").className = "report error";
    $("report").textContent = "Explorer error: " + e.message;
  } finally {
    $("runBtn").disabled = false;
  }
}

$("runBtn").addEventListener("click", runExplorer);
$("goal").addEventListener("keydown", e => { if(e.key==="Enter") runExplorer(); });
document.querySelectorAll(".example").forEach(btn => btn.addEventListener("click",()=>{$("goal").value=btn.textContent; runExplorer();}));
$("copyBtn").addEventListener("click", async ()=>{
  const text = $("report").textContent;
  await navigator.clipboard.writeText(text);
  $("copyBtn").textContent = "Copied!";
  setTimeout(()=>$("copyBtn").textContent="Copy",1200);
});
