'use strict';

const Joi = require('joi');

module.exports = {
    method: 'delete',
    path: '/user/{id}',
    options: {
        tags: ['api'],
        validate: {
            params: Joi.object({
                id: Joi.number().integer().required().description('User ID to delete')
            })
        }
    },
    handler: async (request, h) => {
        const { userService } = request.services();
        await userService.delete(request.params.id);
        return '';
    }
};
