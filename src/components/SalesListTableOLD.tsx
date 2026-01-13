import { api } from "~/utils/api";
import * as XLSX from "xlsx";
import { useState } from "react";
import { SalesOrderStatus } from "@prisma/client";
import { useRouter } from "next/router";
import { cn } from "~/lib/utils";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";

const headers = [
  "Order No.",
  "Order Date",
  "Required Date",
  "Customer Code",
  "Customer Name",
  "Customer Ref",
  "Customer Address",
  "Warehouse",
  "Status",
  "Amount",
  "",
];
interface uninvoicedInterface {
  "Sales Order": number;
  Status: string;
  "Due Date": Date;
  "Customer Code": string;
  "Customer Name": string;
  "Customer Ref": string;
  Warehouse: string;
}

export const ExportToExcelButton = ({
  data,
}: {
  data: uninvoicedInterface[];
}) => {
  const handleDownload = () => {
    const ws = XLSX.utils.json_to_sheet(data);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SalesOrders");
    const title = "SalesOrders.xlsx";
    XLSX.writeFile(wb, title);
  };

  return (
    <button
      className="btn-primary w-fit bg-green-secondary text-sm"
      onClick={handleDownload}
    >
      Download Excel
    </button>
  );
};
export const SalesListTable = () => {
  const { data: salesOrders } = api.salesOrder.getAll.useQuery();
  const utils = api.useContext();

  const [searchCustomerCode, setSearchCustomerCode] = useState("");
  const [searchCustomerName, setSearchCustomerName] = useState("");
  const [searchOrder, setSearchOrder] = useState("");
  const [searchCustomerRef, setSearchCustomerRef] = useState("");
  const [searchStatus, setSearchStatus] = useState<SalesOrderStatus>(
    SalesOrderStatus.PLACED
  );

  const filteredSales = salesOrders?.filter(
    (sale) =>
      sale?.id?.toString().toLowerCase().includes(searchOrder.toLowerCase()) &&
      sale?.customerName
        ?.toLowerCase()
        .includes(searchCustomerName.toLowerCase()) &&
      sale.status.includes(searchStatus) &&
      sale.customerCode
        .toLowerCase()
        .includes(searchCustomerCode.toLowerCase()) &&
      sale.customerRef.toLowerCase().includes(searchCustomerRef.toLowerCase())
  );

  const flattenedData = filteredSales?.map((uninvProduct) => {
    return {
      "Sales Order": uninvProduct.id,
      Status: uninvProduct.status,
      Date: uninvProduct?.orderDate,
      "Due Date": uninvProduct?.requiredDate,
      "Customer Code": uninvProduct.customerCode,
      "Customer Name": uninvProduct.customerName,
      "Customer Ref": uninvProduct.customerRef,
      Warehouse: uninvProduct.warehouse,
    };
  });

  const { mutateAsync: deleteOrder } = api.salesOrder.deleteById.useMutation({
    onSuccess: async () => {
      await utils.salesOrder.getAll.invalidate();
    },
  });
  const router = useRouter();

  const onRowClick = (id: number) => {
    void router.push({
      pathname: "/sales-orders/[bid]",
      query: { bid: id },
    });
  };
  const handleDelete = async (id: number) => {
    await toast.promise(deleteOrder({ id: id }), {
      success: "Order Deleted!",
      loading: "Deleting...",
      error: "Error Deleting",
    });
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="my-1 flex h-16 w-full  items-center space-x-5">
        <button
          onClick={() => {
            setSearchCustomerName("");
            setSearchCustomerRef("");
            setSearchOrder("");
            setSearchCustomerCode("");
          }}
          className="btn-outline w-fit border-red-500 text-sm text-red-500 outline-none"
        >
          CLEAR SEARCH
        </button>
        {flattenedData && <ExportToExcelButton data={flattenedData} />}
      </div>
      <div className="w-full py-2 align-middle">
        <div className="border-1 w-full overflow-hidden border-grey-neutral shadow-md ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="medium min-w-full divide-y-2">
            <thead className="bg-slate-50 font-bold text-grey-medium">
              <tr>
                {headers.map((header) => (
                  <th
                    key={header}
                    className="px-3 py-2.5 text-left text-blue-dark hover:bg-blue-light"
                  >
                    {header}
                  </th>
                ))}
              </tr>
              <tr>
                <th>
                  <input
                    type="text"
                    placeholder="#"
                    onChange={(e) => setSearchOrder(e.target.value)}
                    value={searchOrder}
                    className="focus:shadow-outline w-full rounded-lg border border-slate-200 border-opacity-5 px-3 py-1.5 text-gray-700 focus:outline-none"
                  />
                </th>
                <th></th>
                <th></th>

                <th>
                  <input
                    type="text"
                    placeholder="Search Code"
                    onChange={(e) => setSearchCustomerCode(e.target.value)}
                    value={searchCustomerCode}
                    className="focus:shadow-outline w-full rounded-lg border border-slate-200 px-3 py-1.5 text-gray-700 focus:outline-none"
                  />
                </th>
                <th>
                  <input
                    type="text"
                    placeholder="Search Name"
                    onChange={(e) => setSearchCustomerName(e.target.value)}
                    value={searchCustomerName}
                    className="focus:shadow-outline w-full rounded-lg border border-slate-200 px-3 py-1.5 text-gray-700 focus:outline-none"
                  />
                </th>
                <th>
                  <input
                    type="text"
                    placeholder="Search Ref"
                    onChange={(e) => setSearchCustomerRef(e.target.value)}
                    value={searchCustomerRef}
                    className="focus:shadow-outline w-full rounded-lg  border border-slate-200 px-3 py-1.5 text-gray-700 focus:outline-none"
                  />
                </th>

                <th></th>
                <th></th>
                <th>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="focus:shadow-outline textfont-semibold w-full  rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-bold focus:outline-none"
                      >
                        <span className="">
                          {searchStatus.replace("_", " ")}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {Object.values(SalesOrderStatus).map((status, index) => {
                        return (
                          <DropdownMenuItem
                            key={index}
                            onClick={() => setSearchStatus(status)}
                          >
                            {status.replace("_", " ")}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-grey-light bg-white">
              {filteredSales
                ?.sort((a, b) => b.id - a.id)
                .map((sale, productIndex) => {
                  return (
                    <tr
                      key={productIndex}
                      className="cursor-pointer divide-x-2 divide-grey-light hover:bg-slate-50"
                      onClick={() => onRowClick(sale.id)}
                    >
                      <Link href={`/sales-orders/${sale.id}`}>
                        <td>{sale.id}</td>
                      </Link>

                      <td>{sale.orderDate.toLocaleDateString()}</td>
                      <td>{sale.requiredDate.toLocaleDateString()}</td>

                      <td>{sale.customerCode}</td>
                      <td>{sale.customerName}</td>
                      <td>{sale.customerRef}</td>
                      <td>{sale.address}</td>

                      <td className="text-right">{sale.warehouse}</td>
                      <td>
                        <span
                          className={cn(
                            "mt-[2px] inline-block rounded-[15px] border-2 border-solid px-[10px] font-medium",
                            {
                              "border-[#f06e23] fill-[#f06e23] text-[#f06e23]":
                                sale.status === "PLACED",
                            }
                          )}
                        >
                          {sale.status}
                        </span>
                      </td>
                      <td className="text-right">
                        {sale.SalesOrderLines.reduce(
                          (acc, line) =>
                            acc + (line.quantity * line.unitPrice ?? 0),
                          0
                        ).toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                        })}
                      </td>
                      {sale.SalesOrderLines.some(
                        (orderLine) => orderLine.shipped
                      ) ? (
                        <td></td>
                      ) : (
                        <td
                          className="text-right"
                          onClick={() => void handleDelete(sale.id)}
                        >
                          DELETE
                        </td>
                      )}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
