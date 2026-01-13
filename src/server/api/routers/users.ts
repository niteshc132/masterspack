import { Role } from "@prisma/client";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  getRole: protectedProcedure.query(({ ctx }) => {
    return ctx.role ?? Role.GUEST;
  }),
});
