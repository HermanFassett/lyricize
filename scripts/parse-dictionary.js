import * as https from 'https';
import * as fs from 'fs/promises';

async function fetchDictionary() {
  const url = 'https://www.gutenberg.org/files/29765/29765-0.txt';
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data.split(/\r?\n/)));
      res.on('error', reject);
    });
  });
}

function parseForm(form, isKnown) {
  // If no pronunciation markers, treat as single syllable
  if (!/[*"`-]/.test(form)) {
    const normalizedForm = form.replace(/[ëéö]/g, (c) => (c === 'ö' ? 'o' : 'e')).replace(/[^a-zA-Z-]/g, '');
    return {
      syllables: [normalizedForm.toLowerCase()],
      hyphenated: normalizedForm.toLowerCase(),
      stresses: [0],
      isKnown: false
    };
  }
  // Normalize special characters (e.g., ë to e, ö to o)
  const normalizedForm = form.replace(/[ëéö]/g, (c) => (c === 'ö' ? 'o' : 'e')).replace(/[^a-zA-Z*"`-]/g, '');
  const syllables = normalizedForm.toLowerCase().split(/[*"`-]/).filter(Boolean);
  const marks = normalizedForm.match(/[*"`-]/g) || [];
  const stresses = marks.map((mark) => {
    if (mark === '"') return 2;
    if (mark === '`') return 1;
    return 0;
  });

  // Ensure stresses length matches syllables length
  while (stresses.length < syllables.length) stresses.push(0);
  const hyphenated = syllables.join('-');
  return { syllables, hyphenated, stresses, isKnown: true };
}

async function main() {
  const lines = await fetchDictionary();
  const data = {};
  const markers = [
    ' n.', ' a.', ' v.', ' adj.', ' adv.', ' p.', ' interj.', ' Etym:', ' Defn:', ' [L.', ' [Gr.', ' [F.', ' [NL.', ' (Bot.', ' (Zoöl.', ' (Chem.', ' fr.', ', n.', ', a.', ', v.', ', adj.', ', adv.', ', p.', ', interj.', ', Etym:', ', Defn:', ', [L.', ', [Gr.', ', [F.', ', [NL.', ', (Bot.', ', (Zoöl.', ', (Chem.', ', fr.', ';', '.'
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Skip non-headword lines (not all uppercase or numeric)
    if (!line || line !== line.toUpperCase() || /^\d+$/.test(line)) continue;

    // Split headwords and exclude multi-word entries (spaces, apostrophes)
    const headwords = line
      .split(';')
      .map(w => w.trim().toLowerCase())
      .filter(w => w && !/[ ']/g.test(w)); // Allow hyphens
    if (headwords.length === 0) continue;

    // Find pronunciation line
    i++;
    if (i >= lines.length) break;
    let pronLine = lines[i].trim();
    while (i < lines.length && !pronLine) {
      i++;
      pronLine = lines[i]?.trim() || '';
    }
    if (!pronLine) continue;

    // Isolate prefix before markers
    let minIndex = Infinity;
    for (const marker of markers) {
      const idx = pronLine.indexOf(marker);
      if (idx > 0 && idx < minIndex) minIndex = idx;
    }
    let prefix = minIndex < Infinity ? pronLine.substring(0, minIndex).trim() : pronLine.trim();
    if (prefix.endsWith(',')) prefix = prefix.slice(0, -1).trim();

    // Remove parenthetical alternative pronunciations
    prefix = prefix.replace(/\(.*?\)/g, '').trim();
    const pronParts = prefix.split(',').map(p => p.trim()).filter(p => p);

    if (pronParts.length === 0) {
      console.warn(`No pronunciation line for ${headwords.join(', ')}: ${prefix}`);
      // Treat as unknown, single-syllable words
      headwords.forEach(word => {
        try {
          const wordData = parseForm(word, false);
          data[word] = wordData;
          // Add unhyphenated form if hyphenated
          const unhyphenated = word.replace(/-/g, '');
          if (unhyphenated !== word) {
            data[unhyphenated] = wordData;
          }
        } catch (e) {
          console.warn(`Failed to parse ${word}: ${e.message}`);
        }
      });
      continue;
    }

    // Handle single form for multiple headwords or one-to-one mapping
    if (pronParts.length !== headwords.length && pronParts.length !== 1) {
      // Try to match headwords to forms by prefix
      const matchedForms = headwords.map((word) => {
        const form = pronParts.find(p => p.toLowerCase().startsWith(word[0]));
        return form || null;
      });
      headwords.forEach((word, j) => {
        if (!matchedForms[j]) {
          try {
            const wordData = parseForm(word, false);
            data[word] = wordData;
            // Add unhyphenated form if hyphenated
            const unhyphenated = word.replace(/-/g, '');
            if (unhyphenated !== word) {
              data[unhyphenated] = wordData;
            }
          } catch (e) {
            console.warn(`Failed to parse ${word}: ${e.message}`);
          }
        } else {
          try {
            const wordData = parseForm(matchedForms[j], true);
            data[word] = wordData;
            // Add unhyphenated form if hyphenated
            const unhyphenated = word.replace(/-/g, '');
            if (unhyphenated !== word) {
              data[unhyphenated] = wordData;
            }
          } catch (e) {
            console.warn(`Failed to parse form ${matchedForms[j]} for ${word}: ${e.message}`);
          }
        }
      });
    } else {
      // Single form applies to all headwords, or one-to-one mapping
      headwords.forEach((word, j) => {
        const form = pronParts.length === 1 ? pronParts[0] : pronParts[j];
        if (form) {
          try {
            const wordData = parseForm(form, true);
            data[word] = wordData;
            // Add unhyphenated form if hyphenated
            const unhyphenated = word.replace(/-/g, '');
            if (unhyphenated !== word) {
              data[unhyphenated] = wordData;
            }
          } catch (e) {
            console.warn(`Failed to parse form ${form} for ${word}: ${e.message}`);
          }
        }
      });
    }
  }

  await fs.writeFile('dist/dictionary.json', JSON.stringify(data, null, 2));
  console.log('Generated dist/dictionary.json');
}

main().catch(console.error);