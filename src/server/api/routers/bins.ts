import { type inferProcedureOutput } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  getAllProductsUnleashed,
  getVarieties,
  postStockAdjst,
  startRpa,
} from "~/utils/unleashed";
import { type AppRouter } from "../root";
import { prisma } from "~/server/db";
import type { UnleashedStockAdjustmentPost } from "~/utils/interfaces";
import { removePrefix } from "~/lib/utils";
import { UnleashedStatus } from "@prisma/client";

export type BinsGetAllResponse = NonNullable<
  inferProcedureOutput<AppRouter["bins"]["getAll"]>
>;
export type BinsGetByIdResponse = NonNullable<
  inferProcedureOutput<AppRouter["bins"]["getById"]>
>;
export type BinsGetFinishedGoods = NonNullable<
  inferProcedureOutput<AppRouter["bins"]["getFinishedGoodsForBin"]>
>;

export const binsRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(z.object({ startTime: z.date(), endTime: z.date() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.bin.findMany({
        where: {
          createdAt: {
            gte: new Date(
              input.startTime.getFullYear(),
              input.startTime.getMonth(),
              input.startTime.getDate()
            ),
            lte: new Date(
              input.startTime.getFullYear(),
              input.startTime.getMonth(),
              input.startTime.getDate() + 1
            ),
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        include: {
          BinFinishedGoodAssociation: true,
        },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input, ctx }) => {
      return ctx.prisma.bin.findUnique({
        where: {
          id: input.id,
        },
        include: {
          BinFinishedGoodAssociation: true,
          BinBatchAssociation: true,
        },
      });
    }),
  getFinishedGoodsForBin: protectedProcedure
    .input(z.object({ binId: z.string() }))
    .query(({ input, ctx }) => {
      return ctx.prisma.binFinishedGoodAssociation.findMany({
        where: {
          binId: input.binId,
        },
      });
    }),
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(UnleashedStatus),
        lastModifiedOn: z.string().optional(),
        lastModifiedBy: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.id) return;
      const updated = await ctx.prisma.bin.update({
        where: {
          id: input.id,
        },
        data: {
          unleashedStatus: input.status,
          unleashedModifiedBy: input.lastModifiedBy,
          unleashedModifiedOn: input.lastModifiedOn,
        },
      });

      return updated;
    }),
  addBin: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        rawId: z.string(),
        totalBinsUsed: z.number().optional(),
        batchId: z.string(),
        batchLocation: z.string(),
        customBatch: z.string(),

        batchName: z.string().optional(),
        staffCount: z.number(),
        timeStart: z.date(),
        timeFinish: z.date(),
        createdAt: z.date().optional(),
        finishedGoods: z
          .array(
            z.object({
              finishedGoodProductID: z.string(),
              finishedGoodID: z.string(),
              quantity: z.number(),
              comment: z.string().optional(),
            })
          )
          .optional(),
        batches: z
          .array(
            z.object({
              batchId: z.string(),
              batchName: z.string(),
              batchLocation: z.string(),
              quantity: z.number().nullable(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await ctx.prisma.$transaction(async (prisma) => {
        const {
          id,
          rawId,
          totalBinsUsed,
          batchId,
          batchName,
          batchLocation,
          customBatch,
          staffCount,
          timeStart,
          timeFinish,
          createdAt,
          finishedGoods,
          batches,
        } = input;
        const maxBinID = await prisma.bin.aggregate({
          _max: {
            binId: true,
          },
        });
        const newBinID = (maxBinID._max.binId ?? 9999) + 1;
        const bin = await prisma.bin.upsert({
          where: { id: id ?? "" },
          update: {
            rawId,
            totalBinsUsed,
            batchId,
            batchName,
            batchLocation,
            customBatch,
            staffCount,
            timeStart,
            timeFinish,
          },
          create: {
            binId: newBinID,
            rawId,
            totalBinsUsed: totalBinsUsed ?? 0,
            batchId,
            customBatch,
            batchLocation,
            batchName: batchName ?? "",
            staffCount,
            createdAt,
            timeStart,
            timeFinish,
          },
        });

        if (!finishedGoods || finishedGoods.length === 0) {
          await prisma.binFinishedGoodAssociation.deleteMany({
            where: { binId: bin.id },
          });
        } else {
          const existingGoods =
            await prisma.binFinishedGoodAssociation.findMany({
              where: {
                binId: bin.id,
              },
            });

          const finishedGoodsIds = finishedGoods.map(
            (good) => good.finishedGoodID
          );

          const goodsToDelete = existingGoods.filter(
            (good) => !finishedGoodsIds.includes(good.finishedGoodID)
          );

          await prisma.binFinishedGoodAssociation.deleteMany({
            where: {
              id: {
                in: goodsToDelete.map((x) => x.id),
              },
            },
          });

          await Promise.all(
            finishedGoods.map((good) => {
              const existingGood = existingGoods.find(
                (eGood) => eGood.finishedGoodID === good.finishedGoodID
              );

              if (existingGood) {
                return prisma.binFinishedGoodAssociation.update({
                  where: { id: existingGood.id },
                  data: { quantity: good.quantity, comment: good.comment },
                });
              } else {
                return prisma.binFinishedGoodAssociation.create({
                  data: {
                    binId: bin.id,
                    finishedGoodProductID: good.finishedGoodProductID,
                    finishedGoodID: good.finishedGoodID,
                    quantity: good.quantity,
                    comment: good.comment,
                  },
                });
              }
            })
          );
        }
        if (!batches || batches.length === 0) {
          await prisma.binBatchAssociation.deleteMany({
            where: { binId: bin.id },
          });
        } else {
          const existingBatch = await prisma.binBatchAssociation.findMany({
            where: {
              binId: bin.id,
            },
          });

          const batchesIds = batches.map((batch) => batch.batchId);

          const batchesToDelete = existingBatch.filter(
            (batch) => !batchesIds.includes(batch?.batchId)
          );

          await prisma.binBatchAssociation.deleteMany({
            where: {
              id: {
                in: batchesToDelete.map((x) => x.id),
              },
            },
          });

          await Promise.all(
            batches.map((batch) => {
              const existing = existingBatch.find(
                (eBatch) => eBatch.batchId === batch.batchId
              );

              if (existing) {
                return prisma.binBatchAssociation.update({
                  where: { id: existing.id },
                  data: {
                    batchId: batch.batchId,
                    batchLocation: batch.batchLocation,
                    batchName: batch.batchName,
                    quantity: batch.quantity,
                  },
                });
              } else {
                return prisma.binBatchAssociation.create({
                  data: {
                    binId: bin.id,
                    batchId: batch.batchId,
                    batchLocation: batch.batchLocation,
                    batchName: batch.batchName,
                    quantity: batch.quantity,
                  },
                });
              }
            })
          );
        }
        return bin;
      });
    }),
  getVarieties: protectedProcedure.query(async () => {
    return await getVarieties();
  }),
  deleteById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      await ctx.prisma.binFinishedGoodAssociation.deleteMany({
        where: {
          binId: id,
        },
      });
      await ctx.prisma.binBatchAssociation.deleteMany({
        where: {
          binId: id,
        },
      });
      return await ctx.prisma.bin.delete({ where: { id: input.id } });
    }),
  updateCin7Status: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.string().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.bin.update({
        where: {
          id: input.id,
        },
        data: {
          unleashedStatus: input.status,
        },
      });
    }),
  processBin: protectedProcedure
    .input(
      z.object({
        products: z.array(
          z.object({
            ProductID: z.string(),
            type: z.string(),
            BatchSN: z.string(),
            Comment: z.string(),

            Location: z.string(),
            Quantity: z.number(),
            UnitCost: z.number(),
          })
        ),
        id: z.string(),
        binID: z.number(),
        location: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const allProducts = await getAllProductsUnleashed();
      const rawBatchs = await ctx.prisma.binBatchAssociation.findMany({
        where: {
          binId: input.id,
        },
      });
      const batchString = rawBatchs
        .map((obj) => `${obj.batchName}&${obj.quantity}`)
        .join("$");
      const updatedInput = input.products.map((product) => {
        const selectedProduct = allProducts.Items.filter(
          (item) => item.Guid === product.ProductID
        );
        const adjustedUnitCost = selectedProduct[0]?.AverageLandPrice;

        const productCode = selectedProduct[0]?.ProductCode;

        if (productCode) {
          return {
            NewQuantity:
              product.type === "consumed" || product.type === "raw"
                ? `-${product.Quantity}`
                : `+${product.Quantity}`,
            Comments: product.type === "raw" ? batchString : product.Comment,
            Product: { ProductCode: productCode },
            NewActualValue:
              product.type === "raw"
                ? `-${adjustedUnitCost}`
                : adjustedUnitCost,
          };
        }
      });

      const filteredInput = updatedInput.filter(
        (item) => item !== null && item !== undefined
      );
      const location =
        input.location !== "" ? input.location : rawBatchs[0]?.batchLocation;
      const stockPostData = await postStockAdjst(
        filteredInput as UnleashedStockAdjustmentPost[],
        location ?? "",
        "Masters Pack App"
      );

      if (stockPostData) {
        await prisma.bin.update({
          where: { id: input.id },
          data: {
            unleashed: stockPostData.AdjustmentNumber ?? "Failed",
            unleashedId: stockPostData.Guid ?? "Failed",
          },
        });

        void startRpa({
          targetAdjust: +removePrefix(stockPostData.AdjustmentNumber),
        });
      }

      return updatedInput;
    }),
});
