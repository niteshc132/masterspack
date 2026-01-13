import { api } from "~/utils/api";
import * as XLSX from "xlsx";
import { addDays, format } from "date-fns";
import type { Cin7Fulfiment } from "~/server/api/routers/products";
import { useState } from "react";

const headers = [
  "Order Date",
  "Order Number",
  "Customer",
  "Product Code",
  "Product Description",
  "Fulfilment #",
  "UOM",
  "Qty Ordered",
  "Qty Fulfilled",
  "Remaining Qty to Fulfill",
];
const uninvoicedHeaders = [
  "Order Date",
  "Order Number",
  "Customer",
  "Product Code",
  "Product Description",
  "Fulfilment #",
  "UOM",
  "Qty Fulfilled",
  "Qty Invoiced",
  "Remaining Qty to Invoice",
];
interface uninvoicedInterface {
  "Sales Order": string;
  Status: string;
  Date: string;
  "Due Date": string;
  "Product Code": string;
  "Product Description": string;
  Quantity: number;
  "Total Price": number;
}
const ExportToExcelButton = ({
  data,
  invoiced,
}: {
  data: uninvoicedInterface[];
  invoiced: boolean;
}) => {
  const handleDownload = () => {
    const ws = XLSX.utils.json_to_sheet(data);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "UnInvoicedFulfilments");
    const title = invoiced ? "UnInvoicedFulfilments.xlsx" : "YetToFulfill.xlsx";
    XLSX.writeFile(wb, title);
  };

  return (
    <button
      className="btn-primary w-fit bg-blue-primary text-sm"
      onClick={handleDownload}
    >
      Download Excel
    </button>
  );
};
export const SalesTable = ({ invoiced }: { invoiced: boolean }) => {
  const { data: products } = api.products.getAllFromCin7.useQuery();
  const { data: fulfilments } = api.products.getAllFulfilments.useQuery();

  const [searchProductId, setSearchProductId] = useState("");
  const [searchCustomer, setSearchCustomer] = useState("");
  const [searchOrder, setSearchOrder] = useState("");

  const [searchDescription, setSearchDescription] = useState("");
  const { data: uninvoiced } =
    api.products.getAllUninvoicedFulfilments.useQuery();

  const header = invoiced ? uninvoicedHeaders : headers;

  function getCountBySaleOrderNumber(data: Cin7Fulfiment) {
    if (!data || !Array.isArray(data)) {
      return 0;
    }

    const countMap = new Map();

    data.forEach((item) => {
      const saleOrderNumber = item?.SaleOrderNumber;
      const currentCount = (countMap?.get(saleOrderNumber) as number) ?? 0;
      countMap.set(saleOrderNumber, currentCount + 1);
    });

    return countMap.size;
  }
  const filteredFulfilments = fulfilments?.filter(
    (product) =>
      product?.SaleOrderNumber?.toLowerCase().includes(
        searchOrder.toLowerCase()
      ) &&
      product?.Customer?.toLowerCase().includes(searchCustomer.toLowerCase()) &&
      product.SKU.toLowerCase().includes(searchProductId.toLowerCase()) &&
      product.Name.toLowerCase().includes(searchDescription.toLowerCase())
  );
  const filteredUninvoiced = uninvoiced?.filter(
    (product) =>
      product?.SaleOrderNumber?.toLowerCase().includes(
        searchOrder.toLowerCase()
      ) &&
      product?.Customer?.toLowerCase().includes(searchCustomer.toLowerCase()) &&
      product.SKU.toLowerCase().includes(searchProductId.toLowerCase()) &&
      product.Name.toLowerCase().includes(searchDescription.toLowerCase())
  );

  const flattenedDataFulfilments = filteredFulfilments?.map((uninvProduct) => {
    const productMatch = products?.find((p) => p.ID === uninvProduct.ProductID);

    return {
      "Sales Order": uninvProduct.SaleOrderNumber,
      Status: "Draft",
      Date: uninvProduct?.SaleOrderDate?.slice(0, 10) ?? "",
      "Due Date": uninvProduct.SaleOrderDate?.slice(0, 10) ?? "",
      "Product Code": uninvProduct.SKU,
      "Product Description": uninvProduct.Name,
      Quantity: (uninvProduct.SaleOrderQuantity ?? 0) - uninvProduct.Quantity,
      "Total Price": productMatch?.AverageCost ?? 0 * uninvProduct.Quantity,
    };
  });
  const flattenedDataUninvoiced = filteredUninvoiced?.map((uninvProduct) => {
    const productMatch = products?.find((p) => p.ID === uninvProduct.ProductID);
    const orderDueDate = format(addDays(new Date(), 30), "dd/MM/yyyy");

    return {
      "Sales Order": uninvProduct.SaleOrderNumber,
      Status: "Draft",
      Date: format(new Date(), "dd/MM/yyyy"),
      "Due Date": orderDueDate,
      "Product Code": uninvProduct.SKU,
      "Product Description": uninvProduct.Name,
      Quantity: uninvProduct.UninvoicedQuantity ?? 0,
      "Total Price": productMatch?.AverageCost ?? 0 * uninvProduct.Quantity,
    };
  });
  const exceldata = invoiced
    ? flattenedDataUninvoiced
    : flattenedDataFulfilments;

  const totalQuantityToInvoiceFulfilments = filteredFulfilments?.reduce(
    (acc, product) => {
      if (product?.SaleOrderQuantity)
        return acc + product?.SaleOrderQuantity - product.Quantity;
      else return acc;
    },
    0
  );

  const totalQuantityOrderedFulfilments = filteredFulfilments?.reduce(
    (acc, product) => {
      if (product?.SaleOrderQuantity)
        return acc + product?.SaleOrderQuantity ?? 0;
      else return acc;
    },
    0
  );
  const totalQuantityFulfilledFulfilments = filteredFulfilments?.reduce(
    (acc, product) => {
      if (product?.Quantity) return acc + product?.Quantity ?? 0;
      else return acc;
    },
    0
  );

  const totalQuantityToFulfillUninvoiced = filteredUninvoiced?.reduce(
    (acc, product) => {
      if (product?.UninvoicedQuantity)
        return acc + product?.UninvoicedQuantity ?? 0;
      else return acc;
    },
    0
  );
  const totalQuantityFulfilledUninvoiced = filteredUninvoiced?.reduce(
    (acc, product) => {
      if (product?.Quantity) return acc + product?.Quantity ?? 0;
      else return acc;
    },
    0
  );
  const totalQuantityRemainingInvoiceFulfilments = filteredUninvoiced?.reduce(
    (acc, product) => {
      if (product?.UninvoicedQuantity)
        return acc + product?.Quantity - product.UninvoicedQuantity;
      else return acc;
    },
    0
  );
  return (
    <div className="w-full overflow-x-auto">
      <div className="my-1 flex h-16 w-full  items-center space-x-5">
        <button
          onClick={() => {
            setSearchCustomer("");
            setSearchDescription("");
            setSearchOrder("");
            setSearchProductId("");
          }}
          className="btn-outline w-fit border-red-500 text-sm text-red-500 outline-none"
        >
          CLEAR SEARCH
        </button>
        {exceldata && (
          <ExportToExcelButton data={exceldata} invoiced={invoiced} />
        )}
        <p className="flex gap-x-2">
          <span className="text-xl font-semibold tracking-tight text-grey-medium">
            Count of orders:
          </span>
          <span className="text-xl font-bold text-grey-dark">
            {!invoiced &&
              filteredFulfilments &&
              getCountBySaleOrderNumber(filteredFulfilments)}
            {invoiced &&
              filteredUninvoiced &&
              getCountBySaleOrderNumber(filteredUninvoiced)}
          </span>

          <span className="text-xl font-semibold tracking-tight text-grey-medium">
            Count of Lines:
          </span>
          <span className="text-xl font-bold text-grey-dark">
            {invoiced
              ? filteredUninvoiced?.length
              : filteredFulfilments?.length}
          </span>
        </p>
      </div>
      <div className="w-full py-2 align-middle">
        <div className="w-full overflow-hidden border-2 border-grey-neutral shadow-md ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y-2 divide-grey-medium">
            <thead className="bg-grey-neutral font-bold text-grey-medium">
              <tr className="divide-x-2 divide-grey-medium">
                {header.map((header) => (
                  <th
                    key={header}
                    className="px-3 py-2.5 text-left text-blue-dark hover:bg-blue-light"
                  >
                    {header}
                  </th>
                ))}
              </tr>
              <tr className="divide-x-2 divide-grey-medium">
                <th></th>
                <th>
                  <input
                    type="text"
                    placeholder="Search Order Number"
                    onChange={(e) => setSearchOrder(e.target.value)}
                    value={searchOrder}
                    className="focus:shadow-outline w-full rounded-lg border px-3 py-1.5 text-gray-700 focus:outline-none"
                  />
                </th>
                <th>
                  <input
                    type="text"
                    placeholder="Search Customer"
                    onChange={(e) => setSearchCustomer(e.target.value)}
                    value={searchCustomer}
                    className="focus:shadow-outline w-full rounded-lg border px-3 py-1.5 text-gray-700 focus:outline-none"
                  />
                </th>
                <th>
                  <input
                    type="text"
                    placeholder="Search Product ID"
                    onChange={(e) => setSearchProductId(e.target.value)}
                    value={searchProductId}
                    className="focus:shadow-outline w-full rounded-lg border px-3 py-1.5 text-gray-700 focus:outline-none"
                  />
                </th>
                <th>
                  <input
                    type="text"
                    placeholder="Search Description"
                    onChange={(e) => setSearchDescription(e.target.value)}
                    value={searchDescription}
                    className="focus:shadow-outline w-full rounded-lg border px-3 py-1.5 text-gray-700 focus:outline-none"
                  />
                </th>
                <th></th>
                <th></th>
                <th>
                  Total:
                  {invoiced
                    ? totalQuantityFulfilledUninvoiced
                    : totalQuantityOrderedFulfilments}
                </th>
                <th>
                  Total:
                  {invoiced
                    ? totalQuantityRemainingInvoiceFulfilments
                    : totalQuantityFulfilledFulfilments}
                </th>

                <th className="text-lg">
                  Total:
                  {invoiced
                    ? totalQuantityToFulfillUninvoiced
                    : totalQuantityToInvoiceFulfilments}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-grey-neutral bg-white">
              {!invoiced &&
                filteredFulfilments?.map((product, productIndex) => (
                  <tr
                    key={productIndex}
                    className="cursor-pointer divide-x-2 divide-grey-neutral hover:bg-blue-light"
                  >
                    <td>{product.SaleOrderDate?.slice(0, 10)}</td>
                    <td>{product.SaleOrderNumber}</td>
                    <td>{product.Customer}</td>

                    <td>{product.SKU}</td>
                    <td>{product.Name}</td>
                    <td className="text-center">--</td>

                    <td>
                      {products?.find((p) => p.ID === product.ProductID)?.UOM}
                    </td>
                    <td className="text-right">{product.SaleOrderQuantity}</td>
                    <td className="text-right">{product.Quantity}</td>
                    <td className="text-right">
                      {(product?.SaleOrderQuantity ?? 0) -
                        (product.Quantity ?? 0)}
                    </td>
                  </tr>
                ))}
              {invoiced &&
                filteredUninvoiced?.map((product, productIndex) => (
                  <tr
                    key={productIndex}
                    className="cursor-pointer divide-x-2 divide-grey-neutral hover:bg-blue-light"
                  >
                    <td>{product.SaleOrderDate?.slice(0, 10)}</td>
                    <td>{product.SaleOrderNumber}</td>
                    <td>{product.Customer}</td>
                    <td>{product.SKU}</td>

                    <td>{product.Name}</td>
                    <td className="text-center">
                      #{product.FulfillmentNumber}
                    </td>
                    <td>
                      {products?.find((p) => p.ID === product.ProductID)?.UOM}
                    </td>

                    <td className="text-right">{product.Quantity}</td>
                    <td className="text-right">
                      {product.Quantity -
                        (product.UninvoicedQuantity ?? product.Quantity)}
                    </td>
                    <td className="text-right font-bold">
                      {product.UninvoicedQuantity}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
