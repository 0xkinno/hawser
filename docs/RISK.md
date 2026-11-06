# Risk

## Money

- One minute at USD 12,500 a day is 868.06 cents. All amounts are integer cents. Division rounds half up to the cent, stated once in `packages/laytime/src/money.ts`.
- Money at stake for a disagreement is the difference between the net demurrage of the earliest claim and of the latest claim, each rounded to the cent. It can differ by one cent from the exact figure: 30 minutes at USD 12,500 a day is USD 260.4167 and the card says USD 260.41. This is the difference between two settlements that would each be paid in cents.
- Despatch is on a "laytime saved" basis at the despatch rate given. Other bases are not modelled.
- Only the counter states money. A model, a person or an agent that pairs a currency amount with demurrage, despatch or laytime gets a correction card.

## What the counter refuses

It counts nothing when the notice is read as invalid and no one has explicitly accepted it. It counts nothing when the notice or the completion is missing. It never places a time without a zone, or a wall-clock time that names no single instant. An unpaired stoppage is an error, not a guess.

The counter's reading of a notice is its reading of the stated terms. It is not a legal conclusion. Where validity is in question the time sheet shows both readings, and the legal call is left to the parties and counsel.

## What is not modelled

See `packages/laytime/NOT_MODELLED.md`. The main items: "unless used" wording, reversible laytime, shifting time, laytime derived from cargo quantity, and waiver or estoppel.

## Operational risks

| Risk | Handling |
|---|---|
| A crashed Timekeeper holds its role for about 30 seconds | Measured, published. A graceful stop releases the role at once |
| Two Timekeepers assumed the role at the same instant | Roster check after `assume_role` |
| Switch keeps no document history | Fingerprint of every revision posted into the room |
| A hosting stop of the Codespace stops the server and agents | `docs/RUN_REMOTE_HOST.md` step 8: restart order |
| Agents are owner-only by default and people get refusals | Addressing set per company with `scripts/set-addressing.ts` |
| A document created by another agent under a company log's name | The Timekeeper checks who created each log and ignores a log from the wrong author |
| Name based enrolment can be spoofed by a display name | Enrolment stores the stable sender id; `name:` entries are for tests and should be replaced by ids for a real call |
| The data in this repository is fictional | Stated on every page that shows it |
