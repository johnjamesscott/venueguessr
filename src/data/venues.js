// VenueGuessr venue data — organised by level

// Helper: parse POINT (lng lat) strings
function parsePoint(point) {
  const m = point.match(/POINT \(([^ ]+) ([^ )]+)\)/);
  if (!m) return { lat: 0, lng: 0 };
  return { lng: parseFloat(m[1]), lat: parseFloat(m[2]) };
}

export const LEVELS = [
  { id: 1, name: 'UK & Ireland', emoji: '🇬🇧', difficulty: 'Easy',    color: '#22c55e', locked: false },
  { id: 2, name: 'Europe',       emoji: '🌍', difficulty: 'Moderate', color: '#f59e0b', locked: true  },
  { id: 3, name: 'North America',emoji: '🌎', difficulty: 'Moderate', color: '#f59e0b', locked: true  },
  { id: 4, name: 'Aus & NZ',     emoji: '🦘', difficulty: 'Moderate', color: '#f59e0b', locked: true  },
  { id: 5, name: 'World',        emoji: '🌐', difficulty: 'Hard',     color: '#ef4444', locked: true  },
];

// ── Level 1: UK & Ireland ──────────────────────────────────────────────────
const UK_IRELAND_RAW = [
  [55004, 'Alfi Spitalfields',      'Covered Terrace',              '3 Crispin Place',           'London',      'GB', 'https://tours.headbox.com/model/222fa66KUnF',              'POINT (-0.07637569999999999 51.5198116)'],
  [52417, 'Batch LDN',              'Batch LDN',                    "9-11 Short's Gardens",      'London',      'GB', 'https://tours.headbox.com/model/sFdX8GEcLFU',             'POINT (-0.1264957 51.5141032)'],
  [49585, 'Brunswick House',        'Smoking Room',                 '30 Wandsworth Road',        'London',      'GB', 'https://tours.headbox.com/model/T3orGfXaMPd',             'POINT (-0.1265278 51.4847537)'],
  [49261, 'The Ivy City Garden',    'The Oasis Bar',                '69 Old Broad Street',       'London',      'GB', 'https://my.matterport.com/show/?m=7N8YP97MJCL',           'POINT (-0.0827826 51.51682659999999)'],
  [49130, 'Bob Bob Ricard City',    'Red Private Dining Room',      '122 Leadenhall Street',     'London',      'GB', 'https://my.matterport.com/show/?m=aKezmLQR6NK',           'POINT (-0.0823131 51.51386189999999)'],
  [49017, 'MR PORTER London',       "Chef's table",                 '22 Park Lane',              'London',      'GB', 'https://tours.headbox.com/model/7Wx3XXawzhM',             'POINT (-0.1500168 51.50555749999999)'],
  [47862, 'McLarens on the Corner', 'Full Venue Hire',              '8 Morningside Road',        'Edinburgh',   'GB', 'https://tours.headbox.com/model/MNng6dMaBYz',             'POINT (-3.2105239 55.9343102)'],
  [47860, 'Badger & Co.',           'The Lounge',                   '32 Castle Street',          'Edinburgh',   'GB', 'https://tours.headbox.com/model/9FiQftGgzPp',             'POINT (-3.2036173 55.9520364)'],
  [47631, 'F1 Arcade Birmingham',   'The Terrace',                  'Chamberlain Square',        'Birmingham',  'GB', 'https://tours.headbox.com/model/2SvEBekPz5D',             'POINT (-1.9056346 52.4798612)'],
  [46742, 'Clays City',             'Exclusive Venue Hire',         '55 Moorgate',               'London',      'GB', 'https://tours.headbox.com/model/QDDQ9TctzbQ',             'POINT (-0.0893252 51.51679739999999)'],
  [45554, 'The Dixon Tower Bridge', 'Courtroom Bar',                '211 Tooley Street',         'London',      'GB', 'https://tours.headbox.com/model/6hSp9gBC8Gk',             'POINT (-0.0768266 51.5021689)'],
  [45328, 'City Cruises',           'Millennium City/Dawn/Peace',   'Cherry Garden Pier',        'Rotherhithe', 'GB', 'https://tours.headbox.com/model/ZM79cZEh1yj',             'POINT (-0.061874 51.500977)'],
  [40307, 'Pergola on the Wharf',   'Restaurant',                   'Crossrail Place',           'London',      'GB', 'https://tours.headbox.com/model/kSHtNkHV375',             'POINT (-0.0180659 51.5060158)'],
  [38506, 'The Drum Wembley',       'Boardroom',                    'Engineers Way',             'Wembley',     'GB', 'https://tours.headbox.com/model/vhbakGgGSow',             'POINT (-0.2816834 51.5586038)'],
  [37924, 'Protein Studios',        'Studio 4 + 5',                 '31 New Inn Yard',           'London',      'GB', 'https://tours.headbox.com/model/LK7bqrXNuCF',             'POINT (-0.0781898000000183 51.52455399999999)'],
  [37217, 'Los Mochis',             'Bar & Lounge',                 '2-4 Farmer Street',         'London',      'GB', 'https://tours.headbox.com/model/VnoC19Y2RnJ',             'POINT (-0.1971296 51.5085545)'],
  [35934, 'The Ned London',         'The Wren Room',                '27 Poultry',                'London',      'GB', 'https://tours.headbox.com/model/VbdKSe4BETd',             'POINT (-0.08961319999999999 51.5139059)'],
  [35288, 'German Gymnasium',       'The Balcony',                  "King's Blvd",               'London',      'GB', 'https://tours.headbox.com/model/tbMrGLFkwRj',             'POINT (-0.1256071627044548 51.53231355075865)'],
  [29183, 'Le Pont De La Tour',     'Bar & Terrace',                '36D Shad Thames',           'London',      'GB', 'https://tours.headbox.com/model/kJkFnPA9rJk',             'POINT (-0.0731375 51.5034648)'],
  [21846, 'Ham Yard Hotel',         'Ham Yard Theatre',             '1 Ham Yard',                'London',      'GB', 'https://tours.headbox.com/model/AWvL4ALKDoY',             'POINT (-0.134821 51.5112601)'],
  [17982, 'The Brewery',            'The James Watt',               '52 Chiswell St',            'London',      'GB', 'https://tours.headbox.com/model/8WZ8rvWaLYi',             'POINT (-0.0915319 51.5208155)'],
  [17812, 'The Stratford Hotel',    '25th floor Sky Terrace',       'Queen Elizabeth Olympic Park','London',    'GB', 'https://tours.headbox.com/model/sbqA2mgkA1m',             'POINT (-0.0119217 51.5504457)'],
  [16868, 'Searcys at The Gherkin', 'Private Dining',               '30 St Mary Axe',            'London',      'GB', 'https://tours.headbox.com/model/N2caHKwrUJU',             'POINT (-0.08025109999999999 51.5144054)'],
  [16166, 'Kimpton Fitzroy London', 'Eliot',                        '1-8 Russell Square',        'London',      'GB', 'https://tours.headbox.com/model/rp6SXHU3T5H',             'POINT (-0.1247126 51.5226841)'],
  [11711, 'Croke Park',             'Canal Room',                   "Jones's Road",              'Dublin',      'IE', 'https://tours.headbox.com/model/zFHPixJz1NU',             'POINT (-6.2530557 53.3612346)'],
  [9332,  'The Postal Museum',      'Mail Rail',                    '15-20 Phoenix Place',       'London',      'GB', 'https://tours.headbox.com/model/t9zKyj2BVBs',             'POINT (-0.1139469 51.52476799999999)'],
  [8792,  'Jin Bo Law Skybar',      'Jin Bo Law',                   '9 Aldgate High Street',     'London',      'GB', 'https://tours.headbox.com/model/3LVPz6vi2vA',             'POINT (-0.0760052 51.5141413)'],
  [18644, 'The Design Museum',      'Sachs Family Park Room',       '224-238 Kensington High St','London',      'GB', 'https://tours.headbox.com/model/hZFM8tQ4Ymh',             'POINT (-0.2005903 51.4987001)'],
];

export const VENUES_BY_LEVEL = {
  1: UK_IRELAND_RAW.map((r, i) => {
    const { lat, lng } = parsePoint(r[7]);
    return {
      id: r[0],
      venueName: r[1],
      spaceName: r[2],
      address: r[3],
      city: r[4],
      country: r[5],
      lat,
      lng,
      tourUrl: r[6],
    };
  }),
  // Levels 2-5 will be populated later — use empty arrays for now
  2: [],
  3: [],
  4: [],
  5: [],
};

// Default fallback (used by legacy code)
export const VENUES = VENUES_BY_LEVEL[1];

// Normalize any tour URL to a proper Matterport embed URL
export function getEmbedUrl(url) {
  if (!url) return null;

  if (url.includes('my.matterport.com/show/')) {
    return url.includes('?') ? url + '&play=1' : url + '?play=1';
  }

  if (url.includes('tours.headbox.com/model/')) {
    const match = url.match(/\/model\/([^/?]+)/);
    if (match) {
      return `https://my.matterport.com/show/?m=${match[1]}&play=1&qs=1`;
    }
  }

  return url;
}