'use strict';

const Joi = require('joi');

module.exports = [
    {
        method: 'post',
        path: '/movies',
        options: {
            auth: {
                scope: ['admin']
            },
            tags: ['api', 'movies'],
            validate: {
                payload: Joi.object({
                    title: Joi.string().required().min(1).max(255).description('Titre du film').example('Inception'),
                    description: Joi.string().required().description('Description du film').example('Un voleur expérimenté dans l\'art de l\'extraction propose un dernier coup à sa potentielle dernière cible. Au lieu de voler des informations, il doit en implanter dans le subconscient de sa victime.'),
                    releaseDate: Joi.date().iso().required().description('Date de sortie').example('2010-07-21T00:00:00.000Z'),
                    director: Joi.string().required().description('Réalisateur').example('Christopher Nolan')
                })
            },
            response: {
                schema: Joi.object({
                    id: Joi.number().integer(),
                    title: Joi.string().example('Inception'),
                    description: Joi.string().example('Un voleur expérimenté dans l\'art de l\'extraction propose un dernier coup à sa potentielle dernière cible. Au lieu de voler des informations, il doit en implanter dans le subconscient de sa victime.'),
                    releaseDate: Joi.date().iso().example('2010-07-21T00:00:00.000Z'),
                    director: Joi.string().example('Christopher Nolan'),
                    createdAt: Joi.date().iso(),
                    updatedAt: Joi.date().iso()
                })
            },
            description: 'Créer un nouveau film',
            notes: 'Crée un nouveau film dans la base de données. Nécessite les droits administrateur.'
        },
        handler: async (request, h) => {
            const { movieService } = request.services();
            const movie = await movieService.create(request.payload);
            return movie;
        }
    },
    {
        method: 'GET',
        path: '/movies',
        options: {
            auth: {
                scope: ['admin', 'user']
            },
            tags: ['api', 'movies'],
            response: {
                failAction: 'log'
            },
            description: 'Liste des films',
            notes: 'Retourne la liste de tous les films'
        },
        handler: async (request, h) => {
            const { movieService } = request.services();
            return await movieService.findAll();
        }
    },
    {
        method: 'GET',
        path: '/movies/{id}',
        options: {
            auth: {
                scope: ['admin', 'user']
            },
            tags: ['api', 'movies'],
            validate: {
                params: Joi.object({
                    id: Joi.number().integer().required().description('ID du film')
                })
            },
            response: {
                schema: Joi.object({
                    id: Joi.number().integer(),
                    title: Joi.string().example('Inception'),
                    description: Joi.string().example('Un voleur expérimenté dans l\'art de l\'extraction propose un dernier coup à sa potentielle dernière cible. Au lieu de voler des informations, il doit en implanter dans le subconscient de sa victime.'),
                    releaseDate: Joi.date().iso().example('2010-07-21T00:00:00.000Z'),
                    director: Joi.string().example('Christopher Nolan'),
                    createdAt: Joi.date().iso(),
                    updatedAt: Joi.date().iso()
                })
            },
            description: 'Obtenir un film par son ID',
            notes: 'Retourne les détails d\'un film spécifique'
        },
        handler: async (request, h) => {
            const { movieService } = request.services();
            return await movieService.findById(request.params.id);
        }
    },
    {
        method: 'PUT',
        path: '/movies/{id}',
        options: {
            auth: {
                scope: ['admin']
            },
            tags: ['api', 'movies'],
            validate: {
                params: Joi.object({
                    id: Joi.number().integer().required().description('ID du film')
                }),
                payload: Joi.object({
                    title: Joi.string().min(1).max(255).description('Titre du film').example('Inception'),
                    description: Joi.string().description('Description du film').example('Un voleur expérimenté dans l\'art de l\'extraction propose un dernier coup à sa potentielle dernière cible. Au lieu de voler des informations, il doit en implanter dans le subconscient de sa victime.'),
                    releaseDate: Joi.date().iso().description('Date de sortie').example('2010-07-21T00:00:00.000Z'),
                    director: Joi.string().description('Réalisateur').example('Christopher Nolan')
                })
            },
            response: {
                schema: Joi.object({
                    id: Joi.number().integer(),
                    title: Joi.string().example('Inception'),
                    description: Joi.string().example('Un voleur expérimenté dans l\'art de l\'extraction propose un dernier coup à sa potentielle dernière cible. Au lieu de voler des informations, il doit en implanter dans le subconscient de sa victime.'),
                    releaseDate: Joi.date().iso().example('2010-07-21T00:00:00.000Z'),
                    director: Joi.string().example('Christopher Nolan'),
                    createdAt: Joi.date().iso(),
                    updatedAt: Joi.date().iso()
                })
            },
            description: 'Mettre à jour un film',
            notes: 'Met à jour les informations d\'un film existant'
        },
        handler: async (request, h) => {
            const { movieService } = request.services();
            return await movieService.update(request.params.id, request.payload);
        }
    },
    {
        method: 'DELETE',
        path: '/movies/{id}',
        options: {
            auth: {
                scope: ['admin']
            },
            tags: ['api', 'movies'],
            validate: {
                params: Joi.object({
                    id: Joi.number().integer().required().description('ID du film')
                })
            },
            response: {
                schema: Joi.object({
                    id: Joi.number().integer(),
                    title: Joi.string().example('Inception'),
                    description: Joi.string().example('Un voleur expérimenté dans l\'art de l\'extraction propose un dernier coup à sa potentielle dernière cible. Au lieu de voler des informations, il doit en implanter dans le subconscient de sa victime.'),
                    releaseDate: Joi.date().iso().example('2010-07-21T00:00:00.000Z'),
                    director: Joi.string().example('Christopher Nolan'),
                    createdAt: Joi.date().iso(),
                    updatedAt: Joi.date().iso()
                })
            },
            description: 'Supprimer un film',
            notes: 'Supprime un film de la base de données'
        },
        handler: async (request, h) => {
            const { movieService } = request.services();
            return await movieService.delete(request.params.id);
        }
    }
];
