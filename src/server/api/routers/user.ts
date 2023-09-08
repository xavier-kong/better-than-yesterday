import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";
import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
//import ratelimit from "../rateLimiter";
import { users, items, logs, itemsToLogsRelations } from '../../../../drizzle/schema';
import { eq, between } from "drizzle-orm";

export const userRouter = createTRPCRouter({
    fetchUserData: privateProcedure
    .query(async ({ ctx }) => {
        const userInfoQuery = await ctx.db.select().from(users).where(eq(users.userId, ctx.userId)).limit(1);
        let userInfo = userInfoQuery[0];

        if (!userInfo) {
            const res = await clerkClient.users.getUser(ctx.userId);
            userInfo = {
                userId: ctx.userId,
                name: res.username ?? res.firstName ?? 'User',
                createdAt: new Date(res.createdAt)
            }
            await ctx.db.insert(users).values(userInfo);
        }

        const dataQuery = await ctx.db.query.items.findMany({
            where: eq(items.userId, ctx.userId),
            columns: {
                userId: false,
                createdAt: false,
            },
            with: {
                logs: true,
            }
        });

        return {
            items: dataQuery
        };
    })
});
