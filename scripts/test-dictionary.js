import { lyricize } from '../dist/index.cjs';

// Simple assertion function
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

// Test helper function for single word
function testLyricize(input, expectedSyllables, expectedHyphenated, expectedStresses, expectedKnown, testName) {
  console.log(`\n🧪 Testing: ${testName}`);
  console.log(`Input: "${input}"`);
  
  const result = lyricize(input);
  
  // For single word tests, we expect an array with one element
  const wordData = result[0];
  
  console.log(`Result:`, JSON.stringify(wordData, null, 2));
  
  // Test syllables
  assert(
    JSON.stringify(wordData.syllables) === JSON.stringify(expectedSyllables),
    `Syllables mismatch. Expected: [${expectedSyllables.join(', ')}], Got: [${wordData.syllables.join(', ')}]`
  );
  
  // Test hyphenated
  assert(
    wordData.hyphenated === expectedHyphenated,
    `Hyphenated mismatch. Expected: "${expectedHyphenated}", Got: "${wordData.hyphenated}"`
  );
  
  // Test stresses
  assert(
    JSON.stringify(wordData.stresses) === JSON.stringify(expectedStresses),
    `Stresses mismatch. Expected: [${expectedStresses.join(', ')}], Got: [${wordData.stresses.join(', ')}]`
  );
  
  // Test isKnown
  assert(
    wordData.isKnown === expectedKnown,
    `isKnown mismatch. Expected: ${expectedKnown}, Got: ${wordData.isKnown}`
  );
}

// Test helper function for multiple words
function testMultipleWords(input, expectedResults, testName) {
  console.log(`\n🧪 Testing: ${testName}`);
  console.log(`Input: "${input}"`);
  
  const result = lyricize(input);
  
  console.log(`Result: ${result.length} words processed`);
  
  assert(
    result.length === expectedResults.length,
    `Word count mismatch. Expected: ${expectedResults.length}, Got: ${result.length}`
  );
  
  expectedResults.forEach((expected, index) => {
    const wordData = result[index];
    
    // Test syllables
    assert(
      JSON.stringify(wordData.syllables) === JSON.stringify(expected.syllables),
      `Word ${index + 1} syllables mismatch. Expected: [${expected.syllables.join(', ')}], Got: [${wordData.syllables.join(', ')}]`
    );
    
    // Test hyphenated
    assert(
      wordData.hyphenated === expected.hyphenated,
      `Word ${index + 1} hyphenated mismatch. Expected: "${expected.hyphenated}", Got: "${wordData.hyphenated}"`
    );
    
    // Test stresses
    assert(
      JSON.stringify(wordData.stresses) === JSON.stringify(expected.stresses),
      `Word ${index + 1} stresses mismatch. Expected: [${expected.stresses.join(', ')}], Got: [${wordData.stresses.join(', ')}]`
    );
    
    // Test isKnown
    assert(
      wordData.isKnown === expected.isKnown,
      `Word ${index + 1} isKnown mismatch. Expected: ${expected.isKnown}, Got: ${wordData.isKnown}`
    );
  });
}

// Test helper function for special cases (empty string, multiple spaces)
function testSpecialCase(testName, testFunction) {
  console.log(`\n🧪 Testing: ${testName}`);
  testFunction();
  console.log(`✅ ${testName} test passed`);
}

console.log('🚀 Starting Lyricizer Test Suite...\n');

// Test 1: Simple known word
testLyricize(
  "hello",
  ["hel", "lo"],
  "hel-lo",
  [0, 2],
  true,
  "Simple known word"
);

// Test 2: Word with punctuation
testLyricize(
  "hello!",
  ["hel", "lo"],
  "hel-lo!",
  [0, 2],
  true,
  "Word with punctuation"
);

// Test 3: Capitalized word
testLyricize(
  "Hello",
  ["hel", "lo"],
  "Hel-lo",
  [0, 2],
  true,
  "Capitalized word"
);

