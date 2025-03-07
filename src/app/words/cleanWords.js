const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Load the words from words.json
const words = require('./words.json');

// Sleep function to introduce delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Ensure the words directory exists
const wordsDir = path.join(__dirname, 'words');
if (!fs.existsSync(wordsDir)) {
  fs.mkdirSync(wordsDir, { recursive: true });
}

// Paths for JSON files
const cleanedWordsPath = path.join(wordsDir, 'cleanedWords.json');
const invalidWordsPath = path.join(wordsDir, 'invalidWords.json');

async function fetchWord(word) {
  try {
    const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    if (response.data && response.data.length > 0) {
      return true; // Word exists
    }
    return false; // Word doesn't exist
  } catch (error) {
    if (error.response && error.response.status === 429) {
      console.warn(`Rate limited on word: ${word}, adding to retry list.`);
      return "retry"; // Mark for retrying
    }
    console.error(`Error fetching word: ${word}`, error.message);
    return false; // Word doesn't exist
  }
}

async function cleanWords(wordList) {
  const validWords = [];
  const invalidWords = [];
  let retryWords = [...wordList]; // Start with the full list

  while (retryWords.length > 0) {
    const nextRetry = [];
    
    console.log(`Processing ${retryWords.length} words...`);

    for (const word of retryWords) {
      const result = await fetchWord(word);
      if (result === true) {
        validWords.push(word);
      } else if (result === "retry") {
        nextRetry.push(word); // Keep in the retry list
      } else {
        invalidWords.push(word);
      }

      await sleep(200); // Adjust delay to avoid hitting limits
    }

    // Save the current progress
    fs.writeFileSync(cleanedWordsPath, JSON.stringify(validWords, null, 2));
    fs.writeFileSync(invalidWordsPath, JSON.stringify(invalidWords, null, 2));

    if (nextRetry.length > 0) {
      console.log(`Rate limit hit. Retrying ${nextRetry.length} words after 10 seconds...`);
      await sleep(200); // Wait before retrying to avoid further rate limits
    }
    
    retryWords = nextRetry; // Update the list of words to retry
  }

  console.log("All words processed!");
}

// Run the cleanup process
cleanWords(words);
