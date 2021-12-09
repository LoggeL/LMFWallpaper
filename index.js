const express = require('express');
const cors = require('cors');
const Discord = require('discord.js');

const fetch = require('node-fetch');
const {getAverageColor} = require('fast-average-color-node');

const db = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: './data.sqlite',
    },
    useNullAsDefault: true
})

const config = require('./config.json');

const client = new Discord.Client({intents: [
    Discord.Intents.FLAGS.GUILD_MESSAGES, 
    Discord.Intents.FLAGS.GUILDS
]});

async function handleImage(message) {

    return new Promise(async (resolve, reject) => {

        console.log(message.id)

        if (!message.attachments.size) return reject('no attachments');

        const exists = await db('wallpaper').where({messageID: message.id}).select('id').first()
        if (exists) return reject("Dupe")

        // Scan attachments for images
        for (const attachment of message.attachments.values()) {

            const url = attachment.url;

            if (!url) return reject('no url')

            const res = await fetch(url);
            const buffer = await res.buffer();

            let color;
            try {
                color = await getAverageColor(buffer)
            } catch (e) {
                reject(e)
            }

            if (!color) return reject('no color')

            const imageObj = {
                messageID: message.id,
                url: url,
                author: message.author.id,
                color: parseInt(color.hex.replace('#', ''), 16),
                dark: color.isDark,
                width: attachment.width,
                height: attachment.height,
                size: attachment.size, // bytes
                aspect: attachment.width / attachment.height,
                createdAt: message.createdAt
            }

            const sucess = await db('wallpaper').insert(imageObj)

            console.log('added to db', sucess, imageObj);

            resolve(imageObj);
        }
    })
}


client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // return // Comment this to load historical messages 
    const channel = await client.channels.fetch(config.channel)
    let messages = await channel.messages.fetch({limit: 100, before: channel.lastMessageID})
    do {
        for (const message of messages.values()) {
            try {
                await handleImage(message)
            }
            catch (e) {
                console.log(e)
            }
        }
        messages = await channel.messages.fetch({limit: 100, before: messages.last().id})
    } while (messages.size > 0)
});

client.on('messageCreate', async message => {

    if (message.author.bot) return console.log('bot message');
    if (msg.channel.id != config.channel) return;

    handleImage(message)
})

client.login(config.token);

// Express
const app = express();
app.use(express.json());
app.use(cors())

app.get('/', (req, res) => {
    res.send('API operational!');
});

app.post('/wallpaper', async (req, res) => {
    // ToDo Some Pagination / Parameters
    const data = await db('wallpaper').select('*').orderBy('createdAt', 'desc')
    res.status(200).send(data);
});

app.listen(3005, () => {
    console.log('Server listening');
});