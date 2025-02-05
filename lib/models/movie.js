'use strict';

const Joi = require('joi');
const { Model } = require('@hapipal/schwifty');

module.exports = class Movie extends Model {

    static get tableName() {
        return 'movies';
    }

    static get joiSchema() {
        return Joi.object({
            id: Joi.number().integer().greater(0),
            title: Joi.string().min(1).max(255).required().description('Titre du film'),
            description: Joi.string().required().description('Description du film'),
            releaseDate: Joi.date().iso().required().description('Date de sortie'),
            director: Joi.string().required().description('Réalisateur'),
            createdAt: Joi.date().iso(),
            updatedAt: Joi.date().iso()
        });
    }

    $beforeInsert(queryContext) {
        const now = new Date();
        this.createdAt = now.toISOString().slice(0, 19).replace('T', ' ');
        this.updatedAt = now.toISOString().slice(0, 19).replace('T', ' ');
    }

    $beforeUpdate(opt, queryContext) {
        const now = new Date();
        this.updatedAt = now.toISOString().slice(0, 19).replace('T', ' ');
    }

    $formatDatabaseJson(json) {
        json = super.$formatDatabaseJson(json);

        if (json.releaseDate) {
            if (json.releaseDate instanceof Date) {
                json.releaseDate = json.releaseDate.toISOString().slice(0, 19).replace('T', ' ');
            } else if (typeof json.releaseDate === 'string' && json.releaseDate.includes('T')) {
                json.releaseDate = json.releaseDate.slice(0, 19).replace('T', ' ');
            }
        }

        return json;
    }

    $parseDatabaseJson(json) {
        json = super.$parseDatabaseJson(json);

        // Convert MySQL datetime strings back to ISO format
        ['releaseDate', 'createdAt', 'updatedAt'].forEach(field => {
            if (json[field] && typeof json[field] === 'string') {
                json[field] = json[field].replace(' ', 'T') + 'Z';
            }
        });

        return json;
    }
};
