'use client'

import { useState } from 'react'
import tstyles from './ScheduleTable.module.css';
import styles from './Tournament.module.css';

export default function ScheduleTable({ schedule, sortedDatetimes, sortedFields, eventNames, missingFieldGames, fieldConflicts }) {
  const [showFieldErrors, setShowFieldErrors] = useState(false);

  function handleShowFieldErrorsChange(e) {
    setShowFieldErrors(e.target.checked);
  }

  function formatGame(game) {
    return `${game.title} (${game.division})`;
  }

  // Field-error games can fall on a datetime with no valid field assignment,
  // so the error rows may need columns beyond sortedDatetimes.
  function getDisplayDatetimes() {
    if (!showFieldErrors) return sortedDatetimes;
    const all = new Set(sortedDatetimes);
    missingFieldGames?.forEach((_, dt) => all.add(dt));
    fieldConflicts?.forEach((_, dt) => all.add(dt));
    return [...all].sort();
  }

  // One row per game so each missing-field/conflicting-field result is its
  // own labeled row, rather than several games sharing a cell.
  function getMissingFieldRows() {
    const entries = [];
    missingFieldGames?.forEach((games, datetime) => {
      games.forEach(game => entries.push({ datetime, game }));
    });
    return entries.sort((a, b) => a.datetime.localeCompare(b.datetime));
  }

  function getFieldConflictRows() {
    const entries = [];
    fieldConflicts?.forEach((conflicts, datetime) => {
      conflicts.forEach(({ field, game }) => entries.push({ datetime, field, game }));
    });
    return entries.sort((a, b) => a.datetime.localeCompare(b.datetime));
  }

  const handleCopy = () => {
    const datetimes = getDisplayDatetimes();
    const header = ['Field', ...datetimes].join('\t');

    const rows = sortedFields.map(field => {
      var rowData = [];
      for (let dt of datetimes) {
        const game = schedule.get(field)?.get(dt);
        if (game?.title) {
          rowData.push(formatGame(game));
        } else {
          rowData.push('');
        }
      }
      return [field, ...rowData].join('\t');
    });

    const errorRows = [];
    if (showFieldErrors) {
      getMissingFieldRows().forEach(({ datetime, game }) => {
        errorRows.push(['Missing Field', ...datetimes.map(dt => dt === datetime ? formatGame(game) : '')].join('\t'));
      });
      getFieldConflictRows().forEach(({ datetime, field, game }) => {
        errorRows.push(['Field Conflict', ...datetimes.map(dt => dt === datetime ? `${formatGame(game)} @ ${field}` : '')].join('\t'));
      });
    }

    const tsvData = [header, ...rows, ...errorRows].join('\n');
    navigator.clipboard.writeText(tsvData);
  };
  if (!schedule || !sortedDatetimes || !sortedFields || schedule.size == 0 || sortedDatetimes.length == 0 || sortedFields.length == 0) {
    return <></>
    // return <div className={styles.margin}>No field assignments found.</div>
  }

  const displayDatetimes = getDisplayDatetimes();
  const missingFieldRows = showFieldErrors ? getMissingFieldRows() : [];
  const fieldConflictRows = showFieldErrors ? getFieldConflictRows() : [];

  return (
    <div>
      {schedule ? <div className={styles.window}>
        <h2 className={styles.instruction}>Games Table</h2>
        <div className={styles.margin}>
          <p>{eventNames}</p>
          <button onClick={handleCopy} className={styles.button + ' ' + tstyles.button}>
            Copy Table to Clipboard
          </button>
          <div className={styles.container_hor}>
            <input checked={showFieldErrors} onChange={handleShowFieldErrorsChange} id='showFieldErrorsInput' className={styles.checkbox} type='checkbox'></input>
            <label htmlFor='showFieldErrorsInput' className={styles.smalllabel}>Show games with missing/conflicting field number</label>
          </div>
          <div>
            <table>
              <thead>
                <tr>
                  <th scope='col'>Field</th>
                  {displayDatetimes.map(dt => <th key={dt} scope='col'>{dt}</th>)}
                </tr>
              </thead>
              <tbody className={styles.tbody}>
                {sortedFields.map(field => (
                  <tr key={field}>
                    <th scope='row'>{field}</th>
                    {displayDatetimes.map(dt => {
                      const game = schedule.get(field)?.get(dt);
                        return (
                        <td key={dt} className={styles.td}>
                          {game?.title || ''}
                          {game?.title ? <strong className={tstyles[game?.division]}> ({game?.division})</strong> : <></>}
                        </td>
                        );
                    })}
                  </tr>
                ))}
                {missingFieldRows.map(({ datetime, game }, i) => (
                  <tr key={`missing-field-${i}`}>
                    <th scope='row' className={tstyles.errorRow}>Missing Field</th>
                    {displayDatetimes.map(dt => (
                      <td key={dt} className={styles.td + ' ' + tstyles.errorCell}>
                        {dt === datetime ? formatGame(game) : ''}
                      </td>
                    ))}
                  </tr>
                ))}
                {fieldConflictRows.map(({ datetime, field, game }, i) => (
                  <tr key={`field-conflict-${i}`}>
                    <th scope='row' className={tstyles.errorRow}>Field Conflict</th>
                    {displayDatetimes.map(dt => (
                      <td key={dt} className={styles.td + ' ' + tstyles.errorCell}>
                        {dt === datetime ? `${formatGame(game)} @ ${field}` : ''}
                      </td>
                    ))}
                  </tr>
                ))}
                {showFieldErrors && missingFieldRows.length === 0 && fieldConflictRows.length === 0 && (
                  <tr>
                    <th scope='row' className={tstyles.errorRow}>No Errors</th>
                    <td className={styles.td} colSpan={displayDatetimes.length}>No missing or conflicting field games found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <p className={styles.margin}>Format: team1 (seed)-team2 (seed) (age division-gender division)</p>
      </div>
        : <></>}
    </div>
  );
}
