'use strict';

const Joi = require('joi');
const Boom = require('@hapi/boom');

module.exports = [
    {
        method: 'post',
        path: '/favorites/{movieId}',
        options: {
            auth: {
                scope: ['user', 'admin']
            },
            tags: ['api', 'favorites'],
            validate: {
                params: Joi.object({
                    movieId: Joi.number().integer().required()
                })
            },
            handler: async (request, h) => {
                const { favoriteService } = request.services();
                const userId = request.auth.credentials.id;
                
                if (!userId) {
                    throw Boom.badImplementation('User ID not found in token');
                }

                const { movieId } = request.params;
                return await favoriteService.create(userId, movieId);
            }
        }
    },
    {
        method: 'delete',
        path: '/favorites/{movieId}',
        options: {
            auth: {
                scope: ['user', 'admin']
            },
            tags: ['api', 'favorites'],
            validate: {
                params: Joi.object({
                    movieId: Joi.number().integer().required()
                })
            },
            handler: async (request, h) => {
                const { favoriteService } = request.services();
                const userId = request.auth.credentials.id;
                
                if (!userId) {
                    throw Boom.badImplementation('User ID not found in token');
                }

                const { movieId } = request.params;
                return await favoriteService.remove(userId, movieId);
            }
        }
    },
    {
        method: 'get',
        path: '/favorites',
        options: {
            auth: {
                scope: ['user', 'admin']
            },
            tags: ['api', 'favorites'],
            handler: async (request, h) => {
                const { favoriteService } = request.services();
                const userId = request.auth.credentials.id;
                
                if (!userId) {
                    throw Boom.badImplementation('User ID not found in token');
                }

                return await favoriteService.list(userId);
            }
        }
    }
];
