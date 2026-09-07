import Sentiment from "sentiment";

const analyzer = new Sentiment();

export function getSentimentScore(text) {
  const t = text == null ? "" : String(text).toLowerCase();
  const result = analyzer.analyze(t);
  return result?.score ?? 0;
}

// Convert sentiment score into a signed "delta" used by the pie/bullets.
export function getSentimentDelta(text, neutralAbsThreshold = 1) {
  const t = text == null ? "" : String(text).toLowerCase();

  const score = getSentimentScore(text);
  const abs = Math.abs(score);

    

  //  Improved positive words
  const positiveExperienceWords = [
    "good",
    "great",
    "amazing",
    "love",
    "excellent",
    "wonderful",
    "best",
    "awesome",
    "fantastic",
    "enjoy",
    "fun",
    "perfect",
    "liked",
    "impressed",
    "brilliant",
    "watchable",
    "cool",
    "nice",
    "solid",
  ];

  //  Improved negative words (real-world usage)
  const negativeExperienceWords = [
    "bad",
    "terrible",
    "awful",
    "hate",
    "worst",
    "boring",
    "slow",
    "disappoint",
    "poor",
    "waste",
    "wasted",
    "scam",
    "annoying",
    "dull",
    "unwatchable",
    "cringe",
    "mid",
    "trash",
    "garbage",
    "lame",
    "weak",
     "boring",
    "goofy",
    "juvenile",
    "random",
    "slow",
    "dragging"
  ];

  //  Special phrase handling
  const hasNotBad = t.includes("not bad");
  const hasNotGood = t.includes("not good") || t.includes("not great");

  const hasPositive =
    positiveExperienceWords.some((w) => t.includes(w)) || hasNotBad;

  const hasNegative =
    negativeExperienceWords.some((w) => t.includes(w)) || hasNotGood;

  // If no explicit words exist AND score is too small, return 0 (neutral)
  if (!hasPositive && !hasNegative && abs < neutralAbsThreshold) return 0;

  //  Better magnitude scaling (1..4 instead of 1..3)
  const magnitude = Math.min(4, Math.max(1, Math.round(abs / 2)));

  // Clear positive
  if (hasPositive && !hasNegative) return magnitude;

  // Clear negative
  if (hasNegative && !hasPositive) return -magnitude;

  // Mixed → fallback to sentiment score
  return score > 0 ? magnitude : -magnitude;
}