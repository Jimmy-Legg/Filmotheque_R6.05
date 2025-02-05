'use strict';

module.exports = {

    async up(knex) {
        await knex.schema.alterTable('user', (table) => {
            table.json('roles');
        });
    },

    async down(knex) {
        await knex.schema.alterTable('user', (table) => {
            table.dropColumn('roles');
        });
    }
};
