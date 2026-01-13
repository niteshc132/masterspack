import { Layout } from "~/components/Layout";
import { useState } from "react";
import { api } from "~/utils/api";
import { CrateTable } from "~/components/CratesTable";
import Head from "next/head";
import { cn } from "~/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Button } from "~/components/ui/button";

import type { BreadCrumb } from "~/components/Breadcrumbs";
import toast from "react-hot-toast";
import { CrateSKU } from "@prisma/client";
import { Calendar } from "~/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Bar, BarChart, Rectangle, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import { Label } from "../../components/ui/label";
import { CardDescription, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import type { CratesGetAllResponse } from "~/server/api/routers/dispatch";
const breadcrumbs: BreadCrumb[] = [
  {
    name: "Hire Equipment",
    href: "/hire",
    removeQuery: false,
  },
];

export default function Home() {
  const utils = api.useContext();

  const { data } = api.dispatch.getAllCrates.useQuery();
  const { data: allCustomers } = api.unleashed.getCustomers.useQuery();
  const { mutateAsync: upsertCrate } =
    api.dispatch.createCrateTrans.useMutation({
      onSuccess: async () => {
        await utils.dispatch.getAllCrates.refetch();
      },
    });
  const [searchText, setSearchText] = useState("");
  const [sku, setSku] = useState<CrateSKU>(CrateSKU.PALLET);
  const [ref, setRef] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [customerId, setCustomerId] = useState("");
  const [customerCode, setCustomerCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [date, setDate] = useState<Date>(new Date());

  const filteredData = data?.filter((item) => {
    const { customerName, ref, sku } = item;
    const searchTerm = searchText.toLowerCase();

    return (
      searchText.length < 1 ||
      customerName?.toLowerCase().includes(searchTerm) ||
      ref?.toLowerCase().includes(searchTerm) ||
      sku?.toLowerCase().includes(searchTerm)
    );
  });
  const handleCreate = async () => {
    await toast.promise(
      upsertCrate({
        quantity,
        customerCode: customerCode ?? null,
        customerName: customerName ?? null,
        customerId: customerId ?? null,
        date,
        ref,
        sku,
      }),
      {
        loading: "Loading...",
        success: "Order Created!",
        error: "Error",
      }
    );
  };

  const aggregateBySku = (
    data?: CratesGetAllResponse
  ): CratesGetAllResponse => {
    if (!data) return [];

    const aggregated = data.reduce<
      Record<string, CratesGetAllResponse[number]>
    >((acc, item) => {
      if (acc[item.sku]) {
        acc[item.sku]!.quantity += item.quantity;
      } else {
        acc[item.sku] = {
          sku: item.sku,
          quantity: item.quantity,
        } as CratesGetAllResponse[number];
      }
      return acc;
    }, {});

    return Object.values(aggregated);
  };

  const aggregatedData = aggregateBySku(data);

  return (
    <>
      <Head>
        <title>Masters</title>
        <meta name="description" content="Masters and sons" />

        <link rel="icon" href="/logo.png" />
      </Head>
      <Layout breadcrumbs={breadcrumbs}>
        <div className="grid h-[90vh] flex-1 gap-4 overflow-hidden p-4 md:grid-cols-2 lg:grid-cols-3">
          <div
            className="relative hidden flex-col items-start gap-8 md:flex"
            x-chunk="dashboard-03-chunk-0"
          >
            <div className="grid w-full items-start gap-6">
              <Input
                type="text"
                placeholder="Search by item name..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="bg-white"
              />
              <fieldset className="grid gap-6 rounded-lg border bg-white p-4">
                <legend className="-ml-1 px-1 text-sm font-medium">
                  Add Crate
                </legend>
                <div className="grid gap-3">
                  <Label>SKU</Label>
                  <select
                    name="sku"
                    id="sku"
                    className="block w-full rounded-md border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-primary sm:text-sm sm:leading-6"
                    value={sku}
                    onChange={(e) => setSku(e.target.value as CrateSKU)}
                  >
                    <option value="" disabled>
                      Select SKU...
                    </option>
                    {Object.values(CrateSKU).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-3">
                  <Label>Customer</Label>

                  <select
                    className="block w-full rounded-md border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-primary sm:text-sm sm:leading-6"
                    value={customerCode}
                    onChange={(e) => {
                      setCustomerCode(e.target.value);
                      const code =
                        allCustomers?.find(
                          (customer) => customer.CustomerCode === e.target.value
                        )?.Guid ?? "";

                      const name =
                        allCustomers?.find(
                          (customer) => customer.CustomerCode === e.target.value
                        )?.CustomerName ?? "";
                      setCustomerId(code);
                      setCustomerName(name);
                    }}
                  >
                    <option value={""}>Select Customer</option>
                    {allCustomers?.map((customer) => (
                      <option
                        key={customer.CustomerCode}
                        value={customer.CustomerCode}
                      >
                        {customer.CustomerCode}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-3">
                  <Label>Ref</Label>
                  <Input
                    type="text"
                    value={ref}
                    onChange={(e) => setRef(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-3">
                    <Label htmlFor="top-p">Quantity</Label>
                    <Input
                      id="top-p"
                      type="number"
                      onChange={(e) => setQuantity(+e.target.value)}
                      value={quantity}
                      min={"-999999"}
                      placeholder="0.7"
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="top-k">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            " justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? (
                            format(date, "dd/MM/yyyy")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        {date && (
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(value) => {
                              if (value) {
                                setDate(value);
                              }
                            }}
                            initialFocus
                          />
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="grid gap-3">
                    <button
                      type="button"
                      onClick={() => void handleCreate()}
                      className="rounded-md bg-blue-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-800 focus-visible:bg-sky-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:bg-grey-neutral"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </fieldset>
              <fieldset className="grid gap-6 rounded-lg border bg-white p-4">
                <legend className="-ml-1 px-1 text-sm font-medium">
                  Hired Equipment
                </legend>
                <div className="grid gap-3">
                  <CardDescription>Total</CardDescription>
                  <CardTitle className="text-2xl tabular-nums">
                    {aggregatedData.reduce(
                      (total, item) => total + item.quantity,
                      0
                    )}{" "}
                  </CardTitle>
                  <ChartContainer
                    className="h-60 w-full"
                    config={{
                      steps: {
                        label: "Steps",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                  >
                    <BarChart
                      margin={{
                        left: -4,
                        right: -4,
                      }}
                      data={aggregatedData}
                    >
                      <Bar
                        dataKey="quantity"
                        className="fill-blue-primary"
                        radius={5}
                        fillOpacity={0.6}
                        activeBar={<Rectangle fillOpacity={1} />}
                      />
                      <XAxis
                        dataKey="sku"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={4}
                        tickFormatter={(value: string) => {
                          return value;
                        }}
                      />
                      <ChartTooltip
                        defaultIndex={2}
                        content={
                          <ChartTooltipContent
                            hideIndicator
                            labelFormatter={(value: string) => {
                              return value;
                            }}
                          />
                        }
                        cursor={false}
                      />
                    </BarChart>
                  </ChartContainer>
                </div>
              </fieldset>
            </div>
          </div>
          <div className="relative flex h-full flex-col overflow-y-scroll rounded-xl   lg:col-span-2">
            {filteredData && <CrateTable data={filteredData} />}
          </div>
        </div>
        {/* {filteredData && <CrateTable data={filteredData} />} */}
      </Layout>
    </>
  );
}
