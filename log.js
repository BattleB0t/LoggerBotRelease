const funcImports = require('./functions');
const userConfig = require('./userConfig.json')
const botOwner = userConfig["BotOwnerID"]
const prefix = userConfig["prefix"]
const hypixelAPIkey = userConfig["hypixelAPIkey"]
const cnsle = "843646684558131220"
const databaseImports = require('./databaseFuncs');
const controller = new AbortController();
const fetch = require('node-fetch');
const Discord = require('discord.js');

const fetchTimeout = (url, ms, { signal, ...options } = {}) => {
const controller = new AbortController();
const promise = fetch(url, { signal: controller.signal, ...options });
if (signal) signal.addEventListener("abort", () => controller.abort());
const timeout = setTimeout(() => controller.abort(), ms);
return promise.finally(() => clearTimeout(timeout));
};

function logStarter(client) {
    let readData = funcImports.readOwnerSettings();
    let api = readData.api;

    if (api == false) return;
    
          
    getTableData();
    async function getTableData() {
        try {
        let user = await databaseImports.getTable()
        let loadedUsers = 0;

        const timer = ms => new Promise(res => setTimeout(res, ms))

        try { //load balancer, calculates how many active users there are
          for (let i = 0; i < user.length; i++) {
            if (user[i].log == 0) {
              continue;
            }
            loadedUsers++
          }
        } finally {
          loadUsers();
        }

        async function loadUsers () { //loads users at an intveral
          for (let i = 0; i < user.length; i++) {
            if (user[i].log == 0) {
              continue;
            }
                apiCall(user[i], client, i);
                await timer(`${loadedUsers < 1 ? `${1000}` : `${10 / loadedUsers * 1000}`}`); //calculates the ms between each loading to balance the load across the 10 seconds. the most anyone will shift is 5 seconds with 1 new log user. the systems below works with up to 20 seconds in between logs.
          }
        }

        } catch (err) {
            client.channels.cache.get(cnsle).send(`An error occured while attempting to reach the database table. Error 17. \`${err}\``);
            console.log(`An error occured while attempting to reach the database table. ERROR_17.`);
        }
    }
}

function apiCall(dbUserData, client, userNumber) {
    if (!dbUserData.minecraftUUID || !dbUserData.language || !dbUserData.version || !dbUserData.offline || !dbUserData.timezone || !dbUserData.alerts || !dbUserData.logID) return console.log(`${botOwner[0]}, data was missing for a user during a log function. User: ${dbUserData.discordID} | ${dbUserData.discordUsername} | UUID: ${dbUserData.minecraftUUID}`);

    try { 
          Promise.all([
              fetchTimeout(`https://api.hypixel.net/player?uuid=${dbUserData.minecraftUUID}&key=${hypixelAPIkey}`, 1000, {
                signal: controller.signal
              }).then(player => player.json()),
              fetchTimeout(`https://api.hypixel.net/status?uuid=${dbUserData.minecraftUUID}&key=${hypixelAPIkey}`, 1000, {
                signal: controller.signal
              }).then(status => status.json())
            ])
            .then((apiData) => {
              checkIfServerExists(apiData, dbUserData, client, userNumber);
            })
            .catch((err) => {
              if (err.name === "AbortError") {
                client.channels.cache.get(cnsle).send(`An error occured while executing this command. The API failed to respond within 1.0 seconds, and the AbortController aborted. User: ${userNumber}. UTC Epoch: ${Date.now()} <https://status.hypixel.net/>`);
              } else {
                console.log(`API Error 9: ${err}`);
                client.channels.cache.get(cnsle).send(`${message.author}, an error occured while executing this command. This error is likely an invalid JSON`);
              }
            });
        
      } catch (err) {
        client.channels.cache.get(cnsle).send(`An error occured outside of a promise. Error 10. \`${err}\``);
        console.log(`Error 10: ${err}`);
      }
}

