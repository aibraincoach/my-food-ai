# Source article — preserved separately from recommendations

Title: Alexandr Wang Shipped Meta's Muse in 7 Months With Under 200 People. Here Is the Scorecard That Said Ship.
Author: Ruben Dominguez, The AI Corner. Published November 10, 2026 (publisher page).
Requested: https://open.substack.com/pub/theaicorner1/p/meta-muse-alexandr-wang-interview?r=27hnlw&utm_medium=ios
Canonical: https://www.the-ai-corner.com/p/meta-muse-alexandr-wang-interview
Retrieved: 2026-11-12T05:24:15.044690+00:00
Method: public HTTP response; entire `body markup` extracted with inline links, all ten lessons, scorecard prompt, FAQ and related-reading sections. Navigation/comments excluded. Raw HTML retained in the companion vault capture. Markdown is a formatting conversion, not a facsimile.

**Evidence boundary:** This is the author's secondary account of a Wang/Senra interview, not our verified interview transcript. The linked video is https://www.youtube.com/watch?v=S6l3aRsecuE and has not been independently watched/transcribed for this handoff. The 100+ rows, seven months, headcounts and anecdotes are attributed claims. The sample thresholds and 40-row Claude prompt are the article author's illustrations, not demonstrated Meta internal policy. No actual Meta scorecard is supplied.

---

Meta shipped Muse 7 months after its first prototype, with fewer than 200 people and a spreadsheet of 100+ rows deciding when it could launch.

