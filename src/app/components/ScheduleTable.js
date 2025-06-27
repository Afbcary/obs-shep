import tstyles from './ScheduleTable.module.css';
import styles from './Tournament.module.css';

export default function ScheduleTable({ schedule, sortedDatetimes, sortedFields }) {

  const handleCopy = () => {
    const header = ['Field', ...sortedDatetimes].join('\t');

    const rows = sortedFields.map(field => {
      const rowData = sortedDatetimes.map(dt => schedule.get(field)?.get(dt) || '');
      return [field, ...rowData].join('\t');
    });

    const tsvData = [header, ...rows].join('\n');
    navigator.clipboard.writeText(tsvData);
  };
  if (!schedule || !sortedDatetimes || !sortedFields || schedule.size == 0 || sortedDatetimes.length == 0 || sortedFields.length == 0) {
    return <div className={styles.margin}>No field assignments found.</div>
  }

  return (
    <div className={styles.margin}>
      <button onClick={handleCopy} className={styles.button + ' ' + tstyles.button}>
        Copy Table to Clipboard
      </button>
      <div>
        <table>
          <thead>
            <tr>
              <th scope='col'>Field</th>
              {sortedDatetimes.map(dt => <th key={dt} scope='col'>{dt}</th>)}
            </tr>
          </thead>
          <tbody className={styles.tbody}>
            {sortedFields.map(field => (
              <tr key={field}>
                <th scope='row'>{field}</th>
                {sortedDatetimes.map(dt => {
                  const game = schedule.get(field)?.get(dt) || '';
                  return (
                    <td key={dt} className={styles.td}>
                      {game}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
