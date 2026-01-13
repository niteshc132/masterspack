interface Pagination {
  NumberOfItems: number;
  NumberOfPages: number;
  PageNumber: number;
  PageSize: number;
}

export interface Cin7Product {
  imageURL: string;
  UOM: string;
  ID: string;
  SKU: string;
  Name: string;
  Category: string;
  Brand: null | string;
  Type: string;
  Status: string;
  AverageCost: number;
  Weight: number;
}
export interface CloudinaryUploadResponse {
  url: string;
  secure_url: string;
}
export interface Cin7SalesOrderByID {
  SaleID: string;
  LastModifiedOn: string;
  SaleOrderDate: string;
  FulFilmentStatus: string;
  Order: { Lines: SalesOrderLine[]; SaleOrderNumber: string; Status: string };
  Customer: string;
  CustomerID: string;
  Invoices: [
    {
      Status: string;
      InvoiceNumber: string;
      LinkedFulfillmentNumber: number;
      Total: number;

      Lines: SalesOrderLine[];
    }
  ];

  Fulfilments: [
    {
      FulFilmentStatus: string;
      LinkedInvoiceNumber: string;
      FulfillmentNumber: number;
      Pack: {
        Lines: SalesOrderLine[];
        Status: string;
      };
    }
  ];
}

export interface SalesOrderLine {
  Name: string;
  ProductID: string;
  Quantity: number;
  SKU: string;
  WeightUnits: string;
  Total: number;
  AverageCost: number;
  Price: number;
  Comment: string;
}

export interface Cin7SalesOrderResponse {
  Total: number;
  Page: number;
  SaleList: Cin7Sale[];
}
export interface Cin7Sale {
  SaleID: string;
  OrderNumber: string;
  Status: string;
  OrderDate: string | null;
  InvoiceDate: string | null;
  Customer: string;
  CustomerID: string;
  InvoiceNumber: string | null;
  CustomerReference: string;
  InvoiceAmount: number;
  PaidAmount: number;
  InvoiceDueDate: string | null;
  Updated: string;
  QuoteStatus: string;
  OrderStatus: string;
  CombinedPickingStatus: string;
  CombinedPaymentStatus: string;
  CombinedTrackingNumbers: string | null;
  CombinedPackingStatus: string;
  CombinedShippingStatus: string;
  CombinedInvoiceStatus: string;
  CreditNoteStatus: string;
  FulFilmentStatus: string;
  OrderLocationID: string;
  RestockStatus: string;
}
export interface Cin7ProductsApiResponse {
  Total: number;
  Page: number;
  Products: Cin7Product[];
}
export interface Cin7ProductStock {
  ID: string;
  SKU: string;
  Name: string;
  Barcode: string | null;
  Location: string;
  Bin: string | null;
  Batch: string | null;
  ExpiryDate: string | null;
  OnHand: number;
  Allocated: number;
  Available: number;
  OnOrder: number;
  StockOnHand: number;
  InTransit: number;
}

export interface Cin7StockResponse {
  Total: number;
  Page: number;
  ProductAvailabilityList: Cin7ProductStock[];
}
export interface Cin7StockAdjustmentPost {
  ProductID: string;
  Quantity: number;
  type: string;
  UnitCost: number;
  Location: string;
  Comment: string;

  BatchSN: string;
}

export interface UnleashedStockAdjustmentPost {
  Product: {
    ProductCode: string;
  };
  NewQuantity: number | string;
  NewActualValue: number;
  Comments: string;
}
export interface Cin7SalesInvoicePost {
  SKU: string;
  Name: string;
  Quantity: number;
  Price: number;
  Tax: number;
  Total: number;
  TaxRule: string;
  Comment: string;
}
export interface BOMItem {
  BillNumber: string;
  CanAutoAssemble: boolean;
  AutoAssignOldestBatchSerial: boolean;
  CanAutoDisassemble: boolean;
  SortByProductCode: boolean;
  Product: string[];
  BillOfMaterialsLines: string[];
  TotalCost: number;
  Obsolete: boolean;
  CreatedOn: string; // '/Date(1687835850015)/'
  CreatedBy: string;
  LastModifiedBy: string;
  AssemblyLayoutId: string | null;
  Guid: string;
  LastModifiedOn: string; // '/Date(1687835850015)/'
}

export interface BOMResponse {
  Pagination: Pagination | null;
  Items: BOMItem[];
}

interface InventoryDetail {
  warehouse: {
    Guid: string;
    WarehouseCode: string;
    WarehouseName: string;
  };
  WarehouseMaxStockAlertLevel: null;
  WarehouseMinStockAlertLevel: null;
}

