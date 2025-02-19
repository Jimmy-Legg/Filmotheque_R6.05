'use strict';

const Joi = require('joi');
const Boom = require('@hapi/boom');

module.exports = {
    method: 'POST',
    path: '/movies/export',
    options: {
        auth: {
            scope: ['admin']
        },
        tags: ['api', 'exports'],
        description: 'Export movies to CSV',
        notes: 'Generates a CSV file containing all movies and sends it via email to the admin user. Requires admin privileges.',
        plugins: {
            'hapi-swagger': {
                responses: {
                    '200': {
                        description: 'Success',
                        schema: Joi.object({
                            message: Joi.string().required().example('Export request received. You will receive the CSV file by email shortly.')
                        })
                    },
                    '401': {
                        description: 'Unauthorized'
                    },
                    '403': {
                        description: 'Forbidden - Requires admin role'
                    },
                    '500': {
                        description: 'Internal Server Error'
                    }
                },
                security: [{ jwt: [] }],
                payloadType: 'form'
            }
        },
        validate: {
            headers: Joi.object({
                authorization: Joi.string()
                    .required()
                    .description('JWT Bearer token')
            }).unknown()
        },
        response: {
            schema: Joi.object({
                message: Joi.string().required()
            }),
            failAction: 'log'
        },
        handler: async (request, h) => {
            try {
                const { rabbitmq } = request.services();
                const adminEmail = request.auth.credentials.email;

                if (!rabbitmq.isConnected()) {
                    throw Boom.serverUnavailable('RabbitMQ service not available');
                }

                const queueName = 'movie_exports';

                // Use service methods instead of direct channel access
                await rabbitmq.assertQueue(queueName, {
                    durable: true,
                    arguments: {
                        'x-dead-letter-exchange': 'dlx',
                        'x-dead-letter-routing-key': 'movie_exports_failed'
                    }
                });

                await rabbitmq.sendToQueue(
                    queueName,
                    Buffer.from(JSON.stringify({ adminEmail })),
                    { persistent: true }
                );

                return {
                    message: 'Export request received. You will receive the CSV file by email shortly.'
                };
            } catch (error) {
                console.error('Export request failed:', error);
                if (error.isBoom) {
                    throw error;
                }
                throw Boom.internal('Failed to process export request');
            }
        }
    }
};
