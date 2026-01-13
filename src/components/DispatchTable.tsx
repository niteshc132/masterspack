import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { api } from "~/utils/api";
import { Loading } from "./Loading";
import toast from "react-hot-toast";
import { type DispatchGetAllResponse } from "~/server/api/routers/dispatch";
import { SalesOrderStatus, type UnleashedStatus } from "@prisma/client";
import { removePrefix } from "~/lib/utils";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { cn } from "~/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { format } from "date-fns";
const headers = [
  "ID",
  "Dispatch Date",
  "Customer Name",
  "Shipping Company",
  "Address",
  "Status",
  "Tracking #",
  "# of Packages",
  "Shipment Weight",
  "Unleashed",
  "Unleashed Status",
  "",
];

export const DispatchTable = ({ data }: { data: DispatchGetAllResponse }) => {
  const router = useRouter();
  const utils = api.useContext();

  const onRowClick = (id: number) => {
    void router.push({
      pathname: "/dispatch/[bid]",
      query: { bid: id },
    });
  };
  const [processing, setProcessing] = useState<number[]>([]);
  const { mutateAsync: startRpa } = api.unleashed.startRpa.useMutation();
  const { mutateAsync: getStatus } =
    api.unleashed.getStockAdjustmentById.useMutation();

  const { mutate: processDispatch } = api.dispatch.processDispatch.useMutation({
    onSuccess: async () => {
      await utils.dispatch.getAll.refetch();
      await utils.dispatch.getById.refetch();
      toast.success("Dispatch Processed!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSettled(data, error, variables) {
      setProcessing((prev) => prev.filter((id) => id !== +variables.id));
    },
  });

  const { mutateAsync: deleteOrder } = api.dispatch.deleteById.useMutation({
    onSuccess: async () => {
      await utils.dispatch.getAll.refetch();
    },
  });
  const { data: allStockAdjustments } =
    api.unleashed.getStockAdjustments.useQuery();

  const handleDelete = async (id: number) => {
    await toast.promise(deleteOrder({ id: id }), {
      success: "Dispatch Deleted!",
      loading: "Deleting...",
      error: "Error Deleting",
    });
  };

  const [searchCustomerCode, setSearchCustomerCode] = useState("");
  const [searchOrder, setSearchOrder] = useState("");
  const [searchCustomerRef, setSearchCustomerRef] = useState("");
  const [searchStatus, setSearchStatus] = useState<SalesOrderStatus>(
    SalesOrderStatus.PLACED
  );
  const filteredDispatchs = data?.filter(
    (dispatch) =>
      dispatch?.id
        ?.toString()
        .toLowerCase()
        .includes(searchOrder.toLowerCase()) &&
      dispatch?.status?.includes(searchStatus) &&
      dispatch.customerCode
        .toLowerCase()
        .includes(searchCustomerCode.toLowerCase()) &&
      dispatch?.trackingNumber
        ?.toLowerCase()
        .includes(searchCustomerRef.toLowerCase())
  );

  const handleClick = (dispatch: DispatchGetAllResponse[0]) => {
    setProcessing([...processing, dispatch.id]);

    interface DispatchPost {
      Product: {
        ProductCode: string;
      };
      NewQuantity: number;
      NewActualValue: number;
      Comments: string;
    }

    const groupedLines: DispatchPost[] = dispatch.DispatchLines.reduce<
      DispatchPost[]
    >((acc, line) => {
      const existing = acc.find(
        (item) => item.Product.ProductCode === line.productCode
      );
      if (existing) {
        existing.NewQuantity -= line.ship;
        // existing.Comments += `&${line.batchNumber?.trim()}&${line.ship}`;
        existing.Comments += `${line.batchNumber}&${line.ship}$`;
      } else {
        acc.push({
          Product: { ProductCode: line.productCode },
          NewQuantity: -line.ship,
          NewActualValue: 0,
          Comments: line.batchNumber ?? "",
        });
      }
      return acc;
    }, []);

    const newLines = groupedLines.map((line) => ({
      ...line,
      NewQuantity: `-${Math.abs(+line.NewQuantity)}`,
    }));
    console.log("newLines", newLines);
    processDispatch({
      id: dispatch.id,
      lines: newLines,
      location:
        dispatch.DispatchLines[0]?.SalesOrderLines.SalesOrder.warehouse ?? "",
    });
  };
  const getDispatchStatus = async (id: string | null) => {
    if (!id) return undefined;
    const data = await getStatus({ id: id });
    return data;
  };

  const { mutateAsync: updateStatus } = api.dispatch.updateStatus.useMutation();

  useEffect(() => {
    const updateDispatchStatuses = async () => {
      for (const dispatch of data) {
        if (
          !dispatch.statusUnleashed ||
          (dispatch.statusUnleashed === "PARKED" && dispatch.unleashedId)
        ) {
          try {
            const statusData = await getDispatchStatus(dispatch.unleashedId);

            if (statusData) {
              const status = statusData.Status.toUpperCase() as UnleashedStatus;
              dispatch.statusUnleashed = status;
              if (statusData.Status) {
                void updateStatus({
                  id: dispatch.id,
                  status: status,
                });
              }
            }
          } catch (error) {
            console.error(
              `Failed to fetch status for dispatch with id ${dispatch.unleashedId}:`,
              error
            );
          }
        }
      }
    };

    void updateDispatchStatuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <div className=" overflow-x-auto ">
      <div className="inline-block min-w-full py-2 align-middle ">
        <div className="overflow-hidden rounded-2xl ring-1 ring-black ring-opacity-5">
          <table className="min-w-full divide-y divide-gray-300 ">
            <thead className="divide-y  divide-gray-300 bg-slate-50 font-bold text-blue-dark ">
              <tr className="divide-x-2 divide-grey-light border-b-2 border-grey-light">
                {headers.map((header) => (
                  <th key={header} className="px-3 py-2.5 text-left">
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
                <th>
                  <input
                    type="text"
                    placeholder="Search Customer"
                    onChange={(e) => setSearchCustomerCode(e.target.value)}
                    value={searchCustomerCode}
                    className="focus:shadow-outline w-full rounded-lg border border-slate-200 px-3 py-1.5 text-gray-700 focus:outline-none"
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
                <th></th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody className=" divide-y-2 divide-grey-neutral bg-white">
              {filteredDispatchs
                ?.sort((a, b) => b.id - a.id)
                .map((dispatch) => (
                  <tr
                    key={dispatch.id}
                    className="cursor-pointer divide-x-2"
                    onClick={() => onRowClick(dispatch.id)}
                  >
                    <td className="w-3">{dispatch.id}</td>
                    <td>{format(dispatch.dispatchDate, "dd/MM/yyyy")}</td>
                    <td>{dispatch.customerName}</td>
                    <td className="space-y-3">{dispatch.shippingCompany}</td>
                    <td className="space-y-3">{dispatch.address}</td>
                    <td>{dispatch.status}</td>
                    <td className="w-2">{dispatch.trackingNumber}</td>
                    <td className="w-1">{dispatch.numberOfPackages}</td>
                    <td className="w-1">{dispatch.shipmentWeight}</td>

                    <td>
                      {!dispatch.unleashed &&
                        !processing.includes(dispatch.id) && (
                          <button
                            className="pill-pending"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleClick(dispatch);
                            }}
                          >
                            {processing.includes(dispatch.id) ? (
                              <Loading />
                            ) : (
                              "Process?"
                            )}
                          </button>
                        )}
                      {dispatch.unleashed && (
                        <Link
                          href={`https://au.unleashedsoftware.com/v2/StockAdjustments/Update/${
                            +removePrefix(dispatch?.unleashed) + 1
                          }`}
                          target="_blank"
                          className="pill-pending flex gap-x-1"
                        >
                          {dispatch.unleashed} <ExternalLink />
                        </Link>
                      )}
                    </td>
                    <td>
                      {dispatch.statusUnleashed &&
                        (() => {
                          return (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                if (dispatch.statusUnleashed === "PARKED") {
                                  void toast.promise(
                                    startRpa({
                                      target: dispatch.unleashed
                                        ? +removePrefix(dispatch?.unleashed) + 1
                                        : 1,
                                    }),
                                    {
                                      success: "RPA Started",
                                      loading: "Attempting RPA",
                                      error: "AUTH Failed",
                                    }
                                  );
                                }
                              }}
                              className={cn(
                                "mt-[2px] inline-block rounded-[15px] border-2 border-solid px-[10px] font-medium",
                                {
                                  "border-[#f06e23] fill-[#f06e23] text-[#f06e23]":
                                    dispatch.statusUnleashed.toUpperCase() ===
                                    "PARKED",
                                },
                                {
                                  "border-[#65a523] fill-[#65a523] text-[#65a523]":
                                    dispatch.statusUnleashed.toUpperCase() ===
                                    "COMPLETED",
                                }
                              )}
                            >
                              {dispatch.statusUnleashed.toUpperCase()}
                            </span>
                          );
                        })()}
                      {dispatch.statusUnleashed === null &&
                        (() => {
                          const status = allStockAdjustments?.find(
                            (item) =>
                              item.AdjustmentNumber === dispatch.unleashed
                          )?.Status;

                          return (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                if (status?.toUpperCase() === "PARKED") {
                                  void toast.promise(
                                    startRpa({
                                      target:
                                        +removePrefix(
                                          dispatch?.unleashed ?? ""
                                        ) + 1,
                                    }),
                                    {
                                      success: "RPA Started",
                                      loading: "Attempting RPA",
                                      error: "AUTH Failed",
                                    }
                                  );
                                }
                              }}
                              className={cn(
                                "mt-[2px] inline-block rounded-[15px] border-2 border-solid px-[10px] font-medium",
                                {
                                  "border-[#f06e23] fill-[#f06e23] text-[#f06e23]":
                                    status?.toUpperCase() === "PARKED",
                                },
                                {
                                  "border-[#65a523] fill-[#65a523] text-[#65a523]":
                                    status?.toUpperCase() === "COMPLETED",
                                }
                              )}
                            >
                              {status?.toUpperCase()}
                            </span>
                          );
                        })()}
                    </td>
                    <td
                      className="text-right"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDelete(dispatch.id);
                      }}
                    >
                      {!dispatch.unleashed && "DELETE"}
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
