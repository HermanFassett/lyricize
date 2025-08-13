import * as fs from 'fs';
import { join } from 'path';

// Use require.resolve for CommonJS, fallback to __dirname for ES modules
let dictionaryPath: string;
try {
  dictionaryPath = require.resolve('./dictionary.json');
} catch {
  dictionaryPath = join(__dirname, 'dictionary.json');
}

interface WordData {
  syllables: string[];
  hyphenated: string;
  stresses: number[];
  isKnown: boolean;
}

const data: Record<string, WordData> = JSON.parse(fs.readFileSync(dictionaryPath, 'utf-8'));

export function lyricize(lyrics: string): WordData[] {
  return lyrics.split(/\s+/).map(originalWord => {
    if (!originalWord) return { syllables: [], hyphenated: '', stresses: [], isKnown: false };

    // Preserve punctuation
    const prefix = originalWord.match(/^[^a-zA-Z]*/)?.[0] || '';
    const suffix = originalWord.match(/[^a-zA-Z]*$/)?.[0] || '';
    const cleanWord = originalWord.replace(/[^a-zA-Z-]/g, ''); // Keep hyphens
    if (!cleanWord) return { syllables: [originalWord], hyphenated: originalWord, stresses: [0], isKnown: false };

    // Handle hyphenated words (e.g., life-renewing)
    if (cleanWord.includes('-')) {
      const parts = cleanWord.split('-').filter(part => part);
      const partResults: WordData[] = parts.map((part, idx) => processWord(part, '', '')); // No prefix/suffix for parts
      const combinedSyllables = partResults.flatMap(res => res.syllables);
      const combinedHyphenated = partResults.map(res => res.hyphenated).join('-');
      const combinedStresses = partResults.flatMap(res => res.stresses);
      const isKnown = partResults.every(res => res.isKnown);
      return {
        syllables: combinedSyllables,
        hyphenated: prefix + preserveCase(originalWord, combinedHyphenated, cleanWord) + suffix,
        stresses: combinedStresses,
        isKnown
      };
    }

    // Process single word
    return processWord(cleanWord, prefix, suffix);
  });
}

// Process a single word or part of a hyphenated word
function processWord(original: string, prefix: string, suffix: string): WordData {
  const cleanWord = original.toLowerCase();
  if (!cleanWord) return { syllables: [prefix + original + suffix], hyphenated: prefix + original + suffix, stresses: [0], isKnown: false };

  // Look up in dictionary (includes hyphenated and unhyphenated forms)
  let wordData = data[cleanWord];

  // Try common suffixes
  if (!wordData) {
    const suffixes = [
      { suffix: 's', replace: '', syllable: null }, // No new syllable for -s
      { suffix: 'es', replace: '', syllable: 'es' },
      { suffix: 'ed', replace: '', syllable: 'ed' },
      { suffix: 'ing', replace: '', syllable: 'ing' },
      { suffix: 'ly', replace: '', syllable: 'ly' },
      { suffix: 'd', replace: '', syllable: null } // Handle -d after e (e.g., translated -> translate)
    ];
    for (const { suffix, replace, syllable } of suffixes) {
      if (cleanWord.endsWith(suffix)) {
        const base = cleanWord.slice(0, -suffix.length) + replace;
        wordData = data[base];
        if (wordData) {
          let newSyllables = wordData.syllables;
          let newHyphenated = wordData.hyphenated;
          let newStresses = wordData.stresses;
          if (suffix === 's') {
            // For -s, append to hyphenated without new syllable
						const lastSyllable = wordData.syllables[wordData.syllables.length - 1];
						const previousSyllables = wordData.syllables.slice(0, -1);
						newSyllables = [...previousSyllables, lastSyllable + 's'];
            newHyphenated = wordData.hyphenated + 's';
          } else if (suffix === 'd' && cleanWord.endsWith('ed')) {
            // For -d, append as -ed
            newHyphenated = wordData.hyphenated.slice(0, -1) + '-ed';
						const lastSyllable = newSyllables[newSyllables.length - 1];
						const previousSyllables = newSyllables.slice(0, -1);
						newSyllables = [...previousSyllables, lastSyllable.slice(0, -1), 'ed'];
						newStresses = [...wordData.stresses, 0];
          } else if (syllable) {
            // For other suffixes, add as new syllable
            newSyllables = [...wordData.syllables, syllable];
            newHyphenated = [...wordData.syllables, syllable].join('-');
            newStresses = [...wordData.stresses, 0];
          }
          wordData = {
            ...wordData,
            syllables: newSyllables,
            hyphenated: preserveCase(original, newHyphenated, cleanWord),
            stresses: newStresses
          };
          break;
        }
      }
    }
  }

  if (wordData) {
    return {
      ...wordData,
      hyphenated: prefix + preserveCase(original, wordData.hyphenated, cleanWord) + suffix,
      isKnown: true // Mark as known if in dictionary or derived
    };
  }

  // Fallback for unmatched words
  return {
    syllables: [original],
    hyphenated: prefix + original + suffix,
    stresses: [0],
    isKnown: false
  };
}

// Preserve the case of the original word in the hyphenated output
function preserveCase(original: string, hyphenated: string, cleanOriginal: string): string {
  // Apply case only if original has no hyphens or punctuation
  if (original.toLowerCase() === cleanOriginal) {
    const isUpper = original === original.toUpperCase();
    const isCapitalized = original === capitalize(original.toLowerCase());
    if (isUpper) return hyphenated.toUpperCase();
    if (isCapitalized) return capitalize(hyphenated);
  }
  return hyphenated;
}

// Capitalize first letter
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}