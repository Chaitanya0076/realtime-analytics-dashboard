import { Kafka } from "kafkajs";
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { handleEvent, drainAggregates } from "./aggregator";
import { updateRedis } from "./redisUpdater";
import { flushToDb } from "./dbWriter";

// Get directory for ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root (three levels up from apps/processor/src/index.ts)
config({ path: resolve(__dirname, '../../../.env') });


const kafka = new Kafka({
    clientId:"analytics-processor",
    brokers: [process.env.KAFKA_BROKER || 'localhost:9002'],
});

const consumer = kafka.consumer({ groupId: "analytics-processor" });

async function start(){
    try {
        console.log("[processor] Connecting to Kafka brokers:", process.env.KAFKA_BROKER || 'localhost:9002');
        await consumer.connect();
        console.log("[processor] Connected to Kafka");
        
        await consumer.subscribe({ topic: "page_views", fromBeginning: false });
        console.log("[processor] Subscribed to topic: page_views");

        console.log("[processor] Consumer started and ready");

        await consumer.run({
            eachMessage: async({ topic, partition, message }) => {
                console.log("[processor] Received message from topic:", topic, "partition:", partition);
                
                if(!message.value) {
                    console.warn("[processor] Message has no value, skipping");
                    return;
                }

                try{
                    const eventStr = message.value.toString();
                    console.log("[processor] Raw message value:", eventStr);
                    const event = JSON.parse(eventStr);
                    console.log("[processor] Parsed event:", event);
                    
                    // process the event here
                    console.log("[processor] Updating Redis...");
                    await updateRedis(event);
                    console.log("[processor] Handling event in aggregator...");
                    handleEvent(event);
                    console.log("[processor] Event processed successfully:", event.id);
                }catch(err){
                    console.error("[processor] Error processing event:", err);
                    console.error("[processor] Error stack:", err instanceof Error ? err.stack : 'No stack trace');
                }
            },
        })
    } catch (err) {
        console.error("[processor] Failed to start consumer:", err);
        throw err;
    }
}


start().catch((err) => {
  console.error("[processor] fatal error", err);
  process.exit(1);
});

// Periodically flush aggregates to DB
setInterval(async () => {
    const batch = drainAggregates();
    if(batch.length === 0) return;

    try{
        await flushToDb(batch);
        console.log(`[processor] flushed ${batch.length} aggregates to DB`);
    }catch(err){
        console.error("[processor] error flushing to DB:", err);
    }
}, 5000); // every 5 seconds