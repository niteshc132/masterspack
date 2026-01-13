import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";

import { useState, type Dispatch, type SetStateAction } from "react";
import Image from "next/image";
import type { ProductUnleashed } from "~/utils/interfaces";
import type { BinsGetFinishedGoods } from "~/server/api/routers/bins";
import { api } from "~/utils/api";
import { cn } from "~/lib/utils";
import type { FinishedGood } from "@prisma/client";

export const BomModal = ({
  dialogOpen,
  setDialogOpen,
  finishedGoods,
  selectedProducts,
  setSelectedProducts,
  allProducts,
}: {
  dialogOpen: boolean;
  setDialogOpen: Dispatch<SetStateAction<boolean>>;
  finishedGoods: FinishedGood[];
  selectedProducts: BinsGetFinishedGoods | [];
  setSelectedProducts: (products: BinsGetFinishedGoods) => void;
  allProducts?: ProductUnleashed[];
}) => {
  const [activeTab, setActiveTab] = useState("finished");

  const productIDs = finishedGoods?.map((good) => good.productId);

  const { data: productImages } = api.products.getProductImages.useQuery(
    {
      productIDs: productIDs,
    },
    { enabled: productIDs?.length > 0 }
  );

  const getImageUrlForProduct = (productId: string) => {
    const product = productImages?.find((p) => p.productID === productId);
    return (
      product?.imageURL ??
      "https://res.cloudinary.com/dc9p9z4pw/image/upload/v1698706144/shf8gcrbn9fowlibmkfk.png"
    );
  };

  const handleClick = (product: FinishedGood) => {
    let productExists = false;

    const newSelected = selectedProducts.map((p) => {
      if (p.finishedGoodID === product.id) {
        productExists = true;
        return {
          ...p,
          quantity: p.quantity + product.quantity,
        };
      }
      return p;
    });

    if (!productExists) {
      newSelected.push({
        finishedGoodProductID: product.productId,
        finishedGoodID: product.id,
        quantity: product.quantity,
      } as BinsGetFinishedGoods[number]);
    }

    setSelectedProducts(newSelected);
  };

  const filteredGoods =
    finishedGoods?.filter((good) => {
      const product = allProducts?.find((prod) => prod.Guid === good.productId);
      if (!product) return false;

      switch (activeTab) {
        case "bulk":
          return product.ProductGroup.GroupName?.includes("Bulk");
        case "raw":
          return product.ProductGroup.GroupName?.includes("Raw");
        case "finished":
          return !/(Raw|Bulk|Packaging)/.test(
            product.ProductGroup.GroupName || ""
          );
        default:
          return true;
      }
    }) ?? [];

  return (
    <div>
      <Dialog open={dialogOpen} onOpenChange={(open) => setDialogOpen(open)}>
        <DialogContent className="flex min-h-[60vh] max-w-5xl flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-grey-medium">
              Add Product
            </DialogTitle>
          </DialogHeader>
          <div className="mt-0 h-fit flex-1">
            <div className="mb-1 flex">
              <Tabs
                defaultValue={activeTab}
                onValueChange={setActiveTab}
                className="w-[400px]"
              >
                <TabsList>
                  <TabsTrigger value="raw">Raw</TabsTrigger>
                  <TabsTrigger value="bulk">Bulk</TabsTrigger>
                  <TabsTrigger value="finished">Finished</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <ul
              role="list"
              className="grid max-h-[500px] grid-cols-2 gap-x-4 gap-y-8 overflow-y-auto border-t-2 border-blue-primary px-2 pt-6 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-6 xl:gap-x-8"
            >
              {finishedGoods &&
                filteredGoods.map((good) => {
                  const product = allProducts?.find(
                    (products) => products.Guid === good?.productId
                  );
                  const selectedProduct = selectedProducts?.find(
                    (p) => p.finishedGoodProductID === good.productId
                  );

                  return (
                    <li key={good.id} onClick={() => handleClick(good)}>
                      <button
                        className={cn(
                          "focus-within:ring-blue-300-500 group relative block aspect-square w-20 overflow-hidden rounded-lg bg-gray-100 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-100",
                          selectedProduct &&
                            "rounded-lg ring-4 ring-green-secondary"
                        )}
                      >
                        <Image
                          src={getImageUrlForProduct(good.productId)}
                          alt={good.id}
                          width={50}
                          height={50}
                          className="h-24 w-24 object-contain group-hover:opacity-75"
                        />
                        {selectedProduct && (
                          <p className="absolute bottom-0 right-0 h-6 w-6 bg-green-dark text-white">
                            {selectedProduct?.quantity}
                          </p>
                        )}
                      </button>
                      <p className="mt-2 line-clamp-5 text-lg font-medium text-gray-900">
                        {product?.ProductCode}--{product?.ProductDescription}
                      </p>
                    </li>
                  );
                })}
            </ul>
          </div>
          <DialogFooter>
            <button
              className="btn-primary h-fit"
              onClick={() => {
                setSelectedProducts(selectedProducts ?? []);
                setDialogOpen(!dialogOpen);
              }}
            >
              Continue
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
