'use strict';

module.exports = {
    method: 'get',
    path: '/users',
    options: {
        tags: ['api'],
        description: 'Get all users'
    },
    handler: async (request, h) => {
        const { userService } = request.services();
        return await userService.list();
    }
};
