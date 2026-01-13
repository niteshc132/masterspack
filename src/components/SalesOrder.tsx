import { useState } from "react";
import { type SalesOrderGetByIdResponse } from "~/server/api/routers/salesorder";
import { SalesOrderStatus, Warehouse } from "@prisma/client";
import { api } from "~/utils/api";
import toast from "react-hot-toast";
import { useRouter } from "next/router";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "~/components/ui/command";
import { Button } from "~/components/ui/button";
import { type UnleashedProductsGetAllResponse } from "~/server/api/routers/unleashed";
import clsx from "clsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "./ui/calendar";
import { cn } from "~/lib/utils";
import format from "date-fns/format";

interface NewLine {
  id: string;
  line: number;
  productCode: string;
  productDescription: string;
  quantity: number;
  shipped: number;
  invoiced: number;
  unitPrice: number;
  unit: string;
  comments: string;
  salesOrderId: number;
  packToOrderBomId: string;
  packToOrderBomProductCode: string;
  DispatchLines: never[];
}

const NewLineComponent = ({
  newLine,
  setNewLine,
  addNewLine,
  products,
  isAdmin,
}: {
  products: UnleashedProductsGetAllResponse;
  newLine: NewLine;
  setNewLine: React.Dispatch<React.SetStateAction<NewLine>>;
  addNewLine: () => void;
  isAdmin: boolean;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-fit rounded-lg bg-white shadow">
      <div className="w-full p-4">
        <div className="flex w-full space-x-4">
          <div className="flex  flex-col space-y-1">
            <label className="block text-sm font-medium leading-6 text-gray-900">
              Product Code
            </label>

            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className=" w-[250px]  border-none "
                >
                  {newLine.productCode
                    ? newLine?.productCode
                    : "Select Product Code..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="mt-2 h-fit w-[350px] p-0">
                <Command>
                  <CommandInput
                    placeholder="Select Product Code..."
                    className="my-1 h-9 "
                  />
                  <CommandEmpty>No Product.</CommandEmpty>
                  <CommandGroup className="max-h-[200px] overflow-y-scroll">
                    {products?.map((option) => (
                      <CommandItem
                        key={option.Guid}
                        onSelect={() => {
                          setNewLine({
                            ...newLine,
                            productCode: option.ProductCode,
                            productDescription: option.ProductDescription,
                            unit: option?.UnitOfMeasure?.Name,
                            unitPrice: option?.DefaultSellPrice
                              ? +option.DefaultSellPrice
                              : 0,
                          });
                          setOpen(false);
                        }}
                      >
                        {option.ProductCode} - {option.ProductDescription}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex  flex-col space-y-1">
            <label className="block text-sm font-medium leading-6 text-gray-900">
              Product Description
            </label>
            <input
              type="text"
              value={newLine.productDescription}
              onChange={(e) =>
                setNewLine({
                  ...newLine,
                  productDescription: e.target.value,
                })
              }
              className="flex-1 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-primary sm:text-sm sm:leading-6"
            />
          </div>
          <div className="flex  flex-col space-y-1">
            <label className="block text-sm font-medium leading-6 text-gray-900">
              Quantity
            </label>
            <input
              type="number"
              value={newLine.quantity}
              min={0}
              onChange={(e) =>
                setNewLine({
                  ...newLine,
                  quantity: +e.target.value,
                })
              }
              className="flex-1 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-primary sm:text-sm sm:leading-6"
            />
          </div>
          {isAdmin && (
            <div className="flex  flex-col space-y-1">
              <label className="block text-sm font-medium leading-6 text-gray-900">
                Unit Price
              </label>
              <input
                type="number"
                min={0}
                value={newLine.unitPrice}
                onChange={(e) =>
                  setNewLine({
                    ...newLine,
                    unitPrice: +e.target.value,
                  })
                }
                className="flex-1 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-primary sm:text-sm sm:leading-6"
              />
            </div>
          )}
          <div className="flex flex-col justify-end space-y-1">
            <button
              type="button"
              onClick={addNewLine}
              disabled={!newLine.productCode}
              className="rounded-md bg-blue-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-800 focus-visible:bg-sky-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:bg-grey-neutral"
            >
              Add Line
            </button>
          </div>
        </div>
        <div className="flex justify-end"></div>
      </div>
    </div>
  );
};
export const SalesOrder = ({
  salesOrder,
}: {
  salesOrder?: SalesOrderGetByIdResponse | null;
}) => {
  const utils = api.useContext();
  const router = useRouter();
  const { data } = api.users.getRole.useQuery();

  // const isAdmin = data === Role.ADMIN ? true : false;
  const isAdmin = false;
  const { mutateAsync: upsertSalesOrder } =
    api.salesOrder.upsertSaleOrder.useMutation({
      onSuccess: async () => {
        await utils.salesOrder.getAll.refetch();
        await utils.salesOrder.getById.invalidate();
        await router.push("/sales-orders");
      },
    });

  const { data: allProducts } = api.unleashed.getALlProducts.useQuery();
  const { data: allCustomers } = api.unleashed.getCustomers.useQuery();
  const { data: allBoms } = api.boms.getAll.useQuery();
  const transformedBoms = allBoms?.map((bom) => {
    const { id, rawId, finishedGoods, productCode } = bom;
    return {
      id,
      rawId,
      productCode,
      finishedGoods: finishedGoods.map((fg) => ({
        finishedGoodProductID: fg.productId,
        finishedGoodID: fg.id,
        productCode: fg.productCode,
      })),
    };
  });
  const [selectedPeople, setSelectedPeople] = useState<number[]>([]);

  const excludedCategories = ["Packaging"];
  const products = allProducts?.filter(
    (item) => !excludedCategories.includes(item?.ProductGroup?.GroupName)
  );

  const [customerId, setCustomerId] = useState(salesOrder?.customerId ?? "");
  const [customerCode, setCustomerCode] = useState(
    salesOrder?.customerCode ?? ""
  );
  const [customerName, setCustomerName] = useState(
    salesOrder?.customerName ?? ""
  );
  const [customerRef, setCustomerRef] = useState(salesOrder?.customerRef ?? "");
  const [orderWarehouse, setOrderWarehouse] = useState<Warehouse>(
    salesOrder?.warehouse ?? Warehouse.PUKEKAWA
  );
  const [deliveryContact, setDeliveryContact] = useState(
    salesOrder?.deliveryAddress ?? ""
  );
  const [packToOrder, setPackToOrder] = useState<boolean>(
    salesOrder?.packToOrder ?? false
  );
  const [address, setAddress] = useState(salesOrder?.address ?? "");
  const [orderStatus, setOrderStatus] = useState(
    salesOrder?.status ?? SalesOrderStatus.PLACED
  );

  const [orderDate, setOrderDate] = useState<Date | null>(
    salesOrder?.orderDate ? new Date(salesOrder.orderDate) : new Date()
  );
  const [requiredDate, setRequiredDate] = useState<Date | null>(
    salesOrder?.requiredDate ? new Date(salesOrder.requiredDate) : new Date()
  );
  const { data: productStock } = api.unleashed.getProductStockUnleased.useQuery(
    {
      id: "",
    }
  );

  const { mutateAsync: addBin } = api.bins.addBin.useMutation({
    onSuccess: async () => {
      await utils.bins.getById.refetch();
      await utils.bins.getFinishedGoodsForBin.refetch();
      await utils.bins.getAll.refetch();
      await router.push(`/packout/`);
    },
  });
  const [newLine, setNewLine] = useState({
    id: "",
    line: 0,
    productCode: "",
    productDescription: "",
    quantity: 0,
    shipped: 0,
    invoiced: 0,
    unitPrice: 0,
    packToOrderBomId: "",
    packToOrderBomProductCode: "",
    unit: "",
    comments: "",
    salesOrderId: 0,
    DispatchLines: [],
  });

  const [salesOrderLines, setSalesOrderLines] = useState(
    salesOrder?.SalesOrderLines ?? []
  );
  const handleSave = async () => {
    const newSalesOrder = {
      customerCode,
      customerName,
      customerId,
      packToOrder,
      customerRef: customerRef ?? "",
      warehouse: orderWarehouse,
      deliveryAddress: deliveryContact,
      address: address,
      orderDate: orderDate ?? new Date(),
      requiredDate: requiredDate ?? new Date(),
      salesOrderLines,
      status: orderStatus,
    };
    await toast.promise(upsertSalesOrder(newSalesOrder), {
      loading: "Loading...",
      success: "Order Created!",
      error: "Error",
    });

    // const packouts = salesOrderLines
    //   .filter(
    //     (line) => line.packToOrderBomId != null && line.packToOrderBomId !== ""
    //   )
    //   .map((line) => ({
    //     rawId: line.packToOrderBomId,
    //     batchId: "",
    //     batchLocation: "",
    //     customBatch: "",
    //     batchName: "",
    //     staffCount: 0,
    //     timeStart: new Date(),
    //     timeFinish: new Date(),
    //     finishedGoods: [
    //       {
    //         //todo: check
    //         finishedGoodProductID: line?.finishedGoodProductID as string,
    //         finishedGoodID: line?.finishedGoodID as string,
    //         quantity: line.quantity,
    //       },
    //     ],
    //   }));
    // console.log("MAkign bins", packouts);
    // for (const order of packouts)
    //   if (order.rawId) {
    //     await toast.promise(addBin({ ...order, rawId: order.rawId }), {
    //       loading: "Loading...",
    //       success: "Order Created!",
    //       error: "Error",
    //     });
    //   }
  };

  const handleUpdate = async () => {
    const updatedSalesOrder = {
      id: salesOrder?.id,
      customerId,
      customerCode,
      customerName,
      status: orderStatus,
      address: address,
      packToOrder,
      customerRef,
      warehouse: orderWarehouse,
      deliveryAddress: deliveryContact,
      orderDate: orderDate ?? new Date(),
      requiredDate: requiredDate ?? new Date(),
      salesOrderLines: salesOrderLines,
    };
    await toast.promise(upsertSalesOrder(updatedSalesOrder), {
      loading: "Loading...",
      success: "Updated Order.",
      error: "Error",
    });
  };
  const addNewLine = () => {
    setSalesOrderLines([
      ...salesOrderLines,
      {
        ...newLine,
        line: salesOrderLines.length + 1,
      },
    ]);

    setNewLine({
      salesOrderId: 0,
      productCode: "",
      productDescription: "",
      DispatchLines: [],

      quantity: 0,
      shipped: 0,
      invoiced: 0,
      unitPrice: 0,
      packToOrderBomId: "",
      packToOrderBomProductCode: "",
      unit: "",
      comments: "",
      id: "",
      line: salesOrderLines.length + 1,
    });
  };

  const salesOrderTotal = salesOrderLines?.reduce((accumulator, product) => {
    if (product?.quantity) {
      return accumulator + product.quantity * product.unitPrice;
    }
    return accumulator;
  }, 0);
  const salesOrderTotalQuantity = salesOrderLines?.reduce(
    (accumulator, product) => {
      if (product?.quantity) {
        return accumulator + product.quantity;
      }
      return accumulator;
    },
    0
  );

  const salesOrderTotalInvoiced = salesOrderLines?.reduce(
    (accumulator, product) => {
      if (product?.quantity) {
        return accumulator + product.invoiced;
      }
      return accumulator;
    },
    0
  );
  const salesOrderTotalShipped = salesOrderLines?.reduce(
    (accumulator, product) => {
      if (product?.quantity) {
        return accumulator + product.shipped;
      }
      return accumulator;
    },
    0
  );

  return (
    <div className="mx-4 mt-4 flex">
      <div className=" w-full space-y-2">
        <div className="pb-2 pt-4">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            S-{salesOrder?.id?.toString().padStart(6, "0")}
          </h1>
        </div>

        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-3">
          <div className="grid grid-cols-1 gap-6  p-4  md:grid-cols-3 md:gap-12">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium leading-6 text-gray-900">
                  Customer Code *
                </label>
                <div className="mt-2">
                  <Select
                    onValueChange={(e) => {
                      const [CustomerName, CustomerCode, CustomerId] =
                        e.split("--");
                      setCustomerCode(CustomerCode ?? "");
                      setCustomerName(CustomerName ?? "");
                      setCustomerId(CustomerId ?? "");
                      setAddress("");
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {customerCode === "" ? "Select Customer" : customerCode}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {allCustomers?.map((customer, index) => {
                        return (
                          <SelectItem
                            key={index}
                            value={`${customer.CustomerName}--${customer.CustomerCode}--${customer.Guid}`}
                          >
                            {customer.CustomerCode}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium leading-6 text-gray-900">
                  Customer Name
                </label>
                <div className="mt-2">
                  <input
                    value={customerName}
                    disabled
                    type="text"
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-primary sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="first-name"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  PO Reference
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    value={customerRef}
                    onChange={(e) => setCustomerRef(e.target.value)}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-primary sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium leading-6 text-gray-900">
                  Address *
                </label>
                <div className="mt-2">
                  <Select
                    onValueChange={(e) => {
                      setAddress(e);
                    }}
                    disabled={!customerCode}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {address === "" ? "Select Address" : address}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {allCustomers
                        ?.filter((item) => item.CustomerCode === customerCode)
                        .map((customer) =>
                          customer?.Addresses.map((address, index) => {
                            return (
                              <SelectItem
                                key={index}
                                value={address.AddressName}
                              >
                                {address.AddressType}:{address.AddressName}
                              </SelectItem>
                            );
                          })
                        )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium leading-6 text-gray-900">
                  Order Warehouse
                </label>
                <div className="mt-2">
                  <Select
                    defaultValue={orderWarehouse}
                    onValueChange={(e) => {
                      setOrderWarehouse(e as Warehouse);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(Warehouse).map((warehouse, index) => {
                        return (
                          <SelectItem key={index} value={warehouse}>
                            {warehouse}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium leading-6 text-gray-900">
                  Delivery Contact
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    value={deliveryContact}
                    onChange={(e) => setDeliveryContact(e.target.value)}
                    className="block h-28 w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-primary sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium leading-6 text-gray-900">
                  Status
                </label>
                <div className="mt-2">
                  <Select
                    defaultValue={orderStatus}
                    onValueChange={(e) => {
                      setOrderStatus(e as SalesOrderStatus);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={"Select Status"} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(SalesOrderStatus).map((status, index) => {
                        return (
                          <SelectItem key={index} value={status}>
                            {status.replace("_", " ")}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium leading-6 text-gray-900">
                  Order Date
                </label>
                <div className="mt-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
                          !orderDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {orderDate ? (
                          format(orderDate, "dd/MM/yyyy")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={orderDate ?? undefined}
                        onSelect={(value) => {
                          if (value) {
                            setOrderDate(value);
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium leading-6 text-gray-900">
                  Required Date
                </label>
                <div className="mt-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
                          !requiredDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {requiredDate ? (
                          format(requiredDate, "dd/MM/yyyy")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={requiredDate ?? undefined}
                        onSelect={(value) => value && setRequiredDate(value)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="m-1 rounded-sm"
                    checked={packToOrder}
                    onChange={() => {
                      setPackToOrder(!packToOrder);
                    }}
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Pack To Order
                  </label>
                </div>
                <div className="mt-2"></div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
            <button
              disabled={!address || !customerCode}
              onClick={() =>
                salesOrder?.id ? void handleUpdate() : void handleSave()
              }
              className="rounded-md bg-blue-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-dark disabled:bg-gray-300 "
            >
              {salesOrder?.id && "Update"}
              {!salesOrder?.id && !packToOrder && "Save"}
              {!salesOrder?.id && packToOrder && "Create Packouts & Save"}
            </button>
          </div>
        </div>
        <div className="w-full">
          {products && (
            <NewLineComponent
              newLine={newLine}
              setNewLine={setNewLine}
              addNewLine={addNewLine}
              products={products}
              isAdmin={isAdmin}
            />
          )}

          <div>
            <div className="my-2 rounded-lg bg-white  shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className=" align-top">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left align-bottom  text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      Line
                    </th>
                    <th
                      scope="col"
                      className=" px-3 py-3.5 text-left align-bottom  text-sm font-semibold text-gray-900"
                    >
                      Product Code
                    </th>
                    <th
                      scope="col"
                      className=" px-3 py-3.5 text-left align-bottom  text-sm font-semibold text-gray-900 "
                    >
                      Product Description
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left align-bottom  text-sm font-semibold text-gray-900"
                    >
                      UOM
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900"
                    >
                      Quantity
                      <br />
                      <span className="align-bottom  font-light text-gray-400">
                        {salesOrderTotalQuantity}
                      </span>
                    </th>
                    {packToOrder && (
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900"
                      >
                        Stock On Hand
                      </th>
                    )}
                    {isAdmin && (
                      <>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-right  text-sm font-semibold text-gray-900"
                        >
                          Shipped
                          <br />
                          <span className="align-bottom  font-light text-gray-400">
                            {salesOrderTotalShipped}
                          </span>
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900"
                        >
                          Invoiced
                          <br />
                          <span className=" font-light text-gray-400">
                            {salesOrderTotalInvoiced}
                          </span>
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-right align-bottom  text-sm font-semibold text-gray-900"
                        >
                          Unit Price
                        </th>
                      </>
                    )}
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900"
                    >
                      Total
                      <br />
                      <span className="align-bottom  font-light text-gray-400">
                        {salesOrderTotal}
                      </span>
                    </th>
                    <th
                      scope="col"
                      className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                    >
                      <span className="sr-only">Select</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {salesOrderLines?.map((line) => (
                    <tr
                      key={line.line}
                      className={
                        selectedPeople.includes(line.line)
                          ? "bg-gray-50"
                          : undefined
                      }
                    >
                      <td className="relative px-7 sm:w-12 sm:px-6">
                        {selectedPeople.includes(line.line) && (
                          <div className="absolute inset-y-0 left-0 w-0.5 bg-blue-primary" />
                        )}

                        <input
                          type="checkbox"
                          className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-blue-primary focus:ring-blue-primary"
                          value={line.id}
                          checked={selectedPeople.includes(line.line)}
                          onChange={(e) =>
                            setSelectedPeople(
                              e.target.checked
                                ? [...selectedPeople, line.line]
                                : selectedPeople.filter((p) => p !== line.line)
                            )
                          }
                        />
                      </td>
                      <td
                        className={clsx(
                          "whitespace-nowrap py-4 pr-3 text-sm font-bold",
                          selectedPeople.includes(line.line)
                            ? "text-blue-primary"
                            : "text-gray-900"
                        )}
                      >
                        {line.productCode}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {line.productDescription}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {line.unit}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500">
                        <input
                          type="number"
                          value={line.quantity}
                          onChange={(e) => {
                            const updatedLines = salesOrderLines.map((l) => {
                              if (l.line === line.line) {
                                return {
                                  ...l,
                                  quantity: parseInt(e.target.value) || 0,
                                };
                              }
                              return l;
                            });
                            setSalesOrderLines(updatedLines);
                          }}
                        />
                      </td>
                      {packToOrder &&
                        (() => {
                          const stock = productStock?.Items.find(
                            (item) => item.ProductCode === line.productCode
                          )?.Quantity;
                          const foundItems = transformedBoms?.filter((bom) =>
                            bom.finishedGoods.some(
                              (fg) => fg.productCode === line.productCode
                            )
                          );

                          return (
                            <td className="whitespace-nowrap px-3 py-4  text-right text-sm text-gray-500">
                              {stock ?? "---"}
                              {stock && stock < line.quantity && (
                                <Select
                                  onValueChange={(e) => {
                                    const bom = transformedBoms?.filter(
                                      (bom) => bom.id === e
                                    )[0];
                                    const bomFinishedGood =
                                      bom?.finishedGoods.filter(
                                        (good) =>
                                          good.productCode === line.productCode
                                      )[0];
                                    const updatedLines = salesOrderLines.map(
                                      (l) => {
                                        if (l.line === line.line) {
                                          return {
                                            ...l,
                                            packToOrderBomId: bom?.id,
                                            packToOrderBomProductCode:
                                              bom?.productCode,
                                            finishedGoodProductID:
                                              bomFinishedGood?.finishedGoodProductID,
                                            finishedGoodID:
                                              bomFinishedGood?.finishedGoodID,
                                            productCode:
                                              bomFinishedGood?.productCode,
                                          };
                                        }
                                        return l;
                                      }
                                    );
                                    setSalesOrderLines(updatedLines);
                                  }}
                                >
                                  <SelectTrigger className="w-[250px]">
                                    <SelectValue
                                      placeholder={
                                        line.packToOrderBomProductCode ??
                                        "Select BOM"
                                      }
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {foundItems?.map((bom, index) => {
                                      return (
                                        <SelectItem key={index} value={bom.id}>
                                          <span className="text-green-500">
                                            {bom.productCode}
                                          </span>
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                              )}
                            </td>
                          );
                        })()}
                      {isAdmin && (
                        <>
                          <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500">
                            {line.shipped.toFixed(2)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500">
                            {line.invoiced.toFixed(2)}
                          </td>

                          <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500">
                            $
                            <input
                              type="number"
                              value={line.unitPrice}
                              onChange={(e) => {
                                const updatedLines = salesOrderLines.map(
                                  (l) => {
                                    if (l.line === line.line) {
                                      return {
                                        ...l,
                                        unitPrice:
                                          parseInt(e.target.value) || 0,
                                      };
                                    }
                                    return l;
                                  }
                                );
                                setSalesOrderLines(updatedLines);
                              }}
                            />
                          </td>
                        </>
                      )}
                      <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500">
                        {(line.unitPrice * line.quantity).toLocaleString(
                          "en-US",
                          {
                            style: "currency",
                            currency: "USD",
                          }
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {line.comments}
                      </td>
                      {!line.shipped && (
                        <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-3">
                          <button
                            onClick={() =>
                              setSalesOrderLines(
                                salesOrderLines.filter(
                                  (item) => item.line !== line.line
                                )
                              )
                            }
                            className="text-blue-primary hover:text-indigo-900"
                          >
                            Remove
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
