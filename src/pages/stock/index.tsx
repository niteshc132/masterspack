import Head from "next/head";
import { type BreadCrumb } from "~/components/Breadcrumbs";
import { Layout } from "~/components/Layout";
import { StockTable } from "~/components/StockTable";
import { useState } from "react";
import { api } from "~/utils/api";
import { Loading } from "~/components/Loading";
import { Input } from "~/components/ui/input";
const breadcrumbs: BreadCrumb[] = [
  {
    name: "Stock Items",
    href: "/stock-items",
    removeQuery: false,
  },
];

export default function Home() {
  const { data, isLoading } = api.unleashed.getALlProducts.useQuery();

  const [searchText, setSearchText] = useState("");

  const filteredData = data?.filter((item) => {
    const { ProductDescription, ProductCode, ProductGroup, Guid } = item;
    const searchTerm = searchText.toLowerCase();

    return (
      searchText.length < 1 ||
      ProductDescription?.toLowerCase().includes(searchTerm) ||
      ProductCode?.toLowerCase().includes(searchTerm) ||
      ProductGroup?.GroupName.toLowerCase().includes(searchTerm) ||
      Guid?.toLowerCase().includes(searchTerm)
    );
  });

  return (
    <>
      <Head>
        <title>Masters</title>
        <meta name="description" content="Masters and sons" />

        <link rel="icon" href="/logo.png" />
      </Head>
      <Layout breadcrumbs={breadcrumbs}>
        <div className="h-full">
          <Input
            placeholder="Search Product"
            value={searchText}
            className="w-80 rounded-lg bg-white p-5"
            onChange={(e) => setSearchText(e.target.value)}
          />
          {filteredData && <StockTable data={filteredData} />}
          {isLoading && <Loading />}
        </div>
      </Layout>
    </>
  );
}
