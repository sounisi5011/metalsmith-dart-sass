const map = new Map();

module.exports = opts => {
  if (map.has(opts)) {
    return map.get(opts);
  }

  const func = () => {};
  map.set(opts, func);
  return func;
};
