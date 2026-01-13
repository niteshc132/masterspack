import { type FC, type PropsWithChildren } from "react";
import { cn } from "~/lib/utils";
import { type BreadCrumb } from "./Breadcrumbs";
import { Header } from "./Header";

export const Layout: FC<PropsWithChildren<{ breadcrumbs?: BreadCrumb[] }>> = ({
  children,
  breadcrumbs,
}) => {
  return (
    <div className=" flex h-screen w-full flex-col">
      <Header />
      <div
        className={cn(
          "ht flex-1  bg-backgroundLayout-primary",
          breadcrumbs && "p-6"
        )}
      >
        {children}
      </div>
    </div>
  );
};
