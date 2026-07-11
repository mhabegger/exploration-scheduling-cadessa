import type { FormatProfile, Rotation, Track } from './types'

interface HotAcSeed {
  title: string
  artist: string
  artistKeys: string[]
  rotation: Rotation
  era: Track['era']
  chartRank?: number
}

const sourceUrl = 'https://www.americantop40.com/charts/hot-ac-243/latest/'

const seeds: HotAcSeed[] = [
  { title: 'So Easy (To Fall in Love)', artist: 'Olivia Dean', artistKeys: ['olivia-dean'], rotation: 'power', era: '2020s', chartRank: 1 },
  { title: 'I Just Might', artist: 'Bruno Mars', artistKeys: ['bruno-mars'], rotation: 'power', era: '2020s', chartRank: 2 },
  { title: 'Homewrecker', artist: 'sombr', artistKeys: ['sombr'], rotation: 'power', era: '2020s', chartRank: 3 },
  { title: 'Dracula', artist: 'Tame Impala', artistKeys: ['tame-impala'], rotation: 'power', era: '2020s', chartRank: 8 },
  { title: "Choosin' Texas", artist: 'Ella Langley', artistKeys: ['ella-langley'], rotation: 'power', era: '2020s', chartRank: 6 },
  { title: 'Risk It All', artist: 'Bruno Mars', artistKeys: ['bruno-mars'], rotation: 'power', era: '2020s', chartRank: 11 },
  { title: 'I Knew It, I Knew You', artist: 'Taylor Swift', artistKeys: ['taylor-swift'], rotation: 'power', era: '2020s', chartRank: 17 },
  { title: 'Golden', artist: 'HUNTR/X, EJAE, Audrey Nuna & REI AMI', artistKeys: ['huntr-x', 'ejae', 'audrey-nuna', 'rei-ami'], rotation: 'power', era: '2020s', chartRank: 7 },
  { title: 'back to friends', artist: 'sombr', artistKeys: ['sombr'], rotation: 'power', era: '2020s', chartRank: 16 },
  { title: 'Man I Need', artist: 'Olivia Dean', artistKeys: ['olivia-dean'], rotation: 'power', era: '2020s', chartRank: 5 },

  { title: 'drop dead', artist: 'Olivia Rodrigo', artistKeys: ['olivia-rodrigo'], rotation: 'current', era: '2020s', chartRank: 10 },
  { title: 'American Girls', artist: 'Harry Styles', artistKeys: ['harry-styles'], rotation: 'current', era: '2020s', chartRank: 9 },
  { title: 'Die On This Hill', artist: 'SIENNA SPIRO', artistKeys: ['sienna-spiro'], rotation: 'current', era: '2020s', chartRank: 12 },
  { title: 'Need Your Love', artist: 'OneRepublic', artistKeys: ['onerepublic'], rotation: 'current', era: '2020s', chartRank: 15 },
  { title: 'FEVER DREAM', artist: 'Alex Warren', artistKeys: ['alex-warren'], rotation: 'current', era: '2020s', chartRank: 13 },
  { title: 'hate that i made you love me', artist: 'Ariana Grande', artistKeys: ['ariana-grande'], rotation: 'current', era: '2020s', chartRank: 28 },
  { title: 'Midnight Sun', artist: 'Zara Larsson', artistKeys: ['zara-larsson'], rotation: 'current', era: '2020s', chartRank: 23 },
  { title: 'Mr. Know It All', artist: 'Teddy Swims', artistKeys: ['teddy-swims'], rotation: 'current', era: '2020s', chartRank: 19 },
  { title: 'Hit the Wall', artist: 'Gracie Abrams', artistKeys: ['gracie-abrams'], rotation: 'current', era: '2020s' },
  { title: 'The Great Divide', artist: 'Noah Kahan', artistKeys: ['noah-kahan'], rotation: 'current', era: '2020s', chartRank: 18 },
  { title: 'DAISIES', artist: 'Justin Bieber', artistKeys: ['justin-bieber'], rotation: 'current', era: '2020s', chartRank: 35 },
  { title: 'The Time Of My Life', artist: 'Benson Boone', artistKeys: ['benson-boone'], rotation: 'current', era: '2020s' },

  { title: 'The Fate of Ophelia', artist: 'Taylor Swift', artistKeys: ['taylor-swift'], rotation: 'recurrent', era: '2020s' },
  { title: 'BIRDS OF A FEATHER', artist: 'Billie Eilish', artistKeys: ['billie-eilish'], rotation: 'recurrent', era: '2020s' },
  { title: 'Espresso', artist: 'Sabrina Carpenter', artistKeys: ['sabrina-carpenter'], rotation: 'recurrent', era: '2020s' },
  { title: 'A Bar Song (Tipsy)', artist: 'Shaboozey', artistKeys: ['shaboozey'], rotation: 'recurrent', era: '2020s' },
  { title: 'Too Sweet', artist: 'Hozier', artistKeys: ['hozier'], rotation: 'recurrent', era: '2020s' },
  { title: 'Die With A Smile', artist: 'Lady Gaga & Bruno Mars', artistKeys: ['lady-gaga', 'bruno-mars'], rotation: 'recurrent', era: '2020s' },
  { title: 'Lose Control', artist: 'Teddy Swims', artistKeys: ['teddy-swims'], rotation: 'recurrent', era: '2020s' },
  { title: 'Stargazing', artist: 'Myles Smith', artistKeys: ['myles-smith'], rotation: 'recurrent', era: '2020s' },
  { title: "Sorry I'm Here For Someone Else", artist: 'Benson Boone', artistKeys: ['benson-boone'], rotation: 'recurrent', era: '2020s' },
  { title: 'Messy', artist: 'Lola Young', artistKeys: ['lola-young'], rotation: 'recurrent', era: '2020s' },
  { title: 'WILDFLOWER', artist: 'Billie Eilish', artistKeys: ['billie-eilish'], rotation: 'recurrent', era: '2020s' },
  { title: 'Nice To Meet You', artist: 'Myles Smith', artistKeys: ['myles-smith'], rotation: 'recurrent', era: '2020s' },
  { title: 'As It Was', artist: 'Harry Styles', artistKeys: ['harry-styles'], rotation: 'recurrent', era: '2020s' },
  { title: 'Sailor Song', artist: 'Gigi Perez', artistKeys: ['gigi-perez'], rotation: 'recurrent', era: '2020s' },

  { title: 'Semi-Charmed Life', artist: 'Third Eye Blind', artistKeys: ['third-eye-blind'], rotation: 'gold', era: '90s' },
  { title: "Tearin' Up My Heart", artist: '*NSYNC', artistKeys: ['nsync'], rotation: 'gold', era: '90s' },
  { title: 'As Long As You Love Me', artist: 'Backstreet Boys', artistKeys: ['backstreet-boys'], rotation: 'gold', era: '90s' },
  { title: 'Whenever, Wherever', artist: 'Shakira', artistKeys: ['shakira'], rotation: 'gold', era: '2000s' },
  { title: 'Hey Ya!', artist: 'Outkast', artistKeys: ['outkast'], rotation: 'gold', era: '2000s' },
  { title: 'Somebody Told Me', artist: 'The Killers', artistKeys: ['the-killers'], rotation: 'gold', era: '2000s' },
  { title: 'Boulevard of Broken Dreams', artist: 'Green Day', artistKeys: ['green-day'], rotation: 'gold', era: '2000s' },
  { title: 'SexyBack', artist: 'Justin Timberlake', artistKeys: ['justin-timberlake'], rotation: 'gold', era: '2000s' },
  { title: 'Umbrella', artist: 'Rihanna feat. Jay-Z', artistKeys: ['rihanna', 'jay-z'], rotation: 'gold', era: '2000s' },
  { title: 'Party in the U.S.A.', artist: 'Miley Cyrus', artistKeys: ['miley-cyrus'], rotation: 'gold', era: '2000s' },
  { title: 'Hey, Soul Sister', artist: 'Train', artistKeys: ['train'], rotation: 'gold', era: '2000s' },
  { title: "What Doesn't Kill You (Stronger)", artist: 'Kelly Clarkson', artistKeys: ['kelly-clarkson'], rotation: 'gold', era: '2010s' },
  { title: 'Moves Like Jagger', artist: 'Maroon 5 feat. Christina Aguilera', artistKeys: ['maroon-5', 'christina-aguilera'], rotation: 'gold', era: '2010s' },
  { title: 'One More Night', artist: 'Maroon 5', artistKeys: ['maroon-5'], rotation: 'gold', era: '2010s' },
  { title: 'Thunder', artist: 'Imagine Dragons', artistKeys: ['imagine-dragons'], rotation: 'gold', era: '2010s' },
  { title: 'Girls Like You', artist: 'Maroon 5 feat. Cardi B', artistKeys: ['maroon-5', 'cardi-b'], rotation: 'gold', era: '2010s' },

  { title: 'Rubber Band Man', artist: 'Mumford & Sons feat. Hozier', artistKeys: ['mumford-and-sons', 'hozier'], rotation: 'discovery', era: '2020s', chartRank: 37 },
  { title: 'Holly!', artist: 'The Band CAMINO', artistKeys: ['the-band-camino'], rotation: 'discovery', era: '2020s' },
  { title: 'Tastes So Good', artist: 'Niall Horan', artistKeys: ['niall-horan'], rotation: 'discovery', era: '2020s' },
  { title: 'Bring Your Love', artist: 'Madonna & Sabrina Carpenter', artistKeys: ['madonna', 'sabrina-carpenter'], rotation: 'discovery', era: '2020s', chartRank: 22 },
  { title: 'Repeat It', artist: 'Martin Garrix & Ed Sheeran', artistKeys: ['martin-garrix', 'ed-sheeran'], rotation: 'discovery', era: '2020s' },
  { title: 'Heroine', artist: 'Maroon 5', artistKeys: ['maroon-5'], rotation: 'discovery', era: '2020s', chartRank: 34 },
  { title: 'Homesick', artist: 'Phillip Phillips', artistKeys: ['phillip-phillips'], rotation: 'discovery', era: '2020s' },
  { title: 'Ice Cold Lakes', artist: 'The Fray', artistKeys: ['the-fray'], rotation: 'discovery', era: '2020s', chartRank: 36 },
]

