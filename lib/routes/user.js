'use strict';

const Joi = require('joi');

module.exports = {
    method: 'post',
    path: '/user',
    options: {
        tags: ['api'],
        validate: {
            payload: Joi.object({
                firstName: Joi.string().required().min(3).example('John').description('Firstname of the user'),
                lastName: Joi.string().required().min(3).example('Doe').description('Lastname of the user'),
                username: Joi.string().required().min(3).example('johndoe').description('Username of the user'),
                email: Joi.string().email().required().example('john.doe@example.com').description('Email of the user'),
                password: Joi.string().required().min(8).description('Password of the user')
            })
        }
    },
    handler: async (request, h) => {
        const { userService } = request.services();
        return await userService.create(request.payload);
    }
};
