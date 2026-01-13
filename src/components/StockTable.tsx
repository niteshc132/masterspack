import type {
  CloudinaryUploadResponse,
  ProductUnleashed,
} from "~/utils/interfaces";
import Image from "next/image";
import { type ChangeEvent } from "react";
import { api } from "~/utils/api";
import { toast } from "react-hot-toast";
import { TrashIcon } from "@heroicons/react/24/solid";
import { useState } from "react";

const headers = [
  "Product Code",
  "Description",
  "Category",
  "UOM",
  "Weight (kgs)",
  "Unleashed Code",
  "MG",
  "TG",
  "Image",
];

export const StockTable = ({ data }: { data: ProductUnleashed[] }) => {
  const utils = api.useContext();

  const { mutateAsync: upsertImage } =
    api.products.upsertProductImage.useMutation({
      onSuccess: async () => {
        await utils.unleashed.getALlProducts.refetch();
      },
    });

  const { mutateAsync: upsertProduct } = api.products.upsertProduct.useMutation(
    {
      onSuccess: async () => {
        await utils.unleashed.getALlProducts.refetch();
      },
    }
  );
  const { data: allProducts } = api.products.getAll.useQuery();

  const handleImageUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    productId: string
  ) => {
    if (!event.target.files) return;
    const file = event.target.files[0];
    const formData = new FormData();

    if (!file) return;
    formData.append("file", file);
    formData.append("upload_preset", "tjaxjcze");

    const response = await fetch(
      "https://api.cloudinary.com/v1_1/dc9p9z4pw/image/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = (await response.json()) as CloudinaryUploadResponse;
    const imageURL = data?.secure_url;

    await toast.promise(
      upsertImage({
        productId,
        imageURL,
      }),
      {
        loading: "Uploading...",
        success: "Image Uploaded!",
        error: "Image upload failed!",
      }
    );
  };

  const handleImageRemoval = async (productId: string) => {
    await toast.promise(
      upsertImage({
        productId,
        imageURL: "",
      }),
      {
        loading: "Removing...",
        success: "Image Removed!",
        error: "Image removal failed!",
      }
    );
  };
  const handleProductUpsert = async (
    mg: string | undefined,
    tg: string | undefined,
    product: ProductUnleashed
  ) => {
    const item = [
      {
        productID: product.Guid,
        productDesc: product.ProductDescription,
        productCode: product?.ProductCode,
        MGcode: mg,
        TGcode: tg,

        uom: product?.UnitOfMeasure?.Name,
        category: product?.ProductGroup?.GroupName,
      },
    ];

    await upsertProduct(item);
  };

  const [editingMGcode, setEditingMGcode] = useState<string>();
  const [editingTGcode, setEditingTGcode] = useState<string>();

  return (
    <div className="mt-3 w-fit overflow-hidden rounded-lg border border-grey-neutral  shadow-md">
      <table className=" divide-y divide-gray-300 bg-white shadow-lg">
        <thead className="bg-[#f9f9fa]">
          <tr>
            {headers.map((header) => (
              <th
                scope="col"
                key={header}
                className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.map((product) => (
            <tr
              key={product.Guid}
              className="animate cursor-pointer hover:bg-[#f9f9fa]"
            >
              <td className={"relative py-4 pl-4 pr-3 text-sm sm:pl-6"}>
                {product?.ProductCode}
              </td>
              <td
                className={" px-3 py-3.5 text-sm text-gray-500 lg:table-cell"}
              >
                {product?.ProductDescription}
              </td>

              <td
                className={" px-3 py-3.5 text-sm text-gray-500 lg:table-cell"}
              >
                {product?.ProductGroup?.GroupName}
              </td>
              <td
                className={" px-3 py-3.5 text-sm text-gray-500 lg:table-cell"}
              >
                {product?.UnitOfMeasure?.Name}
              </td>
              <td
                className={" px-3 py-3.5 text-sm text-gray-500 lg:table-cell"}
              >
                {product?.Weight ? +product.Weight : "N/A"}
              </td>
              <td
                className={" px-3 py-3.5 text-sm text-gray-500 lg:table-cell"}
              >
                {product?.XeroSalesAccount ? +product.XeroSalesAccount : "N/A"}
              </td>
              <td
                className={" px-3 py-3.5 text-sm text-gray-500 lg:table-cell"}
              >
                <span
                  className="border-2 p-2"
                  contentEditable={editingMGcode === product.Guid}
                  onClick={() => setEditingMGcode(product.Guid)}
                  onBlur={(e) => {
                    setEditingMGcode("");
                    void handleProductUpsert(
                      e.target.innerText.trim(),
                      undefined,
                      product
                    );
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setEditingMGcode("");
                      void handleProductUpsert(
                        e.currentTarget.innerText.trim(),
                        undefined,
                        product
                      );
                    }
                  }}
                >
                  {allProducts?.find(
                    (item) => item.productCode === product.ProductCode
                  )?.MGcode ?? " "}
                </span>
              </td>
              <td
                className={" px-3 py-3.5 text-sm text-gray-500 lg:table-cell"}
              >
                <span
                  className="border-2 p-2"
                  contentEditable={editingTGcode === product.Guid}
                  onClick={() => setEditingTGcode(product.Guid)}
                  onBlur={(e) => {
                    setEditingTGcode("");
                    void handleProductUpsert(
                      undefined,
                      e.target.innerText.trim(),
                      product
                    );
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setEditingTGcode("");
                      void handleProductUpsert(
                        undefined,
                        e.currentTarget.innerText.trim(),
                        product
                      );
                    }
                  }}
                >
                  {allProducts?.find(
                    (item) => item.productCode === product.ProductCode
                  )?.TGcode ?? " "}
                </span>
              </td>
              <td
                className={" px-3 py-3.5 text-sm text-gray-500 lg:table-cell"}
              >
                {product.ImageUrl ? (
                  <div>
                    <Image
                      src={product.ImageUrl}
                      alt={product.ProductCode}
                      width={50}
                      height={50}
                      className="h-24 w-24 object-contain group-hover:opacity-75"
                    />
                    <button
                      className="inline"
                      onClick={() => void handleImageRemoval(product.Guid)}
                    >
                      <TrashIcon className=" h-4 w-4 text-red-500" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      onChange={(e) => void handleImageUpload(e, product.Guid)}
                      id={`hiddenFileInput-${product.Guid}`}
                    />
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