One of Alexandr Wang’s first acts with [OpenClaw](https://www.the-ai-corner.com/p/openclaw-peter-steinberger-viral-growth) was a psychoanalysis prompt Nat Friedman had written, run against Wang’s own email and photos. He calls it “the equivalent of 3 years of therapy compressed into this one moment.” That was February, and 7 months later Meta shipped [Muse](https://www.the-ai-corner.com/p/meta-muse-ai-agent-zuckerberg).

Wang spent 9 years building Scale AI before Mark Zuckerberg called. This interview covers what came next: the prototype, the launch gate, the meme account and the org chart holding it up.

Wang now runs Meta Superintelligence Labs, which he describes as a refounding of Meta’s AI lab, after Meta bought 49% of Scale AI. In his interview with David Senra, he walks through how that lab built Muse, a personal agent aimed at the things people want to do rather than work or coding.

I watched the full interview and pulled out the 10 lessons founders and investors can use this week, plus a launch scorecard template and a Claude prompt to build your own.

## 1. The Muse Prototype Took 1 to 2 Weeks. Making It Reliable Took 7 Months (The Demo Trap)

Wang’s team built the magic in 1 to 2 weeks. The reliability took the other 7 months.

Taking this prototype where it sometimes worked and was magical, but most of the time didn’t work and would constantly break, and going from there to something that would be highly reliable.

In February, Wang and Friedman each wrote memos that went up to the Meta board, and a prototype followed within 1 to 2 weeks. Much of the final product was already in that first demo, including the Jolly mascot and an early version of the Muse Charm. The launch came 7 months after that.

Writing that kind of memo for your own board? The [McKinsey Pyramid Principle wired into Claude](https://www.thevccorner.com/p/mckinsey-pyramid-principle-claude-investor-documents-2026) structures it the way consultants do, and the [board meeting operating system](https://www.thevccorner.com/p/board-meeting-operating-system-2026) covers what happens after you send it.

OpenClaw shows the other ending. Wang says its wave peaked and faded because people got magic moments while most of the rest broke, and he still calls [Peter Steinberger](https://www.the-ai-corner.com/p/openai-openclaw-peter-steinberger-lessons) a visionary.

Wang’s description of what Meta added is deliberately dull: “sanding out all of the details” of the model and the product together. Budget the second half before you celebrate the first.

Taking your own agent past the demo? Start here:

- 

[3 Founders Shipped Claude Managed Agents to Production in 2 Weeks. Here’s the Playbook](https://www.the-ai-corner.com/p/managed-ai-agents-playbook)

- 

[Stop Blaming the Model. Fix the Architecture](https://www.the-ai-corner.com/p/ai-agent-reliability-playbook)

- 

[The 6 decisions that turn an AI agent into a worker you can leave alone](https://www.the-ai-corner.com/p/the-harness-is-the-product-6-decisions)

- 

[The AI code review checklist: 8 failure modes and 12 prompts](https://www.the-ai-corner.com/p/ai-code-review-checklist-2026-failure-modes-prompts)

## 2. Everyone Crowded Coding Agents. Meta Built a Personal Agent Instead

Every lab sprinted at coding. Wang asked which race Meta already owned.

Meta’s products represent the things that we all want to do.

In February, [Anthropic](https://www.the-ai-corner.com/p/anthropic-30b-arr-passed-openai-revenue-2026) led on coding by a wide margin, and Wang calls it a scary moment. The conventional wisdom said coding agents were the only capability that mattered, so everyone crowded that use case.

Wang had pitched Zuckerberg a different read before the Scale deal happened. People have things they want to do and things they have to do, and AGI shrinks the second pile.

Instagram, WhatsApp and Facebook live on the first one. Wang puts their reach at 3.5 billion a day, while Meta’s Q2 2026 results, released July 29, 2026, count 3.60 billion family daily active people for June, across Facebook, Instagram, Messenger and WhatsApp.

One line in the conversation sums it up: not work, not coding, but personal. Sam Altman’s [900 million weekly users](https://www.the-ai-corner.com/p/sam-altman-chatgpt-personality-900-million-users-10-things-2026) show how big that lane gets, and Meta already owned the [distribution](https://www.thevccorner.com/p/distribution-is-the-final-moat) to enter it. The [Muse operating manual](https://www.the-ai-corner.com/p/meta-muse-operating-manual-prompts-money-recovery-connector-play-2026) shows what shipped.

Choosing that lane is a product-strategy call before it is a model call. OpenAI’s product lead splits it into four parts in [this AI product strategy framework](https://www.thevccorner.com/p/ai-product-strategy-openai-guide), and [100 AI agent ideas you can build this weekend](https://www.thevccorner.com/p/100-ai-agent-ideas-implementation-guide) is a fast way to test which lane your users already live in.

When the whole field crowds 1 race, find the one your users already live in.

## 3. The 100+ Row Scorecard That Decided When Muse Could Launch (20 Red Rows Meant No)

Meta’s launch gate was a spreadsheet. A checkpoint with 20 red rows didn’t ship.

We had set, for each of those rows, what threshold is launch blocking and above what threshold is good. We had many checkpoints that were green on 80 of the rows but red on 20 of the rows. We knew that wasn’t good enough.

The sheet began as a list of more than 100 specific behaviors and capabilities the ideal personal agent needed. The team built evals for every row, trained the model against each one, and held reviews on whatever it was still bad at. Wang calls the process “very meticulous.”

Meta’s consumer culture ran on the same habit. Once you know what you’re measuring, talented people optimize it: conversion, referral rates, the onboarding flow.

The first checkpoint to come back green across the board also felt, by hand, far better than anything the team had tried. The number and the feel agreed.

“Decide what red means before you build anything.”

### How to build a Muse-style launch scorecard

Wang’s sheet gave every row two numbers: a threshold that blocks the launch and a threshold that counts as good. You can start with 10 rows this week. Give each row the behavior, the eval that tests it, both thresholds and today’s score, then rerun the evals on every new model checkpoint.

Here is how the first rows could look for a personal agent, with example thresholds you would tune to your own product:

- 

Finishes a booking end to end: blocks launch below 85% on 200 test requests, good at 95%+

- 

Asks before spending money: blocks launch below 100%, because one surprise purchase ends the trust fall

- 

Remembers a preference from last week: blocks launch below 80%, good at 95%+

- 

Recovers from a failed tool call: blocks launch below 70%, good at 90%+

- 

Checks back when an instruction is ambiguous: blocks launch below 75%, good at 90%+

Then paste this prompt into Claude to draft the full sheet:

You are the head of quality for [PRODUCT], a [ONE-LINE DESCRIPTION] used by [USER]. Draft a launch scorecard of 40 rows. Each row is one behavior a user must be able to rely on.

For every row, give:
1. The behavior, in one sentence a user would recognize
2. An automated eval: test inputs, expected result and how to grade it
3. A launch-blocking threshold and a good threshold, as pass rates
4. The user moment it protects (first task, payment, memory, error)

Group the rows into core tasks, permissions and money, memory, error recovery, tone and speed. Then mark the 10 rows a new user hits in their first 3 tasks, since those decide retention.

Building your own launch gate? Start here:

- 

[Set a metric. Walk away. Let the agent optimize overnight.](https://www.the-ai-corner.com/p/autoresearch-playbook-agent-optimization-loops-2026)

- 

[Why Most Self-Improving AI Loops Fail and How to Build One That Works](https://www.the-ai-corner.com/p/build-ai-loops-that-work)

- 

[Google Senior AI Leader’s Loop Engineering Masterclass](https://www.the-ai-corner.com/p/loop-engineering-masterclass-self-improving-ai-systems-2026)

- 

[The Claude Code loops library: 12 ready-to-run recipes](https://www.the-ai-corner.com/p/claude-code-loops-library-goal-schedule-recipes-2026)

## 4. Under 200 People Built Muse, and Meta Kept Everyone Else Off It

Every executive knew Muse mattered. The discipline was keeping the rest of the company off it.

We knew it was a single work of art. It required strong point of view and strong focus to pull that through into one beautiful experience.

The headcount was under 200, model work and product work together. In big-company terms, Wang says, that is “actually a lot smaller” than it sounds.

The failure he dodged has a name: “PM hell.” Every PM jams a pet feature in, and the product blends into a smoothie that users can feel without being able to explain it.

Steve Jobs comes up too: Apple is Steve Jobs with 10,000 lives. Later, Wang names Friedman as the person whose single point of view came through on Muse.

Small teams keep winning this way, from [Luca Ferrari running Evernote with 20 people](https://www.thevccorner.com/p/bending-spoons-evernote-playbook) to [OpenAI’s model where 2 engineers beat 200](https://www.thevccorner.com/p/ai-native-product-operating-model-2026) to the [billion-dollar startup formula](https://www.thevccorner.com/p/the-billion-dollar-startup-formula). Cap the team early and let [taste](https://www.thevccorner.com/p/why-taste-is-the-new-moat) decide what ships.

## 5. Muse’s Best Marketing Was a Screenshot (How a Mascot Made Every Share an Ad)

A feature list can’t be forwarded. A screenshot can.

To have a modern consumer product, it has to work on the screenshot. The screenshot has to fly, either through group chats or word of mouth or online.

Wang says it wasn’t engineered. Putting Jolly in the frame still means any screenshot announces itself as a Muse screenshot. In his words, that is “the best marketing you could possibly have.”

The evidence is a story about a friend running a $100B company. He left his ID on a Flexjet, told Muse he wanted no part in getting it back, and watched it arrange a courier to carry the ID to his office. 3 or 4 screenshots of that exchange did the selling.

The ads gripe is in there too: Anthropic and OpenAI ads sell a logo when millions of use cases could carry the ad. Wang’s team kept asking a simpler question: why would someone care? People care about “what it can do for them,” not about the lab or its research.

Muse ran a few ads, but the early engine was Wang reposting users doing odd things with it. OpenAI’s product lead lays out [15 distribution plays](https://www.thevccorner.com/p/openai-ai-distribution-strategy), and [speed, story and surface area](https://www.thevccorner.com/p/distribution-singularity-ai-startup-momentum) decide who wins when a product spreads that way.

If your output can’t survive a screenshot, it isn’t ready for distribution.

Growing on a small ad budget? Start here:

- 

[Zero Ads. Zero VC. $230M ARR. The Story of Magnific](https://www.the-ai-corner.com/p/the-story-of-magnific)

- 

[How Lovable hit $400M ARR in 14 months with 146 people and almost zero paid ads](https://www.the-ai-corner.com/p/lovable-growth-playbook-0-to-400m-arr-14-months)

- 

[The Growth Playbook Behind One of AI’s Fastest ARR Climbs](https://www.thevccorner.com/p/viktor-10m-arr-marketing-trading-playbook)

- 

[Your GTM run by agents: 8 agents and 3 workflows](https://www.the-ai-corner.com/p/your-gtm-run-by-agents)

- 

[The growth accounting and virality model](https://www.thevccorner.com/p/growth-accounting-virality-model), to measure how far each screenshot travels

## 6. A Meme Account Became Muse’s Growth Engine (How Do You Make Meta Cool Again?)

Wang knew Meta had distribution. It still needed people to repeat the product in public.

I remembered that the internet rewards risk, and it rewards surprise, and things that people don’t expect.

Wang gives 2 reasons for the posting spree. AI launches arrive as a torrent, so Muse needed a way to break through, and Meta, despite owning Instagram and Facebook, had not been cool for a while.

It began with Wang reposting use cases from users. A few offhand posts did well while he wasn’t looking at his phone, so he leaned in. One, a Jolly holding a briefcase captioned “MFW I go to work on Monday,” told him the mascot had mileage.

He admits meetings got hard to sit through while he drafted the next meme. Friedman’s verdict: he expected to learn about Muse users, and instead “we’re just learning a lot about Alex’s mind.”

There is no tracking, though Wang believes the memes moved growth, and the evidence is anecdotal: the people raising the memes also downloaded the app. For how attention works now, read [Social Media Has Changed Forever](https://www.thevccorner.com/p/social-media-changed-2026-attention-playbook).

Give your product a character you can drop into any situation.

## 7. How Muse Keeps Users Coming Back: The Trust Fall Ladder

Friedman went all in on OpenClaw. Most users need a ladder, not a leap.

It’s kind of this trust fall that you have with an AI agent. At first you don’t really trust it, but you’re kind of intrigued, so you give it a little nibble, and then something a little bigger, and something a little bigger, and something a little bigger.

Friedman skipped the ladder. He told OpenClaw he wanted to drink more water, and it watched him on security footage and said good job.

Most people won’t start there. Wang says some college students do: recording voice notes, brain-dumping into the agent and trusting it to turn the pile into plans.

For successful Muse users the climb is bigger and bigger tasks, “and then having it work every one of those times.” A broken rung can end it, and Wang says people left most agent products at the start of the year because they were unreliable.

Muse is also not a chatbot, so non-developers need careful onboarding. Meta’s A/B tests across model versions show the experience tracks model quality closely, including how reliably the agent finishes tasks and checks back when it needs guidance. That sensitivity is [model-market fit](https://www.thevccorner.com/p/model-market-fit-ai-startups) in miniature.

Design the first 3 tasks a new user hands your agent, because [retention](https://www.thevccorner.com/p/why-startup-retention-matters) is the hardest metric and the [AI trust tax](https://www.thevccorner.com/p/the-ai-trust-tax) is what a broken rung costs.

## 8. “The Adulthood They Dreamed of in Childhood” (Why Wang Thinks Agents Raise Ambition)

Wang’s pitch for Muse is bigger than saved time. It is ambition that survives your first job.

I think Muse can give everyone the adulthood they dreamed of in childhood.

Kids think big, he says. By the time they finish school and sit in a job for a while, the hope and ambition have been sucked out of them.

Put bluntly, the ambition gets beaten out of them, and adults end up as zombies who lost their agency.

His promise is an escalator of agency across a lifetime: dream, get it done, dream bigger. The alternative is starting with lots of agency and watching it get crushed.

He points to Elon Musk and Zuckerberg as people who already live this way, and argues it should hold for everyone. He also cites a line from [Jeff Bezos’s](https://www.the-ai-corner.com/p/jeff-bezos-economic-doctrine-founders-2026) shareholder letters about customers being beautifully unsatisfied.

Treat it as a thesis, not a result. The public number for Muse is “millions,” which could mean hundreds of millions, as the conversation itself notes.

The version you can act on today is smaller: a personal agent as a [second brain](https://www.the-ai-corner.com/p/granola-claude-second-brain-stack-mcp-2026), or an assistant you [employ instead of operate](https://www.the-ai-corner.com/p/instinct-ai-agent-playbook-prompts-workflows-invite-2026). [High agency](https://www.thevccorner.com/p/high-agency-success-guide) starts there.

To set one up this week, the [Instinct playbook](https://www.the-ai-corner.com/p/instinct-ai-agent-playbook-prompts-workflows-invite-2026) walks through the prompts and workflows for a personal agent, and [Clawdbot](https://www.the-ai-corner.com/p/clawdbot-ai-employee) shows how to run a 24/7 AI employee you own.

## 9. Diamond Mining or Skyscrapers: Which Business Are You Running? (The Payoff Test)

Wang sees 2 ways to run a company, and they want opposite managers.

There’s diamond mining where you’re kind of like, hey everyone, just go forth, try all your crazy ideas, and you’re just nurturing the ideas that seem promising.

Diamond mining is a power-law payoff. Some bets return 1 million times the investment, most don’t work out, and the winners justify all of it. VC belongs in this camp, Wang says, which is the logic under [VC fund math](https://www.thevccorner.com/p/venture-capital-fund-math-explained) and [fund economics](https://www.thevccorner.com/p/vc-fund-economics-waterfall-model).

If you’re pitching those power-law investors, [The VC Corner’s investor lists](https://www.thevccorner.com/t/investor-lists?sort=top) cover 10,000+ of them, and [the Venture Capital Method](https://www.thevccorner.com/p/venture-capital-method-startup-valuation) shows how they will value your company.

Skyscrapers are the opposite: a linear payoff, so you squeeze 2% out here, 1% there, 0.5% somewhere else. He files data annotation and Amazon Prime deliveries there, and says Scale lived in that bucket.

His 19th birthday party is the evidence. Wang was a freshman at MIT, interning at the trading firm HRT, and about 10 to 12 people came, almost all Harvard or MIT students he knew from math and computer science competitions.

Guests went on to start [Hyperliquid](https://www.the-ai-corner.com/p/hyperliquid-ai-efficiency-onchain-exchange-2025), Cognition and Decagon, and his advice to HRT’s founder was to give the interns seed checks.

He runs diamond mining at Meta now. Pick the bucket before you set the metrics or the timeline.

## 10. Refounding Meta’s AI Lab: A 5-to-6-Week Deal, 49% of Scale and 200+ Direct Reports

Meta looked like damaged goods on AI. Wang saw a blank page.

Meta on AI certainly looked like damaged goods in many ways, and was maybe not the most appealing place to work on AI, but that triggered my entrepreneur side, where I was like, you can essentially rebuild it. It’s like a refounding of the lab.

Zuckerberg’s first calls came after Llama 4, which Wang calls an internal disappointment. Outreach to announced deal took 5 to 6 weeks. Meta owns 49% of Scale, Scale continues, and Wang joined Meta.

Wang spent weeks asking whether the deal was even real. Scale was enterprise and government sales, nothing like Instagram or WhatsApp, and giving up what he saw as his life’s work after 9 years carried its own emotional cost. A win for every party, plus the blank page, tipped him.

He built the lab as a flat, highly technical team with high talent density. Effectively all the TBD researchers report straight to him, and he has more than 200 direct reports. Technical leads run pods and break ties.

At Scale he thought a founder had to do every job, which made him “the bottleneck in very big ways.” At Meta, hiring brilliant people became job number 1.

“They just need the room to cook.”

Copying a flat model means [hiring for judgment](https://www.the-ai-corner.com/p/hiring-for-judgment-ai-seniorization). For where top talent goes next, see [Andrej Karpathy joining Anthropic](https://www.thevccorner.com/p/breaking-andrej-karpathy-joins-anthropic) and [Anthropic’s 9-week hiring spree](https://www.thevccorner.com/p/anthropic-hiring-spree-fable-5-ipo-2026). A project everyone has written off hands you the room to set the principles.

## The Muse Playbook

Muse shipped because Meta scored every behavior, protected a single point of view, and let surprise do the marketing.

- 

Founders: Write your launch rows before your launch date, and name the 1 person whose taste owns the product. Cap the team before the pressure to add people arrives. This week, list the 10 behaviors your agent must get right every time, then run the scorecard prompt in section 3 on them.

- 

Investors: Ask whether a team runs a diamond mine or a skyscraper, because the metrics and the patience differ. Request the scorecard and ask which rows are still red. Our [due diligence checklist and Excel template](https://www.thevccorner.com/p/what-top-vcs-check-in-due-diligence-bc9) covers the rest of the questions.

- 

Operators: Treat the first 3 tasks a user hands your agent as the whole retention plan. Then fix memory: an agent that [forgets yesterday](https://www.the-ai-corner.com/p/self-evolving-agent-stack-playbooks-memory-skills-2026) breaks the trust fall before it starts, and one that will [hallucinate at scale](https://www.the-ai-corner.com/p/ai-agent-memory-context-as-topology-playbook-2026) ends it.

- 

Everyone else: Run the screenshot test on anything you make. Show your next project to a friend and ask whether the result is worth forwarding. The [YC landing page formula](https://www.thevccorner.com/p/win-the-first-5-seconds-the-yc-landing) applies the same test to the first five seconds of your homepage.

## The 5 Principles to Steal

- 

Gate launches on a scorecard. 100+ rows, 2 thresholds each, no ship while a row is red.

- 

Guard a single point of view. Under 200 people and 1 person’s taste, with no committee smoothie.

- 

Make the output forwardable. If the result isn’t worth a screenshot, the product isn’t ready for distribution.

- 

Ramp trust a task at a time. Small task, then bigger, with every rung holding.

- 

Hire people who’ve done it. Then give them room and a great environment.

A demo is cheap and reliability is the product, so budget for the sanding.

Watch the full interview and decide for yourself whether the memes were a growth engine or a lucky streak.

Embedded interview: https://www.youtube-nocookie.com/embed/S6l3aRsecuE?start=6s&rel=0&autoplay=0&showinfo=0&enablejsapi=0

If this breakdown saved you 1 hour, send it to one founder or investor who needs it.

## Alexandr Wang and Meta Muse: FAQ

### What is Meta Muse?

Muse is the personal AI agent Meta launched in September 2026, built by Meta Superintelligence Labs, the lab Alexandr Wang leads. It handles personal tasks for people, and its mascot, Jolly, shows up in the screenshots users share.

### How long did it take Meta to build Muse?

A prototype followed within 1 to 2 weeks of the memos Wang and Nat Friedman sent to Meta’s board in February. Making it reliable enough to launch took about 7 more months.

### How many people built Muse?

Fewer than 200, counting model and product work together. Wang says that is “actually a lot smaller” than it sounds for a company of Meta’s size.

### How did Meta decide when Muse could launch?

With a scorecard of 100+ behaviors, each with a launch-blocking threshold and a good threshold. A checkpoint with 80 green rows and 20 red ones stayed in development, and Muse moved forward once a checkpoint came back green across the board.

### How did Alexandr Wang end up at Meta?

Mark Zuckerberg reached out after Llama 4, and the deal took 5 to 6 weeks from first outreach to announcement. Meta owns 49% of Scale AI, Scale continues as its own company, and Wang refounded Meta’s AI lab with more than 200 direct reports.

#### Keep reading: Build the agent

- 

[Anthropic just solved the hardest part of building AI agents](https://www.the-ai-corner.com/p/claude-managed-agents-guide-2026)

- 

[OpenAI Just Made a 2-Month Agent Build a Config Block](https://www.the-ai-corner.com/p/you-spent-2-months-building-an-agent)

- 

[Ship your first AI agent in a day](https://www.the-ai-corner.com/p/how-to-build-your-first-ai-agent-2026)

- 

[Give your agent its own computer: the microVM stack](https://www.the-ai-corner.com/p/give-your-agent-its-own-computer-2026)

- 

[The Instinct playbook: prompts and workflows for a personal AI agent](https://www.the-ai-corner.com/p/instinct-ai-agent-playbook-prompts-workflows-invite-2026)

#### Keep reading: Run the team

- 

[Most Founders Hire Their First Engineer Too Early, Too Fast and for the Wrong Reasons](https://www.thevccorner.com/p/hiring-your-first-engineer-ai-era)

- 

[Free AI Hiring Kit for Founders](https://www.thevccorner.com/p/free-ai-hiring-kit-founders)

- 

[Brian Armstrong Runs 1,200 AI Agents at Coinbase. Here Is the Operating Model He Just Handed Every Founder.](https://www.the-ai-corner.com/p/brian-armstrong-coinbase-1200-ai-agents-operating-model-2026)

- 

[The one-person startup operating system, with 30+ prompts across 12 functions](https://www.the-ai-corner.com/p/one-person-startup-operating-system-2026)

#### Keep reading: Where the labs are heading

- 

[Zuckerberg’s $14B Bet: Glasses Kill the Phone in 5 Years](https://www.the-ai-corner.com/p/zuckerberg-smart-glasses-replace-phones)

- 

[Sam Altman on Where AI Is Actually Going](https://www.the-ai-corner.com/p/sam-altman-openai-interview-ai-deployment-memory-enterprise)

#### Keep reading: The premium libraries

- 

[The AI agents library](https://www.the-ai-corner.com/t/ai-agents) collects every agent playbook, from the first build to memory and evals

- 

[The Claude and Anthropic library](https://www.the-ai-corner.com/t/claude-and-anthropic) holds the Claude guides, prompt packs and Cowork setups

- 

[10,000+ investors in The VC Corner’s lists](https://www.thevccorner.com/t/investor-lists?sort=top), for when your agent is ready to raise

- 

[Financial models you can copy](https://www.thevccorner.com/t/financial-models), from a SaaS model to a 13-week cash flow forecast

- 

[Pitch decks that raised](https://www.thevccorner.com/t/pitch-decks), including Anthropic’s 2022 deck

- 

[Every VC Corner resource](https://www.thevccorner.com/t/resources) in one place
