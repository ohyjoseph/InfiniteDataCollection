//4500
//18700
//20100
//31700
//42500
//47900
//53500
//70700
//80100
//93300
//101100
//119300
//126500
//143100
//145700
//149300
//149500
//161700
//168700
//170900
//175700
//180900
const INITIAL_SKIP = 180900;
const SIZE = 200;
const LIMIT = 182000;

const CSV_FILE = 'userStats.csv';

const axios = require('axios').default;
const fs = require('fs');
const readline = require('readline');

const TIME_PLAYED = 'timePlayed';
const MATCHES_PLAYED = 'matchesPlayed';
const MATCHES_WON = 'matchesWon';
const MATCHES_LOST = 'matchesLost';
const MATCHES_TIED = 'matchesTied';
const MATCHES_DNF = 'matchesDnf';
const SCORE = 'score';
const PERSONAL_SCORE = 'personalScore';
const MVPS = 'mvps';
const KILLS = 'kills';
const DEATHS = 'deaths';
const ASSISTS = 'assists';
const CALLOUT_ASSISTS = 'calloutAssists';
const HEADSHOT_KILLS = 'headshotKills';
const MELEE_KILLS = 'meleeKills';
const GRENADE_KILLS = 'grenadeKills';
const POWER_WEAPON_KILLS = 'powerWeaponKills';
const SUICIDES = 'suicides';
const BETRAYALS = 'betrayals';
const SHOTS_FIRED = 'shotsFired';
const SHOTS_HIT = 'shotsHit';
const DAMAGE_DEALT = 'damageDealt';
const DAMAGE_TAKEN = 'damageTaken';
const MAX_KILLING_SPREE = 'maxKillingSpree';
const AVG_TIME_ALIVE = 'avgTimeAlive';
const CSR = 'csr';
const TIER = 'tier';
const RANK = 'rank';
const PERCENTILE = 'percentile';
const VALUE = 'value';

const CRP_NAME = 'Crossplay';
const MNK_NAME = 'Solo/Duo KBM';
const CON_NAME = 'Solo/Duo Controller';
const CRP_HASH = 'edfef3ac-9cbe-4fa2-b949-8f29deafd483';
const MNK_HASH = 'f7eb8c71-fedb-4696-8c0f-96025e285ffd';
const CON_HASH = 'f7f30787-f607-436b-bdec-44c65bc2ecef';

const QPL_NAME = 'quick-play';
const BTB_NAME = 'btb';
const TAC_NAME = 'tactical-slayer';

const API_URL_START_SECTION = 'https://api.tracker.gg/api/v2/halo-infinite/standard/profile/xbl/';
const API_URL_SEGMENT_SECTION = '/segments/overview?experience=';
const API_URL_RANKED_SECTION = 'ranked&playlist=';

const createCrpUrl = (username) => {
  return `${API_URL_START_SECTION}${username}${API_URL_SEGMENT_SECTION}${API_URL_RANKED_SECTION}${CRP_HASH}`;
}
const createMnkUrl = (username) => {
  return `${API_URL_START_SECTION}${username}${API_URL_SEGMENT_SECTION}${API_URL_RANKED_SECTION}${MNK_HASH}`;
}
const createConUrl = (username) => {
  return `${API_URL_START_SECTION}${username}${API_URL_SEGMENT_SECTION}${API_URL_RANKED_SECTION}${CON_HASH}`;
}
const createCsrUrl = (username) => {
  return `${API_URL_START_SECTION}${username}`
}
const createTacUrl = (username) => {
  return `${API_URL_START_SECTION}${username}${API_URL_SEGMENT_SECTION}${TAC_NAME}`;
}
const createQplUrl = (username) => {
  return `${API_URL_START_SECTION}${username}${API_URL_SEGMENT_SECTION}${QPL_NAME}`;
}
const createBtbUrl = (username) => {
  return `${API_URL_START_SECTION}${username}${API_URL_SEGMENT_SECTION}${BTB_NAME}`;
}


// writeCsvHeaderToFile(CSV_FILE);
main(INITIAL_SKIP, SIZE, CSV_FILE);




