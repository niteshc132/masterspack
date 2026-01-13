import Head from "next/head";
import { ChevronRightIcon, ChevronLeftIcon } from "@heroicons/react/24/solid";
import { Layout } from "~/components/Layout";
import { AddButton } from "~/components/AddButton";
import { useState } from "react";
import { addDays, endOfDay, format, startOfDay, subDays } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Calendar } from "~/components/ui/calendar";
import { api } from "~/utils/api";
import { Loading } from "~/components/Loading";
import { ErrorMessage } from "~/components/ErrorMessage";
import { useRouter } from "next/router";
import { BinsTable } from "~/components/BinsTable";

export default function Home() {
  const router = useRouter();
  const [date, setDate] = useState<Date>(new Date());
  const startTime = startOfDay(date);
  const endTime = endOfDay(date);

  const { data, isLoading, error } = api.bins.getAll.useQuery({
    startTime,
    endTime,
  });

  const onPrevDateClick = () => {
    setDate(subDays(date, 1));
  };

  const onNextDateClick = () => {
    setDate(addDays(date, 1));
  };

  const onAddClick = async () => {
    await router.push({
      pathname: "/bins/[bid]",
      query: {
        bid: "new",
        date: date.toDateString(),
      },
    });
  };

  return (
    <>
      <Head>
        <title>Masters</title>
        <meta name="description" content="Masters and sons" />
        <link rel="icon" href="/logo.png" />
      </Head>
      <Layout>
        <div className="grid w-full gap-6 border-b-2 border-grey-neutral bg-blue-light px-6 py-3">
          <div className="flex md:items-center md:justify-between">
            <div className="flex items-center ">
              <button
                className="flex aspect-square w-12 items-center justify-center rounded-l-2xl bg-white text-gray-400 shadow-sm ring-2 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                onClick={onPrevDateClick}
              >
                <ChevronLeftIcon className="h-7 w-7" aria-hidden="true" />
              </button>
              <button
                className="mr-3 flex aspect-square w-12 items-center justify-center rounded-r-2xl bg-white text-gray-400 shadow-sm ring-2 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                onClick={onNextDateClick}
              >
                <ChevronRightIcon className="h-7 w-7" aria-hidden="true" />
              </button>
              <span className="text-2xl font-bold">Today: </span>
              <span className="font-base text-2xl">
                {format(date, "EEEE, dd MMM")}
              </span>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <button className="btn-outline rounded-2xl shadow-sm  shadow-blue-dark/25">
                  {format(date ?? new Date(), "dd/MM/yyyy")}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(value) => value && setDate(value)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <AddButton onClick={() => void onAddClick()} label={"Add Bins"} />
        </div>
        <div className="mt-8 flow-root px-4 sm:px-6 lg:px-8">
          {isLoading && <Loading />}
          {error && (
            <ErrorMessage
              code={error.data?.code ?? ""}
              message={error.message}
            />
          )}
          {data && <BinsTable data={data} />}
        </div>
      </Layout>
    </>
  );
}
