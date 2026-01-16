import { Kafka } from "kafkajs";
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { handleEvent, drainAggregates } from "./aggregator.js";
import { updateRedis } from "./redisUpdater.js";
import { flushToDb } from "./dbWriter.js";

// Get directory for ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Determine if we're in development or production (compiled)
// In development: __dirname = apps/processor/src
// In production (compiled): __dirname = apps/processor/dist
const isCompiled = __dirname.includes('dist');
const projectRoot = isCompiled 
  ? resolve(__dirname, '../../..')  // dist -> processor -> apps -> root
  : resolve(__dirname, '../../../..'); // src -> processor -> apps -> root

// Load .env from project root
// Use override: true to ensure .env file values take precedence over PM2/system env vars
const envPath = resolve(projectRoot, '.env');
console.log('[processor] Loading .env from:', envPath);
const envResult = config({ path: envPath, override: true });
if (envResult.error) {
  console.warn('[processor] Warning: Error loading .env file:', envResult.error.message);
} else {
  console.log('[processor] .env file loaded successfully (with override: true)');
}

// Log environment variables (before and after .env load for debugging)
console.log('[processor] KAFKA_BROKER from environment:', process.env.KAFKA_BROKER || '(not set)');
console.log('[processor] DATABASE_URL set:', !!process.env.DATABASE_URL);

// Validate required environment variables
const requiredEnvVars = ['KAFKA_BROKER', 'DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('[processor] Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

// Validate KAFKA_BROKER value - warn if using external IP when running on EC2
// The processor should use localhost:9002 (internal) when running on the same EC2 instance
const kafkaBroker = process.env.KAFKA_BROKER || '';
const isPublicIP = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/.test(kafkaBroker) && 
                   !kafkaBroker.startsWith('127.') && 
                   !kafkaBroker.startsWith('localhost');

if (isPublicIP) {
  console.warn('[processor] WARNING: KAFKA_BROKER appears to be a public IP:', kafkaBroker);
  console.warn('[processor] If running on EC2, use localhost:9002 (internal) for better performance');
  console.warn('[processor] This may also indicate PM2 env vars overriding .env file');
}

const kafka = new Kafka({
    clientId: "analytics-processor",
    brokers: [process.env.KAFKA_BROKER!],
});

const consumer = kafka.consumer({ groupId: "analytics-processor" });

// Flag to track if shutdown is in progress
let isShuttingDown = false;

async function shutdown(): Promise<void> {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;

  console.log("[processor] Shutting down gracefully...");
  
  try {
    // Flush any pending aggregates before shutdown
    const batch = drainAggregates();
    if (batch.length > 0) {
      console.log(`[processor] Flushing ${batch.length} pending aggregates before shutdown...`);
      await flushToDb(batch);
      console.log("[processor] Pending aggregates flushed");
    }

    // Disconnect consumer
    await consumer.disconnect();
    console.log("[processor] Kafka consumer disconnected");
  } catch (error) {
    console.error("[processor] Error during shutdown:", error);
  } finally {
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error("[processor] Uncaught exception:", error);
  shutdown().catch(() => process.exit(1));
});

process.on('unhandledRejection', (reason, promise) => {
  console.error("[processor] Unhandled rejection at:", promise, "reason:", reason);
  shutdown().catch(() => process.exit(1));
});

async function start(): Promise<void> {
    try {
        console.log("[processor] Connecting to Kafka brokers:", process.env.KAFKA_BROKER);
        await consumer.connect();
        console.log("[processor] Connected to Kafka");
        
        await consumer.subscribe({ topic: "page_views", fromBeginning: false });
        console.log("[processor] Subscribed to topic: page_views");

        console.log("[processor] Consumer started and ready");

        await consumer.run({
            eachMessage: async({ topic, partition, message }) => {
                if (isShuttingDown) {
                    return;
                }

                console.log("[processor] Received message from topic:", topic, "partition:", partition);
                
                if (!message.value) {
                    console.warn("[processor] Message has no value, skipping");
                    return;
                }

                try {
                    const eventStr = message.value.toString();
                    console.log("[processor] Raw message value:", eventStr);
                    const event = JSON.parse(eventStr);
                    console.log("[processor] Parsed event:", event);
                    
                    // Process the event
                    console.log("[processor] Updating Redis...");
                    await updateRedis(event);
                    console.log("[processor] Handling event in aggregator...");
                    handleEvent(event);
                    console.log("[processor] Event processed successfully:", event.id);
                } catch (err) {
                    console.error("[processor] Error processing event:", err);
                    console.error("[processor] Error stack:", err instanceof Error ? err.stack : 'No stack trace');
                    // Don't throw - continue processing other messages
                }
            },
        });
    } catch (err) {
        console.error("[processor] Failed to start consumer:", err);
        throw err;
    }
}

// Periodically flush aggregates to DB
const flushInterval = setInterval(async () => {
    if (isShuttingDown) {
        clearInterval(flushInterval);
        return;
    }

    const batch = drainAggregates();
    if (batch.length === 0) {
        return;
    }

    try {
        await flushToDb(batch);
        console.log(`[processor] Flushed ${batch.length} aggregates to DB`);
    } catch (err) {
        console.error("[processor] Error flushing to DB:", err);
    }
}, 5000); // every 5 seconds

// Start the processor
start().catch((err) => {
  console.error("[processor] Fatal error:", err);
  process.exit(1);
});