async function checkIfServerExists(apiData, dbUserData, client, userNumber) {
  let guild = await client.guilds.cache.get(`${dbUserData.guildID}`)

  if (!guild) {
    deleteData();
    async function deleteData() {
      try {
        await databaseImports.deleteData(dbUserData.discordID);
        return console.log(`${dbUserData.discordID} | ${dbUserData.discordUsername} was deleted via the log delete function as their guild no longer exists.`)
      } catch (err) {
        console.log(`Error 15: ${err}`)
      }
    }
  } else {
    checkAlertPermissions(apiData, dbUserData, client, userNumber)
  }
}

async function checkAlertPermissions(data, dbUserData, client, userNumber) {
	try {
  const alerts = client.channels.cache.get(`${dbUserData.alertID}`);

  if (!alerts) return console.log(`User's alert channel is no longer valid. User ${userNumber}: ${dbUserData.discordID} | ${dbUserData.discordUsername} | UUID: ${dbUserData.minecraftUUID}`)

	let returned = await funcImports.checkPermsOfBot(alerts, alerts.guild.me)

	if (returned) {
    if (returned.includes())
		console.log(`Permissions: ${dbUserData.discordID} | ${dbUserData.discordUsername} is missing ${returned}`)
		return alerts.send(`This bot is missing the following permissions(s): ${returned}. The bot cannot log. Turn these messages off temporarily with \`${prefix}log\``);
	}
	checkLogPermissions(data, dbUserData, client, userNumber, alerts);
	} catch (err) {
		console.log(`Someone appears to be attempting to crash the bot. Alert Permissions. User: ${dbUserData.discordID} | ${dbUserData.minecraftUUID} ${err}`)
	}	
}

async function checkLogPermissions(data, dbUserData, client, userNumber, alerts) {
	try {

  const log = client.channels.cache.get(`${dbUserData.logID}`);

  if (!log) return console.log(`User's log channel is no longer valid. User ${userNumber}: ${dbUserData.discordID} | ${dbUserData.discordUsername} | UUID: ${dbUserData.minecraftUUID}`)

	let returned = await funcImports.checkPermsOfBot(log, log.guild.me)

	if (returned) {
		console.log(`Permissions: ${dbUserData.discordID} | ${dbUserData.discordUsername} is missing ${returned}`)
		return alerts.send(`This bot is missing the following permissions(s): ${returned}. The bot cannot log. Turn these messages off temporarily with \`${prefix}log\``);
	}
	useAPIData(data, dbUserData, client, userNumber, alerts, log);
	} catch (err) {
		console.log(`Someone appears to be attempting to crash the bot. Log Permissions. User: ${dbUserData.discordID} | ${dbUserData.minecraftUUID} ${err}`)
    alerts.send(`This bot is missing the following permissions(s): ${err}. The bot cannot log. Turn these messages off temporarily with \`${prefix}log\``)
	}	
}

