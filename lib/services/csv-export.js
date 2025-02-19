'use strict';

const { Service } = require('@hapipal/schmervice');
const { createObjectCsvWriter } = require('csv-writer');
const fs = require('fs');
const path = require('path');

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, '../../temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

module.exports = class CSVExportService extends Service {
    
    static get name() {
        return 'csvExport';
    }

    constructor(server, options) {
        super(server, options);
        this.initialized = false;
        this.retryCount = 0;
        this.maxRetries = 5;
        this.retryDelay = 2000;
    }

    async initialize() {
        try {
            const { rabbitmq } = this.server.services();
            
            // Wait for RabbitMQ to connect
            let connected = false;
            let attempts = 0;
            const maxAttempts = 3;

            // Try to initialize RabbitMQ if not already connected
            if (!rabbitmq.isConnected()) {
                await rabbitmq.initialize().catch(err => {
                    console.log('Initial RabbitMQ connection failed, will retry:', err.message);
                });
            }

            while (!connected && attempts < maxAttempts) {
                attempts++;
                console.log(`Attempting to connect to RabbitMQ (attempt ${attempts}/${maxAttempts})...`);
                
                if (rabbitmq.isConnected()) {
                    connected = true;
                } else {
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                }
            }

            if (connected) {
                await this.setupConsumer(rabbitmq);
                this.initialized = true;
                console.log('CSVExportService initialized successfully');
            } else {
                throw new Error('RabbitMQ connection not available after multiple attempts');
            }
        } catch (error) {
            console.error('Failed to initialize CSVExportService:', error);
            if (this.retryCount < this.maxRetries) {
                this.scheduleRetry();
            }
        }
    }

    scheduleRetry() {
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            const delay = Math.min(1000 * Math.pow(2, this.retryCount), 10000);
            console.log(`Scheduling retry ${this.retryCount} in ${delay}ms`);
            
            setTimeout(() => {
                this.initialize();
            }, delay);
        } else {
            console.error('Max retry attempts reached for CSVExportService initialization');
        }
    }

    async setupConsumer(rabbitmq) {
        try {
            if (!rabbitmq.isConnected()) {
                throw new Error('RabbitMQ not connected');
            }

            const queueName = 'movie_exports';
            let channel;

            try {
                // Get a fresh channel
                channel = await rabbitmq.connection.createChannel();
                
                // Setup channel error handling
                channel.on('error', (err) => {
                    console.error('Channel error:', err);
                    this.scheduleReconnect(rabbitmq);
                });

                channel.on('close', () => {
                    console.log('Channel closed, scheduling reconnect');
                    this.scheduleReconnect(rabbitmq);
                });

                // Setup exchanges and queues
                await channel.assertExchange('dlx', 'direct', { durable: true });
                await channel.assertQueue('movie_exports_failed', { durable: true });
                await channel.bindQueue('movie_exports_failed', 'dlx', 'movie_exports_failed');

                await channel.assertQueue(queueName, {
                    durable: true,
                    arguments: {
                        'x-dead-letter-exchange': 'dlx',
                        'x-dead-letter-routing-key': 'movie_exports_failed'
                    }
                });

                // Setup consumer
                await channel.consume(queueName, async (msg) => {
                    if (!msg) return;

                    try {
                        const { adminEmail } = JSON.parse(msg.content.toString());
                        await this.processExport(adminEmail);
                        
                        if (channel && !channel.closed) {
                            await channel.ack(msg);
                            console.log(`Successfully processed export for ${adminEmail}`);
                        }
                    } catch (error) {
                        console.error('Error processing export:', error);
                        if (channel && !channel.closed) {
                            // Send to dead letter queue
                            await channel.nack(msg, false, false);
                        }
                    }
                }, { 
                    noAck: false,
                    consumerTag: `csv_export_consumer_${Date.now()}`
                });

                console.log('CSV Export queue consumer setup completed');
                return true;
            } catch (error) {
                if (channel) {
                    try {
                        await channel.close();
                    } catch (closeError) {
                        console.error('Error closing channel:', closeError);
                    }
                }
                throw error;
            }
        } catch (error) {
            console.error('Failed to setup consumer:', error);
            throw error;
        }
    }

    async scheduleReconnect(rabbitmq) {
        console.log('Scheduling reconnection...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        try {
            await this.setupConsumer(rabbitmq);
        } catch (error) {
            console.error('Reconnection failed:', error);
            this.scheduleReconnect(rabbitmq);
        }
    }

    async processExport(adminEmail) {
        let tempFile = null;
        try {
            const { Movie } = this.server.models();
            const { email } = this.server.services();

            console.log(`Starting CSV export for ${adminEmail}...`);
            const movies = await Movie.query();
            console.log(`Found ${movies.length} movies to export`);

            tempFile = path.join(tempDir, `movies-${Date.now()}.csv`);
            console.log(`Writing to temporary file: ${tempFile}`);

            const csvWriter = createObjectCsvWriter({
                path: tempFile,
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

            await csvWriter.writeRecords(movies);

            // Read the file into a buffer
            const csvBuffer = fs.readFileSync(tempFile);

            // Initialize email service if needed
            if (!email.transporter) {
                await email.initialize();
            }

            // Send email
            await email.sendMovieExportEmail({ email: adminEmail }, csvBuffer);

            console.log(`Successfully exported movies to CSV for ${adminEmail}`);
        } catch (error) {
            console.error(`Failed to export movies for ${adminEmail}:`, error);
            throw error; // Propagate error to trigger message rejection
        } finally {
            // Clean up temp file
            if (tempFile && fs.existsSync(tempFile)) {
                try {
                    fs.unlinkSync(tempFile);
                } catch (err) {
                    console.error('Failed to clean up temp file:', err);
                }
            }
        }
    }
};
