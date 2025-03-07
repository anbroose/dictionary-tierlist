// components/FinalTierList.tsx
import styles from './FinalTierList.module.css';

interface FinalTierListProps {
  rankings: { [key: string]: string };
}

export const FinalTierList = ({ rankings }: FinalTierListProps) => {
  const groupedByTier = Object.entries(rankings).reduce((acc, [word, tier]) => {
    if (!acc[tier]) {
      acc[tier] = [];
    }
    acc[tier].push(word);
    return acc;
  }, {} as { [key: string]: string[] });

  return (
    <div className={styles.fullScreen}>
      <div className={styles.content}>
        <h2>All Words Ranked!</h2>
        <table className={styles.tierTable}>
          <tbody>
            {['S', 'A', 'B', 'C', 'D', 'E', 'F'].map((tier) => (
              <tr key={tier} className={styles[tier.toLowerCase()]}>
                <td className={styles.tierLetter}>{tier}</td>
                <td className={styles.tierWords}>
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
        <button className={styles.closeButton} onClick={() => window.location.reload()}>
          Start Over
        </button>
      </div>
    </div>
  );
};
