'use strict';

const nodemailer = require('nodemailer');

module.exports = class EmailService {

    constructor() {
        this.initializeTransporter();
    }

    async initializeTransporter() {
        // Create a test account if SMTP credentials are not provided
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            const testAccount = await nodemailer.createTestAccount();
            this.transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
            console.log('Test email account created:', {
                user: testAccount.user,
                pass: testAccount.pass
            });
        } else {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT),
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
        }
    }

    async sendWelcomeEmail(user) {
        // Ensure transporter is initialized
        if (!this.transporter) {
            await this.initializeTransporter();
        }

        const mailOptions = {
            from: '"Movies App" <movies@example.com>',
            to: user.email,
            subject: 'Bienvenue sur Movies App!',
            html: `
                <h1>Bonjour ${user.firstName}!</h1>
                <p>Merci de vous joindre notre plateforme de films. Nous sommes ravis de vous avoir ici!</p>
                <p>Vous pouvez maintenant commencer   explorer les films et les ajouter   vos favoris.</p>
            `
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Welcome email sent:', info.messageId);
            console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
            return info;
        } catch (error) {
            console.error('Error sending welcome email:', error);
            throw error;
        }
    }

    async sendNewMovieNotification(users, movie) {
        // Ensure transporter is initialized
        if (!this.transporter) {
            await this.initializeTransporter();
        }

        const mailOptions = {
            from: '"Movies App" <movies@example.com>',
            to: users.map(user => user.email).join(','),
            subject: 'New Movie Added!',
            html: `
                <h1>New Movie: ${movie.title}</h1>
                <p>A new movie has been added to our platform:</p>
                <ul>
                    <li>Title: ${movie.title}</li>
                    <li>Director: ${movie.director}</li>
                    <li>Release Date: ${movie.releaseDate}</li>
                </ul>
                <p>Description: ${movie.description}</p>
            `
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Movie notification sent:', info.messageId);
            console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
            return info;
        } catch (error) {
            console.error('Error sending movie notification:', error);
            throw error;
        }
    }

    async sendMovieUpdateNotification(users, movie) {
        // Ensure transporter is initialized
        if (!this.transporter) {
            await this.initializeTransporter();
        }

        const mailOptions = {
            from: '"Movies App" <movies@example.com>',
            to: users.map(user => user.email).join(','),
            subject: `Movie Updated: ${movie.title}`,
            html: `
                <h1>Movie Update: ${movie.title}</h1>
                <p>A movie you're following has been updated:</p>
                <ul>
                    <li>Title: ${movie.title}</li>
                    <li>Director: ${movie.director}</li>
                    <li>Release Date: ${movie.releaseDate}</li>
                </ul>
                <p>Description: ${movie.description}</p>
            `
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Movie update notification sent:', info.messageId);
            console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
            return info;
        } catch (error) {
            console.error('Error sending movie update notification:', error);
            throw error;
        }
    }

    async sendMovieExportEmail(user, csvBuffer) {
        // Ensure transporter is initialized
        if (!this.transporter) {
            await this.initializeTransporter();
        }

        const mailOptions = {
            from: '"Movies App" <movies@example.com>',
            to: user.email,
            subject: 'Movies Export',
            html: '<p>Please find attached the exported movies data.</p>',
            attachments: [
                {
                    filename: 'movies.csv',
                    content: csvBuffer
                }
            ]
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Movie export email sent:', info.messageId);
            console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
            return info;
        } catch (error) {
            console.error('Error sending movie export:', error);
            throw error;
        }
    }
};
