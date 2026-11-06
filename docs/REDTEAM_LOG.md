# Red team log

## Judge-agent rounds

Not run. The five role judge-agent rounds in the winning-system document need that document, and it was not supplied to the build. They are listed in `docs/HANDOFF.md` as work for the next session, on the deployed URL.

## Self red team, done

| Round | What was tried | What it found | Fixed |
|---|---|---|---|
| 1 | Unit tests of the state machine against the guarantees | none | not applicable |
| 2 | End to end run on a real switch-core | Signer remarks were part of the digest and voided other signatures; a Statement of Facts version was issued as soon as one log had the critical events | yes, both |
| 3 | Probes and break campaign | Exclusive role assumed twice at the same instant; the brief's expectations about the update event, failover time and restart gap were wrong | role check added; brief corrected in FINDINGS |
| 4 | Seeded variations across the clock change | 77 false divergences in 16,498 events from the repeated local hour in Berlin | yes, the reconciler now abstains |
| 5 | Playwright at six viewports with axe | scrollable tables not keyboard focusable, a link whose name did not contain its text, invalid SVG height, a missing favicon | yes |

The next round should be run by someone other than the author, on the deployed site, with the real Slack and Telegram setup.
