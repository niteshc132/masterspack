import Head from "next/head";
import { type BreadCrumb } from "~/components/Breadcrumbs";
import { Layout } from "~/components/Layout";
import { api } from "~/utils/api";
import { useState } from "react";
import { BomTable } from "~/components/BomTable";
import Link from "next/link";
import { Loading } from "~/components/Loading";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";

const bomsBreadcrumbs: BreadCrumb[] = [
  {
    name: "All BOM's ",
    href: "/boms",
    removeQuery: false,
  },
];

export default function Home() {
  const [searchText, setSearchText] = useState("");

  const { data, isLoading } = api.boms.getAll.useQuery();

  const filteredData = data?.filter((item) => {
    const rawValue = item.name;
    if (!searchText) return true;
    return rawValue?.toLowerCase().includes(searchText.toLowerCase());
  });

  return (
    <>
      <Head>
        <title>Masters</title>
        <meta name="description" content="Masters and sons" />

        <link rel="icon" href="/logo.png" />
      </Head>
      <Layout breadcrumbs={bomsBreadcrumbs}>
        <div className="h-full space-x-6  ">
          <div>
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input
                placeholder="Search BOM"
                value={searchText}
                className="rounded-lg bg-white p-5"
                onChange={(e) => setSearchText(e.target.value)}
              />

              <Link href="/boms/new">
                <Button
                  type="submit"
                  className="whitespace-nowrap bg-green-secondary px-10 font-bold hover:bg-green-secondary/80"
                >
                  Create BOM
                </Button>
              </Link>
            </div>
            {isLoading && <Loading />}
            {filteredData && <BomTable data={filteredData} />}
          </div>
        </div>
      </Layout>
    </>
  );
}
