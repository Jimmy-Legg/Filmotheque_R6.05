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
            title: Joi.string().required().min(1).max(255),
            description: Joi.string().required(),
            releaseDate: Joi.date().required(),
            director: Joi.string().required().min(1).max(255),
            createdAt: Joi.date(),
            updatedAt: Joi.date()
        });
    }

    static get jsonAttributes() {
        return ['createdAt', 'updatedAt'];
    }

    $beforeInsert(queryContext) {
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    $beforeUpdate(opt, queryContext) {
        this.updatedAt = new Date();
    }
};
