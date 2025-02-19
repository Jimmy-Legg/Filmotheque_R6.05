'use strict';

const Boom = require('@hapi/boom');
const { Service } = require('@hapipal/schmervice');
const { createObjectCsvStringifier } = require('csv-writer').createObjectCsvStringifier;

module.exports = class MovieService extends Service {

    async create(movie) {
        try {
            const { Movie } = this.server.models();
            const { emailService, userService } = this.server.services();

            console.log('Creating movie with data:', movie);

            // Check if movie with same title exists
            const exists = await Movie.query().where('title', movie.title).first();
            if (exists) {
                throw Boom.conflict('A movie with this title already exists');
            }

            // Create the movie
            const newMovie = await Movie.query().insert(movie);
            console.log('Movie created successfully:', newMovie);

            try {
                // Notify all users about new movie
                const users = await userService.find();
                if (users.length > 0) {
                    await emailService.sendNewMovieNotification(users, newMovie);
                }
            } catch (emailError) {
                // Log email error but don't fail the movie creation
                console.error('Failed to send email notifications:', emailError);
            }

            return newMovie;
        } catch (error) {
            console.error('Error in create:', error);
            console.error('Error stack:', error.stack);
            if (error.isBoom) {
                throw error;
            }
            throw Boom.internal('Failed to create movie: ' + error.message);
        }
    }

    async update(id, movie) {
        try {
            const { Movie } = this.server.models();
            const { emailService, userService } = this.server.services();
            
            // Check if movie exists
            const existingMovie = await Movie.query().findById(id);
            if (!existingMovie) {
                throw Boom.notFound('Movie not found');
            }

            // If title is being changed, check for duplicates
            if (movie.title && movie.title !== existingMovie.title) {
                const duplicateTitle = await Movie.query()
                    .where('title', movie.title)
                    .whereNot('id', id)
                    .first();
                
                if (duplicateTitle) {
                    throw Boom.conflict('A movie with this title already exists');
                }
            }

            // Update the movie
            const updatedMovie = await Movie.query()
                .patchAndFetchById(id, movie);

            if (!updatedMovie) {
                throw Boom.notFound('Movie not found');
            }

            try {
                // Notify all users about updated movie
                const users = await userService.find();
                if (users.length > 0) {
                    await emailService.sendMovieUpdateNotification(users, updatedMovie);
                }
            } catch (emailError) {
                // Log email error but don't fail the movie update
                console.error('Failed to send email notifications:', emailError);
            }

            return updatedMovie;
        } catch (error) {
            console.error('Error in update:', error);
            console.error('Error stack:', error.stack);
            if (error.isBoom) {
                throw error;
            }
            throw Boom.internal('Failed to update movie: ' + error.message);
        }
    }

    async delete(id) {
        const { Movie } = this.server.models();

        const movie = await Movie.query().findById(id);
        if (!movie) {
            throw new Error('Movie not found');
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
            throw new Error('Movie not found');
        }

        return movie;
    }

    async findAll() {
        try {
            const { Movie } = this.server.models();
            
            // First verify that we can access the model
            if (!Movie || typeof Movie.query !== 'function') {
                console.error('Movie model is not properly initialized:', Movie);
                throw new Error('Movie model is not properly initialized');
            }

            // Execute the query with error handling
            const movies = await Movie.query().select('*');
            
            // Validate the result
            if (!Array.isArray(movies)) {
                console.error('Unexpected query result:', movies);
                throw new Error('Unexpected query result format');
            }

            return movies;
        } catch (error) {
            console.error('Error in findAll:', error);
            console.error('Error stack:', error.stack);
            throw Boom.internal('Failed to fetch movies: ' + error.message);
        }
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
