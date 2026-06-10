// VenueGuessr venue data — organised by level

export const LEVELS = [
  { id: 1, name: 'UK & Ireland', emoji: '🇬🇧', difficulty: 'Easy',    color: '#22c55e', locked: false },
  { id: 2, name: 'Europe',       emoji: '🌍', difficulty: 'Moderate', color: '#f59e0b', locked: true  },
  { id: 3, name: 'North America',emoji: '🌎', difficulty: 'Moderate', color: '#f59e0b', locked: true  },
  { id: 4, name: 'Aus & NZ',     emoji: '🦘', difficulty: 'Moderate', color: '#f59e0b', locked: true  },
  { id: 5, name: 'World',        emoji: '🌐', difficulty: 'Hard',     color: '#ef4444', locked: true  },
];

// ── Level 1: UK & Ireland ──────────────────────────────────────────────────
// [venueName, spaceName, city, country, lat, lng, tourUrl]
const UK_IRELAND_RAW = [
  // London venues
  { id: 55004, venueName: 'Alfi Spitalfields',       spaceName: 'Covered Terrace',             city: 'London',      country: 'GB', lat: 51.5198116,  lng: -0.0763757,  tourUrl: 'https://tours.headbox.com/model/222fa66KUnF' },
  { id: 52417, venueName: 'Batch LDN',               spaceName: 'Batch LDN',                   city: 'London',      country: 'GB', lat: 51.5141032,  lng: -0.1264957,  tourUrl: 'https://tours.headbox.com/model/sFdX8GEcLFU' },
  { id: 49585, venueName: 'Brunswick House',          spaceName: 'Smoking Room',                city: 'London',      country: 'GB', lat: 51.4847537,  lng: -0.1265278,  tourUrl: 'https://tours.headbox.com/model/T3orGfXaMPd' },
  { id: 49261, venueName: 'The Ivy City Garden',      spaceName: 'The Oasis Bar',               city: 'London',      country: 'GB', lat: 51.5168266,  lng: -0.0827826,  tourUrl: 'https://my.matterport.com/show/?m=7N8YP97MJCL' },
  { id: 49130, venueName: 'Bob Bob Ricard City',      spaceName: 'Red Private Dining Room',     city: 'London',      country: 'GB', lat: 51.5138619,  lng: -0.0823131,  tourUrl: 'https://my.matterport.com/show/?m=aKezmLQR6NK' },
  { id: 49017, venueName: 'MR PORTER London',         spaceName: "Chef's Table",                city: 'London',      country: 'GB', lat: 51.5055575,  lng: -0.1500168,  tourUrl: 'https://tours.headbox.com/model/7Wx3XXawzhM' },
  { id: 46742, venueName: 'Clays City',               spaceName: 'Exclusive Venue Hire',        city: 'London',      country: 'GB', lat: 51.5167974,  lng: -0.0893252,  tourUrl: 'https://tours.headbox.com/model/QDDQ9TctzbQ' },
  { id: 45554, venueName: 'The Dixon, Tower Bridge',  spaceName: 'Courtroom Bar',               city: 'London',      country: 'GB', lat: 51.5021689,  lng: -0.0768266,  tourUrl: 'https://tours.headbox.com/model/6hSp9gBC8Gk' },
  { id: 45328, venueName: 'City Cruises',             spaceName: 'Millennium City',             city: 'Rotherhithe', country: 'GB', lat: 51.500977,   lng: -0.061874,   tourUrl: 'https://tours.headbox.com/model/ZM79cZEh1yj' },
  { id: 40307, venueName: 'Pergola on the Wharf',     spaceName: 'Restaurant',                  city: 'London',      country: 'GB', lat: 51.5060158,  lng: -0.0180659,  tourUrl: 'https://tours.headbox.com/model/kSHtNkHV375' },
  { id: 37924, venueName: 'Protein Studios',          spaceName: 'Studio 4 + 5',               city: 'London',      country: 'GB', lat: 51.524554,   lng: -0.0781898,  tourUrl: 'https://tours.headbox.com/model/LK7bqrXNuCF' },
  { id: 37217, venueName: 'Los Mochis',               spaceName: 'Bar & Lounge',                city: 'London',      country: 'GB', lat: 51.5085545,  lng: -0.1971296,  tourUrl: 'https://tours.headbox.com/model/VnoC19Y2RnJ' },
  { id: 35934, venueName: 'The Ned London',           spaceName: 'The Wren Room',               city: 'London',      country: 'GB', lat: 51.5139059,  lng: -0.0896132,  tourUrl: 'https://tours.headbox.com/model/VbdKSe4BETd' },
  { id: 35288, venueName: 'German Gymnasium',         spaceName: 'The Balcony',                 city: 'London',      country: 'GB', lat: 51.5323136,  lng: -0.1256072,  tourUrl: 'https://tours.headbox.com/model/tbMrGLFkwRj' },
  { id: 29183, venueName: 'Le Pont De La Tour',       spaceName: 'Bar & Terrace',               city: 'London',      country: 'GB', lat: 51.5034648,  lng: -0.0731375,  tourUrl: 'https://tours.headbox.com/model/kJkFnPA9rJk' },
  { id: 21846, venueName: 'Ham Yard Hotel',           spaceName: 'Ham Yard Theatre',            city: 'London',      country: 'GB', lat: 51.5112601,  lng: -0.134821,   tourUrl: 'https://tours.headbox.com/model/AWvL4ALKDoY' },
  { id: 17982, venueName: 'The Brewery',              spaceName: 'The James Watt',              city: 'London',      country: 'GB', lat: 51.5208155,  lng: -0.0915319,  tourUrl: 'https://tours.headbox.com/model/8WZ8rvWaLYi' },
  { id: 17812, venueName: 'The Stratford Hotel',      spaceName: '25th Floor Sky Terrace',      city: 'London',      country: 'GB', lat: 51.5504457,  lng: -0.0119217,  tourUrl: 'https://tours.headbox.com/model/sbqA2mgkA1m' },
  { id: 16868, venueName: 'Searcys at The Gherkin',  spaceName: 'Private Dining',              city: 'London',      country: 'GB', lat: 51.5144054,  lng: -0.0802511,  tourUrl: 'https://tours.headbox.com/model/N2caHKwrUJU' },
  { id: 16166, venueName: 'Kimpton Fitzroy London',   spaceName: 'Eliot',                       city: 'London',      country: 'GB', lat: 51.5226841,  lng: -0.1247126,  tourUrl: 'https://tours.headbox.com/model/rp6SXHU3T5H' },
  { id: 9332,  venueName: 'The Postal Museum',        spaceName: 'Mail Rail',                   city: 'London',      country: 'GB', lat: 51.524768,   lng: -0.1139469,  tourUrl: 'https://tours.headbox.com/model/t9zKyj2BVBs' },
  { id: 8792,  venueName: 'Jin Bo Law Skybar',        spaceName: 'Jin Bo Law',                  city: 'London',      country: 'GB', lat: 51.5141413,  lng: -0.0760052,  tourUrl: 'https://tours.headbox.com/model/3LVPz6vi2vA' },
  { id: 18644, venueName: 'The Design Museum',        spaceName: 'Sachs Family Park Room',      city: 'London',      country: 'GB', lat: 51.4987001,  lng: -0.2005903,  tourUrl: 'https://tours.headbox.com/model/hZFM8tQ4Ymh' },
  { id: 38506, venueName: 'The Drum Wembley',         spaceName: 'Boardroom',                   city: 'Wembley',     country: 'GB', lat: 51.5586038,  lng: -0.2816834,  tourUrl: 'https://tours.headbox.com/model/vhbakGgGSow' },
  { id: 'pgb', venueName: 'Pergola Brixton',          spaceName: 'Brixton Village',             city: 'London',      country: 'GB', lat: 51.46593,    lng: -0.10652,    tourUrl: 'https://my.matterport.com/show/?m=j7NNCJPAUQ6' },
  { id: 'som', venueName: 'River Terrace',            spaceName: 'Somerset House',              city: 'London',      country: 'GB', lat: 51.5116948,  lng: -0.117442,   tourUrl: 'https://my.matterport.com/show/?m=vnV9a1pKDgV' },
  { id: 'gin', venueName: 'Guinness Open Gate Brewery', spaceName: 'London',                    city: 'London',      country: 'GB', lat: 51.5132472,  lng: -0.1255247,  tourUrl: 'https://my.matterport.com/show/?m=iXYe89XbtEy' },

  // Outside London
  { id: 47862, venueName: 'McLarens on the Corner',   spaceName: 'Full Venue Hire',             city: 'Edinburgh',   country: 'GB', lat: 55.9343102,  lng: -3.2105239,  tourUrl: 'https://tours.headbox.com/model/MNng6dMaBYz' },
  { id: 47860, venueName: 'Badger & Co.',             spaceName: 'The Lounge',                  city: 'Edinburgh',   country: 'GB', lat: 55.9520364,  lng: -3.2036173,  tourUrl: 'https://tours.headbox.com/model/9FiQftGgzPp' },
  { id: 47631, venueName: 'F1 Arcade Birmingham',     spaceName: 'The Terrace',                 city: 'Birmingham',  country: 'GB', lat: 52.4798612,  lng: -1.9056346,  tourUrl: 'https://tours.headbox.com/model/2SvEBekPz5D' },
  { id: 11711, venueName: 'Croke Park',               spaceName: 'Canal Room',                  city: 'Dublin',      country: 'IE', lat: 53.3612346,  lng: -6.2530557,  tourUrl: 'https://tours.headbox.com/model/zFHPixJz1NU' },
  { id: 'bth', venueName: 'The Roman Baths & Pump Room', spaceName: 'Roman Baths',             city: 'Bath',        country: 'GB', lat: 51.3811264,  lng: -2.3599906,  tourUrl: 'https://my.matterport.com/show/?m=yXuA5RSbEUW' },
  { id: 'mrf', venueName: 'Murrayfield Stadium',      spaceName: 'Murrayfield',                 city: 'Edinburgh',   country: 'GB', lat: 55.9423133,  lng: -3.2408951,  tourUrl: 'https://my.matterport.com/show/?m=hTmooxrgF2e' },
  { id: 'gls', venueName: 'Gloster House & Gardens',  spaceName: 'Gloster House',               city: 'Offaly',      country: 'IE', lat: 53.09139,    lng: -7.91333,    tourUrl: 'https://my.matterport.com/show/?m=Fo53Geq4j4r' },
  { id: 'icc', venueName: 'International Convention Centre', spaceName: 'Centenary Square',    city: 'Birmingham',  country: 'GB', lat: 52.4790625,  lng: -1.9109476,  tourUrl: 'https://my.matterport.com/show/?m=jHZcZqKpheX' },
  { id: 'bgh', venueName: 'Brighton Harbour Hotel',   spaceName: '64 Kings Road',               city: 'Brighton',    country: 'GB', lat: 50.820736,   lng: -0.1444634,  tourUrl: 'https://my.matterport.com/show/?m=fowDyvQ2wbZ' },
  { id: 'cls', venueName: 'Castle Leslie',            spaceName: 'Castle Leslie Estate',        city: 'County Monaghan', country: 'IE', lat: 54.3202883, lng: -6.8919796, tourUrl: 'https://my.matterport.com/show/?m=AYBe72vW3hM' },
];

