import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";
import { clerkClient } from "@clerk/nextjs/server";
//import ratelimit from "../rateLimiter";
import { users, items, Item, Log  } from '../../../../drizzle/schema';
import { eq } from "drizzle-orm";

interface ReturnedItem extends Omit<Item, 'userId' | 'createdAt'> {
    logs: {
        today?: Log;
        ytd?: Log;
    }
}

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
            with: {
                logs: true
            }
        });

        const itemsWithLog = dataQuery.map(item => {
            const itemLogs = item.logs;

            const body = {
                ...item,
                logs: {}
            } as ReturnedItem;

            if (itemLogs.length > 0) {
                for (const log of item.logs) {
                    if (log.createdAt < todayDate) {
                        body.logs.ytd = log;
                    } else {
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
