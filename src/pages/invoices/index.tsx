import Head from "next/head";
import type { BreadCrumb } from "~/components/Breadcrumbs";
import { Layout } from "~/components/Layout";
import { api } from "~/utils/api";
import ExcelFileUpload from "~/components/UploadCSV";
import { Button } from "~/components/ui/button";
import router from "next/router";
import { useEffect } from "react";
import { PlusCircle } from "lucide-react";
import toast from "react-hot-toast";
import { InvoiceListTable } from "~/components/InvoicesTable";

export default function Home() {
  const { code } = router.query;

  const { mutateAsync: renewToken } = api.xero.updateRefreshToken.useMutation();
  const { mutateAsync: xero } = api.xero.authenticate.useMutation({
    onSuccess: async ({ url }) => {
      await router.push(url);
    },
  });

  const renewXero = async () => {
    const renewXeroRes = await renewToken({ code: window.location.href });

    if (!renewXeroRes?.error) {
      toast.success("Xero token renewed");
    }
    toast.success("Xero Connected!");
    await router.replace("/invoices", undefined, { shallow: true });
  };

  useEffect(() => {
    if (code) {
      void renewXero();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return (
    <>
      <Head>
        <title>Masters</title>
        <meta name="description" content="Masters and sons" />

        <link rel="icon" href="/logo.png" />
      </Head>
      <Layout breadcrumbs={breadcrumbs}>
        <div className="h-full space-x-6">
          <div>
            <div className="my-2 ml-auto flex items-center gap-2">
              <Button
                size="lg"
                className="h-10 gap-1 bg-green-secondary"
                onClick={() => void router.push("/invoices/0")}
              >
                <PlusCircle className="h-5 w-5" />
                <span className="sr-only font-semibold sm:not-sr-only sm:whitespace-nowrap">
                  Create Invoice
                </span>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-10 gap-1"
                onClick={() => {
                  void xero();
                }}
              >
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Connect To Xero
                </span>
              </Button>
              <ExcelFileUpload />
            </div>

            <InvoiceListTable />
          </div>
        </div>
      </Layout>
    </>
  );
}
const breadcrumbs: BreadCrumb[] = [
  {
    name: "Invoice",
    href: "/invoice",
    removeQuery: true,
  },
];
