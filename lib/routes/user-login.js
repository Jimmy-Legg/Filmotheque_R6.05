'use strict';

const Joi = require('joi');
const Boom = require('@hapi/boom');

module.exports = {
    method: 'post',
    path: '/user/login',
    options: {
        tags: ['api'],
        validate: {
            payload: Joi.object({
                email: Joi.string().email().required().example('john.doe@example.com').description('Email of the user'),
                password: Joi.string().required().description('Password of the user')
            })
        }
    },
    handler: async (request, h) => {
        const { userService } = request.services();
        
        const user = await userService.findByEmail(request.payload.email);
        
        if (!user) {
            throw Boom.unauthorized('Invalid email or password');
        }
        
        const isValid = await user.validatePassword(request.payload.password);
        
        if (!isValid) {
            throw Boom.unauthorized('Invalid email or password');
        }
        
        return { login: 'successful' };
    }
};
