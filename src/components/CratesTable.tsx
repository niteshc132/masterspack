import { CrateSKU } from "@prisma/client";
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
import { Button } from "./ui/button";
import { useState } from "react";
import type { CratesGetAllResponse } from "~/server/api/routers/dispatch";
const headers = [
  "Ref",
  "Dispatch",
  "Date",
  "Status",
  "Sales Order",
  "Quantity",
];

export const CrateTable = ({ data }: { data: CratesGetAllResponse }) => {
  const [open, setOpen] = useState(false);
  const [sku, setSku] = useState<CrateSKU | null>(null);
  const [customerName, setCustomerName] = useState("");
  const filteredData = data.filter((item) => {
    const matchesSku = sku ? item.sku === sku : true;
    const matchesCustomerName = customerName
      ? item?.customerName.toLowerCase().includes(customerName.toLowerCase())
      : true;
    return matchesSku && matchesCustomerName;
  });

  return (
    <div>
      <div className="w-full overflow-hidden rounded-lg border border-grey-neutral  shadow-inner">
        <div className="max-h-[80vh] overflow-y-auto">
          <table className="min-w-full divide-y-2 divide-grey-medium/50">
            <thead className="sticky top-0 z-10 bg-gray-50 font-bold text-grey-medium">
              <tr className="divide-x divide-grey-light">
                <th className="px-3 py-2.5 text-left text-blue-dark ">
                  SKU
                  <br />
                  <Select
                    onValueChange={(e) => {
                      setSku(e as CrateSKU);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>{sku ? sku : "Select SKU"}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={""}>Any</SelectItem>
                      {Object.values(CrateSKU).map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </th>
                {headers.map((header) => (
                  <th
                    key={header}
                    className="px-3 py-2.5 text-left text-blue-dark "
                  >
                    {header}
                  </th>
                ))}
                <th className="px-3 py-2.5 text-left text-blue-dark ">
                  Customer
                  <br />
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className=" w-[250px] shadow-sm ring-0 ring-inset ring-gray-300"
                      >
                        {customerName ? customerName : "Select Customer"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="mt-2 h-fit w-[350px] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Select Customer..."
                          className="my-1 h-9"
                        />
                        <CommandEmpty>No Customer found.</CommandEmpty>
                        <CommandGroup className="max-h-[200px] overflow-y-scroll">
                          <CommandItem
                            onSelect={() => {
                              setCustomerName("");
                              setOpen(false);
                            }}
                          >
                            All
                          </CommandItem>
                          {[...new Set(data.map((item) => item?.customerName))]
                            .filter(Boolean)
                            .map((customerName) => (
                              <CommandItem
                                key={customerName}
                                onSelect={() => {
                                  setCustomerName(customerName || "");
                                  setOpen(false);
                                }}
                              >
                                {customerName}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200  bg-white">
              {filteredData ? (
                filteredData.map((crate) => (
                  <tr
                    key={crate.id}
                    className="cursor-pointer  divide-grey-neutral hover:bg-slate-50"
                  >
                    <td>
                      <p className="w-10">{crate?.sku}</p>
                    </td>
                    <td>
                      <p className="w-24">{crate?.ref}</p>
                    </td>
                    <td>
                      {crate?.dispatchId && (
                        <p className="w-20">
                          D-{crate?.dispatchId?.toString().padStart(6, "0")}
                        </p>
                      )}
                    </td>
                    <td>
                      {crate?.Dispatch?.dispatchDate && (
                        <p className="w-20">
                          {crate?.Dispatch?.dispatchDate?.toLocaleDateString()}
                        </p>
                      )}
                      {crate?.date && (
                        <p className="w-20">
                          {crate?.date?.toLocaleDateString()}
                        </p>
                      )}
                    </td>
                    <td>{crate?.status}</td>
                    <td>
                      {crate?.Dispatch?.DispatchLines[0]?.SalesOrderLines
                        ?.salesOrderId && (
                        <p className="w-20">
                          S-
                          {crate?.Dispatch?.DispatchLines[0]?.SalesOrderLines?.salesOrderId
                            ?.toString()
                            .padStart(6, "0")}
                        </p>
                      )}
                    </td>
                    <td>
                      <p className="w-10">{crate?.quantity * -1}</p>
                    </td>
                    <td>{crate?.customerName}</td>
                  </tr>
                ))
              ) : (
                <></>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
