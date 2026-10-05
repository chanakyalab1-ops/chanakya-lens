# Idea: public "Check a claim" fact-check

Status: parked (not built). Saved 2026-10-05.

## What
A "Check a claim" box where a reader pastes a claim, headline or link (e.g. "Iran closed Hormuz yesterday") and gets what the sources say, with links. A new public route; the existing `/api/fact-check` only scores our own drafts and is protected.

## How it would work
1. Search our own archive first (stories and their country-grouped sources). Free, and our edge.
2. Search the web for current sources. This is the model-call cost.
3. Return Supported / Contradicted / Mixed / Not enough evidence, with short reasoning and links. Sources are the product, not the verdict.
4. Rate limit per visitor plus a global daily cap.

## Risk to settle first
A wrong public verdict about a named person or company is a defamation risk. Frame it as "what the sources say", never "true/false". Label it "AI-assisted, may be wrong". Refuse claims about private individuals.

## Recommended starting settings
- Model: Gemini free tier (already used for draft fact-checks), hard daily cap. Keep Claude off the public route (cost per check).
- Access: signed-in users only (cuts abuse). Anonymous with a tight limit is the alternative.
- Where: a `/check` page, later a "Check this claim" button on each story.
- Start small: sign-in required, 20 checks/day sitewide, results not saved. Saved/shareable results would be indexable but need moderation.

## Open decisions
Model choice, who can use it, where it lives, and whether results are saved.
