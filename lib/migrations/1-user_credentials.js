'use strict';

module.exports = {

    async up(knex) {

        await knex.schema.alterTable('user', (table) => {

            table.string('email').notNull();
            table.string('username').notNull();
            table.string('password').notNull();
        })
    },

    async down(knex) {

        await knex.schema.alterTable('user', (table) => {

                table.dropColumn('email');
                table.dropColumn('username');
                table.dropColumn('password');
        });
    }
};
