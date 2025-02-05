'use strict';

const { Service } = require('@hapipal/schmervice');
const { createObjectCsvWriter } = require('csv-writer');

module.exports = class MovieService extends Service {

    async create(movie, transaction) {
        const { Movie } = this.server.models();
        const { emailService } = this.server.services();
        
        const newMovie = await Movie.query(transaction).insert(movie);
        
        // Get all users to notify about new movie
        const { User } = this.server.models();
        const users = await User.query();
        
        // Send notification email
        await emailService.sendNewMovieNotification(users, newMovie);
        
        return newMovie;
    }

    async update(id, movie, transaction) {
        const { Movie, UserMovie, User } = this.server.models();
        const { emailService } = this.server.services();
        
        const updatedMovie = await Movie.query(transaction)
            .patchAndFetchById(id, movie);
            
        // Get users who have this movie in favorites
        const userMovies = await UserMovie.query()
            .where('movieId', id)
            .select('userId');
            
        if (userMovies.length > 0) {
            const userIds = userMovies.map(um => um.userId);
            const users = await User.query().whereIn('id', userIds);
            
            // Send update notification
            await emailService.sendMovieUpdateNotification(users, updatedMovie);
        }
        
        return updatedMovie;
    }

    async delete(id, transaction) {
        const { Movie } = this.server.models();
        return await Movie.query(transaction).deleteById(id);
    }

    async findById(id, transaction) {
        const { Movie } = this.server.models();
        return await Movie.query(transaction).findById(id);
    }

    async findAll(transaction) {
        const { Movie } = this.server.models();
        return await Movie.query(transaction);
    }

    async addToFavorites(userId, movieId, transaction) {
        const { UserMovie } = this.server.models();
        
        const existing = await UserMovie.query(transaction)
            .where({ userId, movieId })
            .first();
            
        if (existing) {
            throw new Error('Movie already in favorites');
        }
        
        return await UserMovie.query(transaction).insert({
            userId,
            movieId
        });
    }

    async removeFromFavorites(userId, movieId, transaction) {
        const { UserMovie } = this.server.models();
        
        const deleted = await UserMovie.query(transaction)
            .where({ userId, movieId })
            .delete();
            
        if (!deleted) {
            throw new Error('Movie not found in favorites');
        }
        
        return true;
    }

    async getFavorites(userId, transaction) {
        const { Movie, UserMovie } = this.server.models();
        
        return await Movie.query(transaction)
            .join('user_movies', 'movies.id', 'user_movies.movieId')
            .where('user_movies.userId', userId);
    }

    async generateCsvExport(transaction) {
        const movies = await this.findAll(transaction);
        
        const csvWriter = createObjectCsvWriter({
            header: [
                {id: 'id', title: 'ID'},
                {id: 'title', title: 'Title'},
                {id: 'description', title: 'Description'},
                {id: 'releaseDate', title: 'Release Date'},
                {id: 'director', title: 'Director'},
                {id: 'createdAt', title: 'Created At'},
                {id: 'updatedAt', title: 'Updated At'}
            ]
        });
        
        return await csvWriter.writeRecords(movies);
    }
};
