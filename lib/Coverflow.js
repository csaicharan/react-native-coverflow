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
        // Reduce threshold for better responsiveness - 3px is more suitable for modern devices
        const shouldRespond = Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
        return shouldRespond;
      },
      onPanResponderGrant: () => {
        scrollX.stopAnimation();
        scrollX.extractOffset();
      },
      onPanResponderTerminationRequest: () => false,
      // Better gesture handling in RN 0.80.2
      onPanResponderMove: (evt, gestureState) => {
        // Improved gesture handling with better sensitivity application
        const deltaX = -(gestureState.dx / sensitivity);
        scrollX.setValue(deltaX);
      },
      onPanResponderRelease: (evt, gestureState) => {
        scrollX.flattenOffset();
        const count = _react.Children.count(this.props.children);
        const currentPos = this.scrollPos;

        // Improved velocity and distance-based logic
        const moveDistance = Math.abs(gestureState.dx);
        const velocity = Math.abs(gestureState.vx);
        const shouldUseVelocity = velocity > 0.3 && moveDistance > 20;
        if (shouldUseVelocity && currentPos >= 0 && currentPos < count - 1) {
          // Better velocity calculation with improved sensitivity handling
          const normalizedVelocity = -Math.sign(gestureState.vx) * (0, _clamp.default)(velocity * 2, 0.5, 4);
          const adjustedVelocity = normalizedVelocity / (sensitivity * 0.3);
          const deceleration = this.props.deceleration;
          _reactNative.Animated.decay(scrollX, {
            velocity: adjustedVelocity,
            deceleration,
            useNativeDriver: false,
            // transform animations cannot use native driver
            isInteraction: false // Prevents blocking other interactions in RN 0.80.2
          }).start(({
            finished
          }) => {
            // Always snap to position after decay, regardless of finished state
            this.snapToPosition();
          });
        } else {
          // For slower gestures or small movements, immediately snap
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
    // Update the most recent value
    this.scrollPos = value;
    const count = this.state.children.length;
    const newSelection = (0, _clamp.default)(Math.round(value), 0, count - 1);

    // Only update state if selection actually changed to prevent unnecessary re-renders
    if (newSelection !== this.state.selection) {
      // Use requestAnimationFrame to batch state updates for better performance
      requestAnimationFrame(() => {
        this.setState({
          selection: newSelection,
          children: (0, _fixChildrenOrder.default)(this.props, newSelection)
        });

        // Call onChange callback when selection changes
        if (this.props.onChange) {
          this.props.onChange(newSelection);
        }
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
    // Check if the current selection is "exactly" the same
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

    // Use a tolerance to prevent unnecessary animations for very small differences
    const tolerance = 0.01;
    if (Math.abs(finalPos - this.scrollPos) > tolerance) {
      // Call onChange only when position actually changes
      if (this.props.onChange && finalPos !== this.state.selection) {
        this.props.onChange(finalPos);
      }
      _reactNative.Animated.spring(scrollX, {
        toValue: finalPos,
        useNativeDriver: false,
        // transform animations cannot use native driver
        isInteraction: false,
        // Prevents blocking other interactions in RN 0.80.2
        tension: 100,
        // Improved spring animation settings for smoother feel
        friction: 8
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