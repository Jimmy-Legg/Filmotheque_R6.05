'use strict';

const Joi = require('joi');

module.exports = {
    method: 'patch',
    path: '/user/{id}',
    options: {
        tags: ['api'],
        validate: {
            params: Joi.object({
                id: Joi.number().integer().required().description('User ID to update')
            }),
            payload: Joi.object({
                firstName: Joi.string().min(3).example('Fred').description('Firstname of the user'),
                lastName: Joi.string().min(3).example('Doe').description('Lastname of the user'),
                username: Joi.string().min(3).example('freddoe').description('Username of the user'),
                email: Joi.string().email().example('freddoe@example.com').description('Email of the user'),
                password: Joi.string().min(8).description('Password of the user')
            }).min(1)
        }
    },
    handler: async (request, h) => {
        const { userService } = request.services();
        
        return await userService.update(request.params.id, request.payload);
    }
};
