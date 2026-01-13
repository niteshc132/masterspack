import { ChevronRightIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { useRouter } from "next/router";
import { cn } from "~/lib/utils";

export interface BreadCrumb {
  name: string;
  href: string;
  removeQuery?: boolean;
}

const homeBreadCrumb = [
  {
    name: "Home",
    href: "/",
    removeQuery: true,
  },
];

export const BreadCrumbs = ({ breadcrumbs }: { breadcrumbs: BreadCrumb[] }) => {
  const router = useRouter();
  const allBreadCrumbs = [...homeBreadCrumb, ...breadcrumbs];
  return (
    <div className="mb-6 flex items-center gap-x-1 text-sm">
      {allBreadCrumbs.map((breadcrumb, index) => (
        <div className="flex items-center gap-x-1" key={index}>
          <Link
            key={breadcrumb.href}
            href={{
              pathname: breadcrumb.href,
              query: breadcrumb.removeQuery ? null : router.query,
            }}
            className="flex items-center"
          >
            <p
              className={cn(
                "text-2xl text-grey-medium",
                index === allBreadCrumbs.length - 1 && "font-bold text-black"
              )}
            >
              {breadcrumb.name}
            </p>
          </Link>
          {index !== allBreadCrumbs.length - 1 && (
            <ChevronRightIcon className="h-6 w-6 text-grey-medium" />
          )}
        </div>
      ))}
    </div>
  );
};
