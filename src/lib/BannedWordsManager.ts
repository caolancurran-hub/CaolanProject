export interface BannedWord {
  word: string;
  alternatives: string[];
  category: string;
}

export interface TextMatch {
  word: string;
  position: number;
  length: number;
  alternatives: string[];
  selectedAlternative: string;
}

class BannedWordsManager {
  private static instance: BannedWordsManager;
  private bannedWords: BannedWord[] = [];

  private constructor() {
    this.loadBannedWords();
  }

  static getInstance(): BannedWordsManager {
    if (!BannedWordsManager.instance) {
      BannedWordsManager.instance = new BannedWordsManager();
    }
    return BannedWordsManager.instance;
  }

  private loadBannedWords(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('textChecker_bannedWords');
        if (stored) {
          this.bannedWords = JSON.parse(stored);
          return;
        }
      } catch (error) {
        console.warn('Failed to load banned words from localStorage:', error);
      }
    }

    // Fallback to default list if localStorage unavailable or empty
    import('../data/defaultBannedWords').then(module => {
      this.bannedWords = module.defaultBannedWords;
      this.saveBannedWords();
    }).catch((error) => {
      console.error('Failed to load default banned words:', error);
      // Set some basic default words if import fails
      this.bannedWords = [
        { word: "damn", alternatives: ["darn", "drat", "blast"], category: "profanity" },
        { word: "hell", alternatives: ["heck", "gosh", "goodness"], category: "profanity" },
        { word: "crap", alternatives: ["junk", "stuff", "mess"], category: "profanity" },
        { word: "ass", alternatives: ["donkey", "rear", "backside"], category: "profanity" },
        { word: "bitch", alternatives: ["person", "individual", "complainer"], category: "profanity" },
        { word: "fuck", alternatives: ["intensify", "emphasize", "replace"], category: "profanity" },
        { word: "shit", alternatives: ["stuff", "mess", "excrement"], category: "profanity" }
      ];
      this.saveBannedWords();
    });
  }

  private saveBannedWords(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('textChecker_bannedWords', JSON.stringify(this.bannedWords));
      } catch (error) {
        console.warn('Failed to save banned words to localStorage:', error);
      }
    }
  }

  checkText(text: string): TextMatch[] {
    const matches: TextMatch[] = [];
    const lowerText = text.toLowerCase();

    for (const bannedWord of this.bannedWords) {
      const bannedLower = bannedWord.word.toLowerCase();
      let startIndex = 0;

      while (true) {
        const index = lowerText.indexOf(bannedLower, startIndex);
        if (index === -1) break;

        const selectedAlternative = bannedWord.alternatives[0] || '';

        matches.push({
          word: bannedWord.word,
          position: index,
          length: bannedWord.word.length,
          alternatives: bannedWord.alternatives,
          selectedAlternative
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
    const nonOverlappingMatches: TextMatch[] = [];
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

  getAlternatives(word: string): string[] {
    const bannedWord = this.bannedWords.find(bw => bw.word.toLowerCase() === word.toLowerCase());
    return bannedWord ? bannedWord.alternatives : [];
  }

  processText(text: string, selections: Map<string, string>): string {
    const matches = this.checkText(text);
    let processedText = text;

    // Process from end to beginning to maintain position accuracy
    const sortedMatches = [...matches].sort((a, b) => b.position - a.position);

    for (const match of sortedMatches) {
      const replacement = selections.get(match.word) || match.selectedAlternative;
      processedText = processedText.slice(0, match.position) +
                     replacement +
                     processedText.slice(match.position + match.length);
    }

    return processedText;
  }

  updateBannedWord(word: string, alternatives: string[], category: string): void {
    const existingIndex = this.bannedWords.findIndex(bw => bw.word.toLowerCase() === word.toLowerCase());

    if (existingIndex >= 0) {
      this.bannedWords[existingIndex] = { word, alternatives, category };
    } else {
      this.bannedWords.push({ word, alternatives, category });
    }

    this.saveBannedWords();
  }

  deleteBannedWord(word: string): void {
    this.bannedWords = this.bannedWords.filter(bw => bw.word.toLowerCase() !== word.toLowerCase());
    this.saveBannedWords();
  }

  addBannedWord(word: string, alternatives: string[], category: string): void {
    if (!this.bannedWords.some(bw => bw.word.toLowerCase() === word.toLowerCase())) {
      this.bannedWords.push({ word, alternatives, category });
      this.saveBannedWords();
    }
  }

  getAllBannedWords(): BannedWord[] {
    return [...this.bannedWords];
  }

  setBannedWords(words: BannedWord[]): void {
    this.bannedWords = [...words];
    this.saveBannedWords();
  }

  // Admin password management
  setAdminPassword(password: string): void {
    if (typeof window !== 'undefined') {
      try {
        const hashedPassword = btoa(password); // Basic encoding for client-side storage
        localStorage.setItem('textChecker_adminPassword', hashedPassword);
      } catch (error) {
        console.warn('Failed to save admin password:', error);
      }
    }
  }

  verifyAdminPassword(password: string): boolean {
    if (typeof window !== 'undefined') {
      try {
        const storedPassword = localStorage.getItem('textChecker_adminPassword');
        if (!storedPassword) return false;
        return btoa(password) === storedPassword;
      } catch (error) {
        console.warn('Failed to verify admin password:', error);
        return false;
      }
    }
    return false;
  }
}

export default BannedWordsManager;