const fs = require('fs');

function saveConstants(language, gametypes) {
    var constants = {
    languages: language,
    gametypes: gametypes
      };

var data = JSON.stringify(constants);

fs.writeFile(__dirname + '/constants.json', data, function (err) {
  if (err) {
    console.log(`There was an error saving the data. Error: ${err}`);
  }
});
}

function readConstants(){
    var data = fs.readFileSync('./constants.json');
    try {
      savedData = JSON.parse(data);
      var languages = savedData.languages,
      gametypes = savedData.gametypes,
      versions = savedData.versions;
          return {
        languages,
        gametypes,
        versions
    };
    }
    catch (err) {
      console.log(`There was an error parsing the JSON. Error: ${err}`)
}};

function saveOwnerSettings(api, userLimit, blockedUsers) {
  var constants = {
  api: api,
  userLimit: userLimit,
  blockedUsers: blockedUsers
    };

var data = JSON.stringify(constants);

fs.writeFile(__dirname + '/ownerSettings.json', data, function (err) {
if (err) {
  console.log(`There was an error saving the data. Error: ${err}`);
}
});
}

function readOwnerSettings(){
  var data = fs.readFileSync('./ownerSettings.json');
  try {
    savedData = JSON.parse(data);
    var api = savedData.api,
    userLimit = savedData.userLimit,
    blockedUsers = savedData.blockedUsers;
        return {
      api,
      userLimit,
      blockedUsers
  };
  }
  catch (err) {
    console.log(`There was an error parsing the JSON. Error: ${err}`)
}};

function pauseToHMS(pauseTime, amount, type) { //old function for a pause command
      var pauseseconds = pauseTime / 1000 
			var pureDays = Math.floor((pauseseconds / (3600 * 24)));
			var pauseDays = pureDays > 0 ? pureDays + (pureDays == 1 ? ' day ' : ' days ') : '';
      var hmspause = new Date(pauseseconds * 1000).toISOString().substr(11, 8)
			return `${pauseDays}${hmspause}, or ${amount} ${type}!`;
}

function unitType(unit) { // old thing for pause command
    if (unit == 'h') {var multiple = 3600000, type = 'hour(s)'
    } else if (unit == 'm') {var multiple = 60000, type = 'minute(s)'
    } else if (unit == 's') {var multiple = 1000, type = 'second(s)'
    } else {var multiple = 1000, type = 'second(s) because you did not specify a valid unit'}
    return {multiple, type};
}

function gameAlreadyAdded(whitelistedGames, blacklistedGames) { //checks if whitelist and blacklist have the same values
  var combinedArrays = whitelistedGames.concat(blacklistedGames);

  return (combinedArrays.length === new Set(combinedArrays).size)

}

async function checkPermsOfBot(channel, bot) {
	let perm = await channel.permissionsFor(bot).toArray()
  let perm1 = perm.includes("MANAGE_CHANNELS");
  let perm2 = perm.includes("ADD_REACTIONS");
  let perm3 = perm.includes("VIEW_CHANNEL");
  let perm4 = perm.includes("SEND_MESSAGES");
  let perm5 = perm.includes("MANAGE_MESSAGES");
  let perm6 = perm.includes("EMBED_LINKS");
  let perm7 = perm.includes("READ_MESSAGE_HISTORY");
  let perm8 = perm.includes("MANAGE_ROLES");

	if (!perm1 || !perm2 || !perm3 || !perm4 || !perm5 || !perm6 || !perm7 || !perm8) {
		let permArray = [];
		if (!perm1) perm.includes("MANAGE_CHANNELS");
    if (!perm2) perm.includes("ADD_REACTIONS");
    if (!perm3) perm.includes("VIEW_CHANNEL");
    if (!perm4) perm.includes("SEND_MESSAGES");
    if (!perm5) perm.includes("MANAGE_MESSAGES");
    if (!perm6) perm.includes("EMBED_LINKS");
    if (!perm7) perm.includes("READ_MESSAGE_HISTORY");
    if (!perm8) perm.includes("MANAGE_ROLES");

		let errors = (`${permArray.join(', ')}`);
    if (!perm3 || !perm4) throw errors
    return errors
	} else {
    return;
  }
}

module.exports = { saveConstants, readConstants, pauseToHMS, unitType, gameAlreadyAdded, saveOwnerSettings, readOwnerSettings, checkPermsOfBot };