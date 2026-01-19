/**
 * ZeroCut 定价计算器类型定义
 */

/**
 * 时间范围配置
 */
export interface TimeRange {
  min: number;
  max: number;
  step: number;
}

/**
 * 音频选项定价
 */
export interface AudioOption {
  min_price: number;
  additional_price_per_second: number;
}

/**
 * 分辨率定价配置
 */
export interface Resolution {
  name: string;

  // Rule 1: Fixed price (for unit="张" or "条" or "次")
  price?: number;

  // Rule 2 & 4: Time-based pricing
  min_price?: number;
  additional_price_per_second?: number;
  time_range?: TimeRange;

  // Rule 3: Audio options pricing
  audio_options?: {
    silent?: AudioOption;
    audio?: AudioOption;
  };
}

/**
 * AI 模型配置
 */
export interface Model {
  id: string;
  name: string;
  unit: string; // "张", "条", "次", "秒"
  resolutions: Resolution[];
}

/**
 * 模型分类
 */
export interface Category {
  category: string;
  name: string;
  models: Model[];
}
