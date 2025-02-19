'use strict';

module.exports = {
    async up(knex) {
        const exists = await knex.schema.hasTable('favorites');
        if (!exists) {
            await knex.schema.createTable('favorites', (table) => {
                table.increments('id').primary();
                table.integer('userId').unsigned().notNullable().references('id').inTable('user').onDelete('CASCADE');
                table.integer('movieId').unsigned().notNullable().references('id').inTable('movies').onDelete('CASCADE');
                table.datetime('createdAt').notNullable();
                table.datetime('updatedAt').notNullable();
                table.unique(['userId', 'movieId']);
            });
        }
    },

    async down(knex) {
        await knex.schema.dropTableIfExists('favorites');
    }
};
