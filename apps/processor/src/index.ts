import { Kafka } from "kafkajs";
import { handleEvent, drainAggregates } from "./aggregator";
import { updateRedis } from "./redisUpdater";
import { flushToDb } from "./dbWriter";


const kafka = new Kafka({
    clientId:"analytics-processor",
    brokers: [process.env.KAFKA_BROKER || 'localhost:9002'],
});

const consumer = kafka.consumer({ groupId: "analytics-processor" });

async function start(){
    await consumer.connect();
    await consumer.subscribe({ topic: "page_views", fromBeginning: true });

    console.log("[processor] consumer started");

    await consumer.run({
        eachMessage: async({ message }) => {
            if(!message.value) return;

            try{
                const event = JSON.parse(message.value.toString());
                // process the event here
                await updateRedis(event);
                handleEvent(event);
                console.log("[processor] received event:", event);
            }catch(err){
                console.error("[processor] invalid event:", err);
            }
        },
    })
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