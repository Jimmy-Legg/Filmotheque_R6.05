'use strict';

const { Service } = require('@hapipal/schmervice');
const { NotFoundError } = require('@hapipal/boom');
const { createObjectCsvStringifier } = require('csv-writer').createObjectCsvStringifier;

module.exports = class MovieService extends Service {

    async create(movie) {
        const { Movie } = this.server.models();
        const { emailService, userService } = this.server.services();

        // Check if movie with same title exists
        const exists = await Movie.query().where('title', movie.title).first();
        if (exists) {
            throw new Error('A movie with this title already exists');
        }

        // Create the movie
        const newMovie = await Movie.query().insert(movie);

        // Notify all users about new movie
        const users = await userService.find();
        if (users.length > 0) {
            await emailService.sendNewMovieNotification(users, newMovie);
        }

        return newMovie;
    }

    async update(id, movie) {
        const { Movie } = this.server.models();
        const { emailService, favoriteService } = this.server.services();

        // Find and update the movie
        const updatedMovie = await Movie.query()
            .patchAndFetchById(id, movie);

        if (!updatedMovie) {
            throw new NotFoundError('Movie not found');
        }

        // Notify users who have this movie in favorites
        const usersWithFavorite = await favoriteService.findByMovie(id);
        if (usersWithFavorite.length > 0) {
            await emailService.sendMovieUpdateNotification(usersWithFavorite, updatedMovie);
        }

        return updatedMovie;
    }

    async delete(id) {
        const { Movie } = this.server.models();

        const movie = await Movie.query().findById(id);
        if (!movie) {
            throw new NotFoundError('Movie not found');
        }

        await Movie.query().deleteById(id);
        return movie;
    }

    async find() {
        const { Movie } = this.server.models();
        return await Movie.query();
    }

    async findById(id) {
        const { Movie } = this.server.models();
        const movie = await Movie.query().findById(id);

        if (!movie) {
            throw new NotFoundError('Movie not found');
        }

        return movie;
    }

    async exportToCsv(user) {
        const { Movie } = this.server.models();
        const { emailService } = this.server.services();

        // Get all movies
        const movies = await Movie.query();

        // Create CSV
        const csvStringifier = createObjectCsvStringifier({
            header: [
                { id: 'id', title: 'ID' },
                { id: 'title', title: 'Title' },
                { id: 'description', title: 'Description' },
                { id: 'director', title: 'Director' },
                { id: 'releaseDate', title: 'Release Date' },
                { id: 'createdAt', title: 'Created At' },
                { id: 'updatedAt', title: 'Updated At' }
            ]
        });

        const csvString = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(movies);
        const csvBuffer = Buffer.from(csvString, 'utf-8');

        // Send CSV via email
        await emailService.sendMovieExportEmail(user, csvBuffer);

        return { message: 'Movie export has been sent to your email' };
    }
};
