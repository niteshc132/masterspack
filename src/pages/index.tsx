import { Role } from "@prisma/client";
import Head from "next/head";
import Link from "next/link";
import { adminPaths, paths } from "~/components/Header";
import { Layout } from "~/components/Layout";
import { api } from "~/utils/api";

export default function Home() {
  const { data } = api.users.getRole.useQuery();

  const userPaths = data === Role.ADMIN ? [...paths, ...adminPaths] : paths;

  return (
    <>
      <Head>
        <title>Masters</title>
        <meta name="description" content="Masters and sons" />

        <link rel="icon" href="/logo.png" />
      </Head>
      <Layout>
        <div className=" mx-auto flex">
          <ul
            role="list"
            className="mx-auto my-10 grid grid-cols-2 gap-6 rounded-lg border-b border-t border-gray-200 bg-white p-6"
          >
            {userPaths.map((item) => (
              <Link key={item.href} href={item.href} className="flow-root">
                <div className="relative -m-2 flex items-center space-x-4 rounded-xl p-2 focus-within:ring-2 focus-within:ring-indigo-500 hover:bg-gray-50">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-blue-primary"></div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      <p className="focus:outline-none">
                        <span className="absolute inset-0" aria-hidden="true" />
                        <span>{item.label}</span>
                        <span aria-hidden="true"> &rarr;</span>
                      </p>
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">{item.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </ul>
        </div>
      </Layout>
    </>
  );
}
