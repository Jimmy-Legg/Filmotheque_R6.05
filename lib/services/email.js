'use strict';

const nodemailer = require('nodemailer');

module.exports = class EmailService {

    constructor() {
        // Don't initialize transporter in constructor
        this.transporter = null;
    }

    async initializeTransporter() {
        try {
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
        } catch (error) {
            console.error('Failed to initialize email transporter:', error);
            // Don't throw error, just set transporter to null
            this.transporter = null;
        }
    }

    async sendEmail(options) {
        try {
            // Try to initialize transporter if not already done
            if (!this.transporter) {
                await this.initializeTransporter();
            }

            // If still no transporter, just log and return
            if (!this.transporter) {
                console.log('Email notification skipped (no transporter):', options);
                return;
            }

            const result = await this.transporter.sendMail(options);
            console.log('Email sent:', result);

            // Extract MSGID from response and construct Ethereal URL
            if (result.response && result.response.includes('MSGID=')) {
                const msgId = result.response.match(/MSGID=([^\s\]]+)/)[1];
                console.log('View email at:', `https://ethereal.email/message/${msgId}`);
            }

            return result;
        } catch (error) {
            console.error('Failed to send email:', error);
            // Don't throw error, just log it
        }
    }

    async sendWelcomeEmail(user) {
        return this.sendEmail({
            from: '"Movies App" <movies@example.com>',
            to: user.email,
            subject: 'Bienvenue sur Movies App!',
            html: `
                <h1>Bonjour ${user.firstName}!</h1>
                <p>Merci de vous joindre notre plateforme de films. Nous sommes ravis de vous avoir ici!</p>
                <p>Vous pouvez maintenant commencer   explorer les films et les ajouter   vos favoris.</p>
            `
        });
    }

    async sendNewMovieNotification(users, movie) {
        if (!users || users.length === 0) return;

        const emails = users.map(user => user.email);
        return this.sendEmail({
            from: '"Movies App" <movies@example.com>',
            to: emails.join(', '),
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
        });
    }

    async sendMovieUpdateNotification(users, movie) {
        if (!users || users.length === 0) return;

        const emails = users.map(user => user.email);
        return this.sendEmail({
            from: '"Movies App" <movies@example.com>',
            to: emails.join(', '),
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
        });
    }

    async sendMovieExportEmail(user, csvBuffer) {
        return this.sendEmail({
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
        });
    }
};
