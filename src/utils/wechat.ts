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

/** 调用微信收银台，自动等待 WeixinJSBridgeReady */
export function invokeWeixinBridgePay(
  params: object,
  callback: (res: { err_msg: string }) => void
) {
  if (window.WeixinJSBridge) {
    window.WeixinJSBridge.invoke('getBrandWCPayRequest', params, callback);
  } else {
    document.addEventListener('WeixinJSBridgeReady', () => {
      window.WeixinJSBridge!.invoke('getBrandWCPayRequest', params, callback);
    });
  }
}