async function main(initialSkip, size, filename) {
  let skip = initialSkip;
  while (skip < LIMIT) {
    console.log(`${skip} to ${skip + size}`);
    await writeChunkToFile(skip, size, filename);
    skip += size;
  }
  console.log('FINISHED');
}

async function writeChunkToFile(skip, size, filename) {
  const usernames = getUsernames(skip, size);

  const userCsvWrites = [];
  for (const username of usernames) {
    userCsvWrites.push(writeCsvStatsToFile(filename, username));
  }
  let userObjResults = await Promise.all(userCsvWrites).catch((err) => {
    console.error(`ERROR in chunk file write ${skip} to ${skip+size}`);
    });
}

function writeCsvHeaderToFile(filename) {
  fs.appendFileSync(filename, `${getCsvHeader()}\n`, (error) => {
      console.error(`ERROR writing csv headers to ${filename}`);
      if (error) throw error;
    });
}

async function writeCsvStatsToFile(filename, username) {
  const csvStats = await getCsvStats(username);
  fs.appendFileSync(filename, `${csvStats}\n`, (error) => {
      console.error(`ERROR writing ${username} to ${filename}`);
      if (error) throw error;
    });
}

async function getCsvStats(username) {
  const rankedCsv = await convertRankedDataToStatsCsv(username);
  const unrankedCsv = await convertUnrankedDataToStatsCsv(username);
  return `${username},${rankedCsv},${unrankedCsv}`;
}

// convertRankedDataToStatsCsv('xkamakazi cowxx');

async function convertRankedDataToStatsCsv(username) {
  const DEFAULT_CSV_VALUE = createCommaString(28);
  const crpDataPromise = getGameData(username, createCrpUrl);
  const conDataPromise = getGameData(username, createConUrl);
  const mnkDataPromise = getGameData(username, createMnkUrl);
  const csrObj = await getCsrObj(username);
  const csrCsvObj = convertCsrObjToCsvObj(csrObj);
  let crpCsv;
  let conCsv;
  let mnkCsv;

  const allData = await Promise.all([crpDataPromise, conDataPromise, mnkDataPromise]);
  allData.forEach((data) => {
    if (!data) return;
    const playlistHash = data.attributes.playlist;
    const statsCsv = convertStatsObjToCsv(data.stats);
    if (playlistHash === CRP_HASH) crpCsv = `${statsCsv},${csrCsvObj[playlistHash]}`;
    else if (playlistHash === CON_HASH) conCsv = `${statsCsv},${csrCsvObj[playlistHash]}`;
    else if (playlistHash === MNK_HASH) mnkCsv = `${statsCsv},${csrCsvObj[playlistHash]}`;
  });
  if (!crpCsv) crpCsv = DEFAULT_CSV_VALUE;
  if (!conCsv) conCsv = DEFAULT_CSV_VALUE;
  if (!mnkCsv) mnkCsv = DEFAULT_CSV_VALUE;
  return `${crpCsv},${conCsv},${mnkCsv}`;
}

async function convertUnrankedDataToStatsCsv(username) {
  const DEFAULT_CSV_VALUE = createCommaString(24);
  const qplDataPromise = getGameData(username, createQplUrl);
  const btbDataPromise = getGameData(username, createBtbUrl);
  const tacDataPromise = getGameData(username, createTacUrl);
  let qplCsv;
  let btbCsv;
  let tacCsv;

  const allData = await Promise.all([qplDataPromise, btbDataPromise, tacDataPromise]);
  allData.forEach((data) => {
    if (!data) return;
    const experience = data.attributes.experience;
    const statsCsv = convertStatsObjToCsv(data.stats);
    if (experience === QPL_NAME) qplCsv = statsCsv;
    else if (experience === BTB_NAME) btbCsv = statsCsv;
    else if (experience === TAC_NAME) tacCsv = statsCsv;
  });
  if (!qplCsv) qplCsv = DEFAULT_CSV_VALUE;
  if (!btbCsv) btbCsv = DEFAULT_CSV_VALUE;
  if (!tacCsv) tacCsv = DEFAULT_CSV_VALUE;
  return `${qplCsv},${btbCsv},${tacCsv}`;
}

