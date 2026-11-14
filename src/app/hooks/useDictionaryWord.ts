import { useEffect, useRef, useState } from "react";

export type MeaningGroup = {
  partOfSpeech: string;
  definitions: string[];
};

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

export function useDictionaryWord(selectedWord: string | null) {
  const requestId = useRef(0);
  const [word, setWord] = useState("Loading...");
  const [partOfSpeech, setPartOfSpeech] = useState("Loading...");
  const [meaningGroups, setMeaningGroups] = useState<MeaningGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (selectedWord === null) return;

    const currentRequestId = ++requestId.current;
    setIsLoading(true);
    setWord("Loading...");
    setPartOfSpeech("Loading...");
    setMeaningGroups([]);

    async function fetchWord() {
      try {
        const response = await fetch(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${selectedWord}`
        );
        const data = (await response.json()) as DictionaryEntry[];

        if (currentRequestId !== requestId.current) return;

        if (data && data.length > 0) {
          const groups =
            data[0].meanings?.reduce<MeaningGroup[]>((acc, meaning) => {
              const partOfSpeech = meaning.partOfSpeech || "Unknown";
              const uniqueDefinitions = [
                ...new Set(
                  (meaning.definitions ?? [])
                    .map((definition) => definition.definition)
                    .filter(
                      (definition): definition is string => Boolean(definition)
                    )
                    .slice(0, 2)
                ),
              ];

              if (uniqueDefinitions.length === 0) return acc;

              const existingGroup = acc.find(
                (group) => group.partOfSpeech === partOfSpeech
              );

              if (existingGroup) {
                existingGroup.definitions = [
                  ...new Set([
                    ...existingGroup.definitions,
                    ...uniqueDefinitions,
                  ]),
                ].slice(0, 2);
              } else {
                acc.push({ partOfSpeech, definitions: uniqueDefinitions });
              }

              return acc;
            }, []) ?? [];

          const formattedGroups =
            groups.length > 0
              ? groups
              : [
                  {
                    partOfSpeech: "Unknown",
                    definitions: ["No definition available."],
                  },
                ];

          setWord(data[0].word || "Unknown word");
          setPartOfSpeech(
            formattedGroups
              .map((group) => group.partOfSpeech)
              .filter(Boolean)
              .join(", ") || "Unknown"
          );
          setMeaningGroups(formattedGroups);
        } else {
          setWord("No words found!");
          setPartOfSpeech("Unknown");
          setMeaningGroups([]);
        }
      } catch (error) {
        if (currentRequestId !== requestId.current) return;
        setWord("Error loading word.");
        setPartOfSpeech("Unknown");
        setMeaningGroups([]);
        console.log(error);
      } finally {
        if (currentRequestId === requestId.current) {
          setIsLoading(false);
        }
      }
    }

    fetchWord();
  }, [selectedWord]);

  return { word, partOfSpeech, meaningGroups, isLoading };
}
