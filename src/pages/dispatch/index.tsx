import Head from "next/head";
import Link from "next/link";

import type { BreadCrumb } from "~/components/Breadcrumbs";
import { Layout } from "~/components/Layout";
import { DispatchTable } from "~/components/DispatchTable";
import { api } from "~/utils/api";
export default function Home() {
  const { data: dispatchs } = api.dispatch.getAll.useQuery();

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
                href="/dispatch/0"
              >
                Create Dispatch
              </Link>
            </div>
            {dispatchs && <DispatchTable data={dispatchs} />}
          </div>
        </div>
      </Layout>
    </>
  );
}
const breadcrumbs: BreadCrumb[] = [
  {
    name: "Dispatch",
    href: "/dispatch",
    removeQuery: true,
  },
];
