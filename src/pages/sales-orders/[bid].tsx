import Head from "next/head";
import { Layout } from "~/components/Layout";
import { api } from "~/utils/api";
import { useRouter } from "next/router";
import { SalesOrder } from "~/components/SalesOrder";
import { Skeleton } from "~/components/ui/skeleton";
export default function Home() {
  const router = useRouter();
  const { query, isReady } = router;
  const { bid } = query;
  const isNew = bid === "0";

  const {
    data: salesOrder,

    isFetching,
  } = api.salesOrder.getById.useQuery(
    { id: bid ? +bid : 0 },
    { enabled: isReady && !isNew }
  );

  return (
    <>
      <Head>
        <title>Masters</title>
        <meta name="description" content="Masters and sons" />

        <link rel="icon" href="/logo.png" />
      </Head>
      <Layout>
        {isFetching && (
          <div className="  flex flex-col space-y-3 ">
            <Skeleton className="mx-4 mt-4 h-[400px] max-w-full space-y-2 rounded-xl" />
            <Skeleton className="mx-4 mt-4 h-[100px] max-w-[80%] space-y-2 rounded-xl" />
            <Skeleton className="mx-4 mt-4 h-[210px] max-w-full space-y-2 rounded-xl" />
          </div>
        )}
        {(salesOrder ?? isNew) && <SalesOrder salesOrder={salesOrder} />}
      </Layout>
    </>
  );
}
