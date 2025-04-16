const httpStatus = require('http-status-codes').StatusCodes;

module.exports = (err, req, res, next) => {
  console.error(err.message, err);
  res
    .status(httpStatus.INTERNAL_SERVER_ERROR)
    .json({ error: 'Something went wrong. Please try again!' });
};
