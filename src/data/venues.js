// VenueGuessr venue data
// Replace placeholder coords with your geocoded lat/lng values
// Both tours.headbox.com and my.matterport.com URL formats are supported

export const VENUES = [
  {
    id: 1,
    venueName: "Players Social",
    spaceName: "Semi Private Indoor Restaurant Dining Area",
    address: "1 Crispin Place",
    city: "London",
    country: "GB",
    lat: 51.5194,
    lng: -0.0755,
    tourUrl: "https://tours.headbox.com/model/L3y5hCe6ift"
  },
  {
    id: 2,
    venueName: "The Camfield",
    spaceName: "The Hall",
    address: "1 Roger MacKay Drive",
    city: "Burswood",
    country: "AU",
    lat: -31.9622,
    lng: 115.8994,
    tourUrl: "https://my.matterport.com/show/?f=0&m=wYcqHeQEc4A"
  },
  {
    id: 3,
    venueName: "Sofitel London Heathrow",
    spaceName: "Melbourne Suite",
    address: "Terminal 5",
    city: "London",
    country: "GB",
    lat: 51.4762,
    lng: -0.4886,
    tourUrl: "https://tours.headbox.com/model/m2Md3Gy1UsR"
  },
  {
    id: 4,
    venueName: "Glasshouse Morningside",
    spaceName: "Venue Exclusive",
    address: "18 McDonald Street, Morningside",
    city: "Auckland",
    country: "NZ",
    lat: -36.8773,
    lng: 174.7637,
    tourUrl: "https://tours.headbox.com/model/6szKqjMRzvY"
  },
  {
    id: 5,
    venueName: "Kent Hotel",
    spaceName: "Manapan Room",
    address: "370 Rathdowne Street",
    city: "Carlton North",
    country: "AU",
    lat: -37.7929,
    lng: 144.9696,
    tourUrl: "https://tours.headbox.com/model/jnseTHWU66b?qs=0&play=1&mls=0&brand=1"
  },
  {
    id: 6,
    venueName: "No. 4 Hamilton Place",
    spaceName: "Main Ballroom",
    address: "4 Hamilton Place",
    city: "London",
    country: "GB",
    lat: 51.5048,
    lng: -0.1533,
    tourUrl: "https://tours.headbox.com/model/SampleTour06"
  },
  {
    id: 7,
    venueName: "The Brewery",
    spaceName: "King George III",
    address: "52 Chiswell Street",
    city: "London",
    country: "GB",
    lat: 51.5202,
    lng: -0.0892,
    tourUrl: "https://tours.headbox.com/model/SampleTour07"
  },
  {
    id: 8,
    venueName: "ICC Sydney",
    spaceName: "Grand Ballroom",
    address: "14 Darling Dr",
    city: "Sydney",
    country: "AU",
    lat: -33.8743,
    lng: 151.1988,
    tourUrl: "https://tours.headbox.com/model/SampleTour08"
  },
  {
    id: 9,
    venueName: "Beurs van Berlage",
    spaceName: "Grote Zaal",
    address: "Damrak 277",
    city: "Amsterdam",
    country: "NL",
    lat: 52.3749,
    lng: 4.8946,
    tourUrl: "https://tours.headbox.com/model/SampleTour09"
  },
  {
    id: 10,
    venueName: "1 Hotel Brooklyn Bridge",
    spaceName: "Harriet's Rooftop",
    address: "60 Furman Street",
    city: "New York",
    country: "US",
    lat: 40.6981,
    lng: -73.9968,
    tourUrl: "https://tours.headbox.com/model/SampleTour10"
  }
];

// Normalize any tour URL to a proper Matterport embed URL
export function getEmbedUrl(url) {
  if (!url) return null;
  
  // Already a my.matterport.com embed URL
  if (url.includes('my.matterport.com/show/')) {
    const embedUrl = url.includes('?') 
      ? url + '&play=1' 
      : url + '?play=1';
    return embedUrl;
  }
  
  // tours.headbox.com/model/{id} format
  if (url.includes('tours.headbox.com/model/')) {
    // Extract the model ID (first path segment after /model/)
    const match = url.match(/\/model\/([^/?]+)/);
    if (match) {
      const modelId = match[1];
      return `https://my.matterport.com/show/?m=${modelId}&play=1&qs=1`;
    }
  }

  return url;
}