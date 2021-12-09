// Connect to the Database file
const db = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: './data.sqlite',
    },
    useNullAsDefault: true
})

;(async() => {
    if (!await db.schema.hasTable('wallpaper')) {
        await db.schema.createTable('wallpaper', (table) => {
            table.increments('id').primary()
            table.string('messageID')
            table.string('url')
            table.string('author')
            table.integer('color')
            table.bool('dark')
            table.integer('width')
            table.integer('height')
            table.double('size')
            table.double('aspect')
            table.timestamp('createdAt')
        })
    }
})();