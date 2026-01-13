import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { type BomsGetAllResponse } from "~/server/api/routers/boms";
import { api } from "~/utils/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useState } from "react";
import { Button } from "./ui/button";
const headers = ["# Product Builds", "Initial Product", "Delete"];

export const BomTable = ({ data }: { data: BomsGetAllResponse }) => {
  const router = useRouter();
  const utils = api.useContext();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBomId, setSelectedBomId] = useState("");
  const [selectedBomName, setSelectedBomName] = useState("");

  const onRowClick = (id: string) => {
    void router.push({
      pathname: "/boms/[bid]",
      query: { bid: id },
    });
  };
  const { mutateAsync: deleteBOM, isLoading: isDeleting } =
    api.boms.deleteById.useMutation({
      onSuccess: async () => {
        await utils.boms.getAll.invalidate();
      },
      onSettled: () => setDialogOpen(false),
    });

  const handleDelete = async (id: string) => {
    await toast.promise(deleteBOM({ id: id }), {
      success: "BOM Deleted!",
      loading: "Deleting...",
      error: "Error Deleting",
    });
  };

  const ConfirmModal = () => (
    <Dialog open={dialogOpen} onOpenChange={(open) => setDialogOpen(open)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete BOM</DialogTitle>
          <DialogDescription>
            You are about to delete this BOM
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 ">{selectedBomName}</div>
        <DialogFooter>
          <Button
            type="submit"
            variant="destructive"
            onClick={() => {
              if (selectedBomId) void handleDelete(selectedBomId);
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="-mx-4 mt-3 w-fit ring-1 ring-gray-300 sm:mx-0 sm:rounded-lg">
      <table className="divide-y divide-gray-300 bg-white shadow-lg">
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
          {data.map((bom) => (
            <tr
              key={bom.id}
              onClick={() => onRowClick(bom.id)}
              className="cursor-pointer"
            >
              <td className={"relative py-4 pl-4 pr-3 text-sm sm:pl-6"}>
                {bom.finishedGoods.length}
              </td>
              <td
                className={" px-3 py-3.5 text-sm text-gray-500 lg:table-cell"}
              >
                {bom.name}
              </td>

              <td
                className={
                  " py-3.5  pr-4 text-right text-sm font-medium sm:pr-6"
                }
              >
                <Button
                  type="button"
                  variant={"destructive"}
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedBomId(bom.id);
                    setSelectedBomName(bom.name ?? "");
                    setDialogOpen(true);
                  }}
                  disabled={isDeleting}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!isDeleting && <ConfirmModal />}
    </div>
  );
};
