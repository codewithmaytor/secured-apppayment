# Secured App Payment research prototype

Working academic prototype for the project by Mark Mutai. All funds, contacts, source labels, and transactions are synthetic. No bank, email, SMS, card-processing, biometric, or machine-learning service is connected.

## Run and build

Requires a modern browser and Node.js with ES modules. There are no npm dependencies.

```bash
npm run build
npm start
```

Open http://127.0.0.1:4173 and choose **Open demo workspace**. Keep the terminal open while using the local version. `dist/` is the standalone static build. Serve it over HTTP or HTTPS; do not open the HTML directly as a file.

```bash
node scripts/test-model.mjs
```

Tests write `../evidence/model-test-results.json` when run in the full project workspace. In an extracted prototype-only archive, create an `evidence` directory beside the prototype directory first, or run the included full package.

## Demonstration

1. Open the demo workspace. Starting available balance is KES 85,000.
2. Send KES 2,500 to Agnes Wanjiku. Review details, copy the visible demo code, and confirm. The available balance becomes KES 82,500.
3. Download the receipt. Search history and export visible results as CSV.
4. Attempt KES 60,000. It is blocked and recorded without a debit.
5. Open Security centre and acknowledge an alert. This does not release funds.
6. Link a source using an invented name and four invented ending digits.

Known recipient below KES 10,000: low risk. New recipient or amount at least KES 10,000: explicit review required. Amount at least KES 50,000: blocked. These are illustrative thresholds, not validated fraud models. Available balance is checked first. The visible demo code expires after 120 seconds; five incorrect attempts cancel a payment.

## Storage and boundaries

`src/app.js` implements screen rendering and interaction; `src/model.js` contains money parsing, risk rules, ledger calculations, and CSV escaping. `scripts/build.mjs` copies the four assets to `dist/`. `scripts/serve.mjs` is a loopback static server.

Demo data is stored in localStorage under `secured-payment-prototype-v1`. A tab-local session flag is stored in sessionStorage. A registered demo account uses a salted SHA-256 digest in browser storage. This is a demonstration only, not a suitable password-storage strategy for a production service. Clearing site storage removes demo accounts and records. Storage is not encrypted; use invented details and a password used nowhere else.

The UI state and balance can be changed through developer tools. There is no server-enforced identity boundary, production ledger, real MFA, actual account linking, trained fraud classifier, protected audit store, or real-time settlement. Registered personal and business accounts demonstrate different profile choices, not an administrator permission system.

## Next implementation stage

Build an authenticated server API, relational ledger with atomic posting and idempotency, provider sandbox integration, server-issued transaction-bound verification, proper password hashing, independent security checks, and controlled participant evaluation. Chapters 4 and 5 distinguish this planned architecture from the implemented browser prototype.
