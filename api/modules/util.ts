export const structureError = (ctx, error) => {
  return `${ctx}-${error.message
    .hexEncode()
    .slice(-7)
    .toUpperCase()}`;
};
