/**
 * Unicode-safe Search, Normalization, and Collation Utilities
 */

export const UnicodeUtil = {
  /**
   * Normalize text for search index / fuzzy matching:
   * 1. NFD decomposition
   * 2. Strip combining diacritical marks (\u0300-\u036f)
   * 3. Strip Arabic harakat/tashkeel (\u064B-\u065F\u0670)
   * 4. Lowercase and trim
   */
  normalizeForSearch(text: string): string {
    if (!text || typeof text !== 'string') return '';
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Latin & Greek diacritics
      .replace(/[\u064B-\u065F\u0670]/g, '') // Arabic vowel marks
      .toLowerCase()
      .trim();
  },

  /**
   * Check if text matches query using Unicode-normalized search
   */
  containsSearchQuery(text: string, query: string): boolean {
    if (!text || !query) return false;
    const normalizedText = this.normalizeForSearch(text);
    const normalizedQuery = this.normalizeForSearch(query);
    return normalizedText.includes(normalizedQuery);
  },

  /**
   * Locale-aware string comparison using Intl.Collator
   */
  localeCompare(
    a: string,
    b: string,
    locale = 'en',
    options: Intl.CollatorOptions = { sensitivity: 'base', numeric: true },
  ): number {
    return new Intl.Collator(locale, options).compare(a, b);
  },

  /**
   * Deterministic locale-aware array sorting
   */
  localeSort<T>(
    items: T[],
    keySelector: (item: T) => string,
    locale = 'en',
    options: Intl.CollatorOptions = { sensitivity: 'base', numeric: true },
  ): T[] {
    const collator = new Intl.Collator(locale, options);
    return [...items].sort((a, b) => collator.compare(keySelector(a), keySelector(b)));
  },
};
