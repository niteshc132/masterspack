import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  const url =
    "https://express-server-production-000d.up.railway.app/masters/startRpa1";

  await fetch(url, {
    method: "POST",
    redirect: "follow",
    headers: {
      "Content-Type": "application/json",
      passcode: "hellotheredave",
    },
  });
  return response.json({ 200: "RPA Started" });
}
