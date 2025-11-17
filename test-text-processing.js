// Simple test for banned words processing
const bannedWordsList = [
  { word: "damn", alternatives: ["darn", "drat"], category: "profanity" },
  { word: "hell", alternatives: ["heck", "gosh"], category: "profanity" },
  { word: "crap", alternatives: ["stuff", "mess"], category: "profanity" }
];

function checkText(text) {
  const matches = [];
  const lowerText = text.toLowerCase();

  for (const bannedWord of bannedWordsList) {
    const bannedLower = bannedWord.word.toLowerCase();
    let startIndex = 0;

    while (true) {
      const index = lowerText.indexOf(bannedLower, startIndex);
      if (index === -1) break;

      matches.push({
        word: bannedWord.word,
        position: index,
        length: bannedWord.word.length,
        alternatives: bannedWord.alternatives,
        selectedAlternative: bannedWord.alternatives[0] || ''
      });

      startIndex = index + 1;
    }
  }

  // Sort matches by position, then by length (longer words first) to handle overlaps
  matches.sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    return b.length - a.length;
  });

  // Remove overlapping matches (keep longer ones)
  const nonOverlappingMatches = [];
  for (const match of matches) {
    const hasOverlap = nonOverlappingMatches.some(existing =>
      match.position < existing.position + existing.length &&
      match.position + match.length > existing.position
    );

    if (!hasOverlap) {
      nonOverlappingMatches.push(match);
    }
  }

  return nonOverlappingMatches;
}

function processText(text, selections) {
  const matches = checkText(text);
  let processedText = text;

  // Process from end to beginning to maintain position accuracy
  const sortedMatches = [...matches].sort((a, b) => b.position - a.position);

  for (const match of sortedMatches) {
    const replacement = selections.get(`${match.word}-${match.position}`) || match.selectedAlternative;
    processedText = processedText.slice(0, match.position) +
                   replacement +
                   processedText.slice(match.position + match.length);
  }

  return processedText;
}

// Test the functionality
const testText = "This is a damn test with some hell and crap words that should be filtered.";
console.log("Original text:", testText);

const matches = checkText(testText);
console.log("Found matches:", matches.length);
console.log("Matches:", JSON.stringify(matches, null, 2));

const selections = new Map();
matches.forEach(match => {
  selections.set(`${match.word}-${match.position}`, match.selectedAlternative);
});

const processed = processText(testText, selections);
console.log("Processed text:", processed);

console.log("Test completed successfully!");