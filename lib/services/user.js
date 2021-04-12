'use strict';

const { Service } = require('@hapipal/schmervice');
const Boom = require('@hapi/boom');

module.exports = class UserService extends Service {

    create(user) {
        const { User } = this.server.models();
        return User.query().insertAndFetch(user);
    }

    list() {
        const { User } = this.server.models();
        return User.query();
    }

    delete(id) {
        const { User } = this.server.models();
        return User.query().deleteById(id);
    }

    async update(id, user) {
        const { User } = this.server.models();
        const updated = await User.query().patchAndFetchById(id, user);
        
        if (!updated) {
            throw Boom.notFound(`User ${id} not found`);
        }
        
        return updated;
    }

    async findByEmail(email) {
        const { User } = this.server.models();
        return User.query().findOne({ email });
    }
};