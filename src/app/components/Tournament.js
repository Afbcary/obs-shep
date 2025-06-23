'use client'

import { useState, useEffect } from 'react'
import ScheduleTable from './ScheduleTable';
import styles from './Tournament.module.css';
import Image from 'next/image'

export default function Tournament() {

  const states = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AS': 'American Samoa', 'AZ': 'Arizona',
    'AR': 'Arkansas', 'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut',
    'DE': 'Delaware', 'DC': 'District Of Columbia', 'FM': 'Federated States Of Micronesia',
    'FL': 'Florida', 'GA': 'Georgia', 'GU': 'Guam', 'HI': 'Hawaii', 'ID': 'Idaho',
    'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas', 'KY': 'Kentucky',
    'LA': 'Louisiana', 'ME': 'Maine', 'MH': 'Marshall Islands', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
    'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
    'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
    'NC': 'North Carolina', 'ND': 'North Dakota', 'MP': 'Northern Mariana Islands',
    'OH': 'Ohio', 'OK': 'Oklahoma', 'OR': 'Oregon', 'PW': 'Palau', 'PA': 'Pennsylvania',
    'PR': 'Puerto Rico', 'RI': 'Rhode Island', 'SC': 'South Carolina', 'SD': 'South Dakota',
    'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont', 'VI': 'Virgin Islands',
    'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
  };

  const [year, setYear] = useState(new Date().getFullYear());
  const [state, setState] = useState('');
  const [query, setQuery] = useState('');
  const [tournaments, setTournaments] = useState(null);
  const [event, setEvent] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [sortedDatetimes, setDateTimes] = useState(null);
  const [sortedFields, setFields] = useState(null);

  function handleYearChange(e) {
    setYear(e.target.value);
  }
  function handleStateChange(e) {
    setState(e.target.value);
  }
  function handleQueryChange(e) {
    setQuery(e.target.value);
  }

  // https://www.ultirzr.app removed during local dev
  // Using proxy instead to avoid CORS
  function baseUrl() {
    if (process.env.NODE_ENV != 'development') {
      return 'https://www.ultirzr.app/api/v1/events';
    }
    return '/api/v1/events';
  }

  // This useEffect hook will run whenever 'year', 'state', or 'query' changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      async function getTournaments() {
        const params = new URLSearchParams({ query, state, year });
        const url = `${baseUrl()}/search?${params.toString()}`;

        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setTournaments(data.hits);
        } catch (error) {
          console.error('Error fetching events:', error);
          setTournaments(null);
        }
      }

      getTournaments();
    }, 500); // 500ms debounce delay

    // Cleanup function to cancel the timer if the user types again quickly
    return () => clearTimeout(debounceTimer);

  }, [year, state, query]); // Dependency array

  async function lookupEvent(eventId) {
    try {
      const response = await fetch(baseUrl() + '/' + eventId);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setEvent(data.event);
      generateSchedule(data.event);
    } catch (error) {
      console.error('Error fetching event:', error);
      setEvent(null);
    }
  }

  function stateOptions() {
    return (
      Object.entries(states).map(([key, value]) => {
        return <option key={key} id={key} value={key}>{value} ({key})</option>
      })
    );
  }

  function generateSchedule(event) {
    function setTimeAndDate(zdate, timeString, dateString) {
      const [month, date, year] = dateString.split('/');
      const [hours, minutes, tt] = timeString.split(/:|\s/);
      zdate.setFullYear(year, month - 1, date)
      const hour24 = parseInt(hours) + (tt == 'PM' && hours != '12' ? 12 : 0);
      zdate.setHours(hour24, minutes);
      return zdate;
    }

    let allGames = [];
    event.EventGroups.forEach(group => {
      group.EventRounds.forEach(round => {
        // Games from Pools
        if (round.Pools) {
          round.Pools.forEach(pool => {
            if (pool.Games) allGames.push(...pool.Games);
          });
        }
        // Games from Brackets
        if (round.Brackets) {
          round.Brackets.forEach(bracket => {
            if (bracket.Stage) {
              bracket.Stage.forEach(stage => {
                if (stage.Games) allGames.push(...stage.Games);
              });
            }
          });
        }
      });
    });

    const zdate = new Date(event.StartDate);

    const schedule = new Map(); // {fieldName: {datetimeString: gameString}}
    const uniqueDatetimes = new Set();
    const uniqueFields = new Set();

    allGames.forEach(game => {
      if (!game.FieldName || !game.StartTime || !game.StartDate) {
        console.log(`skipped game without field, time, or date: ${JSON.stringify(game)}`)
        return;
      }

      var field = game.FieldName.replace(/[^0-9]+/g, '');
      const dt = setTimeAndDate(structuredClone(zdate), game.StartTime, game.StartDate)
      const minutes = dt.getMinutes() >= 10 ? dt.getMinutes() : `0${dt.getMinutes()}`
      const datetimeString = `${dt.getMonth() + 1}/${dt.getDate()}: ${dt.getHours()}:${minutes}`;
      uniqueFields.add(field);
      uniqueDatetimes.add(datetimeString);

      if (!schedule.has(field)) {
        schedule.set(field, new Map());
      }

      const homeTeam = game.HomeTeamName;
      const awayTeam = game.AwayTeamName;
      schedule.get(field).set(datetimeString, `${homeTeam}-${awayTeam}`);
    });

    const sortedFields = [...uniqueFields].sort((a, b) => a - b);
    const sortedDatetimes = [...uniqueDatetimes].sort();
    setSchedule(schedule);
    setDateTimes(sortedDatetimes);
    setFields(sortedFields);
  }

  return (
    <div className={styles.clouds}>
      <main className={styles.main}>
        <div className={styles.window}>
          <h2 className={styles.instruction}>Search for tournaments</h2>
          <div className={styles.container_column}>
            <div className={styles.container_hor}>
              <Image src={require('./images/win-cal.png')} width={30}
                height={30}
                alt='Windows Calendar' />
              <label htmlFor='yearInput' className={styles.label}>Year</label>
              <input value={year} onChange={handleYearChange} id='yearInput' className={styles.input} type='number'></input>
            </div>
            <div className={styles.container_hor}>
              <Image src={require('./images/win-world.png')} width={30}
                height={30}
                alt='Windows World' />
              <label htmlFor='stateInput' className={styles.label}>State</label>
              <select value={state} onChange={handleStateChange} id='stateInput' className={styles.input}>
                {stateOptions()}
              </select>
            </div>
            <div className={styles.container_hor}>
              <Image src={require('./images/msagent.png')} width={30}
                height={30}
                alt='Microsoft Agent' />
              <label htmlFor='queryInput' className={styles.label}>Tournament Name</label>
              <input value={query} onChange={handleQueryChange} id='queryInput' className={styles.input} placeholder='Name (inexact match)'></input>
            </div>
          </div>
        </div>
        <div className={styles.window}>
          <p className={styles.instruction}>Select a single event</p>
          {tournaments ? (
            <table>
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody className={styles.tbody}>
                {tournaments.map(tourney => (
                  <tr key={tourney.EventId}>
                    <td className={styles.td}><button onClick={() => lookupEvent(tourney.EventId)} className={styles.button}>Select</button></td>
                    <td className={styles.td}>{tourney.EventName}</td>
                    <td className={styles.td}>{new Date(tourney.StartDate).toDateString()}</td>
                    <td className={styles.td}>{tourney.City}, {tourney.State}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p>No tounaments found</p>}
        </div>
        {event ? <div className={styles.window}>
          <h2 className={styles.instruction}>Games Table</h2>
          <ScheduleTable schedule={schedule} sortedDatetimes={sortedDatetimes} sortedFields={sortedFields} />
        </div>
          : <></>}
      </main>
    </div>
  )
}