const covers = [
  'linear-gradient(145deg, #e2ff67 0%, #62783a 45%, #11140d 100%)',
  'linear-gradient(145deg, #6fe7d5 0%, #24667a 48%, #10182b 100%)',
  'linear-gradient(145deg, #b499ff 0%, #59477e 48%, #171321 100%)',
  'linear-gradient(145deg, #ff977c 0%, #864b62 48%, #21141d 100%)',
  'linear-gradient(145deg, #f6d875 0%, #ba6f46 50%, #1e1711 100%)',
  'linear-gradient(145deg, #89bfff 0%, #314872 48%, #0d111d 100%)',
]

const rotationAge: Record<Rotation, number> = { power: 1, current: 3, recurrent: 7, gold: 14, discovery: 10 }

function slug(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export const HOT_AC_TRACKS: Track[] = seeds.map((seed, index) => ({
  id: `hotac-${String(index + 1).padStart(2, '0')}-${slug(seed.title)}`,
  title: seed.title,
  artist: seed.artist,
  artistKeys: seed.artistKeys,
  album: seed.chartRank ? 'AT40 Hot AC · June 27, 2026' : 'Hot AC recurrent library',
  durationMs: (174 + (index * 17) % 67) * 1000,
  bpm: 78 + (index * 11) % 58,
  energy: 0.48 + ((index * 13) % 43) / 100,
  valence: 0.36 + ((index * 17) % 53) / 100,
  era: seed.era,
  mood: index % 4 === 0 ? ['warm', 'familiar'] : index % 4 === 1 ? ['bright', 'driving'] : index % 4 === 2 ? ['emotional', 'open'] : ['rhythmic', 'upbeat'],
  rotation: seed.rotation,
  contentRating: 'unknown',
  language: 'English',
  rotationDebt: rotationAge[seed.rotation] + index % 3,
  cover: covers[index % covers.length] ?? covers[0],
  chartRank: seed.chartRank,
  chartDated: seed.chartRank ? '2026-06-27' : undefined,
  chartSource: seed.chartRank ? sourceUrl : undefined,
  featureProvenance: 'estimated',
  assetStatus: 'metadata-only',
  sources: [
    { provider: 'demo', externalId: `editorial-${index + 1}`, playable: true },
    { provider: 'broadcast', externalId: '', playable: false },
    { provider: 'spotify', externalId: '', playable: false },
    { provider: 'deezer', externalId: '', playable: false },
  ],
}))

export const HOT_AC_PROFILE: FormatProfile = {
  id: 'profile-pulse-hot-ac-v1',
  name: 'Pulse 96.5 Hot AC',
  statement: "Today's biggest adult-pop songs, strong recent recurrents and familiar 2000s/2010s gold—with a bright, friendly forward motion.",
  energyCurve: [0.58, 0.64, 0.72, 0.66, 0.79, 0.7],
  discoveryTarget: 0.08,
  artistSeparationMinutes: 90,
  titleSeparationMinutes: 240,
  explicitAllowed: false,
  eraTargets: { '2020s': 0.7, '2010s': 0.13, '2000s': 0.11, '90s': 0.06 },
  rotationPattern: ['power', 'current', 'recurrent', 'power', 'gold', 'current', 'recurrent', 'power', 'current', 'gold', 'recurrent', 'discovery'],
}

export const DEFAULT_SCHEDULE_REQUEST = {
  mode: 'linear' as const,
  destination: 'demo' as const,
  catalog: HOT_AC_TRACKS,
  profile: HOT_AC_PROFILE,
  startAt: '2026-07-14T16:00:00.000Z',
  targetCount: 12,
  targetDurationMs: 44 * 60 * 1000,
  seed: 'pulse-hot-ac-tuesday-v1',
}
