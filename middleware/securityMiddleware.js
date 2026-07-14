const helmet = require("helmet");
const mongoSanitize = require("mongo-sanitize");
const hpp = require("hpp");

const sanitizeRequest = (req, res, next) => {
  req.body = mongoSanitize(req.body);
  req.params = mongoSanitize(req.params);
  req.query = mongoSanitize(req.query);
  next();
};

module.exports = {
  helmetMiddleware: helmet(),
  hppMiddleware: hpp(),
  sanitizeRequest,
};