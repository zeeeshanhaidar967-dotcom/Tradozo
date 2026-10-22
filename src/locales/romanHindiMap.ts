/**
 * Roman-Hindi to English/Hindi Transliteration Aliases
 * Allows searching by Roman phonetics like "chawal" to find "Rice" or "चावल",
 * "cheeni" to find "Sugar", "tel" to find "Oil", etc.
 */

export interface RomanHindiAlias {
  roman: string;
  hindi: string;
  english: string[];
}

export const DEFAULT_ROMAN_HINDI_ALIASES: RomanHindiAlias[] = [
  // Grocery / Kirana
  { roman: 'chawal', hindi: 'चावल', english: ['rice', 'basmati', 'kolam'] },
  { roman: 'cheeni', hindi: 'चीनी', english: ['sugar', 'shakkar'] },
  { roman: 'shakkar', hindi: 'शक्कर', english: ['sugar', 'jaggery'] },
  { roman: 'atta', hindi: 'आटा', english: ['flour', 'wheat', 'gehu'] },
  { roman: 'aata', hindi: 'आटा', english: ['flour', 'wheat'] },
  { roman: 'maida', hindi: 'मैदा', english: ['all purpose flour', 'refined flour'] },
  { roman: 'sooji', hindi: 'सूजी', english: ['semolina', 'rava'] },
  { roman: 'rava', hindi: 'रवा', english: ['semolina', 'sooji'] },
  { roman: 'besan', hindi: 'बेसन', english: ['gram flour', 'chana flour'] },
  { roman: 'dal', hindi: 'दाल', english: ['pulse', 'lentil', 'toor', 'moong', 'urad', 'chana'] },
  { roman: 'daal', hindi: 'दाल', english: ['pulse', 'lentil'] },
  { roman: 'tel', hindi: 'तेल', english: ['oil', 'mustard oil', 'refined oil', 'sarso'] },
  { roman: 'sarso', hindi: 'सरसों', english: ['mustard'] },
  { roman: 'ghee', hindi: 'घी', english: ['butter oil', 'clarified butter'] },
  { roman: 'namak', hindi: 'नमक', english: ['salt', 'tata salt'] },
  { roman: 'mirch', hindi: 'मिर्च', english: ['chilli', 'pepper'] },
  { roman: 'haldi', hindi: 'हल्दी', english: ['turmeric'] },
  { roman: 'dhaniya', hindi: 'धनिया', english: ['coriander'] },
  { roman: 'jeera', hindi: 'जीरा', english: ['cumin'] },
  { roman: 'masala', hindi: 'मसाला', english: ['spices', 'garam masala'] },
  { roman: 'chaipatti', hindi: 'चायपत्ती', english: ['tea', 'chai'] },
  { roman: 'chai', hindi: 'चाय', english: ['tea'] },
  { roman: 'doodh', hindi: 'दूध', english: ['milk', 'amul', 'dairy'] },
  { roman: 'dahi', hindi: 'दही', english: ['curd', 'yogurt'] },
  { roman: 'paneer', hindi: 'पनीर', english: ['cottage cheese'] },
  { roman: 'makkhan', hindi: 'मक्खन', english: ['butter'] },
  { roman: 'biskut', hindi: 'बिस्कुट', english: ['biscuit', 'cookies', 'parle-g'] },
  { roman: 'biscuit', hindi: 'बिस्कुट', english: ['biscuit'] },
  { roman: 'sabun', hindi: 'साबुन', english: ['soap', 'detergent', 'lifebuoy', 'lux'] },
  { roman: 'tel', hindi: 'तेल', english: ['oil', 'shampoo'] },

  // Hardware, Electrical & Mobile
  { roman: 'keel', hindi: 'कील', english: ['nail', 'screw', 'fastener'] },
  { roman: 'loha', hindi: 'लोहा', english: ['iron', 'steel', 'hardware'] },
  { roman: 'taar', hindi: 'तार', english: ['wire', 'cable'] },
  { roman: 'pankha', hindi: 'पंखा', english: ['fan', 'ceiling fan'] },
  { roman: 'katori', hindi: 'कटोरी', english: ['bowl'] },
  { roman: 'tala', hindi: 'ताला', english: ['lock', 'padlock'] },
  { roman: 'chabi', hindi: 'चाबी', english: ['key'] },
  { roman: 'kanta', hindi: 'कांटा', english: ['scale', 'weighing scale'] },
  { roman: 'chammach', hindi: 'चम्मच', english: ['spoon'] },
  { roman: 'jhadoo', hindi: 'झाड़ू', english: ['broom'] },
  { roman: 'dawa', hindi: 'दवा', english: ['medicine', 'tablet', 'syrup'] },
  { roman: 'patti', hindi: 'पट्टी', english: ['bandage', 'strip'] },
  { roman: 'kapda', hindi: 'कपड़ा', english: ['cloth', 'fabric', 'dress', 'shirt'] },
  { roman: 'chappal', hindi: 'चप्पल', english: ['slipper', 'sandals', 'footwear'] },
  { roman: 'joota', hindi: 'जूता', english: ['shoes', 'footwear'] },
];

