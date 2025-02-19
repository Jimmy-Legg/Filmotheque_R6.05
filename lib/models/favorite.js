'use strict';

const { Model } = require('@hapipal/schwifty');
const Joi = require('joi');

module.exports = class Favorite extends Model {

    static get tableName() {
        return 'favorites';
    }

    static get joiSchema() {
        return Joi.object({
            id: Joi.number().integer().greater(0),
            userId: Joi.number().integer().greater(0).required(),
            movieId: Joi.number().integer().greater(0).required(),
            createdAt: Joi.date(),
            updatedAt: Joi.date()
        });
    }

    $beforeInsert(queryContext) {
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    $beforeUpdate(opt, queryContext) {
        this.updatedAt = new Date();
    }
};
