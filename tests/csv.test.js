import test from 'node:test';
import assert from 'node:assert/strict';

import { parseCsv } from '../src/utils/csv.js';

test('CSV import preserves commas, quotes and line breaks inside quoted cells', () => {
  const rows = parseCsv('venue_name,city,space_name\r\n"Town Hall, Leeds",Leeds,"The ""Big"" Room"\r\nVenue Two,London,"Two\nFloors"');
  assert.deepEqual(rows, [
    { venue_name: 'Town Hall, Leeds', city: 'Leeds', space_name: 'The "Big" Room' },
    { venue_name: 'Venue Two', city: 'London', space_name: 'Two\nFloors' },
  ]);
});

test('CSV import rejects unclosed quoted cells', () => {
  assert.throws(() => parseCsv('venue_name,city\n"Broken,London'), /unclosed quoted value/);
});
