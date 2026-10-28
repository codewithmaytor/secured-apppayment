# Presenting Secured App Payment

## Start the project in VS Code

1. Open **Secured App Payment.code-workspace**, located one folder above this guide, in VS Code. Alternatively, use **File → Open Folder** and select the `prototype` folder.
2. Select **Terminal → New Terminal**. The terminal should be in the `prototype` folder.
3. Run:

   ```bash
   npm start
   ```

4. Open **http://127.0.0.1:4173** in your browser and choose **Open demo workspace**.
5. Keep the terminal open throughout the demonstration. To stop, press **Ctrl+C** in that terminal.

`npm start` builds the latest source before starting the server. No `npm install`, bank credentials, online hosting, or internet connection is required to run the demonstration on this laptop. Node.js and npm must be installed; they are already installed on the laptop checked during preparation.

You can also press **F5** and choose **Present Secured App Payment**. This builds and launches the server with the debugger. Stop it with **Shift+F5**. Use either F5 or `npm start`, since both use port 4173.

## A six minute demonstration

### 1. Explain the problem and scope

Suggested introduction, in your own words:

> My project explores a payment interface that makes recipients, amounts and transaction outcomes clear. This working web prototype demonstrates registration, payment review, code confirmation, traceable receipts and explainable risk rules using synthetic funds. It is the interface and workflow stage of the proposed system.

Explain that the current application runs in the browser. The Node server serves the website files; it is not a payment-processing backend.

### 2. Show the source in VS Code

| File | What to explain |
| --- | --- |
| `src/index.html` | The page entry point that loads the stylesheet and JavaScript module. |
| `src/styles.css` | Colours, spacing, interface components and responsive layouts. |
| `src/app.js` | Screens, navigation, forms and the payment review/verification flow. |
| `src/model.js` | Synthetic records, amount parsing, balance calculation, risk policy and exports. |
| `scripts/build.mjs` | Copies the source assets into `dist`, the built website. |
| `scripts/serve.mjs` | Serves the website locally at port 4173. |
| `scripts/test-model.mjs` | Seven repeatable checks of the core payment calculations and rules. |

Start by showing `src/model.js`, since it is the clearest place to explain the logic. In VS Code, use **Ctrl+P** to open a file, or **Ctrl+Shift+O** to jump to a function.

### 3. Show an ordinary payment

1. Open the demo workspace and note the current balance. A fresh workspace starts with **KES 85,000**.
2. Choose **Send money** and select **Agnes Wanjiku**.
3. Enter **2500** and an optional note such as `Lecturer demonstration`.
4. Select **Review payment**. Point out the name, handle, amount and risk explanation.
5. Enter `000000` once to show that an incorrect code is rejected.
6. Enter the six-digit **DEMO CODE** displayed on the screen within 120 seconds.
7. Confirm and show the receipt. On a fresh workspace, the balance becomes **KES 82,500**.
8. Download the receipt and find the matching reference in **Transactions**.

The displayed code is deliberately visible for demonstration. No email or SMS is sent, and it is not genuine multi-factor authentication.

### 4. Show a blocked request

1. Begin another payment for **60000** while the available balance is greater than that amount.
2. Show that the request is **Blocked**, with a reason and no deduction.
3. Open **Security centre**, explain the amount rule and show the recorded alert.
4. Acknowledge the alert and explain that acknowledgement does not release a blocked payment.

An amount at or above KES 50,000 is blocked. Amounts from KES 10,000 to below KES 50,000, or a new recipient, require extra review. These thresholds are illustrative rules, not a machine-learning model.

### 5. Show traceability and the test results

Search the transaction list for `Nakuru`, show the matching entry and export the visible result as CSV. Then, in a **second VS Code terminal**, run:

```bash
npm test
```

Explain the seven checks: initial balance, valid/invalid amounts, risk boundaries, duplicate-reference protection, no debit for blocked requests, insufficient funds, and safe CSV serialization. Their result is saved in `test-results/model-test-results.json`.

### 6. Explain the next stage

The remaining work includes a trusted server API, durable ledger database, real provider sandbox, independent verification, protected audit records, security evaluation and participant testing. Do not claim these have already been implemented.

## Prepare before the lecturer arrives

- Rehearse the complete demonstration once, including a blocked request.
- To start with the original sample balance again, open the local URL in a **fresh private/incognito browser session**. Close all private windows before starting a new private session. This keeps your ordinary browser records intact. Downloads remain on the laptop.
- Test `npm start` and `npm test` before the presentation. Leave the running terminal visible in VS Code.
- Open `src/model.js`, `src/app.js` and this guide in editor tabs before you begin.
- Keep the research Word document and the screenshots from the project package available as a backup.
- Use invented account details and a demo-only password if you demonstrate registration.

## Questions you may be asked

**What is the technology stack?** HTML, CSS and JavaScript ES modules, with Node.js for building and serving the local website. The website has no third-party runtime dependencies.

**Where is the database?** The prototype uses browser localStorage for records and sessionStorage for the active account. A production relational ledger is a planned extension. Browser storage is editable and is not a secure financial database.

**How is the balance calculated?** The opening amount is adjusted only by completed records. Incoming records add funds; completed outgoing records subtract funds. Blocked records do not change the balance. Amounts use integer cents.

**How are duplicate deductions prevented?** `commit()` rejects a transaction reference that already exists in the browser record. A production system needs server-side idempotency and atomic database posting.

**Is fraud detection powered by AI?** No. This build uses explicit amount and recipient rules. A trained model would need suitable data and measured evaluation.

**Is the password or code mechanism production security?** No. Local password hashing and an on-screen demo code illustrate the journey. Genuine authentication and transaction authorization must be enforced on a trusted server.

**Does a payment transfer money to another person?** No. It creates a synthetic transaction in the sender's demo record. No bank or payment network is connected.

## If something stops working

| Symptom | Action |
| --- | --- |
| Browser says it cannot connect | Start `npm start` and keep that terminal running, then refresh the browser. |
| Port 4173 is already in use | The project may already be running. Open the URL first. Stop any old project terminal with Ctrl+C before launching another copy. |
| Source edit does not appear | For editing, run `npm run dev`, save the file and refresh. For the built presentation, restart `npm start`. |
| Demo balance differs from the example | Previous demonstrations persist in that browser. Use a fresh private session or note the current balance before paying. |
| Verification code expires | Start a new payment and use the newly displayed code within 120 seconds. |
| A registered demo account is missing | Accounts belong to that browser and origin. Use Open demo workspace or register an invented account again. |

## Editing after the presentation

Stop the presentation server and run `npm run dev`. It serves `src` directly, so you can save a code change and refresh the browser to see it. Before presenting or sharing the final build again, use `npm start` to rebuild `dist`. Edit files in `src`; generated `dist` files are overwritten by the build.
