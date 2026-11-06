# Rules extract

Event: Flip the Switch Hackathon (WeMakeDevs and DevTools Academy, powered by Switch). Build window 4 to 7 November 2026. Deadline 7 November 2026, 23:59 IST (19:29 WAT, 18:29 UTC). Submissions stay editable until the deadline.

## Challenge (verbatim)

"Take an AI agent you already use, Claude Code, Codex, Cursor, OpenCode and Antigravity, connect it to Slack, Teams, Discord and Telegram with Switch, and build a workflow where it gets real work done with your teammates."

"Build a workflow where an AI agent and the people in a team chat get a real task done together."

## Track 01, Best Business Workflow (verbatim)

"Build a practical workflow using Switch to help people and AI agents get work done. Open to technical and nontechnical participants, with any combination of people, agents, and rooms." Prize: USD 2,000.

## Judging (verbatim questions, weights from the event page)

| Weight | Criterion | Question judges ask |
|---|---|---|
| 30% | Use of Switch | "Is Switch central, and would the project stop working without it?" |
| 25% | Technical execution | "Does it run, and could someone clone the repo and reproduce it?" |
| 25% | Creativity and impact | "Is it a fresh idea that solves a problem a real team has?" |
| 20% | Presentation | "Do the demo video and README make clear how Switch is used?" |

Review flow: every submission is reviewed by WeMakeDevs, shortlisted by WeMakeDevs, and finalists are judged by Switch, DevTools Academy and WeMakeDevs.

## FAQ facts that bind this build

- Switch is mandatory and must be central. The README must show how it was used.
- Existing agents and libraries are fine, but the Switch setup and the workflow must be built during the hackathon (4 to 7 November 2026).
- AI coding tools are allowed. The builder must be able to explain everything.
- Multiple tracks are allowed.

## Submission form (mirrored in docs/SUBMISSION_WEMAKEDEVS.md)

Part 1, Project details
- Project title (required)
- Tracks you are submitting for (required): Best Business Workflow, Best Personal or Creative Workflow, Best Core Contribution
- Project description (required): what problem does the project solve, and who is it for
- GitHub repository or contribution (required): public repo with a README that explains how to set it up
- Demo video (required): under 3 minutes, YouTube or Loom, public or unlisted. For Tracks 1 and 2: show the agent working in a real chat with your teammates
- Live demo or deployment (optional)

Part 2, Track details (optional)
- Pull requests (Track 3 only)
- Blog post URL
- Wispr usage card image
- #HowISwitch post URL

Part 3, How you used Switch
- How did you use Switch in your project (required): which agent you connected, which platforms, what real work it does and how teammates work with it
- What did you like about Switch, and what would you improve (required): what worked, what got in the way, what you would want next

## README must cover

Which agents were connected, how the channel is set up, how to run it.

## Track 03, Best Core Contribution (entered alongside Track 01)

- Only issues in the Switch repository labelled `hackathon` count.
- One person per issue. Skip any issue already assigned or already requested by someone else.
- Get assigned before writing code: comment on the issue, tag the maintainer named on the event page, state in one or two lines how it will be solved, and wait for the assignment.
- Up to 5 pull requests open at once, each for an issue assigned to the builder.
- The pull request description links the issue with `Closes #<number>`.
- A one-time CLA is signed on the first pull request, by the builder personally.
- No low-effort pull requests. Every pull request is a real fix with tests.
- Pull requests must be open before 7 November 2026, 23:59 IST. An assigned issue with no activity for 48 hours may be reassigned.

## House style for every committed word

No emoji, no em dashes, no en dashes, no hype words. Enforced by `scripts/check-copy.mjs`.
