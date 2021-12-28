const fs = require('fs');
const readline = require('readline');

writeDiffNamesToFile();

function writeDiffNamesToFile() {
  const filename = 'diff_names.txt';
  const diffNamesSet = getDiffNames();
  for (let name of diffNamesSet) {
    fs.appendFileSync(filename, `${name}\n`, (error) => {
      console.error(`ERROR writing to ${filename}`);
      if (error) throw error;
    });
  }
}

function getDiffNames() {
  const uniqueNamesSet = getUniqueNamesSet();
  const usedNamesSet = getUsedNamesSet();
  const diffNamesSet = new Set(uniqueNamesSet);
  uniqueNamesSet.forEach((uniqueName) => {
    if (usedNamesSet.has(uniqueName)) {
      diffNamesSet.delete(uniqueName);
    }
  });
  return diffNamesSet;
}

function getUniqueNamesSet() {
  const uniqueNamesSet = new Set();
  const uniqueNamesTxt = fs.readFileSync('unique_names.txt', 'utf-8');
  let uniqueNamesList = uniqueNamesTxt.split(/\r?\n/);
  for (let name of uniqueNamesList) {
    uniqueNamesSet.add(name);
  }
  return uniqueNamesSet;
}

function getUsedNamesSet() {
  const usedNamesSet = new Set();
  const usedNamesTxt = fs.readFileSync('used_names.txt', 'utf-8');
  let usedNamesList = usedNamesTxt.split(/\r?\n/);
  for (let name of usedNamesList) {
    usedNamesSet.add(name);
  }
  return usedNamesSet;
}