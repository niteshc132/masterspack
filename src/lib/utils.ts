import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function removePrefix(str: string) {
  str = str.replace(/^SA-/, "");

  str = str.replace(/^0+/, "");

  return str;
}

const accountCodes = {
  POT: "1120",
  POTATO: "1120",
  ONION: "1110",
  LETTUCE: "1100",
  BROCCOLI: "1115",
  CAULIFLOWER: "1117",
  OLEVY: "2150",
  VLEVY: "2140",
  PLEVY: "2160",
  COMMISSION: "2190",
};

export function getAccountCode(productCode: string) {
  const upperProductCode = productCode.toUpperCase();

  let result = accountCodes[upperProductCode as keyof typeof accountCodes];
  if (!result) {
    result = "1000";
  }
  return result;
}
