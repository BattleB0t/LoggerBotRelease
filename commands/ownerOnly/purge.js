const { prefix } = require('../../userConfig.json');
module.exports = {
	name: 'purge',
	title: 'Mass delete messages',
	description: 'Purges messages!',
  args: true,
  usage: `\`${prefix}purge <amount>\``,
  cooldown: 5,
  database: false,
  guildOnly: true,
  ownerReq: true,
  permissions: 'MANAGE_MESSAGES',
	execute(message, args, client) {
		try {
		const amount = args[0]

		if (isNaN(amount)) return message.channel.send(`${message.author}, that doesn't seem to be a valid number.`).then(async msg => {
			setTimeout(() => {msg.delete();}, 10000);}); 
            
        if (amount < 2 || amount > 100) return message.channel.send(`${message.author}, you need to input a number between 2 and 100.`).then(async msg => {
			setTimeout(() => {msg.delete();}, 5000);});

		message.channel.bulkDelete(amount, true);

		} catch (err) {
			console.log(`Error 11: ${err}`);
			message.channel.send(`An unknown error occured. Please report this. ERROR_11: \`${err}\``);
		}
	},
};