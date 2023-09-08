import { exampleRouter } from "~/server/api/routers/example";
import { userRouter } from "~/server/api/routers/user";
import { itemRouter } from "~/server/api/routers/item";
import { logRouter } from "~/server/api/routers/log";
import { createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  example: exampleRouter,
  user: userRouter,
  item: itemRouter,
  log: logRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;
