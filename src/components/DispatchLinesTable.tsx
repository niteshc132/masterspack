import { api } from "~/utils/api";
import { type DispatchGetByIdResponse } from "~/server/api/routers/dispatch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { type DispatchCustomerType } from "@prisma/client";

type DispatchLines = DispatchGetByIdResponse["DispatchLines"];

export function DispatchLinesTable({
  dispatchLines,
  onDispatchUpdate,
  customerType,
}: {
  customerType: DispatchCustomerType;
  dispatchLines: DispatchLines;
  onDispatchUpdate: (updatedData: DispatchLines) => void;
}) {
  const { data: productStock } = api.unleashed.getProductStockUnleased.useQuery(
    {}
  );
  const { data: allProducts } = api.products.getAll.useQuery();
  const { data: productOnHand } = api.unleashed.getOnHandStock.useQuery();
  return (
    <table className="min-w-full divide-y divide-gray-300">
      <thead className="bg-slate-50">
        <tr>
          <th
            scope="col"
            className="whitespace-nowrap py-3.5 pl-4 pr-3 text-right text-sm font-semibold text-gray-900 sm:pl-0"
          >
            Line
          </th>

          <th
            scope="col"
            className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
          >
            Sale Order
          </th>
          <th
            scope="col"
            className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
          >
            Product Code
          </th>
          {dispatchLines[0]?.SalesOrderLines?.SalesOrder?.customerCode?.includes(
            "T&G"
          ) && (
            <th
              scope="col"
              className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
            >
              Your Code
            </th>
          )}
          {dispatchLines[0]?.SalesOrderLines?.SalesOrder?.customerCode?.includes(
            "Unearthed"
          ) && (
            <th
              scope="col"
              className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
            >
              Your Code
            </th>
          )}
          {dispatchLines[0]?.SalesOrderLines?.SalesOrder?.customerCode?.includes(
            "MG"
          ) && (
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
            Select Batch
          </th>
          {customerType === "Export" && (
            <th
              scope="col"
              className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
            >
              Container Number
            </th>
          )}
          {customerType === "Export" && (
            <th
              scope="col"
              className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
            >
              Seal Number
            </th>
          )}
          {customerType === "UPL" && (
            <th
              scope="col"
              className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
            >
              Weight
            </th>
          )}
          <th
            scope="col"
            className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
          >
            To Ship
          </th>
          <th
            scope="col"
            className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
          >
            On Ship
          </th>
          <th
            scope="col"
            className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
          >
            On Hand
          </th>
          <th
            scope="col"
            className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
          >
            Ship
          </th>

          <th
            scope="col"
            className="relative whitespace-nowrap py-3.5 pl-3 pr-4 sm:pr-0"
          >
            {/* <span className="sr-only">Edit</span> */}
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 bg-white">
        {dispatchLines?.map((row, index) => (
          <tr key={index}>
            <td className="whitespace-nowrap py-2 pl-4 pr-3 text-right text-sm text-gray-500 sm:pl-0">
              {row.line}
            </td>
            <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-900">
              S-
              {row.SalesOrderLines.salesOrderId?.toString().padStart(6, "0")}
            </td>
            <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500">
              {row.productCode}
            </td>
            {row.SalesOrderLines?.SalesOrder?.customerCode?.includes("T&G") ||
              (row.SalesOrderLines?.SalesOrder?.customerCode?.includes(
                "Unearthed"
              ) && (
                <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500">
                  {allProducts?.find(
                    (item) => item.productCode === row.productCode
                  )?.TGcode ?? ""}
                </td>
              ))}
            {row.SalesOrderLines?.SalesOrder?.customerCode?.includes("MG") && (
              <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500">
                {row.SalesOrderLines?.SalesOrder?.customerCode?.includes(
                  "MG"
                ) &&
                  (allProducts?.find(
                    (item) => item.productCode === row.productCode
                  )?.MGcode ??
                    "")}
              </td>
            )}
            {row.SalesOrderLines?.SalesOrder?.customerCode?.includes("T&G") && (
              <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500">
                {row.SalesOrderLines?.SalesOrder?.customerCode?.includes(
                  "T&G"
                ) &&
                  (allProducts?.find(
                    (item) => item.productCode === row.productCode
                  )?.TGcode ??
                    "")}
              </td>
            )}
            <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500">
              {/* {row.SalesOrderLines.productDescription} */}
              <input
                // type="text"
                className="w-fit"
                value={row.productDescription ?? ""}
                onChange={(e) => {
                  const updatedData = dispatchLines.map((item) =>
                    item.line === row.line
                      ? {
                          ...item,
                          productDescription: e.target.value,
                        }
                      : item
                  );
                  onDispatchUpdate(updatedData);
                }}
              />
            </td>
            <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500">
              {row.SalesOrderLines.quantity.toFixed(2)}
            </td>

            <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500">
              <Select
                // defaultValue={}
                onValueChange={(e) => {
                  const [batchNumber, batchLocation] = e.split(",");
                  const updatedData = dispatchLines.map((item) =>
                    item.line === row.line
                      ? {
                          ...item,
                          batchNumber: batchNumber,
                          batchLocation: batchLocation,
                        }
                      : item
                  ) as DispatchLines;
                  onDispatchUpdate(updatedData);
                }}
              >
                <SelectTrigger className="w-[250px]">
                  <SelectValue
                    placeholder={
                      `${row.batchNumber}-${row.batchLocation}` ??
                      "Select Batch"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {productStock?.Items?.filter(
                    (item) => item.ProductCode === row.productCode
                  ).map((product, index) => {
                    return (
                      <SelectItem
                        key={index}
                        value={`${product.Number},${product.WarehouseCode}`}
                      >
                        <span className="text-green-500">
                          {product.Quantity}
                        </span>
                        -{product.Number}-{product.WarehouseCode}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </td>
            {customerType === "Export" && (
              <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500">
                <input
                  className="w-24"
                  value={row.containerNumber ?? ""}
                  onChange={(e) => {
                    const updatedData = dispatchLines.map((item) =>
                      item.line === row.line
                        ? { ...item, containerNumber: e.target.value }
                        : item
                    );
                    onDispatchUpdate(updatedData);
                  }}
                />
              </td>
            )}
            {customerType === "Export" && (
              <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500">
                <input
                  className="w-24"
                  value={row.sealNumber ?? ""}
                  onChange={(e) => {
                    const updatedData = dispatchLines.map((item) =>
                      item.line === row.line
                        ? { ...item, sealNumber: e.target.value }
                        : item
                    );
                    onDispatchUpdate(updatedData);
                  }}
                />
              </td>
            )}
            {customerType === "UPL" && (
              <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500">
                <input
                  type="number"
                  className="w-24"
                  min={0}
                  value={row.weight ?? 0}
                  onChange={(e) => {
                    const updatedData = dispatchLines.map((item) =>
                      item.line === row.line
                        ? { ...item, weight: +e.target.value }
                        : item
                    );
                    onDispatchUpdate(updatedData);
                  }}
                />
              </td>
            )}
            <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500">
              {(
                row.SalesOrderLines.quantity - row.SalesOrderLines.shipped
              ).toFixed(2)}
            </td>
            <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500">
              {row.SalesOrderLines.shipped.toFixed(2)}
            </td>
            <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500">
              {
                productOnHand?.find(
                  (item) => item.ProductCode === row.productCode
                )?.AvailableQty
              }
            </td>
            <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500">
              <input
                type="number"
                className="w-24"
                min={0}
                value={row.ship}
                max={row.SalesOrderLines.quantity}
                onChange={(e) => {
                  const updatedData = dispatchLines.map((item) =>
                    item.line === row.line
                      ? { ...item, ship: +e.target.value }
                      : item
                  );
                  onDispatchUpdate(updatedData);
                }}
              />
            </td>
            <td
              onClick={() => {
                const updatedData = dispatchLines.filter(
                  (item) => item.line != row.line
                );
                onDispatchUpdate(updatedData);
              }}
              className="whitespace-nowrap px-2 py-2 text-sm text-gray-500"
            >
              remove
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
