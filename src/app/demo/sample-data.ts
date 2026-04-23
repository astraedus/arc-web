/**
 * Canned demo data for the public /demo Mirror.
 *
 * Persona: Alex, ~29, works in tech PM, Melbourne. Mix of honest topics across
 * ~2 months. Moods: steady, hopeful, anxious, alive, struggling, uncertain.
 *
 * Dates use a FIXED anchor (not `new Date()`) so SSR and client hydration
 * produce identical output — otherwise React flags a text-content mismatch
 * (error #418) every page load. Bump DEMO_ANCHOR periodically to keep dates
 * feeling recent.
 */
import type { Reflection, Insight } from "@/lib/types";

const DEMO_USER_ID = "demo-alex-0000-0000-0000-000000000000";

const DEMO_ANCHOR = "2026-04-23T20:14:00.000Z";

function daysAgo(n: number): string {
  const anchor = new Date(DEMO_ANCHOR);
  anchor.setUTCDate(anchor.getUTCDate() - n);
  return anchor.toISOString();
}

export const DEMO_REFLECTIONS: Reflection[] = [
  {
    id: "demo-ref-001",
    user_id: DEMO_USER_ID,
    reflection_type: "weekly",
    title: "A quieter week, and something settling",
    body: `You wrote six times this week — shorter entries, less rushed. Three of them mention sleep, not as a complaint but just as a fact you're tracking now.

The thing that kept returning was your mum. Tuesday you said the call "wasn't bad." Friday you said "I didn't cry after hanging up." You haven't said "I'm worried about her" out loud in the journal for two weeks. That doesn't mean you aren't — but something about how you're holding it has shifted.

You also mentioned running three times. A month ago you wrote that you couldn't face it. Now it's a sentence, not a story.

One thing I noticed: you used the word "enough" four times this week. "Slept enough." "Did enough." "She sounded okay enough." I don't know if that's resignation or peace. You might.`,
    metadata: null,
    entry_count_at_generation: 6,
    period_start: daysAgo(14),
    period_end: daysAgo(7),
    created_at: daysAgo(7),
  },
  {
    id: "demo-ref-002",
    user_id: DEMO_USER_ID,
    reflection_type: "on_demand",
    title: "Why do I keep writing about Sunday nights?",
    body: `You asked why Sunday nights keep showing up. Looking back, you've written on six Sunday nights in the last two months — and only two of the entries are actually about something that happened. The other four are all anticipation.

The pattern: you imagine Monday before it arrives. Sometimes it's a specific meeting. Sometimes it's vague — "the week ahead." Once you just wrote "dread with no shape."

What's interesting is that by Tuesday, you almost never come back to what you were dreading. Either it was fine, or you'd already moved on. Your Sunday self and your Tuesday self seem to disagree about how bad Mondays actually are.

The Sunday entries are shorter than your weekday ones. Like you don't want to look too closely.`,
    metadata: null,
    entry_count_at_generation: 14,
    period_start: null,
    period_end: null,
    created_at: daysAgo(9),
  },
  {
    id: "demo-ref-003",
    user_id: DEMO_USER_ID,
    reflection_type: "weekly",
    title: "The week you started the piano again",
    body: `Monday: "might pick it up again." Thursday: "played for 40 minutes." Sunday: "I'd forgotten how it feels when my hands know something my head doesn't."

You wrote about the piano four times this week. In March you mentioned it once, in a sentence that ended with "I should." This week's entries don't have the word "should" anywhere near it.

You also noticed — and I'm not sure you noticed that you noticed — that you didn't write about work for three days in a row. That's the longest stretch in your journal. Whether that's because work was easy or because something else was louder, I can't tell. But it's there.

It might be worth checking in on whether this lasts. The last two times you started something creative, you stopped writing about it before you stopped doing it.`,
    metadata: null,
    entry_count_at_generation: 12,
    period_start: daysAgo(21),
    period_end: daysAgo(14),
    created_at: daysAgo(14),
  },
  {
    id: "demo-ref-004",
    user_id: DEMO_USER_ID,
    reflection_type: "on_demand",
    title: "What's different about me now vs. when I started writing here?",
    body: `Your first entry, eight weeks ago, was 1,100 words. Today's was 90. I don't think that means you care less. The early entries explain things; the recent ones just notice them.

Topics you've stopped mentioning: your ex (last mentioned 31 days ago), your old manager (23 days ago), apartment hunting (18 days ago). None of those were resolved in the journal — you just stopped bringing them to it.

Topics that have appeared and stayed: your mum, running, the piano, a friend named Sam you've started having breakfast with on Saturdays.

The shift I'd name, if you asked me to name one: you used to write to figure things out. Now you write to remember them. That's a different kind of attention.`,
    metadata: null,
    entry_count_at_generation: 15,
    period_start: null,
    period_end: null,
    created_at: daysAgo(4),
  },
  {
    id: "demo-ref-005",
    user_id: DEMO_USER_ID,
    reflection_type: "weekly",
    title: "A hard week, written plainly",
    body: `This was not a gentle week. You wrote four times and three of them used the word "tired." Two mentioned crying — once in the bathroom at work, once "for no reason I can name" on the tram.

You didn't dress it up. You didn't make it a lesson. I want to note that, because in February you had a week like this and spent most of the entries trying to explain why it was happening. This week you just said what was happening.

One small thing: Thursday you wrote that you made yourself soup. It's one sentence in a hard entry. But you made yourself soup. That's care, and you named it.

No conclusions from me. Just that you showed up to the page, and you were honest with it.`,
    metadata: null,
    entry_count_at_generation: 10,
    period_start: daysAgo(35),
    period_end: daysAgo(28),
    created_at: daysAgo(28),
  },
  {
    id: "demo-ref-006",
    user_id: DEMO_USER_ID,
    reflection_type: "on_demand",
    title: "Am I happier than I was a year ago?",
    body: `I only have eight weeks of your writing, so I can't answer for a year. But I can tell you what I see in the window I have.

In the first two weeks, "good" appeared once. In the last two weeks, it appears eleven times — usually without qualifier ("the morning was good," "Sam was good to see"). You've also started writing shorter entries, and shorter entries in a journal usually mean less is being processed and more is being lived.

You've written about feeling stuck twice in the last month. In the first four weeks, you used variants of "stuck" eight times.

If I had to guess at a shape: not happier, exactly. But less underwater. There's a difference. Happiness is a feeling; not-being-underwater is a condition. You seem to be out of the water enough now that you notice the air.`,
    metadata: null,
    entry_count_at_generation: 15,
    period_start: null,
    period_end: null,
    created_at: daysAgo(2),
  },
];

