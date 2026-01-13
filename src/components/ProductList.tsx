import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/solid";
import { type BinsGetFinishedGoods } from "~/server/api/routers/bins";
import type { ProductUnleashed } from "~/utils/interfaces";

export const ProductList = ({
  selectedProducts,
  unleasedProducts,
  setSelectedProducts,
  disabled,
}: {
  setSelectedProducts: (products: BinsGetFinishedGoods) => void;
  unleasedProducts: ProductUnleashed[];
  selectedProducts: BinsGetFinishedGoods | [];
  disabled?: boolean;
}) => {
  const deleteProduct = (indexToDelete: number) => {
    const newProducts = [...selectedProducts];
    newProducts.splice(indexToDelete, 1);
    setSelectedProducts(newProducts);
  };

  const handleChangeQuantity = (
    indexToUpdate: number,
    newQuantity: string | null
  ) => {
    setSelectedProducts(
      selectedProducts.map((product, currentIndex) =>
        currentIndex === indexToUpdate
          ? ({
              ...product,
              quantity: newQuantity ? +newQuantity : null,
            } as BinsGetFinishedGoods[number])
          : product
      )
    );
  };

  return (
    <div className="h-fit flex-1 overflow-hidden rounded-lg shadow-md shadow-blue-dark/25 ring-1 ring-black ring-opacity-5">
      <table className="w-full border-collapse">
        <thead className="divide-x divide-grey-neutral border-b-2">
          <tr>
            <th className="add-bins-table-head border-r-2" />
            <th className="add-bins-table-head w-fit border-r-2 text-left">
              SKU
            </th>
            <th className="add-bins-table-head border-r-2 text-left">
              Product
            </th>

            <th className="add-bins-table-head text-left">Count</th>
          </tr>
        </thead>
        <tbody className="divide-y-2 divide-grey-neutral bg-white">
          {selectedProducts?.map((product, index) => {
            const unleashedProduct = unleasedProducts?.find(
              (option) => option.Guid === product.finishedGoodProductID
            );
            return (
              <tr key={index}>
                <td className="border-r-2">
                  <button
                    disabled={disabled}
                    onClick={() => deleteProduct(index)}
                  >
                    <TrashIcon className="h-10 w-10 text-red-primary" />
                  </button>
                </td>
                <td className="whitespace-nowrap border-r-2 px-6 py-4 text-lg font-medium text-gray-900 ">
                  {unleashedProduct?.ProductCode}
                </td>
                <td className="border-r-2 px-6 py-4 text-lg font-medium text-gray-900 ">
                  <p className="">{unleashedProduct?.ProductDescription}</p>
                </td>

                <td className="flex justify-between whitespace-nowrap px-6 py-4 text-lg text-gray-500">
                  <input
                    type="number"
                    disabled={disabled}
                    value={product.quantity ?? ""}
                    onChange={(e) =>
                      handleChangeQuantity(index, e.target.value)
                    }
                    className="w-20 rounded-md border-none px-3 py-2"
                  />
                  {!disabled && (
                    <PencilSquareIcon className="inline-block aspect-square h-10 text-grey-medium" />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
