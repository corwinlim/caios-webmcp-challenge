// Copyright 2026 Absolute Global Resources PLT
// SPDX-License-Identifier: Apache-2.0

import "./style.css";
import {
  createSyntheticPikaTools,
  readSyntheticCheckIns,
  registerSyntheticPikaTools,
  RESET_CONFIRMATION,
  STATE_CHANGED_EVENT,
} from "./gateway";

const rootCandidate = document.querySelector<HTMLDivElement>("#app");
if (!rootCandidate) throw new Error("Missing #app root");
const root: HTMLDivElement = rootCandidate;

const tools = createSyntheticPikaTools(window.localStorage);
function requireTool(name: string) {
  const tool = tools.find((candidate) => candidate.name === name);
  if (!tool) throw new Error(`Missing synthetic tool: ${name}`);
  return tool;
}
const previewTool = requireTool("preview_synthetic_pika_check_in");
const commitTool = requireTool("commit_synthetic_pika_check_in");

let pendingPayload: Record<string, unknown> | null = null;
let pendingToken: string | null = null;
let previewDirty = false;
let lastResult: unknown = null;
let formPayload = {
  appetite: "normal",
  stoolScore: 5,
  energy: "normal",
  note: "Judge workflow",
};

function readFormPayload(form: HTMLFormElement) {
  const data = new FormData(form);
  return {
    appetite: String(data.get("appetite")),
    stoolScore: Number(data.get("stoolScore")),
    energy: String(data.get("energy")),
    note: String(data.get("note") ?? ""),
  };
}

function populateForm(form: HTMLFormElement): void {
  const appetite = form.elements.namedItem("appetite");
  const stoolScore = form.elements.namedItem("stoolScore");
  const energy = form.elements.namedItem("energy");
  const note = form.elements.namedItem("note");

  if (appetite instanceof HTMLSelectElement) appetite.value = formPayload.appetite;
  if (stoolScore instanceof HTMLInputElement) stoolScore.value = String(formPayload.stoolScore);
  if (energy instanceof HTMLSelectElement) energy.value = formPayload.energy;
  if (note instanceof HTMLInputElement) note.value = formPayload.note;
}

