import { TRPCError } from "@trpc/server";
import { env } from "~/env.mjs";
import type {
  Cin7ProductsApiResponse,
  Cin7SalesInvoicePost,
  Cin7SalesOrderByID,
  Cin7SalesOrderResponse,
  Cin7StockAdjustmentPost,
  Cin7StockResponse,
} from "~/utils/interfaces";
import { prisma } from "~/server/db";

const header = {
  "api-auth-applicationkey": env.CIN7_API_KEY,
  "api-auth-accountid": env.CIN7_API_ID,
};
export const getAllProductsFromCin7 =
  async (): Promise<Cin7ProductsApiResponse | null> => {
    const apiUrl = `
    https://inventory.dearsystems.com/ExternalApi/v2/product?Page=1&Limit=1000`;

    const options = {
      method: "GET",
      headers: header,
    };
    try {
      const response = await fetch(apiUrl, options);
      if (response.ok) {
        return (await response.json()) as Cin7ProductsApiResponse;
      } else {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error while fetching from Cin7",
          cause: response.statusText,
        });
      }
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error while fetching from Cin7",
        cause: error,
      });
    }
  };
export const getAllSaleOrdersFromCin7 =
  async (): Promise<Cin7SalesOrderResponse | null> => {
    const apiUrl = `
    https://inventory.dearsystems.com/ExternalApi/v2/saleList?Page=1&Limit=Limit&Search=&CreatedSince=&UpdatedSince=&ShipBy=&QuoteStatus=&OrderStatus=&CombinedPickStatus=&CombinedPackStatus=&CombinedShippingStatus=&CombinedInvoiceStatus=&CreditNoteStatus=&ExternalID=&Status=&ReadyForShipping=&OrderLocationID=`;

    const options = {
      method: "GET",
      headers: header,
    };
    try {
      const response = await fetch(apiUrl, options);
      if (response.ok) {
        return (await response.json()) as Cin7SalesOrderResponse;
      } else {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error while fetching from Cin7",
          cause: response.statusText,
        });
      }
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error while fetching from Cin7",
        cause: error,
      });
    }
  };

export const getSaleOrderFromCin7 = async (
  id: string
): Promise<Cin7SalesOrderByID | null> => {
  const apiUrl = `https://inventory.dearsystems.com/ExternalApi/v2/sale?ID=${id}&CombineAdditionalCharges=true&IncludeTransactions=true`;

  const options = {
    method: "GET",
    headers: header,
  };
  try {
    const response = await fetch(apiUrl, options);
    if (response.ok) {
      return (await response.json()) as Cin7SalesOrderByID;
    } else {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error while fetching from Cin7",
        cause: response.statusText,
      });
    }
  } catch (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error while fetching from Cin7",
      cause: error,
    });
  }
};
export const getProductStockFromCin7 = async (
  id: string,
  batch?: string
): Promise<Cin7StockResponse | null> => {
  const apiUrl = batch
    ? `
    https://inventory.dearsystems.com/ExternalApi/v2/ref/productavailability?Page=1&Limit=100&ID=${id}&Batch=${batch}`
    : `
    https://inventory.dearsystems.com/ExternalApi/v2/ref/productavailability?Page=1&Limit=100&ID=${id}`;

  const options = {
    method: "GET",
    headers: header,
  };
  try {
    const response = await fetch(apiUrl, options);
    if (response.ok) {
      return (await response.json()) as Cin7StockResponse;
    } else {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error while fetching from Cin7",
        cause: response.statusText,
      });
    }
  } catch (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error while fetching from Cin7",
      cause: error,
    });
  }
};

export const getProductFromCin7 = async (
  id: string
): Promise<Cin7ProductsApiResponse | null> => {
  const apiUrl = `
    https://inventory.dearsystems.com/ExternalApi/v2/product?Page=1&Limit=100&ID=${id}`;

  const options = {
    method: "GET",
    headers: {
      "api-auth-applicationkey": env.CIN7_API_KEY,
      "api-auth-accountid": env.CIN7_API_ID,
    },
  };
  try {
    const response = await fetch(apiUrl, options);
    if (response.ok) {
      return (await response.json()) as Cin7ProductsApiResponse;
    } else {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error while fetching from Cin7",
        cause: response.statusText,
      });
    }
  } catch (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error while fetching from Cin7",
      cause: error,
    });
  }
};

