// 定义一个重置所有 store 的插件
export default function resetStorePlugin({ store }) {
  store.$reset = () => {
    // 假设 store 是用 options API 定义的
    // 或者手动将状态重置为初始值
    const initialState = store.$state;
    store.$patch(state => {
      Object.assign(state, JSON.parse(JSON.stringify(initialState)));
    });
  };
}
