import * as React from "react";
import { useState } from "react";
import clsx from "clsx";
import { Button } from "./ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { InvoiceGetByIdResponse } from "~/server/api/routers/invoices";

type InvoiceLines = InvoiceGetByIdResponse["InvoiceLines"];
type GroupedLines = Record<number, InvoiceLines>;

export function InvoiceLinesTable({
  invoiceLines,
  invoiceSent,
  customerCode,
  onInvoiceUpdate: onDispatchUpdate,
}: {
  invoiceLines: InvoiceLines;
  invoiceSent: boolean;
  customerCode: string;
  onInvoiceUpdate: (updatedData: InvoiceLines) => void;
}) {
  const [collapsedIds, setCollapsedIds] = useState<number[]>([]);

  const toggleCollapse = (salesOrderId: number) => {
    if (collapsedIds.includes(salesOrderId)) {
      setCollapsedIds(collapsedIds.filter((id) => id !== salesOrderId));
    } else {
      setCollapsedIds([...collapsedIds, salesOrderId]);
    }
  };

  const isCollapsed = (salesOrderId: number) => {
    return collapsedIds.includes(salesOrderId);
  };

  const groupedLines: GroupedLines = invoiceLines.reduce(
    (acc: GroupedLines, line) => {
      const salesOrderId =
        line.DispatchLines?.SalesOrderLines.salesOrderId ??
        line.SalesOrderLines?.salesOrderId;
      if (salesOrderId && !acc[salesOrderId]) {
        acc[salesOrderId] = [];
      }
      if (salesOrderId && acc[salesOrderId]) acc[salesOrderId]?.push(line);
      return acc;
    },
    {}
  );
  const invoiceTotal = invoiceLines?.reduce((accumulator, product) => {
    if (product?.quantity) {
      return accumulator + product.quantity * product.unitPrice;
    }
    return accumulator;
  }, 0);

  const quantityTotal = invoiceLines?.reduce((accumulator, product) => {
    if (product?.quantity) {
      return accumulator + product.quantity;
    }
    return accumulator;
  }, 0);

  return (
    <div>
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-slate-50">
          <tr>
            <th
              scope="col"
              className="whitespace-nowrap py-3.5 pl-4 pr-3 text-right text-sm font-semibold text-gray-900 sm:pl-0"
            >
              {/* Line */}
            </th>

            <th
              scope="col"
              className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
            >
              Product Code
            </th>
            {customerCode?.includes("MG") && (
              <th
                scope="col"
                className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
              >
                Your Code
              </th>
            )}
            {customerCode?.includes("T&G") && (
              <th
                scope="col"
                className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
              >
                Your Code
              </th>
            )}
            <th
              scope="col"
              className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
            >
              Account Code
            </th>
            <th
              scope="col"
              className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
            >
              Product Description
            </th>
            <th
              scope="col"
              className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
            >
              Order Quantity
            </th>

            <th
              scope="col"
              className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
            >
              Order Dispatched
            </th>
            <th
              scope="col"
              className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
            >
              Order Invoiced
            </th>
            <th
              scope="col"
              className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
            >
              Quantity
              <br />
              <span className=" font-light text-gray-400">{quantityTotal}</span>
            </th>
            <th
              scope="col"
              className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
            >
              Unit Price
            </th>

            <th
              scope="col"
              className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
            >
              Total
              <br />
              <span className=" font-light text-gray-400">
                ${invoiceTotal.toFixed(2)}
              </span>
            </th>
            <th
              scope="col"
              className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
            >
              Total + GST
              <br />
              <span className=" font-light text-gray-400">
                ${(invoiceTotal * 1.15).toFixed(2)}
              </span>
            </th>
            {/* <th
            scope="col"
            className="relative whitespace-nowrap py-3.5 pl-3 pr-4 sm:pr-0"
          >
            <span className="sr-only">Edit</span>
          </th> */}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {Object.entries(groupedLines).map(([salesOrderId, lines], index) => (
            <React.Fragment key={index}>
              <tr>
                <td
                  colSpan={8}
                  className="flex-inline py-2 pl-4 text-left font-medium"
                >
                  <button
                    className="focus:outline-none"
                    onClick={() => toggleCollapse(+salesOrderId)}
                  >
                    {isCollapsed(+salesOrderId) ? (
                      <ChevronRight className="inline" />
                    ) : (
                      <ChevronDown className="inline" />
                    )}{" "}
                    D-
                    {salesOrderId?.toString()?.padStart(6, "0") ?? "-----"}
                  </button>
                </td>
                <td></td>
                <td></td>
              </tr>
              {!isCollapsed(+salesOrderId) &&
                lines?.map((row, rowIndex: number) => (
                  <tr
                    key={rowIndex}
                    className={clsx(
                      row.unmatchedSalesOrderId ? "bg-rose-100" : "bg-green-50"
                    )}
                  >
                    <td className="whitespace-nowrap py-2 pl-4 pr-3 text-right text-sm text-gray-500 sm:pl-0">
                      {/* {row.line} */}
                    </td>
                    <td className="whitespace-nowrap py-2 pl-4 pr-3 text-left text-sm text-gray-500 sm:pl-0">
                      {row.productCode ??
                        row.DispatchLines?.SalesOrderLines.productCode}
                    </td>
                    {customerCode?.includes("MG") && (
                      <td className="whitespace-nowrap py-2 pl-4 pr-3 text-left text-sm text-gray-500 sm:pl-0">
                        {row.MGCode}
                      </td>
                    )}
                    {customerCode?.includes("T&G") && (
                      <td className="whitespace-nowrap py-2 pl-4 pr-3 text-left text-sm text-gray-500 sm:pl-0">
                        {row.TGCode}
                      </td>
                    )}
                    <td className="whitespace-nowrap py-2 pl-4 pr-3 text-left text-sm text-gray-500 sm:pl-0">
                      {row.accountCode}
                    </td>
                    <td className="whitespace-nowrap py-2 pl-4 pr-3 text-left text-sm text-gray-500 sm:pl-0">
                      {row.productDesc ??
                        row.DispatchLines?.SalesOrderLines.productDescription}
                    </td>
                    <td className="whitespace-nowrap py-2 pl-4 pr-3 text-left text-sm text-gray-500 sm:pl-0">
                      {row.DispatchLines?.SalesOrderLines.quantity.toFixed(2) ??
                        row.SalesOrderLines?.quantity?.toFixed(2) ??
                        "-----"}
                    </td>
                    <td className="whitespace-nowrap py-2 pl-4 pr-3 text-left text-sm text-gray-500 sm:pl-0">
                      {row.DispatchLines?.SalesOrderLines.shipped.toFixed(2) ??
                        row.SalesOrderLines?.shipped?.toFixed(2) ??
                        "-----"}
                    </td>
                    <td className="whitespace-nowrap py-2 pl-4 pr-3 text-left text-sm text-gray-500 sm:pl-0">
                      {row.DispatchLines?.SalesOrderLines.invoiced.toFixed(2) ??
                        row.SalesOrderLines?.invoiced?.toFixed(2) ??
                        "-----"}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500">
                      <input
                        type="number"
                        className="w-24"
                        value={row.quantity}
                        onChange={(e) => {
                          const updatedData = invoiceLines.map((item) =>
                            item.line === row.line
                              ? { ...item, quantity: +e.target.value }
                              : item
                          );
                          onDispatchUpdate(updatedData);
                        }}
                      />
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500">
                      ${" "}
                      <input
                        type="number"
                        className="w-24"
                        value={row.unitPrice}
                        onChange={(e) => {
                          const value = +e.target.value;
                          const updatedData = invoiceLines.map((item) =>
                            item.line === row.line
                              ? { ...item, unitPrice: +value.toFixed(2) }
                              : item
                          );
                          onDispatchUpdate(updatedData);
                        }}
                      />
                    </td>
                    <td className="whitespace-nowrap py-2 pl-4 pr-3 text-right text-sm text-gray-500 sm:pl-0">
                      ${(row?.quantity * row?.unitPrice).toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap py-2 pl-4 pr-3 text-right text-sm text-gray-500 sm:pl-0">
                      ${(row?.quantity * row?.unitPrice * 1.15).toFixed(2)}
                    </td>
                    {!invoiceSent && (
                      <td>
                        <Button
                          variant={"destructive"}
                          onClick={() => {
                            const updatedData = invoiceLines.filter(
                              (item) => item.line != row.line
                            );
                            onDispatchUpdate(updatedData);
                          }}
                        >
                          Remove
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
