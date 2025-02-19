const amqp = require('amqplib');
const { createObjectCsvWriter } = require('csv-writer');
const nodemailer = require('nodemailer');
const { Service } = require('@hapipal/schmervice');
const Fs = require('fs');
const Path = require('path');

module.exports = class ExportService extends Service {

    async generateMoviesCsv(movies) {
        const csvWriter = createObjectCsvWriter({
            path: 'temp/movies.csv',
            header: [
                { id: 'id', title: 'ID' },
                { id: 'title', title: 'Title' },
                { id: 'description', title: 'Description' },
                { id: 'releaseDate', title: 'Release Date' },
                { id: 'director', title: 'Director' }
            ]
        });

        await csvWriter.writeRecords(movies);
        return 'temp/movies.csv';
    }

    async sendExportEmail(email, filePath) {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const message = {
            from: process.env.SMTP_FROM,
            to: email,
            subject: 'Movies Export',
            text: 'Please find attached the movies export file.',
            attachments: [
                {
                    filename: 'movies.csv',
                    path: filePath
                }
            ]
        };

        await transporter.sendMail(message);
    }

    async setupMessageQueue() {
        const connection = await amqp.connect(process.env.RABBITMQ_URL);
        const channel = await connection.createChannel();
        await channel.assertQueue('export_queue', { durable: true });

        channel.consume('export_queue', async (msg) => {
            if (msg !== null) {
                const { email, filePath } = JSON.parse(msg.content.toString());
                try {
                    await this.sendExportEmail(email, filePath);
                    // Delete the temporary file after sending
                    Fs.unlinkSync(filePath);
                    channel.ack(msg);
                } catch (error) {
                    console.error('Error sending email:', error);
                    channel.nack(msg);
                }
            }
        });

        return channel;
    }

    async queueExportJob(email, filePath) {
        const connection = await amqp.connect(process.env.RABBITMQ_URL);
        const channel = await connection.createChannel();
        await channel.assertQueue('export_queue', { durable: true });

        channel.sendToQueue('export_queue', Buffer.from(JSON.stringify({
            email,
            filePath
        })));

        await channel.close();
        await connection.close();
    }
};
