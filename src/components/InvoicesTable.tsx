import { api } from "~/utils/api";
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import toast from "react-hot-toast";
import { Button } from "~/components/ui/button";
import { ExternalLink } from "lucide-react";

const headers = [
  "Invoice No.",
  "Invoice Date",
  "MG/TG #",
  "Customer Name",
  "Total",
  "Total+GST",
  "Process",
];

export const InvoiceListTable = () => {
  const { data: allInvoices } = api.invoices.getAll.useQuery();
  const utils = api.useContext();

  const { mutate: postInvoice } = api.xero.postInvoice.useMutation({
    onSuccess: () => {
      toast.success("Invoice sent to Xero");
    },

    onSettled: async () => {
      await utils.invoices.getAll.refetch();
      await utils.invoices.getById.refetch();
      toast.success("Invoice sent to Xero");
    },
  });
  const { mutateAsync: deleteInvoice } = api.invoices.deleteById.useMutation({
    onSuccess: async () => {
      await utils.invoices.getAll.refetch();
    },
  });
  const handleDelete = async (id: number) => {
    await toast.promise(deleteInvoice({ id: id }), {
      success: "Invoice Deleted!",
      loading: "Deleting...",
      error: "Error Deleting",
    });
  };
  const [processed, setProcessed] = useState(false);
  const [searchCustomerName, setSearchCustomerName] = useState("");
  const [searchOrder, setSearchOrder] = useState("");

  const filteredSales = allInvoices?.filter((sale) => {
    const orderMatch = sale?.id
      ?.toString()
      .toLowerCase()
      .includes(searchOrder.toLowerCase());
    const customerMatch = sale?.customerName
      ?.toLowerCase()
      .includes(searchCustomerName.toLowerCase());

    if (processed) {
      return sale?.xeroInvoiceNumber && orderMatch && customerMatch;
    } else {
      return !sale?.xeroInvoiceNumber && orderMatch && customerMatch;
    }
  });
  const router = useRouter();

  const onRowClick = (id: number) => {
    void router.push({
      pathname: "/invoices/[bid]",
      query: { bid: id },
    });
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="my-1 flex h-16 w-full  items-center space-x-5">
        <button
          onClick={() => {
            setSearchCustomerName("");
            setSearchOrder("");
          }}
          className="btn-outline w-fit border-red-500 text-sm text-red-500 outline-none"
        >
          CLEAR SEARCH
        </button>
      </div>
      <div className="w-full py-2 align-middle">
        <div className="border-1 w-full overflow-hidden border-grey-neutral shadow-md ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="medium min-w-full divide-y-2">
            <thead className="bg-slate-50 font-bold text-grey-medium">
              <tr>
                {headers.map((header) => (
                  <th
                    key={header}
                    className="px-3 py-2.5 text-left text-blue-dark hover:bg-blue-light"
                  >
                    {header}
                  </th>
                ))}
              </tr>
              <tr>
                <th>
                  <input
                    type="text"
                    placeholder="#"
                    onChange={(e) => setSearchOrder(e.target.value)}
                    value={searchOrder}
                    className="focus:shadow-outline w-full rounded-lg border border-slate-200 border-opacity-5 px-3 py-1.5 text-gray-700 focus:outline-none"
                  />
                </th>
                <th></th>
                <th></th>

                <th>
                  <input
                    type="text"
                    placeholder="Search Code"
                    onChange={(e) => setSearchCustomerName(e.target.value)}
                    value={searchCustomerName}
                    className="focus:shadow-outline w-full rounded-lg border border-slate-200 px-3 py-1.5 text-gray-700 focus:outline-none"
                  />
                </th>
                <th></th>
                <th></th>

                <th>
                  <Button
                    onClick={() => setProcessed(!processed)}
                    variant={"outline"}
                  >
                    Toggle Processed
                  </Button>
                </th>
                <th></th>
                <th></th>

                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-grey-light bg-white">
              {filteredSales
                ?.sort((a, b) => b.id - a.id)
                .map((sale, productIndex) => {
                  return (
                    <tr
                      key={productIndex}
                      className="cursor-pointer divide-x-2 divide-grey-light hover:bg-slate-50"
                      onClick={() => onRowClick(sale.id)}
                    >
                      <Link href={`/invoices/${sale.id}`}>
                        <td>{sale.id}</td>
                      </Link>

                      <td>{sale.invoiceDate.toLocaleDateString()}</td>

                      <td>{sale.MGInvoice}</td>
                      <td>{sale.customerName}</td>
                      <td>
                        {(() => {
                          const invoiceTotal = sale?.InvoiceLines?.reduce(
                            (accumulator, line) => {
                              if (line?.quantity) {
                                return (
                                  accumulator + line.quantity * line.unitPrice
                                );
                              }
                              return accumulator;
                            },
                            0
                          );
                          return (
                            <div className="text-right">
                              $
                              {parseFloat(
                                invoiceTotal?.toFixed(2)
                              ).toLocaleString()}
                            </div>
                          );
                        })()}
                      </td>
                      <td>
                        {(() => {
                          const invoiceTotal = sale?.InvoiceLines?.reduce(
                            (accumulator, line) => {
                              if (line?.quantity) {
                                return (
                                  accumulator + line.quantity * line.unitPrice
                                );
                              }
                              return accumulator;
                            },
                            0
                          );
                          return (
                            <div className="text-right">
                              $
                              {parseFloat(
                                (invoiceTotal * 1.15).toFixed(2)
                              ).toLocaleString()}
                            </div>
                          );
                        })()}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        {" "}
                        {(() => {
                          return (
                            <div>
                              {!sale?.xeroId && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    postInvoice({
                                      lines: sale.InvoiceLines,
                                      customerName: sale?.customerName,
                                      MGInvoice: sale?.MGInvoice,
                                      paymentTerms: sale?.paymentTerms,
                                      TGInvoice: sale?.TGInvoice,
                                      invoiceDate: sale?.invoiceDate,
                                      dueDate: sale?.dueDate,
                                      invoiceId: sale?.id,
                                    });
                                  }}
                                  className="pill"
                                >
                                  Process?
                                </button>
                              )}
                              {sale?.xeroId && (
                                <Link
                                  href={`https://go.xero.com/AccountsReceivable/Edit.aspx?InvoiceID=${sale?.xeroId}`}
                                  target="_blank"
                                  className="pill-pending flex gap-x-1"
                                >
                                  {sale?.xeroInvoiceNumber} <ExternalLink />
                                </Link>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      <td
                        className="text-right"
                        onClick={() => void handleDelete(sale.id)}
                      >
                        DELETE
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
