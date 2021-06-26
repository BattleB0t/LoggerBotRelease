const funcImports = require( __dirname + '../../../functions');
const { prefix } = require('../../userConfig.json');
const sqlite = require('sqlite3').verbose();
const fetch = require('node-fetch');
const Discord = require('discord.js');
module.exports = {
	name: 'block',
  title: 'Add or remove blocked users',
	description: 'Blocks users',
    usage: `\`${prefix}block <user>\``,
  cooldown: 5,
  ownerReq: true,
  database: false,
	execute(message, args, client) {
        try {
    let readData = funcImports.readOwnerSettings();
    let api = readData.api,
    userLimit = readData.userLimit,
    blockedUsers = readData.blockedUsers;

    if (!blockedUsers.includes(args[0])) {
        blockedUsers.push(args[0]);
        funcImports.saveOwnerSettings(api, userLimit, blockedUsers);
        return message.channel.send(`${args[0]} added.`);
    } else {
        let blockedUserIndex = blockedUsers.indexOf(args[0]);
        blockedUsers.splice(blockedUserIndex, 1);
        funcImports.saveOwnerSettings(api, userLimit, blockedUsers);
        return message.channel.send(`${args[0]} removed.`)
    }
    
        } catch (err) {
            console.log(`ERROR_14: ${err}`);
			message.channel.send(`An error occured while writing data. Please report this. ERROR_4: \`${err}\``);
        }
    },
};