/**
 * Searches if a product matches a search term across English, Hindi, and Roman transliterations
 */
export function matchProductSearch(
  productName: string,
  searchQuery: string,
  category?: string,
  customAliases?: RomanHindiAlias[]
): boolean {
  if (!searchQuery || !searchQuery.trim()) return true;

  const q = searchQuery.trim().toLowerCase();
  const name = productName.toLowerCase();
  const cat = (category || '').toLowerCase();

  // 1. Direct substring match on product name or category
  if (name.includes(q) || cat.includes(q)) return true;

  // 2. Check Roman-Hindi aliases
  const aliases = [...DEFAULT_ROMAN_HINDI_ALIASES, ...(customAliases || [])];
  for (const alias of aliases) {
    // If user searched for the Roman keyword (e.g. "chawal")
    if (alias.roman.includes(q) || q.includes(alias.roman)) {
      // Check if product contains any matching English word or Hindi text
      if (name.includes(alias.hindi.toLowerCase())) return true;
      for (const eng of alias.english) {
        if (name.includes(eng.toLowerCase()) || cat.includes(eng.toLowerCase())) {
          return true;
        }
      }
    }

    // If user typed Hindi (e.g. "चावल")
    if (alias.hindi.includes(q) && alias.english.some(eng => name.includes(eng))) {
      return true;
    }
  }

  // 3. Simple fuzzy token matching
  const queryTokens = q.split(/\s+/).filter(Boolean);
  const matchAllTokens = queryTokens.every(tok => name.includes(tok) || cat.includes(tok));
  return matchAllTokens;
}

/**
 * Computes Levenshtein Distance for duplicate product warning detection
 */
export function getLevenshteinDistance(a: string, b: string): number {
  const s1 = a.trim().toLowerCase();
  const s2 = b.trim().toLowerCase();

  const dp: number[][] = Array.from({ length: s1.length + 1 }, () =>
    Array(s2.length + 1).fill(0)
  );

  for (let i = 0; i <= s1.length; i++) dp[i][0] = i;
  for (let j = 0; j <= s2.length; j++) dp[0][j] = j;

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[s1.length][s2.length];
}

/**
 * Checks if a candidate name is very similar to an existing product name
 */
export function findSimilarProduct(
  candidateName: string,
  existingNames: string[]
): string | null {
  const normCandidate = candidateName.trim().toLowerCase();
  if (normCandidate.length < 3) return null;

  for (const name of existingNames) {
    const norm = name.trim().toLowerCase();
    if (norm === normCandidate) return name; // exact match
    const dist = getLevenshteinDistance(normCandidate, norm);
    // If difference is 1 or 2 edits on names with length >= 4
    if (dist <= 2 && Math.min(normCandidate.length, norm.length) >= 4) {
      return name;
    }
  }
  return null;
}
