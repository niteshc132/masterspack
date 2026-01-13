import { Role } from "@prisma/client";
import { prisma } from "~/server/db";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import {
  XeroClient,
  type Contact,
  type LineItem,
  Invoice,
  type Invoices,
} from "xero-node";

import { type TokenSet } from "openid-client";
import { getAllProductsUnleashed } from "~/utils/unleashed";

const client_id = "E88E8E4D43AB44098D22D1276F6AB646";
const client_secret = "N-4hMu4vnRiQGXJUpQC-2JNKsVFqzGnSICMHdOX5u3b9HOyg";
const redirectUrl = "https://www.masterspack.com/invoices";

const xero_tenant = "99cb871c-a3d8-4631-ad52-dfe903300708";

const scopes =
  "openid profile email accounting.settings accounting.reports.read accounting.journals.read accounting.contacts accounting.attachments accounting.transactions offline_access";

const xero = new XeroClient({
  clientId: client_id ?? "",
  clientSecret: client_secret ?? "",
  redirectUris: [redirectUrl ?? ""],
  scopes: scopes.split(" "),
});

export const xeroRouter = createTRPCRouter({
  getRole: protectedProcedure.query(({ ctx }) => {
    return ctx.role ?? Role.GUEST;
  }),
  authenticate: protectedProcedure.mutation(async () => {
    const consentUrl = await xero.buildConsentUrl();
    return {
      url: consentUrl,
    };
  }),
  updateRefreshToken: protectedProcedure
    .input(
      z.object({
        code: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const tokenSet: TokenSet = await xero.apiCallback(input.code);

        await xero.updateTenants(false);
        const updatedCreds = await ctx.prisma.xeroCreds.upsert({
          where: {
            userId: ctx.userId,
          },
          update: {
            refreshToken: tokenSet.refresh_token,
          },
          create: {
            userId: ctx.userId,
            refreshToken: tokenSet.refresh_token ?? "",
          },
        });
        return {
          updatedCreds,
        };
      } catch (err) {
        return {
          error: "ERROR",
        };
      }
    }),
  postInvoice: protectedProcedure
    .input(
      z.object({
        invoiceId: z.number(),
        customerName: z.string(),
        MGInvoice: z.string().optional().nullable(),
        TGInvoice: z.string().optional().nullable(),
        paymentTerms: z.string().optional().nullable(),

        invoiceDate: z.date(),
        dueDate: z.date(),
        lines: z.array(
          z.object({
            productCode: z.string().nullable(),
            MGCode: z.string().optional().nullable(),
            TGDivision: z.string().nullable(),
            accountCode: z.string().nullish().default(""),
            TGCode: z.string().optional().nullable(),
            productDesc: z.string().nullable(),
            quantity: z.number().optional(),
            unitPrice: z.number().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const dateValue = input.invoiceDate.toISOString().split("T")[0];
      const dueDateValue = input.dueDate.toISOString().split("T")[0];

      const allProducts = await getAllProductsUnleashed();
      const contact: Contact = {
        name: input.customerName,
      };
      const lineItems: LineItem[] = [];
      if (input.customerName.includes("MG")) {
        for (const line of input.lines) {
          const lineItem: LineItem = {
            description: `${line.productCode} ${
              line.MGCode ?? `(${line.MGCode})`
            }- ${line.productDesc}`,
            quantity: line?.quantity ?? 0,
            unitAmount: line?.unitPrice ?? 0,
            accountCode: line.accountCode ?? "",
            taxType: ["COMMISSION", "LEVY", "OLEVY", "PLEVY", "VLEVY"].includes(
              line?.productCode ?? ""
            )
              ? ""
              : "OUTPUT2",
          };
          lineItems.push(lineItem);
        }
      } else if (input.customerName.includes("T&G")) {
        interface ExtendedLineItem extends LineItem {
          quantity?: number;
          total?: number;
          productCode: string | null;
          unitPrice?: number;
          TGDivision: string | null;
        }
        const groupedLines: Record<string, ExtendedLineItem[]> = {};

        for (const line of input.lines) {
          const division = line.TGDivision ?? "null";

          if (!groupedLines[division]) {
            groupedLines[division] = [];
          }

          groupedLines[division]?.push({
            ...line,
            accountCode: line.accountCode ?? "",
          });
        }

        for (const division in groupedLines) {
          const combinedLines: Record<string, ExtendedLineItem> = {};
          if (groupedLines[division]) {
            for (const line of groupedLines[division]) {
              const accountCode = line.accountCode;
              const productCode = line.productCode;

              if (
                productCode &&
                ["COMMISSION", "LEVY", "OLEVY", "PLEVY", "VLEVY"].includes(
                  productCode
                )
              ) {
                const lineItem: LineItem = {
                  description: productCode,
                  quantity: 1,
                  unitAmount: line?.unitPrice ?? 0,
                  accountCode: line.accountCode,
                  taxType: "",
                };
                lineItems.push(lineItem);
                continue;
              }

              if (accountCode) {
                const combinedLine = combinedLines[accountCode];
                if (!combinedLine) {
                  combinedLines[accountCode] = {
                    ...line,
                    total: (line.quantity ?? 0) * (line.unitPrice ?? 0),
                  };
                } else {
                  combinedLine.quantity =
                    (combinedLine.quantity ?? 0) + (line.quantity ?? 0);
                  combinedLine.total =
                    (combinedLine.total ?? 0) +
                    (line.quantity ?? 0) * (line.unitPrice ?? 0);
                }
              }
            }
          }

          const combinedLineItems = Object.values(combinedLines);

          for (const line of combinedLineItems) {
            const lineItem: LineItem = {
              description: line.TGDivision
                ? `${line.TGDivision} - ${line.accountCode!}`
                : line.productCode ?? "",
              quantity: 1,
              unitAmount: line?.total ?? 0,
              accountCode: line.accountCode,
              taxType: [
                "COMMISSION",
                "LEVY",
                "OLEVY",
                "PLEVY",
                "VLEVY",
              ].includes(line?.productCode ?? "")
                ? ""
                : "OUTPUT2",
            };
            lineItems.push(lineItem);
          }
        }
      } else {
        const productMap = new Map<string, LineItem>();

        for (const line of input.lines) {
          const productCode = line.productCode;
          const quantity = line?.quantity ?? 0;
          const unitPrice = line?.unitPrice ?? 0;
          const accountCode =
            allProducts.Items.find(
              (product) => product.ProductCode === productCode
            )?.XeroSalesAccount ?? "";

          if (productCode) {
            if (productMap.has(productCode)) {
              const existingItem = productMap.get(productCode)!;
              existingItem.unitAmount =
                (existingItem.unitAmount ?? 0) + unitPrice * quantity;
            } else {
              const lineItem: LineItem = {
                description: `${productCode} - ${line.productDesc}`,
                quantity: quantity,
                unitAmount: unitPrice,
                accountCode: accountCode,
                taxType: "OUTPUT2",
              };
              productMap.set(productCode, lineItem);
            }
          }
        }
        for (const item of productMap.values()) {
          lineItems.push(item);
        }
      }

      const invoice: Invoice = {
        type: Invoice.TypeEnum.ACCREC,
        contact: contact,
        date: dateValue,
        dueDate: dueDateValue,
        lineItems: lineItems,
        reference:
          input.paymentTerms ??
          input.MGInvoice ??
          input.TGInvoice ??
          input.customerName,
        status: Invoice.StatusEnum.DRAFT,
      };
      const invoices: Invoices = {
        invoices: [invoice],
      };
      const creds = await ctx.prisma.xeroCreds.findFirst({
        where: {
          userId: ctx.userId,
        },
      });
      await xero.initialize();
      await xero.refreshWithRefreshToken(
        client_id,
        client_secret,
        creds?.refreshToken
      );
      await xero.updateTenants();
      const response: {
        response: {
          data: { Invoices: { InvoiceID: string; InvoiceNumber: string }[] };
          status: number;
        };
      } = await xero.accountingApi.createInvoices(
        xero_tenant,
        invoices,
        false,
        4
      );
      if (response.response.data.Invoices[0]?.InvoiceID) {
        await prisma.invoice.update({
          where: { id: input.invoiceId },
          data: {
            xeroId: response.response.data.Invoices[0]?.InvoiceID ?? null,
            xeroInvoiceNumber:
              response.response.data.Invoices[0]?.InvoiceNumber ?? null,
          },
        });
      }
      return response.response.status;
    }),
});
