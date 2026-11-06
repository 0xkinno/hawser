# The person, the moment, the money

All people, companies and vessels in HAWSER scenarios are fictional and labelled so wherever they appear. No real charter, vessel or crew is implied.

## Persona and cast (fictional)

| Person | Company | Where | Surface | Physical or legal role |
|---|---|---|---|---|
| Captain Rui Antunes, master | Saltmarsh Shipping (fictional shipowner) | On board, off Brake | Telegram over the ship's VSAT | Eyes and signature: photographs the deck log page and bridge clock, signs the Statement of Facts with remarks or under protest |
| Jonas Weber, port agent | Weserkai Agency (fictional port agency) | On the quay in Brake | Slack | Eyes on the quay and author of the Statement of Facts draft: confirms all fast, hatches open, completion; signs |
| Priya Nair, operations manager | Kestrel Grain (fictional charterer) | Singapore, 6 hours ahead | Slack | Legal decision: accepts, accepts without prejudice, or rejects the Notice of Readiness; signs |

## The moment, with a clock

Friday 16:41 Brake time. The Notice of Readiness (NOR) window under the charter closes at 17:00. If the NOR is valid and explicitly accepted, laytime starts at 08:00 on the next working day. If not, it may never start, and the weekend sits on the owner's side. Three people in three companies and three time zones each write the same events in their own book, in WhatsApp, in email and in spreadsheets. The Statement of Facts is compiled after the fact and signed in a hurry before sailing. Disputes surface weeks later at the claims desk.

## What is true, and where it comes from

Each row was opened on 6 November 2026. The judgment text is cited and a few facts are transcribed with paragraph numbers. It is not copied into this repository: the National Archives page carries a `noai` robots tag.

| What is true | Source | Checked |
|---|---|---|
| In Trans Trade RK SA v Sebat Shipping and Trading Company [2026] EWHC 950 (Comm), judgment handed down 28 April 2026 by Peter MacDonald Eggers KC (sitting as a Deputy Judge), the arbitration tribunal had upheld owners' demurrage of US$844,131.25. Para 4 splits it as US$4,114.06 at the load port (Constanta) and US$840,017.19 at the discharge port (Brake). | https://caselaw.nationalarchives.gov.uk/ewhc/comm/2026/950, para 4 | Yes |
| At Brake the master tendered NOR at the pilot station. The vessel then anchored at 1100 (per the Brake Statement of Facts) or at 1450 at an anchorage (per the vessel's log). Because NOR was tendered before the vessel was an arrived ship, the tribunal held the NOR invalid. No further NOR was tendered at Brake. | same, paras 11 and 12, and para 61 as quoted | Yes |
| The charterparty recap quoted in the judgment: NOR to be tendered Monday to Friday 0800 to 1700 hrs at load port and discharge port; at discharge ports "laytime shall commence at 0800 hours the next working day after presentation of valid n.o.r."; demurrage USD 12,500 per day pro rata. | same, charterparty recap | Yes |
| The court held that the tribunal erred in law in concluding that laytime began on the commencement of cargo operations although the NOR was invalid when tendered (para 85). It found no principle of "deemed waiver" that differs from actual waiver, whose conditions are set out in The Happy Day (para 86). | same, paras 85 and 86 | Yes |
| The award was varied (paras 98 and 104) so that owners' claims succeed in US$4,114.06 and about EUR 21,616 "and no more". The discharge-port demurrage of about US$840,000 at Brake did not survive. Costs of the arbitration were remitted to the tribunal. | same, paras 98 and 104 | Yes |
| Charter wording often makes demurrage payable against a Statement of Facts. In High Seas Venture Ltd Partnership v Sinom (Hong Kong) Ltd [2007] EWHC 673 (Comm) the clause read that demurrage and dispatch are calculated "on the basis of the statement of facts made by Agents ... and mutually confirmed by Master and ... PORT AUTHORITIES", and owners alleged the Statement of Facts was wrong. | https://caselaw.nationalarchives.gov.uk/ewhc/comm/2007/673 | Yes |
| A bulk carrier arrives at Paranagua on a Saturday at 08:00, tenders NOR on arrival, and laytime does not start counting until Monday at 08:00, leaving two days on the owner's side. | https://maritime-executive.com/article/the-hidden-clause-contradictions-driving-demurrage-claims (2026-05-31) | Yes |
| A single miscategorised six-hour weather event at USD 20,000 per day changes a claim by USD 5,000. | https://www.voyagerportal.com/the-basics-of-demurrage-a-guide-for-commodity-traders/ | Yes |
| The Statement of Facts should be factual, chronological and precise. Phrases such as "morning", "about noon" or "after rain" should be avoided because laytime disputes often turn on exact times. | https://www.handybulk.com/what-is-laytime/ | Yes |
| Vendor claim, labelled as such: over half of demurrage disputes stem from preventable issues such as missed stoppages, incorrect NOR interpretation or inconsistent charter party application. | https://marcura.com/roi-calculator | Yes |
| A US case in which the time the NOR was issued was a live factual dispute, demurrage USD 20,000 per day: Teras Chartering v Hyupjin Shipping (W.D. Wash. 2017). | https://law.justia.com/cases/federal/district-courts/washington/wawdce/2:2016cv00188/227000/62 | No. The page returned HTTP 403 to automated access. Open it by hand before citing the 7:18 a.m. and USD 20,000 details. Until then, scenario S4 is described as "shaped on a published NOR time dispute" without those figures. |

## Corrections to the earlier hook wording

The first draft of the 20-second hook said an English court cut an owner's demurrage award "at this very port from about 844 thousand dollars to about 4 thousand". The judgment does not say that. The US$844,131.25 award covered two ports, and the US$4,114.06 that survived is the load port (Constanta) claim. What the court removed is about US$840,000 of discharge-port demurrage at Brake. The corrected hook is in `docs/THESIS.md`.

The draft also described the invalidity as a notice given outside the window. In the judgment the NOR was invalid because it was tendered before the vessel was an arrived ship. The Friday 17:00 window in the HAWSER scenario is our own fictional charter term, not a fact from the case.

## The money figure used in tests

At USD 12,500 per day, one minute is 12500 * 100 / 1440 = 868.06 cents. 3 h 50 min of disputed counting time is 230 minutes, which is USD 1,996.53 after rounding half-up to the cent. This is asserted in `packages/laytime/test/money.test.ts` when the engine is built.

## Founder stake and practitioner

Kinnoski is pursuing STCW maritime certification. One seafarer, port agent or chartering contact is to be approached for a ten minute call or written answers to three questions: how is the Statement of Facts compiled today, what goes wrong, and would a shared room with signatures be accepted.

Practitioner log (never invented):

| Date | Name or role | Scope | Outcome |
|---|---|---|---|
| not yet contacted | | | |
