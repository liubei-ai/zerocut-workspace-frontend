import { Ref } from 'vue';

// Read the stream from the server
export const read = async (
  reader: ReadableStreamDefaultReader<Uint8Array>,
  target: Ref<string> | Ref<any[]>,
  messageIndex?: number
): Promise<void> => {
  // TextDecoder is a built-in object that allows you to convert a stream of bytes into a string
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    // 读取流数据
    const { done, value } = await reader.read();

    // 如果流已结束，则退出循环
    if (done) break;

    // 解码当前块数据
    const chunk = decoder.decode(value, { stream: true });
    buffer += chunk;

    // 处理数据行
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    let eventType = '';
    let eventData = '';

    const eventPrefix = 'event:';
    const dataPrefix = 'data:';

    for (const line of lines) {
      // 跳过空行和注释
      if (!line.trim() || line.trim() === '' || line.startsWith(':')) {
        continue;
      }

      if (line.startsWith(eventPrefix)) {
        eventType = line.substring(eventPrefix.length).trim();
      } else if (line.startsWith(dataPrefix)) {
        eventData = line.substring(dataPrefix.length).trim();
      }

      // 只处理message类型的事件
      if (eventType === 'message' && eventData) {
        try {
          const parsedData = JSON.parse(eventData);
          if (parsedData.data && parsedData.data.delta) {
            const deltaContent = parsedData.data.delta;
            if (target.value instanceof Array) {
              // 如果提供了特定的消息索引，则更新该索引的消息
              // 否则使用默认的最后一个消息
              const indexToUpdate = typeof messageIndex === 'number' ? messageIndex : target.value.length - 1;
              target.value[indexToUpdate].content += deltaContent;
            } else {
              target.value = target.value += deltaContent;
            }
          }
        } catch (error) {
          console.error('解析事件数据失败:', error, eventData);
        } finally {
          eventType = '';
          eventData = '';
        }
      }
    }
  }

  // 流处理完成，释放锁
  reader.releaseLock();
};

// Count the number of code blocks and complete the last one if it is not completed
export const countAndCompleteCodeBlocks = (text: string) => {
  const codeBlocks = text.split('```').length - 1;
  if (codeBlocks && codeBlocks % 2 !== 0) {
    return text + '\n```\n';
  }
  return text;
};
