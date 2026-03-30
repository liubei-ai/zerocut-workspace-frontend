import client from './api2client';

// 套餐信息接口
export interface PackageInfo {
  id: string;
  packageCode: string;
  packageName: string;
  originalPrice: string;
  currentPrice: string;
  discountRate: string;
  creditsAmount: number;
  isActive: boolean;
  description?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// 创建支付订单请求参数
export interface CreatePaymentOrderParams {
  packageCode: string;
  totalAmount: number;
  workspaceId: string;
}

// 创建支付订单响应
export interface CreatePaymentOrderResponse {
  codeUrl: string;
  outTradeNo: string;
}

// 微信JSAPI支付参数
export interface JsapiPayParams {
  appId: string;
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: 'RSA';
  paySign: string;
}

// 创建JSAPI支付订单请求参数
export interface CreateJsapiPaymentOrderParams {
  packageCode: string;
  totalAmount: number;
  workspaceId: string;
}

// 创建JSAPI支付订单响应
export interface CreateJsapiPaymentOrderResponse {
  jsapiParams: JsapiPayParams;
  outTradeNo: string;
}

// 查询订单状态请求参数
export interface QueryOrderStatusParams {
  orderId: string;
  orderType: 'transaction_id' | 'out_trade_no';
}

// 订单状态响应
export interface OrderStatusResponse {
  appid: string;
  mchid: string;
  out_trade_no: string;
  transaction_id?: string;
  trade_type?: string;
  trade_state: 'SUCCESS' | 'REFUND' | 'NOTPAY' | 'CLOSED' | 'REVOKED' | 'USERPAYING' | 'PAYERROR';
  trade_state_desc: string;
  bank_type?: string;
  attach?: string;
  success_time?: string;
  amount?: {
    total: number;
    payer_total?: number;
    currency?: string;
    payer_currency?: string;
  };
}

/**
 * 获取套餐列表
 * @returns 套餐列表
 */
export async function getPackageList(): Promise<PackageInfo[]> {
  const response = await client.get<PackageInfo[]>('/package/list');
  return response.data;
}

/**
 * 创建微信支付Native订单（扫码支付）
 * @param params 订单参数
 * @returns 支付订单信息
 */
export async function createWechatPayOrder(
  params: CreatePaymentOrderParams
): Promise<CreatePaymentOrderResponse> {
  const response = await client.post<CreatePaymentOrderResponse>(
    '/wechat-pay-native/create-order',
    params
  );
  return response.data;
}

/**
 * 创建微信支付JSAPI订单（微信内置浏览器支付）
 * @param params 订单参数
 * @returns JSAPI支付参数
 */
export async function createWechatPayJsapiOrder(
  params: CreateJsapiPaymentOrderParams
): Promise<CreateJsapiPaymentOrderResponse> {
  const response = await client.post<CreateJsapiPaymentOrderResponse>(
    '/wechat-pay-native/create-jsapi-order',
    params
  );
  return response.data;
}

/**
 * 查询订单状态
 * @param params 查询参数
 * @returns 订单状态
 */
export async function queryOrderStatus(
  params: QueryOrderStatusParams
): Promise<OrderStatusResponse> {
  const response = await client.get<OrderStatusResponse>('/wechat-pay-native/query-order', {
    params,
  });
  return response.data;
}

/**
 * 关闭订单
 * @param outTradeNo 商户订单号
 */
export async function closeOrder(outTradeNo: string): Promise<void> {
  await client.post('/wechat-pay-native/close-order', { outTradeNo });
}
