'use strict';

const { Service } = require('@hapipal/schmervice');
const Amqp = require('amqplib');
const Boom = require('@hapi/boom');

module.exports = class RabbitMQService extends Service {
    static get name() {
        return 'rabbitmq';
    }

    constructor(server, options) {
        super(server, options);
        this.connection = null;
        this.channel = null;
        this._connecting = false;
        this.retryAttempts = 0;
        this.maxRetries = 3;
        this.retryDelay = 2000;
    }

    async connect() {
        try {
            this.connection = await Amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost:5672');
            
            this.connection.on('error', (err) => {
                console.error('RabbitMQ connection error:', err);
                this.handleDisconnect();
            });

            this.connection.on('close', () => {
                console.log('RabbitMQ connection closed');
                this.handleDisconnect();
            });

            return this.connection;
        } catch (error) {
            console.error('Failed to create connection:', error);
            throw error;
        }
    }

    async initialize() {
        if (this._connecting) return;
        this._connecting = true;

        try {
            console.log('Connecting to RabbitMQ...');
            
            // Try to connect with retries
            while (this.retryAttempts < this.maxRetries) {
                try {
                    await this.connect();
                    this.channel = await this.connection.createChannel();
                    break;
                } catch (err) {
                    this.retryAttempts++;
                    if (this.retryAttempts >= this.maxRetries) {
                        throw err;
                    }
                    console.log(`RabbitMQ connection attempt ${this.retryAttempts} failed, retrying in ${this.retryDelay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                }
            }

            // Setup channel error handlers
            if (this.channel) {
                this.channel.on('error', (err) => {
                    console.error('RabbitMQ channel error:', err);
                    this.channel = null;
                    this.createChannel().catch(console.error);
                });

                this.channel.on('close', () => {
                    console.log('RabbitMQ channel closed');
                    this.channel = null;
                });
            }

            console.log('RabbitMQ connection established');
            this._connecting = false;
            this.retryAttempts = 0;
        } catch (error) {
            console.error('Failed to connect to RabbitMQ:', error);
            this._connecting = false;
            throw Boom.serverUnavailable('RabbitMQ service unavailable');
        }
    }

    async createChannel() {
        try {
            if (!this.connection || this.connection.closed) {
                await this.connect();
            }
            
            if (this.channel && !this.channel.closed) {
                try {
                    await this.channel.close();
                } catch (err) {
                    console.warn('Error closing existing channel:', err);
                }
            }

            this.channel = await this.connection.createChannel();
            
            this.channel.on('error', (err) => {
                console.error('RabbitMQ channel error:', err);
                this.channel = null;
                this.createChannel().catch(console.error);
            });

            this.channel.on('close', () => {
                console.log('RabbitMQ channel closed');
                this.channel = null;
                this.createChannel().catch(console.error);
            });

            return this.channel;
        } catch (error) {
            console.error('Failed to create channel:', error);
            throw error;
        }
    }

    async handleDisconnect() {
        this.channel = null;
        this.connection = null;
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        try {
            await this.initialize();
            await this.createChannel();
        } catch (error) {
            console.error('Failed to reconnect:', error);
        }
    }

    isConnected() {
        return this.connection !== null && 
               this.channel !== null && 
               !this.connection.closed &&
               !this.channel.closed;
    }

    async waitForConnection(timeout = 5000) {
        const startTime = Date.now();
        while (!this.isConnected() && (Date.now() - startTime) < timeout) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return this.isConnected();
    }

    async assertQueue(name, options = {}) {
        if (!this.isConnected()) {
            throw new Error('Not connected to RabbitMQ');
        }
        return this.channel.assertQueue(name, options);
    }

    async sendToQueue(queue, content, options = {}) {
        if (!this.isConnected()) {
            throw new Error('Not connected to RabbitMQ');
        }
        return this.channel.sendToQueue(queue, content, options);
    }
}
