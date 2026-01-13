import { type inferProcedureOutput } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
type RouterType = typeof invoiceRouter;

export type InvoiceGetByIdResponse = NonNullable<
  inferProcedureOutput<RouterType["getById"]>
>;

export type InvoiceGetAllResponse = NonNullable<
  inferProcedureOutput<RouterType["getAll"]>
>;

export const invoiceRouter = createTRPCRouter({
  getAll: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.invoice.findMany({
      include: {
        InvoiceLines: true,
      },
    });
  }),
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input, ctx }) => {
      return ctx.prisma.invoice.findUnique({
        where: {
          id: input.id,
        },

        include: {
          InvoiceLines: {
            include: {
              DispatchLines: {
                include: {
                  SalesOrderLines: true,
                },
              },
              SalesOrderLines: true,
            },
          },
        },
      });
    }),
  getLinesBySaleOrder: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input, ctx }) => {
      return ctx.prisma.salesOrderLines.findMany({
        where: {
          salesOrderId: input.id,
        },
        include: {
          DispatchLines: true,
        },
      });
    }),

  deleteById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input, ctx }) => {
      return ctx.prisma.invoice.delete({ where: { id: input.id } });
    }),
  upsertInvoice: protectedProcedure
    .input(
      z.object({
        id: z.number().optional(),

        customerId: z.string(),
        customerCode: z.string(),
        customerName: z.string(),
        billingAddress: z.string(),
        invoiceDate: z.date(),
        dueDate: z.date(),
        paymentTerms: z.string(),
        MGInvoice: z.string().optional().nullable(),
        TGInvoice: z.string().optional().nullable(),

        InvoiceLines: z.array(
          z.object({
            id: z.string().optional(),
            line: z.number(),
            ordered: z.number(),
            quantity: z.number(),
            productId: z.string().nullable(),
            productCode: z.string().nullable(),
            MGCode: z.string().nullable(),
            TGCode: z.string().nullable(),
            accountCode: z.string().nullable(),

            TGDivision: z.string().nullable(),
            productDesc: z.string().nullable(),
            unitPrice: z.number(),
            invoiceId: z.number(),
            dispatchLineId: z.string().nullable(),
            salesOrderLineId: z.string().nullable(),
            unmatchedSalesOrderId: z.string().nullable().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const {
        id,
        invoiceDate,
        InvoiceLines,
        billingAddress,
        customerId,
        customerCode,
        customerName,
        dueDate,
        paymentTerms,
        MGInvoice,
        TGInvoice,
      } = input;
      if (!id) {
        const invoice = await ctx.prisma.invoice.create({
          data: {
            customerId,
            billingAddress,
            customerCode,
            invoiceDate,
            customerName,
            dueDate,
            paymentTerms,
            MGInvoice,
            TGInvoice,
          },
        });
        const invoiceLinesData = InvoiceLines.map((line) => ({
          line: line.line,
          quantity: line.quantity,
          ordered: line.ordered,
          productCode: line.productCode ?? null,
          MGCode: line.MGCode ?? null,
          TGCode: line.TGCode ?? null,
          TGDivision: line.TGDivision ?? null,
          accountCode: line.accountCode ?? null,

          productDesc: line.productDesc ?? null,
          productId: line.productId ?? null,
          unitPrice: line.unitPrice,
          invoiceId: invoice.id,
          dispatchLineId: line.dispatchLineId,
          salesOrderLineId: line.salesOrderLineId ?? null,
          unmatchedSalesOrderId: line.unmatchedSalesOrderId ?? null,
        }));

        await ctx.prisma.invoiceLines.createMany({
          data: invoiceLinesData,
        });

        for (const line of InvoiceLines) {
          if (line.dispatchLineId) {
            const salesOrderLines = await ctx.prisma.salesOrderLines.findMany({
              where: {
                DispatchLines: { some: { id: line.dispatchLineId } },
              },
            });

            for (const salesOrderLine of salesOrderLines) {
              await ctx.prisma.salesOrderLines.update({
                where: { id: salesOrderLine.id },
                data: { invoiced: { increment: line.quantity } },
              });
            }
          }
        }

        return invoice;
      } else {
        const updatedOrder = await ctx.prisma.invoice.update({
          where: { id },
          data: {
            customerId,
            billingAddress,
            customerCode,
            invoiceDate,
            customerName,
            dueDate,
            paymentTerms,
            MGInvoice,
            TGInvoice,
          },
        });
        const currentInvoiceLines = await ctx.prisma.invoiceLines.findMany({
          where: { invoiceId: updatedOrder.id },
        });
        const updatedLineIds = InvoiceLines.map((line) => line.id);
        const linesToDelete = currentInvoiceLines.filter(
          (line) => !updatedLineIds.includes(line.id)
        );
        for (const line of linesToDelete) {
          await ctx.prisma.invoiceLines.delete({
            where: { id: line.id },
          });
        }
        if (updatedOrder) {
          for (const line of InvoiceLines) {
            const existingDispatchLine =
              await ctx.prisma.invoiceLines.findUnique({
                where: { id: line.id },
              });

            const shipDifference = existingDispatchLine
              ? line.quantity - existingDispatchLine.quantity
              : line.quantity;

            await ctx.prisma.invoiceLines.upsert({
              where: { id: line.id },
              create: {
                line: line.line,
                quantity: line.quantity,
                ordered: line.ordered,
                unitPrice: line.unitPrice,
                productCode: line.productCode ?? null,
                MGCode: line.MGCode ?? null,
                TGCode: line.MGCode ?? null,
                productDesc: line.productDesc ?? null,
                productId: line.productId ?? null,
                unmatchedSalesOrderId: line.unmatchedSalesOrderId ?? null,

                invoiceId: updatedOrder.id,
                dispatchLineId: line.dispatchLineId,
                salesOrderLineId: line.salesOrderLineId ?? null,
              },
              update: {
                line: line.line,
                quantity: line.quantity,
                ordered: line.ordered,
                unitPrice: line.unitPrice,
                productCode: line.productCode ?? null,
                MGCode: line.MGCode ?? null,
                TGCode: line.MGCode ?? null,
                productDesc: line.productDesc ?? null,
                productId: line.productId ?? null,
                unmatchedSalesOrderId: line.unmatchedSalesOrderId ?? null,

                invoiceId: updatedOrder.id,
                dispatchLineId: line.dispatchLineId,
                salesOrderLineId: line.salesOrderLineId ?? null,
              },
            });

            if (line.dispatchLineId) {
              const salesOrderLines = await ctx.prisma.salesOrderLines.findMany(
                {
                  where: {
                    DispatchLines: { some: { id: line.dispatchLineId } },
                  },
                }
              );

              for (const salesOrderLine of salesOrderLines) {
                await ctx.prisma.salesOrderLines.update({
                  where: { id: salesOrderLine.id },
                  data: { invoiced: { increment: shipDifference } },
                });
              }
            }
          }
        }
      }
    }),
});
