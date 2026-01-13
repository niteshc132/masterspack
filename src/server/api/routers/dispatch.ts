import {
  CrateSKU,
  DispatchCustomerType,
  SalesOrderStatus,
  UnleashedStatus,
} from "@prisma/client";
import type { inferProcedureInput, inferProcedureOutput } from "@trpc/server";
import { z } from "zod";
import { removePrefix } from "~/lib/utils";
import { Role } from "@prisma/client";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { prisma } from "~/server/db";
import { type UnleashedStockAdjustmentPost } from "~/utils/interfaces";
import { postStockAdjst, startRpa } from "~/utils/unleashed";
type RouterType = typeof dispatchRouter;

export type DispatchGetByIdResponse = NonNullable<
  inferProcedureOutput<RouterType["getById"]>
>;

export type DispatchGetAllResponse = NonNullable<
  inferProcedureOutput<RouterType["getAll"]>
>;
export type CratesGetAllResponse = NonNullable<
  inferProcedureOutput<RouterType["getAllCrates"]>
>;
export type UpsertDispatchInput = inferProcedureInput<
  RouterType["upsertDispatch"]
>;

export const dispatchRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const userRole = await ctx.prisma.userRoles.findFirst({
      where: {
        clerkId: ctx.userId,
      },
    });

    if (!userRole) return;
    const isAdmin = userRole.role === Role.ADMIN;
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    return ctx.prisma.dispatch.findMany({
      where: isAdmin
        ? {}
        : {
            createdAt: {
              gte: twoDaysAgo,
            },
          },
      include: {
        DispatchLines: {
          include: {
            SalesOrderLines: {
              include: {
                SalesOrder: true,
              },
            },
          },
        },
      },
    });
  }),
  getAllByCustomer: protectedProcedure
    .input(z.object({ customerCode: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.dispatch.findMany({
        where: {
          customerCode: input.customerCode,
        },
        orderBy: {
          id: "desc",
        },
      });
    }),
  getAllCrates: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.crateLines.findMany({
      include: {
        Dispatch: {
          include: {
            DispatchLines: {
              include: {
                SalesOrderLines: true,
              },
            },
          },
        },
      },
    });
  }),
  getAllCustomersWithDispatch: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.dispatch.findMany({
      distinct: ["customerId"],
      select: {
        customerCode: true,
        customerName: true,
        customerId: true,
      },
    });
  }),
  updateId: protectedProcedure
    .input(z.object({ id: z.string(), unleashedId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!input.unleashedId) return;
      const updated = await ctx.prisma.bin.update({
        where: {
          id: input.id,
        },
        data: {
          unleashedId: input.unleashedId,
        },
      });

      return updated;
    }),
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input, ctx }) => {
      return ctx.prisma.dispatch.findUnique({
        where: {
          id: input.id,
        },

        include: {
          CrateLines: true,
          DispatchLines: {
            include: {
              SalesOrderLines: {
                include: {
                  SalesOrder: true,
                },
              },
            },
          },
        },
      });
    }),
  getCrateLinesByDispatch: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input, ctx }) => {
      return ctx.prisma.crateLines.findMany({
        where: {
          dispatchId: input.id,
        },
      });
    }),
  getLinesBySaleOrder: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input, ctx }) => {
      return ctx.prisma.dispatchLines.findMany({
        where: {
          SalesOrderLines: {
            salesOrderId: input.id,
          },
        },
        include: {
          SalesOrderLines: true,
        },
      });
    }),
  getLinesByDispatchId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input, ctx }) => {
      return ctx.prisma.dispatchLines.findMany({
        where: {
          dispatchId: input.id,
        },
        include: {
          SalesOrderLines: true,
        },
      });
    }),
  deleteById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      await ctx.prisma.dispatchLines.deleteMany({
        where: { dispatchId: id },
      });
      return await ctx.prisma.dispatch.delete({ where: { id: input.id } });
    }),
  deleteCrateLineById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return await ctx.prisma.crateLines.delete({ where: { id: input.id } });
    }),
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.nativeEnum(UnleashedStatus),
        lastModifiedOn: z.string().optional(),
        lastModifiedBy: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.id) return;
      const updated = await ctx.prisma.dispatch.update({
        where: {
          id: input.id,
        },
        data: {
          statusUnleashed: input.status,
          unleashedModifiedBy: input.lastModifiedBy,
          unleashedModifiedOn: input.lastModifiedOn,
        },
      });

      return updated;
    }),
  createCrateTrans: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        quantity: z.number(),
        customerCode: z.string().optional(),
        customerName: z.string().optional(),
        customerId: z.string().optional(),
        ref: z.string(),
        date: z.date(),
        sku: z.nativeEnum(CrateSKU),
      })
    )
    .mutation(({ input, ctx }) => {
      const crateLine = ctx.prisma.crateLines.create({
        data: {
          customerCode: input.customerCode ?? "",
          customerName: input.customerName ?? "",
          customerId: input.customerId ?? "",
          sku: input.sku,
          ref: input.ref,
          quantity: input.quantity,
        },
      });
      return crateLine;
    }),
  upsertDispatch: protectedProcedure
    .input(
      z.object({
        id: z.number().optional(),
        shippingCompany: z.string(),
        shippingCompanyId: z.string(),
        customerId: z.string(),
        customerCode: z.string(),
        customerName: z.string(),
        status: z.nativeEnum(SalesOrderStatus),
        customerType: z.nativeEnum(DispatchCustomerType),
        markedDone: z.boolean(),
        shipmentWeight: z.number(),
        trackingNumber: z.string(),
        dispatchDate: z.date(),
        address: z.string(),
        numberOfPackages: z.number(),
        DispatchLines: z.array(
          z.object({
            id: z.string().optional(),
            line: z.number(),
            productCode: z.string(),
            productDescription: z.string(),
            ship: z.number(),
            weight: z.number().optional(),
            salesOrderLineId: z.string(),
            batchNumber: z.string(),
            batchLocation: z.string(),
            sealNumber: z.string().optional(),
            containerNumber: z.string().optional(),
          })
        ),
        CrateLines: z.array(
          z.object({
            id: z.string().optional(),
            quantity: z.number(),
            line: z.number(),
            customerCode: z.string(),
            customerName: z.string(),
            customerId: z.string(),
            ref: z.string(),
            sku: z.nativeEnum(CrateSKU),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const {
        id,
        shippingCompany,
        shippingCompanyId,
        address,
        trackingNumber,
        dispatchDate,
        numberOfPackages,
        status,
        shipmentWeight,
        DispatchLines,
        customerId,
        customerCode,
        customerName,
        customerType,
        CrateLines,
        markedDone,
      } = input;

      if (!id) {
        const dispatch = await ctx.prisma.dispatch.create({
          data: {
            ...input,
            DispatchLines: undefined,
            CrateLines: undefined,
          },
        });

        const dispatchLinesToCreate = DispatchLines.map((line) => ({
          ...line,
          id: undefined,
          dispatchId: dispatch.id,
        }));

        await ctx.prisma.dispatchLines.createMany({
          data: dispatchLinesToCreate,
        });

        for (const line of DispatchLines) {
          await ctx.prisma.salesOrderLines.update({
            where: { id: line.salesOrderLineId },
            data: {
              shipped: { increment: line.ship },
              invoiced: { set: markedDone ? line.ship : 0 },
            },
          });
        }

        const crateLinesToCreate = CrateLines.map((line) => ({
          ...line,
          id: undefined,
          dispatchId: dispatch.id,
        }));
        await ctx.prisma.crateLines.createMany({
          data: crateLinesToCreate,
        });

        return dispatch;
      } else {
        const updatedOrder = await ctx.prisma.dispatch.update({
          where: { id },
          data: {
            shippingCompany,
            customerId,
            trackingNumber,
            dispatchDate,
            numberOfPackages,
            address,
            shipmentWeight,
            customerCode,
            status,
            markedDone,
            shippingCompanyId,
            customerName,
            customerType,
          },
        });
        const existingDispatchLines = await ctx.prisma.dispatchLines.findMany({
          where: { dispatchId: id },
        });
        // const existingDispatchLineIds = existingDispatchLines.map(
        //   (dl) => dl.id
        // );
        const dispatchLinesToDelete = existingDispatchLines.filter(
          (dl) => !DispatchLines.some((inputLine) => inputLine.id === dl.id)
        );
        for (const line of dispatchLinesToDelete) {
          await ctx.prisma.dispatchLines.delete({ where: { id: line.id } });
        }

        if (updatedOrder) {
          for (const line of DispatchLines) {
            const existingDispatchLine =
              await ctx.prisma.dispatchLines.findUnique({
                where: { id: line.id },
              });

            const shipDifference = existingDispatchLine
              ? line.ship - existingDispatchLine.ship
              : line.ship;

            await ctx.prisma.dispatchLines.upsert({
              where: { id: line.id },
              create: {
                line: line.line,
                productCode: line.productCode,
                productDescription: line.productDescription,
                dispatchId: updatedOrder.id,
                ship: line.ship,
                weight: line.weight,

                salesOrderLineId: line.salesOrderLineId,
                batchNumber: line.batchNumber,
                batchLocation: line.batchLocation,
                sealNumber: line.sealNumber,
                containerNumber: line.containerNumber,
              },
              update: {
                line: line.line,
                productCode: line.productCode,
                productDescription: line.productDescription,
                dispatchId: updatedOrder.id,
                ship: line.ship,
                weight: line.weight,

                salesOrderLineId: line.salesOrderLineId,
                batchNumber: line.batchNumber,
                batchLocation: line.batchLocation,
                sealNumber: line.sealNumber,
                containerNumber: line.containerNumber,
              },
            });

            await ctx.prisma.salesOrderLines.update({
              where: { id: line.salesOrderLineId },
              data: {
                shipped: { increment: shipDifference },
                invoiced: { set: markedDone ? line.ship : 0 },
              },
            });
          }

          for (const line of CrateLines) {
            await ctx.prisma.crateLines.upsert({
              where: { id: line.id },
              create: {
                customerCode: line.customerCode,
                customerName: line.customerName,
                customerId: line.customerId,
                sku: line.sku,
                ref: line.ref,
                line: line.line,
                dispatchId: updatedOrder.id,
                quantity: line.quantity,
              },
              update: {
                customerCode: line.customerCode,
                customerName: line.customerName,
                customerId: line.customerId,
                sku: line.sku,
                ref: line.ref,
                line: line.line,

                dispatchId: updatedOrder.id,
                quantity: line.quantity,
              },
            });
          }
        }
      }
    }),
  processDispatch: protectedProcedure
    .input(
      z.object({
        lines: z.array(
          z.object({
            Product: z.object({ ProductCode: z.string() }),
            NewQuantity: z.string(),
            NewActualValue: z.number(),
            Comments: z.string(),
          })
        ),
        id: z.number(),
        location: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const filteredInput = input?.lines?.filter(
        (item) => item !== null && item !== undefined
      );

      const stockPostData = await postStockAdjst(
        filteredInput as UnleashedStockAdjustmentPost[],
        input.location,
        "Dispatch"
      );
      if (stockPostData) {
        await prisma.dispatch.update({
          where: { id: input.id },
          data: {
            unleashed: stockPostData.AdjustmentNumber ?? "Failed",
            unleashedId: stockPostData.Guid ?? "Failed",
            unleashedCreatedBy: stockPostData.CreatedBy,
            unleashedCreatedOn: stockPostData.CreatedOn,
          },
        });

        if (stockPostData.AdjustmentNumber) {
          void startRpa({
            targetAdjust: +removePrefix(stockPostData.AdjustmentNumber) + 1,
          });
        }
      }
    }),
});
