# Thesis

## One sentence

HAWSER is the most practical way for a ship's master, a port agent and a charterer, together with their three AI agents, to get one Statement of Facts done and signed in the chat they already use, in one Switch room that three companies can share without trusting each other.

## Five-line pitch

- NAME: HAWSER, the mooring line that makes a ship fast to the shore.
- MOMENT: Captain Rui Antunes (fictional), master of the bulk carrier MV Saltmarsh Grace, tenders Notice of Readiness off Brake, Germany at 16:41 on a Friday. The charterer's operator in Singapore replies "noted". The port agent writes 16:50 on his own sheet. Under a clause like "laytime commences 0800 the next working day after valid NOR" and a demurrage rate like USD 12,500 per day, the gap between those records decides who pays for the weekend.
- ACTION: HAWSER puts the three companies' agents in one Switch room. Each company's log lives in a room document only its own agent can write. A deterministic Timekeeper prices every disagreement the moment it appears, asks the one human who can settle it, and produces the Statement of Facts and laytime time sheet that all three people sign in chat before the ship sails.
- DISCOVERY: Everyone assumes a chat thread is a record. In reality a casual "noted" can later be argued as acceptance of a notice, and a shared document can be rewritten by its own author with nobody told.
- PROOF: Scenario replays shaped on published disputes, the laytime engine checked against external worked examples, a break campaign run on the live Switch server, all numbers generated into FACTS.json.

## Twenty second hook (corrected against the judgment, see docs/MOMENT.md)

"Friday, 16:41, off the port of Brake. The captain sends Notice of Readiness. The charterer answers 'noted'. The agent writes ten minutes later in his own book. In April 2026 an English court removed about 840 thousand dollars of demurrage at Brake from an arbitration award, because the notice had been tendered before the ship had arrived and the court found no valid basis for treating that as waived. HAWSER is one Switch room where three companies and their agents agree every minute in port, and sign it, before the ship sails."

## Primary guarantee

No time enters the signed Statement of Facts unless the party it binds saw it and said yes, and no casual reply can ever count as accepting a Notice of Readiness.

## X without Y

One agreed port record across three companies, without any company handing its agent, its log or its keys to another.

## Working principle

Agents read and explain. The Timekeeper counts. People sign.

## What HAWSER will not do

- It will not let a model state a money figure or a legal conclusion.
- It will not present the engine's reading of a Notice of Readiness as final. Where validity is in question, both scenarios are shown.
- It will not place a time that carries no zone. It asks once.
