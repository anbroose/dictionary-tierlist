import type { MeaningGroup } from "../hooks/useDictionaryWord";
import styles from "../page.module.css";
import { WordAudioButton } from "./WordAudioButton";

type WordDetailsProps = {
  word: string;
  partOfSpeech: string;
  meaningGroups: MeaningGroup[];
  isLoading: boolean;
};

export function WordDetails({
  word,
  partOfSpeech,
  meaningGroups,
  isLoading,
}: WordDetailsProps) {
  return (
    <>
      <div className={styles.wordHeader}>
        <p className={styles.dictionaryWord}>{word}</p>
      </div>

      <div className={styles.wordAndDefinition}>
        <div className={styles.wordInfo}>
          <p className={styles.partOfSpeech}>{partOfSpeech}</p>

          {isLoading ? (
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
    </>
  );
}
