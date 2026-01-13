import {
  PlusIcon,
  CheckIcon,
  ChevronUpDownIcon,
  TrashIcon,
  Bars3Icon,
} from "@heroicons/react/24/solid";
import { Arrow } from "./ui/arrow";
import { type CSSProperties, useEffect, useState } from "react";
import type { ProductUnleashed } from "~/utils/interfaces";
import type { FinishedGood, ConsumedProduct } from "~/server/api/routers/boms";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useSortable } from "@dnd-kit/sortable/";
import { CSS } from "@dnd-kit/utilities";

export const RawCombobox = ({
  items,
  value,
  onChange,
  side,
  disabled,
}: {
  items: {
    label: string;
    value: string;
    disabled?: boolean;
  }[];
  value: string;
  onChange: (value: string) => void;
  side?: "bottom" | "left" | "right";
  disabled?: boolean;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          aria-expanded={open}
          className="h-[60px] w-full justify-start border-0 text-left"
          onClick={() => setOpen(true)}
        >
          <div className="flex-1 text-lg">
            {value
              ? items.find((item) => item.value === value)?.label
              : "Select value..."}
          </div>
          <ChevronUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("z-50 h-fit w-[300px] p-0", side && "absolute")}
      >
        <Command className="z-50 bg-white">
          <CommandInput placeholder="Search item..." autoFocus />
          <CommandEmpty>No items found.</CommandEmpty>
          <CommandGroup className="max-h-[200px] overflow-y-scroll bg-white">
            {items.map((item) => (
              <CommandItem
                key={item.value}
                className={cn(item.disabled && "bg-gray-200")}
                disabled={item.disabled}
                onSelect={() => {
                  onChange(item.value === value ? "" : item.value);
                  setOpen(false);
                }}
                value={item.label}
              >
                <CheckIcon
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === item.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export const ArrowTables = ({
  index,
  finishedGood,
  finishedGoodsIds,
  consumedGoods,
  allInputs,
  allOutputs,
  onDataChanged,
  onDelete,
}: {
  index: number;
  finishedGood: FinishedGood;
  finishedGoodsIds: string[];
  consumedGoods: ConsumedProduct[];
  allInputs: ProductUnleashed[];
  allOutputs: ProductUnleashed[];
  onDataChanged: (
    input: ConsumedProduct[],
    output: FinishedGood,
    goodId: string
  ) => void;
  onDelete: (index: number) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: finishedGood.productId });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform && { ...transform, scaleY: 1 }),
    transition: transition,
    ...(isDragging ? { position: "relative", zIndex: 9999 } : {}),
  };

  const [input, setInput] = useState<ConsumedProduct[]>(
    consumedGoods ?? [{ productId: "", productCode: "", quantity: 0 }]
  );
  const [output, setOutput] = useState<FinishedGood>(
    finishedGood ?? { productId: "", productCode: "", quantity: 0 }
  );
  const addRow = () => {
    setInput([
      ...input,
      {
        id: "",
        finishedGoodId: finishedGood.id,
        productId: "",
        productCode: "",
        quantity: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  };

  const removeConsumedProduct = (indexToRemove: number) => {
    if (input.length > 1) {
      setInput(input.filter((_, index) => index !== indexToRemove));
    } else {
      const newInput = [...input];
      newInput[indexToRemove] = {
        finishedGoodId: null,
        productId: "",
        productCode: "",
        quantity: 0,
      } as ConsumedProduct;
      setInput(newInput);
    }
  };

  useEffect(() => {
    onDataChanged(input, output, finishedGood.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, output]);

  const removeFinishedGood = () => {
    setInput([]);
    onDelete(index);
  };

  return (
    <>
      {input.map((row, index) => (
        <tr key={index} ref={setNodeRef} style={style} {...attributes}>
          <td
            ref={setActivatorNodeRef}
            {...listeners}
            className="border-b border-r bg-white"
          >
            <Bars3Icon className="h-4 w-4 cursor-move" />
          </td>
          <td className="w-10 border-b border-r bg-white">
            <button
              className="w-6 align-middle text-green-dark"
              onClick={addRow}
            >
              <PlusIcon />
            </button>
          </td>
          <td className="w-[300px] border-b border-r bg-white">
            <RawCombobox
              value={row.productCode}
              items={allInputs.map((option) => ({
                label: option.ProductCode + " - " + option.ProductDescription,
                value: option.ProductCode,
              }))}
              onChange={(value) => {
                const newInput: ConsumedProduct[] = [...input];
                const inputIndex = newInput[index];
                const selectedOption = allInputs.find(
                  (option) => option.ProductCode === value
                );

                if (inputIndex) {
                  inputIndex.productCode = value;
                  inputIndex.productId = selectedOption
                    ? selectedOption.Guid
                    : inputIndex.productId;
                  setInput(newInput);
                }
              }}
            />
          </td>
          <td className="w-24 border-b border-r bg-white">
            {
              allInputs?.find(
                (option) => option.ProductCode === row.productCode
              )?.UnitOfMeasure?.Name
            }
          </td>
          <td className="w-24 border-b bg-white">
            <input
              type="number"
              value={row.quantity}
              className="w-20 border-none"
              onChange={(e) => {
                const newInput = [...input];
                const inputIndex = newInput[index];
                if (inputIndex) inputIndex.quantity = +e.target.value;
                setInput(newInput);
              }}
            />

            <button
              className="inline"
              onClick={() => removeConsumedProduct(index)}
            >
              <TrashIcon className=" h-4 w-4 text-red-500" />
            </button>
          </td>

          {index === 0 ? (
            <>
              <td>
                <div className="mx-auto w-10 align-middle">
                  <Arrow />
                </div>
              </td>
              <td className="w-fit border-b border-r  bg-white">
                <RawCombobox
                  value={output.productCode}
                  items={allOutputs.map((option) => ({
                    label:
                      option.ProductCode + " - " + option.ProductDescription,
                    value: option.ProductCode,
                    disabled: finishedGoodsIds.includes(option.ProductCode),
                  }))}
                  onChange={(value) => {
                    const selectedOption = allOutputs.find(
                      (option) => option.ProductCode === value
                    );
                    setOutput({
                      ...output,
                      productCode: value,
                      productId: selectedOption
                        ? selectedOption.Guid
                        : output.productId,
                    });
                  }}
                />
              </td>
              <td className="w-32 border-b border-r bg-white">
                {
                  allOutputs?.find(
                    (option) => option.ProductCode === output.productCode
                  )?.UnitOfMeasure?.Name
                }
              </td>
              <td className=" border-b bg-white">
                <div className="flex w-fit items-center justify-between">
                  <input
                    type="number"
                    value={+output.quantity}
                    className="w-24 border-none"
                    onChange={(e) => {
                      setOutput({ ...output, quantity: +e.target.value });
                    }}
                  />
                  <button className="inline" onClick={removeFinishedGood}>
                    <TrashIcon className=" h-10 w-10 text-red-500" />
                  </button>
                </div>
              </td>
            </>
          ) : (
            <>
              <td></td>
              <td></td>
              <td></td>
            </>
          )}
        </tr>
      ))}
    </>
  );
};
