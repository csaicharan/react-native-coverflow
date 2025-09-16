"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = convertSensitivity;
var _constants = require("./constants");
function convertSensitivity(sensitivity) {
  switch (sensitivity) {
    case _constants.SENSITIVITY_LOW:
      return 120;
    case _constants.SENSITIVITY_HIGH:
      return 40;
    case _constants.SENSITIVITY_NORMAL:
    default:
      return 60;
  }
}
//# sourceMappingURL=convertSensitivity.js.map