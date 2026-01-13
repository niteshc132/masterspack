import { createTRPCRouter } from "~/server/api/trpc";
import { binsRouter } from "./routers/bins";
import { productsRouter } from "./routers/products";
import { userRouter } from "./routers/users";
import { bomsRouter } from "./routers/boms";
import { unleashedRouter } from "./routers/unleashed";
import { salesOrderRouter } from "./routers/salesorder";
import { dispatchRouter } from "./routers/dispatch";
import { invoiceRouter } from "./routers/invoices";
import { xeroRouter } from "./routers/xero";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  bins: binsRouter,
  dispatch: dispatchRouter,
  salesOrder: salesOrderRouter,
  products: productsRouter,
  users: userRouter,
  boms: bomsRouter,
  unleashed: unleashedRouter,
  invoices: invoiceRouter,
  xero: xeroRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
