import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";
import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
//import ratelimit from "../rateLimiter";
import { users, items, logs } from '../../../../drizzle/schema';
import { eq, between } from "drizzle-orm";

export const itemRouter = createTRPCRouter({
    createItem: privateProcedure
    .input(z.object({ itemType: z.enum(['time', 'duration', 'amount', 'consistency']), itemName: z.string(), direction: z.enum(['increase', 'decrease']) }))
    .mutation(async ({ ctx, input }) => {
        await ctx.db.insert(items).values({
            userId: ctx.userId,
            itemType: input.itemType,
            itemName: input.itemName,
            direction: input.direction,
            createdAt: new Date()
        })
    })
});