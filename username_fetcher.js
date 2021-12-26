const axios = require('axios').default;
const fs = require('fs');

const INITIAL_SKIP = 20000;
const OPEN_TXT_NAME = 'open_usernames.txt';
const MNK_TXT_NAME = 'mnk_usernames.txt';
const CONTROLLER_TXT_NAME = 'controller_usernames.txt';
const FETCH_LIMIT = 100;
const SKIP_INCREMENT = 10000;

// 1 is open
// 2 is mnk
// 3 is controller
const PLAYLIST_PARAM = "&playlist="
const SKIP_PARAM = "&skip="
const LEADERBOARD_API_URL = `https://api.tracker.gg/api/v1/halo-infinite/standard/leaderboards?type=csr&platform=all&board=CurrentCsr&take=${FETCH_LIMIT}`;

// Gathered all usernames 12/23/21
// const usernamesSet = new Set();
// const mnk_usernames = fs.readFileSync('unique_mnk_names.txt', 'utf-8');
// mnk_usernames.split(/\r?\n/).forEach(line =>  {
//   usernamesSet.add(line);
// });
// const controller_usernames = fs.readFileSync('unique_controller_names.txt', 'utf-8');
// controller_usernames.split(/\r?\n/).forEach(line =>  {
//   usernamesSet.add(line);
// });
// console.log(usernamesSet.size)
// usernamesSet.forEach((name) => {
//   fs.appendFileSync("unique_names.txt", `${name}\n`, function (err) {
//               if (err) throw err;
//             });
// });


// updateUntilEnd(3, CONTROLLER_TXT_NAME, INITIAL_SKIP);


async function updateUntilEnd(playlist, filename, baseSkip) {
  let skip = baseSkip;
  let shouldContinue = true;
  while(shouldContinue) {
    let promiseList = [];
    for (let i=0; i<100; i++) {
      let currentSkip = skip + i * 100;
      console.log(currentSkip)
      promiseList.push(fetchThenUpdateTxt(LEADERBOARD_API_URL + PLAYLIST_PARAM + playlist.toString() + SKIP_PARAM + currentSkip.toString(), filename, currentSkip, 0));
    }
    skip += SKIP_INCREMENT;
    let returnValues = await Promise.all(promiseList);
    for (let value of returnValues) {
      shouldContinue = shouldContinue && value;
    }
  }
  console.log("FINISHED");
}

async function fetchThenUpdateTxt(url, filename, skip, failureCount=0) {
  
  return axios.get(url)
    .then(response => response.data.data)
    .then(data => {
        if (!data.items || !data.items.length) return false;
        data.items.forEach(item => {
          fs.appendFile(filename, `${item.id}\n`, function (err) {
            if (err) throw err;
          });      
        });
        return true;
      })
    .catch(async (err) => {
        console.log(skip, "Failure", failureCount)
        if (failureCount >= 50) return false;
        return await fetchThenUpdateTxt(url, filename, skip, failureCount+1);
      });
}