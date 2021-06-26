const funcImports = require( __dirname + '../../../functions'); //reference code, this was added to setup, but was not tested.
const { prefix } = require('../../userConfig.json');
const databaseImports = require('../../databaseFuncs');
const sqlite = require('sqlite3').verbose();
const fetch = require('node-fetch');
const Discord = require('discord.js');
module.exports = {
	name: 'test',
  title: 'nothing to see here',
	description: 'ignore this',
    usage: `\`${prefix}\``,
  cooldown: 0,
  ownerReq: true,
  database: false,
	execute(message, args, client) {
    getTableData();
    async function getTableData() {
      try {
      let user = await databaseImports.getTable()

      let x = 856639909544591416

      console.log(x)

      const alert = client.channels.cache.get(`${x}`);

      alert.send(`test`)


      } catch (err) {
          console.log(`Table get in Log failed. ${err}`)
      }
  }
    },
};

