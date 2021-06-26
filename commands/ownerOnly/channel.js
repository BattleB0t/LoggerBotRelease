const funcImports = require( __dirname + '../../../functions'); //reference code, this was added to setup, but was not tested.
const { prefix } = require('../../userConfig.json');
const sqlite = require('sqlite3').verbose();
const fetch = require('node-fetch');
const Discord = require('discord.js');
module.exports = {
	name: 'channel',
  title: 'nothing to see here',
	description: 'ignore this',
    usage: `\`${prefix}\``,
  cooldown: 0,
  ownerReq: true,
  database: false,
	execute(message, args, client) {
        try {
            console.log(message.client.user.id)

        } catch (err) {
            console.log(`ERROR_1414414114214: ${err}`);
		
        }
    },
};

