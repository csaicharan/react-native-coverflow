"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.AnimatedPositionContext = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _propTypes = _interopRequireDefault(require("prop-types"));
var _constants = require("./constants");
var _Item = _interopRequireDefault(require("./Item"));
var _clamp = _interopRequireDefault(require("./clamp"));
var _fixChildrenOrder = _interopRequireDefault(require("./fixChildrenOrder"));
var _convertSensitivity = _interopRequireDefault(require("./convertSensitivity"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Create context for animated position
const AnimatedPositionContext = exports.AnimatedPositionContext = /*#__PURE__*/(0, _react.createContext)();
const styles = _reactNative.StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center'
  }
});
class Coverflow extends _react.Component {
  static propTypes = {
    sensitivity: _propTypes.default.oneOf([_constants.SENSITIVITY_LOW, _constants.SENSITIVITY_NORMAL, _constants.SENSITIVITY_HIGH]),
    deceleration: _propTypes.default.oneOf([_constants.DECELERATION_NORMAL, _constants.DECELERATION_FAST]),
    initialSelection: _propTypes.default.number,
    spacing: _propTypes.default.number,
    wingSpan: _propTypes.default.number,
    rotation: _propTypes.default.number,
    midRotation: _propTypes.default.number,
    perspective: _propTypes.default.number,
    scaleDown: _propTypes.default.number,
    scaleFurther: _propTypes.default.number,
    children: _propTypes.default.arrayOf(_propTypes.default.element).isRequired,
    onPress: _propTypes.default.func,
    onChange: _propTypes.default.func.isRequired
  };
  static defaultProps = {
    initialSelection: 0,
    style: undefined,
    sensitivity: _constants.SENSITIVITY_NORMAL,
    deceleration: _constants.DECELERATION_NORMAL,
    spacing: 100,
    wingSpan: 80,
    rotation: 50,
    midRotation: 50,
    perspective: 800,
    scaleDown: 0.8,
    scaleFurther: 0.75,
    onPress: undefined
  };
  constructor(props) {
    super(props);
    const sensitivity = (0, _convertSensitivity.default)(props.sensitivity);
    this.scrollPos = props.initialSelection;
    const scrollX = new _reactNative.Animated.Value(props.initialSelection);
    this.state = {
      width: 0,
      sensitivity,
      scrollX,
      selection: props.initialSelection,
      children: (0, _fixChildrenOrder.default)(props, props.initialSelection)
    };

    // Initialize pan responder and scroll listener in constructor
    this.initializePanResponder(scrollX, sensitivity);
  }
  componentDidMount() {
    const {
      scrollX
    } = this.state;
    this.scrollListener = scrollX.addListener(this.onScroll);
  }
  initializePanResponder = (scrollX, sensitivity) => {
    this.panResponder = _reactNative.PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: () => {
        scrollX.stopAnimation();
        scrollX.extractOffset();
      },
      onPanResponderTerminationRequest: () => false,
      // Better gesture handling in RN 0.80.2
      onPanResponderMove: (evt, gestureState) => {
        scrollX.setValue(-(gestureState.dx / sensitivity));
      },
      onPanResponderRelease: (evt, gestureState) => {
        scrollX.flattenOffset();
        const count = _react.Children.count(this.props.children);
        const selection = Math.round(this.scrollPos);

        // Damp out the scroll with certain deceleration
        if (selection > 0 && selection < count - 2 && Math.abs(gestureState.vx) > 1) {
          const velocity = -Math.sign(gestureState.vx) * ((0, _clamp.default)(Math.abs(gestureState.vx), 3, 5) / sensitivity);
          const deceleration = this.props.deceleration;
          _reactNative.Animated.decay(scrollX, {
            velocity,
            deceleration
          }).start(({
            finished
          }) => {
            // Only snap to finish if the animation was completed gracefully
            if (finished) {
              this.snapToPosition();
            }
          });
        } else {
          this.snapToPosition();
        }
      }
    });
  };
  static getDerivedStateFromProps(nextProps, prevState) {
    const sensitivity = (0, _convertSensitivity.default)(nextProps.sensitivity);
    const selection = (0, _clamp.default)(prevState.selection, 0, _react.Children.count(nextProps.children) - 1);
    const children = (0, _fixChildrenOrder.default)(nextProps, selection);

    // Return new state if changes are needed
    if (prevState.selection !== selection || prevState.sensitivity !== sensitivity) {
      return {
        selection,
        sensitivity,
        children
      };
    }
    return null;
  }
  componentDidUpdate(prevProps, prevState) {
    // Handle scrollX value change when selection changes
    if (prevState.selection !== this.state.selection) {
      this.state.scrollX.setValue(this.state.selection);
    }

    // Update pan responder if sensitivity changed
    if (prevState.sensitivity !== this.state.sensitivity) {
      this.initializePanResponder(this.state.scrollX, this.state.sensitivity);
    }
  }
  componentWillUnmount() {
    if (this.scrollListener) {
      this.state.scrollX.removeListener(this.scrollListener);
    }
  }
  onScroll = ({
    value
  }) => {
    this.scrollPos = value;
    const count = this.state.children.length;
    const newSelection = (0, _clamp.default)(Math.round(value), 0, count - 1);
    if (newSelection !== this.state.selection) {
      this.setState({
        selection: newSelection,
        children: (0, _fixChildrenOrder.default)(this.props, newSelection)
      });
    }
  };
  onLayout = ({
    nativeEvent
  }) => {
    this.setState({
      width: nativeEvent.layout.width
    });
  };
  onSelect = idx => {
    if (idx === Math.round(this.scrollPos)) {
      if (this.props.onPress) {
        this.props.onPress(idx);
      }
    } else {
      this.snapToPosition(idx);
    }
  };
  snapToPosition = (pos = this.scrollPos) => {
    const {
      scrollX,
      children
    } = this.state;
    const count = children.length;
    const finalPos = (0, _clamp.default)(Math.round(pos), 0, count - 1);
    if (finalPos !== this.scrollPos) {
      this.props.onChange(finalPos);
      _reactNative.Animated.spring(scrollX, {
        toValue: finalPos
      }).start();
    }
  };
  renderItem = ([position, item]) => {
    if (!this.state.width) {
      return null;
    }
    const {
      scrollX
    } = this.state;
    const {
      rotation,
      midRotation,
      perspective,
      children,
      scaleDown,
      scaleFurther,
      spacing,
      wingSpan
    } = this.props;
    const count = _react.Children.count(children);
    return /*#__PURE__*/_react.default.createElement(_Item.default, {
      key: item.key,
      scroll: scrollX,
      position: position,
      count: count,
      spacing: spacing,
      wingSpan: wingSpan,
      rotation: rotation,
      midRotation: midRotation,
      perspective: perspective,
      scaleDown: scaleDown,
      scaleFurther: scaleFurther,
      onSelect: this.onSelect
    }, item);
  };
  render() {
    const {
      style,
      rotation,
      midRotation,
      scaleDown,
      scaleFurther,
      perspective,
      spacing,
      wingSpan,
      ...props
    } = this.props;
    const {
      children,
      scrollX
    } = this.state;
    return /*#__PURE__*/_react.default.createElement(AnimatedPositionContext.Provider, {
      value: scrollX
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, _extends({
      style: [styles.container, style]
    }, props, {
      onLayout: this.onLayout
    }, this.panResponder.panHandlers, {
      accessible: true,
      accessibilityRole: "adjustable",
      accessibilityLabel: "Coverflow carousel",
      accessibilityHint: "Swipe left or right to navigate between items",
      accessibilityValue: {
        min: 0,
        max: children.length - 1,
        now: this.state.selection
      }
    }), children.map(this.renderItem)));
  }
}
var _default = exports.default = Coverflow;
//# sourceMappingURL=Coverflow.js.map