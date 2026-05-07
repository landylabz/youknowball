// Maps nflverse college strings -> YKB convention (matches players table + colleges table).
// When nflverse uses a different name than YKB expects, we normalize here.
//
// Pulled from actual YKB players + colleges tables. Update as new schools appear.

const ALIASES = {
  // SEC
  'Mississippi': 'Ole Miss',
  'Ole Miss': 'Ole Miss',
  'Miss': 'Ole Miss',
  'Texas A&M': 'Texas A&M',
  'Texas A & M': 'Texas A&M',
  'Louisiana State': 'LSU',
  'Miss. State': 'Mississippi State',
  'South Carolina': 'South Carolina',
  'Vanderbilt': 'Vanderbilt',

  // Big Ten
  'Penn St.': 'Penn State',
  'Ohio St.': 'Ohio State',
  'Michigan St.': 'Michigan State',
  'Iowa': 'Iowa',
  'Wisconsin': 'Wisconsin',
  'Oregon': 'Oregon',
  'USC': 'USC',
  'UCLA': 'UCLA',
  'Washington': 'Washington',

  // ACC
  'North Carolina': 'North Carolina',
  'UNC': 'North Carolina',
  'N.C. State': 'NC State',
  'North Carolina State': 'NC State',
  'Virginia Tech': 'Virginia Tech',
  'Va. Tech': 'Virginia Tech',
  'Georgia Tech': 'Georgia Tech',
  'Ga. Tech': 'Georgia Tech',
  'Florida State': 'Florida State',
  'Fla. State': 'Florida State',
  'Fla. St.': 'Florida State',
  'Boston Col.': 'Boston College',

  // Big 12
  'Oklahoma State': 'Oklahoma State',
  'Okla. State': 'Oklahoma State',
  'Kansas State': 'Kansas State',
  'Kan. State': 'Kansas State',
  'West Virginia': 'West Virginia',
  'W. Virginia': 'West Virginia',
  'Texas Tech': 'Texas Tech',
  'Iowa State': 'Iowa State',
  'Iowa St.': 'Iowa State',
  'Central Florida': 'UCF',
  'UCF': 'UCF',

  // Independents / Misc
  'Notre Dame': 'Notre Dame',
  'Brigham Young': 'BYU',
  'BYU': 'BYU',

  // Group of 5
  'Central Michigan': 'Central Michigan',
  'Cent. Michigan': 'Central Michigan',
  'Eastern Michigan': 'Eastern Michigan',
  'E. Michigan': 'Eastern Michigan',
  'Western Michigan': 'Western Michigan',
  'W. Michigan': 'Western Michigan',
  'Northern Illinois': 'Northern Illinois',
  'N. Illinois': 'Northern Illinois',
  'Ohio': 'Ohio',
  'Akron': 'Akron',
  'Miami (Ohio)': 'Miami (OH)',
  'Miami (OH)': 'Miami (OH)',
  'Miami (FL)': 'Miami',
  'Miami (Fla.)': 'Miami',

  // California schools
  'California': 'Cal',
  'Cal': 'Cal',
  'Cal-Berkeley': 'Cal',
  'San Diego State': 'San Diego State',
  'SDSU': 'San Diego State',
  'San Jose State': 'San Jose State',
  'Fresno State': 'Fresno State',

  // Other common
  'App. State': 'Appalachian State',
  'Appalachian State': 'Appalachian State',
  'Louisiana-Lafayette': 'Louisiana',
  'Louisiana': 'Louisiana',
  'Louisiana-Monroe': 'Louisiana-Monroe',
  'Southern Miss': 'Southern Miss',
  'Southern Mississippi': 'Southern Miss',
};

function normalizeCollege(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Direct alias lookup first
  if (ALIASES[trimmed]) return ALIASES[trimmed];
  // Return as-is if no alias needed (most cases)
  return trimmed;
}

module.exports = { normalizeCollege, ALIASES };
