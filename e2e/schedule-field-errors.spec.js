// @ts-check
const { test, expect } = require('@playwright/test');
const fixture = require('./fixtures/event-search-response-field-errors.json');

/**
 * This fixture is e2e/fixtures/event-search-response.json (see its README)
 * with three synthetic games appended to the "Club - Men" pool to exercise
 * the ScheduleTable field-error rows without depending on a real tournament
 * happening to have data-entry errors:
 *  - "Missing Field Team A-Missing Field Team B" at 7/18 10:00 AM, no
 *    FieldName, sharing a datetime column with real games.
 *  - "Missing Field Team C-Missing Field Team D" at 7/18 6:00 AM, no
 *    FieldName, at a time slot with no other (valid) games, so this column
 *    only appears once the field-error rows are shown.
 *  - "Conflict Team E-Conflict Team F" at 7/18 10:00 AM on Field 2, which
 *    already hosts "WOMP (1)-Space Cowboys (9)" in the base fixture.
 */
const EVENT_NAME = fixture.hits[0].EventName;

test.describe('ScheduleTable field-error rows', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/events/search**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixture) })
    );

    await page.goto('/');
    await expect(page.getByText(EVENT_NAME)).toBeVisible();
    await page.getByRole('button', { name: 'Select' }).click();
    await expect(page.getByRole('heading', { name: 'Games Table' })).toBeVisible();
  });

  // Scoped to ScheduleTable's own <div className={styles.window}> so
  // locators don't also match CapsTable's thead/copy button below it.
  function scheduleSection(page) {
    return page.getByRole('heading', { name: 'Games Table' }).locator('xpath=ancestor::div[1]');
  }

  test('errors are hidden until the checkbox is checked, then one row per result appears', async ({ page }) => {
    const section = scheduleSection(page);
    const checkbox = section.getByLabel('Show games with missing/conflicting field number');
    await expect(checkbox).not.toBeChecked();

    // Hidden by default: no error rows, and no column for the time slot
    // that only has a field-less game.
    await expect(section.locator('thead')).not.toContainText('7/18: 06:00');
    await expect(section.locator('tbody')).not.toContainText('Missing Field');
    await expect(section.locator('tbody')).not.toContainText('Field Conflict');

    await checkbox.check();

    // The new time-only-has-errors column now appears.
    await expect(section.locator('thead')).toContainText('7/18: 06:00');

    // Two missing-field games -> two separate "Missing Field" rows, sorted
    // by datetime (6:00 AM before 10:00 AM), each showing only its own game.
    const missingFieldRows = section.locator('tbody tr').filter({ hasText: 'Missing Field' });
    await expect(missingFieldRows).toHaveCount(2);
    await expect(missingFieldRows.nth(0)).toContainText('Missing Field Team C-Missing Field Team D (M)');
    await expect(missingFieldRows.nth(0)).not.toContainText('Missing Field Team A-Missing Field Team B (M)');
    await expect(missingFieldRows.nth(1)).toContainText('Missing Field Team A-Missing Field Team B (M)');
    await expect(missingFieldRows.nth(1)).not.toContainText('Missing Field Team C-Missing Field Team D (M)');

    // Two games conflicting over the same Field 2 / 10:00 AM slot -> two
    // separate "Field Conflict" rows, each showing only its own game.
    const conflictRows = section.locator('tbody tr').filter({ hasText: 'Field Conflict' });
    await expect(conflictRows).toHaveCount(2);
    await expect(conflictRows.nth(0)).toContainText('WOMP (1)-Space Cowboys (9) (M) @ Field 2');
    await expect(conflictRows.nth(0)).not.toContainText('Conflict Team E-Conflict Team F (M) @ Field 2');
    await expect(conflictRows.nth(1)).toContainText('Conflict Team E-Conflict Team F (M) @ Field 2');
    await expect(conflictRows.nth(1)).not.toContainText('WOMP (1)-Space Cowboys (9) (M) @ Field 2');

    // The original conflicting game is still silently blanked from its
    // normal Field 2 cell (pre-existing behavior) -- the new rows are what
    // surface it.
    await expect(section.locator('tbody tr').filter({ hasText: 'Field 2' }).first()).not.toContainText('Conflict Team');
  });

  test('copied text includes the error rows only when the checkbox is checked', async ({ page }) => {
    const section = scheduleSection(page);
    const copyButton = section.getByRole('button', { name: 'Copy Table to Clipboard' });

    await copyButton.click();
    const uncheckedText = await page.evaluate(() => navigator.clipboard.readText());
    expect(uncheckedText).not.toContain('Missing Field');
    expect(uncheckedText).not.toContain('Field Conflict');
    expect(uncheckedText).not.toContain('7/18: 06:00');

    await section.getByLabel('Show games with missing/conflicting field number').check();
    await copyButton.click();
    const checkedText = await page.evaluate(() => navigator.clipboard.readText());

    const lines = checkedText.trim().split('\n');
    const header = lines[0].split('\t');
    const missingFieldLines = lines.filter(l => l.startsWith('Missing Field\t'));
    const conflictLines = lines.filter(l => l.startsWith('Field Conflict\t'));

    expect(header).toContain('7/18: 06:00');
    // One TSV row per game, not one row shared by every game at a datetime.
    expect(missingFieldLines).toHaveLength(2);
    expect(conflictLines).toHaveLength(2);

    const newSlotColumn = header.indexOf('7/18: 06:00');
    const existingSlotColumn = header.indexOf('7/18: 10:00');

    // Rows are sorted by datetime, so 6:00 AM's row comes before 10:00 AM's,
    // and each row only populates its own datetime column.
    expect(missingFieldLines[0].split('\t')[newSlotColumn]).toBe('Missing Field Team C-Missing Field Team D (M)');
    expect(missingFieldLines[0].split('\t')[existingSlotColumn]).toBe('');
    expect(missingFieldLines[1].split('\t')[existingSlotColumn]).toBe('Missing Field Team A-Missing Field Team B (M)');
    expect(missingFieldLines[1].split('\t')[newSlotColumn]).toBe('');

    expect(conflictLines[0].split('\t')[existingSlotColumn]).toBe('WOMP (1)-Space Cowboys (9) (M) @ Field 2');
    expect(conflictLines[1].split('\t')[existingSlotColumn]).toBe('Conflict Team E-Conflict Team F (M) @ Field 2');
  });
});
