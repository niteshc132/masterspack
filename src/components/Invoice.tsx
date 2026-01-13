import { useState } from "react";
import { api } from "~/utils/api";
import toast from "react-hot-toast";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import { ScrollArea } from "~/components/ui/scroll-area";
import { type InvoiceGetByIdResponse } from "~/server/api/routers/invoices";
import { InvoiceLinesTable } from "./InvoiceLinesTable";
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
import { Button } from "~/components/ui/button";
import { CalendarIcon, PlusCircle } from "lucide-react";
import { Input } from "./ui/input";
import { cn, getAccountCode } from "~/lib/utils";
import { format } from "date-fns";
import { Calendar } from "./ui/calendar";

type InvoiceLines = InvoiceGetByIdResponse["InvoiceLines"];

export const Invoice = ({
  invoice,
}: {
  invoice?: InvoiceGetByIdResponse | null;
}) => {
  const utils = api.useContext();
  const { mutateAsync: upsertInvoice } = api.invoices.upsertInvoice.useMutation(
    {
      onSuccess: async () => {
        await utils.invoices.getAll.refetch();
        await utils.invoices.getById.refetch();
      },
    }
  );
  const [selectedSaleOrder, setSelectedSaleOrder] = useState(0);
  const [customerId, setCustomerId] = useState(invoice?.customerId ?? "");
  const [customerCode, setCustomerCode] = useState(invoice?.customerCode ?? "");
  const [customerName, setCustomerName] = useState(invoice?.customerName ?? "");

  const { data: filteredCustomers } =
    api.dispatch.getAllCustomersWithDispatch.useQuery();
  const { data: allDispatchs } = api.dispatch.getAllByCustomer.useQuery({
    customerCode: invoice?.customerCode ?? customerCode,
  });

  const { data: selectDispatchLines } =
    api.dispatch.getLinesByDispatchId.useQuery({ id: selectedSaleOrder ?? 0 });

  const [billingAddress, setBillingAddress] = useState(
    invoice?.billingAddress ?? ""
  );
  const [paymentTerms, setPaymentTerms] = useState(invoice?.paymentTerms ?? "");
  const [invoiceDate, setInvoiceDate] = useState<Date | null>(
    invoice?.invoiceDate ? new Date(invoice?.invoiceDate) : new Date()
  );
  const [dueDate, setDueDate] = useState<Date | null>(
    invoice?.dueDate ? new Date(invoice?.dueDate) : new Date()
  );

  const [productId, setProductId] = useState("");
  const [productCode, setProductCode] = useState("");
  const [productDesc, setProductDesc] = useState("");

  const [unitPrice, setUnitPrice] = useState<number>();
  const [quantity, setQuantity] = useState<number>();
  const [open, setOpen] = useState(false);
  const { data: allProducts } = api.unleashed.getALlProducts.useQuery();

  const excludedCategories = ["Packaging"];
  const products = allProducts?.filter(
    (item) => !excludedCategories.includes(item?.ProductGroup?.GroupName)
  );
  const filteredDispatchs = allDispatchs?.filter(
    (sale) =>
      customerId.includes(sale.customerId) &&
      sale.customerId !== "" &&
      sale.status != "INVOICED"
  );
  const filteredDispatchLines = selectDispatchLines;
  const [invoiceLines, setInvoiceLines] = useState<InvoiceLines>(
    invoice?.InvoiceLines ?? []
  );

  const handleSave = async () => {
    const newInvoice = {
      customerId,
      customerCode,
      customerName,
      billingAddress,
      invoiceDate: invoiceDate ?? new Date(),
      dueDate: dueDate ?? new Date(),
      paymentTerms: paymentTerms,
      InvoiceLines: invoiceLines,
      // SalesOrderDispatch: dispatchOrders ?? [],
    };

    await toast.promise(upsertInvoice(newInvoice), {
      success: "Invoice Created!",
      loading: "Loading",
      error: "Error",
    });
  };

  const handleUpdate = async () => {
    const updatedInvoice = {
      id: invoice?.id,
      customerId,
      customerCode,
      customerName,
      billingAddress,
      dueDate: dueDate ?? new Date(),
      paymentTerms: paymentTerms,
      invoiceDate: invoiceDate ?? new Date(),
      InvoiceLines: invoiceLines,
      // SalesOrderDispatch: dispatchOrders ?? [],
    };

    await toast.promise(upsertInvoice(updatedInvoice), {
      loading: "Loading",
      success: "Added",
      error: "Error",
    });
  };

  const handleDispatchLinesUpdate = (updatedData: InvoiceLines) => {
    setInvoiceLines(updatedData);
  };

  return (
    <div className="mx-4 mt-4 flex">
      <div className=" w-full space-y-2">
        <div className="pb-2 pt-4">
          <h2 className="text-[40px] font-semibold leading-7 text-slate-600">
            I-{invoice?.id?.toString().padStart(6, "0")}
          </h2>
        </div>
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-3">
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
                        const [CustomerName, CustomerCode, CustomerId] =
                          e.split("--");
                        setCustomerCode(CustomerCode ?? "");
                        setCustomerName(CustomerName ?? "");
                        setCustomerId(CustomerId ?? "");
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
                              value={`${customer.customerName}--${customer.customerCode}--${customer.customerId}`}
                            >
                              {customer.customerCode}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {invoice?.MGInvoice && (
                  <div className="space-y-1">
                    <label className="block text-sm font-medium leading-6 text-gray-900">
                      MG Invoice #
                    </label>
                    <div className="mt-2">
                      <input
                        value={invoice?.MGInvoice}
                        disabled
                        type="text"
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-primary sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium leading-6 text-gray-900">
                  Billing Address
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    className="block h-28 w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-primary sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium leading-6 text-gray-900">
                  Invoice Date
                </label>
                <div className="mt-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
                          !invoiceDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {invoiceDate ? (
                          format(invoiceDate, "dd/MM/yyyy")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={invoiceDate ?? undefined}
                        onSelect={(value) => {
                          if (value) {
                            setInvoiceDate(value);
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
                  Due Date
                </label>
                <div className="mt-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
                          !dueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? (
                          format(dueDate, "dd/MM/yyyy")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dueDate ?? undefined}
                        onSelect={(value) => value && setDueDate(value)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium leading-6 text-gray-900">
                  Payment Terms
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="block h-28 w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-primary sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
            <button
              onClick={() =>
                invoice?.id ? void handleUpdate() : void handleSave()
              }
              className="rounded-md bg-blue-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              {invoice?.id ? "Update" : "Save"}
            </button>
          </div>
        </div>
        <div className="w-full">
          <div className="w-full  ">
            <div className=" py-2 align-middle ">
              <div className="rounded-lg ">
                <ResizablePanelGroup
                  direction="horizontal"
                  className="h-full max-w-full rounded-lg "
                >
                  <ResizablePanel defaultSize={15}>
                    <ScrollArea className="h-full w-full rounded-md bg-white ">
                      <div className="p-4">
                        <p className="mb-4 text-xl font-medium leading-none">
                          Add Lines
                        </p>
                        <Select
                          onValueChange={(value) =>
                            setSelectedSaleOrder(+value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Dispatch" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredDispatchs?.map((sale) => {
                              return (
                                <SelectItem
                                  key={sale.id}
                                  value={sale.id.toString()}
                                >
                                  D-{sale.id?.toString().padStart(6, "0")}-
                                  {sale.customerName}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        {selectedSaleOrder !== 0 && (
                          <Button
                            onClick={() => {
                              setInvoiceLines(
                                (prevLines) =>
                                  [
                                    ...prevLines,
                                    ...(filteredDispatchLines?.map(
                                      (dispatch, index) => ({
                                        line: prevLines.length + index,
                                        quantity:
                                          dispatch.SalesOrderLines.quantity,
                                        id: "",
                                        MGCode: null,
                                        TGCode: null,
                                        accountCode:
                                          allProducts?.find(
                                            (item) =>
                                              item.ProductCode ===
                                              dispatch.productCode
                                          )?.XeroSalesAccount ??
                                          allProducts?.find(
                                            (item) =>
                                              item.ProductCode ===
                                              dispatch.productCode
                                          )?.XeroCostOfGoodsAccount ??
                                          getAccountCode(dispatch.productCode),
                                        TGDivision: null,
                                        productCode: dispatch.productCode,
                                        productId: null,
                                        productDesc:
                                          dispatch.productDescription,
                                        dispatchLineId: dispatch.id,
                                        salesOrderLineId:
                                          dispatch.salesOrderLineId,
                                        unmatchedSalesOrderId: null,
                                        ordered: 0,
                                        unitPrice:
                                          dispatch.SalesOrderLines.unitPrice,
                                        DispatchLines: dispatch,
                                        invoiceId: 0,
                                        createdAt: new Date(),
                                        updatedAt: new Date(),
                                      })
                                    ) ?? []),
                                  ] as InvoiceLines
                              );
                            }}
                            className="my-2 items-center bg-blue-primary font-semibold"
                          >
                            Add All
                          </Button>
                        )}
                        {filteredDispatchLines?.map((dispatch) => {
                          return (
                            <div
                              key={dispatch.id}
                              className="my-2 items-center"
                            >
                              <PlusCircle
                                onClick={() => {
                                  setInvoiceLines(
                                    (prevLines) =>
                                      [
                                        ...prevLines,
                                        {
                                          line: prevLines.length + 1,
                                          quantity:
                                            dispatch.SalesOrderLines.quantity,
                                          id: "",
                                          productCode: dispatch.productCode,
                                          MGCode: null,
                                          TGCode: null,
                                          accountCode:
                                            allProducts?.find(
                                              (item) =>
                                                item.ProductCode ===
                                                dispatch.productCode
                                            )?.XeroSalesAccount ??
                                            allProducts?.find(
                                              (item) =>
                                                item.ProductCode ===
                                                dispatch.productCode
                                            )?.XeroCostOfGoodsAccount ??
                                            getAccountCode(
                                              dispatch.productCode
                                            ),
                                          productId: null,
                                          TGDivision: null,
                                          productDesc:
                                            dispatch.productDescription,
                                          dispatchLineId: dispatch.id,
                                          salesOrderLineId:
                                            dispatch.salesOrderLineId,
                                          unmatchedSalesOrderId: null,
                                          ordered: 0,
                                          unitPrice:
                                            dispatch.SalesOrderLines.unitPrice,
                                          DispatchLines: dispatch,
                                          invoiceId: 0,
                                          createdAt: new Date(),
                                          updatedAt: new Date(),
                                        },
                                      ] as InvoiceLines
                                  );
                                }}
                                className="mx-2 inline text-green-700"
                              />

                              {/* </PlusCircle> */}
                              <label className="text-lg font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {dispatch?.SalesOrderLines?.productCode}
                              </label>
                              {/* <Separator /> */}
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={85}>
                    <div className="w-full bg-white p-4">
                      <div className="flex w-full space-x-4 ">
                        <div className="flex  flex-col space-y-1">
                          <label className="block text-sm font-medium leading-6 text-gray-900">
                            Product
                          </label>

                          <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className=" w-[250px]  shadow-sm ring-0 ring-inset ring-gray-300"
                              >
                                {productCode ?? "Select Crate SKU..."}
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
                                        setProductId(option.Guid);
                                        setProductCode(option.ProductCode);
                                        setProductDesc(
                                          option.ProductDescription
                                        );
                                        setOpen(false);
                                      }}
                                    >
                                      {option.ProductCode} -{" "}
                                      {option.ProductDescription}
                                      {/* <CheckIcon
                          className={cn(
                            "ml-auto h-4 w-4",
                            bomObject.rawId === option.Guid
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        /> */}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="flex  flex-col space-y-1">
                          <label className="block text-sm font-medium leading-6 text-gray-900">
                            Quantity
                          </label>
                          <Input
                            type="number"
                            min={0}
                            value={quantity}
                            onChange={(e) => setQuantity(+e.target.value)}
                            className="flex-1 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-primary sm:text-sm sm:leading-6"
                          />
                        </div>
                        <div className="flex  flex-col space-y-1">
                          <label className="block text-sm font-medium leading-6 text-gray-900">
                            Unit Price
                          </label>
                          <Input
                            type="number"
                            value={unitPrice}
                            onChange={(e) => setUnitPrice(+e.target.value)}
                            className="flex-1 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-primary sm:text-sm sm:leading-6"
                          />
                        </div>
                        <div className="flex flex-col justify-end space-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              setInvoiceLines((prevLines) => [
                                ...prevLines,
                                {
                                  line: prevLines.length + 1,
                                  quantity: quantity ?? 0,
                                  id: "",
                                  TGDivision: null,
                                  MGCode: null,
                                  TGCode: null,
                                  accountCode:
                                    allProducts?.find(
                                      (item) => item.ProductCode === productCode
                                    )?.XeroSalesAccount ??
                                    allProducts?.find(
                                      (item) => item.ProductCode === productCode
                                    )?.XeroCostOfGoodsAccount ??
                                    getAccountCode(productCode),
                                  productCode: productCode,
                                  productId: productId,
                                  productDesc: productDesc,
                                  DispatchLines: null,
                                  dispatchLineId: null,
                                  SalesOrderLines: null,
                                  salesOrderLineId: null,
                                  unmatchedSalesOrderId: null,
                                  dispatchId: 0,
                                  ordered: 0,
                                  unitPrice: unitPrice ?? 0,
                                  invoiceId: 0,
                                  createdAt: new Date(),
                                  updatedAt: new Date(),
                                },
                              ]);
                            }}
                            disabled={!productCode || !quantity || !unitPrice}
                            className="rounded-md bg-blue-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-800 focus-visible:bg-sky-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:bg-grey-neutral"
                          >
                            Add Line
                          </button>
                        </div>
                      </div>
                    </div>
                    {invoiceLines.length != 0 && (
                      <InvoiceLinesTable
                        invoiceLines={invoiceLines}
                        onInvoiceUpdate={handleDispatchLinesUpdate}
                        invoiceSent={invoice?.xeroId ? true : false}
                        customerCode={
                          invoice?.customerCode ?? customerCode ?? null
                        }
                      />
                    )}
                  </ResizablePanel>
                </ResizablePanelGroup>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
