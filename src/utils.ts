import type { DataItem } from "./types";

export const debounce = <Args extends unknown[], Return>(
  func: (...args: Args) => Return,
  delay: number,
): ((...args: Args) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Args) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

export const levenshteinDistance = (str1: string, str2: string): number => {
  const len1 = str1.length;
  const len2 = str2.length;

  // Create a matrix to store distances
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  // Initialize first column and row
  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  // Fill in the rest of the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost, // substitution
      );
    }
  }

  return matrix[len1][len2];
};

export const toLatin = (str: string, normalise: boolean = true): string => {
  const mongolToLatin: { [key: string]: string } = {
    // Vowels (normalized)
    ᠠ: "a",
    ᠡ: "e",
    ᠢ: "i",
    ᠣ: "o",
    ᠤ: normalise ? "o" : "u", // u → o
    ᠥ: "ö",
    ᠦ: normalise ? "ö" : "ü", // ü → ö

    // Consonants
    ᠨ: "n",
    ᠩ: "ng",
    ᠪ: "b",
    ᠫ: "p",
    ᠬ: "q",
    ᠭ: "g",
    ᠮ: "m",
    ᠯ: "l",
    ᠰ: "s",
    ᠱ: "š",
    ᠲ: normalise ? "d" : "t", // initial/medial T → d
    ᠳ: "d", // D → d
    ᠴ: "č",
    ᠵ: "j",
    ᠶ: "y",
    ᠷ: "r",
    ᠸ: "w",
    ᠹ: "f",
    ᠺ: "k",
    ᠻ: "k",
    ᠼ: "c",
    ᠽ: "z",
    ᠾ: "h",
    ᠿ: "ž",
    ᡀ: "č",
    ᡁ: "r",
    ᡂ: "w",
    // Special characters
    "᠊": normalise ? "" : "᠊", // FVS (Free Variation Selector) - strip if normalise
    "᠋": normalise ? "" : "᠋", // FVS - strip if normalise
    "᠌": normalise ? "" : "᠌", // FVS - strip if normalise
    "᠍": normalise ? "" : "᠍", // FVS - strip if normalise
    " ": " ",
    "᠎": normalise ? "" : " ", // Mongolian vowel separator - strip if normalise
    "᠏": "0",
    "᠐": "0",
    "᠑": "1",
    "᠒": "2",
    "᠓": "3",
    "᠔": "4",
    "᠕": "5",
    "᠖": "6",
    "᠗": "7",
    "᠘": "8",
    "᠙": "9",
  };

  let result = str
    ?.split("")
    .map((char) => mongolToLatin[char] || char)
    .join("");

  // Handle initial GE → HE
  if (normalise) {
    result = result?.replace(/^ge/i, "he");
    result = result?.replace(/\sge/gi, " he");
    result = result?.replace(/([a-zöüčšž])ge/gi, "$1he");

    result = result?.replace(/^qe/i, "he"); // - for initial qe → he
    result = result?.replace(/\sqe/gi, " he"); // - for qe after a space → he
    result = result?.replace(/([a-zöüčšž])qe/gi, "$1he"); // Medial qe → he
  }

  return result;
};

// Updated fuzzy search function that searches both Cyrillic and Mongolian script
export const fuzzySearchTolgoiUg = (
  searchTerm: string,
  maxDistance: number = 3,
): ((item: DataItem) => boolean) => {
  const normalizedSearch = searchTerm?.toLowerCase() || "";
  const isLatin = /^[a-z\söüčšž]+$/i.test(searchTerm); // Check if search is in Latin

  return function (item: DataItem): boolean {
    const searchableTextCyrillic = item.tolgoi_ug.toLowerCase() || "";
    const searchableTextMongol =
      toLatin(item.tolgoi_ug_hudam)?.toLowerCase() || "";

    // For Cyrillic search
    if (!isLatin) {
      if (searchableTextCyrillic.includes(normalizedSearch)) {
        return true;
      }
      const distance = levenshteinDistance(
        normalizedSearch,
        searchableTextCyrillic,
      );
      return distance <= maxDistance;
    }

    // For Latin search - search through Mongolian script
    if (searchableTextMongol.includes(normalizedSearch)) {
      return true;
    }
    const distance = levenshteinDistance(
      normalizedSearch,
      searchableTextMongol,
    );
    return distance <= maxDistance;
  };
};

export const sorter = (searchValue: string) => (a: DataItem, b: DataItem) => {
  const searchLower = searchValue.toLowerCase();
  const isLatin = /^[a-z\söüčšž]+$/i.test(searchValue);

  // Choose which text to compare based on search type
  const aText = isLatin
    ? toLatin(a.tolgoi_ug_hudam)?.toLowerCase() || ""
    : a.tolgoi_ug.toLowerCase();
  const bText = isLatin
    ? toLatin(b.tolgoi_ug_hudam)?.toLowerCase() || ""
    : b.tolgoi_ug.toLowerCase();

  // 1. Exact match (highest priority)
  if (aText === searchLower && bText !== searchLower) return -1;
  if (aText !== searchLower && bText === searchLower) return 1;

  // 2. Starts with search term (second priority)
  const aStartsWith = aText.startsWith(searchLower);
  const bStartsWith = bText.startsWith(searchLower);

  if (aStartsWith && !bStartsWith) return -1;
  if (!aStartsWith && bStartsWith) return 1;

  // 3. Contains search term (third priority)
  const aContains = aText.includes(searchLower);
  const bContains = bText.includes(searchLower);

  if (aContains && !bContains) return -1;
  if (!aContains && bContains) return 1;

  // 4. Position of match (earlier is better)
  if (aContains && bContains) {
    const aIndex = aText.indexOf(searchLower);
    const bIndex = bText.indexOf(searchLower);
    if (aIndex !== bIndex) return aIndex - bIndex;
  }

  // 5. Same first character
  const searchFirstChar = searchLower.charAt(0);
  const aFirstChar = aText.charAt(0);
  const bFirstChar = bText.charAt(0);

  const aStartsWithChar = aFirstChar === searchFirstChar;
  const bStartsWithChar = bFirstChar === searchFirstChar;

  if (aStartsWithChar && !bStartsWithChar) return -1;
  if (!aStartsWithChar && bStartsWithChar) return 1;

  // 6. Levenshtein distance (closer match is better)
  const aDist = levenshteinDistance(searchLower, aText);
  const bDist = levenshteinDistance(searchLower, bText);

  if (aDist !== bDist) return aDist - bDist;

  // 7. Alphabetical sort
  return a.tolgoi_ug.localeCompare(b.tolgoi_ug, "mn-MN");
};
