"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import rawWords from "./words/cleanedWords.json";
import { FaArrowLeft } from "react-icons/fa";
import { FinalTierList } from "./components/FinalTierList";

const words: string[] = rawWords as string[];

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [word, setWord] = useState("Loading...");
  const [pos, setPOS] = useState("Loading...");
  const [definition, setDefinition] = useState("Fetching definition...");
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const [rankedWords] = useState<string[]>([]); // No longer needed for preventing re-rating
  const [prevWord, setPrevWord] = useState<string | null>(null);
  const [prevRank, setPrevRank] = useState<string | null>(null);
  const [rankings, setRankings] = useState<{ [key: string]: string }>({});

  const [history, setHistory] = useState<number[]>([]); // Stack of previous indices

  const tierColors: { [key: string]: string } = {
    S: "#F3707B",
    A: "#F7916D",
    B: "#E2CB6D",
    C: "#8CF5A5",
    D: "#7DC7CD",
    E: "#7D86DA",
    F: "#7E66D9",
  };

  useEffect(() => {
    const savedIndex = localStorage.getItem("currentIndex");

    if (savedIndex !== null) {
      setCurrentIndex(parseInt(savedIndex, 10));
    } else {
      setCurrentIndex(0);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (currentIndex !== null && !loading) {
      fetchWord(words[currentIndex]);
    }
  }, [currentIndex, loading]);

  async function fetchWord(word: string) {
    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const firstMeaning = data[0].meanings[0];
        setWord(data[0].word);
        setPOS(firstMeaning?.partOfSpeech || "Unknown");
        setDefinition(
          firstMeaning?.definitions[0]?.definition || "No definition available."
        );
      } else {
        setWord("No words found!");
        setDefinition("");
      }
    } catch (error) {
      setWord("Error loading word.");
      setDefinition("");
      console.log(error);
    }
  }

  const handleTierClick = (tier: string) => {
    if (currentIndex === null) return;

    // Set the word's ranking regardless of whether it has been rated or not
    const newRankings = { ...rankings, [word]: tier };

    setRankings(newRankings);
    localStorage.setItem("rankings", JSON.stringify(newRankings));

    setPrevWord(word);
    setPrevRank(tier);
    setFlashColor(tierColors[tier]);
    setTimeout(() => setFlashColor(null), 500);

    // Save current index to history for going back
    if (currentIndex !== null) {
      setHistory((prev) => [...prev, currentIndex]);
    }

    // Go to the next word
    const newIndex = (currentIndex + 1) % words.length;
    setCurrentIndex(newIndex);
    localStorage.setItem("currentIndex", newIndex.toString());
  };

  const handlePreviousWord = () => {
    if (history.length === 0) return; // No previous word to go back to

    const lastIndex = history[history.length - 1]; // Get last visited index
    setHistory((prev) => prev.slice(0, -1)); // Remove last index from history
    setCurrentIndex(lastIndex);
    localStorage.setItem("currentIndex", lastIndex.toString());
  };

  // Sync prevWord and prevRank correctly whenever history changes
  useEffect(() => {
    if (history.length > 0) {
      const lastVisitedIndex = history[history.length - 1];
      setPrevWord(words[lastVisitedIndex]);
      setPrevRank(rankings[words[lastVisitedIndex]] || null);
    } else {
      setPrevWord(null);
      setPrevRank(null);
    }
  }, [history, rankings]);

  if (loading) return <div className={styles.loadingScreen}>Loading...</div>;

  return (
    <div
      style={{
        backgroundColor: flashColor || "white",
        transition: "background-color 0.3s ease-in-out",
      }}
    >
      <main className={styles.main}>
        <h2 className={styles.wordCount}>
          {currentIndex !== null ? currentIndex + 1 : "Loading"} /{" "}
          {words.length}
        </h2>
        <p className={styles.dictionaryWord}>{word}</p>

        <div className={styles.wordInfo}>
          <p className={styles.partOfSpeech}>{pos}</p>
          <p className={styles.definition}>{definition}</p>
        </div>

        <div className={styles.tierButtons}>
          {Object.keys(tierColors).map((tier) => (
            <button
              key={tier}
              className={`${styles.tier} ${styles[tier.toLowerCase()]}`}
              onClick={() => handleTierClick(tier)}
            >
              {tier}
            </button>
          ))}
        </div>

        <div className={styles.buttonContainer}>
          <button
            className={styles.previousButton}
            onClick={handlePreviousWord}
          >
            <FaArrowLeft
              style={{
                color: prevRank ? tierColors[prevRank] : "black",
                marginRight: "8px",
              }}
            />{" "}
            Previous Word
            {prevWord ? `:  ${prevWord}` : "--"}
          </button>
        </div>

        {rankedWords.length === words.length && (
          <FinalTierList rankings={rankings} />
        )}
      </main>
    </div>
  );
}
