import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  const endpoints = [
    "masters/stockonhandRefresh",
    "masters/batchesRefreshMasters",
  ];

  for (const endpoint of endpoints) {
    const url = `https://express-server-18q4-production.up.railway.app/${endpoint}`;

    await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "Content-Type": "application/json",
        passcode: "hellotheredave",
      },
    });
  }
  return response.json({ 200: "masters refreshed" });
}
