import { useState } from "react";
import { api } from "~/utils/api";
import type {
  UpsertDispatchInput,
  DispatchGetByIdResponse,
} from "~/server/api/routers/dispatch";
import { type Product, SalesOrderStatus } from "@prisma/client";
import toast from "react-hot-toast";
import Link from "next/link";
import { DispatchLinesTable } from "./DispatchLinesTable";
import { Button } from "~/components/ui/button";
import { Input } from "./ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useRouter } from "next/router";
import { type CustomerUnleashed } from "~/utils/interfaces";
import { CalendarIcon, ExternalLink, PlusCircle } from "lucide-react";
import { cn, removePrefix } from "~/lib/utils";
import format from "date-fns/format";
import { Calendar } from "./ui/calendar";

type NewLineDispatch = DispatchGetByIdResponse["DispatchLines"][number];
type NewCrateLine = DispatchGetByIdResponse["CrateLines"][number];

enum CrateSKU {
  BFR = "BFR",
  H47 = "H47",
  H61 = "H61",
  PALLET = "PALLET",
  FCCPALLET_P3 = "FCCPALLET_P3",
  D47 = "D47",
  T47 = "T47",
}

enum CustomerType {
  Default = "Default",
  UPL = "UPL",
  Export = "Export",
}
const crateLineHeader = ["SKU", "Quantity", "ref"];

export const getGeneratedReport = async (
  reportId: string,
  dispatchId: string
) => {
  const url = `https://api.carbone.io/render/${reportId}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "carbone-version": "4",
      Authorization: process.env.NEXT_PUBLIC_CARBONE_API_KEY!,
    },
  });
  if (response.ok) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `D-${dispatchId.toString().padStart(6, "0")}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  } else {
    console.error(
      "Failed to download PDF:",
      response.status,
      response.statusText
    );
  }
};