export const DEMO_INSIGHTS: Insight[] = [
  {
    id: "demo-ins-001",
    user_id: DEMO_USER_ID,
    insight_type: "thread",
    title: "Mum keeps coming back, but differently",
    description:
      "You've written about your mother across eight entries. The first four were worry. The last four are closer to presence — describing calls, the way she laughs, what the nurse said. The topic hasn't left, but the tone has softened.",
    related_note_ids: ["demo-entry-002", "demo-entry-007", "demo-entry-013"],
    created_at: daysAgo(3),
  },
  {
    id: "demo-ins-002",
    user_id: DEMO_USER_ID,
    insight_type: "pattern",
    title: "You write most on Sunday nights and Wednesday mornings",
    description:
      "Eleven of fifteen entries were written between 8:30 and 11pm Sunday, or before 8am Wednesday. Your Sunday entries are longer and more anxious; your Wednesday ones are shorter and more grounded.",
    related_note_ids: null,
    created_at: daysAgo(5),
  },
  {
    id: "demo-ins-003",
    user_id: DEMO_USER_ID,
    insight_type: "connection",
    title: "Two entries, forty days apart, saying the same thing",
    description:
      "On March 4th you wrote 'I keep expecting to feel ready before I start.' On April 13th: 'I wonder if the readiness was always going to arrive after the beginning, not before.' You didn't reference the first when you wrote the second.",
    related_note_ids: ["demo-entry-003", "demo-entry-011"],
    created_at: daysAgo(6),
  },
  {
    id: "demo-ins-004",
    user_id: DEMO_USER_ID,
    insight_type: "evolution",
    title: "Your entries are getting shorter and more concrete",
    description:
      "Your early entries average 680 words and contain lots of abstractions (feelings, meanings, 'what this might mean'). Your recent ones average 180 words and name specific things: a call, a meal, a song, the light in a room.",
    related_note_ids: null,
    created_at: daysAgo(8),
  },
  {
    id: "demo-ins-005",
    user_id: DEMO_USER_ID,
    insight_type: "forgotten",
    title: "You haven't mentioned your ex in 31 days",
    description:
      "In your first four weeks of writing, they appeared in nearly every entry. Then they stopped. You didn't announce it. You didn't conclude anything. They just aren't on the page anymore.",
    related_note_ids: null,
    created_at: daysAgo(10),
  },
  {
    id: "demo-ins-006",
    user_id: DEMO_USER_ID,
    insight_type: "thread",
    title: "Running appears the week something else gets heavier",
    description:
      "The three weeks you ran most were also the three weeks your entries mentioned work stress, mum, or sleep most. Running shows up as counterweight, not as joy. Worth noticing.",
    related_note_ids: ["demo-entry-005", "demo-entry-009"],
    created_at: daysAgo(12),
  },
  {
    id: "demo-ins-007",
    user_id: DEMO_USER_ID,
    insight_type: "pattern",
    title: "You use the word 'enough' when you're at peace",
    description:
      "'Enough' appears nine times across your journal — always in entries tagged calm or steady. Never in the anxious ones. It might be your quiet signal to yourself that something is okay.",
    related_note_ids: null,
    created_at: daysAgo(15),
  },
  {
    id: "demo-ins-008",
    user_id: DEMO_USER_ID,
    insight_type: "evolution",
    title: "The questions you ask yourself are changing",
    description:
      "Early entries end with 'why' questions (why do I feel like this, why can't I decide). Recent ones end with 'what' questions (what do I want tomorrow to look like, what did Sam mean by that). 'Why' looks backward; 'what' looks forward.",
    related_note_ids: null,
    created_at: daysAgo(18),
  },
];

/**
 * Demo count so DemoMirrorInsights doesn't hit the "not enough entries" state.
 */
export const DEMO_ENTRY_COUNT = 15;
