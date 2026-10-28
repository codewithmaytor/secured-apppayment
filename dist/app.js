import {
  KEY,
  contacts,
  money,
  amountCents,
  risk,
  seed,
  balance,
  commit,
  csv,
} from "./model.js";
const $ = (s) => document.querySelector(s);
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const uid = () => crypto.randomUUID();
let db;
try {
  db = JSON.parse(localStorage.getItem(KEY)) || { users: {} };
} catch {
  db = { users: {} };
}
let current = sessionStorage.getItem(KEY + "-session"),
  page = location.hash.slice(1) || "overview",
  pending = null,
  filter = "All",
  search = "",
  selected = null;
if (!db.users[current]) current = null;
const user = () => db.users[current]?.data;
const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    notify(
      "Browser storage is unavailable. Changes last only for this session.",
    );
  }
};
const event = (action) => {
  user().events.unshift({ date: new Date().toISOString(), action });
  save();
};
const date = (v) =>
  new Date(v).toLocaleString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
const initials = (n) =>
  n
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
const badge = (label) =>
  `<span class="badge ${label.toLowerCase()}">${esc(label)}</span>`;
const icons = {
  overview: "◫",
  send: "↗",
  activity: "⇄",
  accounts: "▣",
  security: "◇",
  profile: "☷",
};
function notify(s) {
  $("#toast").textContent = s;
  $("#toast").classList.add("show");
  setTimeout(() => $("#toast").classList.remove("show"), 4000);
}
function go(p) {
  pending = null;
  selected = null;
  page = p;
  location.hash = p;
  render();
}
async function hash(password, salt) {
  const bytes = new TextEncoder().encode(salt + password);
  return Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
}
function setSession(email) {
  current = email;
  sessionStorage.setItem(KEY + "-session", email);
  page = "overview";
  location.hash = "overview";
  render();
}
function brand() {
  return '<span class="brandmark" aria-hidden="true">S<span>↗</span></span><span>SECURED<span class="brand-sub">APP PAYMENT</span></span>';
}
function auth(register = false) {
  $("#app").innerHTML =
    `<div class="auth-shell"><section class="auth-art"><a class="brand" href="#">${brand()}</a><div><span class="eyebrow">SECURED APP PAYMENT</span><h1>Every payment.<br>A clearer picture.</h1><p>Review who you pay. Confirm the details.<br>Keep a record of every step.</p><div class="auth-receipt"><div class="receipt-top">PAYMENT JOURNEY <span>01 — 04</span></div>${["Choose a recipient", "Review amount and risk", "Verify the payment", "Receive a traceable receipt"].map((s, i) => `<div class="journey"><span>0${i + 1}</span>${s}<b>✓</b></div>`).join("")}</div></div><small>Academic prototype · Kabarak University<br>Computer Science research project</small></section><main class="auth-form"><span class="prototype-tag">RESEARCH PROTOTYPE</span><h2>${register ? "Create a demo account" : "Welcome back"}</h2><p class="muted">${register ? "Explore the personal or business account journey." : "A workspace for more considered payments."}</p><div class="notice">Synthetic funds only. No real payments, bank connections, or email delivery. Use invented details and a demo-only password.</div><form id="auth-form">${register ? '<label>Full name<input name="name" required maxlength="60" autocomplete="off" placeholder="Your demo name"></label><label>Account type<select name="type"><option>Personal</option><option>Business</option></select></label>' : ""}<label>Email address<input type="email" name="email" required autocomplete="off" placeholder="you@example.test"></label><label>Demo password<input type="password" name="password" required minlength="8" maxlength="100" autocomplete="off" placeholder="At least 8 characters"></label><p class="error" id="auth-error" role="alert"></p><button class="primary wide">${register ? "Create demo account" : "Sign in to demo"}</button></form>${!register ? '<div class="or">or explore with synthetic data</div><button class="secondary wide" id="demo">Open demo workspace ↗</button>' : ""}<p class="auth-switch">${register ? "Already have a demo account?" : "New to the prototype?"} <button class="text-button" id="auth-switch">${register ? "Sign in" : "Create an account"}</button></p><small class="muted">Browser-local demonstration. Account controls are simulated.</small></main></div>`;
  $("#auth-switch").onclick = () => auth(!register);
  if ($("#demo"))
    $("#demo").onclick = () => {
      if (!db.users["demo@example.test"])
        db.users["demo@example.test"] = { data: seed(), demo: true };
      save();
      setSession("demo@example.test");
    };
  $("#auth-form").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target),
      email = f.get("email").trim().toLowerCase();
    try {
      if (register) {
        if (db.users[email])
          throw Error("This demo email already exists in this browser.");
        const salt = uid();
        db.users[email] = {
          salt,
          digest: await hash(f.get("password"), salt),
          data: seed(f.get("name").trim(), email, f.get("type")),
        };
        save();
        setSession(email);
      } else {
        const record = db.users[email];
        if (
          !record ||
          record.demo ||
          record.digest !== (await hash(f.get("password"), record.salt))
        )
          throw Error("Email or demo password is incorrect.");
        setSession(email);
      }
    } catch (err) {
      $("#auth-error").textContent = err.message;
    }
  };
}
function shell(content, title, kicker = "YOUR PAYMENT WORKSPACE") {
  const u = user(),
    open = u.alerts.filter((a) => a.status === "Open").length;
  $("#app").innerHTML =
    `<div class="layout"><aside class="sidebar"><a class="brand" href="#overview">${brand()}</a><div class="workspace-label">${esc(u.type.toUpperCase())} WORKSPACE</div><nav aria-label="Main navigation">${Object.entries(
      {
        overview: "Overview",
        send: "Send money",
        activity: "Transactions",
        accounts: "Linked accounts",
        security: "Security centre",
        profile: "My profile",
      },
    )
      .map(
        ([p, n]) =>
          `<button data-nav="${p}" class="nav-item ${page === p ? "active" : ""}" ${page === p ? 'aria-current="page"' : ""}><span aria-hidden="true">${icons[p]}</span>${n}${p === "security" && open ? `<i>${open}</i>` : ""}</button>`,
      )
      .join(
        "",
      )}</nav><div class="sidebar-bottom"><div class="privacy-dot"></div><h3>Your details stay yours.</h3><p>The recipient view uses a name and payment handle.</p><button class="logout" id="logout">↪ Sign out</button><small>PROTOTYPE BUILD 1.0</small></div></aside><div class="workspace"><header class="topbar"><span>Workspace <span class="breadcrumb">/ ${esc(title)}</span></span><div class="top-actions"><span class="demo-pill">● Demo environment</span><button id="top-profile" class="avatar" aria-label="Open profile">${esc(initials(u.name))}</button></div></header><div class="demo-bar">RESEARCH PROTOTYPE <span>All balances and transactions are synthetic. No real funds move.</span></div><main id="main"><div class="page-heading"><div><span class="eyebrow">${kicker}</span><h1>${esc(title)}</h1></div><div class="page-date">${new Date().toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}<small>Local prototype workspace</small></div></div>${content}</main><footer>Secured App Payment <span>Research prototype · Synthetic data · Browser-local storage</span></footer></div></div><div id="modal-root"></div>`;
  document
    .querySelectorAll("[data-nav]")
    .forEach((b) => (b.onclick = () => go(b.dataset.nav)));
  $("#logout").onclick = () => {
    pending = null;
    current = null;
    sessionStorage.removeItem(KEY + "-session");
    location.hash = "";
    auth();
  };
  $("#top-profile").onclick = () => go("profile");
  document
    .querySelectorAll("[data-view]")
    .forEach((b) => (b.onclick = () => receipt(b.dataset.view)));
}
function transactionTable(rows) {
  return `<div class="table-wrap"><table class="transactions"><thead><tr><th>Recipient / sender</th><th>Reference & date</th><th>Amount</th><th>Status</th><th><span class="sr-only">Details</span></th></tr></thead><tbody>${rows.length ? rows.map((t) => `<tr><td><div class="person"><span class="mini-avatar ${t.direction === "in" ? "mint" : "peach"}">${esc(initials(t.name))}</span><span><b>${esc(t.name)}</b><small>${esc(t.handle)}</small></span></div></td><td><span class="reference">${esc(t.id.slice(0, 22))}</span><small>${date(t.date)}</small></td><td class="amount">${t.direction === "in" ? "+" : "−"} ${money(t.amount)}<small>${t.direction === "in" ? "Received" : "Payment"}</small></td><td>${badge(t.status)}</td><td><button class="round-button" data-view="${esc(t.id)}" aria-label="View transaction ${esc(t.id)}">↗</button></td></tr>`).join("") : '<tr><td colspan="5" class="empty">No transactions match your search.</td></tr>'}</tbody></table></div>`;
}
function overview() {
  const u = user(),
    tx = u.transactions;
  const total = (d) =>
    tx
      .filter((t) => t.status === "Completed" && t.direction === d)
      .reduce((a, t) => a + t.amount, 0);
  shell(
    `<div class="overview-grid"><section class="balance-card"><div class="balance-head">AVAILABLE DEMO BALANCE <span>◈</span></div><div class="balance">${money(balance(u))}</div><p>Prototype wallet <span>•• 0021</span></p><div class="balance-actions"><button class="light-button" id="send-main">Send money ↗</button><button class="ghost-light" id="view-wallet">View accounts</button></div><div class="card-fine">SYNTHETIC FUNDS · KES</div></section><section class="stat-card"><span class="stat-icon">↗</span><span class="eyebrow">TOTAL SENT</span><h2>${money(total("out"))}</h2><p>Completed demo payments</p><div class="stat-divider"></div><span class="stat-icon mint">↙</span><span class="eyebrow">TOTAL RECEIVED</span><h2>${money(total("in"))}</h2><p>Completed demo receipts</p></section><section class="security-card"><span class="eyebrow">PAY WITH AWARENESS</span><div class="security-symbol">◇</div><h2>A moment to review.<br>A record to keep.</h2><p>Every outgoing payment passes a demo risk check before confirmation.</p><button class="text-button" id="security-main">Explore security centre ↗</button><small>Illustrative rules · Not a trained fraud model</small></section></div><section class="panel quick-panel"><div><span class="eyebrow">MAKE IT FAMILIAR</span><h2>Send to a saved recipient</h2></div><div class="contacts">${contacts
      .slice(0, 3)
      .map(
        (c) =>
          `<button data-contact="${c.id}"><span class="contact-avatar ${c.color}">${initials(c.name)}</span><b>${c.name}</b><small>${c.handle}</small></button>`,
      )
      .join(
        "",
      )}<button id="new-payment"><span class="contact-avatar outline">+</span><b>New payment</b><small>Choose a recipient</small></button></div></section><section class="panel"><div class="section-heading"><div><h2>Recent activity</h2><p>A clear record of your demo payments.</p></div><button id="all-activity" class="text-button">View all transactions ↗</button></div>${transactionTable(tx.slice(0, 4))}</section>`,
    "Good to see you, " + u.name.split(" ")[0],
  );
  $("#send-main").onclick = $("#new-payment").onclick = () => go("send");
  $("#view-wallet").onclick = () => go("accounts");
  $("#security-main").onclick = () => go("security");
  $("#all-activity").onclick = () => go("activity");
  document.querySelectorAll("[data-contact]").forEach(
    (b) =>
      (b.onclick = () => {
        selected = b.dataset.contact;
        page = "send";
        location.hash = "send";
        send();
      }),
  );
}
function send() {
  if (pending) return verification();
  shell(
    `<div class="steps"><span class="current">01 <b>Payment details</b></span><i></i><span>02 <b>Review & verify</b></span><i></i><span>03 <b>Receipt</b></span></div><div class="send-grid"><section class="panel form-panel"><h2>Who are you paying?</h2><p>Use a payment handle instead of sharing a phone number.</p><form id="payment-form"><label>Recipient<select name="recipient" id="recipient">${contacts.map((c) => `<option value="${c.id}" ${selected === c.id ? "selected" : ""}>${c.name} · ${c.handle}</option>`).join("")}</select></label><label>Amount in KES<div class="amount-input"><span>KES</span><input name="amount" inputmode="decimal" type="number" min="0.01" max="999999" step="0.01" required placeholder="0.00"></div></label><div class="field-hint">Available demo balance: ${money(balance(user()))}</div><label>Payment note <span class="muted">(optional)</span><input name="note" maxlength="100" placeholder="What is this payment for?"></label><label>Payment source<select name="source">${user()
      .accounts.map(
        (a) =>
          `<option value="${a.id}">${esc(a.name)} · •• ${esc(a.last4)}</option>`,
      )
      .join(
        "",
      )}</select></label><p class="field-hint">Sources are labels for the same synthetic wallet balance.</p><p id="payment-error" class="error" role="alert"></p><button class="primary wide">Review payment ↗</button></form></section><aside class="payment-guide"><span class="eyebrow">BEFORE YOU SEND</span><h2>Confidence starts<br>with the details.</h2><ol><li><b>Check the recipient</b><p>Make sure the name and handle match the person you intend to pay.</p></li><li><b>Review the risk check</b><p>New recipients and larger amounts get extra attention in this prototype.</p></li><li><b>Confirm only when ready</b><p>The wallet changes only after a valid demo code is confirmed.</p></li></ol><div class="notice">Never enter real bank details, card numbers, PINs, or verification codes.</div></aside></div>`,
    "Send money",
    "A CONSIDERED PAYMENT",
  );
  $("#payment-form").onsubmit = (e) => {
    e.preventDefault();
    const f = new FormData(e.target),
      amount = amountCents(f.get("amount")),
      c = contacts.find((c) => c.id === f.get("recipient"));
    const fail = (s) => ($("#payment-error").textContent = s);
    if (!amount)
      return fail(
        "Enter a positive amount with no more than two decimal places.",
      );
    if (amount > balance(user()))
      return fail("This amount exceeds your available demo balance.");
    const result = risk(amount, c.known),
      id = "SPA-" + uid().slice(0, 13).toUpperCase();
    const t = {
      id,
      name: c.name,
      handle: c.handle,
      amount,
      direction: "out",
      status: "Pending",
      risk: result.level,
      reason: result.reason,
      note: f.get("note").trim(),
      source: f.get("source"),
      date: new Date().toISOString(),
    };
    if (result.level === "Blocked") {
      t.status = "Blocked";
      commit(user(), t);
      user().alerts.unshift({
        id: uid(),
        transaction: id,
        reason: result.reason,
        status: "Open",
      });
      event("Payment blocked: " + id);
      receipt(id);
      return;
    }
    const code = String(
      (crypto.getRandomValues(new Uint32Array(1))[0] % 900000) + 100000,
    );
    pending = {
      t,
      code,
      expires: Date.now() + 120000,
      attempts: 0,
      ack: result.level === "Low",
    };
    verification();
  };
}
function verification() {
  const p = pending;
  if (!p) return send();
  const t = p.t;
  shell(
    `<div class="steps"><span>01 <b>Payment details</b></span><i></i><span class="current">02 <b>Review & verify</b></span><i></i><span>03 <b>Receipt</b></span></div><div class="send-grid"><section class="panel form-panel"><div class="section-heading"><h2>Review your payment</h2>${badge(t.risk)}</div><div class="review-person"><span class="contact-avatar mint">${initials(t.name)}</span><h2>${esc(t.name)}</h2><p>${esc(t.handle)}</p><div class="review-amount">${money(t.amount)}</div></div><dl class="details"><div><dt>Fee</dt><dd>KES 0.00 <small>(demo)</small></dd></div><div><dt>Recipient sees</dt><dd>${esc(user().name)} and payment handle</dd></div><div><dt>Phone number</dt><dd>Not included in receipt</dd></div><div><dt>Risk check</dt><dd>${esc(t.reason)}</dd></div></dl><form id="verify-form">${t.risk === "Review" ? '<label class="check"><input type="checkbox" name="ack" required> I have checked the recipient and amount.</label>' : ""}<div class="demo-code">DEMO CODE <strong id="visible-code">${p.code}</strong><small>Shown here for testing. No email or SMS is sent. Expires after 120 seconds; five incorrect attempts cancel this payment.</small></div><label>Enter the six digit demo code<input name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required autocomplete="off" placeholder="000000"></label><p class="error" id="verify-error" role="alert"></p><button class="primary wide">Confirm demo payment</button><button type="button" id="cancel-payment" class="secondary wide">Cancel payment</button></form></section><aside class="payment-guide"><span class="eyebrow">ONE LAST CHECK</span><h2>You are in control<br>of this step.</h2><p>The amount and recipient are fixed for this verification attempt. To change either, cancel and start again.</p><div class="notice">This visible code demonstrates the verification journey. It is not genuine multi-factor authentication.</div><p class="muted">Reference<br><b>${esc(t.id)}</b></p></aside></div>`,
    "Review & verify",
    "CONFIRM THE DETAILS",
  );
  $("#cancel-payment").onclick = () => {
    pending = null;
    event("Pending payment cancelled");
    go("send");
    notify("Payment cancelled. Demo balance unchanged.");
  };
  $("#verify-form").onsubmit = (e) => {
    e.preventDefault();
    if (!pending) return;
    const f = new FormData(e.target),
      fail = (s) => ($("#verify-error").textContent = s);
    if (Date.now() > p.expires) {
      pending = null;
      send();
      notify("Demo code expired. Start a new payment.");
      return;
    }
    if (f.get("code") !== p.code) {
      p.attempts++;
      if (p.attempts >= 5) {
        pending = null;
        send();
        notify("Five incorrect codes. Payment cancelled; balance unchanged.");
        return;
      }
      return fail(`Code does not match. ${5 - p.attempts} attempts remain.`);
    }
    if (t.risk === "Review" && !f.get("ack"))
      return fail("Confirm that you have reviewed this payment.");
    t.status = "Completed";
    t.date = new Date().toISOString();
    try {
      commit(user(), t);
      pending = null;
      event("Demo payment completed: " + t.id);
      receipt(t.id);
    } catch (err) {
      fail(err.message);
    }
  };
}
function receipt(id) {
  const t = user().transactions.find((t) => t.id === id);
  if (!t) return;
  const blocked = t.status === "Blocked";
  const dialog = document.createElement("dialog");
  dialog.className = "receipt-dialog";
  dialog.innerHTML = `<button class="close-button" aria-label="Close receipt">×</button><span class="receipt-icon ${blocked ? "danger" : ""}">${blocked ? "!" : "✓"}</span><span class="eyebrow">${blocked ? "PAYMENT STOPPED" : "TRANSACTION RECEIPT"}</span><h2>${blocked ? "Payment blocked" : "Payment " + (t.direction === "in" ? "received" : "completed")}</h2><p>${blocked ? "Your demo balance has not changed." : "A traceable record for your demo workspace."}</p><div class="review-amount">${money(t.amount)}</div>${badge(t.status)}<dl class="details"><div><dt>${t.direction === "in" ? "Sender" : "Recipient"}</dt><dd>${esc(t.name)}<small>${esc(t.handle)}</small></dd></div><div><dt>Reference</dt><dd>${esc(t.id)}</dd></div><div><dt>Date</dt><dd>${date(t.date)}</dd></div><div><dt>Payment note</dt><dd>${esc(t.note || "No note")}</dd></div><div><dt>Risk result</dt><dd>${esc(t.risk)}${blocked ? "<small>" + esc(t.reason) + "</small>" : ""}</dd></div><div><dt>Privacy</dt><dd>No phone number in this receipt</dd></div></dl><p class="field-hint">Synthetic transaction. No real funds moved.</p><button id="download-receipt" class="primary wide">Download receipt</button><button id="receipt-done" class="secondary wide">Back to transactions</button>`;
  document.body.append(dialog);
  dialog.showModal();
  dialog.querySelector(".close-button").onclick = () => {
    dialog.close();
    dialog.remove();
    render();
  };
  dialog.addEventListener("cancel", () => {
    dialog.remove();
    render();
  });
  $("#receipt-done").onclick = () => {
    dialog.close();
    dialog.remove();
    go("activity");
  };
  $("#download-receipt").onclick = () =>
    download(
      "receipt-" + t.id + ".txt",
      `SECURED APP PAYMENT — DEMO RECEIPT\nSynthetic transaction; no real funds moved.\nReference: ${t.id}\n${t.direction === "in" ? "Sender" : "Recipient"}: ${t.name} (${t.handle})\nAmount: ${money(t.amount)}\nStatus: ${t.status}\nRisk: ${t.risk}\nDate: ${date(t.date)}\nNote: ${t.note}\nNo phone number is included.\n`,
      "text/plain",
    );
}
function download(name, data, type) {
  const url = URL.createObjectURL(new Blob([data], { type })),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function activity() {
  const rows = user().transactions.filter(
    (t) =>
      (filter === "All" || t.status === filter) &&
      [t.name, t.id, t.handle, t.note]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  shell(
    `<section class="panel"><div class="section-heading"><div><h2>Transaction history</h2><p>Search your records, inspect a receipt, or export the visible results.</p></div><button class="secondary" id="export">Export CSV ↓</button></div><div class="filters"><label class="search-label"><span class="sr-only">Search transactions</span><input id="search" placeholder="Search name, handle, note or reference" value="${esc(search)}" type="search"></label><div class="filter-buttons">${["All", "Completed", "Blocked"].map((s) => `<button data-filter="${s}" class="${filter === s ? "chosen" : ""}">${s}</button>`).join("")}</div></div>${transactionTable(rows)}<div class="table-foot">${rows.length} matching record${rows.length === 1 ? "" : "s"} <span>Amounts shown in KES · Synthetic data</span></div></section><div class="notice below">Traceability in this build is browser-local and editable. A production audit trail requires server-side protection and controlled retention.</div>`,
    "Transactions",
    "EVERY STEP ACCOUNTED FOR",
  );
  $("#search").oninput = (e) => {
    search = e.target.value;
    const pos = e.target.selectionStart;
    activity();
    $("#search").focus();
    $("#search").setSelectionRange(pos, pos);
  };
  document.querySelectorAll("[data-filter]").forEach(
    (b) =>
      (b.onclick = () => {
        filter = b.dataset.filter;
        activity();
      }),
  );
  $("#export").onclick = () =>
    download(
      "secured-payment-transactions.csv",
      csv(rows),
      "text/csv;charset=utf-8",
    );
}
function accounts() {
  shell(
    `<div class="section-heading"><div><h2>Payment sources</h2><p>Demonstrate the linking journey with invented institution details.</p></div><button id="link-account" class="primary">+ Link demo source</button></div><div class="account-grid">${user()
      .accounts.map(
        (a) =>
          `<section class="panel account-card"><div class="section-heading"><span class="account-icon">▣</span>${badge("Demo")}</div><span class="eyebrow">${esc(a.kind)}</span><h2>${esc(a.name)}</h2><p class="account-digits">•••• &nbsp; •••• &nbsp; ${esc(a.last4)}</p><small>Metadata only · No bank connection</small>${a.id !== "wallet" ? `<button class="text-button remove-account" data-remove="${a.id}">Remove source</button>` : '<span class="wallet-label">Default synthetic wallet</span>'}</section>`,
      )
      .join(
        "",
      )}</div><section class="panel below"><h2>Linking without exposing account details</h2><p>This prototype stores only a display label, source type, and four invented ending digits. It does not collect full card numbers, CVVs, account credentials, or bank PINs.</p><div class="notice">All sources refer to the same synthetic wallet balance. Real bank linking and funding remain planned integrations.</div></section>`,
    "Linked accounts",
  );
  $("#link-account").onclick = () => {
    const d = document.createElement("dialog");
    d.className = "receipt-dialog";
    d.innerHTML =
      '<button class="close-button" aria-label="Close link form">×</button><span class="eyebrow">SIMULATED LINKING</span><h2>Add a demo source</h2><p>Use invented values only.</p><form id="link-form"><label>Source type<select name="kind"><option>Bank account</option><option>Demo card</option><option>Mobile wallet</option></select></label><label>Institution label<input name="name" required maxlength="40" placeholder="Example Bank"></label><label>Four invented ending digits<input name="last4" required pattern="[0-9]{4}" maxlength="4" inputmode="numeric" placeholder="1234"></label><button class="primary wide">Save demo source</button></form>';
    document.body.append(d);
    d.showModal();
    d.querySelector(".close-button").onclick = () => d.remove();
    $("#link-form").onsubmit = (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      user().accounts.push({
        id: uid(),
        kind: f.get("kind"),
        name: f.get("name").trim(),
        last4: f.get("last4"),
      });
      event("Demo source added");
      d.remove();
      accounts();
      notify("Demo source saved. No bank connection was made.");
    };
  };
  document.querySelectorAll("[data-remove]").forEach(
    (b) =>
      (b.onclick = () => {
        user().accounts = user().accounts.filter(
          (a) => a.id !== b.dataset.remove,
        );
        event("Demo source removed");
        accounts();
      }),
  );
}
function security() {
  const u = user();
  shell(
    `<div class="security-overview"><section class="panel"><span class="eyebrow">PROTOTYPE CONTROLS</span><h2>Visible checks.<br>Explainable decisions.</h2><p>This build demonstrates a risk-aware payment journey using deterministic rules. It cannot identify real fraud.</p><div class="control-row"><span>Payment review</span>${badge("Enabled")}</div><div class="control-row"><span>Code confirmation</span>${badge("Simulated")}</div><div class="control-row"><span>Bank / email integration</span>${badge("Planned")}</div><div class="control-row"><span>Biometrics / trained ML model</span>${badge("Planned")}</div></section><section class="panel"><span class="eyebrow">ILLUSTRATIVE RISK POLICY</span><h2>How the rules work</h2><div class="rule"><b>01</b><div><h3>Known recipient, below KES 10,000</h3><p>Low risk. Review details and enter the demo code.</p></div></div><div class="rule"><b>02</b><div><h3>New recipient or KES 10,000 and above</h3><p>Review required. Acknowledge the warning before code confirmation.</p></div></div><div class="rule"><b>03</b><div><h3>KES 50,000 and above</h3><p>Blocked. No balance deduction; an alert is recorded.</p></div></div></section></div><section class="panel below"><div class="section-heading"><div><h2>Risk alerts</h2><p>Acknowledging an alert records review; it never releases a blocked payment.</p></div><span class="demo-pill">${u.alerts.filter((a) => a.status === "Open").length} open</span></div>${u.alerts.length ? u.alerts.map((a) => `<div class="alert-row"><span class="alert-icon">!</span><div><h3>${esc(a.reason)}</h3><p>${esc(a.transaction)} · ${esc(a.status)}</p></div>${a.status === "Open" ? `<button class="secondary" data-ack="${a.id}">Acknowledge</button>` : badge("Acknowledged")}</div>`).join("") : "<p>No alerts recorded.</p>"}</section><section class="panel below"><h2>Activity log</h2>${u.events
      .slice(0, 8)
      .map(
        (e) =>
          `<div class="log-row"><span>${esc(e.action)}</span><small>${date(e.date)}</small></div>`,
      )
      .join("")}</section>`,
    "Security centre",
    "UNDERSTAND THE CHECKS",
  );
  document.querySelectorAll("[data-ack]").forEach(
    (b) =>
      (b.onclick = () => {
        u.alerts.find((a) => a.id === b.dataset.ack).status = "Acknowledged";
        event("Risk alert acknowledged");
        security();
      }),
  );
}
function profile() {
  shell(
    `<div class="send-grid"><section class="panel form-panel"><span class="avatar big">${esc(initials(user().name))}</span><h2>Your demo profile</h2><p>Keep your display details easy to recognise.</p><form id="profile-form"><label>Display name<input name="name" required maxlength="60" value="${esc(user().name)}"></label><label>Account type<select name="type"><option ${user().type === "Personal" ? "selected" : ""}>Personal</option><option ${user().type === "Business" ? "selected" : ""}>Business</option></select></label><label>Demo email<input value="${esc(user().email)}" disabled></label><p class="field-hint">Email changes and recovery are outside this prototype.</p><button class="primary wide">Save profile</button></form></section><aside class="payment-guide"><span class="eyebrow">PRIVACY BY DESIGN</span><h2>Share what helps.<br>Keep the rest private.</h2><p>Payment screens and exported receipts use display names and payment handles. No phone number is requested.</p><div class="notice">Browser storage is not an encrypted financial database. Use synthetic details only. Demo account passwords are hashed locally; this does not provide a server-enforced identity boundary.</div></aside></div>`,
    "My profile",
  );
  $("#profile-form").onsubmit = (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    user().name = f.get("name").trim();
    user().type = f.get("type");
    event("Demo profile updated");
    profile();
    notify("Demo profile saved.");
  };
}
function render() {
  if (!current) return auth();
  (
    ({ overview, send, activity, accounts, security, profile })[page] ||
    overview
  )();
}
window.addEventListener("hashchange", () => {
  const next = location.hash.slice(1) || "overview";
  if (next !== page) {
    pending = null;
    page = next;
    render();
  }
});
render();
