import { env } from "~/env.mjs";
import HmacSHA256 from "crypto-js/hmac-sha256";
import EncBase64 from "crypto-js/enc-base64";
import type {
  BOMResponse,
  CustomersUnleashed,
  ProductResponseUnleashed,
  ProductStockOnHandUnleashed,
  ProductStockResponseUnleashed,
  SalesOrderResponseUnleashed,
  ShipingCompaniesUnleashed,
  StockAdjustmentsUnleashed,
  UnleashedStockAdjustmentPost,
} from "~/utils/interfaces";

const apiKey = env.UNLEASHED_API_KEY;
const apiId = env.UNLEASHED_API_ID;

export const getAllBomsUnleashed = async () => {
  const url = "https://api.unleashedsoftware.com/BillOfMaterials";
  const hash = HmacSHA256("", apiKey);
  const hashInBase64 = EncBase64.stringify(hash);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "api-auth-id": apiId,
      "api-auth-signature": hashInBase64,
    },
  });
  const json = (await response.json()) as BOMResponse;
  return json;
};
export const getAllShippingCompaniesUnleashed = async () => {
  const url = "https://api.unleashedsoftware.com/ShippingCompanies";
  const hash = HmacSHA256("", apiKey);
  const hashInBase64 = EncBase64.stringify(hash);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "api-auth-id": apiId,
      "api-auth-signature": hashInBase64,
    },
  });
  const json = (await response.json()) as ShipingCompaniesUnleashed;
  return json;
};

export const getAllCustomersUnleashed = async () => {
  const url = "https://api.unleashedsoftware.com/Customers";
  const hash = HmacSHA256("", apiKey);
  const hashInBase64 = EncBase64.stringify(hash);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "api-auth-id": apiId,
      "api-auth-signature": hashInBase64,
    },
  });
  const json = (await response.json()) as CustomersUnleashed;
  return json;
};

export const getAllStockAdjustments = async () => {
  const pageSize = 1000;
  let pageNumber = 9;
  let totalPages = 15;
  let combinedData: { AdjustmentNumber: string; Status: string }[] = [];

  while (pageNumber <= totalPages) {
    const url = `https://api.unleashedsoftware.com/StockAdjustments/${pageNumber}?pageSize=${pageSize}`;

    const param = `pageSize=${pageSize}`;
    const hash = HmacSHA256(param, apiKey);
    const hashInBase64 = EncBase64.stringify(hash);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "api-auth-id": apiId,
        "api-auth-signature": hashInBase64,
      },
    });

    const data = (await response.json()) as StockAdjustmentsUnleashed;
    if (totalPages === 1) {
      totalPages = data.Pagination.NumberOfPages;
    }
    const extractedData = data.Items.map((item) => ({
      AdjustmentNumber: item.AdjustmentNumber,
      Status: item.Status,
      Guid: item.Guid,
      CreatedOn: item.CreatedOn,
      CreatedBy: item.CreatedBy,
      LastModifiedBy: item.LastModifiedBy,
      LastModifiedOn: item.LastModifiedOn,
    }));

    // combinedData = combinedData?.concat(data.Items);
    combinedData = combinedData.concat(extractedData);
    pageNumber++;
  }
  return combinedData;
};
export const getCustomerDeliveryAddressUnleashed = async () => {
  const url = "https://api.unleashedsoftware.com/CustomerDeliveryAddresses";
  const hash = HmacSHA256("", apiKey);
  const hashInBase64 = EncBase64.stringify(hash);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "api-auth-id": apiId,
      "api-auth-signature": hashInBase64,
    },
  });
  const json = (await response.json()) as CustomersUnleashed;
  return json;
};

export const getAllProductsUnleashed = async () => {
  const param = "pageSize=200";
  const url = "https://api.unleashedsoftware.com/Products?" + param;
  const hash = HmacSHA256(param, apiKey);
  const hashInBase64 = EncBase64.stringify(hash);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "api-auth-id": apiId,
      "api-auth-signature": hashInBase64,
    },
  });
  const data = (await response.json()) as ProductResponseUnleashed;
  return data;
};
export const getProductByIdUnleashed = async (id: string) => {
  const param = `${id}`;
  const url = "https://api.unleashedsoftware.com/Products/" + param;

  const hash = HmacSHA256(param, apiKey);
  const hashInBase64 = EncBase64.stringify(hash);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "api-auth-id": apiId,
      "api-auth-signature": hashInBase64,
    },
  });
  const data = (await response.json()) as ProductResponseUnleashed;

  return data;
};
export const getStockAdjustmentIdUnleashed = async (id: string) => {
  const param = `${id}`;
  const url = "https://api.unleashedsoftware.com/StockAdjustments/" + param;

  const hash = HmacSHA256(param, apiKey);
  const hashInBase64 = EncBase64.stringify(hash);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "api-auth-id": apiId,
      "api-auth-signature": hashInBase64,
    },
  });
  const data = (await response.json()) as ProductResponseUnleashed;

  return data.Items[0];
};
export const getStockAdjustmentUnleashed = async (id: string) => {
  const param = `${id}`;
  const url =
    "https://api.unleashedsoftware.com/StockAdjustments/" + param.toUpperCase();

  const hash = HmacSHA256("", apiKey);
  const hashInBase64 = EncBase64.stringify(hash);
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "api-auth-id": apiId,
      "api-auth-signature": hashInBase64,
    },
  });
  const data = (await response.json()) as StockAdjustmentsUnleashed;

  return data;
};

