import { TRPCError } from "@trpc/server";
import type { inferProcedureInput, inferProcedureOutput } from "@trpc/server";
import { z } from "zod";
import { getAllProductsFromCin7, getProductStockFromCin7 } from "~/utils/cin7";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

type RouterType = typeof bomsRouter;

export type BomsGetByIdResponse = NonNullable<
  inferProcedureOutput<RouterType["getById"]>
>;
export type BomsGetAllResponse = NonNullable<
  inferProcedureOutput<RouterType["getAll"]>
>;
export type BomsUpsertInput = NonNullable<
  inferProcedureInput<RouterType["upsertBom"]>
>;

export type FinishedGood = BomsGetByIdResponse["finishedGoods"][number];
export type ConsumedProduct = FinishedGood["consumedProducts"][number];

export const bomsRouter = createTRPCRouter({
  getAll: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.bom.findMany({
      include: {
        finishedGoods: true,
      },
    });
  }),
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input, ctx }) => {
      return ctx.prisma.bom.findUnique({
        where: {
          id: input.id,
        },
        include: {
          finishedGoods: {
            include: {
              consumedProducts: true,
            },
            orderBy: {
              order: "asc",
            },
          },
        },
      });
    }),

  deleteById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;

      const finishedGoods = await ctx.prisma.finishedGood.findMany({
        where: { bomId: id },
        select: { id: true },
      });

      const finishedGoodIds = finishedGoods.map((fg) => fg.id);

      await ctx.prisma.consumedProduct.deleteMany({
        where: { finishedGoodId: { in: finishedGoodIds } },
      });
      await ctx.prisma.binFinishedGoodAssociation.deleteMany({
        where: { finishedGoodID: { in: finishedGoodIds } },
      });
      await ctx.prisma.finishedGood.deleteMany({ where: { bomId: id } });

      return await ctx.prisma.bom.delete({ where: { id } });
    }),

  getAllProductsCin7: protectedProcedure.query(async () => {
    try {
      const res = await getAllProductsFromCin7();
      return res;
    } catch (e) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }
  }),

  getProductStockCin7: protectedProcedure
    .input(z.object({ id: z.string(), batch: z.string().optional() }))
    .query(async ({ input }) => {
      try {
        const res = await getProductStockFromCin7(input.id, input.batch);
        return res;
      } catch (e) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  upsertBom: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        rawId: z.string(),
        productCode: z.string(),
        name: z.string().nullable(),
        quantity: z.number(),
        finishedGoods: z.array(
          z.object({
            id: z.string().optional(),
            productId: z.string(),
            productCode: z.string(),

            quantity: z.number(),
            consumedProducts: z.array(
              z.object({
                id: z.string().optional(),
                productId: z.string(),
                productCode: z.string(),

                quantity: z.number(),
              })
            ),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, finishedGoods, rawId, name, quantity, productCode } = input;

      return await ctx.prisma.$transaction(async (tx) => {
        if (!id) {
          return tx.bom.create({
            data: {
              rawId,
              productCode,
              name,
              quantity,
              finishedGoods: {
                create: finishedGoods.map(
                  (
                    { productId, quantity, consumedProducts, productCode },
                    idx
                  ) => ({
                    productId,
                    productCode,
                    quantity,
                    consumedProducts: {
                      create: consumedProducts,
                    },
                    order: idx + 1,
                  })
                ),
              },
            },
          });
        }

        const updatedBom = await tx.bom.update({
          where: { id },
          data: { rawId, name, quantity, productCode },
        });
        const currentFinishedGoods = await tx.finishedGood.findMany({
          where: { bomId: id },
        });

        const inputFinishedGoodIds = finishedGoods
          .map((fg) => fg.id)
          .filter(Boolean); // Filter out undefined

        const finishedGoodsToDelete = currentFinishedGoods.filter(
          (fg) => !inputFinishedGoodIds.includes(fg.id)
        );

        await Promise.all(
          finishedGoodsToDelete.map((fg) =>
            tx.finishedGood.delete({ where: { id: fg.id } })
          )
        );

        // in 3 batches execute finishedgoods, consumedgoods upserts, consumedgood delete
        // can be improved to run in parallel but there were issues in nested promises
        // step 1: upsertFinishedGoods in a batch
        const upsertFinishedGoodResults = await Promise.all(
          finishedGoods.map(
            ({ id: fgId, productId, productCode, quantity }, idx) =>
              tx.finishedGood.upsert({
                where: { id: fgId ?? "" },
                update: { productId, productCode, quantity, order: idx + 1 },
                create: {
                  productId,
                  productCode,
                  quantity,
                  bomId: id ?? "",
                  order: idx + 1,
                },
                include: {
                  consumedProducts: true,
                },
              })
          )
        );

        // step 2: map upsertFinishedGoodResults to for consumed product upserts
        const upsertConsumedProductPromises = upsertFinishedGoodResults.flatMap(
          (upsertedFinishedGood, idx) => {
            // check that the finishedGoods element at idx is not undefined
            const finishedGood = finishedGoods[idx];
            if (!finishedGood) {
              // this should never happen
              throw new Error(`Finished good at index ${idx} is undefined`);
            }
            return finishedGood.consumedProducts.map(
              ({ id: cpId, productId, productCode, quantity }) =>
                tx.consumedProduct.upsert({
                  where: { id: cpId ?? "" },
                  update: {
                    finishedGoodId: upsertedFinishedGood.id,
                    productId,
                    productCode,
                    quantity,
                  },
                  create: {
                    finishedGoodId: upsertedFinishedGood.id,
                    productId,
                    productCode,
                    quantity,
                  },
                })
            );
          }
        );

        // execute all consumedgoods upserts in a batch
        await Promise.all(upsertConsumedProductPromises);

        // step 3: all consumedgoods deletes in one batch
        const deletePromises = upsertFinishedGoodResults.flatMap(
          (upsertedFinishedGood, idx) => {
            // check shouldnt fail
            const finishedGood = finishedGoods[idx];
            if (!finishedGood) {
              return [];
            }

            const listOfActualConsumedProductIds = new Set(
              finishedGood.consumedProducts.map((p) => p.id)
            );
            return upsertedFinishedGood.consumedProducts
              .filter((p) => !listOfActualConsumedProductIds.has(p.id))
              .map((p) =>
                tx.consumedProduct.delete({
                  where: { id: p.id },
                })
              );
          }
        );

        // exec all deletes in a batch
        await Promise.all(deletePromises);

        return updatedBom;
      });
    }),
});
