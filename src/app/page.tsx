"use client";
import { useState, useEffect } from "react";
import styles from "./page.module.css";
import rawWords from "./words/smallerwords.json";
import { FaArrowLeft } from "react-icons/fa";
import { FinalTierList } from "./components/FinalTierList";

const words: string[] = rawWords as string[];

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [word, setWord] = useState("Loading...");
  const [pos, setPOS] = useState("Loading...");
  const [definition, setDefinition] = useState("Fetching definition...");
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const [rankedWords, setRankedWords] = useState<string[]>([]);
  const [prevWord, setPrevWord] = useState<string | null>(null);
  const [prevRank, setPrevRank] = useState<string | null>(null);
  const [rankings, setRankings] = useState<{ [key: string]: string }>({});

  const tierColors: { [key: string]: string } = {
    S: "#F3707B",
    A: "#F7916D",
    B: "#E2CB6D",
    C: "#8CF5A5",
    D: "#7DC7CD",
    E: "#7D86DA",
    F: "#7E66D9",
  };

  const totalWords = words.length;

  useEffect(() => {
    fetchWord(words[currentIndex]);

    const savedRankings = localStorage.getItem("rankings");
    if (savedRankings) {
      setRankings(JSON.parse(savedRankings));
    }
  }, [currentIndex]);

  async function fetchWord(word: string) {
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      const data = await response.json();

      if (data && data.length > 0) {
        const firstMeaning = data[0].meanings[0];
        setWord(data[0].word);
        setPOS(firstMeaning?.partOfSpeech || "Unknown");
        setDefinition(firstMeaning?.definitions[0]?.definition || "No definition available.");
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
    // Prevent re-ranking of the same word
    if (rankedWords.includes(word)) return;

    setRankings((prevRankings) => {
      const newRankings = { ...prevRankings, [word]: tier };
      localStorage.setItem("rankings", JSON.stringify(newRankings));
      return newRankings;
    });

    // Store previous word and rank
    setPrevWord(word);
    setPrevRank(tier);
    setRankedWords((prev) => [...prev, word]);

    // Flash effect
    setFlashColor(tierColors[tier]);
    setTimeout(() => setFlashColor(null), 500);

    // Move to next word
    setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
  };

  const handlePreviousWord = () => {
    if (rankedWords.length > 0) {
      const lastWord = rankedWords[rankedWords.length - 1];
      setPrevWord(lastWord);
      setPrevRank(rankings[lastWord]);

      setRankedWords((prev) => prev.slice(0, -1));
      setCurrentIndex(words.indexOf(lastWord));
    }
  };

  // Debugging logs to check rankedWords and totalWords
  useEffect(() => {
    console.log("Ranked words count:", rankedWords.length);
    console.log("Total words count:", totalWords);
  }, [rankedWords, totalWords]);

  return (
    <div style={{ backgroundColor: flashColor || "white", transition: "background-color 0.3s ease-in-out" }}>
      <main className={styles.main}>
        <h2 className={styles.wordCount}>{currentIndex + 1} / {words.length}</h2>
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
            <FaArrowLeft style={{ color: prevRank ? tierColors[prevRank] : "black", marginRight: "8px" }} /> Previous Word 
            {prevWord ? `:  ${prevWord}` : "--"}
          </button>
        </div>
        {/* Show FinalTierList only when all words are rated */}
        {rankedWords.length === totalWords && (
          <FinalTierList rankings={rankings} />
        )}
      </main>
    </div>
  );
}
