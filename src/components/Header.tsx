import { UserButton } from "@clerk/nextjs";
import { Role } from "@prisma/client";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { api } from "~/utils/api";

export const paths = [
  {
    label: "Packout",
    href: "/packout",
    desc: "Packout sheet for packing order in warehouse",
  },
];
export const dispatchPaths = [
  {
    label: "Sales Order",
    href: "/sales-orders",
    desc: "This is space to put descriptive text",
  },
  {
    label: "Dispatch",
    href: "/dispatch",
    desc: "This is space to put descriptive text",
  },
];
export const adminPaths = [
  {
    label: "BOM",
    href: "/boms",
    desc: "Bill of Materials",
  },
  {
    label: "Stock",
    href: "/stock",
    desc: "Stock Items,Bill of Materials etc.",
  },
  {
    label: "Sales Order",
    href: "/sales-orders",
    desc: "This is space to put descriptive text",
  },
  {
    label: "Dispatch",
    href: "/dispatch",
    desc: "This is space to put descriptive text",
  },
  {
    label: "Invoice",
    href: "/invoices",
    desc: "This is space to put descriptive text",
  },
  {
    label: "Hire Equipment",
    href: "/hire",
    desc: "This is space to put descriptive text",
  },
];

export const Header = () => {
  const router = useRouter();
  const { pathname } = router;

  const { data: userRole } = api.users.getRole.useQuery();

  const getPathsForRole = (role: string) => {
    switch (role) {
      case Role.ADMIN:
        return [...paths, ...adminPaths];
      case Role.PACKOUT:
        return [...paths];
      case Role.DISPATCH:
        return [...paths, ...dispatchPaths];

      default:
        return paths;
    }
  };
  const userPaths = getPathsForRole(userRole as string);

  return (
    <div className="z-50 flex h-20 items-center gap-8 px-6 shadow-sm">
      <Link href="/">
        <Image
          src="/logo.png"
          width={90}
          height={48}
          className="object-contain"
          alt="Masters Logo"
        />
      </Link>
      <div className="flex items-center space-x-1 py-3">
        {userPaths.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "rounded-md px-6 py-2 text-grey-dark hover:bg-[#f4f4f5]",
              pathname === item.href && "bg-[#f4f4f5] text-grey-dark"
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="flex-1" />

      <div className="rounded-full shadow">
        <UserButton afterSignOutUrl="/" />
      </div>
    </div>
  );
};
