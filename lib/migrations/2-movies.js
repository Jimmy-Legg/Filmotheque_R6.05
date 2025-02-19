'use strict';

module.exports = {

    async up(knex) {
        // First create the movies table
        await knex.schema.createTable('movies', (table) => {
            table.increments('id').primary();
            table.string('title').notNull().unique();
            table.text('description').notNull();
            table.date('releaseDate').notNull();
            table.string('director').notNull();
            table.datetime('createdAt').notNull().defaultTo(knex.fn.now());
            table.datetime('updatedAt').notNull().defaultTo(knex.fn.now());
        });

        // Then create the user_movies table
        await knex.schema.createTable('user_movies', (table) => {
            table.increments('id').primary();
            table.integer('userId').unsigned().notNullable();
            table.integer('movieId').unsigned().notNullable();
            table.datetime('createdAt').notNullable().defaultTo(knex.fn.now());
            
            // Add foreign key after table creation
            table.foreign('userId').references('id').inTable('user').onDelete('CASCADE');
            table.foreign('movieId').references('id').inTable('movies').onDelete('CASCADE');
            
            // Add unique constraint
            table.unique(['userId', 'movieId']);
        });
    },

    async down(knex) {
        // Drop tables in reverse order
        await knex.schema.dropTableIfExists('user_movies');
        await knex.schema.dropTableIfExists('movies');
    }
};
