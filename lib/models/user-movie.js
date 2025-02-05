'use strict';

const Joi = require('joi');
const { Model } = require('@hapipal/schwifty');

module.exports = class UserMovie extends Model {

    static get tableName() {
        return 'user_movies';
    }

    static get joiSchema() {
        return Joi.object({
            id: Joi.number().integer().greater(0),
            userId: Joi.number().integer().greater(0).required(),
            movieId: Joi.number().integer().greater(0).required(),
            createdAt: Joi.date()
        });
    }

    static get jsonAttributes() {
        return ['createdAt'];
    }

    $beforeInsert(queryContext) {
        this.createdAt = new Date();
    }
};
