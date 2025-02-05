'use strict';

const Joi = require('joi');

module.exports = [
    {
        method: 'post',
        path: '/user',
        options: {
            auth: false,
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    firstName: Joi.string().required().min(3).example('John').description('Firstname of the user'),
                    lastName: Joi.string().required().min(3).example('Doe').description('Lastname of the user'),
                    email: Joi.string().required().email().example('john@doe.fr').description('Email of the user'),
                    password: Joi.string().required().example('password').description('Password of the user'),
                    username: Joi.string().required().example('johndoe').description('Username of the user'),
                    roles: Joi.array().items(Joi.string().valid('user', 'admin')).default(['user']).description('User roles')
                })
            }
        },
        handler: async (request, h) => {
            const { userService } = request.services();
            return await userService.create(request.payload);
        }
    },
    {
        method: 'get',
        path: '/users',
        options: {
            tags: ['api'],
            auth: {
                scope: ['admin', 'user']
            },
            description: 'Get all users',
            notes: 'Returns a list of all users. Requires authentication.'
        },
        handler: async (request, h) => {
            const { userService } = request.services();
            return await userService.findAll();
        }
    },
    {
        method: 'delete',
        path: '/user/{id}',
        options: {
            tags: ['api'],
            auth: {
                scope: ['admin']
            },
            validate: {
                params: Joi.object({
                    id: Joi.number().integer().required().min(1)
                })
            },
            description: 'Delete a user',
            notes: 'Deletes a user by ID. Requires admin privileges.'
        },
        handler: async (request, h) => {
            const { userService } = request.services();
            return await userService.delete(request.params.id);
        }
    },
    {
        method: 'patch',
        path: '/user/{id}',
        options: {
            tags: ['api'],
            auth: {
                scope: ['admin']
            },
            validate: {
                params: Joi.object({
                    id: Joi.number().integer().required().min(1)
                }),
                payload: Joi.object({
                    firstName: Joi.string().min(3).example('John').description('Firstname of the user'),
                    lastName: Joi.string().min(3).example('Doe').description('Lastname of the user'),
                    email: Joi.string().email().example('john@doe.fr').description('Email of the user'),
                    password: Joi.string().example('password').description('Password of the user'),
                    username: Joi.string().example('johndoe').description('Username of the user'),
                    roles: Joi.array().items(Joi.string().valid('user', 'admin')).description('User roles')
                })
            },
            description: 'Update a user',
            notes: 'Updates a user by ID. Requires admin privileges.'
        },
        handler: async (request, h) => {
            const { userService } = request.services();
            return await userService.update(request.params.id, request.payload);
        }
    },
    {
        method: 'post',
        path: '/user/login',
        options: {
            tags: ['api'],
            auth: false,
            validate: {
                payload: Joi.object({
                    email: Joi.string().email().required().example('john@doe.fr').description('Email of the user'),
                    password: Joi.string().required().example('password').description('Password of the user')
                })
            },
            description: 'User login',
            notes: 'Login with email and password to receive a JWT token'
        },
        handler: async (request, h) => {
            const { userService } = request.services();
            const { email, password } = request.payload;
            return await userService.login(email, password);
        }
    }
];
