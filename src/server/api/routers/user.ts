import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";
import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
//import ratelimit from "../rateLimiter";
import { users, items, logs, itemsToLogsRelations } from '../../../../drizzle/schema';
import { eq, between, gte, and } from "drizzle-orm";

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

        const ytdDate = (new Date())
        ytdDate.setDate(ytdDate.getDate() - 1)
        ytdDate.setHours(1, 0, 0 ,0);

        const todayDate = new Date();
        todayDate.setHours(1, 0, 0, 0);

        const dataQuery = await ctx.db.query.items.findMany({
            where: eq(items.userId, ctx.userId),
            columns: {
                userId: false,
                createdAt: false,
            },
        });

        // remove this and move with query above once bug resolved
        const itemsWithLog = await Promise.all(dataQuery.map(async item => {
            const itemLogs = await ctx.db.query.logs.findMany({
                where: and(eq(logs.itemId, item.itemId), gte(logs.createdAt, ytdDate))
            })

            const body = {
                ...item,
                logs: {
                    ytd: {},
                    today: {}
                }
            };

            if (itemLogs.length > 0) {
                for (const log of itemLogs) {
                    if (log.createdAt < todayDate) {
                        body.logs.ytd = { ...log };
                    } else {
                        body.logs.today = { ...log };
                    }
                }
            }

            return body;
        }))

        return {
            items: itemsWithLog
        };
    })
});
