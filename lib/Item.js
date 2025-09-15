"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _propTypes = _interopRequireDefault(require("prop-types"));
var _Coverflow = require("./Coverflow");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const styles = _reactNative.StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

// Context wrapper for children components
const AnimatedPositionWrapper = ({
  children,
  position
}) => {
  const scroll = (0, _react.useContext)(_Coverflow.AnimatedPositionContext);
  const animatedPosition = scroll ? scroll.interpolate({
    inputRange: [position - 2, position - 1, position, position + 1, position + 2],
    outputRange: [-1, -1, 0, 1, 1]
  }) : null;

  // Clone the child and add the animatedPosition prop if needed
  if (/*#__PURE__*/_react.default.isValidElement(children) && animatedPosition) {
    return /*#__PURE__*/_react.default.cloneElement(children, {
      animatedPosition
    });
  }
  return children;
};
const Item = /*#__PURE__*/(0, _react.memo)(({
  scroll,
  position,
  rotation,
  midRotation,
  perspective,
  scaleDown,
  scaleFurther,
  wingSpan,
  spacing,
  onSelect,
  children
}) => {
  const style = {
    transform: [{
      perspective
    }, {
      translateX: scroll.interpolate({
        inputRange: [position - 2, position - 1, position, position + 1, position + 2],
        outputRange: [spacing + wingSpan, spacing, 0, -spacing, -spacing - wingSpan]
      })
    }, {
      scale: scroll.interpolate({
        inputRange: [position - 2, position - 1, position, position + 1, position + 2],
        outputRange: [scaleFurther, scaleDown, 1, scaleDown, scaleFurther]
      })
    }, {
      rotateY: scroll.interpolate({
        inputRange: [position - 2, position - 1, position - 0.5, position, position + 0.5, position + 1, position + 2],
        outputRange: [`-${rotation}deg`, `-${rotation}deg`, `-${midRotation}deg`, '0deg', `${midRotation}deg`, `${rotation}deg`, `${rotation}deg`]
      })
    }]
  };
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    pointerEvents: "box-none",
    style: styles.container
  }, /*#__PURE__*/_react.default.createElement(_reactNative.TouchableWithoutFeedback, {
    onPress: () => onSelect(position),
    accessible: true,
    accessibilityRole: "button",
    accessibilityLabel: `Coverflow item ${position + 1}`,
    accessibilityHint: "Tap to select this item"
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Animated.View, {
    style: style
  }, /*#__PURE__*/_react.default.createElement(AnimatedPositionWrapper, {
    position: position
  }, children))));
});
Item.propTypes = {
  scroll: _propTypes.default.instanceOf(_reactNative.Animated.Value).isRequired,
  position: _propTypes.default.number.isRequired,
  children: _propTypes.default.element.isRequired,
  wingSpan: _propTypes.default.number.isRequired,
  spacing: _propTypes.default.number.isRequired,
  rotation: _propTypes.default.number.isRequired,
  midRotation: _propTypes.default.number.isRequired,
  perspective: _propTypes.default.number.isRequired,
  scaleDown: _propTypes.default.number.isRequired,
  scaleFurther: _propTypes.default.number.isRequired,
  onSelect: _propTypes.default.func.isRequired
};
Item.displayName = 'Item';
var _default = exports.default = Item;
//# sourceMappingURL=Item.js.map