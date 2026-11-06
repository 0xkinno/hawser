# Blog draft

For the Best Blog side entry. Publish only after the builder has read it. Every number is in `docs/FACTS.json` and every claim in `docs/EVIDENCE.md`.

---

**Three companies, one chat thread, and a notice that nobody accepted**

On a Friday at 16:41, the master of a bulk carrier off a German port sends a Notice of Readiness. The charterer's operator, six hours ahead, answers "noted". The port agent writes 16:50 in his own book. Under a clause like "laytime commences 0800 the next working day after valid NOR" and a demurrage rate of USD 12,500 a day, the gap between those three records decides who pays for the weekend.

This is not a made-up risk. In April 2026 the English High Court removed about USD 840,000 of discharge port demurrage at Brake from an arbitration award because the notice had been tendered before the ship had arrived, and the court found no valid basis for treating that as waived. The Statement of Facts in that case said the ship anchored at 1100. The ship's own log said 1450.

I built HAWSER for the hackathon on Switch. The idea is small: put the three people and their three agents in one Switch room, and let the room do what a chat thread cannot.

**Each company keeps its own log, and nobody else can touch it.** Switch lets an agent change only a room document it created. I used that as the trust model: the shipowner's agent writes the vessel log, the agency's agent the agency log, the charterer's agent the charterer log. When I tried to have one agent edit another's log, the server refused with a 403. That refusal is Switch's, not mine.

**One agent has no model.** The Timekeeper reads the three logs, converts every time to UTC, and prices every disagreement in money the moment it appears. It asks only the one person a fact binds. It speaks Switch's WebSocket directly and every output is reproducible. Models read and explain; the Timekeeper counts; people sign.

**A casual "noted" is never an acceptance.** The Timekeeper records it as received, not accepted, and tells the charterer the exact phrase that does count, bound to a digest of the exact version.

**What I got wrong, and what testing caught.** I planned for a silent rewrite of a log to emit no event. Switch actually posts a one line notice saying a document was updated, without saying what changed, and keeps no history. So the Timekeeper keeps a fingerprint of every revision and uses the notice to re-read at once: a rewrite after signing is detected in about two seconds and voids the signatures. I expected a crashed clock to be replaced in a few seconds. Measured, it takes about 22 seconds, because a dead connection keeps its role for 30 seconds. A test with generated times caught a real defect in my own code: when clocks go back in Berlin, one hour of local time happens twice, and my first version guessed which one. It produced 77 false disagreements in 16,498 generated events. It now asks for the offset instead of guessing.

The laytime counter reproduces 15 of 16 published worked examples. The one it does not is a clause I do not model, and I say so.

The people in the recorded run are stand-in agents, and the pages say so. A recorded call with people in Slack and Telegram is the next step.

Code: https://github.com/0xkinno/hawser

---

## #HowISwitch post

Built HAWSER on @SwitchAgents: a ship's master, a port agent and a charterer, and their three AI agents, in one Switch room. Each company's log is a document only its own agent can write. A Timekeeper with no model prices every disagreement. "Noted" never counts as accepting a Notice of Readiness. Three signatures on one digest before the ship sails. https://github.com/0xkinno/hawser #HowISwitch

(Check the handle and hashtag against the event page before posting.)
