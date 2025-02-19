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

    static get relationMappings() {
        return {};
    }

    $beforeInsert(queryContext) {
        const now = new Date();
        this.createdAt = now;
        this.updatedAt = now;
    }

    $beforeUpdate(opt, queryContext) {
        this.updatedAt = new Date();
    }

    $formatDatabaseJson(json) {
        json = super.$formatDatabaseJson(json);

        // Convert Date objects to MySQL format
        if (json.releaseDate instanceof Date) {
            json.releaseDate = json.releaseDate.toISOString().split('T')[0];
        }
        if (json.createdAt instanceof Date) {
            json.createdAt = json.createdAt.toISOString().slice(0, 19).replace('T', ' ');
        }
        if (json.updatedAt instanceof Date) {
            json.updatedAt = json.updatedAt.toISOString().slice(0, 19).replace('T', ' ');
        }

        return json;
    }

    $parseDatabaseJson(json) {
        json = super.$parseDatabaseJson(json);

        // Convert MySQL format back to Date objects
        if (json.releaseDate) {
            json.releaseDate = new Date(json.releaseDate);
        }
        if (json.createdAt) {
            json.createdAt = new Date(json.createdAt);
        }
        if (json.updatedAt) {
            json.updatedAt = new Date(json.updatedAt);
        }

        return json;
    }
};
