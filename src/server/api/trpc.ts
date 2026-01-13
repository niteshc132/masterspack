import { TRPCError, initTRPC } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import superjson from "superjson";
import { ZodError } from "zod";
import { prisma } from "~/server/db";
import { getAuth } from "@clerk/nextjs/server";
import { Role } from "@prisma/client";

interface CreateContextOptions {
  userId?: string;
  role: Role;
}

const createInnerTRPCContext = (_opts: CreateContextOptions) => {
  return {
    prisma,
    userId: _opts.userId,
    role: _opts.role,
  };
};

export const createTRPCContext = async (_opts: CreateNextContextOptions) => {
  const { req } = _opts;

  const session = getAuth(req);

  if (session.userId) {
    const role = await prisma.userRoles.findUnique({
      where: {
        clerkId: session.userId,
      },
    });
    if (role) {
      return createInnerTRPCContext({
        userId: session.userId,
        role: role.role,
      });
    }
    return createInnerTRPCContext({
      userId: session.userId,
      role: Role.GUEST,
    });
  }
  return createInnerTRPCContext({
    userId: undefined,
    role: Role.GUEST,
  });
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;

export const publicProcedure = t.procedure;

const isAuthed = t.middleware(({ next, ctx }) => {
  console.log("ctx.userId: ", ctx.userId);
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      userId: ctx.userId,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);
