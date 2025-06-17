import { Ref } from 'vue';

// Read the stream from the server
export const read = async (
  reader: ReadableStreamDefaultReader<Uint8Array>,
  target: Ref<string> | Ref<any[]>
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

    let eventId = '';
    let eventType = '';
    let eventData = '';

    for (const line of lines) {
      // 跳过空行和注释
      if (!line.trim() || line.trim() === '' || line.startsWith(':')) {
        continue;
      }

      if (line.startsWith('id:')) {
        eventId = line.substring(3).trim();
      } else if (line.startsWith('event:')) {
        eventType = line.substring(6).trim();
      } else if (line.startsWith('data:')) {
        eventData = line.substring(5).trim();
      }

      // 只处理message类型的事件
      if (eventType === 'message' && eventData) {
        try {
          const parsedData = JSON.parse(eventData);
          if (parsedData.data && parsedData.data.delta) {
            const deltaContent = parsedData.data.delta;
            if (target.value instanceof Array) {
              target.value[target.value.length - 1].content += deltaContent;
            } else {
              target.value = target.value += deltaContent;
            }
          }
        } catch (error) {
          console.error('解析事件数据失败:', error, eventData);
        } finally {
          eventId = '';
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
