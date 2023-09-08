import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";
import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
//import ratelimit from "../rateLimiter";
import { users, items, logs } from '../../../../drizzle/schema';
import { eq, between } from "drizzle-orm";

const itemTypes = ['time', 'duration', 'amount', 'consistency'] as const;

export const logRouter = createTRPCRouter({
    createItemLog: privateProcedure
    .input(z.object({ 
        itemId: z.number(), 
        itemType: z.enum(itemTypes),
    }))
    .mutation(async ({ ctx, input }) => {
        const currDate = new Date();
        if (input.itemType === 'time') {
            const res = await ctx.db.insert(logs).values({
                createdAt: currDate,
                itemId: input.itemId,
                updatedAt: currDate,
            }).returning({
                createdAt: logs.createdAt,
                itemId: logs.itemId,
                updatedAt: logs.updatedAt,
                logId: logs.logId
            });

            return res;
        } else if (input.itemType === 'consistency') {
            const res = await ctx.db.insert(logs).values({
                createdAt: currDate,
                itemId: input.itemId,
                updatedAt: currDate,
                value: 1
            }).returning({
                createdAt: logs.createdAt,
                itemId: logs.itemId,
                updatedAt: logs.updatedAt,
                logId: logs.logId
            });
        }
    })
});
