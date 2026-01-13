import Head from "next/head";
import { Layout } from "~/components/Layout";

import { api } from "~/utils/api";
import { useRouter } from "next/router";

import { Invoice } from "~/components/Invoice";
export default function Home() {
  const router = useRouter();
  const { query, isReady } = router;
  const { bid } = query;
  const isNew = bid === "0";

  const { data: invoice } = api.invoices.getById.useQuery(
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
      <Layout>{(invoice ?? isNew) && <Invoice invoice={invoice} />}</Layout>
    </>
  );
}
