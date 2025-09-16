"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = convertSensitivity;
var _constants = require("./constants");
function convertSensitivity(sensitivity) {
  switch (sensitivity) {
    case _constants.SENSITIVITY_LOW:
      return 100;
    // Reduced from 120 for better low sensitivity response
    case _constants.SENSITIVITY_HIGH:
      return 30;
    // Reduced from 40 for better high sensitivity response
    case _constants.SENSITIVITY_NORMAL:
    default:
      return 50;
    // Reduced from 60 for better normal sensitivity response
  }
}
//# sourceMappingURL=convertSensitivity.js.map