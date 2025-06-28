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
  const divisionAbbreviations = {
    // ICC/YCC
    'Youth Club U-17 - Girls': 'YCC17-G',
    'Youth Club U-17 - Boys': 'YCC17-B',
    'Youth Club U-17 - Mixed': 'YCC17-X',
    'Youth Club U-20 - Girls': 'YCC20-G',
    'Youth Club U-20 - Boys': 'YCC20-B',
    'Youth Club U-20 - Mixed': 'YCC20-X',
    // College
    'College - Women': 'C-W',
    'College - Men': 'C-M',
    // Club prime
    'Club - Women': 'W',
    'Club - Men': 'M',
    'Club - Mixed': 'X',
    // Masters
    'Masters - Women': 'M-W',
    'Masters - Men': 'M-M',
    'Masters - Mixed': 'M-X',
    'Grand Masters - Women': 'GM-W',
    'Grand Masters - Men': 'GM-M',
    'Grand Masters - Mixed': 'GM-X',
    'Great Grand Masters - Women': 'GGM-W',
    'Great Grand Masters - Men': 'GGM-M',
    'Great Grand Masters - Mixed': 'GGM-X',
  };

  const [year, setYear] = useState(new Date().getFullYear());
  const [state, setState] = useState('');
  const [query, setQuery] = useState('');
  const [tournaments, setTournaments] = useState(null);
  const [event, setEvent] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [sortedDatetimes, setDateTimes] = useState(null);
  const [sortedFields, setFields] = useState(null);
  const [halfCap, setHalf] = useState(45);
  const [softCap, setSoft] = useState(90);
  const [hardCap, setHard] = useState(105);

  function handleYearChange(e) {
    setYear(e.target.value);
  }
  function handleStateChange(e) {
    setState(e.target.value);
  }
  function handleQueryChange(e) {
    setQuery(e.target.value);
  }
  function handleHalfCapChange(e) {
    setHalf(e.target.value);
  }
  function handleSoftCapChange(e) {
    setSoft(e.target.value);
  }
  function handleHardCapChange(e) {
    setHard(e.target.value);
  }

  function getDivision(division) {
    if (divisionAbbreviations[division]) return divisionAbbreviations[division];
    return division;
  }

  // TODO: Also add maximum and minimum values for caps.
  function getCapTime(cap, datetime) {
    var capTime;
    switch (cap) {
      case 'half':
        capTime = halfCap;
        break;
      case 'soft':
        capTime = softCap;
        break;
      case 'hard':
        capTime = hardCap;
        break;
      default:
        capTime = 0;
    }

    const timeMatch = datetime.match(/:\s*(.*)/);
    if (!timeMatch) {
      return 'Error';
    }
    const timeString = timeMatch[1]; // e.g., "13:30"

    const date = new Date(`1/1/2000 ${timeString}`);
    if (isNaN(date)) {
      return 'Error';
    }

    date.setMinutes(date.getMinutes() + capTime);

    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
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

  function setTimeAndDate(zdate, timeString, dateString) {
    const [month, date, year] = dateString.split('/');
    const [hours, minutes, tt] = timeString.split(/:|\s/);
    zdate.setFullYear(year, month - 1, date)
    const hour24 = parseInt(hours) + (tt == 'PM' && hours != '12' ? 12 : 0);
    zdate.setHours(hour24, minutes);
    return zdate;
  }

  function generateSchedule(event) {
    // division: [games]
    let allGames = new Map();
    // EventGroupName: "College - Men "
    event.EventGroups.forEach(group => {
      const division = getDivision(group.EventGroupName.trim());
      if (!allGames.has(division)) {
        allGames.set(division, []);
      }
      group.EventRounds.forEach(round => {
        // Games from Pools
        if (round.Pools) {
          round.Pools.forEach(pool => {
            if (pool.Games) allGames.get(division).push(...pool.Games);
          });
        }
        if (round.Clusters) {
          round.Clusters.forEach(cluster => {
            if (cluster.Games) allGames.get(division).push(...cluster.Games);
          })
        }
        // Games from Brackets
        if (round.Brackets) {
          round.Brackets.forEach(bracket => {
            if (bracket.Stage) {
              bracket.Stage.forEach(stage => {
                if (stage.Games) allGames.get(division).push(...stage.Games);
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
    for (const [division, games] of allGames.entries()) {
      games.forEach(game => {
        if (!game.FieldName || !game.StartTime || !game.StartDate) {
          console.log(`skipped game without field, time, or date: ${JSON.stringify(game)}`)
          return;
        }

        const field = game.FieldName.replace(/[^0-9]+/g, '');
        const dt = setTimeAndDate(structuredClone(zdate), game.StartTime, game.StartDate)
        const minutes = dt.getMinutes() >= 10 ? dt.getMinutes() : `0${dt.getMinutes()}`;
        const hours = dt.getHours() >= 10 ? dt.getHours() : `0${dt.getHours()}`;
        const datetimeString = `${dt.getMonth() + 1}/${dt.getDate()}: ${hours}:${minutes}`;
        uniqueFields.add(field);
        uniqueDatetimes.add(datetimeString);

        if (!schedule.has(field)) {
          schedule.set(field, new Map());
        }
        schedule.get(field).set(datetimeString, `${game.HomeTeamName}-${game.AwayTeamName} (${division})`);
      })
    };

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
          <h2 className={styles.instruction}>Welcome!</h2>
          <p className={styles.margin}>Observer assigner solves the simple problem of formatting a USAU tournament into a field assignments table.</p>
          <p className={styles.margin}>The data here is only as fresh as Ultirzr, which reads from USAU. To ask Ultirzr to scrape the latest, click the refresh button ⟳ on the Ultirzr event page (linked in the single event table below).</p>
        </div>
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
                  <th>Ultirzr</th>
                </tr>
              </thead>
              <tbody className={styles.tbody}>
                {tournaments.map(tourney => (
                  <tr key={tourney.EventId}>
                    <td className={styles.td}><button onClick={() => lookupEvent(tourney.EventId)} className={styles.button}>Select</button></td>
                    <td className={styles.td}>{tourney.EventName}</td>
                    <td className={styles.td}>{new Date(tourney.StartDate).toDateString()}</td>
                    <td className={styles.td}>{tourney.City}, {tourney.State}</td>
                    <td className={styles.td}><a className={styles.link} href={`https://www.ultirzr.app/event/${tourney.EventId}`}>View on Ultirzr</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p>No tounaments found</p>}
        </div>
        {event ? <div className={styles.window}>
          <h2 className={styles.instruction}>Games Table</h2>
          <ScheduleTable schedule={schedule} sortedDatetimes={sortedDatetimes} sortedFields={sortedFields} />
          <p className={styles.margin}>Format: team1 (seed)-team2 (seed) (age division-gender division)</p>
        </div>
          : <></>}
        {event ? <div className={styles.window}>
          <p className={styles.instruction}>Cap Times</p>
          <div className={styles.container_column}>
            <div className={styles.container_hor}>
              <label htmlFor='halfInput' className={styles.smalllabel}>Half Cap</label>
              <input value={halfCap} onChange={handleHalfCapChange} id='halfInput' className={styles.smallinput} type='number'></input>
            </div>
            <div className={styles.container_hor}>
              <label htmlFor='softInput' className={styles.smalllabel}>Soft Cap</label>
              <input value={softCap} onChange={handleSoftCapChange} id='softInput' className={styles.smallinput} type='number'></input>
            </div>          <div className={styles.container_hor}>
              <label htmlFor='hardInput' className={styles.smalllabel}>Hard Cap</label>
              <input value={hardCap} onChange={handleHardCapChange} id='hardInput' className={styles.smallinput} type='number'></input>
            </div>
          </div>
          <table className={styles.margin}>
            <thead>
              <tr>
                <th className={styles.th}>Round Time</th>
                <th className={styles.th}>Half Cap</th>
                <th className={styles.th}>Soft Cap</th>
                <th className={styles.th}>Hard Cap</th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {sortedDatetimes.map(datetime => (
                <tr key={`${datetime}-caps`}>
                  <td className={styles.td}>{datetime}</td>
                  <td className={styles.td}>{getCapTime('half', datetime)}</td>
                  <td className={styles.td}>{getCapTime('soft', datetime)}</td>
                  <td className={styles.td}>{getCapTime('hard', datetime)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          : <></>}
      </main>
    </div>
  )
}