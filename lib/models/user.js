'use strict';

const Joi = require('joi');
const { Model } = require('@hapipal/schwifty');

module.exports = class User extends Model {

    static get tableName() {
        return 'user';
    }

    static get joiSchema() {
        return Joi.object({
            id: Joi.number().integer().greater(0),
            firstName: Joi.string().min(3).required().example('John').description('Firstname of the user'),
            lastName: Joi.string().min(3).required().example('Doe').description('Lastname of the user'),
            email: Joi.string().email().required(),
            password: Joi.string().required(),
            username: Joi.string().required(),
            roles: Joi.array().items(Joi.string()).default(['user']),
            createdAt: Joi.date(),
            updatedAt: Joi.date()
        });
    }

    $beforeInsert(queryContext) {
        this.createdAt = new Date();
        this.updatedAt = this.createdAt;
        if (!this.roles) {
            this.roles = ['user'];
        }
        // Convert roles array to JSON string
        if (Array.isArray(this.roles)) {
            this.roles = JSON.stringify(this.roles);
        }
    }

    $beforeUpdate(opt, queryContext) {
        this.updatedAt = new Date();
        // Convert roles array to JSON string if it exists
        if (this.roles && Array.isArray(this.roles)) {
            this.roles = JSON.stringify(this.roles);
        }
    }

    $afterFind() {
        // Parse JSON string back to array
        if (this.roles && typeof this.roles === 'string') {
            try {
                this.roles = JSON.parse(this.roles);
            } catch (err) {
                this.roles = ['user'];
            }
        }
    }

    static get jsonAttributes(){
        return ['roles']
    }

};
