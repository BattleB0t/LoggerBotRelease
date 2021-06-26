const Discord = require('discord.js');
const fs = require('fs');
const userConfig = require('../../userConfig.json');
const uuid = userConfig["MinecraftUUID"];
const prefix = userConfig["prefix"]
const fetch = require('node-fetch');
const funcImports = require( __dirname + '../../../functions');
const fetchTimeout = (url, ms, { signal, ...options } = {}) => {
const controller = new AbortController();
const promise = fetch(url, { signal: controller.signal, ...options });
if (signal) signal.addEventListener("abort", () => controller.abort());
const timeout = setTimeout(() => controller.abort(), ms);
return promise.finally(() => clearTimeout(timeout));
  };
module.exports = {
	name: 'recentgames',
  aliases: ['recent'],
  title: 'Shows the recent games of any player',
	description: `Shows the 10 most recent games of any player. Games beyond 3 days ago cannot be shown. Doing \`${prefix}recentgames\` without arguments will show your own data. As this command uses the Slothpixel API over the Hypixel API, the data is slightly delayed and may not be accurate.`,
  usage: `\`${prefix}recentgames\`,\`${prefix}recentgames <player>\``,
  args: false,
  database: false,
  cooldown: 7.5,
	execute(message, args, client, row) {
    if (row !== undefined) {
      let tzOffset = (row.timezone * 3600000);
      var timeString = new Date(Date.now() + tzOffset).toLocaleTimeString('en'); 
      var dateString = new Date(Date.now() + tzOffset).toLocaleDateString('en-GB');  
    } else {
      var timeString = `${new Date().toLocaleTimeString()} UTC`
      var dateString = new Date().toLocaleDateString()
    }

    try {
      message.channel.send('Loading..').then(async msg => {
        const controller = new AbortController();
        
        const readData = funcImports.readOwnerSettings();
        const api = readData.api;

        if (api == false) {
          msg.delete();
          return message.channel.send(`${message.author}, this command is temporarily disabled as the API is down!`).then(async msg => {
          setTimeout(() => {
            msg.delete();
          }, 10000);
        });
      }
    
        function recentGameAPI(playerUUID, playerUsername) {
          fetchTimeout(`https://api.slothpixel.me/api/players/${playerUUID}/recentGames`, 2000, {
            signal: controller.signal
          })
            .then(recentData => recentData.json())
            .then((recentData) => {
              if (recentData.hasOwnProperty('error')) {
                msg.delete();
                return message.channel.send(`${message.author}, there was an error while trying to retrieve your requested information. Error: ${json.cause.toUpperCase()}`).then(async msg => {
                  setTimeout(() => {
                    msg.delete();
                  }, 10000);
                });
              }
    
              let recentGamesEmbed = new Discord.MessageEmbed()
                .setColor('#7289DA')
                .setTitle(`**Most Recent Games - ${playerUsername}**`)
                .setDescription(`Some gametypes like Skyblock will not show up due to limitations with Hypixel's API. Games may take a while to appear here due to use of the Slothpixel API.`)
                .setFooter(`Executed at ${dateString} | ${timeString}`, 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/e/e9/Book_and_Quill_JE2_BE2.png/revision/latest/scale-to-width-down/160?cb=20190530235621');
    
              for (let i = 0; i < 10; i++) {
                if (recentData[i]) {
                  recentGamesEmbed.addField(`${recentData[i].gameType} at ${new Date(recentData[i].date).toLocaleTimeString()}, ${new Date(recentData[i].date).toLocaleDateString()}`, `${recentData[i].hasOwnProperty('ended') && recentData[i].ended !== null && recentData[i].ended !== "" ? `Game Time End: ${new Date(recentData[i].ended).toLocaleTimeString()}\n` : `Game Time End: In progress\n` }${recentData[i].hasOwnProperty('ended') && recentData[i].ended !== null && recentData[i].ended !== "" ? `Play Time: ${new Date(recentData[i].ended - recentData[i].date).toISOString().substr(11, 8)}\n` : `Play Time Elapsed: ${new Date(new Date() - recentData[i].date).toISOString().substr(11, 8)}\n` }${recentData[i].mode !== null && recentData[i].mode !== "" ? `Mode: ${recentData[i].mode}\n` : `` }${recentData[i].map !== null && recentData[i].map !== "" ? `Map: ${recentData[i].map}` : `` }`)
                }
              }
              if (!recentData[0]) {
                recentGamesEmbed.addField(`No Recent Games Detected!`, `There are no recent games to show. Games played more than 3 days ago cannot be shown. Some players also have the recent games API option disabled.`)
              }
              msg.delete();
              message.reply(recentGamesEmbed);
            })
            .catch((err) => {
              if (err.name === "AbortError") {
                msg.delete();
                message.channel.send(`${message.author}, an error occured while executing this command. The API failed to respond, and may be down. Try again later. https://status.hypixel.net/`);
              } else {
                msg.delete();
                console.log(`API Error 9: ${err}`);
                message.channel.send(`${message.author}, an error occured while executing this command. This error is expected to occur occasionally. Please report this if it continues. ERROR_9: \`${err}\``);
              }
            });
            
        }
    
    
        if (!args[0]) {
          recentGameAPI(uuid)
          return;
        }
    
        if (!/^[\w+]{1,16}$/gm.test(args[0])) {
          msg.delete();
          return message.channel.send(`${message.author}, that doesn't seem to be a valid Minecraft username!`).then(async msg => {
            setTimeout(() => {
              msg.delete();
            }, 10000);
          });
        }
    
        fetchTimeout(`https://api.slothpixel.me/api/players/${args[0]}`, 2000, {
          signal: controller.signal
        })
          .then(res => res.json())
          .then((response) => {
            if (response.hasOwnProperty('error')) {
              msg.delete();
              return message.channel.send(`${message.author}, that username doesn\'t seem to be valid.`).then(async msg => {
                setTimeout(() => {
                  msg.delete();
                }, 10000);
              });
            }
            recentGameAPI(response.uuid, response.username)
          })
          .catch((err) => {
            if (err.name === "AbortError") {
              msg.delete();
              message.channel.send(`${message.author}, an error occured while executing this command. The API failed to respond, and may be down. Try again later. https://status.hypixel.net/`);
            } else {
              msg.delete();
              console.log(`API Error 9: ${err}`);
              message.channel.send(`${message.author}, an error occured while executing this command. This error is expected to occur occasionally. Please report this if it continues. ERROR_9: \`${err}\``);
            }
          });
    
      });
    } catch (err) {
        console.log(`Error 11: ${err}`)
        message.channel.send(`An unknown error occured. Please report this. ERROR_11: \`${err}\``);
    }    
	},
};
