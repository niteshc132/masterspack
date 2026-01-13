import Head from "next/head";
import Link from "next/link";
import type { BreadCrumb } from "~/components/Breadcrumbs";
import { Layout } from "~/components/Layout";
import { SalesListTable } from "~/components/SalesListTableOLD";

export default function Home() {
  return (
    <>
      <Head>
        <title>Masters</title>
        <meta name="description" content="Masters and sons" />

        <link rel="icon" href="/logo.png" />
      </Head>
      <Layout breadcrumbs={breadcrumbs}>
        <div className="h-full space-x-6  ">
          <div>
            <div className="space-x-2 py-2">
              <Link
                className="w-28 justify-end rounded-2xl bg-green-secondary p-4 font-bold text-white shadow-md"
                href="/sales-orders/0"
              >
                Create Sales Order
              </Link>
            </div>
            <SalesListTable />
          </div>
        </div>
      </Layout>
    </>
  );
}
const breadcrumbs: BreadCrumb[] = [
  {
    name: "Sales Orders",
    href: "/sales-orders",
    removeQuery: true,
  },
];
