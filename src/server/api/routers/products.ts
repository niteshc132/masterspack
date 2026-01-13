import type { inferProcedureOutput } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  cronJob,
  getAllProductsFromCin7,
  getAllSaleOrdersFromCin7,
  postSalesOrderInvoiceCin7,
} from "~/utils/cin7";
import type { AppRouter } from "../root";

export type Cin7Fulfiment = NonNullable<
  inferProcedureOutput<AppRouter["products"]["getAllFulfilments"]>
>;
export const productsRouter = createTRPCRouter({
  getProductImages: protectedProcedure
    .input(z.object({ productIDs: z.array(z.string()) }))
    .query(({ ctx, input }) => {
      return ctx.prisma.product.findMany({
        where: {
          productID: {
            in: input.productIDs,
          },
        },
      });
    }),
  getAll: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.product.findMany({});
  }),
  upsertProductImage: protectedProcedure
    .input(z.object({ productId: z.string(), imageURL: z.string() }))
    .mutation(({ ctx, input }) => {
      return ctx.prisma.product.upsert({
        where: {
          productID: input.productId,
        },
        update: {
          imageURL: input.imageURL,
        },
        create: {
          productID: input.productId,
          imageURL: input.imageURL,
        },
      });
    }),
  upsertProduct: protectedProcedure
    .input(
      z.array(
        z.object({
          productID: z.string(),
          productDesc: z.string().optional(),
          productCode: z.string().optional(),
          MGcode: z.string().optional(),
          TGcode: z.string().optional(),

          uom: z.string().optional(),
          category: z.string().optional(),
        })
      )
    )
    .mutation(({ ctx, input }) => {
      const upsertPromises = input.map((product) => {
        return ctx.prisma.product.upsert({
          where: {
            productID: product.productID,
          },
          update: {
            productCode: product.productCode,
            productDesc: product.productDesc,
            MGcode: product.MGcode,
            TGcode: product.TGcode,

            uom: product.uom,
            category: product.category,
          },
          create: {
            productID: product.productID,
            productCode: product.productCode,
            productDesc: product.productDesc,
            MGcode: product.MGcode,
            TGcode: product.TGcode,

            uom: product.uom,
            category: product.category,
          },
        });
      });
      return Promise.all(upsertPromises);
    }),

  getAllFromCin7: protectedProcedure.query(async ({ ctx }) => {
    const products = await ctx.prisma.product.findMany();
    const data = await getAllProductsFromCin7();
    const dataImages = data?.Products.map((item) => ({
      ...item,
      imageURL: products.find((x) => x.productID === item.ID)?.imageURL ?? "",
    }));
    return dataImages;
  }),
  getAllSalesOrders: protectedProcedure.query(async () => {
    const data = await getAllSaleOrdersFromCin7();

    return data?.SaleList;
  }),
  runCron: protectedProcedure.query(async () => {
    return await cronJob();
  }),

  getAllFulfilments: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.fulfilments.findMany();
  }),
  getAllUninvoicedFulfilments: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.unInvoicedFulfilments.findMany();
  }),

  postSalesInvoice: protectedProcedure
    .input(
      z.array(
        z.object({
          SaleID: z.string(),
          TaskID: z.string(),
          Status: z.string(),
          InvoiceDate: z.string(),
          InvoiceDueDate: z.string(),
          Memo: z.string(),
          Lines: z.array(
            z.object({
              SKU: z.string(),
              Name: z.string(),
              Quantity: z.number(),
              Price: z.number(),
              Tax: z.number(),
              Total: z.number(),
              TaxRule: z.string(),
              Comment: z.string(),
            })
          ),
        })
      )
    )
    .mutation(async ({ input }) => {
      const results = await Promise.all(
        input.map((saleInvoice) => {
          return postSalesOrderInvoiceCin7(
            saleInvoice.Lines,
            saleInvoice.SaleID,
            saleInvoice.InvoiceDate,
            saleInvoice.InvoiceDueDate,
            saleInvoice.Memo
          );
        })
      );
      return results;
    }),
  getFinishedGood: protectedProcedure
    .input(z.array(z.string()))
    .mutation(({ ctx, input }) => {
      return ctx.prisma.finishedGood.findMany({
        where: {
          id: {
            in: input,
          },
        },
        include: {
          consumedProducts: true,
        },
      });
    }),
  removeProduct: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(({ ctx, input }) => {
      return ctx.prisma.product.delete({
        where: {
          id: input.productId,
        },
      });
    }),
});
