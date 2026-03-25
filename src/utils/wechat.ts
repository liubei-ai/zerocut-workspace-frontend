export function isWeiXin() {
  let ua = navigator.userAgent.toLowerCase();
  return ua.indexOf('micromessenger') !== -1;
}

// WeixinJSBridge 全局类型声明（微信内置，不在 npm 包中）
declare global {
  interface Window {
    WeixinJSBridge?: {
      invoke: (api: string, params: object, callback: (res: { err_msg: string }) => void) => void;
    };
  }
}

type WeixinBridgeErrMsg =
  | 'get_brand_wcpay_request:ok'
  | 'get_brand_wcpay_request:cancel'
  | 'get_brand_wcpay_request:fail';

/** 调用微信收银台，自动等待 WeixinJSBridgeReady */
export function invokeWeixinBridgePay(params: object) {
  console.log('Invoking WeixinJSBridge with params:', params);

  return new Promise<{ err_msg: WeixinBridgeErrMsg }>(resolve => {
    function handleResult(res: { err_msg: WeixinBridgeErrMsg }) {
      resolve(res);
    }

    function invoke() {
      if (window.WeixinJSBridge) {
        window.WeixinJSBridge.invoke('getBrandWCPayRequest', params, handleResult);
      } else {
        document.addEventListener(
          'WeixinJSBridgeReady',
          () => window.WeixinJSBridge?.invoke('getBrandWCPayRequest', params, handleResult),
          { once: true }
        );
      }
    }

    invoke();
  });
}
