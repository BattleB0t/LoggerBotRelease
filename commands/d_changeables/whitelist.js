const fs = require('fs');
const { prefix } = require('../../userConfig.json');
const Discord = require('discord.js');
const funcImports = require( __dirname + '../../../functions');
const databaseImports = require('../../databaseFuncs');
module.exports = {
	name: 'whitelist',
  title: 'Set whitelisted game types for Hypixel',
	description: 'Allows you to set whitelisted game to play on Hypixel. Games detected that are not whitelisted will set off an orange alert. Use <https://api.hypixel.net/#section/Introduction/GameTypes> to find the database name of the game.',
  usage: `\`${prefix}whitelist add/remove <game>\`, \`${prefix}whitelist current\``,
  args: true,
  database: true,
  cooldown: 2.5,
	execute(message, args, client, row) {
    if (row !== undefined) {
      let tzOffset = (row.timezone * 3600000);
      var timeString = new Date(Date.now() + tzOffset).toLocaleTimeString('en'); 
      var dateString = new Date(Date.now() + tzOffset).toLocaleDateString('en-GB');  
    } else {
      var timeString = `${new Date().toLocaleTimeString()} UTC`
      var dateString = new Date().toLocaleDateString()
    }

    let readData = funcImports.readConstants();
    let gametypes = readData.gametypes;

    let games = gametypes

    if (args[0].toLowerCase() == 'current') {

      return currentWhitelist();
    } else if (!/^[a-zA-Z_]+$/.test(args[0])) {

      return message.channel.send(`${message.author}, you cannot use any characters that are not letters or underscores! `).then(async msg => {
      setTimeout(() => {msg.delete();}, 10000);});
    } else if (args[0].toLowerCase() !== "add" && args[0].toLowerCase() !== "remove") {

      return message.channel.send(`${message.author}, that isn't a valid instruction! Use \`${prefix}help whitelist\` to find valid arguments!`).then(async msg => {
        setTimeout(() => {
          msg.delete();
        }, 10000);
      });
    } else if (!args[1]) {

      return message.channel.send(`${message.author}, you didn't specify any game type! Use this link <https://api.hypixel.net/#section/Introduction/GameTypes> to find the clean name of your game: ${games.join(`, `)}`).then(async msg => {
      setTimeout(() => {msg.delete();}, 30000);});
    } else if (!games.includes(args[1].toUpperCase())) {

      return message.channel.send(`${message.author}, that doesn't seem to be a valid game type! Use this link <https://api.hypixel.net/#section/Introduction/GameTypes> to find the clean name of your game. Valid gametypes: ${games.join(`, `)}`).then(async msg => {
        setTimeout(() => {
          msg.delete();
        }, 30000);
      });
    } else {
      checkWhitelist();
    }

    async function checkWhitelist() {
      try {
        let response = await databaseImports.getData(message.author.id)   

        if (response.whitelist) {
          var whitelistResponse = response.whitelist.split(" ");
        } else {
          var whitelistResponse = [];
        }

        if (response.blacklist) {
          var blacklist = response.blacklist.split(" ");
        } else {
          var blacklist = [];
        }

        if (args[0] == 'add') {
          if (whitelistResponse.includes(args[1].toUpperCase())) return message.channel.send(`${message.author}, that game type was already added!`).then(async msg => {
            setTimeout(() => {
              msg.delete();
            }, 10000);
          });
          whitelistResponse.push(`${args[1].toUpperCase()}`)
          try {
            
            let combinedArrays = blacklist.concat(whitelistResponse);

            let hasDuplicates = new Set(combinedArrays).size < combinedArrays.length;
            if (hasDuplicates) return message.channel.send(`${message.author}, that game was added to your blacklist. You cannot add a game to both.`).then(async msg => {
              setTimeout(() => {
                msg.delete();
              }, 10000);
            });
            
            writeNewWhitelist(whitelistResponse);
          } catch {
            console.log(`ERROR_13: ${err}`);
            message.channel.send(`An error occured while comparing whitelist and blacklist data. Please report this. ERROR_13: \`${err}\``);
          }

        } else if (args[0] == 'remove') {
          let findAndRemove = whitelistResponse.indexOf(args[1].toUpperCase());
          if (findAndRemove == -1) return message.channel.send(`${message.author}, you cannot unwhitelist a game that wasn\'t already added!`).then(async msg => {
            setTimeout(() => {
              msg.delete();
            }, 10000);
          });
          whitelistResponse.splice(findAndRemove, 1);
          writeNewWhitelist(whitelistResponse);
        } else {
          let error12 = new Error('The instuction was neither add or delete somehow')
          error12.name = `InstructionError`
          throw error12
        }
      } catch (err) {
        if (err.name == `InstructionError`) {
          message.channel.send(`ERROR_12: \`${err}\``);
        }
        console.log(`ERROR_3: ${err}`);
        message.channel.send(`An error occured while fetching data. Please report this. ERROR_3: \`${err}\``);
      }
    }

    async function writeNewWhitelist(whitelist) {
      try {
        let response = await databaseImports.changeData(message.author.id, whitelist.join(" ").toUpperCase(), `UPDATE data SET whitelist = ? WHERE discordID = ?`);
        if (args[0] == 'add') {
          let whitelistedData = new Discord.MessageEmbed()
            .setColor('#7289DA')
            .setTitle(`${args[1].toUpperCase()} has been added!`)
            .setFooter(`Executed at ${dateString} | ${timeString}`, 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/e/e9/Book_and_Quill_JE2_BE2.png/revision/latest/scale-to-width-down/160?cb=20190530235621');
          whitelistedData.addField(`${message.author.tag}'s whitelisted game(s)`, `${whitelist === undefined || whitelist == 0 ? `No whitelisted games found!` : `${whitelist.join(`, `).toUpperCase()}`}`);
          return message.reply(whitelistedData)
        } else if (args[0] == 'remove') {
          let whitelistedData = new Discord.MessageEmbed()
            .setColor('#7289DA')
            .setTitle(`${args[1].toUpperCase()} has been removed!`)
            .setFooter(`Executed at ${dateString} | ${timeString}`, 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/e/e9/Book_and_Quill_JE2_BE2.png/revision/latest/scale-to-width-down/160?cb=20190530235621');
          whitelistedData.addField(`${message.author.tag}'s whitelisted game(s)`, `${whitelist === undefined || whitelist == 0 ? `No whitelisted games found!` : `${whitelist.join(`, `).toUpperCase()}`}`);
          return message.reply(whitelistedData)
        } else {
          let error12 = new Error('The instuction was neither add or delete somehow')
          error12.name = `InstructionError`
          throw error12
        }
      } catch (err) {
        if (err.name == `InstructionError`) {
          message.channel.send(`ERROR_12: \`${err}\``);
        }
        console.log(`ERROR_3: ${err}`);
        message.channel.send(`An error occured while writing data. Please report this. ERROR_3: \`${err}\``);
      }

    }

    async function currentWhitelist() {
      try {
        let response = await databaseImports.getData(message.author.id)   

        if (response.whitelist) {
          var whitelistResponse = response.whitelist.split(" ");
        } else {
          var whitelistResponse = [];
        }

        let whitelistedData = new Discord.MessageEmbed()
          .setColor('#7289DA')
          .setTitle(`${message.author.tag}'s wWhitelisted Games`)
          .setFooter(`Executed at ${dateString} | ${timeString}`, 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/e/e9/Book_and_Quill_JE2_BE2.png/revision/latest/scale-to-width-down/160?cb=20190530235621');
        whitelistedData.addField(`Your whitelisted game(s)`, `${!whitelistResponse || whitelistResponse == 0 ? `No whitelisted games found!` : `${whitelistResponse.join(`, `).toUpperCase()}`}`);
        return message.reply(whitelistedData)
      } catch (err) {
        console.log(`ERROR_3: ${err}`);
        message.channel.send(`An error occured while fetching data. Please report this. ERROR_3: \`${err}\``);
      }
    }
	},
};