// Test 4: ALL CAPS word
testLyricize(
  "HELLO",
  ["hel", "lo"],
  "HEL-LO",
  [0, 2],
  true,
  "ALL CAPS word"
);

// Test 5: Word with prefix punctuation
testLyricize(
  "'hello",
  ["hel", "lo"],
  "'hel-lo",
  [0, 2],
  true,
  "Word with prefix punctuation"
);

// Test 6: Hyphenated word
testLyricize(
  "life-renewing",
  ["life", "re", "new", "ing"],
  "life-re-new-ing",
  [0, 0, 2, 0],
  true,
  "Hyphenated word"
);

// Test 7: Word with common suffix -s
testLyricize(
  "songs",
  ["songs"],
  "songs",
  [0],
  true,
  "Word with -s suffix"
);

// Test 8: Word with common suffix -ing
testLyricize(
  "singing",
  ["sing", "ing"],
  "sing-ing",
  [2, 0],
  true,
  "Word with -ing suffix"
);

// Test 9: Word with common suffix -ed
testLyricize(
  "translated",
  ["trans", "lat", "ed"],
  "trans-lat-ed",
  [0, 0, 0],
  true,
  "Word with -ed suffix"
);

// Test 10: Word with common suffix -ly
testLyricize(
  "brightly",
  ["bright", "ly"],
  "bright-ly",
  [2, 0],
  true,
  "Word with -ly suffix"
);

// Test 11: Unknown word (should fallback)
testLyricize(
  "xyzabc",
  ["xyzabc"],
  "xyzabc",
  [0],
  false,
  "Unknown word fallback"
);

// Test 12: Empty string
testSpecialCase("Empty string", () => {
  const emptyResult = lyricize("");
  assert(
    emptyResult.length === 1,
    `Empty string should return array with one element. Got length: ${emptyResult.length}`
  );
  assert(
    emptyResult[0].syllables.length === 0,
    `Empty string syllables should be empty. Got: [${emptyResult[0].syllables.join(', ')}]`
  );
  assert(
    emptyResult[0].hyphenated === "",
    `Empty string hyphenated should be empty. Got: "${emptyResult[0].hyphenated}"`
  );
  assert(
    emptyResult[0].stresses.length === 0,
    `Empty string stresses should be empty. Got: [${emptyResult[0].stresses.join(', ')}]`
  );
  assert(
    emptyResult[0].isKnown === false,
    `Empty string isKnown should be false. Got: ${emptyResult[0].isKnown}`
  );
});

// Test 13: Multiple spaces
testSpecialCase("Multiple spaces", () => {
  const spacesResult = lyricize("  hello  ");
  assert(
    spacesResult.length === 3,
    `Multiple spaces should return array with 3 elements (empty, word, empty). Got length: ${spacesResult.length}`
  );
  assert(
    spacesResult[0].syllables.length === 0,
    `First element (leading spaces) should have empty syllables. Got: [${spacesResult[0].syllables.join(', ')}]`
  );
  assert(
    spacesResult[1].syllables.length === 2,
    `Second element (hello) should have 2 syllables. Got: [${spacesResult[1].syllables.join(', ')}]`
  );
  assert(
    spacesResult[1].hyphenated === "hel-lo",
    `Second element hyphenated should be "hel-lo". Got: "${spacesResult[1].hyphenated}"`
  );
  assert(
    spacesResult[2].syllables.length === 0,
    `Third element (trailing spaces) should have empty syllables. Got: [${spacesResult[2].syllables.join(', ')}]`
  );
});

// Test 14: Multiple words with mixed cases
testMultipleWords(
  "Let the cymbals resound today",
  [
    { syllables: ["let"], hyphenated: "Let", stresses: [0], isKnown: true },
    { syllables: ["the"], hyphenated: "the", stresses: [0], isKnown: true },
    { syllables: ["cym", "bals"], hyphenated: "cym-bals", stresses: [2, 0], isKnown: true },
    { syllables: ["re", "sound"], hyphenated: "re-sound", stresses: [0, 2], isKnown: true },
    { syllables: ["to", "day"], hyphenated: "to-day", stresses: [0, 2], isKnown: true }
  ],
  "Multiple words with mixed cases"
);

