import { useState } from "react";
import styles from "./FinalTierList.module.css";

interface FinalTierListProps {
  rankings: { [key: string]: string };
}

export const FinalTierList = ({ rankings }: FinalTierListProps) => {
  const [isZoomedOut, setIsZoomedOut] = useState(false); // Track zoom state

  const groupedByTier = Object.entries(rankings).reduce((acc, [word, tier]) => {
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(word);
    return acc;
  }, {} as { [key: string]: string[] });

  const handleZoomOut = () => {
    setIsZoomedOut(true);
  };

  return (
    <div className={styles.fullScreen}>
      <div className={styles.content}>
        <h2>All Words Ranked!</h2>

        <table className={styles.tierTable}>
          <tbody>
            {["S", "A", "B", "C", "D", "E", "F"].map((tier) => (
              <tr key={tier} className={styles[tier.toLowerCase()]}>
                <td className={styles.tierLetter}>{tier}</td>
                <td
                  className={`${styles.tierWords} ${
                    isZoomedOut ? styles.zoomedOut : ""
                  }`}
                >
                  {groupedByTier[tier]?.map((word) => (
                    <div key={word} className={styles.rankItem}>
                      {word}
                    </div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.buttonContainer}>
          {!isZoomedOut && (
            <button className={styles.zoomButton} onClick={handleZoomOut}>
              Fit All Words
            </button>
          )}
          <button
            className={styles.closeButton}
            onClick={() => {
              localStorage.clear(); // Clears all local storage data
              window.location.reload(); // Reloads the page
            }}
          >
            Start Over
          </button>
        </div>
      </div>
    </div>
  );
};
