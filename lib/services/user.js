'use strict';

const { Service } = require('@hapipal/schmervice');
const Boom = require('@hapi/boom');
const Jwt = require('@hapi/jwt');
const Bcrypt = require('bcrypt');

module.exports = class UserService extends Service {

    async create(user) {
        const { User } = this.server.models();

        // Check if user with same email or username exists
        const exists = await User.query()
            .where('email', user.email)
            .orWhere('username', user.username)
            .first();

        if (exists) {
            throw Boom.badRequest('Email or username already exists');
        }

        // Hash password
        user.password = await Bcrypt.hash(user.password, 10);

        // Set default role if not provided
        if (!user.roles) {
            user.roles = ['user'];
        }

        const newUser = await User.query().insert(user);

        // Send welcome email if email service is available
        try {
            const { emailService } = this.server.services();
            if (emailService) {
                await emailService.sendWelcomeEmail(newUser);
            }
        } catch (error) {
            // Log the error but don't fail the user creation
            console.error('Failed to send welcome email:', error);
        }

        return newUser;
    }

    async findAll() {
        const { User } = this.server.models();
        return User.query();
    }

    async delete(id) {
        const { User } = this.server.models();
        return User.query().deleteById(id);
    }

    async update(id, user) {
        const { User } = this.server.models();

        // Hash password if it's being updated
        if (user.password) {
            user.password = await Bcrypt.hash(user.password, 10);
        }

        return User.query().patchAndFetchById(id, user);
    }

    async login(email, password) {
        const { User } = this.server.models();

        const user = await User.query()
            .where('email', email)
            .first();

        if (!user) {
            throw Boom.unauthorized('Invalid email or password');
        }

        const isValid = await Bcrypt.compare(password, user.password);

        if (!isValid) {
            throw Boom.unauthorized('Invalid email or password');
        }

        const token = Jwt.token.generate(
            {
                aud: 'urn:audience:iut',
                iss: 'urn:issuer:iut',
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                scope: user.roles || ['user']
            },
            {
                key: process.env.JWT_SECRET || 'secret',
                algorithm: 'HS512'
            },
            {
                ttlSec: 14400 // 4 hours
            }
        );

        return {
            token_type: 'Bearer',
            access_token: token,
            expires_in: 14400
        };
    }
};
