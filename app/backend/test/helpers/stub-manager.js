const createStubManager = () => {
  const restores = [];

  const stub = (obj, key, replacement) => {
    const original = obj[key];
    const wrapper = (...args) => {
      wrapper.calls.push(args);
      return replacement(...args);
    };
    wrapper.calls = [];
    obj[key] = wrapper;
    restores.push(() => {
      obj[key] = original;
    });
    return wrapper;
  };

  const restoreAll = () => {
    while (restores.length) {
      const restore = restores.pop();
      restore();
    }
  };

  return { stub, restoreAll };
};

module.exports = { createStubManager };
