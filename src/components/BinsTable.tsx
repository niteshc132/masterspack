import { format } from "date-fns";
import type { BinsGetAllResponse } from "~/server/api/routers/bins";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { api } from "~/utils/api";
import { removePrefix } from "~/lib/utils";
import { cn } from "~/lib/utils";
import { Loading } from "./Loading";
import type { Cin7StockAdjustmentPost } from "~/utils/interfaces";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { UnleashedStatus } from "@prisma/client";

const headers = [
  "ID",
  "Raw/Bulk",
  "Bins Consumed Count",
  "Items Produced Count",
  "No. Staff",
  "Start Time",
  "Finish Time",
  "Unleashed",
  "Status",
  "",
];

export const BinsTable = ({ data }: { data: BinsGetAllResponse }) => {
  const router = useRouter();
  const utils = api.useContext();
  const { data: allStockAdjustments } =
    api.unleashed.getStockAdjustments.useQuery();

  const onRowClick = (id: string) => {
    void router.push({
      pathname: "/bins/[bid]",
      query: { bid: id },
    });
  };
  const [processing, setProcessing] = useState<string[]>([]);

  const { mutateAsync: getFinishedGoods } =
    api.products.getFinishedGood.useMutation({});

  const { data: allBoms } = api.boms.getAll.useQuery();

  const { mutate: processBin } = api.bins.processBin.useMutation({
    onSuccess: async () => {
      await utils.bins.getAll.refetch();
      await utils.bins.getById.refetch();
      toast.success("Bin Processed");
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSettled(data, error, variables) {
      setProcessing((prev) => prev.filter((id) => id !== variables.id));
    },
  });
  const { mutateAsync: startRpa } = api.unleashed.startRpa.useMutation();
  const { mutateAsync: deleteBin } = api.bins.deleteById.useMutation({
    onSuccess: async () => {
      await utils.bins.getAll.refetch();
    },
  });
  const { mutateAsync: updateStatus } = api.bins.updateStatus.useMutation();

  const handleDelete = async (id: string) => {
    await toast.promise(deleteBin({ id: id }), {
      success: "Packout Deleted!",
      loading: "Deleting...",
      error: "Error Deleting",
    });
  };

  const handleClick = async (bin: BinsGetAllResponse[0]) => {
    const finishedGoodIds = bin.BinFinishedGoodAssociation.map(
      (item) => item.finishedGoodID
    );

    const combinedProductsMap = new Map<string, Cin7StockAdjustmentPost>();

    bin.BinFinishedGoodAssociation.forEach((item) => {
      const key = `${item.finishedGoodProductID}-${bin.batchName}-${bin.batchLocation}`;
      const existingProduct = combinedProductsMap.get(key);

      if (existingProduct) {
        combinedProductsMap.set(key, {
          ...existingProduct,
          Quantity: existingProduct.Quantity + item.quantity,
        });
      } else {
        combinedProductsMap.set(key, {
          ProductID: item.finishedGoodProductID,
          Quantity: item.quantity,
          type: "finished",
          UnitCost: 1,
          Location: bin.batchLocation ?? "",
          BatchSN: bin.batchName ?? "",
          Comment: bin.customBatch ?? "",
        });
      }
    });

    const rawAdjust: Cin7StockAdjustmentPost[] = [
      {
        ProductID: allBoms?.find((bom) => bom.id === bin.rawId)?.rawId ?? "",
        Quantity: bin.totalBinsUsed,
        type: "raw",
        UnitCost: 1,
        Location: bin.batchLocation ?? "",
        BatchSN: bin.batchName ?? "",
        Comment: bin.customBatch ?? "",
      },
    ];

    const finishedGood = await getFinishedGoods(finishedGoodIds);
    if (finishedGood) {
      const consumedProductInfo = finishedGood.flatMap((good) => {
        const assocQuantity =
          bin.BinFinishedGoodAssociation.find(
            (assoc) => assoc.finishedGoodID === good.id
          )?.quantity ?? 1;

        return good.consumedProducts.map((product) => {
          const key = `${product.productId}-${bin.batchName}-${bin.batchLocation}`;
          const existingProduct = combinedProductsMap.get(key);
          if (existingProduct) {
            return {
              ...existingProduct,
              Quantity:
                existingProduct.Quantity + product.quantity * assocQuantity,
            };
          } else {
            return {
              ProductID: product.productId,
              Quantity: product.quantity * assocQuantity,
              type: "consumed",
              UnitCost: 1,
              Location: bin.batchLocation ?? "",
              BatchSN: bin.batchName ?? "",
              Comment: bin.customBatch ?? "",
            };
          }
        });
      });

      const allProducts = [
        ...Array.from(combinedProductsMap.values()),
        ...consumedProductInfo,
        ...rawAdjust,
      ];

      setProcessing([...processing, bin.id]);
      processBin({
        products: allProducts,
        id: bin.id,
        binID: bin.binId ?? 0,
        location: bin.batchLocation ?? "",
      });
    }
  };

  const { mutateAsync: getStatus } =
    api.unleashed.getStockAdjustmentById.useMutation();
  useEffect(() => {
    const updateDispatchStatuses = async () => {
      for (const bin of data) {
        if (
          !bin.unleashedStatus ||
          (bin.unleashedStatus === "PARKED" && bin.unleashedId)
        ) {
          try {
            if (!bin.unleashedId) return;
            const statusData = await getStatus({ id: bin.unleashedId });
            const status = statusData.Status.toUpperCase() as UnleashedStatus;
            bin.unleashedStatus = status;
            if (statusData.Status) {
              void updateStatus({
                id: bin.id,
                status,
              });
            }
          } catch (error) {
            console.error(
              `Failed to fetch status for dispatch with id ${bin.unleashedId}:`,
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
    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
      <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8 ">
        <div className="overflow-hidden rounded-2xl ring-1 ring-black ring-opacity-5">
          <table className="min-w-full divide-y divide-gray-100 ">
            <thead className="divide-y  divide-gray-100 bg-slate-50 font-bold text-blue-dark ">
              <tr className="divide-x divide-gray-100  border-grey-light">
                {headers.map((header) => (
                  <th key={header} className="px-3 py-2.5 text-left">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className=" divide-y divide-gray-200 bg-white">
              {data.map((bin) => (
                <tr
                  key={bin.id}
                  className="cursor-pointer divide-x-2"
                  onClick={() => onRowClick(bin.id)}
                >
                  <td>{bin.binId}</td>

                  <td>{allBoms?.find((bom) => bom.id === bin.rawId)?.name}</td>
                  <td>{bin.totalBinsUsed}</td>
                  <td className="space-y-3">
                    {bin.BinFinishedGoodAssociation.reduce(
                      (total, item) => total + item.quantity,
                      0
                    ).toFixed(2)}
                  </td>
                  <td>{bin.staffCount}</td>
                  <td>{format(bin.timeStart, "h:mm a")}</td>
                  <td>{format(bin.timeFinish, "h:mm a")}</td>
                  <td
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    {bin.unleashed && (
                      <Link
                        href={`https://au.unleashedsoftware.com/v2/StockAdjustments/Update/${
                          +removePrefix(bin?.unleashed) + 1
                        }`}
                        target="_blank"
                        className="pill-pending flex gap-x-1"
                      >
                        {bin.unleashed} <ExternalLink />
                      </Link>
                    )}
                    {!bin.unleashed && !processing.includes(bin.id) && (
                      <span
                        onClick={() => {
                          void handleClick(bin);
                        }}
                        className="pill-pending"
                      >
                        Process?
                      </span>
                    )}
                    {processing.includes(bin.id) && <Loading />}
                  </td>

                  <td>
                    {bin.unleashedStatus &&
                      (() => {
                        // const status = allStockAdjustments?.find(
                        //   (item) =>
                        //     item.AdjustmentNumber === dispatch.unleashed
                        // )?.Status;
                        return (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              if (
                                bin.unleashedStatus?.toUpperCase() === "PARKED"
                              ) {
                                void toast.promise(
                                  startRpa({
                                    target: bin.unleashed
                                      ? +removePrefix(bin?.unleashed) + 1
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
                                  bin.unleashedStatus.toUpperCase() ===
                                  "PARKED",
                              },
                              {
                                "border-[#65a523] fill-[#65a523] text-[#65a523]":
                                  bin.unleashedStatus.toUpperCase() ===
                                  "COMPLETED",
                              }
                            )}
                          >
                            {bin.unleashedStatus.toUpperCase()}
                          </span>
                        );
                      })()}
                    {bin.unleashedStatus === null &&
                      (() => {
                        const status = allStockAdjustments?.find(
                          (item) => item.AdjustmentNumber === bin.unleashed
                        )?.Status;
                        // const adjustment = getStatus({
                        //   id: dispatch.unleashedId,
                        // });
                        // console.log(adjustment);
                        // const status = adjustment[0]?.Status;
                        return (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              if (status?.toUpperCase() === "PARKED") {
                                void toast.promise(
                                  startRpa({
                                    target: bin.unleashed
                                      ? +removePrefix(bin?.unleashed) + 1
                                      : 0,
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
                  <td onClick={(e) => e.stopPropagation()}>
                    {!bin.unleashed && (
                      <Dialog>
                        <DialogTrigger>Delete</DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Bin?</DialogTitle>
                            <DialogDescription>
                              This action cannot be undone. This will
                              permanently delete this packout and remove your
                              data from our servers.
                              <br />
                              <button
                                className="btn-primary mt-2"
                                onClick={() => void handleDelete(bin.id)}
                              >
                                Confirm
                              </button>
                            </DialogDescription>
                          </DialogHeader>
                        </DialogContent>
                      </Dialog>
                    )}
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
