'use strict';

const Joi = require('joi');
const { Model } = require('@hapipal/schwifty');
const Bcrypt = require('bcrypt');

module.exports = class User extends Model {

    static get tableName() {
        return 'user';
    }

    static get joiSchema() {
        return Joi.object({
            id: Joi.number().integer().greater(0),
            firstName: Joi.string().min(3).example('John').description('Firstname of the user'),
            lastName: Joi.string().min(3).example('Doe').description('Lastname of the user'),
            username: Joi.string().min(3).required().example('johndoe').description('Username of the user'),
            email: Joi.string().email().required().example('john.doe@example.com').description('Email of the user'),
            password: Joi.string().min(8).required().description('Password of the user'),
            createdAt: Joi.date(),
            updatedAt: Joi.date()
        });
    }

    async $beforeInsert(queryContext) {
        this.updatedAt = new Date();
        this.createdAt = this.updatedAt;

        // Hash password before inserting
        if (this.password) {
            this.password = await Bcrypt.hash(this.password, 10);
        }
    }

    async $beforeUpdate(opt, queryContext) {
        this.updatedAt = new Date();

        // Hash password if it's being updated
        if (this.password) {
            this.password = await Bcrypt.hash(this.password, 10);
        }
    }

    async validatePassword(password) {
        return Bcrypt.compare(password, this.password);
    }
};
