import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { auth } from "./modules/auth";
import { configs } from "./modules/configs";
import { connections } from "./modules/connections";
import { startScheduler } from "./scheduler";

const app = new Elysia()
    .use(cors())
    .onError(({ code, error }) => {
        console.error(`[${code}]`, error);
    })
    .use(swagger())
    .use(auth)
    .use(configs)
    .use(connections)
    .get("/", () => "Elysia Dashboard API")
    .listen(process.env.PORT || 3000);

console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

// Start the scheduler
startScheduler();
