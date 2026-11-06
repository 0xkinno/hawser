# Submission text

Mirrors the WeMakeDevs form for the Flip the Switch hackathon. Fields marked TODO need something only the builder has. Do not submit before the checklist in `docs/HANDOFF.md` is done. Every claim here has a row in `docs/EVIDENCE.md`.

## Part 1, Project details

**Project title:** HAWSER

**Tracks you are submitting for:** Best Business Workflow. Also Best Core Contribution if a pull request to the Switch repository is open and linked.

**Project description:** A port call is a team of three companies: the ship's master, the port agent and the charterer. Each keeps its own record of the same minutes, and who pays thousands of dollars a day of demurrage depends on which record wins weeks later. HAWSER puts the three people and their three AI agents in one Switch room. Each company's agent keeps only its own log, which Switch lets no other agent change. A Timekeeper agent with no model prices every disagreement the moment it appears, asks the one person who can settle it, never treats a casual "noted" as acceptance, and produces the Statement of Facts that all three sign in Slack and Telegram before the ship sails. For ship operators, port agents and charterers' operations teams.

**GitHub repository or contribution:** https://github.com/0xkinno/hawser (make the repository public first). If Track 3 is entered too, confirm with the organisers on the WeMakeDevs Discord which link goes in this field. Default if there is no answer: the HAWSER repository here and every pull request listed under Part 2.

**Demo video:** TODO. Under 3 minutes, YouTube or Loom, unlisted is fine. The script is in `docs/HANDOFF.md`. For Track 1 it must show the agents working in a real chat with teammates. The recorded run in this repository used simulated people and says so; the video needs the real Slack and Telegram call.

**Live demo or deployment (optional):** the Vercel URL in `docs/HANDOFF.md`.

## Part 2, Track details (optional)

**Pull requests (Track 3 only):** TODO, up to 10 links, only after they exist.

**Blog post URL:** TODO. Draft in `docs/BLOG.md`.

**Wispr usage card image:** only if the build was dictated with Wispr Flow. It was not.

**#HowISwitch post URL:** TODO. Draft text in `docs/BLOG.md`.

## Part 3, How you used Switch

**How did you use Switch in your project?**

Agents connected, and who owns them: `ship-mate` (Claude Code, owned by the shipowner's Switch user), `agency-clerk` and `charter-desk` (OpenCode, owned by the agency's and the charterer's users), and `timekeeper-a` and `timekeeper-b`, our own protocol client with no model, owned by a service user. Three companies, three owners, no shared keys.

Platforms: a Slack desk room for the port agent and the charterer, and a Telegram bridge room for the master, joined by a labelled link, so the master's raw chat stays in his room and only confirmed times cross.

What Switch does that nothing else here could: each company's log is a room document that only its own agent can write (observed: an edit by another agent is refused with HTTP 403); the charter terms are a template document written by a person, so no agent can edit them; the Timekeeper holds an exclusive role with a standby that takes over (observed: median 21.9 s after a crash, identical digest each time); each agent answers only its owner and everyone else gets Switch's visible refusal.

The Timekeeper speaks the WebSocket at `/connection/ws` directly, with a saved connection id and cursor, and rebuilds its whole state from the room on start, so a restart or a failover repeats nothing.

What teammates do: the master photographs the deck log page and signs, the port agent confirms what he sees on the quay and signs, the charterer's manager decides the Notice of Readiness with an exact phrase and signs. What is recorded and what is simulated is stated in the README.

**What did you like about Switch, and what would you improve?**

1. Liked: ownership and addressing made a three-company room possible with no custom authentication; authorship on room documents is enforced by the server, not by convention; templates per account; Telegram connecting outwards with nothing public.
2. Improve: room documents keep no revision history, and an update posts a one line notice that does not say what changed, so other members cannot see what a company rewrote. We anchor a fingerprint of every revision in the room ourselves.
3. Improve: the published agent protocol page describes SSE and a 2 second beat, while the live transport is the WebSocket with a 10 second server ping. A client written from the page lands on the compatibility path.
4. Improve: a crashed role holder keeps an exclusive role for about 25 to 30 seconds, because the connection outlives its socket until 30 s without a heartbeat. A way to shorten that for a role would help a standby.
5. Improve: two agents calling `assume_role` for the same unused role at the same instant both got success. The loser only learned from a lease renewal half a second later.
6. Improve: event ids sit near the limit of a JavaScript number (about 9.007e15) and cross it after a server restart. Clients should treat them as strings.
7. Next wish: per-room signed acknowledgements as a Switch primitive.

Full list with dates and the server each result came from: `docs/FINDINGS.md`.

## Track 3 note

TODO until pull requests exist. Never write that a pull request is merged unless it is.
