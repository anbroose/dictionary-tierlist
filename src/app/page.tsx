"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import rawWords from "./words/randomized_words.json";
import { FaArrowLeft } from "react-icons/fa";
import { FinalTierList } from "./components/FinalTierList";
import { WordDetails } from "./components/WordDetails";
import { useDictionaryWord } from "./hooks/useDictionaryWord";

const words: string[] = rawWords as string[];

const tierColors: Record<string, string> = {
  S: "#F3707B",
  A: "#F7916D",
  B: "#E2CB6D",
  C: "#8CF5A5",
  D: "#7DC7CD",
  E: "#7D86DA",
  F: "#7E66D9",
};

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const [rankings, setRankings] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<number[]>([]);
  const [showFinalTierList, setShowFinalTierList] = useState(false);
  const selectedWord =
    currentIndex !== null && !loading ? words[currentIndex] : null;
  const { word, partOfSpeech, meaningGroups, isLoading: isWordLoading } =
    useDictionaryWord(selectedWord);

  useEffect(() => {
    const savedIndex = localStorage.getItem("currentIndex");
    const savedHistory = localStorage.getItem("history");
    const savedRankings = localStorage.getItem("rankings");

    if (savedIndex !== null) {
      setCurrentIndex(parseInt(savedIndex, 10));
    } else {
      setCurrentIndex(0);
    }

    if (savedHistory !== null) {
      try {
        const parsedHistory: unknown = JSON.parse(savedHistory);
        if (Array.isArray(parsedHistory)) {
          setHistory(
            parsedHistory.filter(
              (index): index is number =>
                Number.isInteger(index) && index >= 0 && index < words.length
            )
          );
        }
      } catch (error) {
        console.error("Failed to parse saved word history:", error);
      }
    }

    if (savedRankings !== null) {
      try {
        const parsedRankings: unknown = JSON.parse(savedRankings);
        if (
          parsedRankings === null ||
          typeof parsedRankings !== "object" ||
          Array.isArray(parsedRankings)
        ) {
          throw new Error("Saved rankings must be an object.");
        }

        const restoredRankings: Record<string, string> = {};
        for (const [rankedWord, tier] of Object.entries(parsedRankings)) {
          if (
            words.includes(rankedWord) &&
            typeof tier === "string" &&
            Object.keys(tierColors).includes(tier)
          ) {
            restoredRankings[rankedWord] = tier;
          }
        }
        setRankings(restoredRankings);
      } catch (error) {
        console.error("Failed to parse saved rankings:", error);
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem("history", JSON.stringify(history));
    }
  }, [history, loading]);

  const handleTierClick = (tier: string) => {
    if (currentIndex === null) return;

    const newRankings = { ...rankings, [word]: tier };

    setRankings(newRankings);
    localStorage.setItem("rankings", JSON.stringify(newRankings));

    setFlashColor(tierColors[tier]);
    setTimeout(() => setFlashColor(null), 500);

    setHistory((prev) => [...prev, currentIndex]);

    const newIndex = (currentIndex + 1) % words.length;
    setCurrentIndex(newIndex);
    localStorage.setItem("currentIndex", newIndex.toString());
  };

  const handlePreviousWord = () => {
    if (history.length === 0) return;

    const lastIndex = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setCurrentIndex(lastIndex);
    localStorage.setItem("currentIndex", lastIndex.toString());
  };

  const prevWord =
    history.length > 0 ? words[history[history.length - 1]] : null;
  const prevRank = prevWord ? rankings[prevWord] || null : null;

  const allRanked = Object.keys(rankings).length === words.length;

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
        <WordDetails
          word={word}
          partOfSpeech={partOfSpeech}
          meaningGroups={meaningGroups}
          isLoading={isWordLoading}
        />

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
        {process.env.NODE_ENV === "development" && !allRanked && (
          <button
            className={styles.debugButton}
            onClick={() => setShowFinalTierList(true)}
          >
            Debug: Show Final Page
          </button>
        )}
        {(allRanked || showFinalTierList) && (
          <FinalTierList
            rankings={rankings}
            onClose={
              showFinalTierList
                ? () => setShowFinalTierList(false)
                : undefined
            }
          />
        )}
      </main>
    </div>
  );
}
