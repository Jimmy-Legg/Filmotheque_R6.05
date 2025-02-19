'use strict';

const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const HapiSwagger = require('hapi-swagger');
const Package = require('../../package.json');

module.exports = {
    name: 'app-swagger',
    async register(server) {
        await server.register([
            Inert,
            Vision,
            {
                plugin: HapiSwagger,
                options: {
                    info: {
                        title: 'Movies API Documentation',
                        version: Package.version,
                        description: 'API documentation for the Movies application'
                    },
                    securityDefinitions: {
                        'jwt': {
                            'type': 'apiKey',
                            'name': 'Authorization',
                            'in': 'header',
                            'description': 'JWT Bearer token'
                        }
                    },
                    security: [{ 'jwt': [] }],
                    grouping: 'tags',
                    tags: [
                        {
                            name: 'movies',
                            description: 'Movie management endpoints for CRUD operations'
                        },
                        {
                            name: 'users',
                            description: 'User management including authentication and profile operations'
                        },
                        {
                            name: 'favorites',
                            description: 'User favorites management endpoints'
                        },
                        {
                            name: 'exports',
                            description: 'Data export operations'
                        }
                    ],
                    documentationPath: '/documentation',
                    swaggerUI: true,
                    jsonPath: '/swagger.json',
                    sortEndpoints: 'ordered',
                    expanded: 'none',
                    auth: false
                }
            }
        ]);
    }
};
