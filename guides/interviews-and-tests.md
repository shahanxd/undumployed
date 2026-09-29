# Interviews, Tests & Selection Rounds

> Every selection process in this repo is one of ~10 formats. Learn the format once, reuse it everywhere. Free resources first; paid ones only where nothing free is comparable. Test fees are `~approximate` and change every year; check the testing body's site.

**Jump to:** [Big Tech SWE](#1-big-tech-swe-internship--new-grad) · [Quant](#2-quant-trading--research) · [Consulting](#3-consulting) · [Research internships](#4-research-internship-sop--faculty-interview) · [Fellowships](#5-fellowship-interviews-rhodes--schwarzman--yif--chevening) · [Accelerators](#6-startup-accelerators-yc--ef) · [Standardized tests](#7-standardized-tests) · [Government internships](#8-government-internship-selection-niti--rbi--mea) · [Indian mass-hiring aptitude tests](#9-aptitude-tests-used-by-indian-mass-recruiters) · [One-page prep plans](#10-one-page-prep-plan-per-interview-type) · [SoP / personal statement](#11-writing-the-sop--personal-statement)

---

## 1. Big Tech SWE internship / new-grad

**Who uses it:** Google, Microsoft, Amazon, Adobe, Nvidia, Uber, Atlassian, Apple, Oracle, Salesforce, Cisco, Qualcomm, Samsung R&D, Flipkart, most funded startups. See [Tech companies](../internships/tech-companies.md).

**Pipeline (India intern, typical):**
1. **Resume screen**: automated + recruiter. Keywords, CGPA cut-offs (often 7.0–8.0/10 for on-campus), projects with numbers.
2. **Online Assessment (OA)**: 60–120 min, 2–4 problems on HackerRank/CodeSignal/HackerEarth or the company's platform. Google STEP/SWE: 2 problems, ~60–90 min. Amazon: 2 coding + work-style survey. Microsoft: 2–3 problems via Codility/Codesignal. Camera-proctored; plagiarism checks are real.
3. **Interviews**: usually **2 rounds of 45 min DSA** (sometimes 1 for interns, 3–4 for new-grad), and sometimes a "Googleyness"/behavioural round or a low-level design round (Amazon: Leadership Principles questions in *every* round; expect "tell me about a time you…").
4. **Hiring committee / team match** (Google) → offer.

**What the DSA rounds ask (most common first):** arrays & hashing · two pointers / sliding window · binary search · stacks · linked lists · trees (BFS/DFS, BST) · heaps · graphs (BFS/DFS, topological sort, union-find, Dijkstra) · dynamic programming (1-D, 2-D, knapsack, LIS/LCS) · tries · greedy · intervals · bit manipulation · basic math. LeetCode *medium* is the bar, with the occasional hard. Interviewers grade **communication + correctness + complexity + edge cases + clean code**, so talk while you code.

**New-grad extra:** one **system-design-lite** or **LLD/OOP** round (design a parking lot / rate limiter / URL shortener), one behavioural, OS/DBMS/networks basics ("what happens when you type a URL").

**Timelines (India):** Applications open **Aug–Oct** for the following summer; OAs within 1–3 weeks of applying; interviews Sep–Nov; offers by Dec. Off-campus new-grad drives run rolling; US summer postings appear from ~May of the prior year.

**Free prep, in order:**
- **[NeetCode 150](https://neetcode.io/practice)** (pattern-based, free video explanations) or **[Striver's A2Z DSA sheet](https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2)** (Indian favourite; 450 problems, free).
- **[LeetCode](https://leetcode.com/)** free tier: do company-tagged lists via discussion threads, and do contests every weekend for speed.
- **[CSES Problem Set](https://cses.fi/problemset/)** for graph/DP depth; **[Codeforces](https://codeforces.com/)** Div 2 A–C for speed.
- **[Tech Interview Handbook](https://www.techinterviewhandbook.org/)** (free) for behavioural + resume + process.
- **[System Design Primer (GitHub)](https://github.com/donnemartin/system-design-primer)** for new-grad design rounds.
- Mock: **[Pramp/Exponent free peer mocks](https://www.pramp.com/)**, or a friend with a timer.
- Book (optional): *Cracking the Coding Interview*.

**Reality:** 300–400 well-chosen problems over 3–4 months beats 1,500 random ones. Practise on a whiteboard/Google Doc without autocomplete at least 20 times before the real thing.

---

## 2. Quant trading / research

**Who uses it:** Jane Street, Optiver, IMC, Tower Research, DE Shaw, Quadeye, Graviton, AlphaGrep, Da Vinci, Citadel/Citadel Securities, Two Sigma, Hudson River Trading, SIG, Flow Traders, Akuna. See [Finance, quant & consulting](../internships/finance-quant-consulting.md).

**Formats by firm (typical):**
- **Jane Street** (trading/SWE intern): resume → phone screen (probability / expected value / game) → 2–3 rounds of ~45–60 min: probability puzzles, betting games with market-making ("make me a market on X"), estimation, occasionally coding for SWE. No brainteaser gotchas; they want *reasoning aloud*. **Jane Street SEE India** and their puzzles are the doorway.
- **Optiver**: first the famous **"80 in 8" mental-arithmetic test** (~80 arithmetic questions in 8 minutes, negative marking, you need ~60+ right), then a sequences/logic test, then trading-game interviews (probability, expected value, quick decisions under uncertainty) and a final onsite. Timed math is the filter.
- **IMC / Flow / Da Vinci / Akuna**: similar, with a timed numerical reasoning test, then probability and market-making games.
- **DE Shaw / Tower / Quadeye / Graviton (India)**: OA with mixed **probability + DSA + puzzles**; interviews mix algorithms (LeetCode medium–hard), probability/expected value, statistics, and (for research) linear algebra + a bit of ML. DE Shaw likes "how would you approach" open-ended problems.
- **Quant research (PhD/MS)**: stochastic calculus basics, linear regression assumptions, time-series, a coding round, a "explain your paper to a non-expert" round.

**What they ask (topics):** expected value and variance, conditional probability and Bayes, Markov chains, random walks and gambler's ruin, combinatorics, order statistics, linearity of expectation, martingale intuition, Fermi estimation ("how many ATMs in Delhi"), mental arithmetic under time, simple games (dice, coins, cards, auctions), market-making (bid/ask, adverse selection), basic options intuition for trading roles.

**Free prep:**
- **[Jane Street puzzles](https://www.janestreet.com/puzzles/)** (monthly; do the archive) and their **[tech blog](https://blog.janestreet.com/)**.
- **[Brainstellar](https://brainstellar.com/)**, a free puzzle bank with exactly the interview flavour.
- **[Zetamac arithmetic](https://arithmetic.zetamac.com/)**: a mental-math trainer. Aim for 60+ per 2-minute session before your Optiver test. Optiver publishes a practice "80 in 8" on its careers site.
- **[MIT 6.041 / 18.05 Probability (OCW)](https://ocw.mit.edu/)**: free full courses.
- Project Euler for maths + code.
- Books (paid, the standard trio): *Heard on the Street* (Crack), *A Practical Guide to Quantitative Finance Interviews* ("Green Book", Zhou), *Fifty Challenging Problems in Probability* (Mosteller, cheap Dover).
- For SWE-at-quant (HRT, Jane Street SWE, Tower): CP-level C++/OCaml/Python, systems basics (cache, latency), plus the DSA list in Section 1.

**Reality:** Codeforces ≥1800 or an olympiad medal gets you the interview; probability fluency gets you the offer. DE Shaw, Tower and Quadeye hire interns through Indian campus drives (**~Aug–Dec**) plus some rolling off-campus reqs. Jane Street doesn't hire interns into India: Indian students apply to Hong Kong or London, and SEE India is the fast track.

---

## 3. Consulting

**Who uses it:** McKinsey, BCG, Bain, Kearney, Oliver Wyman, Roland Berger, Accenture Strategy, Big 4 strategy arms, Arthur D. Little; and most "case competition"-style selections. See [Finance, quant & consulting](../internships/finance-quant-consulting.md) and [Case, business & research](../competitions/case-business-and-research.md).

**Pipeline:**
1. **Resume + cover letter** (they read the cover letter). Leadership evidence, quantified impact, spikes.
2. **Online assessment:**
   - **McKinsey Solve** (formerly PSG): a ~70-min game-based test with *Ecosystem Building* (build a sustainable food chain from species data) and *Redrock Study* (read a mini case, do calculations, answer). Some regions add a third mini-game. Scored on outcome *and* process. Required for most analyst/BA/intern applicants ⚠️ (format evolves; McKinsey's careers site has the current description).
   - **BCG**: some roles add an online test before interviews, and the format depends on the office. BCG Switzerland, for example, uses a 30-min cognitive test (numerical, verbal, logical; no tools allowed). Many offices have used **Casey**, a chatbot-led case (~25–30 min, one case: you type structured answers, do maths, give a recommendation) ⚠️ Unverified: BCG's careers site doesn't describe Casey; your test invitation says which format you'll get.
   - **Bain**: online test (SOVA-style numerical/logical + situational) on some campuses; then live cases. Bain also uses "Hirevue"-style recorded video questions in some regions.
   - **Kearney / OW / RB**: mostly straight to case interviews.
3. **Case interviews**: 2–4 rounds of ~30–45 min. Each opens with 5–10 min of "fit"/PEI ("tell me about a time you led…"; McKinsey's Personal Experience Interview is a *big* deal), then a business case, interviewer-led (McKinsey) or candidate-led (BCG/Bain). Market sizing, profitability trees, market entry, M&A, pricing, ops; mental maths without a calculator; a 60-second synthesis at the end.
4. **Partner round**: fit + a harder case + "why us".

**Free prep:**
- The firms' own practice cases, in the exact style they use: [McKinsey interview prep](https://www.mckinsey.com/careers/interviewing), [BCG interview prep](https://careers.bcg.com/global/en/case-interview-preparation), [Bain interview prep](https://www.bain.com/careers/interview-prep/).
- **[PrepLounge](https://www.preplounge.com/)** free tier for peer case partners. Do 25+ live cases with a partner; nothing else prepares you as well.
- **[IGotAnOffer](https://igotanoffer.com/blogs/mckinsey-case-interview-blog)** free articles on Solve/Casey/case maths.
- Case books from MBA clubs (free PDFs: Wharton, Kellogg, Darden casebooks). Google "casebook pdf" plus the school's name.
- Mental maths: same Zetamac trainer as quant; practise percentages, breakevens, CAGR approximations.
- Books (paid): *Case Interview Secrets* (Cheng), *Case in Point* (Cosentino). Victor Cheng's free LOMS-style videos exist on YouTube.

**Reality:** Indian campus consulting recruiting (McKinsey/BCG/Bain summer internships for penultimate-year students at IITs/BITS/SRCC/St Stephen's/Ashoka, and first-year MBAs at IIMs/ISB) runs **~Sep–Dec** through placement cells. Off-campus is hard; the most credible way in is a strong finish in a case competition open to your stage (HUL L.I.M.E. and ITC Interrobang are MBA-only; see [Case, business & research](../competitions/case-business-and-research.md)).

---

## 4. Research internship (SoP + faculty interview)

**Who uses it:** IIT/IISc summer programmes, IAS SRFP, TIFR VSRP, Mitacs, ETH SSRF, Summer@EPFL, CERN, Caltech SURF, DAAD WISE, RIKEN/OIST/UTRIP, MPI, faculty-first placements. See [Research India](../internships/research-india.md) and [Research global](../internships/research-global.md).

**Pipeline:** SoP/research statement + CV + transcript + 1–2 LoRs → shortlist → (often) a **20–40 min video call with the professor or a small panel** → offer.

**What professors ask:**
- "Walk me through a project on your CV", then they drill: *why* that method, what failed, what you'd do next. They are testing whether you did the work.
- "Which of my papers did you read, and what did you think?" You must have read at least one *recent* paper from that lab and be able to say one intelligent thing about it (a limitation, an extension, a question).
- Fundamentals from your SoP's claimed skills: if you wrote "PyTorch", expect "what is backprop / why Adam", if "MATLAB control", expect a Bode-plot question; for theory, a small derivation on a shared whiteboard.
- "What do you want to get out of this?" and "how long can you stay / do you have your college's permission (NOC)?" Practical availability matters more than you'd think.
- Sometimes: a tiny take-home (reproduce a figure, read a paper and summarise, a 1-page proposal).

**Free prep:** read the lab's last 3 papers (abstract + figures + conclusion; one in full); write a 5-line pitch for each of your projects (problem → approach → result → what you learned); review the basics of your own claimed skills; prepare 3 questions for them. See [cold-email guide](how-to-cold-email.md) for the pre-application contact and [Application Kit](application-kit.md) for SoP structure.

**Reality:** Selection is mostly *fit + evidence you can finish something*. CGPA gates (often 8.0+ for international programmes) are hard filters; below that, a strong professor letter is the only override.

---

## 5. Fellowship interviews (Rhodes / Schwarzman / YIF / Chevening)

**Who uses it:** Rhodes, Schwarzman, Gates Cambridge, Knight-Hennessy, Chevening, Fulbright, Commonwealth, Inlaks, JN Tata, YIF, Teach For India, LAMP, SBI YFI. See [Study abroad](../fellowships/study-abroad.md) and [Fellowships: India](../fellowships/india.md).

**Formats:**
- **Rhodes India**: written application (CV, personal statement ≤1,000 words, academic statement ≤450 words, **four referees**: three academic + one character) → longlist → preliminary interview (Sep–Oct, in person or by video; sometimes a semi-final) → **final interview plus a social engagement event, both in person and mandatory (Nov)**; treat the social event as part of the interview. Questions are broad and adversarial: your field, your stated purpose, current affairs, ethics, "why Oxford / what would you read". Eligibility for the 2027 Scholarship: Indian citizen (OCI/PIO cards don't count), aged 18–23 on Oct 1, 2026, or under 27 if your first degree was completed on or after Oct 1, 2025; applications ran from Jun 1 to Jul 23, 2026 (next round ~Jun 2027).
- **Schwarzman**: online application (essays: leadership essay, statement of purpose, short answers, video) → semi-finalist **regional interview (Sep–Dec)** with a panel of ~6 (business, government, academia). Expect "why China / why now", leadership stories, a current-events question and follow-ups on your essay claims.
- **Gates Cambridge / Knight-Hennessy**: Gates interviews only candidates their Cambridge department has already ranked (online panel, ~20–30 min). Knight-Hennessy runs in parallel with the Stanford department's own decision; finalists are interviewed at an in-person "Immersion Weekend" in late January. Both probe leadership, commitment to others and fit with the community.
- **Chevening / Fulbright / Commonwealth**: online application + references → **interview at the British High Commission / USIEF / nodal agency**, 20–40 min panel; questions map exactly to the essay prompts (leadership, networking, why UK/US, career plan back home). They score against a rubric. Answer the prompt literally.
- **YIF (Ashoka)**: online application (essays) → **personal interview** (and in some rounds a group discussion/written exercise). It probes curiosity, intellectual breadth, what you've *read* and why you want a liberal-arts year.
- **Teach For India / Gandhi Fellowship**: application → phone interview → **assessment centre** (group activity, problem-solving case, one-on-one; TFI adds a sample teaching lesson). **SBI YFI** is essays + interview, and new applications are paused as of 2026 ⚠️.
- **LAMP (PRS)**: application + essays → written test → panel interview (policy reasoning, current bills, writing); graduates ≤25. Read PRS's bill summaries and write a 2-page policy brief as your sample.

**What panels probe:** the *specific* claim in your personal statement (they will pick your weakest sentence); why *you* and not an equally qualified person; whether you can disagree politely under pressure; whether your plan is real (do you know the course, the professor, the institution's constraints); and general awareness (read a serious newspaper daily for 2 months before).

**Free prep:** the fellowship's own selection criteria page (they are explicit: Rhodes' four criteria, Chevening's four essays, Schwarzman's three qualities); a 90-second and a 5-minute version of your story; 10 mock panels with people *outside* your field who will interrupt; a one-page list of "things I've said in writing that I need to defend".

---

## 6. Startup accelerators (YC / EF)

**Who uses it:** Y Combinator, Entrepreneur First, Peak XV Surge, Antler, Techstars, Thiel Fellowship. See [Startups](../startups/README.md).

- **YC**: written application (short, specific questions: what are you making, why you, how far along, who are the users, what's surprising) + 1-minute founder video → **interview: ~10 minutes**, video call, 2–4 partners, rapid-fire questions with no small talk: "what do you make", "who wants it and how do you know", "how much do you charge", "why will you win", "what's the hardest thing you've built", numbers. Then a same-day yes/no. Apply on the batch deadlines (YC now runs four batches a year; late applications are read).
- **EF**: multiple rounds. Application → 30-min talent-investor call (edge, ambition, evidence) → deeper interviews → cohort offer. No idea needed; they assess *you* (technical/domain "edge", speed, evidence of drive).
- **Surge / Antler / Techstars**: pitch deck + founder interviews; Antler has multi-week cohort selection.
- **Thiel**: rolling, written + video + interviews over months; age ≤22 at application.

**Free prep:** YC's own [application guide](https://www.ycombinator.com/apply) and [interview guide](https://www.ycombinator.com/interviews); the YC Startup School course (free); build a one-page answers doc with every number you know (users, revenue, growth, CAC, retention); do 5 mock interviews where a friend cuts you off after 20 seconds per answer.

---

## 7. Standardized tests

Fees `~` as of 2025–26; check the testing body. Dates marked `~` are approximate.

| Test | What it is | Who needs it (and who dropped it) | Fee / format | Official |
|---|---|---|---|---|
| **GRE General** | Verbal + Quant + one essay, ~1 h 58 min (shortened since Sep 2023). | **Still asked for:** most US **economics** PhDs, many public-policy master's, many engineering MS programmes (esp. public US universities), some fellowships. **Optional or not accepted:** most top CS/ML PhDs since 2020 (Berkeley EECS won't accept it; MIT EECS, Stanford CS and CMU SCS don't require it); UK/Europe rarely need it. Check *each* programme page every cycle. | ~US$220–230 (~₹19,000); scores valid 5 years. | [ets.org/gre](https://www.ets.org/gre.html) |
| **TOEFL iBT** | 4 skills, adaptive, ~2 h. Scored 1–6 (half bands) since Jan 2026; a comparable 0–120 score is also reported until ~Jan 2028. | Accepted everywhere US/Canada; most UK universities; Australia (Home Affairs accepts TOEFL iBT for student visa). Typical cut-offs on the 0–120 scale: 90–100 (top US), 79–90 (most). | ~₹16,900; valid 2 years. | [ets.org/toefl](https://www.ets.org/toefl.html) |
| **IELTS Academic** | 4 skills, band 0–9. | Universal (UK, Australia, Canada, Europe, US). For UK courses below degree level the visa needs **IELTS for UKVI** (a SELT), not plain IELTS Academic; degree-level courses accept IELTS Academic or the university's own assessment. Typical bands: **6.5 overall / 6.0 each** (most master's), **7.0–7.5** (Oxbridge, top law/policy, medicine), 6.0 (many engineering MS). | ~₹18,000; valid 2 years. IELTS One Skill Retake exists. | [ielts.org](https://ielts.org/) · [IDP India](https://www.idp.com/india/ielts/) |
| **Duolingo English Test (DET)** | 1-hour adaptive online test, 10–160. | Accepted by 5,500+ institutions incl. most US universities and many UK/Canadian/European ones for **admission**; **not accepted for Australian student visas** (it isn't on Home Affairs' list of accepted tests). In the UK it only works for degree-level study where the university assesses English itself: DET isn't a UKVI SELT, so foundation and other pre-degree courses need IELTS for UKVI, PTE Academic UKVI or LanguageCert. Typical: 110–125. Cheapest and fastest, but confirm on the programme page. | ~US$70 (~₹6,000); results in ~2 days. | [englishtest.duolingo.com](https://englishtest.duolingo.com/) |
| **PTE Academic** | Computer-based, 10–90. | Widely accepted (UK SELT as **PTE Academic UKVI**, a separate booking; Australia visa; Canada). | ~₹17,000. | [pearsonpte.com](https://www.pearsonpte.com/) |
| **GMAT (Focus Edition)** | Since 2024 only the **Focus Edition**: Quant, Verbal, Data Insights; 2 h 15 min; 205–805. | MBA/MiM/MS Finance. Most Indian IIM PGPX/ISB accept GMAT or GRE; many MBA programmes now accept GRE too. Not needed for CAT-track IIM PGP. | ~US$275 test centre (~₹23,000). | [mba.com](https://www.mba.com/) |
| **CAT** | 2-hour CBT: VARC, DILR, QA; Nov. | IIM PGP + 1,000+ Indian B-schools. CAT 2026 test day: **Nov 29, 2026** (registration closed Sep 22, 2026; Next: ~Aug 2027 for CAT 2027). | ₹2,700 general / ₹1,350 SC/ST/PwBD (2026). | [iimcat.ac.in](https://iimcat.ac.in/) |
| **GATE** | 3-hour CBT per paper; Feb. **GATE 2027** (organised by IIT Madras): exams **Feb 6–7, 13–14 and 20–21, 2027**; registration closes **Oct 5, 2026** (with late fee **Oct 12, 2026**); results **Mar 19, 2027**. | **Uses:** IIT/IISc/NIT M.Tech/MS admissions and the ₹12,400/month M.Tech stipend; **PSU recruitment** (IOCL, NTPC, PGCIL, BHEL, GAIL, HPCL, ONGC, NPCIL…); **BARC OCES/DGFS** (GATE score *or* BARC's own online exam); **DRDO Scientist B** (RAC, via GATE score in several cycles); ISRO runs its own exam; **PMRF**: first get admitted to a PhD at a PMRF-granting institute; graduates of IITs/IISc/NITs/IISERs/IIEST/central IIITs need CGPA 8.0+, graduates of other institutions also need a GATE score of 650+ (or a CSIR/UGC-JRF rank ≤100, or an NBHM fellowship); new admissions are paused until the ministry sanctions more seats (pmrf.in, Sep 2026); some CSIR labs' JRF-GATE fellowships use GATE; PhD fellowships with a valid GATE score pay ₹37,000/month (₹42,000 from year 3). Score valid for 3 years. | ₹1,000 (female/SC/ST/PwD) / ₹2,000 per paper; ₹500 more in the late-fee window. | [gate2027.iitm.ac.in](https://gate2027.iitm.ac.in/) (organiser rotates yearly) |
| **UGC-NET (NTA)** | June + December cycles; Paper 1 (teaching/research aptitude) + Paper 2 (subject). | **JRF** (₹37,000/month for 2 years, then SRF ₹42,000) and Assistant Professor eligibility in humanities, social sciences, commerce, languages, computer science (some). Also a PhD admission route since 2024 (NET score used by universities). | ~₹1,150 general. | [ugcnet.nta.ac.in](https://ugcnet.nta.ac.in/) |
| **CSIR-NET (NTA)** | June + December; Life/Chemical/Earth/Mathematical/Physical sciences. | JRF (₹37,000/month) + Lectureship for sciences; the standard route into CSIR/IISc/IISER/TIFR-type PhD stipends. | ~₹1,150 general. | [csirnet.nta.ac.in](https://csirnet.nta.ac.in/) |
| **JEST / TIFR GS / IIT JAM / NBHM** | Physics/maths/bio entrance tests on different calendars: JAM registration ~Sep–Oct for a Feb exam; TIFR GS exam ~Dec; JEST applications ~Feb–Mar for an Apr exam ⚠️. | PhD/integrated PhD at TIFR, IISc, IISERs, IUCAA, RRI; JAM for IIT MSc; NBHM for maths scholarships/PhD. | JAM ₹2,000 for one paper (₹1,000 female/SC/ST/PwD); JEST ₹1,200 (₹600 SC/ST/PwD). | [jest.org.in](https://www.jest.org.in/) · [univ.tifr.res.in](https://univ.tifr.res.in/) · [jam.iitm.ac.in](https://jam.iitm.ac.in/) |
| **SAT / ACT** | US undergrad. | Many US colleges are still test-optional, but **MIT, Harvard, Yale, Dartmouth, Brown, Caltech and Stanford require the SAT or ACT**; check each (Harvard takes IB/A-level/national board results only when the SAT/ACT isn't accessible; Dartmouth gives students schooled outside the US other ways to meet its requirement). | ~US$120 incl. international fee. | [collegeboard.org](https://satsuite.collegeboard.org/) |

**Which English test?** If applying only to the US/Canada: DET or TOEFL (cheapest and fastest). UK/Australia/Europe or any visa-linked requirement: IELTS Academic (safest), or IELTS for UKVI when a UK visa needs a SELT. Take it *once*, well, 3–6 months before your first deadline, which leaves time for a retake if you need one; scores last 2 years, so check they will still be valid at the visa stage.

---

## 8. Government internship selection (NITI / RBI / MEA)

See [Government & non-tech](../internships/government-and-non-tech.md) for entries and deadlines.

| Programme | How they screen (typical) | What helps |
|---|---|---|
| **NITI Aayog Internship** | Online portal; apply between the **1st and 10th of each month**, 2–6 months before the month you want to start; one application per financial year. Screening is on paper: UG students need **85%+ in class 12** and two completed years of the degree; PG/PhD students and fresh graduates awaiting higher-studies admission need **70%+ in graduation**. You choose one area of interest and verticals pick from the pool; no interview in most cases. Unpaid, 6 weeks–6 months. | A one-paragraph statement naming a *specific* vertical (e.g., "Data Management & Analysis", "Health", "Frontier Tech") and a relevant writing/analysis sample; university NOC ready. |
| **RBI Summer Internship** | Penultimate-year PG students (economics, econometrics, finance, banking, management, statistics, commerce, law) and law undergraduates, from any institution. Applications **~Oct–Dec** on the RBI Opportunities portal for Apr–Jul internships ⚠️; up to 125 interns. Screening on marks, CV and a short SoP, sometimes an interview. Stipend paid. | Econometrics/finance coursework, a data project, and your NOC ready before the call opens. Graduates heading for a PhD: the separate Research Internship takes applications Jul–Nov and Jan–May. |
| **MEA Internship** | Two terms a year: Term I (Apr–Sep; call ~Dec–Feb) and Term II (Oct–Mar; call ~Jul–Sep); each intern serves 1–3 months, **max 30 interns per term**, and your home state/UT decides which term you can apply in. Apply on [internship.mea.gov.in](https://internship.mea.gov.in/); state-wise merit lists on class 12 + graduation marks, then a **video interview**. Graduates (or final-year UG where the curriculum requires an internship), age ≤25 on Dec 31 of the internship year; ₹10,000/month + one return economy airfare. 2026-27 Term II applications close **Oct 5, 2026**. | Reading the MEA annual report and one bilateral relationship in depth; languages; policy writing sample. |
| **Ministry / PSU / AICTE-portal internships** | Mostly document-based: academic record + NOC + short statement; some (DST, MeitY, Ministry of Finance) hold short interviews. | Apply early in the window (many are first-come); follow the format exactly (they reject on missing NOC). |
| **ISRO / DRDO / BARC student internships** | Institution-routed (college writes to the centre) or open advertisement; selection on CGPA + branch + project fit; **NOC mandatory**; some centres interview. BARC OCES uses GATE score / own exam + interview for the *training school*, not for short internships. | NOC in hand before applying (2 weeks), a specific centre + lab named in the request. |

---

## 9. Aptitude tests used by Indian mass recruiters

The off-campus safety net. Each runs 1–2 big cycles a year (typically Aug–Feb) and accepts graduates up to ~2 years out.

| Test | Structure (typical) | Notes |
|---|---|---|
| **TCS NQT** (Ninja / Digital / Prime) | Foundation: numerical, verbal, reasoning (~75 min) + Advanced: coding (2 problems) + advanced reasoning/quant. Adaptive in recent cycles. | Digital/Prime need the advanced section + interview; a good **TCS CodeVita** rank (rounds ~Nov–Jan; register before Round 1) gives a direct interview for Digital/Prime. [tcs.com/careers/india](https://www.tcs.com/careers/india) |
| **Infosys** (SP / DSE / Power Programmer) | **HackWithInfy** (registration ~Jan–Mar) for Specialist Programmer / Power Programmer / DSE roles; otherwise an online test: reasoning, verbal, pseudo-code, puzzles, + coding (DSE). | HackWithInfy beats the plain test in outcome. [infosys.com/careers](https://www.infosys.com/careers/) |
| **Wipro Elite NTH / Turbo** | Aptitude (quant, logical, verbal) + written communication (essay) + 2 coding problems + interview. | "Turbo" needs harder coding. [careers.wipro.com](https://careers.wipro.com/) |
| **Accenture** | Cognitive & technical assessment (verbal, numerical, reasoning, pseudo-code, networking/cloud MCQs) + coding (2) + communication (Cappfinity/Versant style) + interview. | Sections gate each other; communication section trips people. [accenture.com/in-en/careers](https://www.accenture.com/in-en/careers) |
| **Capgemini** | Game-based aptitude (Pymetrics-style), technical MCQ, English communication, pseudo-code; then interview. | |
| **Cognizant GenC / GenC Next** | Aptitude + coding (Next has harder DSA) + interview. | |
| **Deloitte / EY / KPMG (tech tracks)** | Aptitude + versant + technical + interview; Big 4 consulting tracks use case-lite. | |
| **HackerRank/HackerEarth/CoCubes/AMCAT/eLitmus** | Third-party aptitude+coding tests that many mid-size firms buy. | AMCAT/eLitmus scores are shareable across companies. |

**Free prep:** IndiaBIX and PrepInsta free sections for quant/reasoning patterns; GfG "company-wise" practice; one DSA sheet (Section 1) covers the coding parts; practise the essay/communication section aloud with a timer.

---

## 10. One-page prep plan per interview type

| Type | Weeks needed | Daily core (1–2 h) | Weekly | Do before the day | Ready when… |
|---|---|---|---|---|---|
| **Big Tech SWE intern** | 12–16 | 2 LeetCode mediums (NeetCode 150 / Striver A2Z order) with complexity written out | 1 timed contest (LC weekly or CF Div 2); 1 mock on a blank doc | Re-read your resume projects; 5 STAR stories; sleep | 150+ mediums done twice; <25 min per medium; can narrate while coding |
| **Big Tech new-grad** | 16–20 | Same + 30 min OS/DBMS/networks + 30 min system design primer | 1 design mock (URL shortener, rate limiter, chat) | LLD of one system on paper; behavioural stories mapped to Amazon LPs | Above + can whiteboard a design end-to-end in 35 min |
| **Quant trading** | 10–12 | 20 min Zetamac; 3 probability problems (Brainstellar/Green Book); 1 Jane Street puzzle/week | 1 mock "make me a market" session; 1 timed numerical test | Rest; no caffeine crash; practise quoting two-sided markets aloud ("40 bid, 45 offered") | Zetamac 60+/2 min; solve gambler's-ruin/Markov/expected-value problems cold; can talk through a bet you'd take |
| **Quant research / SWE-at-quant** | 12–16 | Same probability + LeetCode hard + linear algebra/statistics review | CF Div 1 A–B; re-derive OLS, MLE, CLT | Explain your paper/project in 3 minutes | CF ≥1800-level comfort; can derive and code a Kalman/regression from scratch |
| **Consulting** | 8–10 | 1 case (alternate interviewer-led / candidate-led) with a partner on PrepLounge; 15 min mental maths | McKinsey Solve / BCG Casey practice run; 3 PEI stories refined | Read that week's business news; prep 3 industries | 25+ live cases; frameworks *not* recited; 60-second synthesis natural |
| **Research internship** | 3–4 | Read 1 lab paper/day (abstract, figures, conclusion); write 5-line pitches of your projects | Mock interview with a senior/PhD; revise fundamentals in claimed skills | Prepare 3 questions for the PI; check NOC/dates | Can explain one of their papers *and* your best project without notes |
| **Fellowship panel** | 6–8 | 30 min serious newspaper; 30 min defending one paragraph of your statement aloud | 2 mock panels with non-experts who interrupt | Re-read your application; know the course/college you named | You can disagree with a panellist calmly and give a 90-second "why me" |
| **YC / accelerator** | 2–3 | Update the numbers doc; 20 rapid-fire Q&A reps | 1 mock 10-min interview, timed, hostile | Demo works offline; every number memorised | Every answer ≤20 s; no answer starts with "so basically" |
| **Government internship** | 1–2 | Read the scheme document; assemble NOC, transcripts, statement | n/a | Apply on day 1 of the window | Documents in the exact format the portal asks |
| **Mass-recruiter aptitude** | 4–6 | 40 min quant/reasoning sets; 1 coding problem; 10 min timed essay | Full-length mock | Check exam system requirements (webcam, browser) | 80%+ on timed mocks; coding problems in 20 min |

---

## 11. Writing the SoP / personal statement

[Application Kit](application-kit.md) has the structure and the mistakes. Three additions that matter for *interviews*:

1. **Every sentence in your SoP is a question you will be asked.** Don't claim "deep expertise in reinforcement learning" if you can't derive the Bellman equation on a call. Write only what you'd enjoy defending.
2. **Research SoP ≠ fellowship personal statement.** Research: problem → what you did → what you'd do in *their* lab → why them. Fellowship: who you are → evidence (not adjectives) → what you'll do with the fellowship → why it needs *this* fellowship. One is about the problem; the other is about you. Don't swap.
3. **The interview starts from your weakest paragraph.** Have a senior read your statement and mark the sentence they'd attack. Fix it, or prepare for it.

Word limits are hard limits. Referee letters should echo one concrete story from your statement, so send referees your draft ([Application Kit](application-kit.md) → LoR section).

---

*See also: [Application Kit](application-kit.md) · [Cold-email guide](how-to-cold-email.md) · [Timeline by year](timeline-by-year.md) · [Visas for an Indian passport](visas-for-indian-passport.md)*

*[← Back to README](../README.md)*

*Last verified: September 2026. Deadlines shift, so always confirm on the official site before applying.*
