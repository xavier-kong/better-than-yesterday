import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
//import ratelimit from "../rateLimiter";
import { items } from '../../../../drizzle/schema';
import { eq, and } from "drizzle-orm";

const itemTypes = ['time', 'duration', 'amount', 'consistency'] as const;

export const itemRouter = createTRPCRouter({
    createItem: privateProcedure
    .input(z.object({ itemType: z.enum(itemTypes), itemName: z.string(), direction: z.enum(['increase', 'decrease']) }))
    .mutation(async ({ ctx, input }) => {
        const res = await ctx.db.insert(items).values({
            userId: ctx.userId,
            itemType: input.itemType,
            itemName: input.itemName,
            direction: input.direction,
            createdAt: new Date(),
            deleted: false
        }).returning({ 
            itemId: items.itemId, 
            itemName: items.itemName,
            itemType: items.itemType,
            direction: items.direction 
        });
        return res;
    }),
    fetchItemDetails: privateProcedure
    .input(z.object({ itemId: z.number() }))
    .query(async ({ ctx, input }) => {
        const res = await ctx.db.query.items.findFirst({
            where: (
                and(eq(items.itemId, input.itemId), eq(items.userId, ctx.userId))
            ),
            with: {
                logs: true
            }
        });

        if (!res) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'No item' });
        }

        return res;
    }),
    deleteItem: privateProcedure
    .input(z.object({ itemId: z.number(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
        if (input.userId !== ctx.userId) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Not user' });
        }

        const res = await ctx.db.update(items)
            .set({ deleted: true })
            .where(eq(items.itemId, input.itemId))
            .returning({
                deleted: items.deleted
            });

        return res;
    })
});