async function getGameData(username, urlCreator) {
  const crpResponse = await fetchGameData(username, urlCreator);
  if (!crpResponse || !crpResponse.data || !crpResponse.data.data || !crpResponse.data.data.length) return null;
  return crpResponse.data.data[0];
}

async function fetchGameData(username, urlCreator) {
  return await axios.get(urlCreator(username)).catch((err) => {
    console.error(`ERROR fetching ${username}`);
    fs.appendFileSync("redo_names.txt", `${username}\n`, (error) => {
      console.error(`ERROR writing ${username} to redo_names.txt`);
      return Promise.resolve();
    });
    return Promise.resolve();
  });
}

function convertDataToStatsObj(playlistData) {
  const statsObj = playlistData.data[0].stats;
  return {
    [TIME_PLAYED]: statsObj[TIME_PLAYED][VALUE], 
    [MATCHES_PLAYED]: statsObj[MATCHES_PLAYED][VALUE], 
    [MATCHES_WON]: statsObj[MATCHES_WON][VALUE], 
    [MATCHES_LOST]: statsObj[MATCHES_LOST][VALUE], 
    [MATCHES_TIED]: statsObj[MATCHES_TIED][VALUE], 
    [MATCHES_DNF]: statsObj[MATCHES_DNF][VALUE], 
    [SCORE]: statsObj[SCORE][VALUE], 
    [PERSONAL_SCORE]: statsObj[PERSONAL_SCORE][VALUE], 
    [MVPS]: statsObj[MVPS][VALUE], 
    [KILLS]: statsObj[KILLS][VALUE], 
    [DEATHS]: statsObj[DEATHS][VALUE], 
    [ASSISTS]: statsObj[ASSISTS][VALUE], 
    [CALLOUT_ASSISTS]: statsObj[CALLOUT_ASSISTS][VALUE], 
    [HEADSHOT_KILLS]: statsObj[HEADSHOT_KILLS][VALUE], 
    [MELEE_KILLS]: statsObj[MELEE_KILLS][VALUE], 
    [GRENADE_KILLS]: statsObj[GRENADE_KILLS][VALUE], 
    [POWER_WEAPON_KILLS]: statsObj[POWER_WEAPON_KILLS][VALUE], 
    [SUICIDES]: statsObj[SUICIDES][VALUE], 
    [BETRAYALS]: statsObj[BETRAYALS][VALUE], 
    [SHOTS_FIRED]: statsObj[SHOTS_FIRED][VALUE], 
    [SHOTS_HIT]: statsObj[SHOTS_HIT][VALUE], 
    [DAMAGE_DEALT]: statsObj[DAMAGE_DEALT][VALUE], 
    [DAMAGE_TAKEN]: statsObj[DAMAGE_TAKEN][VALUE], 
    [MAX_KILLING_SPREE]: statsObj[MAX_KILLING_SPREE][VALUE], 
    [AVG_TIME_ALIVE]: statsObj[AVG_TIME_ALIVE][VALUE]
  }
}

function convertStatsObjToCsv(statsObj) {
  return `${statsObj[TIME_PLAYED][VALUE]},${statsObj[MATCHES_PLAYED][VALUE]},${statsObj[MATCHES_WON][VALUE]},${statsObj[MATCHES_LOST][VALUE]},${statsObj[MATCHES_TIED][VALUE]},${statsObj[MATCHES_DNF][VALUE]},${statsObj[SCORE][VALUE]},${statsObj[PERSONAL_SCORE][VALUE]},${statsObj[MVPS][VALUE]},${statsObj[KILLS][VALUE]},${statsObj[DEATHS][VALUE]},${statsObj[ASSISTS][VALUE]},${statsObj[CALLOUT_ASSISTS][VALUE]},${statsObj[HEADSHOT_KILLS][VALUE]},${statsObj[MELEE_KILLS][VALUE]},${statsObj[GRENADE_KILLS][VALUE]},${statsObj[POWER_WEAPON_KILLS][VALUE]},${statsObj[SUICIDES][VALUE]},${statsObj[BETRAYALS][VALUE]},${statsObj[SHOTS_FIRED][VALUE]},${statsObj[SHOTS_HIT][VALUE]},${statsObj[DAMAGE_DEALT][VALUE]},${statsObj[DAMAGE_TAKEN][VALUE]},${statsObj[MAX_KILLING_SPREE][VALUE]},${statsObj[AVG_TIME_ALIVE][VALUE]}`;
}

