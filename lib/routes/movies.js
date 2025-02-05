'use strict';

const Joi = require('joi');

module.exports = {
    method: 'POST',
    path: '/movies',
    options: {
        auth: {
            scope: ['admin']
        },
        tags: ['api'],
        validate: {
            payload: Joi.object({
                title: Joi.string().required().min(1).max(255),
                description: Joi.string().required(),
                releaseDate: Joi.date().required(),
                director: Joi.string().required().min(1).max(255)
            })
        }
    },
    handler: async (request, h) => {
        const { movieService } = request.services();
        return await movieService.create(request.payload);
    }
};

module.exports = [
    {
        method: 'GET',
        path: '/movies',
        options: {
            auth: {
                scope: ['admin', 'user']
            },
            tags: ['api']
        },
        handler: async (request, h) => {
            const { movieService } = request.services();
            return await movieService.findAll();
        }
    },
    {
        method: 'GET',
        path: '/movies/{id}',
        options: {
            auth: {
                scope: ['admin', 'user']
            },
            tags: ['api'],
            validate: {
                params: Joi.object({
                    id: Joi.number().integer().required()
                })
            }
        },
        handler: async (request, h) => {
            const { movieService } = request.services();
            const movie = await movieService.findById(request.params.id);
            
            if (!movie) {
                return h.response({ message: 'Movie not found' }).code(404);
            }
            
            return movie;
        }
    },
    {
        method: 'PUT',
        path: '/movies/{id}',
        options: {
            auth: {
                scope: ['admin']
            },
            tags: ['api'],
            validate: {
                params: Joi.object({
                    id: Joi.number().integer().required()
                }),
                payload: Joi.object({
                    title: Joi.string().min(1).max(255),
                    description: Joi.string(),
                    releaseDate: Joi.date(),
                    director: Joi.string().min(1).max(255)
                })
            }
        },
        handler: async (request, h) => {
            const { movieService } = request.services();
            const movie = await movieService.update(request.params.id, request.payload);
            
            if (!movie) {
                return h.response({ message: 'Movie not found' }).code(404);
            }
            
            return movie;
        }
    },
    {
        method: 'DELETE',
        path: '/movies/{id}',
        options: {
            auth: {
                scope: ['admin']
            },
            tags: ['api'],
            validate: {
                params: Joi.object({
                    id: Joi.number().integer().required()
                })
            }
        },
        handler: async (request, h) => {
            const { movieService } = request.services();
            await movieService.delete(request.params.id);
            return h.response().code(204);
        }
    },
    {
        method: 'POST',
        path: '/movies/{id}/favorite',
        options: {
            auth: {
                scope: ['user']
            },
            tags: ['api'],
            validate: {
                params: Joi.object({
                    id: Joi.number().integer().required()
                })
            }
        },
        handler: async (request, h) => {
            const { movieService } = request.services();
            try {
                await movieService.addToFavorites(request.auth.credentials.id, request.params.id);
                return h.response({ message: 'Movie added to favorites' }).code(201);
            } catch (error) {
                return h.response({ message: error.message }).code(400);
            }
        }
    },
    {
        method: 'DELETE',
        path: '/movies/{id}/favorite',
        options: {
            auth: {
                scope: ['user']
            },
            tags: ['api'],
            validate: {
                params: Joi.object({
                    id: Joi.number().integer().required()
                })
            }
        },
        handler: async (request, h) => {
            const { movieService } = request.services();
            try {
                await movieService.removeFromFavorites(request.auth.credentials.id, request.params.id);
                return h.response().code(204);
            } catch (error) {
                return h.response({ message: error.message }).code(400);
            }
        }
    },
    {
        method: 'GET',
        path: '/movies/favorites',
        options: {
            auth: {
                scope: ['user']
            },
            tags: ['api']
        },
        handler: async (request, h) => {
            const { movieService } = request.services();
            return await movieService.getFavorites(request.auth.credentials.id);
        }
    },
    {
        method: 'POST',
        path: '/movies/export',
        options: {
            auth: {
                scope: ['admin']
            },
            tags: ['api']
        },
        handler: async (request, h) => {
            const { movieService, emailService } = request.services();
            const csvBuffer = await movieService.generateCsvExport();
            
            // Send CSV file via email
            await emailService.sendMovieExportEmail(request.auth.credentials, csvBuffer);
            
            return { message: 'Export has been sent to your email' };
        }
    }
];
