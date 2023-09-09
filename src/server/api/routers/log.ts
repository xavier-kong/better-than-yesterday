import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";
import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
//import ratelimit from "../rateLimiter";
import { users, items, logs, Log } from '../../../../drizzle/schema';
import { eq, between } from "drizzle-orm";

const itemTypes = ['time', 'duration', 'amount', 'consistency'] as const;

export const logRouter = createTRPCRouter({
    createItemLog: privateProcedure
    .input(z.object({ 
        itemId: z.number(), 
        itemType: z.enum(itemTypes),
        loggedSecs: z.number().optional()
    }))
    .mutation(async ({ ctx, input }) => {
        const currDate = new Date();
        const body = {
            createdAt: currDate,
            itemId: input.itemId,
            updatedAt: currDate,
        } as Log;

        if (input.itemType === 'consistency') {
            body.value = 1;
        } else if (input.itemType === 'duration') {
            if (!input.loggedSecs) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Missing logged duration' });
            }

            body.value = input.loggedSecs;
        }

        const res = await ctx.db
            .insert(logs).values(body)
            .returning({
                createdAt: logs.createdAt,
                itemId: logs.itemId,
                updatedAt: logs.updatedAt,
                logId: logs.logId,
                amount: logs.value
            });

        return res;


    })
});