function useAPIData(data, dbUserData, client, userNumber, alerts, log) {

try {

    let notif = dbUserData.alerts.split(" ") //0 = blacklist, 1 = whitelist, 2 = language, 3 = session, 4 = offline, 5 = version

    let tzOffset = (dbUserData.timezone * 3600000);
    let timeString = new Date(Date.now() + tzOffset).toLocaleTimeString('en'); 
    let dateString = new Date(Date.now() + tzOffset).toLocaleDateString('en-GB');  

    let timeSinceLastLogin = `${secondsToDays(new Date() - data[0].player.lastLogin)}${new Date(new Date() - data[0].player.lastLogin).toISOString().substr(11, 8)}`
    let ceilRoundedLastLogin = Math.ceil((new Date() - data[0].player.lastLogin) / 1000)

    let timeSincefLastLogout = `${secondsToDays(new Date() - data[0].player.lastLogout)}${new Date(new Date() - data[0].player.lastLogout).toISOString().substr(11, 8)}`
    let ceilRoundedLastLogout = Math.ceil((new Date() - data[0].player.lastLogout) / 1000)

    let timestampOfLastLogin = new Date(data[0].player.lastLogin + tzOffset).toLocaleString('en-IN', { hour12: true });
    let timestampOfLastLogout = new Date(data[0].player.lastLogout + tzOffset).toLocaleString('en-IN', { hour12: true });

    let lastPlaytime = `${secondsToDays(data[0].player.lastLogout - data[0].player.lastLogin)}${new Date(data[0].player.lastLogout - data[0].player.lastLogin).toISOString().substr(11, 8)}`
    let relogEventTime = (data[0].player.lastLogin - data[0].player.lastLogout) / 1000; //not used currently

    if (data[1].session.online && data[1].session.gameType !== undefined) {
      if (dbUserData.whitelist) {
        let whitelistedGames = dbUserData.whitelist.split(" ")
        whitelistedGames.push("LIMBO", "MAIN", "REPLAY", "TOURNAMENT", "PROTOTYPE", "LEGACY");
        var whitelistCheck = whitelistedGames.indexOf(data[1].session.gameType.toUpperCase());
      } else {
        let whitelistedGames = []
        whitelistedGames.push("LIMBO", "MAIN", "REPLAY", "TOURNAMENT", "PROTOTYPE", "LEGACY");
        var whitelistCheck = whitelistedGames.indexOf(data[1].session.gameType.toUpperCase());
      }
      if (dbUserData.blacklist) {
        let blacklistedGames = dbUserData.blacklist.split(" ")
        var blacklistCheck = blacklistedGames.indexOf(data[1].session.gameType.toUpperCase())
      } else {
        var blacklistCheck = -1
      }
    }

  function secondsToDays(ms) { //calculating days from seconds
      ms = ms / 1000
      let day = Math.floor(ms / (3600 * 24));
      let days = day > 0 ? day + (day == 1 ? ' day ' : ' days ') : ''; //may be a grammar bug somewhere here
      return days;
    }

  function loginTimeFunc() {
      let loginTime = dbUserData.offline.split(" ")
      let loginTimep1 = loginTime[0] * 1
      let loginTimep2 = loginTime[1] * 1
      let timeLastLogin = (new Date(data[0].player.lastLogin + tzOffset).getHours()) + ((new Date(data[0].player.lastLogin + tzOffset).getMinutes()) / 60)

      if (loginTimep1 < loginTimep2) {
        if (timeLastLogin >= loginTimep1 && timeLastLogin <= loginTimep2) return true;
        return false;
      } else if (loginTimep1 > loginTimep2) {
        if (timeLastLogin >= loginTimep1 || timeLastLogin <= loginTimep2) return true;
        return false;
      }
    }

  function relogEvent() {
    if (dbUserData.loginMS !== data[0].player.lastLogin && ceilRoundedLastLogin <= 45 && (relogEventTime < 10 && relogEventTime > 0)) {
      writeLoginAndLogoutMS();
      let relogEmbed = new Discord.MessageEmbed()
          .setColor('#FFAA00')
          .setTitle('**Relog detected!**')
          .setDescription(`A relog that lasted ${roundedRelogTime} seconds was detected at ${timeString}`)
          .setFooter(`Alert at ${dateString} | ${timeString}`, 'http://www.pngall.com/wp-content/uploads/2017/05/Alert-Download-PNG.png')
      log.send(relogEmbed);
      async function writeLoginAndLogoutMS() {
        try {
          await databaseImports.changeData(dbUserData.discordID, data[0].player.lastLogin, `UPDATE data SET loginMS = ? WHERE discordID = ?`);
          await databaseImports.changeData(dbUserData.discordID, data[0].player.lastLogout, `UPDATE data SET logoutMS = ? WHERE discordID = ?`);

          let roundedRelogTime = Math.round(relogEventTime * 100) / 100

      if (notif[3] == false) return true;
        alerts.send(`<@${dbUserData.discordID}>, a relog that lasted ${roundedRelogTime} seconds was detected at ${timeString}. You can turn off session alerts with \`${prefix}alert session\`. Otherwise, please ensure your account is secure. Mojang Accounts: <https://bit.ly/3f7gdBf> Microsoft Accounts: <https://bit.ly/3zUdVOo>`);

        } catch (err) {
          console.log(`ERROR_3: ${err}`);
          client.channels.cache.get(cnsle).send(`An error occured while writing a new login. Please report this. ERROR_3: \`${err}\``);
        }
      }
      return;
          }
      loginLogout();
    }

  function loginLogout() {

    if (dbUserData.logoutMS !== data[0].player.lastLogout && ceilRoundedLastLogout <= 45) { //Sends msg to discord notif on logout
      writeLogoutMS();
      let logoutEmbed = new Discord.MessageEmbed()
            .setColor('#555555')
            .setTitle('**Logout detected!**')
            .setFooter(`Alert at ${dateString} | ${timeString}`, 'http://www.pngall.com/wp-content/uploads/2017/05/Alert-Download-PNG.png')
            .setDescription(`A logout at ${timestampOfLastLogout} was detected at ${timeString}. Playtime was ${lastPlaytime}`);
        log.send(logoutEmbed);
      async function writeLogoutMS() {
        try {
          await databaseImports.changeData(dbUserData.discordID, data[0].player.lastLogout, `UPDATE data SET logoutMS = ? WHERE discordID = ?`);

      if (notif[3] == false) return;
        alerts.send(`<@${dbUserData.discordID}>, a logout at ${timestampOfLastLogout} was detected at ${timeString}. Playtime was ${lastPlaytime}. You can turn off session alerts with \`${prefix}alert session\``);
          return;
        } catch (err) {
          console.log(`ERROR_3: ${err}`);
          client.channels.cache.get(cnsle).send(`An error occured while writing a new logout. Please report this. ERROR_3: \`${err}\``);
        }
      }
    } 

    if (dbUserData.loginMS !== data[0].player.lastLogin && ceilRoundedLastLogin <= 45) {
      writeLoginMS();
      let loginEmbed = new Discord.MessageEmbed()
            .setColor('#00AA00')
            .setTitle('**Login detected!**')
            .setFooter(`Alert at ${dateString} | ${timeString}`, 'http://www.pngall.com/wp-content/uploads/2017/05/Alert-Download-PNG.png')
            .setDescription(`A login at ${timestampOfLastLogin} was detected .`);
        log.send(loginEmbed);
      async function writeLoginMS() {
        try {
          await databaseImports.changeData(dbUserData.discordID, data[0].player.lastLogin, `UPDATE data SET loginMS = ? WHERE discordID = ?`);

      if (notif[3] == false) return;
        alerts.send(`<@${dbUserData.discordID}>, a new login at ${timestampOfLastLogin} was detected at ${timeString}. You can turn off session alerts with \`${prefix}alert session\``);
          return;
        } catch (err) {
          console.log(`ERROR_3: ${err}`);
          client.channels.cache.get(cnsle).send(`An error occured while writing a new login. Please report this. ERROR_3: \`${err}\``);
        }
      } 
      }
    };

relogEvent();


function useData() { //shhh dont look too close

  if (!data[1].session.online) {
  var embedColor = ('#555555')
  var isAlert = false;
  var languageAlert = false;
  var versionAlert = false;
  var loginTimeAlert = false;
  var gametypeAlert = false;
  
  return {embedColor, isAlert, languageAlert, versionAlert, loginTimeAlert, gametypeAlert};
  }
  
  var embedColor = ('#00AA00')
  var languageAlert = false;
  var versionAlert = false;
  var loginTimeAlert = false;
  var gametypeAlert = false;
  
  if (whitelistCheck == -1 && data[1].session.online && blacklistCheck == -1 && data[1].session.mode !== 'LOBBY') {
    var embedColor = ('#FFAA00')
    var isAlert = true
    var gametypeAlert = true;
  if (notif[1] == true) {
  alerts.send(`<@${dbUserData.discordID}>, Non-Whitelisted Game Alert: ${data[1].session.gameType ? `**${data[1].session.gameType}**` : `**Unknown..?**` }! You can add this game to your whitelist with \`${prefix}whitelist add ${data[1].session.gameType}\`. Otherwise, please ensure your account is secure. Mojang Accounts: <https://bit.ly/3f7gdBf> Microsoft Accounts: <https://bit.ly/3zUdVOo>`);
      }
  }
  if (loginTimeFunc() == true) {
  var embedColor = ('#FFAA00')
  var isAlert = true
  var loginTimeAlert = true;
  
  if (notif[4] == true) {
  alerts.send(`<@${dbUserData.discordID}>, Unusual Login Time Alert: ${data[0].player.lastLogin ? `**${timestampOfLastLogin} | ${timeSinceLastLogin}** ago` : `**Unknown..?**` } You can change your offline time with \`${prefix}offline <0:00> <0:00>\`, or turning the alert off with \`${prefix}alert offline\`. Otherwise, please ensure your account is secure. Mojang Accounts: <https://bit.ly/3f7gdBf> Microsoft Accounts: <https://bit.ly/3zUdVOo>`);
  }
  }
  if (dbUserData.version !== data[0].player.mcVersionRp && data[0].player.mcVersionRp) {
  var embedColor = ('#FFAA00')
  var isAlert = true
  var versionAlert = true;
  
  if (notif[5] == true) {
  alerts.send(`<@${dbUserData.discordID}>, Unusual Version of Minecraft Alert: ${data[0].player.mcVersionRp ? `**${data[0].player.mcVersionRp}**` : `**Unknown..?**`} You can change your whitelisted version with \`${prefix}version ${data[0].player.mcVersionRp}\`, or turning the alert off with \`${prefix}alert version\`. Otherwise, please ensure your account is secure. Mojang Accounts: <https://bit.ly/3f7gdBf> Microsoft Accounts: <https://bit.ly/3zUdVOo>`);
  }
  }
  if (dbUserData.language !== data[0].player.userLanguage && data[0].playeruserLanguage) {
  var embedColor = ('#AA0000')
  var isAlert = true
  var languageAlert = true;
  
  if (notif[2] == true) {
  alerts.send(`<@${dbUserData.discordID}>, Unusual Language Alert: ${data[0].player.userLanguage ? `**${data[0].player.userLanguage}**` : `**Unknown..?**` } Please ensure your account is secure. Mojang Accounts: <https://bit.ly/3f7gdBf> Microsoft Accounts: <https://bit.ly/3zUdVOo>`);
  }
  }
  if (blacklistCheck !== -1 && data[1].session.online) {
  var embedColor = ('#AA0000')
  var isAlert = true
  var gametypeAlert = true;
  if (blacklistCheck !== -1 && data[1].session.online) {
  if (notif[0] == true) {
  alerts.send(`<@${dbUserData.discordID}>, Blacklisted Game Alert: ${data[1].session.gameType ? `**${data[1].session.gameType}**` : `**Unknown..?**` }! Please ensure your account is secure. Mojang Accounts: <https://bit.ly/3f7gdBf> Microsoft Accounts: <https://bit.ly/3zUdVOo>`);
  }
    }
  }
  
  
  return {embedColor, isAlert, languageAlert, versionAlert, loginTimeAlert, gametypeAlert};
  };
    
let embedData = useData();
let embedColor = embedData.embedColor,
isAlert = embedData.isAlert,
languageAlert = embedData.languageAlert,
versionAlert = embedData.versionAlert,
loginTimeAlert = embedData.loginTimeAlert,
gametypeAlert = embedData.gametypeAlert;

let embed = new Discord.MessageEmbed()
.setColor(embedColor)
.setTitle(`${!data[1].session.online ? `**Offline!**` : `${isAlert ? `**Unusual activity detected!**` : `**Nothing abnormal detected!**` }` }`)
.setFooter(`${isAlert == true ? `Alert at ${dateString} | ${timeString}` : `Log at ${dateString} | ${timeString}` }`, 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/e/e9/Book_and_Quill_JE2_BE2.png/revision/latest/scale-to-width-down/160?cb=20190530235621')
if (!data[1].session.online) {
    embed.addFields(
    { name: 'Status', value: `${data[0].player.displayname} is offline` },
    { name: 'Last Session', value: `${data[0].player.lastLogin && data[0].player.lastLogin < data[0].player.lastLogout ? `Last Playtime: ${lastPlaytime} long` : `Playtime: Unknown`}\n${data[0].player.mostRecentGameType ? `Last Gametype: ${data[0].player.mostRecentGameType}` : `Last Gametype: Unknown` }` },
    { name: 'Last Login', value: `${data[0].player.lastLogin ? `${timestampOfLastLogin}\n${timeSinceLastLogin} ago` : `Last Login: Unknown` }` },
    { name: 'Last Logout', value: `${data[0].player.lastLogout ? `${timestampOfLastLogout}\n${timeSincefLastLogout} ago` : `Last Logout: Unknown` }` },
    { name: 'Settings', value: `${data[0].player.userLanguage ? `Language: ${data[0].player.userLanguage}` : `Language: Unknown. Language Alerts won't function while this is unknown.` }\n${data[0].player.mcVersionRp ? `Version: ${data[0].player.mcVersionRp}` : `Version: Unknown. Version Alerts won't function while this is unknown.` }` });
        if (!data[1].session.online && (data[0].player.lastLogout < data[0].player.lastLogin * 1)) embed.addField(`**API Limitation**`, `The Online Status API must be on\nfor Gametype data and alerts to \nfunction. Please turn it on.`);
  } else if (data[1].session.online) {
    embed.addFields(
		  { name: 'Status', value: `${data[0].player.displayname} is online` },
      { name: 'Session', value: `${data[0].player.lastLogin ? `Playtime: ${timeSinceLastLogin}` : `Playtime: Unknown`}\n${data[1].session.gameType ? `Game: ${data[1].session.gameType}\n` : `` }${data[1].session.mode ? `Mode: ${data[1].session.mode}\n` : `` }${data[1].session.map ? `Map: ${data[1].session.map}` : `` }${!data[1].session.gameType && !data[1].session.mode && !data[1].session.map ? `Data not available: Limited API!` : `` }` },
      { name: 'Last Login', value: `${data[0].player.lastLogin ? `${timestampOfLastLogin}\n${timeSinceLastLogin}` : `Last Login: Unknown`}` },
      { name: 'Last Logout', value: `${data[0].player.lastLogout ? `${timestampOfLastLogout}\n${timeSincefLastLogout}` : `Last Logout: Unknown`}` },
      { name: 'Settings', value: `${data[0].player.userLanguage ? `Language: ${data[0].player.userLanguage}` : `Language: Unknown. Langauage Alerts won't function while this is unknown.` }\n${data[0].player.mcVersionRp ? `Version: ${data[0].player.mcVersionRp}` : `Version: Unknown. Version Alerts won't function while this is unknown.` }` });
        if (languageAlert) embed.addField(`**Unusual Language**`, `**${data[0].player.userLanguage ? `${data[0].player.userLanguage}` : `Unknown` }**`, true);
        if (loginTimeAlert) embed.addField(`**Unusual Login Time**`, `**${data[0].player.lastLogin ? `${new Date(data[0].player.lastLogin + tzOffset).toLocaleDateString('en-GB', { hour12: true })}\n${new Date(data[0].player.lastLogin + tzOffset).toLocaleTimeString('en-GB', { hour12: true })}` : `Unknown` }**`, true);
        if (gametypeAlert && data[1].session.online) embed.addField(`**Unusual Game Type**`, `**${data[1].session.gameType ? `${data[1].session.gameType}` : `Unknown` }**`, true);
        if (versionAlert) embed.addField(`**Unusual Version**`, `**${data[0].player.mcVersionRp ? `${data[0].player.mcVersionRp}` : `Unknown` }**`, true);
}
log.send(embed);

} catch (error) {
  if (error instanceof TypeError) {
    return console.log(`TypeError, someone may have left the server while a log while executing. Error 19: ${error}. User ${userNumber}: ${dbUserData.discordID} | ${dbUserData.discordUsername} | UUID: ${dbUserData.minecraftUUID}`)
  }
  try {
    const otherError = new Discord.MessageEmbed()
    .setColor('#AA0000')
    .setTitle('**Error In Using Data**')
    .setFooter(`Error at ${dateString} | ${timeString}`, 'http://www.pngall.com/wp-content/uploads/2017/05/Alert-Download-PNG.png')
    .setDescription(`This error is expected to happen occasionally. Please report this to the bot owner if this continues.`)
  log.send(otherError);
console.log(`Error 18: ${error}`)
  } catch (err) {
    console.log(`Error 20: ${error}. Error 18 is the one that caused this.`)
  }
}
  
}


module.exports = { logStarter };