export const postStockAdjstCin7 = async (
  input: Cin7StockAdjustmentPost[],
  id: string,
  binID: number
): Promise<number> => {
  const apiUrl = `https://inventory.dearsystems.com/ExternalApi/v2/stockadjustment`;
  const currentDate = new Date();
  const timezoneOffset = currentDate.getTimezoneOffset() * 60000;
  const localDate = new Date(currentDate.getTime() - timezoneOffset);

  const effectiveDate = localDate.toISOString().split("T")[0];
  const reqData = JSON.stringify({
    EffectiveDate: effectiveDate,
    Reference: binID.toString(),
    Status: "COMPLETED",
    Lines: input,
  });
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-auth-applicationkey": env.CIN7_API_KEY,
      "api-auth-accountid": env.CIN7_API_ID,
    },
    body: reqData,
  };
  const response = await fetch(apiUrl, options);
  if (response.ok) {
    return response.status;
  } else {
    const error = (await response.json()) as [{ Exception: string }];
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error[0].Exception,
      cause: response.statusText,
    });
  }
};
export const postInvtWriteOffCin7 = async (
  input: Cin7StockAdjustmentPost[],
  id: string,
  binID: number,
  location: string
): Promise<number> => {
  const apiUrl = `https://inventory.dearsystems.com/ExternalApi/v2/inventoryWriteOff`;
  const currentDate = new Date();
  const timezoneOffset = currentDate.getTimezoneOffset() * 60000;
  const localDate = new Date(currentDate.getTime() - timezoneOffset);

  const effectiveDate = localDate.toISOString().split("T")[0];

  const reqData = JSON.stringify({
    Notes: binID.toString(),
    EffectiveDate: effectiveDate,
    Location: location,
    Account: "2000",
    Status: "COMPLETED",
    Lines: input,
  });

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-auth-applicationkey": env.CIN7_API_KEY,
      "api-auth-accountid": env.CIN7_API_ID,
    },
    body: reqData,
  };

  const response = await fetch(apiUrl, options);
  if (response.ok) {
    return response.status;
  } else {
    const error = (await response.json()) as [{ Exception: string }];
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error[0].Exception,
      cause: response.statusText,
    });
  }
};
export const postSalesOrderInvoiceCin7 = async (
  input: Cin7SalesInvoicePost[],
  SaleID: string,
  InvoiceDate: string,
  InvoiceDueDate: string,
  Memo: string
): Promise<number> => {
  const apiUrl = `https://inventory.dearsystems.com/ExternalApi/v2/sale/invoice`;
  const convertDateToISO = (dateString: string) => {
    const parts = dateString.split("/");
    const day = parts[0];
    const month = parts[1];
    const year = parts[2];
    return `${year}-${month}-${day}T00:00:00`;
  };
  const reqData = JSON.stringify({
    SaleID: SaleID,
    TaskID: "00000000-0000-0000-0000-000000000000",
    InvoiceDate: convertDateToISO(InvoiceDate),
    InvoiceDueDate: convertDateToISO(InvoiceDueDate),
    Status: "AUTHORISED",
    Lines: input,
    Memo: Memo,
  });

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-auth-applicationkey": env.CIN7_API_KEY,
      "api-auth-accountid": env.CIN7_API_ID,
    },
    body: reqData,
  };
  const response = await fetch(apiUrl, options);
  if (response.ok) {
    return response.status;
  } else {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error while posting to Cin7",
      cause: response.statusText,
    });
  }
};
export const cronJob = async () => {
  const allSalesOrdersResponse = await getAllSaleOrdersFromCin7();

  if (allSalesOrdersResponse?.SaleList) {
    const salesDataPromises = [];
    const upsertPromises: unknown[] = [];
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    for (let i = 0; i < allSalesOrdersResponse.SaleList.length; i++) {
      const saleID = allSalesOrdersResponse?.SaleList[i]?.SaleID;

      if (saleID) salesDataPromises.push(getSaleOrderFromCin7(saleID));

      if ((i + 1) % 3 === 0) {
        await delay(1000);
      }
    }

    const salesData = await Promise.all(salesDataPromises);

    salesData.forEach((sale) => {
      const fulfilledQuantities = new Map();

      if (sale?.Fulfilments && sale.Fulfilments.length > 0) {
        sale.Fulfilments.forEach((fulfilment) => {
          if (fulfilment.Pack.Status === "AUTHORISED") {
            fulfilment.Pack.Lines.forEach((packLine) => {
              const currentQuantity =
                (fulfilledQuantities.get(packLine.ProductID) as number) || 0;
              fulfilledQuantities.set(
                packLine.ProductID,
                currentQuantity + packLine.Quantity
              );
            });
          }
        });
      }

      sale?.Order.Lines.forEach((orderLine) => {
        const totalFulfilledQuantity =
          (fulfilledQuantities.get(orderLine.ProductID) as number) || 0;

        if (
          totalFulfilledQuantity < orderLine.Quantity ||
          !fulfilledQuantities.has(orderLine.ProductID)
        ) {
          const { ProductID, SKU, Name } = orderLine;

          upsertPromises.push(
            prisma.fulfilments.upsert({
              where: {
                SaleOrderNumber_ProductID: {
                  SaleOrderNumber: sale.Order.SaleOrderNumber,
                  ProductID,
                },
              },
              update: {
                SKU,
                Quantity: totalFulfilledQuantity,
                SaleOrderQuantity: orderLine.Quantity,
                SaleOrderDate: sale.SaleOrderDate,
              },
              create: {
                SaleID: sale.SaleID,
                SaleOrderNumber: sale.Order.SaleOrderNumber,
                Customer: sale.Customer,
                SaleOrderDate: sale.SaleOrderDate,
                FulfillmentNumber: 0, // Assuming 0 for unfulfilled orders
                ProductID,
                SKU,
                Name,
                Quantity: totalFulfilledQuantity,
                SaleOrderQuantity: orderLine.Quantity,
              },
            })
          );
        }
      });
    });

    salesData.forEach((sale) => {
      const invoicedProducts = new Map();
      sale?.Invoices?.forEach((invoice) => {
        if (invoice.Status === "AUTHORISED" || "COMPLETED") {
          invoice.Lines.forEach((line) => {
            const key = `${line.ProductID}`;
            const currentQuantity = (invoicedProducts.get(key) as number) || 0;
            invoicedProducts.set(key, currentQuantity + line.Quantity);
          });
        }
      });

      if (sale?.Fulfilments && sale.Fulfilments.length > 0) {
        sale.Fulfilments.forEach((fulfilment) => {
          if (fulfilment.Pack.Status === "AUTHORISED") {
            fulfilment.Pack.Lines.forEach((line) => {
              const { ProductID, Quantity, SKU, Name } = line;
              const invoicedQuantity =
                (invoicedProducts.get(ProductID) as number) || 0;

              const uninvoicedQuantity = Quantity - invoicedQuantity;

              if (uninvoicedQuantity > 0) {
                upsertPromises.push(
                  prisma.unInvoicedFulfilments.upsert({
                    where: {
                      SaleOrderNumber_ProductID_FulfillmentNumber: {
                        SaleOrderNumber: sale.Order.SaleOrderNumber,
                        ProductID,
                        FulfillmentNumber: fulfilment.FulfillmentNumber,
                      },
                    },
                    update: {
                      SKU,
                      Quantity: Quantity,
                      UninvoicedQuantity: uninvoicedQuantity,
                      SaleOrderDate: sale.SaleOrderDate,
                      Customer: sale.Customer,
                    },
                    create: {
                      SaleID: sale.SaleID,
                      SaleOrderNumber: sale.Order.SaleOrderNumber,
                      FulfillmentNumber: fulfilment.FulfillmentNumber,
                      ProductID,
                      SKU,
                      SaleOrderDate: sale.SaleOrderDate,
                      Customer: sale.Customer,
                      Name,
                      Quantity: Quantity,
                      UninvoicedQuantity: uninvoicedQuantity,
                    },
                  })
                );
              }

              if (invoicedQuantity > 0) {
                invoicedProducts.set(
                  ProductID,
                  Math.max(invoicedQuantity - Quantity, 0)
                );
              }
            });
          }
        });
      }
    });

    await Promise.all(upsertPromises);
  } else {
    return;
  }
};
