import { z } from "zod";
import { TRPCError, type inferProcedureOutput } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  getAllCustomersUnleashed,
  getAllProductsUnleashed,
  getAllShippingCompaniesUnleashed,
  getAllStockAdjustments,
  getCustomerDeliveryAddressUnleashed,
  getOnHandStock,
  getProductStock,
  getSaleOrderByIdUnleashed,
  getSaleOrdersUnleashed,
  getStockAdjustmentUnleashed,
  startRpa,
} from "~/utils/unleashed";
type RouterType = typeof unleashedRouter;

export type UnleashedProductsGetAllResponse = NonNullable<
  inferProcedureOutput<RouterType["getALlProducts"]>
>;
export const unleashedRouter = createTRPCRouter({
  getALlProducts: protectedProcedure.query(async ({}) => {
    const data = await getAllProductsUnleashed();
    return data.Items;
  }),
  getShippingCompanies: protectedProcedure.query(async ({}) => {
    const data = await getAllShippingCompaniesUnleashed();
    return data.Items;
  }),
  getCustomers: protectedProcedure.query(async ({}) => {
    const data = await getAllCustomersUnleashed();
    return data.Items;
  }),
  getStockAdjustments: protectedProcedure.query(async ({}) => {
    const data = await getAllStockAdjustments();
    return data;
  }),

  getStockAdjustmentById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const data = await getStockAdjustmentUnleashed(input.id);
      return data;
    }),
  getCustomerDeliveryAddress: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({}) => {
      const data = await getCustomerDeliveryAddressUnleashed();
      return data.Items;
    }),
  startRpa: protectedProcedure
    .input(
      z.object({
        target: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const target = input.target.toString();
      const existingLog = await ctx.prisma.rpaLog.findFirst({
        where: {
          number: target,
        },
      });

      await ctx.prisma.rpaLog.upsert({
        where: {
          number: target,
        },
        create: {
          number: target,
          attempts: existingLog?.attempts ? existingLog?.attempts + 1 : 1,
        },
        update: {
          number: target,
          attempts: 1,
        },
      });
      void startRpa({
        targetAdjust: input.target,
      });
      return;
    }),
  getProductStockUnleased: protectedProcedure
    .input(
      z.object({ id: z.string().optional(), batch: z.string().optional() })
    )
    .query(async ({ input }) => {
      try {
        const res = await getProductStock(input.id);
        return res;
      } catch (e) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),
  getALlSaleOrders: protectedProcedure.query(async ({}) => {
    const data = await getSaleOrdersUnleashed();
    return data.Items;
  }),
  getOnHandStock: protectedProcedure.query(async ({}) => {
    const data = await getOnHandStock();
    return data.Items;
  }),
  getSaleOrderById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const data = await getSaleOrderByIdUnleashed(input.id);
      return data.Items;
    }),
});