function render(): void {
  const checkIns = readSyntheticCheckIns(window.localStorage);
  const latest = checkIns.at(-1);

  root.innerHTML = `
    <header class="hero">
      <div class="brand">CAIOS <span>WebMCP Agent Gateway</span></div>
      <div class="badge">SYNTHETIC HACKATHON BUILD</div>
      <h1>One pet-care page.<br />One shared state for people and agents.</h1>
      <p class="lede">
        Explore a safe WebMCP workflow with fictional Pika data:
        read context, preview a daily check-in, confirm the exact payload,
        commit it locally, and verify the same result together.
      </p>
      <div class="boundary">
        <strong>Data boundary:</strong> synthetic Pika only · browser storage only · no production CAIOS access
      </div>
    </header>

    <main>
      <section class="grid">
        <article class="card profile">
          <div class="eyebrow">Synthetic companion</div>
          <div class="pet-row">
            <div class="avatar" aria-hidden="true">P</div>
            <div>
              <h2>Pika <small>(Synthetic)</small></h2>
              <p>Pomeranian · 6 years · 4.2 kg</p>
            </div>
          </div>
          <dl>
            <div><dt>Diet</dt><dd>Synthetic chicken transition plan</dd></div>
            <div><dt>Today</dt><dd>${latest ? "Review the latest check-in" : "Complete a daily check-in"}</dd></div>
          </dl>
        </article>

        <article class="card">
          <div class="eyebrow">Agent-ready actions</div>
          <h2>Five narrow site tools</h2>
          <ol class="tools">
            ${tools.map((tool) => `<li><code>${tool.name}</code><span>${tool.annotations.readOnlyHint ? "READ" : "CONFIRM"}</span></li>`).join("")}
          </ol>
        </article>
      </section>

      <section class="card check-in">
        <div>
          <div class="eyebrow">Shared human + agent workflow</div>
          <h2>Preview before commit</h2>
          <p>A write is denied unless the unchanged payload carries the token returned by preview.</p>
        </div>
        <form id="check-in-form">
          <label>Appetite
            <select name="appetite">
              <option value="normal">Normal</option>
              <option value="reduced">Reduced</option>
              <option value="increased">Increased</option>
            </select>
          </label>
          <label>Stool score
            <input name="stoolScore" type="number" min="1" max="7" value="5" required />
          </label>
          <label>Energy
            <select name="energy">
              <option value="normal">Normal</option>
              <option value="low">Low</option>
              <option value="high">High</option>
            </select>
          </label>
          <label class="wide">Note
            <input name="note" maxlength="240" value="Judge workflow" />
          </label>
          <div class="actions wide">
            <button type="submit">Preview check-in</button>
            <button id="confirm-button" type="button" class="secondary" ${pendingToken ? "" : "disabled"}>
              Confirm exact payload
            </button>
          </div>
        </form>
        <pre id="result" aria-live="polite">${pendingToken
          ? JSON.stringify({ preview: pendingPayload, confirmationRequired: true, confirmationToken: pendingToken }, null, 2)
          : lastResult
            ? JSON.stringify(lastResult, null, 2)
            : "No pending preview."}</pre>
      </section>

      <section class="card">
        <div class="eyebrow">Visible verification</div>
        <h2>Browser-only check-ins <span class="count">${checkIns.length}</span></h2>
        <div class="timeline">
          ${checkIns.length
            ? [...checkIns].reverse().map((item) => `
                <article>
                  <strong>Stool ${item.stoolScore} · Appetite ${item.appetite} · Energy ${item.energy}</strong>
                  <span>${new Date(item.recordedAt).toLocaleString()}</span>
                  <p>${item.note ?? "No note"}</p>
                </article>`).join("")
            : '<p class="empty">No synthetic check-ins yet. Preview and confirm one with the page or an agent.</p>'}
        </div>
        <button id="reset-button" class="text-button" type="button">Reset synthetic demo</button>
      </section>
    </main>

    <footer>
      Decision-support demonstration only — not diagnosis, prescription, or emergency care.
      <a href="https://github.com/corwinlim/caios-webmcp-challenge">Source</a>
    </footer>
  `;

  const form = document.querySelector<HTMLFormElement>("#check-in-form");
  const result = document.querySelector<HTMLPreElement>("#result");
  if (form) populateForm(form);

  form?.addEventListener("input", () => {
    formPayload = readFormPayload(form);
    if (!pendingToken) return;

    previewDirty = true;
    const confirmButton = document.querySelector<HTMLButtonElement>("#confirm-button");
    if (confirmButton) confirmButton.disabled = true;
    if (result) result.textContent = "Preview invalidated because the form changed. Preview the updated payload before confirming.";
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    formPayload = readFormPayload(form);
    pendingPayload = { ...formPayload };
    previewDirty = false;
    lastResult = null;
    try {
      const preview = await previewTool.execute(pendingPayload);
      pendingToken = String(preview.confirmationToken);
      render();
    } catch (error) {
      if (result) result.textContent = error instanceof Error ? error.message : String(error);
    }
  });

  document.querySelector("#confirm-button")?.addEventListener("click", async () => {
    if (!pendingPayload || !pendingToken || previewDirty) return;
    const committed = await commitTool.execute({
      ...pendingPayload,
      confirmationToken: pendingToken,
    });
    pendingPayload = null;
    pendingToken = null;
    previewDirty = false;
    lastResult = {
      ...committed,
      message: "Check-in committed. The form still shows the exact committed payload; edit it and preview again to create another check-in.",
    };
    render();
  });

  document.querySelector("#reset-button")?.addEventListener("click", async () => {
    await commitTool.execute({ resetConfirmation: RESET_CONFIRMATION });
    pendingPayload = null;
    pendingToken = null;
    previewDirty = false;
    lastResult = null;
    formPayload = {
      appetite: "normal",
      stoolScore: 5,
      energy: "normal",
      note: "Judge workflow",
    };
    render();
  });
}

render();
window.addEventListener(STATE_CHANGED_EVENT, render);

if (typeof document.modelContext?.registerTool === "function") {
  void registerSyntheticPikaTools(document.modelContext, tools).then(() => {
    document.documentElement.dataset.webmcp = "registered";
  }).catch((error: unknown) => {
    console.warn("WebMCP registration failed; the human interface remains available.", error);
  });
}
