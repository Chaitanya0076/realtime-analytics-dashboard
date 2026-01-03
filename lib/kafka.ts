import { Kafka } from 'kafkajs';

const kafka = new Kafka({
    clientId: "analytics-web",
    brokers: [process.env.KAFKA_BROKER || 'localhost:9002'],
});

export const producer = kafka.producer();