import { AddButton } from "~/components/AddButton";
import { useState } from "react";
import { format } from "date-fns";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/solid";

import type {
  BinsGetFinishedGoods,
  BinsGetByIdResponse,
} from "~/server/api/routers/bins";
import { api } from "~/utils/api";
import toast from "react-hot-toast";
import { useRouter } from "next/router";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@radix-ui/react-popover";
import React from "react";
import TimePicker from "./TimePicker";
import { BomModal } from "./BomModal";
import { Loading } from "./Loading";
import { ProductList } from "./ProductList";
import { RawCombobox } from "./ArrowTable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "./ui/dialog";
import { cn } from "~/lib/utils";
import type { ProductStockUnleashed } from "~/utils/interfaces";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";

export const BinDetail = ({
  data,
  binProducts,
  date,
}: {
  data?: BinsGetByIdResponse | null;
  binProducts: BinsGetFinishedGoods | null;
  date?: Date;
}) => {
  const utils = api.useContext();
  const router = useRouter();
  const disabled = false;

  const [bomRaw, setBomRaw] = useState<string>();
  const { data: products } = api.unleashed.getALlProducts.useQuery();
  const { data: allBoms } = api.boms.getAll.useQuery();
  const { data: productStock, isFetching: isLoadingStock } =
    api.unleashed.getProductStockUnleased.useQuery({
      id: bomRaw,
    });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);

  const [selectedBatches, setSelectedBatches] = useState(
    data?.BinBatchAssociation ?? []
  );

  const [variety, setVariety] = useState(data?.rawId ?? "");
  const [totalBinsUsed, setTotalBinsUsed] = useState<number>(
    data?.totalBinsUsed ?? 1
  );
  const [batchName, setBatchName] = useState(data?.batchName ?? "");
  const [batchID, setBatchID] = useState(data?.batchId ?? "");
  const [batchLocation, setBatchLocation] = useState(data?.batchLocation ?? "");

  const [customBatch, setCustomBatch] = useState(data?.customBatch ?? "");

  const [batchModalSearch, setBatchModalSearch] = useState<string>("");

  const [staffCount, setStaffCount] = useState<number | null>(
    data?.staffCount ?? 1
  );
  const [selectedProducts, setSelectedProducts] = useState(binProducts ?? []);
  const [timeStart, setTimeStart] = useState<Date>(
    data?.timeStart ?? new Date()
  );

  const [timeFinish, setTimeFinish] = useState<Date>(
    data?.timeFinish ?? new Date()
  );

  const { mutateAsync, isLoading: isProcessing } = api.bins.addBin.useMutation({
    onSuccess: async () => {
      await utils.bins.getById.refetch();
      await utils.bins.getFinishedGoodsForBin.refetch();
      await utils.bins.getAll.refetch();
      await router.push(`/packout/`);
    },
  });

  const { mutate: updateStatus, isLoading } =
    api.bins.updateCin7Status.useMutation({
      onSuccess: async () => {
        await utils.bins.getById.invalidate();
        await utils.bins.getAll.refetch();
      },
    });

  const onEditClick = () => {
    if (!data?.id) return;
    updateStatus({
      id: data.id,
      status: null,
    });
  };

  const onStaffNumberChange = (value: string) => {
    setStaffCount(value.length > 0 ? +value : null);
  };

  const onSaveBinsClick = async () => {
    if (!variety) {
      toast.error("Please select a BOM");
      return;
    }
    if (!customBatch) {
      toast.error("Please enter a batch name");
      return;
    }
    if (customBatch.includes(",")) {
      toast.error("Batch name cannot include character ','");
      return;
    }
    if (!selectedBatches[0]) {
      toast.error("Please select at least one batch");
      return;
    }
    if (
      selectedBatches.reduce(
        (total, item) => total + (item?.quantity ?? 0),
        0
      ) !== totalBinsUsed
    ) {
      toast.error("Batch(s) Quantity must be equal or less than bins used!");
      return;
    }
    const finishedGoods = selectedProducts.map((fg) => ({
      finishedGoodProductID: fg?.finishedGoodProductID,
      finishedGoodID: fg?.finishedGoodID,
      quantity: fg?.quantity ?? 0,
      comment: fg.comment ?? "",
    }));

    const reqData = {
      id: data?.id ?? "",
      rawId: variety ?? "",
      totalBinsUsed: totalBinsUsed ?? 0,
      batchName,
      batchId: batchID,
      batchLocation: batchLocation,
      customBatch,
      staffCount: staffCount ?? 0,
      timeFinish,
      createdAt: data?.id ? new Date() : date,
      timeStart,
      finishedGoods,
      batches: selectedBatches,
    };
    await toast.promise(mutateAsync(reqData), {
      success: "Bins saved",
      loading: "Saving",
      error: "There was an error saving",
    });
  };
  const filteredProducts = productStock?.Items?.filter(
    (batch) => !!batch.ProductCode
  );
  const [showSelectBatches, setShowSelectBatches] = useState(false);
  const productComboboxItems: { label: string; value: string }[] =
    filteredProducts?.map((batch) => ({
      label: `${batch.ProductCode ?? "null"}--${batch.WarehouseCode}--${
        batch.Number
      }--(${batch.Quantity})`,
      value: `${batch.ProductCode}--${batch.Number}--${batch.WarehouseCode}`,
    })) ?? [];

  const bomItems = allBoms?.map((bom) => ({
    label: `${bom.name}`,
    value: `${bom.id}`,
  }));

  const finishedGoods =
    allBoms?.find((bom) => bom.id === variety)?.finishedGoods ?? [];

  const handleQuantityChange = (
    quantity: number,
    item: ProductStockUnleashed
  ) => {
    if (quantity === 0) {
      const updatedBatches = selectedBatches.filter(
        (batch) => batch.batchId !== item.Guid
      );
      setSelectedBatches(updatedBatches);
    } else {
      const existingItemIndex = selectedBatches.findIndex(
        (batch) => batch.batchId === item.Guid
      );

      if (existingItemIndex !== -1) {
        const updatedBatches = [...selectedBatches];
        updatedBatches[existingItemIndex] = {
          ...item,
          quantity: quantity,
          binId: "",
          batchLocation: item.WarehouseCode,
          batchId: item.Guid,
          batchName: item.Number,
          id: 0,
        };
        setSelectedBatches(updatedBatches);
      } else {
        setSelectedBatches([
          ...selectedBatches,
          {
            ...item,
            quantity: quantity,
            binId: "",
            batchLocation: item.WarehouseCode,
            batchId: item.Guid,
            batchName: item.Number,
            id: 0,
          },
        ]);
      }
    }
  };

  return (
    <div className="w-full">
      {disabled && (
        <button className="btn-outline my-3 py-1" onClick={onEditClick}>
          Edit
          {isLoading && <Loading />}
        </button>
      )}
      <div className="flex flex-row space-x-4">
        <div className="flex w-fit rounded-md">
          <div>
            <div className="w-[600px] overflow-hidden rounded-lg shadow-md  ring-1 ring-black ring-opacity-5">
              <table className=" w-full border-collapse ">
                <tbody className=" w-full divide-y divide-grey-light">
                  <tr className="add-bins-table-row">
                    <td className="add-bins-table-head">BOM</td>
                    <td className="bg-white p-0">
                      <RawCombobox
                        disabled={disabled}
                        items={bomItems ?? []}
                        value={variety ?? ""}
                        side="bottom"
                        onChange={(e) => {
                          setVariety(e);
                          setBomRaw(
                            allBoms?.find((bom) => bom.id === e)?.productCode ??
                              ""
                          );
                        }}
                      />
                    </td>
                  </tr>
                  <tr className="add-bins-table-row ">
                    <td className="add-bins-table-head  truncate ">
                      Total Bins Used
                    </td>
                    <td className="add-bins-table-cell w-full">
                      <input
                        className="table-input"
                        disabled={disabled}
                        value={totalBinsUsed ?? ""}
                        type="number"
                        onChange={(e) => setTotalBinsUsed(+e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                      />
                      <button
                        disabled={disabled || !totalBinsUsed}
                        className="flex aspect-square w-12 items-center justify-center rounded-l-md bg-white text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                        onClick={() => setTotalBinsUsed(totalBinsUsed - 1)}
                      >
                        <ChevronLeftIcon
                          className="h-7 w-7"
                          aria-hidden="true"
                        />
                      </button>
                      <button
                        disabled={disabled}
                        className="mr-3 flex aspect-square w-12 items-center justify-center rounded-r-md bg-white text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                        onClick={() =>
                          setTotalBinsUsed(
                            totalBinsUsed ? totalBinsUsed + 1 : 1
                          )
                        }
                      >
                        <ChevronRightIcon
                          className="h-7 w-7"
                          aria-hidden="true"
                        />
                      </button>
                      <PencilSquareIcon className="aspect-square h-[42px] text-grey-medium" />
                    </td>
                  </tr>
                  <tr className="add-bins-table-row">
                    <td className="add-bins-table-head">Batch</td>
                    <td className="bg-white p-0">
                      {isLoadingStock && <Loading />}
                      {!isLoadingStock && batchID && (
                        <RawCombobox
                          items={productComboboxItems ?? []}
                          disabled={disabled}
                          value={`${batchID}--${batchName}--${batchLocation}`}
                          side="bottom"
                          onChange={(selectedValue) => {
                            const [
                              selectedBatchId,
                              selectedBatchName,
                              selectedLocation,
                            ] = selectedValue.split("--");
                            setBatchName(selectedBatchName ?? "");
                            setBatchID(selectedBatchId ?? "");
                            setBatchLocation(selectedLocation ?? "");
                          }}
                        />
                      )}

                      {!isLoadingStock && !batchID && (
                        <Dialog
                          open={batchDialogOpen}
                          onOpenChange={(open) => {
                            setBatchDialogOpen(open);
                            if (selectedBatches.length === 1) {
                              setCustomBatch(
                                selectedBatches[0]?.batchName ?? ""
                              );
                            } else {
                              setCustomBatch("");
                            }
                          }}
                        >
                          <DialogTrigger className="px-4" disabled={!variety}>
                            {selectedBatches && selectedBatches.length > 0
                              ? `${selectedBatches.length} Batches Selected`
                              : "Select Batch"}
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogDescription>
                                <div className="flex flex-col gap-4">
                                  <Input
                                    placeholder="Search Batch"
                                    onChange={(e) =>
                                      setBatchModalSearch(e.target.value)
                                    }
                                    value={batchModalSearch}
                                  />
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="include"
                                      className="border-grey-neutral"
                                      checked={showSelectBatches}
                                      onCheckedChange={() =>
                                        setShowSelectBatches(!showSelectBatches)
                                      }
                                    />
                                    <label
                                      htmlFor="include"
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                      Show selected batches only
                                    </label>
                                    <span className="text-md items-center">
                                      {selectedBatches.reduce(
                                        (total, item) =>
                                          total + (item?.quantity ?? 0),
                                        0
                                      ) +
                                        "/" +
                                        totalBinsUsed}
                                    </span>
                                  </div>
                                  <label className="flex justify-center  text-rose-700">
                                    Batchs can only be selected from the same
                                    warehouse
                                  </label>
                                </div>
                              </DialogDescription>
                            </DialogHeader>

                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[100px]">
                                    Number
                                  </TableHead>
                                  <TableHead>Warehouse</TableHead>
                                  <TableHead>Quantity</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredProducts
                                  ?.filter(
                                    (item) =>
                                      item.ProductCode ===
                                      allBoms?.find((bom) => bom.id === variety)
                                        ?.productCode
                                  )
                                  ?.filter(
                                    (item) =>
                                      item.Number.toLowerCase().includes(
                                        batchModalSearch.toLowerCase()
                                      ) &&
                                      (!showSelectBatches ||
                                        selectedBatches.some(
                                          (batch) => batch.batchId === item.Guid
                                        ))
                                  )
                                  .map((item) => {
                                    const selectedItem = selectedBatches.find(
                                      (batch) => batch.batchId === item.Guid
                                    );
                                    const inputValue = selectedItem
                                      ? selectedItem.quantity
                                      : 0;
                                    return (
                                      <TableRow key={item.Guid}>
                                        <TableCell className="font-semibold">
                                          {item.Number}
                                        </TableCell>
                                        <TableCell>
                                          {item.WarehouseCode}
                                        </TableCell>
                                        <TableCell>{item.Quantity}</TableCell>
                                        <TableCell className="w-full">
                                          <Input
                                            type="number"
                                            disabled={
                                              selectedBatches.find(
                                                (batch) =>
                                                  batch.batchLocation !==
                                                  item.WarehouseCode
                                              ) !== undefined
                                            }
                                            min="0"
                                            className="w-full"
                                            value={inputValue ?? 0}
                                            onChange={(e) => {
                                              handleQuantityChange(
                                                +e.target.value,
                                                item
                                              );
                                            }}
                                          />
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                              </TableBody>
                            </Table>
                            <DialogFooter>
                              <Button
                                className="bg-blue-primary hover:bg-blue-950"
                                onClick={() => {
                                  setBatchDialogOpen(false);
                                  if (selectedBatches.length === 1) {
                                    setCustomBatch(
                                      selectedBatches[0]?.batchName ?? ""
                                    );
                                  } else {
                                    setCustomBatch("");
                                  }
                                }}
                              >
                                Confirm
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </td>
                  </tr>
                  <tr className="add-bins-table-row">
                    <td className="add-bins-table-head">Custom Batch #</td>
                    <td className="bg-white p-0">
                      {
                        <input
                          type="text"
                          value={customBatch ?? ""}
                          onChange={(e) => setCustomBatch(e.target.value)}
                          placeholder="Enter Custom Batch Name"
                          className={cn(
                            "h-max w-fit border-0",
                            !customBatch ?? "border-red-500"
                          )}
                        />
                      }
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="my-4 overflow-hidden shadow-md ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="w-full border-collapse">
                <tbody className="divide-y divide-grey-neutral">
                  <tr className="add-bins-table-row">
                    <td className="add-bins-table-head">No. Staff</td>
                    <td className="add-bins-table-cell w-full">
                      <input
                        className="table-input"
                        value={staffCount ?? ""}
                        disabled={disabled}
                        type="number"
                        min={0}
                        onChange={(e) => onStaffNumberChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                      />
                      <button
                        disabled={disabled || !staffCount}
                        className="flex aspect-square w-12 items-center justify-center rounded-l-md bg-white text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                        onClick={() => setStaffCount(staffCount! - 1)}
                      >
                        <ChevronLeftIcon
                          className="h-7 w-7"
                          aria-hidden="true"
                        />
                      </button>
                      <button
                        disabled={disabled}
                        className="mr-3 flex aspect-square w-12 items-center justify-center rounded-r-md bg-white text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                        onClick={() =>
                          setStaffCount(staffCount ? staffCount + 1 : 1)
                        }
                      >
                        <ChevronRightIcon
                          className="h-7 w-7"
                          aria-hidden="true"
                        />
                      </button>
                      <PencilSquareIcon className="aspect-square h-[42px] text-grey-medium" />
                    </td>
                  </tr>
                  <tr className="add-bins-table-row">
                    <td className="add-bins-table-head">Time Start</td>
                    <td className="add-bins-table-cell w-full">
                      <Popover>
                        <PopoverTrigger asChild disabled={disabled}>
                          <button>{format(timeStart, "h:mm a")}</button>
                        </PopoverTrigger>
                        <TimePicker
                          initialTime={timeStart}
                          onTimeChange={setTimeStart}
                        />
                      </Popover>
                      <ClockIcon className="aspect-square h-[42px] text-grey-medium" />
                    </td>
                  </tr>
                  <tr className="add-bins-table-row">
                    <td className="add-bins-table-head">Time Finish</td>
                    <td className="add-bins-table-cell w-full">
                      <Popover>
                        <PopoverTrigger asChild disabled={disabled}>
                          <button>{format(timeFinish, "h:mm a")}</button>
                        </PopoverTrigger>
                        <PopoverContent>
                          <TimePicker
                            initialTime={timeFinish}
                            onTimeChange={setTimeFinish}
                          />
                        </PopoverContent>
                      </Popover>
                      <ClockIcon className="aspect-square h-[42px] text-grey-medium" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {!disabled && (
              <AddButton
                onClick={() => setDialogOpen(true)}
                label="Add Product"
                disabled={!variety}
              />
            )}
          </div>
          <BomModal
            finishedGoods={finishedGoods}
            allProducts={products}
            dialogOpen={dialogOpen}
            setDialogOpen={setDialogOpen}
            selectedProducts={selectedProducts}
            setSelectedProducts={setSelectedProducts}
          />
        </div>
        {products && (
          <ProductList
            selectedProducts={selectedProducts}
            unleasedProducts={products}
            setSelectedProducts={setSelectedProducts}
            disabled={disabled}
          />
        )}
      </div>
      {!disabled && (
        <button
          className="btn-primary disabled:bg-gr mt-6"
          onClick={() => void onSaveBinsClick()}
          disabled={isProcessing}
        >
          Save Bins
        </button>
      )}
    </div>
  );
};
