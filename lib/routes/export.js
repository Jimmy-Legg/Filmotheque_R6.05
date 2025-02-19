const Boom = require('@hapi/boom');
const Fs = require('fs');

module.exports = {
    method: 'POST',
    path: '/export/movies',
    options: {
        auth: {
            scope: ['admin']
        },
        handler: async (request, h) => {
            const { movieService, exportService } = request.services();
            const { credentials } = request.auth;

            try {
                // Ensure temp directory exists
                if (!Fs.existsSync('temp')) {
                    Fs.mkdirSync('temp');
                }

                // Get all movies
                const movies = await movieService.getAll();

                // Generate CSV file
                const filePath = await exportService.generateMoviesCsv(movies);

                // Queue the export job
                await exportService.queueExportJob(credentials.email, filePath);

                return { message: 'Export job has been queued. You will receive the CSV file by email.' };
            } catch (error) {
                console.error('Export error:', error);
                throw Boom.internal('Failed to process export');
            }
        }
    }
};
