import { Role, SalesOrderStatus, Warehouse } from "@prisma/client";
import type { inferProcedureOutput } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
type RouterType = typeof salesOrderRouter;

export type SalesOrderGetByIdResponse = NonNullable<
  inferProcedureOutput<RouterType["getById"]>
>;
export type SalesOrderGetAllResponse = NonNullable<
  inferProcedureOutput<RouterType["getAll"]>
>;

export const salesOrderRouter = createTRPCRouter({
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

    return ctx.prisma.salesOrder.findMany({
      where: isAdmin
        ? {}
        : {
            createdAt: {
              gte: twoDaysAgo,
            },
          },
      include: {
        SalesOrderLines: { include: { DispatchLines: true } },
      },
    });
  }),
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const salesOrder = await ctx.prisma.salesOrder.findUnique({
        where: {
          id: input.id,
        },

        include: {
          SalesOrderLines: {
            include: { DispatchLines: { include: { InvoiceLines: true } } },
          },
        },
      });

      if (salesOrder?.SalesOrderLines)
        for (const line of salesOrder.SalesOrderLines) {
          let totalShipped = 0;
          let totalInvoiced = 0;

          for (const dispatchLine of line.DispatchLines) {
            totalShipped += dispatchLine.ship;

            if (dispatchLine.InvoiceLines)
              for (const invoiceLine of dispatchLine.InvoiceLines) {
                totalInvoiced += invoiceLine.quantity;
              }
          }

          await ctx.prisma.salesOrderLines.update({
            where: { id: line.id },
            data: {
              shipped: totalShipped,
              invoiced: totalInvoiced,
            },
          });
        }

      const updatedSalesOrder = await ctx.prisma.salesOrder.findUnique({
        where: {
          id: input.id,
        },

        include: {
          SalesOrderLines: {
            include: { DispatchLines: { include: { InvoiceLines: true } } },
          },
        },
      });

      return updatedSalesOrder;
    }),
  deleteById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      // const lines = await ctx.prisma.salesOrderLines.findMany({
      //   where: { salesOrderId: id },
      //   select: { id: true },
      // });
      // const lineIds = lines.map((ln) => +ln.id);

      await ctx.prisma.salesOrderLines.deleteMany({
        where: { salesOrderId: id },
      });

      return await ctx.prisma.salesOrder.delete({ where: { id: input.id } });
    }),

  upsertSaleOrder: protectedProcedure
    .input(
      z.object({
        id: z.number().optional(),
        customerCode: z.string(),
        customerName: z.string(),
        customerId: z.string(),
        address: z.string().optional(),
        status: z.nativeEnum(SalesOrderStatus),
        customerRef: z.string(),
        packToOrder: z.boolean(),

        warehouse: z.nativeEnum(Warehouse),
        deliveryAddress: z.string(),
        orderDate: z.date(),
        requiredDate: z.date(),
        salesOrderLines: z.array(
          z.object({
            id: z.string().optional(),
            line: z.number(),
            productCode: z.string(),
            productDescription: z.string(),
            packToOrderBomId: z.string().optional().nullable(),
            packToOrderBomProductCode: z.string().optional().nullable(),
            quantity: z.number(),
            shipped: z.number(),
            invoiced: z.number(),
            unitPrice: z.number(),
            unit: z.string(),
            comments: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const {
        id,
        customerCode,
        customerId,
        customerName,
        customerRef,
        packToOrder,
        warehouse,
        deliveryAddress,
        orderDate,
        requiredDate,
        salesOrderLines,
        status,
        address,
      } = input;

      if (!id) {
        const salesOrder = await ctx.prisma.salesOrder.create({
          data: {
            customerId,
            customerCode,
            customerName,
            customerRef: customerRef ?? "",
            warehouse,
            packToOrder,
            deliveryAddress,
            orderDate,
            requiredDate,
            status,
            address,
          },
        });

        for (const line of salesOrderLines) {
          await ctx.prisma.salesOrderLines.create({
            data: {
              line: line.line,
              unit: line.unit,
              comments: line.comments,
              productCode: line.productCode,
              productDescription: line.productDescription,
              packToOrderBomId: line.packToOrderBomId ?? null,
              packToOrderBomProductCode: line.packToOrderBomProductCode ?? null,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              SalesOrder: {
                connect: { id: salesOrder.id },
              },
            },
          });
        }
        return salesOrder;
      } else {
        const updatedOrder = await ctx.prisma.salesOrder.update({
          where: { id },
          data: {
            customerId,
            customerCode,
            customerName,
            customerRef: customerRef ?? "",
            warehouse,
            packToOrder,
            address,
            deliveryAddress,
            orderDate,
            requiredDate,
            status,
          },
        });
        const existingSalesOrderLines =
          await ctx.prisma.salesOrderLines.findMany({
            where: { salesOrderId: id },
          });

        const orderLinesToDelete = existingSalesOrderLines.filter(
          (dl) => !salesOrderLines.some((inputLine) => inputLine.id === dl.id)
        );

        for (const line of orderLinesToDelete) {
          await ctx.prisma.salesOrderLines.delete({ where: { id: line.id } });
        }

        if (updatedOrder) {
          for (const line of salesOrderLines) {
            await ctx.prisma.salesOrderLines.upsert({
              where: { id: line.id },
              create: {
                line: line.line,
                unit: line.unit,
                comments: line.comments,
                productCode: line.productCode,
                productDescription: line.productDescription,
                packToOrderBomId: line.packToOrderBomId ?? null,
                packToOrderBomProductCode:
                  line.packToOrderBomProductCode ?? null,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                SalesOrder: {
                  connect: { id: updatedOrder.id },
                },
              },
              update: {
                line: line.line,
                unit: line.unit,
                comments: line.comments,
                productCode: line.productCode,
                productDescription: line.productDescription,
                packToOrderBomId: line.packToOrderBomId ?? null,
                packToOrderBomProductCode:
                  line.packToOrderBomProductCode ?? null,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                SalesOrder: {
                  connect: { id: updatedOrder.id },
                },
              },
            });
          }
        }
      }
    }),
});