// Test 15: Complex sentence from original test using testMultipleWords
const complexInput = "Let the cymbals resound today, let us cry out with songs of joy and begin a feast for departure from this life; and let us brightly and joyously sing funeral songs and hymns. For the Mother of our God, the all-golden and holy ark, doth prepare herself now to pass from the earth unto the heights, being translated to a Godlike and life-renewing resplendency.";

// Create expected results for the entire complex sentence
const complexExpectedResults = [
  { syllables: ["let"], hyphenated: "Let", stresses: [0], isKnown: true },
  { syllables: ["the"], hyphenated: "the", stresses: [0], isKnown: true },
  { syllables: ["cym", "bals"], hyphenated: "cym-bals", stresses: [2, 0], isKnown: true },
  { syllables: ["re", "sound"], hyphenated: "re-sound", stresses: [0, 2], isKnown: true },
  { syllables: ["to", "day"], hyphenated: "to-day,", stresses: [0, 2], isKnown: true },
  { syllables: ["let"], hyphenated: "let", stresses: [0], isKnown: true },
  { syllables: ["us"], hyphenated: "us", stresses: [0], isKnown: true },
  { syllables: ["cry"], hyphenated: "cry", stresses: [0], isKnown: true },
  { syllables: ["out"], hyphenated: "out", stresses: [0], isKnown: true },
  { syllables: ["with"], hyphenated: "with", stresses: [0], isKnown: true },
  { syllables: ["songs"], hyphenated: "songs", stresses: [0], isKnown: true },
  { syllables: ["of"], hyphenated: "of", stresses: [0], isKnown: true },
  { syllables: ["joy"], hyphenated: "joy", stresses: [0], isKnown: true },
  { syllables: ["and"], hyphenated: "and", stresses: [0], isKnown: true },
  { syllables: ["be", "gin"], hyphenated: "be-gin", stresses: [0, 2], isKnown: true },
  { syllables: ["a"], hyphenated: "a", stresses: [0], isKnown: true },
  { syllables: ["feast"], hyphenated: "feast", stresses: [0], isKnown: true },
  { syllables: ["for"], hyphenated: "for", stresses: [0], isKnown: true },
  { syllables: ["de", "par", "ture"], hyphenated: "de-par-ture", stresses: [0, 2, 0], isKnown: true },
  { syllables: ["from"], hyphenated: "from", stresses: [0], isKnown: true },
  { syllables: ["this"], hyphenated: "this", stresses: [0], isKnown: true },
  { syllables: ["life"], hyphenated: "life;", stresses: [0], isKnown: true },
  { syllables: ["and"], hyphenated: "and", stresses: [0], isKnown: true },
  { syllables: ["let"], hyphenated: "let", stresses: [0], isKnown: true },
  { syllables: ["us"], hyphenated: "us", stresses: [0], isKnown: true },
  { syllables: ["bright", "ly"], hyphenated: "bright-ly", stresses: [2, 0], isKnown: true },
  { syllables: ["and"], hyphenated: "and", stresses: [0], isKnown: true },
  { syllables: ["joy", "ous", "ly"], hyphenated: "joy-ous-ly", stresses: [2, 0, 0], isKnown: true },
  { syllables: ["sing"], hyphenated: "sing", stresses: [0], isKnown: true },
  { syllables: ["fu", "ner", "al"], hyphenated: "fu-ner-al", stresses: [2, 0, 0], isKnown: true },
  { syllables: ["songs"], hyphenated: "songs", stresses: [0], isKnown: true },
  { syllables: ["and"], hyphenated: "and", stresses: [0], isKnown: true },
  { syllables: ["hymns"], hyphenated: "hymns.", stresses: [0], isKnown: true },
  { syllables: ["for"], hyphenated: "For", stresses: [0], isKnown: true },
  { syllables: ["the"], hyphenated: "the", stresses: [0], isKnown: true },
  { syllables: ["moth", "er"], hyphenated: "Moth-er", stresses: [2, 0], isKnown: true },
  { syllables: ["of"], hyphenated: "of", stresses: [0], isKnown: true },
  { syllables: ["our"], hyphenated: "our", stresses: [0], isKnown: true },
  { syllables: ["god"], hyphenated: "God,", stresses: [0], isKnown: true },
  { syllables: ["the"], hyphenated: "the", stresses: [0], isKnown: true },
  { syllables: ["all", "gold", "en"], hyphenated: "all-gold-en", stresses: [0, 2, 0], isKnown: true },
  { syllables: ["and"], hyphenated: "and", stresses: [0], isKnown: true },
  { syllables: ["ho", "ly"], hyphenated: "ho-ly", stresses: [2, 0], isKnown: true },
  { syllables: ["ark"], hyphenated: "ark,", stresses: [0], isKnown: true },
  { syllables: ["doth"], hyphenated: "doth", stresses: [0], isKnown: true },
  { syllables: ["pre", "pare"], hyphenated: "pre-pare", stresses: [0, 2], isKnown: true },
  { syllables: ["her", "self"], hyphenated: "her-self", stresses: [0, 2], isKnown: true },
  { syllables: ["now"], hyphenated: "now", stresses: [0], isKnown: true },
  { syllables: ["to"], hyphenated: "to", stresses: [0], isKnown: true },
  { syllables: ["pass"], hyphenated: "pass", stresses: [0], isKnown: true },
  { syllables: ["from"], hyphenated: "from", stresses: [0], isKnown: true },
  { syllables: ["the"], hyphenated: "the", stresses: [0], isKnown: true },
  { syllables: ["earth"], hyphenated: "earth", stresses: [0], isKnown: true },
  { syllables: ["un", "to"], hyphenated: "un-to", stresses: [2, 0], isKnown: true },
  { syllables: ["the"], hyphenated: "the", stresses: [0], isKnown: true },
  { syllables: ["heights"], hyphenated: "heights,", stresses: [0], isKnown: true },
  { syllables: ["be", "ing"], hyphenated: "be-ing", stresses: [2, 0], isKnown: true },
  { syllables: ["trans", "lat", "ed"], hyphenated: "trans-lat-ed", stresses: [0, 0, 0], isKnown: true },
  { syllables: ["to"], hyphenated: "to", stresses: [0], isKnown: true },
  { syllables: ["a"], hyphenated: "a", stresses: [0], isKnown: true },
  { syllables: ["god", "like"], hyphenated: "God-like", stresses: [2, 1], isKnown: true },
  { syllables: ["and"], hyphenated: "and", stresses: [0], isKnown: true },
  { syllables: ["life", "re", "new", "ing"], hyphenated: "life-re-new-ing", stresses: [0, 0, 2, 0], isKnown: true },
  { syllables: ["re", "splen", "den", "cy"], hyphenated: "re-splen-den-cy.", stresses: [0, 2, 0, 0], isKnown: true }
];

testMultipleWords(complexInput, complexExpectedResults, "Complex sentence from original test");

// Test 16: Edge case - numbers and special characters
testLyricize(
  "123hello456",
  ["hel", "lo"],
  "123hel-lo456",
  [0, 2],
  true,
  "Word with numbers"
);

// Test 17: Edge case - multiple hyphens
testLyricize(
  "pre--post",
  ["pre", "post"],
  "pre-post",
  [0, 0],
  true,
  "Word with multiple hyphens (normalized)"
);

// Test 18: Edge case - single letter
testLyricize(
  "a",
  ["a"],
  "a",
  [0],
  true,
  "Single letter word"
);

console.log('\n🎉 All tests completed successfully!');
console.log('✨ Lyricizer is working as expected.');