export const generateReport = async (
  templateId: string,
  dispatch: DispatchGetByIdResponse,
  customer: CustomerUnleashed,
  allProducts?: Product[]
) => {
  interface ResponseBody {
    success: boolean;
    data: {
      renderId: string;
    };
  }

  const transformedDispatchLines = dispatch.DispatchLines.map((item) => ({
    code: item.productCode,
    CustCode: dispatch?.customerCode?.includes("T&G")
      ? allProducts?.find((x) => x.productCode === item.productCode)?.TGcode ??
        ""
      : dispatch.customerCode.includes("MG")
      ? allProducts?.find((x) => x.productCode === item.productCode)?.MGcode ??
        ""
      : "",
    description: item.productDescription,
    SOnumber: `S-${item?.SalesOrderLines.salesOrderId
      ?.toString()
      .padStart(6, "0")}`,
    Unit: item.SalesOrderLines.unit,
    batchno: item.batchNumber,
    sealNo: item.sealNumber,
    containerNo: item.containerNumber,

    QtyOnShip: item.ship,
  }));
  const transformedCratesLines = dispatch.CrateLines?.map((item) => ({
    sku: item.sku,
    qty: item.quantity,
    ref: item.dispatchId ?? item.ref,
  }));
  const physicalAddress = dispatch.address
    ? customer.Addresses.filter(
        (item) => item.AddressName === dispatch.address
      )[0]
    : customer.Addresses.filter((item) => (item.AddressType = "Physical"))[0];
  const customerRefs = Array.from(
    new Set(
      dispatch.DispatchLines.flatMap(
        (item) => item.SalesOrderLines?.SalesOrder.customerRef
      )
    )
  );

  const reqData = JSON.stringify({
    data: {
      phone: customer.PhoneNumber,
      email: customer.Email,
      DispatchDate: dispatch.dispatchDate.toLocaleDateString(),
      CustomerReference: customerRefs?.join(", "),
      DispatchNo: `D-${dispatch?.id?.toString().padStart(6, "0")}`,
      NumberOfPackages: dispatch.numberOfPackages ?? 1,
      CustomerName: dispatch?.customerName,
      ShippingCompany: dispatch?.shippingCompany,
      // SOnumber: "-----",
      TrackingNumber: dispatch?.trackingNumber,
      DeliveryNote: dispatch?.trackingNumber,

      DeliveryName: physicalAddress?.AddressName,
      DeliveryAddress1: `${physicalAddress?.StreetAddress},${physicalAddress?.StreetAddress2}`,
      DeliveryCity: physicalAddress?.City,
      DeliveryPostalCode: physicalAddress?.PostalCode,
      // DeliveryContact: customer.CustomerName,
      DeliveryInstruction: physicalAddress?.DeliveryInstruction,

      products: transformedDispatchLines,
      crates: transformedCratesLines,
    },
    convertTo: "pdf",
    timezone: "Europe/Paris",
    lang: "en",
    complement: {},
    variableStr: "",
    reportName: "document",
    enum: {},
    translations: {},
    currencySource: "",
    currencyTarget: "",
    currencyRates: {},
    hardRefresh: "",
  });

  const url = `https://api.carbone.io/render/${templateId}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "carbone-version": "4",
      Authorization: process.env.NEXT_PUBLIC_CARBONE_API_KEY!,
    },
    body: reqData,
  });

  if (response.ok) {
    const responseBody = (await response.json()) as ResponseBody; // Parse response
    await getGeneratedReport(
      responseBody.data.renderId,
      dispatch.id.toString()
    );
    return responseBody.data.renderId;
  } else {
    const error: ResponseBody = (await response.json()) as ResponseBody;
    console.error("Error Response: ", error);
    return null;
  }
};

const newLine = {
  id: "",
  line: 0,
  ship: 0,
  salesOrderLinesId: "",
  productCode: "",
  productDescription: "",
  dispatchId: 0,
  batchNumber: "",
  weight: 0,
  batchLocation: "",
};

export const Dispatch = ({
  dispatch,
}: {
  dispatch?: DispatchGetByIdResponse | null;
}) => {
  const utils = api.useContext();
  const router = useRouter();
  const { query } = router;
  const { bid } = query;

  const { mutateAsync: upsertDispatch, isLoading } =
    api.dispatch.upsertDispatch.useMutation({
      onSuccess: async () => {
        await utils.dispatch.getAll.refetch();
        await utils.salesOrder.getAll.invalidate();

        await utils.dispatch.getById.invalidate();
        await router.push("/dispatch");
      },
    });

  const { data: salesOrders } = api.salesOrder.getAll.useQuery();
  const { data: allProducts } = api.products.getAll.useQuery();

  const { data: shippingCompanies } =
    api.unleashed.getShippingCompanies.useQuery();
  const { data: allCustomers } = api.unleashed.getCustomers.useQuery();
  const [open, setOpen] = useState(false);

  const filteredCustomers =
    allCustomers?.filter((customer) =>
      salesOrders?.some(
        (saleOrder) => saleOrder.customerCode === customer.CustomerCode
      )
    ) ?? [];

  const [shipmentWeight, setShipmentWeight] = useState(
    dispatch?.shipmentWeight ?? 0
  );
  const [packagesCount, setPackagesCount] = useState(
    dispatch?.numberOfPackages ?? 0
  );
  const [trackingNumber, setTrackingNumber] = useState(
    dispatch?.trackingNumber ?? ""
  );
  const [customerId, setCustomerId] = useState(dispatch?.customerId ?? "");
  const [customerCode, setCustomerCode] = useState(
    dispatch?.customerCode ?? ""
  );
  const [customerName, setCustomerName] = useState(
    dispatch?.customerName ?? ""
  );
  // const [markedDone, setMarkedDone] = useState(dispatch?.markedDone ?? false);
  const [customerType, setCustomerType] = useState(
    dispatch?.customerType ?? CustomerType.Default
  );
  const [shippingCompany, setShippingCompany] = useState(
    dispatch?.shippingCompany ?? ""
  );
  const [address, setAddress] = useState(dispatch?.address ?? "");
  const [shippingCompanyId, setShippingCompanyId] = useState(
    dispatch?.shippingCompanyId ?? ""
  );
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [dispatchDate, setDispatchDate] = useState<Date | null>(
    dispatch?.dispatchDate ? new Date(dispatch?.dispatchDate) : new Date()
  );
  const [dispatchStatus, setDispatchStatus] = useState<SalesOrderStatus>(
    dispatch?.status ?? SalesOrderStatus.PLACED
  );

  const filteredSaleOrders = salesOrders
    ?.filter(
      (sale) =>
        sale.status === "PLACED" || sale.status === "PARTIALLY_DISPATCHED"
    )
    .filter((sale) => {
      const shouldIncludeCustomerId = customerId.includes(sale.customerId);
      const shouldIncludeAddress = address ? sale.address === address : true;

      return shouldIncludeCustomerId && shouldIncludeAddress;
    });
  const [dispatchLines, setDispatchLines] = useState<NewLineDispatch[]>(
    dispatch?.DispatchLines ?? []
  );
  const [newCrateLine, setNewCrateLine] = useState<Partial<NewCrateLine>>({
    id: "",
    sku: CrateSKU.PALLET,
    ref: "",
    quantity: 0,
    customerCode: customerCode,
    customerId: customerId,
    customerName: customerName,
    dispatchId: 0,
  });
  const [crateLines, setCrateLines] = useState<NewCrateLine[]>(
    dispatch?.CrateLines ?? []
  );

  const handleSave = async () => {
    const newDispatch = {
      shippingCompany,
      shippingCompanyId,

      customerId,
      customerCode,
      customerName,
      customerType,
      trackingNumber,
      address,
      markedDone: false,
      dispatchDate: dispatchDate ?? new Date(),
      numberOfPackages: packagesCount,
      shipmentWeight,
      CrateLines: crateLines,
      status: dispatchStatus,

      DispatchLines: dispatchLines,
      // SalesOrderDispatch: dispatchOrders ?? [],
    } as UpsertDispatchInput;
    await toast.promise(upsertDispatch(newDispatch), {
      success: "BOM Created!",
      loading: "Loading",
      error: "Error",
    });
  };

  const handleUpdate = async () => {
    const updatedDispatch = {
      id: dispatch?.id,
      shippingCompany,
      shippingCompanyId,
      customerId,
      customerCode,
      markedDone: false,
      customerType,
      customerName,
      trackingNumber,
      status: dispatchStatus,

      dispatchDate: dispatchDate ?? new Date(),
      numberOfPackages: packagesCount,
      shipmentWeight,
      address,
      DispatchLines: dispatchLines,
      CrateLines: crateLines,

      // SalesOrderDispatch: dispatchOrders ?? [],
    } as UpsertDispatchInput;
    await toast.promise(upsertDispatch(updatedDispatch), {
      loading: "Loading",
      success: "Added",
      error: "Error",
    });
  };
  const handleDispatchLinesUpdate = (updatedData: NewLineDispatch[]) => {
    setDispatchLines(updatedData);
  };

  const downloadPdf = async () => {
    if (dispatch) {
      const customer = allCustomers?.filter(
        (item) => item.CustomerCode === dispatch.customerCode
      )[0];

      if (!customer) return;
      let reportId =
        "ac84e077159a3c82a49f57666345fa7839ad99237d5742aace6571ac0433d37a";

      if (
        dispatch.customerCode.includes("T&G Exports") ||
        dispatch.customerType === "Export"
      ) {
        reportId =
          "f17e215cb1338ca719d55d1491a3b4b256294a20c6c7719809ab6e9db30991c4";
      }
      await toast.promise(
        generateReport(reportId, dispatch, customer, allProducts),
        {
          loading: "Generating PDF...",
          success: "Downloading",
          error: "Error",
        }
      );
    }
    setIsDownloadingPdf(false);
  };

  return (
    <div className="mx-4 mt-4 flex">
      <div className=" w-full space-y-2">
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-3">
          <div className="bg-slate-50 p-4 pb-0 pt-4">
            {!bid || +bid === 0 ? (
              <h2 className="text-[40px] font-semibold leading-7 text-slate-600">
                Create Dispatch
              </h2>
            ) : (
              <div className="flex items-center gap-3">
                <h2 className="text-[40px] font-semibold leading-7 text-slate-600">
                  D-{dispatch?.id?.toString().padStart(6, "0")}
                </h2>
                {dispatch?.unleashed && (
                  <Link
                    href={`https://au.unleashedsoftware.com/v2/StockAdjustments/Update/${
                      +removePrefix(dispatch?.unleashed) + 1
                    }`}
                  >
                    <Button size="sm" variant="outline" className="h-9">
                      <ExternalLink />
                    </Button>
                  </Link>
                )}
              </div>
            )}
            {dispatch?.id && (
              <Button
                variant={"link"}
                className="p-1"
                onClick={() => {
                  setIsDownloadingPdf(true);

                  void downloadPdf();
                }}
                disabled={isDownloadingPdf}
              >
                DOWNLOAD PDF
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-6  p-4  md:grid-cols-3 md:gap-12">
            <div className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium leading-6 text-gray-900">
                    Customer
                  </label>
                  <div className="mt-2">
                    <Select
                      onValueChange={(e) => {
                        const [
                          CustomerName,
                          CustomerCode,
                          CustomerId,
                          CustomerType,
                        ] = e.split("--");
                        setCustomerCode(CustomerCode ?? "");
                        setCustomerName(CustomerName ?? "");
                        setCustomerId(CustomerId ?? "");
                        setAddress("");

                        if (CustomerType === "Export")
                          setCustomerType("Export");
                        else if (CustomerType === "UPL") setCustomerType("UPL");
                        else {
                          setCustomerType("Default");
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {customerCode === ""
                            ? "Select Customer"
                            : customerCode}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCustomers?.map((customer, index) => {
                          return (
                            <SelectItem
                              key={index}
                              value={`${customer.CustomerName}--${customer.CustomerCode}--${customer.Guid}--${customer.CustomerType}`}
                            >
                              {customer.CustomerCode}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium leading-6 text-gray-900">
                    Address
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
                        {filteredCustomers
                          .filter((item) => item.CustomerCode === customerCode)
                          .map((customer) =>
                            customer?.Addresses.map((address, index) => {
                              return (
                                <SelectItem
                                  key={index}
                                  value={address.AddressName}
                                >
                                  {address.AddressName}
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
                    Shipping Company
                  </label>
                  <div className="mt-2">
                    <Select
                      onValueChange={(e) => {
                        const [companyId, companyName] = e.split("--");
                        setShippingCompanyId(companyId ?? "");
                        setShippingCompany(companyName ?? "");
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {shippingCompany === ""
                            ? "Select Shipping Company"
                            : shippingCompany}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {shippingCompanies &&
                          Object.values(shippingCompanies).map(
                            (company, index) => {
                              return (
                                <SelectItem
                                  key={index}
                                  value={`${company.Guid}--${company.Name}`}
                                >
                                  {company.Name}
                                </SelectItem>
                              );
                            }
                          )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium leading-6 text-gray-900">
                  Dispatch Date
                </label>
                <div className="mt-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
                          !dispatchDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dispatchDate ? (
                          format(dispatchDate, "dd/MM/yyyy")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      {dispatchDate && (
                        <Calendar
                          mode="single"
                          selected={dispatchDate}
                          onSelect={(value) => {
                            if (value) {
                              setDispatchDate(value);
                            }
                          }}
                          initialFocus
                        />
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="first-name"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Delivery Note
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-primary sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium leading-6 text-gray-900">
                  Status
                </label>
                <div className="mt-2">
                  <Select
                    defaultValue={dispatchStatus}
                    onValueChange={(e) => {
                      setDispatchStatus(e as SalesOrderStatus);
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
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium leading-6 text-gray-900">
                  Number of Lifts
                </label>
                <div className="mt-2">
                  <input
                    value={packagesCount}
                    onChange={(e) => setPackagesCount(+e.target.value)}
                    type="number"
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-primary sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium leading-6 text-gray-900">
                  Shipment Weight
                </label>
                <div className="mt-2">
                  <input
                    type="number"
                    step={10}
                    value={shipmentWeight}
                    onChange={(e) => setShipmentWeight(+e.target.value)}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-primary sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
              {/* <div className="space-x-2 space-y-1">
                <Checkbox
                  id="include"
                  className="border-grey-neutral"
                  checked={markedDone}
                  onCheckedChange={() => setMarkedDone(!markedDone)}
                />
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Mark as done
                </label>
              </div> */}
            </div>
          </div>
          <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
            <Button
              disabled={isLoading}
              onClick={() =>
                dispatch?.id ? void handleUpdate() : void handleSave()
              }
              className="bg-blue-primary font-semibold"
              // className="rounded-md bg-blue-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              {dispatch?.id ? "Update" : "Save"}
            </Button>
          </div>
        </div>
        <div className="w-full">
          <div className="w-full  ">
            <div className=" py-2 align-middle ">
              <div className="rounded-lg bg-slate-50 shadow-sm ring-1 ring-gray-900/5 ">
                <div className="p-4">
                  <p className="mb-4 text-xl font-medium leading-none">
                    Sale Orders
                  </p>
                  <div className="m-2 grid max-h-44 grid-cols-3 items-center overflow-scroll">
                    {filteredSaleOrders?.map((sale) => {
                      return (
                        <div key={sale.id} className="flex">
                          <button
                            onClick={() => {
                              setDispatchLines(
                                (prevDispatchLines) =>
                                  [
                                    ...prevDispatchLines,
                                    ...sale.SalesOrderLines.map(
                                      (salesOrderLine, index) => ({
                                        ...newLine,
                                        productCode: salesOrderLine.productCode,
                                        salesOrderLineId: salesOrderLine.id,
                                        SalesOrderLines: salesOrderLine,
                                        containerNumber: "",
                                        sealNumber: "",
                                        weight: 0,
                                        SalesOrder: {},
                                        ship: salesOrderLine.quantity,
                                        currentOrderQty:
                                          salesOrderLine.quantity,
                                        line:
                                          prevDispatchLines.length + index + 1,
                                        productDescription:
                                          salesOrderLine.productDescription,
                                      })
                                    ),
                                  ] as NewLineDispatch[]
                              );
                            }}
                          >
                            <PlusCircle className="mx-2 text-green-700" />
                          </button>
                          <span className="flex items-center text-lg">
                            <span>
                              SO-{sale.id?.toString().padStart(6, "0")}
                            </span>
                            <span>{" - "}</span>
                            <span>{sale.customerName}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {dispatchLines && salesOrders && (
                  <DispatchLinesTable
                    customerType={customerType}
                    dispatchLines={dispatchLines}
                    onDispatchUpdate={handleDispatchLinesUpdate}
                  />
                )}
              </div>
              <div className="relative mt-4">
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-grey-light px-2 text-lg text-gray-500">
                    Hire Equipment
                  </span>
                </div>
              </div>
              <div className="mt-2 w-fit  rounded-lg">
                <div className="w-full bg-slate-50 p-4 shadow-sm ring-1 ring-gray-900/5">
                  <div className="flex w-full space-x-4 ">
                    <div className="flex  flex-col space-y-1">
                      <label className="block text-sm font-medium leading-6 text-gray-900">
                        SKU
                      </label>

                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className=" w-[250px]  shadow-sm ring-0 ring-inset ring-gray-300"
                          >
                            {newCrateLine?.sku
                              ? newCrateLine?.sku
                              : "Select SKU..."}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="mt-2 h-fit w-[350px] p-0">
                          <Command>
                            <CommandInput
                              placeholder="Select SKU..."
                              className="my-1 h-9 "
                            />
                            <CommandEmpty>No Product.</CommandEmpty>
                            <CommandGroup className="max-h-[200px] overflow-y-scroll">
                              {Object.values(CrateSKU).map(
                                (option: CrateSKU) => (
                                  <CommandItem
                                    key={option}
                                    onSelect={() => {
                                      setNewCrateLine({
                                        ...newCrateLine,
                                        sku: option,
                                      });
                                      setOpen(false);
                                    }}
                                  >
                                    {option}
                                  </CommandItem>
                                )
                              )}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="flex  flex-col space-y-1">
                      <label className="block text-sm font-medium leading-6 text-gray-900">
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={newCrateLine?.quantity}
                        max={0}
                        onChange={(e) =>
                          setNewCrateLine({
                            ...newCrateLine,
                            quantity: +e.target.value,
                          })
                        }
                        className="flex-1 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-primary sm:text-sm sm:leading-6"
                      />
                    </div>
                    <div className="flex  flex-col space-y-1">
                      <label className="block text-sm font-medium leading-6 text-gray-900">
                        Ref
                      </label>
                      <input
                        type="text"
                        value={newCrateLine?.ref}
                        onChange={(e) =>
                          setNewCrateLine({
                            ...newCrateLine,
                            ref: e.target.value,
                          })
                        }
                        className="flex-1 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-primary sm:text-sm sm:leading-6"
                      />
                    </div>
                    <div className="flex flex-col justify-end space-y-1">
                      <button
                        type="button"
                        onClick={() =>
                          setCrateLines([
                            ...crateLines,
                            {
                              ...newCrateLine,
                              id: "",
                              line: crateLines.length + 1,
                              sku: newCrateLine.sku!,
                              date: new Date(),
                              ref: newCrateLine.ref!,
                              quantity: newCrateLine.quantity ?? 0,
                              customerCode: customerCode,
                              customerId: customerId,
                              customerName: customerName,
                              dispatchId: 0,
                              status: null,
                            },
                          ])
                        }
                        className="rounded-md bg-blue-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-800 focus-visible:bg-sky-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:bg-grey-neutral"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
                <div className=" bg-white  shadow ring-1 ring-black ring-opacity-5 ">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className=" align-top">
                      <tr>
                        {crateLineHeader.map((header) => (
                          <th
                            key={header}
                            scope="col"
                            className=" px-3 py-3.5 text-left align-bottom  text-sm font-semibold text-gray-900 "
                          >
                            {header}
                          </th>
                        ))}
                        <th
                          scope="col"
                          className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                        >
                          <span className="sr-only">Select</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {crateLines?.map((line) => (
                        <tr key={line.id}>
                          <td>{line?.sku}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <input
                              type="number"
                              value={line?.quantity}
                              onChange={(e) => {
                                const updatedData = crateLines.map((item) =>
                                  item.line === line.line
                                    ? { ...item, quantity: +e.target.value }
                                    : item
                                );
                                setCrateLines(updatedData);
                              }}
                              className="flex-1 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-primary sm:text-sm sm:leading-6"
                            />
                          </td>

                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <Input
                              type="text"
                              value={
                                line.ref
                                  ? line.ref
                                  : line.dispatchId?.toString()
                              }
                              onChange={(e) => {
                                const updatedData = crateLines.map((item) => {
                                  return item.line === line.line
                                    ? { ...item, ref: e.target.value }
                                    : item;
                                });
                                setCrateLines(updatedData);
                              }}
                              className="flex-1 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-primary sm:text-sm sm:leading-6"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
