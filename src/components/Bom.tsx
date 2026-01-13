import { CheckIcon, PencilSquareIcon } from "@heroicons/react/24/solid";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { useState } from "react";
import { useRouter } from "next/router";
import { api } from "~/utils/api";
import toast from "react-hot-toast";
import type {
  FinishedGood,
  BomsGetByIdResponse,
  ConsumedProduct,
} from "~/server/api/routers/boms";
import { ArrowTables } from "~/components/ArrowTable";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "~/components/ui/command";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

const desiredCategories = [
  "Potatoes - Raw",
  "Potatoes - Bulk",
  "Broccoli - Bulk",
  "Lettuce - Bulk",
  "Brown Onions - Bulk",
  "Red Onions - Bulk",
  "Cauliflower - Bulk",
];

const initialBomObject: BomsGetByIdResponse = {
  id: "",
  rawId: "",
  name: "",
  productCode: "",
  quantity: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  finishedGoods: [
    {
      id: "",
      bomId: "",
      productId: "",
      productCode: "",
      quantity: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      consumedProducts: [
        {
          id: "",
          finishedGoodId: "",
          productId: "",
          productCode: "",

          quantity: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    } as BomsGetByIdResponse["finishedGoods"][number],
  ],
};

export const Bom = ({ bom }: { bom?: BomsGetByIdResponse | null }) => {
  const utils = api.useContext();
  const router = useRouter();
  const { query } = router;
  const { bid } = query;
  const isNew = bid === "new";

  const { data } = api.unleashed.getALlProducts.useQuery();

  const [open, setOpen] = useState(false);
  const [bomObject, setBomObject] = useState<BomsGetByIdResponse>(
    bom ?? initialBomObject
  );

  const filteredProducts = data?.filter((option) =>
    desiredCategories.includes(option?.ProductGroup?.GroupName)
  );

  const { mutateAsync: upsertBom, isLoading: isUpserting } =
    api.boms.upsertBom.useMutation({
      onSuccess: async (data) => {
        await utils.boms.getAll.refetch();
        await utils.boms.getById.invalidate();
        await router.push({
          pathname: "/boms/[bid]",
          query: {
            bid: data.id,
          },
        });
      },
    });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const activeIndex = bomObject.finishedGoods.findIndex(
        (item) => item.productCode === active.id
      );
      const overIndex = bomObject.finishedGoods.findIndex(
        (item) => item.productCode === over?.id
      );
      const newFinishedGoods = arrayMove(
        bomObject.finishedGoods,
        activeIndex,
        overIndex
      );
      setBomObject((prev) => ({
        ...prev,
        finishedGoods: newFinishedGoods,
      }));
    }
  };

  const finishedGoodsIds = bomObject.finishedGoods.map((x) => x.productCode);

  const allInputs = data?.filter(
    (item) => item?.ProductGroup?.GroupName === "Packaging"
  );

  const excludedCategories = ["Packaging"];
  const allOutputs = data?.filter(
    (item) => !excludedCategories.includes(item?.ProductGroup?.GroupName)
  );

  const handleSave = async () => {
    await toast.promise(
      upsertBom({
        rawId: bomObject?.rawId ?? "",
        name: bomObject?.name ?? "",
        productCode: bomObject?.productCode,
        quantity: bomObject?.quantity ?? 0,
        finishedGoods: bomObject.finishedGoods
          ? bomObject.finishedGoods.map((finishedGood) => ({
              productId: finishedGood.productId,
              productCode: finishedGood.productCode,
              quantity: finishedGood.quantity,
              consumedProducts: finishedGood.consumedProducts.map(
                (consumedProduct) => ({
                  productId: consumedProduct.productId,
                  productCode: consumedProduct.productCode,

                  quantity: consumedProduct.quantity,
                })
              ),
            }))
          : [],
      }),
      {
        success: "BOM Created!",
        loading: "Loading",
        error: "Error",
      }
    );
  };

  const handleUpdate = async () => {
    await toast.promise(upsertBom(bomObject), {
      loading: "Loading",
      success: "Added",
      error: "Error",
    });
  };

  const addGoods = () => {
    if (bomObject) {
      const updatedBomObject = {
        ...bomObject,
        finishedGoods: [
          ...bomObject.finishedGoods,
          {
            bomId: bomObject.id,
            productId: "",
            productCode: "",
            quantity: 0,
            consumedProducts: [
              {
                productId: "",
                productCode: "",

                quantity: 0,
              } as ConsumedProduct,
            ],
          } as FinishedGood,
        ],
      };
      setBomObject(updatedBomObject);
      return updatedBomObject;
    }
  };

  const handleDataChanged = (
    input: ConsumedProduct[],
    output: FinishedGood,
    goodId: string
  ) => {
    const updatedFinishedGoods = bomObject.finishedGoods.map((good, index) => {
      if (good.id === goodId || !good.id) {
        return {
          ...good,
          ...output,
          consumedProducts: input,
          id: good.id || index.toString(),
        };
      }
      return good;
    });
    const newBomObject = { ...bomObject, finishedGoods: updatedFinishedGoods };
    setBomObject(newBomObject);
  };

  const handleDelete = (indexToDelete: number) => {
    setBomObject((prevBomObject) => {
      return {
        ...prevBomObject,
        finishedGoods: prevBomObject.finishedGoods.filter(
          (_, index) => index !== indexToDelete
        ),
      };
    });
  };

  const Buttons = () => {
    return (
      <div className="my-4 space-x-5">
        <button
          className="w-28 rounded-2xl bg-green-secondary p-4 font-bold text-white shadow-md disabled:bg-gray-400"
          onClick={addGoods}
        >
          Add Goods
        </button>
        <button
          className="w-28 rounded-2xl bg-green-secondary p-4 font-bold text-white shadow-md disabled:bg-grey-medium"
          onClick={() => {
            isNew ? void handleSave() : void handleUpdate();
          }}
          disabled={isUpserting}
        >
          {isNew ? "Save" : "Update"}
        </button>
      </div>
    );
  };

  const product = filteredProducts?.find(
    (option) => option.Guid === bomObject.rawId
  );
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-lg bg-grey-light p-6">
      <div>
        <table className="w-[800px] overflow-hidden shadow-md ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <tbody className="divide-y divide-grey-neutral">
            <tr className="add-bins-table-row">
              <td className="add-bins-table-head">RAW/BULK</td>
              <td className="bg-white p-0">
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="m-2 w-[650px] justify-start border-none text-xl"
                    >
                      {bomObject.rawId
                        ? product?.ProductCode +
                          " - " +
                          product?.ProductDescription
                        : "Select RAW..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="mt-2 h-fit w-[350px] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search RAW..."
                        className="my-1 h-9"
                      />
                      <CommandEmpty>No RAW found.</CommandEmpty>
                      <CommandGroup className="max-h-[200px] overflow-y-scroll">
                        {filteredProducts?.map((option) => (
                          <CommandItem
                            key={option.Guid}
                            onSelect={() => {
                              setBomObject({
                                ...bomObject,
                                rawId: option.Guid,
                                productCode: option.ProductCode,
                              });
                              setOpen(false);
                            }}
                          >
                            {option.ProductCode} - {option.ProductDescription}
                            <CheckIcon
                              className={cn(
                                "ml-auto h-4 w-4",
                                bomObject.rawId === option.Guid
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </td>
            </tr>
            <tr className="add-bins-table-row">
              <td className="add-bins-table-head truncate">BOM Name</td>
              <td className="add-bins-table-cell w-full">
                {bomObject && (
                  <input
                    className="table-input w-full "
                    value={bomObject?.name ?? ""}
                    type="text"
                    onChange={(e) =>
                      setBomObject({
                        ...bomObject,
                        name: e.target.value,
                      })
                    }
                  />
                )}

                <PencilSquareIcon className="aspect-square h-[42px] text-grey-medium" />
              </td>
            </tr>
            <tr className="add-bins-table-row ">
              <td className="add-bins-table-head truncate">Quantity</td>
              <td className="add-bins-table-cell w-full">
                {bomObject && (
                  <input
                    className="table-input w-full"
                    value={bomObject?.quantity}
                    type="number"
                    onChange={(e) =>
                      setBomObject({
                        ...bomObject,
                        quantity: +e.target.value,
                      })
                    }
                  />
                )}

                <PencilSquareIcon className="aspect-square h-[42px] text-grey-medium" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Buttons />

      <DndContext
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={bomObject.finishedGoods.map((good) => good.productId)}
          strategy={verticalListSortingStrategy}
        >
          <table className="text-left">
            <thead>
              <tr>
                <th className="rounded-tl-lg border-b border-r bg-grey-light p-1 px-2 text-blue-dark"></th>
                <th className="bg-grey-light" />
                <th className="border-b border-r bg-grey-light p-1 px-2 text-blue-dark">
                  Consumed Goods
                </th>
                <th className="border-b border-r bg-grey-light p-1 px-2 text-blue-dark">
                  UOM
                </th>
                <th className="rounded-tr-lg border-b bg-grey-light p-1 px-2 text-blue-dark">
                  Quantity
                </th>
                <th></th>
                <th className="rounded-tl-lg border-b bg-grey-light p-1 px-2 text-blue-dark">
                  Produced Goods
                </th>
                <th className=" border-b border-r bg-grey-light p-1 px-2 text-blue-dark">
                  UOM
                </th>
                <th className="rounded-tr-lg border-b border-l bg-grey-light p-1 px-2 text-blue-dark">
                  Quantity
                </th>
              </tr>
            </thead>
            <tbody className="space-y-9">
              {allInputs &&
                allOutputs &&
                bomObject.finishedGoods.map((good, index) => (
                  <ArrowTables
                    key={good.productId}
                    // key={index}
                    finishedGoodsIds={finishedGoodsIds}
                    index={index}
                    finishedGood={good}
                    consumedGoods={good.consumedProducts}
                    allInputs={allInputs}
                    allOutputs={allOutputs}
                    onDataChanged={handleDataChanged}
                    onDelete={handleDelete}
                  />
                ))}
            </tbody>
          </table>
        </SortableContext>
      </DndContext>
    </div>
  );
};
