'use client';

import React, { useState, useEffect, useCallback } from 'react';
import BannedWordsManager, { TextMatch } from '../lib/BannedWordsManager';

export default function TextChecker() {
  const [inputText, setInputText] = useState('');
  const [processedText, setProcessedText] = useState('');
  const [matches, setMatches] = useState<TextMatch[]>([]);
  const [selectedAlternatives, setSelectedAlternatives] = useState<Map<string, string>>(new Map());
  const [copySuccess, setCopySuccess] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [debouncedInput, setDebouncedInput] = useState('');

  const bannedWordsManager = BannedWordsManager.getInstance();

  // Debounce input processing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedInput(inputText);
    }, 300);

    return () => clearTimeout(timer);
  }, [inputText]);

  // Process text when debounced input changes
  useEffect(() => {
    if (debouncedInput) {
      processText(debouncedInput);
    } else {
      setMatches([]);
      setProcessedText('');
      setSelectedAlternatives(new Map());
    }
  }, [debouncedInput]);

  const processText = useCallback((text: string) => {
    const textMatches = bannedWordsManager.checkText(text);
    setMatches(textMatches);

    // Initialize selections with first alternatives
    const newSelections = new Map<string, string>();
    textMatches.forEach(match => {
      const key = `${match.word}-${match.position}`;
      if (!selectedAlternatives.has(key)) {
        newSelections.set(key, match.selectedAlternative);
      }
    });

    const mergedSelections = new Map([...selectedAlternatives, ...newSelections]);
    setSelectedAlternatives(mergedSelections);

    const processed = bannedWordsManager.processText(text, mergedSelections);
    setProcessedText(processed);
  }, [bannedWordsManager, selectedAlternatives]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  const handleAlternativeChange = (matchKey: string, alternative: string) => {
    const newSelections = new Map(selectedAlternatives);
    newSelections.set(matchKey, alternative);
    setSelectedAlternatives(newSelections);

    // Re-process text with new selection
    const processed = bannedWordsManager.processText(inputText, newSelections);
    setProcessedText(processed);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(processedText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const renderHighlightedText = () => {
    if (!inputText || matches.length === 0) {
      return inputText;
    }

    const segments: JSX.Element[] = [];
    let lastIndex = 0;

    matches.forEach((match) => {
      // Add text before the match
      if (match.position > lastIndex) {
        segments.push(
          <span key={`text-${lastIndex}`}>
            {inputText.slice(lastIndex, match.position)}
          </span>
        );
      }

      // Add highlighted match
      const matchedText = inputText.slice(match.position, match.position + match.length);
      segments.push(
        <span
          key={`highlight-${match.position}`}
          className="bg-red-200 text-red-800 px-1 rounded"
          title={match.word}
        >
          {matchedText}
        </span>
      );

      lastIndex = match.position + match.length;
    });

    // Add remaining text
    if (lastIndex < inputText.length) {
      segments.push(
        <span key={`text-${lastIndex}`}>
          {inputText.slice(lastIndex)}
        </span>
      );
    }

    return segments;
  };

  const handleAdminAccess = () => {
    if (bannedWordsManager.verifyAdminPassword(adminPassword)) {
      setShowAdmin(true);
      setAdminError('');
      setAdminPassword('');
    } else {
      setAdminError('Invalid password');
    }
  };

  const handleAdminClose = () => {
    setShowAdmin(false);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-black dark:text-white">
          Text Checker
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">
              Original Text
            </h2>
            <textarea
              value={inputText}
              onChange={handleInputChange}
              placeholder="Enter your text here to check for banned words..."
              className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {matches.length > 0 && (
                <span>Found {matches.length} banned word{matches.length !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">
              Cleaned Text
            </h2>
            <div className="relative">
              <textarea
                value={processedText}
                readOnly
                placeholder="Cleaned text will appear here..."
                className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-gray-50 dark:bg-gray-800 text-black dark:text-white"
              />
              {matches.length > 0 && (
                <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Alternative words selected:
                  </p>
                  {matches.map((match, index) => {
                    const matchKey = `${match.word}-${match.position}`;
                    const selectedAlt = selectedAlternatives.get(matchKey) || match.selectedAlternative;

                    return (
                      <div key={matchKey} className="flex items-center space-x-2 text-sm">
                        <span className="font-medium text-red-600 dark:text-red-400">
                          {match.word}:
                        </span>
                        <select
                          value={selectedAlt}
                          onChange={(e) => handleAlternativeChange(matchKey, e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {match.alternatives.map((alt, altIndex) => (
                            <option key={altIndex} value={alt}>
                              {alt}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <button
              onClick={copyToClipboard}
              disabled={!processedText}
              className={`mt-4 w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                processedText
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
            </button>
          </div>
        </div>

        {/* Highlighted Text Display */}
        {matches.length > 0 && (
          <div className="mt-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">
              Highlighted Text
            </h2>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg min-h-[100px] text-black dark:text-white leading-relaxed">
              {renderHighlightedText()}
            </div>
          </div>
        )}

        {/* Admin Access */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowAdmin(!showAdmin)}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            Admin Settings
          </button>
        </div>

        {/* Admin Modal */}
        {showAdmin && !adminPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold mb-4 text-black dark:text-white">
                Admin Access
              </h3>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-2 bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {adminError && (
                <p className="text-red-500 text-sm mb-4">{adminError}</p>
              )}
              <div className="flex space-x-3">
                <button
                  onClick={handleAdminAccess}
                  className="flex-1 py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  Access
                </button>
                <button
                  onClick={() => {
                    setShowAdmin(false);
                    setAdminPassword('');
                    setAdminError('');
                  }}
                  className="flex-1 py-2 px-4 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-black dark:text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Admin Settings Component */}
        {showAdmin && adminPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-black dark:text-white">
                  Admin Settings
                </h3>
                <button
                  onClick={handleAdminClose}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Admin interface would go here. For now, this shows basic functionality.
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="font-semibold text-black dark:text-white mb-2">Statistics</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total banned words: {bannedWordsManager.getAllBannedWords().length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Words in current text: {matches.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}