export const getProductStock = async (id?: string) => {
  let param = "pageSize=200";
  if (id) {
    param += `&ProductCode=${id}`;
  }
  const url = "https://api.unleashedsoftware.com/BatchNumbers?" + param;
  const hash = HmacSHA256(param, apiKey);
  const hashInBase64 = EncBase64.stringify(hash);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "api-auth-id": apiId,
      "api-auth-signature": hashInBase64,
    },
  });
  const data = (await response.json()) as ProductStockResponseUnleashed;
  return data;
};
export const getOnHandStock = async () => {
  const param = "pageSize=1000";

  const url = "https://api.unleashedsoftware.com/StockOnHand?" + param;
  const hash = HmacSHA256(param, apiKey);
  const hashInBase64 = EncBase64.stringify(hash);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "api-auth-id": apiId,
      "api-auth-signature": hashInBase64,
    },
  });
  const data = (await response.json()) as ProductStockOnHandUnleashed;
  return data;
};
export const getVarieties = async () => {
  const param = "productGroup=BULK&pageSize=10";
  const url = "https://api.unleashedsoftware.com/Products?" + param;
  const hash = HmacSHA256(param, apiKey);
  const hashInBase64 = EncBase64.stringify(hash);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "api-auth-id": apiId,
      "api-auth-signature": hashInBase64,
    },
  });
  const data = (await response.json()) as ProductResponseUnleashed;
  return data;
};
export const startRpa = async ({ targetAdjust }: { targetAdjust: number }) => {
  const maxRetries = 3;
  let attempt = 0;
  let response: { status: number };

  while (attempt < maxRetries) {
    try {
      response = await fetch(
        `https://kpr6crnr55.execute-api.ap-southeast-2.amazonaws.com/${targetAdjust}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        return response;
      } else {
        attempt++;
      }
    } catch (error) {
      attempt++;
    }
  }
};

export const getSaleOrdersUnleashed = async () => {
  const param = "";
  const url = "https://api.unleashedsoftware.com/SalesOrders?" + param;
  const hash = HmacSHA256(param, apiKey);
  const hashInBase64 = EncBase64.stringify(hash);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "api-auth-id": apiId,
      "api-auth-signature": hashInBase64,
    },
  });
  const data = (await response.json()) as SalesOrderResponseUnleashed;
  return data;
};

export const getSaleOrderByIdUnleashed = async (id: string) => {
  const param = id;
  const url = "https://api.unleashedsoftware.com/SalesOrders/" + param;
  const hash = HmacSHA256(param, apiKey);
  const hashInBase64 = EncBase64.stringify(hash);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "api-auth-id": apiId,
      "api-auth-signature": hashInBase64,
    },
  });
  const data = (await response.json()) as SalesOrderResponseUnleashed;
  return data;
};

export const postStockAdjst = async (
  input: UnleashedStockAdjustmentPost[],
  location: string,
  reason: "Dispatch" | "Masters Pack App"
) => {
  interface ResponseBody {
    AdjustmentNumber: string;
    Guid: string;
    CreatedOn: string;
    CreatedBy: string;
    LastModifiedOn: string;
  }
  const currentDate = new Date();
  const timezoneOffset = currentDate.getTimezoneOffset() * 60000;
  const localDate = new Date(currentDate.getTime() - timezoneOffset);

  const effectiveDate = localDate.toISOString().split("T")[0];
  const reqData = JSON.stringify({
    Warehouse: { WarehouseCode: location },
    AdjustmentDate: effectiveDate,
    AdjustmentReason: reason,
    Status: "Parked",
    StockAdjustmentLines: input,
  });
  const url = "https://api.unleashedsoftware.com/StockAdjustments/";
  const hash = HmacSHA256("", apiKey);
  const hashInBase64 = EncBase64.stringify(hash);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "api-auth-id": apiId,
      "api-auth-signature": hashInBase64,
    },
    body: reqData,
  });

  if (response.ok) {
    const responseBody = (await response.json()) as ResponseBody; // Parse response body as JSON
    return {
      AdjustmentNumber: responseBody.AdjustmentNumber,
      Guid: responseBody.Guid,
      CreatedOn: responseBody.CreatedOn,
      CreatedBy: responseBody.CreatedBy,
    };
  } else {
    const error: ResponseBody = (await response.json()) as ResponseBody;
    console.error("Error Response: ", error);
    return null;
  }
};
