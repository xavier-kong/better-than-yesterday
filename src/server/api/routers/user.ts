import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";
import { clerkClient } from "@clerk/nextjs/server";
//import ratelimit from "../rateLimiter";
import { users, items, Item, Log  } from '../../../../drizzle/schema';
import { eq } from "drizzle-orm";
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween)
dayjs.extend(utc);
dayjs.extend(timezone);

interface ReturnedItem extends Omit<Item, 'userId' | 'createdAt'> {
    logs: {
        today?: Log;
        ytd?: Log;
    }
}

export const userRouter = createTRPCRouter({
    fetchUserData: privateProcedure
    .input(z.object({ timezone: z.string() }))
    .query(async ({ ctx, input }) => {
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
                logs: true
            }
        });

        const todayStart = dayjs().tz(input.timezone).hour(0).minute(0).second(0);
        const ytdStart = dayjs(todayStart).subtract(1, 'day')

        const itemsWithLog = dataQuery.map(item => {
            const itemLogs = item.logs;

            const body = {
                ...item,
                logs: {}
            } as ReturnedItem;

            if (itemLogs.length > 0) {
                for (const log of item.logs) {
                    const logDate = dayjs(log.createdAt).tz(input.timezone);
                    if (logDate.isBetween(ytdStart, todayStart, 'ms', '[)')) {
                        body.logs.ytd = log;
                    } else if (logDate.isAfter(todayStart)) {
                        body.logs.today = { ...log };
                    }
                }
            }

            return body;
        })

        return {
            items: itemsWithLog
        };
    })
});
