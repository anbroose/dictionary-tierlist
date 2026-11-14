"use client";

import { useEffect, useState } from "react";
import { FaVolumeUp } from "react-icons/fa";
import styles from "./WordAudioButton.module.css";

type DictionaryPhonetic = {
  audio?: string;
};

type DictionaryEntry = {
  phonetics?: DictionaryPhonetic[];
};

export function WordAudioButton({ word }: { word: string }) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [audioFailed, setAudioFailed] = useState(false);

  useEffect(() => {
    let active = true;

    const shouldSkipWord =
      !word ||
      word === "Loading..." ||
      word === "No words found!" ||
      word === "Error loading word.";

    if (shouldSkipWord) {
      setAudioUrl(null);
      setAudioFailed(false);
      setIsLoading(false);
      return () => {
        active = false;
      };
    }

    async function loadAudio() {
      setIsLoading(true);

      try {
        const response = await fetch(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
        );
        const data = (await response.json()) as DictionaryEntry[];

        if (!active) return;

        const foundAudio =
          data?.[0]?.phonetics?.find(
            (phonetic) =>
              typeof phonetic.audio === "string" && phonetic.audio.trim() !== ""
          )?.audio ?? null;

        setAudioUrl(foundAudio);
        setAudioFailed(false);
      } catch {
        if (!active) return;
        setAudioUrl(null);
        setAudioFailed(false);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadAudio();

    return () => {
      active = false;
    };
  }, [word]);

  const handlePlay = () => {
    if (!word || word === "Loading...") return;

    const speakWithBrowserVoice = () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = "en-US";
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        return;
      }

      setIsSupported(false);
    };

    if (audioUrl && !audioFailed) {
      const audio = new Audio(audioUrl);
      audio
        .play()
        .then(() => {
          setIsSupported(true);
        })
        .catch(() => {
          setAudioFailed(true);
          speakWithBrowserVoice();
        });
      return;
    }

    speakWithBrowserVoice();
  };

  return (
    <button
      type="button"
      className={styles.audioButton}
      onClick={handlePlay}
      disabled={isLoading || !word || word === "Loading..."}
      title={
        isSupported ? "Play pronunciation" : "Speech is not supported in this browser"
      }
      aria-label={
        isLoading ? "Loading audio" : audioUrl && !audioFailed ? "Listen" : "Speak"
      }
    >
      <FaVolumeUp size={18} />
    </button>
  );
}