// Venues outside Greater London (city !== 'London' and city !== 'Rotherhithe' and city !== 'Wembley')
const LONDON_CITIES = new Set(['London', 'Rotherhithe', 'Wembley']);

export const LONDON_VENUES   = UK_IRELAND_RAW.filter(v => LONDON_CITIES.has(v.city));
export const OUTSIDE_VENUES  = UK_IRELAND_RAW.filter(v => !LONDON_CITIES.has(v.city));

export const VENUES_BY_LEVEL = {
  1: UK_IRELAND_RAW,
  2: [],
  3: [],
  4: [],
  5: [],
};

// Default fallback (used by legacy code)
export const VENUES = VENUES_BY_LEVEL[1];

// Clean embed params: auto-play, quickstart, hide clutter (dollhouse, branding, tags, reel, ruler, tour buttons)
const EMBED_PARAMS = 'play=1&qs=1&dh=0&mls=2&gt=0&hr=0&measurements=0&mt=0&brand=0';

// Normalize any tour URL to a proper Matterport embed URL
export function getEmbedUrl(url) {
  if (!url) return null;

  if (url.includes('my.matterport.com/show/')) {
    // Strip any existing params we're overriding, then append ours
    const base = url.split('?')[0];
    const existing = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
    const ours = new URLSearchParams(EMBED_PARAMS);
    // Preserve m= (model ID) from original URL
    const m = existing.get('m');
    if (m) ours.set('m', m);
    return `${base}?${ours.toString()}`;
  }

  if (url.includes('tours.headbox.com/model/')) {
    const match = url.match(/\/model\/([^/?]+)/);
    if (match) {
      return `https://my.matterport.com/show/?m=${match[1]}&${EMBED_PARAMS}`;
    }
  }

  return url;
}