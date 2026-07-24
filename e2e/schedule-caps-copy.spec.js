// @ts-check
const { test, expect } = require('@playwright/test');
const fixture = require('./fixtures/event-search-response.json');

/**
 * This fixture is a real response captured from the Ultirzr search API
 * (https://www.ultirzr.app/api/v1/events/search) for the event
 * "Filling the Void 2026" (EventId 207013840), fetched 2026-07-24. See
 * e2e/fixtures/README.md for how to refresh it.
 *
 * It is intercepted below so the test exercises the real component tree
 * (Tournament -> ScheduleTable / CapsTable) against real tournament data
 * without depending on a live, ever-changing API response.
 */
const EVENT_NAME = fixture.hits[0].EventName;

// Golden values derived from the cached fixture above by independently
// replicating Tournament.js's schedule-building logic offline. They pin down
// exactly what a correct schedule looks like so a regression in either the
// schedule-building code or either table's handleCopy is caught even if the
// two tables happen to stay consistent with each other.
const EXPECTED_FIELD_COUNT = 13;
const EXPECTED_DATETIME_COUNT = 8;
const EXPECTED_GAME_COUNT = 75; // non-empty Schedule Table cells

test.describe('ScheduleTable and CapsTable clipboard export', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/events/search**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixture) })
    );
  });

  test('handleCopy outputs from both tables describe the same schedule', async ({ page }) => {
    await page.goto('/');

    // Wait for the (mocked) search results and select the event.
    await expect(page.getByText(EVENT_NAME)).toBeVisible();
    await page.getByRole('button', { name: 'Select' }).click();

    // Both tables render once Tournament.js finishes building the schedule.
    await expect(page.getByRole('heading', { name: 'Games Table' })).toBeVisible();
    await expect(page.getByText('Cap Times')).toBeVisible();

    const copyButtons = page.getByRole('button', { name: 'Copy Table to Clipboard' });
    await expect(copyButtons).toHaveCount(2);

    // ScheduleTable is rendered before CapsTable in Tournament.js, so the
    // first "Copy" button belongs to ScheduleTable and the second to CapsTable.
    await copyButtons.nth(0).click();
    const scheduleText = await page.evaluate(() => navigator.clipboard.readText());

    await copyButtons.nth(1).click();
    const capsText = await page.evaluate(() => navigator.clipboard.readText());

    // --- Parse ScheduleTable's handleCopy output ---
    const [scheduleHeader, ...scheduleRows] = scheduleText.trim().split('\n');
    const [scheduleCorner, ...scheduleDatetimes] = scheduleHeader.split('\t');
    expect(scheduleCorner).toBe('Field');

    // --- Parse CapsTable's handleCopy output ---
    const [capsHeader, ...capsRows] = capsText.trim().split('\n');
    expect(capsHeader.split('\t')).toEqual(['Round Time', 'Half Cap', 'Soft Cap', 'Hard Cap']);
    const capsDatetimes = capsRows.map(row => row.split('\t')[0]);

    // The core comparison: ScheduleTable's handleCopy lists round times as
    // columns and CapsTable's handleCopy lists the same round times as rows.
    // Both are built independently from the same `sortedDatetimes` state in
    // Tournament.js, so their outputs must agree exactly, in the same order.
    expect(capsDatetimes).toEqual(scheduleDatetimes);
    expect(scheduleDatetimes).toHaveLength(EXPECTED_DATETIME_COUNT);

    // Cross-check against the golden values computed from the cached fixture.
    expect(scheduleRows).toHaveLength(EXPECTED_FIELD_COUNT);

    let gameCount = 0;
    for (const row of scheduleRows) {
      const [, ...cells] = row.split('\t');
      for (const cell of cells) {
        if (cell.trim() !== '') gameCount++;
      }
    }
    expect(gameCount).toBe(EXPECTED_GAME_COUNT);

    // Sanity-check CapsTable's cap-time arithmetic: for the default caps
    // (half=45, soft=90, hard=105 minutes after the round start), each
    // row's caps must be chronologically increasing.
    for (const row of capsRows) {
      const [, half, soft, hard] = row.split('\t');
      const parse = t => Date.parse(`1/1/2000 ${t}`);
      expect(parse(half)).toBeLessThan(parse(soft));
      expect(parse(soft)).toBeLessThan(parse(hard));
    }
  });
});
