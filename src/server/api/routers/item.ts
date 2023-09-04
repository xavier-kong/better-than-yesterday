import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";
import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
//import ratelimit from "../rateLimiter";
import { users, items, logs } from '../../../../drizzle/schema';
import { eq, between } from "drizzle-orm";

type ItemType = 'time' | 'duration' | 'amount' | 'consistency';

export const itemRouter = createTRPCRouter({
    createItem: privateProcedure
    .input(z.object({ itemType: z.enum(['time', 'duration', 'amount', 'consistency']), itemName: z.string() }))
    .mutation(async ({ ctx, input }) => {
        await ctx.db.insert(items).values({
            userId: ctx.userId,
            itemType: input.itemType,
            itemName: input.itemName,
            createdAt: new Date()
        })
    })
});
