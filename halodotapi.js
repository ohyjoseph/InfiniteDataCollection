const INITIAL_SKIP = 0;
const SIZE = 50;
const LIMIT = 181500;

const axios = require('axios').default;
const fs = require('fs');
const readline = require('readline');
const lib = require('lib')({token: ''});

const PVP = 'pvp-only';
const ARENA = 'arena';

const CROSSPLAY_QUEUE = 'ranked:open:crossplay';
const MNK_QUEUE = 'ranked:solo-duo:mnk';
const CONTROLLER_QUEUE = 'ranked:solo-duo:controller';


main(INITIAL_SKIP, SIZE);


async function main(initialSkip, size) {
  let skip = initialSkip;
  while (skip < LIMIT) {
    console.log(`${skip} to ${skip + size}`);
    await writeChunkToFile(skip, size);
    skip += size;
  }
  console.log('FINISHED');
}

async function writeChunkToFile(skip, size) {
  const usernames = getUsernames(skip, size);

  const usersStatsObj = JSON.parse(fs.readFileSync("usersStats.json","utf-8"));

  const userObjPromises = [];
  for (const username of usernames) {
    try {
      userObjPromises.push(fetchUserGameData(username));
    } catch(error) {
    }
  }
  let userObjResults = await Promise.all(userObjPromises).catch((err) => {
    console.error(`ERROR ${skip} to ${skip + size}`);
    for (let username of usernames) {
      fs.appendFileSync("redo_names.txt", `${username}\n`, function (err) {
            if (err) throw err;
          });
    }
    });

  if (!Array.isArray(userObjResults)) return;

  for (let userObj of userObjResults) {
    usersStatsObj[userObj.username] = userObj;
  }
  
  writeObjToFile(usersStatsObj);
}

function getUsernames(skip, size) {
  const usernamesList = [];
  const usernamesTxt = fs.readFileSync('unique_names.txt', 'utf-8');
  return usernamesTxt.split(/\r?\n/).slice(skip, skip + size);
}

// make API request
async function fetchUserGameData(username) {
  const userObj = {username: username};

  let crossplayPromise = fetchPlaylistData(username, ARENA, CROSSPLAY_QUEUE);
  let mnkPromise = fetchPlaylistData(username, ARENA, MNK_QUEUE);
  let controllerPromise = fetchPlaylistData(username, ARENA, CONTROLLER_QUEUE);
  let pvpPromise = fetchPlaylistData(username, PVP);
  const promises = [crossplayPromise, mnkPromise, controllerPromise, pvpPromise];

  let rankPromise = fetchRankData(username);

  let promisesResults = await Promise.all(promises);
  for (let result of promisesResults) {
    let playlist = result.additional.playlist
    if (playlist) userObj[playlist] = result.data;
    else userObj[result.additional.experience] = result.data;
  }
  let rankResults = await rankPromise;
  let rankCrossplayObj = {value: rankResults.data[0].response.current.value, tier: rankResults.data[0].response.current.tier, sub_tier: rankResults.data[0].response.current.sub_tier, measurement_matches_remaining: rankResults.data[0].response.current.measurement_matches_remaining}
  userObj[CROSSPLAY_QUEUE].rank = [rankCrossplayObj];

  let rankControllerObj = {value: rankResults.data[1].response.current.value, tier: rankResults.data[1].response.current.tier, sub_tier: rankResults.data[1].response.current.sub_tier, measurement_matches_remaining: rankResults.data[1].response.current.measurement_matches_remaining}
  userObj[CONTROLLER_QUEUE].rank = [rankControllerObj];

  let rankMnkObj = {value: rankResults.data[2].response.current.value, tier: rankResults.data[2].response.current.tier, sub_tier: rankResults.data[2].response.current.sub_tier, measurement_matches_remaining: rankResults.data[2].response.current.measurement_matches_remaining}
  userObj[MNK_QUEUE].rank = [rankMnkObj];
  
  return userObj;
}

async function fetchPlaylistData(username, experience, playlist=undefined) {
  const payload = {
      gamertag: username,
      experience: experience,
    };
  if (playlist) payload['playlist'] = playlist;

  try {
    return await lib.halo.infinite['@0.2.3'].stats['service-record']({
        gamertag: username,
        experience: experience,
        playlist: playlist
      });
  } catch(err) {
    console.error(`ERROR ${username}`);
    fs.appendFileSync("error_names.txt", `${username}\n`, function (err) {
            if (err) throw err;
          })
  }
}

async function fetchRankData(username) {
  try {
    return await lib.halo.infinite['@0.2.3'].stats.csrs({
      gamertag: username,
      season: 1
    });
  } catch(err) {
    console.error(`ERROR ${username}`);
    fs.appendFileSync("error_names.txt", `${username}\n`, function (err) {
            if (err) throw err;
          })
  }
}

function writeObjToFile(obj) {
  try {
    fs.writeFileSync("usersStats.json", JSON.stringify(obj), "utf-8");
  } catch(error) {
    console.error('error writing to file');
  }
}


function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function sleep(ms) {
    await timeout(ms);
}