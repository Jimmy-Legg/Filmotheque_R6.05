'use strict';

const { Service } = require('@hapipal/schmervice');
const Boom = require('@hapi/boom');

module.exports = class FavoriteService extends Service {

    async create(userId, movieId) {
        const { Favorite, Movie } = this.server.models();

        // Check if movie exists
        const movie = await Movie.query().findById(movieId);
        if (!movie) {
            throw Boom.notFound('Movie not found');
        }

        // Check if favorite already exists
        const existingFavorite = await Favorite.query()
            .where('userId', userId)
            .where('movieId', movieId)
            .first();

        if (existingFavorite) {
            throw Boom.conflict('Movie is already in favorites');
        }

        return Favorite.query().insert({
            userId,
            movieId
        });
    }

    async remove(userId, movieId) {
        const { Favorite } = this.server.models();

        const favorite = await Favorite.query()
            .where('userId', userId)
            .where('movieId', movieId)
            .first();

        if (!favorite) {
            throw Boom.notFound('Movie is not in favorites');
        }

        await Favorite.query()
            .delete()
            .where('userId', userId)
            .where('movieId', movieId);

        return { success: true };
    }

    async list(userId) {
        const { Favorite, Movie } = this.server.models();

        return Favorite.query()
            .where('userId', userId)
            .join('movies', 'favorites.movieId', 'movies.id')
            .select('movies.*');
    }
};
