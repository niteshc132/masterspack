import Head from "next/head";
import { Layout } from "~/components/Layout";
import { Bom } from "~/components/Bom";
import { api } from "~/utils/api";
import { useRouter } from "next/router";
import { Loading } from "~/components/Loading";

export default function Home() {
  const router = useRouter();
  const { query, isReady } = router;
  const { bid } = query;
  const isNew = bid === "new";

  const { data: bom, isLoading } = api.boms.getById.useQuery(
    { id: bid as string },
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
        {isLoading && isNew && <Loading />}
        {(bom ?? isNew) && <Bom bom={bom} />}
      </Layout>
    </>
  );
}
