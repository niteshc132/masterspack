import Head from "next/head";
import { ChevronLeftIcon } from "@heroicons/react/24/solid";
import { Layout } from "~/components/Layout";
import { useRouter } from "next/router";
import { api } from "~/utils/api";
import { BinDetail } from "~/components/BinDetail";
import { ErrorMessage } from "~/components/ErrorMessage";
import Link from "next/link";
import { Loading } from "~/components/Loading";

export default function Home() {
  const router = useRouter();
  const { query, isReady } = router;
  const { bid, date } = query;

  const parsedDate = new Date(date as string);
  const isNew = bid === "new";

  const { data, isLoading, error } = api.bins.getById.useQuery(
    { id: bid as string },
    {
      enabled: isReady && !isNew,
    }
  );
  const { data: products } = api.bins.getFinishedGoodsForBin.useQuery(
    { binId: bid as string },
    {
      enabled: isReady && !isNew,
    }
  );

  return (
    <>
      <Head>
        <title>Masters</title>
        <meta name="description" content="Masters and sons" />
        <link rel="icon" href="/logo.png" />
      </Head>
      <Layout>
        <div className="p-6">
          <Link className="mb-6 flex w-fit items-center gap-3" href="/packout">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl  border-2 border-grey-neutral bg-white shadow-sm">
              <ChevronLeftIcon className="h-7 w-7  text-grey-medium" />
            </div>
            <p className="text-3xl font-bold text-grey-medium">ADD BINS</p>
          </Link>
          {error && (
            <ErrorMessage
              code={error.data?.code ?? ""}
              message={error.message}
            />
          )}
          {isLoading && bid !== "new" && <Loading />}
          <div className="flex gap-6">
            {(data ?? isNew) && (
              <BinDetail
                data={data}
                binProducts={products ?? []}
                date={parsedDate}
              />
            )}
          </div>
        </div>
      </Layout>
    </>
  );
}
