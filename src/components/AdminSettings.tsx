'use client';

import React, { useState, useEffect } from 'react';
import BannedWordsManager, { BannedWord } from '../lib/BannedWordsManager';

interface AdminSettingsProps {
  onClose: () => void;
  bannedWordsManager: BannedWordsManager;
}

export default function AdminSettings({ onClose, bannedWordsManager }: AdminSettingsProps) {
  const [bannedWords, setBannedWords] = useState<BannedWord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingWord, setEditingWord] = useState<BannedWord | null>(null);
  const [formData, setFormData] = useState({
    word: '',
    alternatives: '',
    category: 'profanity'
  });
  const [importData, setImportData] = useState('');
  const [showImport, setShowImport] = useState(false);

  const categories = ['all', 'profanity', 'slurs', 'offensive', 'inappropriate', 'other'];

  useEffect(() => {
    loadBannedWords();
  }, []);

  const loadBannedWords = () => {
    setBannedWords(bannedWordsManager.getAllBannedWords());
  };

  const filteredWords = bannedWords.filter(word => {
    const matchesSearch = word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         word.alternatives.some(alt => alt.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || word.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddWord = () => {
    if (formData.word && formData.alternatives) {
      const alternatives = formData.alternatives.split(',').map(alt => alt.trim()).filter(alt => alt);
      bannedWordsManager.addBannedWord(formData.word, alternatives, formData.category);
      loadBannedWords();
      setFormData({ word: '', alternatives: '', category: 'profanity' });
      setShowAddForm(false);
    }
  };

  const handleEditWord = (word: BannedWord) => {
    setEditingWord(word);
    setFormData({
      word: word.word,
      alternatives: word.alternatives.join(', '),
      category: word.category
    });
    setShowAddForm(true);
  };

  const handleUpdateWord = () => {
    if (editingWord && formData.word && formData.alternatives) {
      const alternatives = formData.alternatives.split(',').map(alt => alt.trim()).filter(alt => alt);
      bannedWordsManager.updateBannedWord(formData.word, alternatives, formData.category);
      loadBannedWords();
      setFormData({ word: '', alternatives: '', category: 'profanity' });
      setEditingWord(null);
      setShowAddForm(false);
    }
  };

  const handleDeleteWord = (word: string) => {
    if (confirm(`Are you sure you want to delete "${word}"?`)) {
      bannedWordsManager.deleteBannedWord(word);
      loadBannedWords();
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(bannedWords, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'banned-words.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = () => {
    try {
      const importedWords = JSON.parse(importData);
      if (Array.isArray(importedWords)) {
        bannedWordsManager.setBannedWords(importedWords);
        loadBannedWords();
        setImportData('');
        setShowImport(false);
        alert('Words imported successfully!');
      } else {
        alert('Invalid format. Please provide a valid JSON array.');
      }
    } catch (error) {
      alert('Error importing data. Please check the format.');
    }
  };

  const handleSubmit = () => {
    if (editingWord) {
      handleUpdateWord();
    } else {
      handleAddWord();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-black dark:text-white">
            Admin Settings - Banned Words Management
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Search and Filter */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search words or alternatives..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="mb-6 flex flex-wrap gap-3">
            <button
              onClick={() => {
                setEditingWord(null);
                setFormData({ word: '', alternatives: '', category: 'profanity' });
                setShowAddForm(true);
              }}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Add New Word
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
            >
              Export List
            </button>
            <button
              onClick={() => setShowImport(!showImport)}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
            >
              Import List
            </button>
            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              Total words: {filteredWords.length}
            </div>
          </div>

          {/* Import Section */}
          {showImport && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-black dark:text-white">Import Words</h3>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="Paste JSON array of banned words here..."
                className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white font-mono text-sm"
              />
              <div className="mt-3 flex gap-3">
                <button
                  onClick={handleImport}
                  disabled={!importData}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Import
                </button>
                <button
                  onClick={() => {
                    setShowImport(false);
                    setImportData('');
                  }}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-black dark:text-white">
                {editingWord ? 'Edit Word' : 'Add New Word'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Word
                  </label>
                  <input
                    type="text"
                    value={formData.word}
                    onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Alternatives (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.alternatives}
                    onChange={(e) => setFormData({ ...formData, alternatives: e.target.value })}
                    placeholder="alternative1, alternative2, alternative3"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="profanity">Profanity</option>
                    <option value="slurs">Slurs</option>
                    <option value="offensive">Offensive</option>
                    <option value="inappropriate">Inappropriate</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                  >
                    {editingWord ? 'Update' : 'Add'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingWord(null);
                      setFormData({ word: '', alternatives: '', category: 'profanity' });
                    }}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Words Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left p-3 font-semibold text-black dark:text-white">Word</th>
                  <th className="text-left p-3 font-semibold text-black dark:text-white">Alternatives</th>
                  <th className="text-left p-3 font-semibold text-black dark:text-white">Category</th>
                  <th className="text-left p-3 font-semibold text-black dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWords.map((bannedWord, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="p-3 font-medium text-black dark:text-white">{bannedWord.word}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {bannedWord.alternatives.slice(0, 3).map((alt, altIndex) => (
                          <span
                            key={altIndex}
                            className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded"
                          >
                            {alt}
                          </span>
                        ))}
                        {bannedWord.alternatives.length > 3 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            +{bannedWord.alternatives.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded">
                        {bannedWord.category}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditWord(bannedWord)}
                          className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm rounded font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteWord(bannedWord.word)}
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredWords.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No words found matching your search criteria.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}