function getStatsHeader(prefix='') {
  let separator = '_';
  if (!prefix) separator = '';
  return `${prefix}${separator}${TIME_PLAYED},${prefix}${separator}${MATCHES_PLAYED},${prefix}${separator}${MATCHES_WON},${prefix}${separator}${MATCHES_LOST},${prefix}${separator}${MATCHES_TIED},${prefix}${separator}${MATCHES_DNF},${prefix}${separator}${SCORE},${prefix}${separator}${PERSONAL_SCORE},${prefix}${separator}${MVPS},${prefix}${separator}${KILLS},${prefix}${separator}${DEATHS},${prefix}${separator}${ASSISTS},${prefix}${separator}${CALLOUT_ASSISTS},${prefix}${separator}${HEADSHOT_KILLS},${prefix}${separator}${MELEE_KILLS},${prefix}${separator}${GRENADE_KILLS},${prefix}${separator}${POWER_WEAPON_KILLS},${prefix}${separator}${SUICIDES},${prefix}${separator}${BETRAYALS},${prefix}${separator}${SHOTS_FIRED},${prefix}${separator}${SHOTS_HIT},${prefix}${separator}${DAMAGE_DEALT},${prefix}${separator}${DAMAGE_TAKEN},${prefix}${separator}${MAX_KILLING_SPREE},${prefix}${separator}${AVG_TIME_ALIVE}`;
}

function getRankedStatsHeader(prefix='') {
  let separator = '_';
  if (!prefix) separator = '';
  const rankedHeader = `${prefix}${separator}${CSR},${prefix}${separator}${TIER},${prefix}${separator}${RANK},${prefix}${separator}${PERCENTILE}`;
  return `${getStatsHeader(prefix)},${rankedHeader}`;
}

function getCsvHeader() {
  const crpHeader = getRankedStatsHeader('crp');
  const conHeader = getRankedStatsHeader('con');
  const mnkHeader = getRankedStatsHeader('mnk');
  const qplHeader = getStatsHeader('qpl');
  const btbHeader = getStatsHeader('btb');
  const tacHeader = getStatsHeader('tac');

  return `gamertag,${crpHeader},${conHeader},${mnkHeader},${qplHeader},${btbHeader},${tacHeader},`;
}

function convertCsrObjToCsvObj(csrObj) {
  const csvObj = {};
  for (let playlistHash in csrObj) {
    let values = csrObj[playlistHash];
    csvObj[playlistHash] = `${values[CSR]},${values[TIER]},${values[RANK]},${values[PERCENTILE]}`;
  }
  return csvObj;
}

async function getCsrObj(username) {
  const DEFAULT_RANK_ENTRY = {'csr': '', 'tier': '', 'rank': '', 'percentile': ''};
  const csrObj = {[CRP_HASH]: DEFAULT_RANK_ENTRY, [CON_HASH]: DEFAULT_RANK_ENTRY, [MNK_HASH]: DEFAULT_RANK_ENTRY};
  const csrResponse = await fetchGameData(username, createCsrUrl);
  if (!csrResponse) return csrObj;
  const csrSegments = csrResponse.data.data.segments;
  for (let i=0; i<3; i++) {
    let segment = csrSegments[i];
    if (segment.type != CSR) continue;
    let playlistHash = segment.attributes.playlist;
    let rankObj = segment.stats.rank;
    let csr = rankObj.value;
    let rank = !rankObj.rank ? '' : rankObj.rank;
    let percentile = rankObj.percentile;
    let tier = rankObj.metadata.tierName.trim();
    csrObj[playlistHash] = {csr, tier, rank, percentile}
  }
  return csrObj;
}

function createCommaString(numCommas) {
  let commaString = '';
  for (let i=0; i<numCommas; i++) {
    commaString += ',';
  }
  return commaString;
}

function getUsernames(skip, size) {
  const usernamesList = [];
  const usernamesTxt = fs.readFileSync('unique_names.txt', 'utf-8');
  return usernamesTxt.split(/\r?\n/).slice(skip, skip + size);
}