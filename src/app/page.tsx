"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./page.module.css";
import rawWords from "./words/randomized_words.json";
import { FaArrowLeft } from "react-icons/fa";
import { FinalTierList } from "./components/FinalTierList";
import { WordAudioButton } from "./components/WordAudioButton";

const words: string[] = rawWords as string[];

type DictionaryDefinition = {
  definition?: string;
};

type DictionaryMeaning = {
  partOfSpeech?: string;
  definitions?: DictionaryDefinition[];
};

type DictionaryEntry = {
  word?: string;
  meanings?: DictionaryMeaning[];
};

export default function Home() {
  const fetchRequestId = useRef(0);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [word, setWord] = useState("Loading...");
  const [pos, setPOS] = useState("Loading...");
  const [meaningGroups, setMeaningGroups] = useState<
    { partOfSpeech: string; definitions: string[] }[]
  >([]);
  const [isWordLoading, setIsWordLoading] = useState(true);
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const [rankings, setRankings] = useState<{ [key: string]: string }>({}); // Keep rankings here
  const [prevWord, setPrevWord] = useState<string | null>(null);
  const [prevRank, setPrevRank] = useState<string | null>(null);
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
    const savedHistory = localStorage.getItem("history");

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

    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem("history", JSON.stringify(history));
    }
  }, [history, loading]);

  useEffect(() => {
    if (currentIndex !== null && !loading) {
      fetchWord(words[currentIndex]);
    }
  }, [currentIndex, loading]);

  async function fetchWord(word: string) {
    const requestId = ++fetchRequestId.current;

    setIsWordLoading(true);
    setWord("Loading...");
    setPOS("Loading...");
    setMeaningGroups([]);

    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
      );
      const data = (await response.json()) as DictionaryEntry[];

      if (requestId !== fetchRequestId.current) return;

      if (data && data.length > 0) {
        const groups =
          data[0].meanings?.reduce<{ partOfSpeech: string; definitions: string[] }[]>(
            (acc, meaning) => {
              const partOfSpeech = meaning.partOfSpeech || "Unknown";
              const uniqueDefinitions = [...new Set(
                (meaning.definitions ?? [])
                  .map((definition) => definition.definition)
                  .filter((definition): definition is string => Boolean(definition))
                  .slice(0, 2)
              )];

              if (uniqueDefinitions.length === 0) return acc;

              const existingGroup = acc.find(
                (group) => group.partOfSpeech === partOfSpeech
              );

              if (existingGroup) {
                existingGroup.definitions = [
                  ...new Set([...existingGroup.definitions, ...uniqueDefinitions]),
                ].slice(0, 2);
              } else {
                acc.push({ partOfSpeech, definitions: uniqueDefinitions });
              }

              return acc;
            },
            []
          ) ?? [];

        const formattedGroups =
          groups.length > 0
            ? groups
            : [{ partOfSpeech: "Unknown", definitions: ["No definition available."] }];

        setWord(data[0].word || "Unknown word");
        setPOS(
          formattedGroups
            .map((group) => group.partOfSpeech)
            .filter(Boolean)
            .join(", ") || "Unknown"
        );
        setMeaningGroups(formattedGroups);
      } else {
        setWord("No words found!");
        setPOS("Unknown");
        setMeaningGroups([]);
      }
    } catch (error) {
      if (requestId !== fetchRequestId.current) return;
      setWord("Error loading word.");
      setPOS("Unknown");
      setMeaningGroups([]);
      console.log(error);
    } finally {
      if (requestId === fetchRequestId.current) {
        setIsWordLoading(false);
      }
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

  // Check if all words have been ranked
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
        <div className={styles.wordHeader}>
          <p className={styles.dictionaryWord}>{word}</p>
        </div>

        <div className={styles.wordAndDefinition}>
          <div className={styles.wordInfo}>
            <p className={styles.partOfSpeech}>{pos}</p>

            {isWordLoading ? (
              <p className={styles.definition}>Fetching definition...</p>
            ) : meaningGroups.length > 0 ? (
              meaningGroups.map((group, groupIndex) => (
                <div
                  key={`${group.partOfSpeech}-${groupIndex}`}
                  className={styles.meaningGroup}
                >
                  <p className={styles.partOfSpeechLabel}>{group.partOfSpeech}</p>
                  <ul className={styles.definitionList}>
                    {group.definitions.map((definition, index) => (
                      <li
                        key={`${group.partOfSpeech}-${groupIndex}-${definition}-${index}`}
                        className={styles.definition}
                      >
                        {definition}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <p className={styles.definition}>No definition available.</p>
            )}
          </div>

          <WordAudioButton word={word} />
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
        {/* <FinalTierList rankings={rankings} /> */}
        {allRanked && <FinalTierList rankings={rankings} />}
      </main>
    </div>
  );
}
