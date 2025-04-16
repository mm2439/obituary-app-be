module.exports = (handler) => async (req, res, next) => {
  try {
    await handler(req, res);
  } catch (ex) {
    console.error(`Something went wrong: ${ex}`);
  }
};