export interface ProductUnleashed {
  AlternateUnitsOfMeasure: string[];
  AttributeSet: null | string;
  AverageLandPrice: number;
  Barcode: null | string;
  BinLocation: null | string;
  CommerceCode: null | string;
  CreatedBy: string;
  CreatedOn: string;
  CustomerSellPrice: null | string;
  CustomsDescription: null | string;
  DefaultPurchasePrice: null | string;
  DefaultPurchasesUnitOfMeasure: null | string;
  DefaultSellPrice: null | string;
  Depth: null | string;
  Guid: string;
  Height: null | string;
  ICCCountryCode: null | string;
  ICCCountryName: null | string;
  ImageUrl: null | string;
  Images: null | string;
  InventoryDetails: InventoryDetail[];
  IsAssembledProduct: boolean;
  IsBatchTracked: boolean;
  IsComponent: boolean;
  IsSellable: boolean;
  IsSerialized: boolean;
  LastCost: null | string;
  LastModifiedBy: string;
  LastModifiedOn: string;
  MaxStockAlertLevel: null | string;
  MinStockAlertLevel: null | string;
  MinimumOrderQuantity: null | string;
  MinimumSaleQuantity: null | string;
  MinimumSellPrice: null | string;
  NeverDiminishing: boolean;
  Notes: null | string;
  Obsolete: boolean;
  PackSize: null | string;
  ProductCode: string;
  ProductDescription: string;
  ProductGroup: {
    GroupName: string;
    Guid: string;
    LastModifiedOn: string;
  };
  PurchaseAccount: null | string;
  ReOrderPoint: null | string;
  SellPriceTier1: { Name: string; Value: null | string };
  SellPriceTier2: { Name: string; Value: null | string };
  SellPriceTier3: { Name: string; Value: null | string };
  SellPriceTier4: { Name: string; Value: null | string };
  SellPriceTier5: { Name: string; Value: null | string };
  SellPriceTier6: { Name: string; Value: null | string };
  SellPriceTier7: { Name: string; Value: null | string };
  SellPriceTier8: { Name: string; Value: null | string };
  SellPriceTier9: { Name: string; Value: null | string };
  SellPriceTier10: { Name: string; Value: null | string };
  SourceId: null | string;
  SourceVariantParentId: null | string;
  SupplementaryClassificationAbbreviation: null | string;
  Supplier: null | string;
  TaxablePurchase: boolean;
  TaxableSales: boolean;
  UnitOfMeasure: {
    Name: string;
  };
  Weight: null | string;
  Width: null | string;
  XeroCostOfGoodsAccount: null | string;
  XeroSalesAccount: null | string;
  XeroSalesTaxCode: null | string;
  XeroSalesTaxRate: null | string;
  XeroTaxCode: null | string;
  XeroTaxRate: null | string;
}

export interface ProductResponseUnleashed {
  Pagination: null | Pagination;
  Items: ProductUnleashed[];
}
export interface ProductStockResponseUnleashed {
  Pagination: null | Pagination;
  Items: ProductStockUnleashed[];
}
export interface ProductStockOnHandUnleashed {
  Pagination: null | Pagination;
  Items: {
    ProductCode: string;
    ProductGuid: string;
    ProductDescription: string;
    QtyOnHand: number;
    AvailableQty: number;
  }[];
}
export interface ProductStockUnleashed {
  Number: string;
  ExpiryDate: string; // Assuming the date is always in this format
  Quantity: number;
  OriginalQty: string;
  Guid: string;
  ProductCode: string;
  WarehouseCode: string;
  Status: string;
  LastModifiedBy: string;
  LastModifiedOn: string; // Assuming the date is always in this format
  CreatedBy: string;
  CreatedOn: string;
}
interface SaleOrderCustomerUnleashed {
  CustomerCode: string;
  CustomerName: string;
  CurrencyId: number;
  Guid: string;
  LastModifiedOn: string;
}
export interface ShipingCompaniesUnleashed {
  Pagination: {
    NumberOfItems: number;
    PageSize: number;
    PageNumber: number;
    NumberOfPages: number;
  };
  Items: [
    {
      Name: string;
      Obsolete: boolean;
      CreatedBy: string;
      Guid: string;
    }
  ];
}
export interface CustomersUnleashed {
  Pagination: {
    NumberOfItems: number;
    PageSize: number;
    PageNumber: number;
    NumberOfPages: number;
  };
  Items: [CustomerUnleashed];
}
export interface StockAdjustmentsUnleashed {
  Pagination: {
    NumberOfItems: number;
    PageSize: number;
    PageNumber: number;
    NumberOfPages: number;
  };
  Items: [
    {
      CreatedOn: string;
      CreatedBy: string;
      LastModifiedBy: string;
      LastModifiedOn: string;
      AdjustmentNumber: string;
      Status: string;
      Guid: string;
    }
  ];
  Status: string;
}

export interface CustomerUnleashed {
  CustomerName: string;
  CustomerCode: string;
  Guid: string;
  Email: string;
  PhoneNumber: string;
  CustomerType: string;
  Addresses: [
    {
      AddressType: string;
      AddressName: string;
      StreetAddress: string;
      StreetAddress2: string;
      Suburb: string;
      City: string;
      Region: string;
      Country: string;
      PostalCode: string;
      IsDefault: string;
      DeliveryInstruction: string;
    }
  ];
}
interface SaleOrderUnleashed {
  SalesOrderLines: SalesOrderLine[];
  OrderNumber: string;
  OrderDate: string;
  RequiredDate: string;
  CompletedDate: string | null;
  OrderStatus: string;
  Customer: SaleOrderCustomerUnleashed;
  CustomerRef: string | null;
  Comments: string | null;
  ReceivedDate: string | null;

  ExchangeRate: number;
  DiscountRate: number;
  TaxRate: number;
  XeroTaxCode: string;
  SubTotal: number;
  TaxTotal: number;
  Total: number;
  TotalVolume: number;
  TotalWeight: number;
  BCSubTotal: number;
  BCTaxTotal: number;
  BCTotal: number;
  PaymentDueDate: string;
  AllocateProduct: boolean;
  SalesOrderGroup: string | null;
  DeliveryMethod: string | null;
  SalesPerson: string | null;
  SendAccountingJournalOnly: boolean;
  SourceId: string | null;
  CreatedBy: string;
  CustomOrderStatus: string | null;
  CreatedOn: string;
  LastModifiedBy: string;
  SalesAccount: string | null;
  Guid: string;
  LastModifiedOn: string;
}
export interface SalesOrderResponseUnleashed {
  Pagination: null | Pagination;
  Items: SaleOrderUnleashed[];
}
