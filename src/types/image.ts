/**
 * 图片状态类型
 * - existing: 已存在的图片（从服务器加载）
 * - new: 新上传的图片（本次会话上传成功）
 * - uploading: 上传中
 * - error: 上传失败
 */
export type ImageStatus = 'existing' | 'new' | 'uploading' | 'error';

/**
 * 图片画廊展示项
 */
export interface GalleryImage {
  /**
   * 唯一标识（用于v-for key和事件传递）
   */
  id: string;

  /**
   * 图片URL（可能是blob URL、data URL或服务器URL）
   */
  url: string;

  /**
   * 图片状态
   */
  status: ImageStatus;

  /**
   * 上传进度（仅uploading状态，范围0-100）
   */
  uploadProgress?: number;

  /**
   * 文件名（用于底部显示）
   */
  fileName?: string;

  /**
   * 错误信息（仅error状态）
   */
  errorMessage?: string;

  /**
   * 原始File对象（仅uploading状态，用于可能的重试）
   */
  file?: File;
}
