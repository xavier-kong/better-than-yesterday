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
        value: z.number().optional(),
        logId: z.number().optional()
    }))
    .mutation(async ({ ctx, input }) => {
        const currDate = new Date();
        if (input.logId) { // updates
            if (!input.value) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Missing logged amount' });
            }

            const body = { updatedAt: currDate, value: input.value } as Log;

            const res = await ctx.db.update(logs)
                .set(body)
                .where(eq(logs.logId, input.logId))
                .returning({ 
                    itemId: logs.itemId,
                    logId: logs.logId,
                    createdAt: logs.createdAt,
                    updatedAt: logs.updatedAt,
                    value: logs.value,
                })

            return res;
        } else { // make new logs
            const body = {
                createdAt: currDate,
                itemId: input.itemId,
                updatedAt: currDate,
            } as Log;

            // no need to handle case where itemType is time since its same as body
            if (input.itemType === 'consistency' || input.itemType === 'amount') {
                body.value = 1;
            } else if (input.itemType === 'duration') {
                if (!input.value) {
                    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Missing logged duration' });
                }

                body.value = input.value;
            }

            const res = await ctx.db
                .insert(logs).values(body)
                .returning({
                    createdAt: logs.createdAt,
                    itemId: logs.itemId,
                    updatedAt: logs.updatedAt,
                    logId: logs.logId,
                    value: logs.value
                });

            return res;
        }
    })
});
