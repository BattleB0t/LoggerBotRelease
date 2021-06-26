const fs = require('fs');
const funcImports = require('./functions');
const logImports = require('./log');
const sqlite = require('sqlite3').verbose();
const databaseImports = require('./databaseFuncs');
const Discord = require('discord.js');
const client = new Discord.Client
const userConfig = require('./userConfig.json')
const discordAPIkey = userConfig["discordAPIkey"]
const prefix = userConfig["prefix"]
const botOwner = userConfig["BotOwnerID"]
process.env.TZ = userConfig["Timezone"];

client.commands = new Discord.Collection();
client.cooldowns = new Discord.Collection();

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
	let db = new sqlite.Database('./database.db', sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE);
	db.serialize(() => {
		db.run(`CREATE TABLE IF NOT EXISTS data(discordID TEXT NOT NULL UNIQUE, discordUsername TEXT NOT NULL UNIQUE, minecraftUUID TEXT NOT NULL UNIQUE, language TEXT NOT NULL, version TEXT NOT NULL, offline INTEGER NOT NULL, blacklist TEXT, whitelist TEXT, loginMS INTEGER, logoutMS INTEGER, timezone INTEGER NOT NULL, alerts TEXT NOT NULL, guildID TEXT NOT NULL, logID TEXT NOT NULL, alertID TEXT NOT NULL, log INTEGER NOT NULL)`);
		db.close();
	  });
	client.user
		.setPresence({ activity: { name: ',help | ✔', type: 'COMPETING' }, status: 'dnd' })
		.then(console.log)
		.catch(console.error);
	setInterval(logImports.logStarter, 20000, client);
});

const commandFolders = fs.readdirSync('./commands');

for (const folder of commandFolders) {
	const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const command = require(`./commands/${folder}/${file}`);
		client.commands.set(command.name, command);
	}
}

client.on('message', message => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const commandName = args.shift().toLowerCase();

	const command = client.commands.get(commandName)
		|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

	if (!command) return;

checkPermsOfBot();

async function checkPermsOfBot() {
	try {
	let returned = await funcImports.checkPermsOfBot(message.channel, message.guild.me)

	if (returned) {
		console.log(`Permissions: ${message.author.id} | ${message.author.id} is missing ${returned}`)
		return message.channel.send(`This bot is missing the following permissions(s): ${returned}`);
	}
	checkDB();
	} catch (err) {
		console.log(`Someone appears to be attempting to crash the bot. User: ${message.author.tag}: ${message.author.id} GuildID: ${message.guild.id}`)
	}	
}

async function checkDB() {
	var isInDB = await databaseImports.isInDataBase(message.author.id)
	console.log(`DB ${isInDB[0]}. ${message.author.tag} GuildID: ${message.guild.id} made a request: ${message.content}`)
	if (isInDB[0] == false && command.database == true) return message.channel.send(`${message.author}, you must use \`${prefix}setup\` first before using this command!`).then(async msg => {
		setTimeout(() => {msg.delete();}, 10000);});	
	dm(isInDB[1]);
}
	
function dm(rowData) {
	if (command.guildOnly && message.channel.type === 'dm') {
		return message.channel.send(`${message.author}, you can\'t execute that command inside DMs!`).then(async msg => {
		setTimeout(() => {msg.delete();}, 10000);});
	}
	permissions(rowData);
}

function permissions(rowData) {
	if (command.permissions) {
		const authorPerms = message.channel.permissionsFor(message.author);
		if (!authorPerms || !authorPerms.has(command.permissions)) {
			return message.channel.send(`${message.author}, you can not do this!`).then(async msg => {
		setTimeout(() => {msg.delete();}, 10000);});
		}
	}
	owner(rowData);
}

function owner(rowData) {
	if (command.ownerReq) {
		const authorID = message.author.id
		if (!botOwner.includes(authorID)) {
			return message.channel.send(`${message.author}, you must be the owner to do this!`).then(async msg => {
		setTimeout(() => {msg.delete();}, 10000);});
		}
	}
	argument(rowData);
}

function argument(rowData) {
	if (command.args && !args.length) {
		let reply = `You didn't provide any arguments, ${message.author}!`;

		if (command.usage) {
			reply += `\nThe proper usage would be: ${command.usage}`;
		}

		return message.channel.send(reply).then(async msg => {
		setTimeout(() => {msg.delete();}, 20000);});
	}
	cooldown(rowData);
}

function cooldown(rowData) {
	const { cooldowns } = client;

	if (!cooldowns.has(command.name)) {
		cooldowns.set(command.name, new Discord.Collection());
	}

	const now = Date.now();
	const timestamps = cooldowns.get(command.name);
	const cooldownAmount = (command.cooldown || 1) * 1000;

	if (timestamps.has(message.author.id) && !botOwner.includes(message.author.id)) {
		const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

		if (now < expirationTime) {
			const timeLeft = (expirationTime - now) / 1000;
			return message.channel.send(`${message.author}, please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${prefix}${command.name}\` command.`).then(async msg => {
		setTimeout(() => {msg.delete();}, 10000);});
		}
	}

	timestamps.set(message.author.id, now);
	setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
	tryToExecute(rowData);
}

function tryToExecute(rowData) {
	try {
		command.execute(message, args, client, rowData);
	} catch (error) {
		console.error(error);
		return message.channel.send(`${message.author}, there was an error trying to execute that command!`).then(async msg => {
		setTimeout(() => {msg.delete();}, 10000);});
	}
}

});

client.login(discordAPIkey);
