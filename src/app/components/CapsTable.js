'use client'

import { useState } from 'react'
import styles from './Tournament.module.css';
import tstyles from './ScheduleTable.module.css';
import Image from 'next/image'
export default function CapsTable({ sortedDatetimes }) {

    const [halfCap, setHalf] = useState(45);
    const [softCap, setSoft] = useState(90);
    const [hardCap, setHard] = useState(105);

    function handleHalfCapChange(e) {
        setHalf(e.target.value);
    }
    function handleSoftCapChange(e) {
        setSoft(e.target.value);
    }
    function handleHardCapChange(e) {
        setHard(e.target.value);
    }

    function handleCopy() {
        const header = ['Round Time', 'Half Cap', 'Soft Cap', 'Hard Cap'].join('\t');

        const rows = sortedDatetimes.map(datetime => {
            // getCapTime('half', datetime)
            return [
                datetime,
                getCapTime('half', datetime),
                getCapTime('soft', datetime),
                getCapTime('hard', datetime)
            ].join('\t');
        });

        const tsvData = [header, ...rows].join('\n');
        navigator.clipboard.writeText(tsvData);
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

    return (<>{sortedDatetimes ? <div className={styles.window} >
        <p className={styles.instruction}>Cap Times</p>
        <div className={styles.container_column}>
            <div className={styles.container_hor}>
                <Image src={require('./images/dogagent.png')} width={30}
                    height={30}
                    alt='Dog agent' />
                <label htmlFor='halfInput' className={styles.smalllabel}>Half Cap</label>
                <input value={halfCap} onChange={handleHalfCapChange} id='halfInput' className={styles.smallinput} type='number'></input>
            </div>
            <div className={styles.container_hor}>
                <Image src={require('./images/game_freecell-2.png')} width={30}
                    height={30}
                    alt='freecell' />
                <label htmlFor='softInput' className={styles.smalllabel}>Soft Cap</label>
                <input value={softCap} onChange={handleSoftCapChange} id='softInput' className={styles.smallinput} type='number'></input>
            </div>
            <div className={styles.container_hor}>
                <Image src={require('./images/mouse_trails.png')} width={30}
                    height={30}
                    alt='mouse' />
                <label htmlFor='hardInput' className={styles.smalllabel}>Hard Cap</label>
                <input value={hardCap} onChange={handleHardCapChange} id='hardInput' className={styles.smallinput} type='number'></input>
            </div>
        </div>
        <div className={styles.margin}>
            <button onClick={handleCopy} className={styles.button + ' ' + tstyles.button}>
                Copy Table to Clipboard
            </button>
            <table>

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
    </div >
        : <></>}
    </>);
}
