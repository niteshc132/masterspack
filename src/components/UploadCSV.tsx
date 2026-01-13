import { type ChangeEvent } from "react";
import { read, utils } from "xlsx";

import toast from "react-hot-toast";
import { api } from "~/utils/api";
import type { InvoiceLines } from "@prisma/client";
import { File } from "lucide-react";
import { getAccountCode } from "~/lib/utils";
interface ExcelRowObject {
  "Customer Code": string;
  "Sales Order": string;
  Status: string;
  Date: string;
  "Due Date": string;
  "Product Code": string;
  "Product Description": string;
  Quantity: number;
  "Total Price": number;
  Comment: string;
}
interface ExcelRowObjectMG {
  Invno: string;
  Product: string;
  Description: string;
  Qty_Sold: number;
  Ave_Price: number;
  Value: number;
  Comm: number;
  Levies: number;
  Net_Amount: number;
  YourRef: string;
}

interface ExcelRowObjectTG {
  "Supplier Invoice Num": number;
  Division: string;
  Plant: number;
  Material: string;
  Description: string;
  "Type Description": string;
  Container: string;
  "Billed qty": number;
  "Net Amount": number;
  "Net Price": number;
  "Posting Type": number;
}
export default function ExcelFileUpload() {
  const utilsContext = api.useContext();

  const { data: salesOrders } = api.salesOrder.getAll.useQuery();
  const { data: allDispatchs } = api.dispatch.getAll.useQuery();

  const { data: allCustomers } = api.unleashed.getCustomers.useQuery();
  const { data: allProducts } = api.unleashed.getALlProducts.useQuery();
  const { data: allProductsDB } = api.products.getAll.useQuery();

  const { mutateAsync: upsertInvoice } = api.invoices.upsertInvoice.useMutation(
    {
      onSuccess: async () => {
        await utilsContext.invoices.getAll.refetch();
        await utilsContext.invoices.getById.refetch();
      },
    }
  );
  const processMG = async (json: ExcelRowObjectMG[]) => {
    let commission = 0;
    let plevy = 0;
    let olevy = 0;
    let vlevy = 0;
    const invoiceLines: InvoiceLines[] = [];

    json.forEach((line, index) => {
      if (line.Invno && line.Ave_Price != 0) {
        console.log("line", line);
        commission += line.Comm;

        if (line.Description.includes("POT")) {
          plevy += line.Levies;
        } else if (line.Description.includes("ONION")) {
          olevy += line.Levies;
        } else {
          vlevy += line.Levies;
        }

        const product = allProductsDB?.filter(
          (item) => item.MGcode === line.Product
        )[0];

        const validSalesOrder = allDispatchs?.filter(
          (order) => order.id === +line.YourRef
        );

        const validSalesOrderLine = validSalesOrder?.[0]?.DispatchLines.filter(
          (line) => line.productCode === product?.productCode
        );
        console.log("validSalesOrderLine", validSalesOrderLine);

        invoiceLines.push({
          productCode: product?.productCode ?? "",
          MGCode: product?.MGcode ?? line.Product,
          TGCode: product?.TGcode ?? "",
          accountCode:
            allProducts?.find(
              (item) => item.ProductCode === product?.productCode
            )?.XeroSalesAccount ??
            allProducts?.find(
              (item) => item.ProductCode === product?.productCode
            )?.XeroCostOfGoodsAccount ??
            getAccountCode(line.Description),
          TGDivision: null,
          id: "",
          quantity: line.Qty_Sold,
          line: index,
          unitPrice: line.Value ? line.Value / line.Qty_Sold : 0,
          productId: "",
          ordered: line.Qty_Sold,
          productDesc: product?.productDesc ?? line.Description,
          invoiceId: 0,
          dispatchLineId: null,
          salesOrderLineId: validSalesOrderLine?.[0]?.id ?? null,
          unmatchedSalesOrderId: null,
        });
      }
    });
    console.log("invoiceLines", invoiceLines);
    invoiceLines.push({
      productCode: "COMMISSION",
      id: "",
      MGCode: null,
      TGCode: null,
      TGDivision: null,
      accountCode: getAccountCode("COMMISSION"),
      quantity: 1,
      line: invoiceLines.length + 1,
      unitPrice: commission,
      productId: "",
      ordered: 0,
      productDesc: "",
      invoiceId: 0,
      dispatchLineId: null,
      salesOrderLineId: null,
      unmatchedSalesOrderId: null,
    });
    invoiceLines.push({
      productCode: "OLEVY",
      MGCode: null,
      TGCode: null,
      TGDivision: null,
      accountCode: getAccountCode("OLEVY"),
      id: "",
      quantity: 1,
      line: invoiceLines.length + 1,
      unitPrice: olevy,
      productId: "",
      ordered: 0,
      productDesc: "",
      invoiceId: 0,
      dispatchLineId: null,
      salesOrderLineId: null,
      unmatchedSalesOrderId: null,
    });
    invoiceLines.push({
      productCode: "PLEVY",
      MGCode: null,
      TGCode: null,
      TGDivision: null,
      accountCode: getAccountCode("PLEVY"),
      id: "",
      quantity: 1,
      line: invoiceLines.length + 1,
      unitPrice: plevy,
      productId: "",
      ordered: 0,
      productDesc: "",
      invoiceId: 0,
      dispatchLineId: null,
      salesOrderLineId: null,
      unmatchedSalesOrderId: null,
    });
    invoiceLines.push({
      productCode: "VLEVY",
      MGCode: null,
      TGCode: null,
      TGDivision: null,
      accountCode: getAccountCode("VLEVY"),
      id: "",
      quantity: 1,
      line: invoiceLines.length + 1,
      unitPrice: vlevy,
      productId: "",
      ordered: 0,
      productDesc: "",
      invoiceId: 0,
      dispatchLineId: null,
      salesOrderLineId: null,
      unmatchedSalesOrderId: null,
    });
    const customer = allCustomers?.filter((item) =>
      item?.CustomerCode?.includes("MG")
    )[0];

    const newInvoice = {
      customerId: customer?.Guid ?? "",
      MGInvoice: json[0]?.Invno.toString(),
      customerCode: customer?.CustomerCode ?? "",
      customerName: customer?.CustomerName ?? "",
      billingAddress: customer?.Addresses[0].AddressName ?? "",
      invoiceDate: new Date(),
      dueDate: new Date(),
      paymentTerms: "",
      InvoiceLines: invoiceLines,
    };

    await toast.promise(upsertInvoice(newInvoice), {
      success: "Invoice Created!",
      loading: "Saving...",
      error: "There was an error saving",
    });
  };

  const processTG = (json: ExcelRowObjectTG[]) => {
    const invoicesMap: Record<number, InvoiceLines[]> = {};
    const levyMap: Record<
      number,
      {
        commission: number;
        plevy: number;
        olevy: number;
        vlevy: number;
      }
    > = {};

    const filteredLines = json.filter((item) => item["Net Amount"] != 0);

    filteredLines.forEach((line, index) => {
      const product = allProductsDB?.find(
        (item) => item.TGcode === line.Material
      );

      const productUnleashed = allProducts?.find(
        (item) => item.ProductCode === product?.productCode
      );

      const invoiceNum = line["Supplier Invoice Num"];
      if (!invoicesMap[invoiceNum]) {
        invoicesMap[invoiceNum] = [];
      }
      if (!levyMap[invoiceNum]) {
        levyMap[invoiceNum] = {
          commission: 0,
          plevy: 0,
          olevy: 0,
          vlevy: 0,
        };
      }

      if (
        line["Type Description"] != "Commission" &&
        line["Type Description"] != "Traded Levies" &&
        line["Type Description"] != "Levy"
      ) {
        invoicesMap[invoiceNum]?.push({
          productCode: product?.productCode ?? "",
          MGCode: product?.MGcode ?? "",
          TGDivision: line.Division,
          TGCode: line.Material ?? "",
          accountCode:
            productUnleashed?.XeroSalesAccount ??
            productUnleashed?.XeroCostOfGoodsAccount ??
            getAccountCode(line.Description),

          id: "",
          quantity:
            line.Container === "BIN"
              ? line["Net Amount"] / line["Net Price"]
              : line["Billed qty"],
          line: index,
          unitPrice: line["Net Price"] ?? 0,
          productId: "",
          ordered: line["Billed qty"],
          productDesc: product?.productDesc ?? line.Description,
          invoiceId: 0,
          dispatchLineId: null,
          salesOrderLineId: null,
          unmatchedSalesOrderId: null,
        });
      } else if (line["Type Description"] === "Commission") {
        levyMap[invoiceNum].commission += line["Net Amount"] ?? 0;
      } else if (line["Type Description"].includes("Lev")) {
        if (line.Description.toLowerCase().includes("pot")) {
          levyMap[invoiceNum].plevy += line["Net Amount"] ?? 0;
        } else if (line.Description.toLowerCase().includes("onion")) {
          levyMap[invoiceNum].olevy += line["Net Amount"] ?? 0;
        } else {
          levyMap[invoiceNum].vlevy += line["Net Amount"] ?? 0;
        }
      }
    });

    const customerTG = allCustomers?.filter((item) =>
      item?.CustomerCode?.includes("T&G Fresh")
    )[0];
    const customerUnearthed = allCustomers?.filter((item) =>
      item?.CustomerCode?.includes("Unearthed")
    )[0];

    Object.entries(invoicesMap).map(async ([invoiceNum, invoiceLines]) => {
      const customer = invoiceLines[0]?.TGDivision?.includes("Unearthed")
        ? customerUnearthed
        : customerTG;
      const levy = levyMap[+invoiceNum] as {
        commission: number;
        plevy: number;
        olevy: number;
        vlevy: number;
      };
      const vlevy = levy.vlevy;
      const olevy = levy.olevy;
      const plevy = levy.plevy;
      const commission = levy.commission;

      invoiceLines.push({
        productCode: "OLEVY",
        MGCode: null,
        TGCode: null,
        accountCode: getAccountCode("OLEVY"),
        id: "",
        quantity: 1,
        line: invoiceLines.length + 1,
        unitPrice: olevy,
        productId: "",
        TGDivision: null,
        ordered: 0,
        productDesc: "",
        invoiceId: 0,
        dispatchLineId: null,
        salesOrderLineId: null,
        unmatchedSalesOrderId: null,
      });
      invoiceLines.push({
        productCode: "COMMISSION",
        MGCode: null,
        TGCode: null,
        accountCode: getAccountCode("COMMISSION"),

        TGDivision: null,
        id: "",
        quantity: 1,
        line: invoiceLines.length + 1,
        unitPrice: commission,
        productId: "",
        ordered: 0,
        productDesc: "",
        invoiceId: 0,
        dispatchLineId: null,
        salesOrderLineId: null,
        unmatchedSalesOrderId: null,
      });

      invoiceLines.push({
        productCode: "PLEVY",
        MGCode: null,
        TGDivision: null,
        TGCode: null,
        accountCode: getAccountCode("PLEVY"),

        id: "",
        quantity: 1,
        line: invoiceLines.length + 1,
        unitPrice: plevy,
        productId: "",
        ordered: 0,
        productDesc: "",
        invoiceId: 0,
        dispatchLineId: null,
        salesOrderLineId: null,
        unmatchedSalesOrderId: null,
      });
      invoiceLines.push({
        productCode: "VLEVY",
        MGCode: null,
        TGDivision: null,
        TGCode: null,
        accountCode: getAccountCode("VLEVY"),

        id: "",
        quantity: 1,
        line: invoiceLines.length + 1,
        unitPrice: vlevy,
        productId: "",
        ordered: 0,
        productDesc: "",
        invoiceId: 0,
        dispatchLineId: null,
        salesOrderLineId: null,
        unmatchedSalesOrderId: null,
      });

      const newInvoice = {
        customerId: customer?.Guid ?? "",
        TGInvoice: "",
        customerCode: customer?.CustomerCode ?? "",
        customerName: customer?.CustomerName ?? "",
        billingAddress: customer?.Addresses[0].AddressName ?? "",
        invoiceDate: new Date(),
        dueDate: new Date(),
        paymentTerms: invoiceNum,
        InvoiceLines: invoiceLines,
      };

      await toast.promise(upsertInvoice(newInvoice), {
        success: "Invoice Created!",
        loading: "Saving...",
        error: "There was an error saving",
      });
    });

    return;
  };

  const processExcel = async (json: ExcelRowObject[]) => {
    const invoiceLines: InvoiceLines[] = [];
    const customer = allCustomers?.filter(
      (item) => item.CustomerCode === json[0]?.["Customer Code"]
    )[0];
    json.forEach((row, index) => {
      const match = row["Sales Order"]?.match(/\d+/);
      const orderNumber = match ? parseInt(match[0], 10) : null;

      const validSalesOrder = salesOrders?.filter(
        (order) => order.id === orderNumber
      );

      const validSalesOrderLine = validSalesOrder?.[0]?.SalesOrderLines.filter(
        (line) => line.productCode === row["Product Code"]
      );

      const product = allProducts?.filter(
        (item) => item.ProductCode === row["Product Code"]
      )[0];

      invoiceLines.push({
        productCode: row["Product Code"],
        MGCode: null,
        TGCode: null,
        TGDivision: null,
        accountCode:
          product?.XeroSalesAccount ??
          product?.XeroCostOfGoodsAccount ??
          "1000",

        id: "",
        quantity: row.Quantity,
        line: index,
        unitPrice: row["Total Price"] ? row["Total Price"] / row.Quantity : 0,
        productId: product?.Guid ?? "",
        ordered: 0,
        productDesc: product?.ProductDescription ?? "",
        invoiceId: 0,
        dispatchLineId: null,
        salesOrderLineId: validSalesOrderLine?.[0]?.id ?? null,
        unmatchedSalesOrderId: !validSalesOrderLine?.[0]?.id
          ? row["Sales Order"]?.substring(2)
          : null,
      });
    });

    const newInvoice = {
      customerId: customer?.Guid ?? "",
      customerCode: customer?.CustomerCode ?? "",
      customerName: customer?.CustomerName ?? "",
      billingAddress: customer?.Addresses[0].AddressName ?? "",
      invoiceDate: new Date(),
      dueDate: new Date(),
      paymentTerms: "",
      InvoiceLines: invoiceLines,
    };

    await toast.promise(upsertInvoice(newInvoice), {
      success: "Invoice Created!",
      loading: "Saving...",
      error: "There was an error saving",
    });
  };
  const readExcel = (file: Blob) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const binaryStr = event.target?.result;
      const workBook = read(binaryStr, { type: "binary" });

      const sheetName = workBook.SheetNames[0];
      if (!sheetName) return;
      const sheet = workBook.Sheets[sheetName];
      if (!sheet) return;

      if (file.name.includes("LAXMI")) {
        const json = utils.sheet_to_json<ExcelRowObjectMG>(sheet);
        await processMG(json);
        return;
      } else if (file.name.includes("InvoiceExtract")) {
        const json = utils.sheet_to_json<ExcelRowObjectTG>(sheet);
        processTG(json);
        return;
      }

      const json = utils.sheet_to_json<ExcelRowObject>(sheet);
      await processExcel(json);
    };
    reader.onerror = () => {
      toast.error("There was an issue reading the file.");
    };
    reader.readAsBinaryString(file);
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      readExcel(file);
      event.target.value = "";
    } else {
      toast.error("No file selected.");
    }
  };

  return (
    <div className="flex space-x-4">
      <div>
        <label className="flex  h-10 cursor-pointer items-center rounded-md border bg-white px-4  ">
          <File className="mr-1 inline h-3.5 w-3.5" />
          <span>Import</span>
          <input
            type="file"
            className="hidden"
            accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleFileUpload}
          />
        </label>
      </div>
    </div>
  );
}
