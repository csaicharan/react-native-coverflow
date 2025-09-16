import React, { Component, Children, createContext } from 'react';
import { Animated, View, PanResponder, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import {
  SENSITIVITY_LOW,
  SENSITIVITY_NORMAL,
  SENSITIVITY_HIGH,
  DECELERATION_NORMAL,
  DECELERATION_FAST,
} from './constants';

import Item from './Item';
import clamp from './clamp';
import fixChildrenOrder from './fixChildrenOrder';
import convertSensitivity from './convertSensitivity';

// Create context for animated position
export const AnimatedPositionContext = createContext();

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

class Coverflow extends Component {
  static propTypes = {
    sensitivity: PropTypes.oneOf([SENSITIVITY_LOW, SENSITIVITY_NORMAL, SENSITIVITY_HIGH]),
    deceleration: PropTypes.oneOf([DECELERATION_NORMAL, DECELERATION_FAST]),
    initialSelection: PropTypes.number,
    spacing: PropTypes.number,
    wingSpan: PropTypes.number,
    rotation: PropTypes.number,
    midRotation: PropTypes.number,
    perspective: PropTypes.number,
    scaleDown: PropTypes.number,
    scaleFurther: PropTypes.number,
    children: PropTypes.arrayOf(PropTypes.element).isRequired,
    onPress: PropTypes.func,
    onChange: PropTypes.func.isRequired,
  };

  static defaultProps = {
    initialSelection: 0,
    style: undefined,
    sensitivity: SENSITIVITY_NORMAL,
    deceleration: DECELERATION_NORMAL,
    spacing: 100,
    wingSpan: 80,
    rotation: 50,
    midRotation: 50,
    perspective: 800,
    scaleDown: 0.8,
    scaleFurther: 0.75,
    onPress: undefined,
  };

  constructor(props) {
    super(props);

    const sensitivity = convertSensitivity(props.sensitivity);
    this.scrollPos = props.initialSelection;
    const scrollX = new Animated.Value(props.initialSelection);
    this.state = {
      width: 0,
      sensitivity,
      scrollX,
      selection: props.initialSelection,
      children: fixChildrenOrder(props, props.initialSelection),
    };

    // Initialize pan responder and scroll listener in constructor
    this.initializePanResponder(scrollX, sensitivity);
  }

  componentDidMount() {
    const { scrollX } = this.state;
    this.scrollListener = scrollX.addListener(this.onScroll);
  }

  initializePanResponder = (scrollX, sensitivity) => {
    this.panResponder = PanResponder.create({
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
      onPanResponderTerminationRequest: () => false, // Better gesture handling in RN 0.80.2
      onPanResponderMove: (evt, gestureState) => {
        // Improved gesture handling with better sensitivity application
        const deltaX = -(gestureState.dx / sensitivity);
        scrollX.setValue(deltaX);
      },
      onPanResponderRelease: (evt, gestureState) => {
        scrollX.flattenOffset();

        const count = Children.count(this.props.children);
        const currentPos = this.scrollPos;
        
        // Improved velocity and distance-based logic
        const moveDistance = Math.abs(gestureState.dx);
        const velocity = Math.abs(gestureState.vx);
        const shouldUseVelocity = velocity > 0.3 && moveDistance > 20;

        if (shouldUseVelocity && currentPos >= 0 && currentPos < count - 1) {
          // Better velocity calculation with improved sensitivity handling
          const normalizedVelocity = -Math.sign(gestureState.vx) * clamp(velocity * 2, 0.5, 4);
          const adjustedVelocity = normalizedVelocity / (sensitivity * 0.3);
          const deceleration = this.props.deceleration;

          Animated.decay(scrollX, {
            velocity: adjustedVelocity,
            deceleration,
            useNativeDriver: false, // transform animations cannot use native driver
            isInteraction: false, // Prevents blocking other interactions in RN 0.80.2
          }).start(({ finished }) => {
            // Always snap to position after decay, regardless of finished state
            this.snapToPosition();
          });
        } else {
          // For slower gestures or small movements, immediately snap
          this.snapToPosition();
        }
      },
    });
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const sensitivity = convertSensitivity(nextProps.sensitivity);
    const selection = clamp(prevState.selection, 0, Children.count(nextProps.children) - 1);
    const children = fixChildrenOrder(nextProps, selection);

    // Return new state if changes are needed
    if (prevState.selection !== selection || prevState.sensitivity !== sensitivity) {
      return {
        selection,
        sensitivity,
        children,
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

  onScroll = ({ value }) => {
    // Update the most recent value
    this.scrollPos = value;

    const count = this.state.children.length;
    const newSelection = clamp(Math.round(value), 0, count - 1);
    
    // Only update state if selection actually changed to prevent unnecessary re-renders
    if (newSelection !== this.state.selection) {
      // Use requestAnimationFrame to batch state updates for better performance
      requestAnimationFrame(() => {
        this.setState({
          selection: newSelection,
          children: fixChildrenOrder(this.props, newSelection),
        });
        
        // Call onChange callback when selection changes
        if (this.props.onChange) {
          this.props.onChange(newSelection);
        }
      });
    }
  }

  onLayout = ({ nativeEvent }) => {
    this.setState({
      width: nativeEvent.layout.width,
    });
  }

  onSelect = (idx) => {
    // Check if the current selection is "exactly" the same
    if (idx === Math.round(this.scrollPos)) {
      if (this.props.onPress) {
        this.props.onPress(idx);
      }
    } else {
      this.snapToPosition(idx);
    }
  }

  snapToPosition = (pos = this.scrollPos) => {
    const { scrollX, children } = this.state;
    const count = children.length;

    const finalPos = clamp(Math.round(pos), 0, count - 1);
    
    // Use a tolerance to prevent unnecessary animations for very small differences
    const tolerance = 0.01;
    if (Math.abs(finalPos - this.scrollPos) > tolerance) {
      // Call onChange only when position actually changes
      if (this.props.onChange && finalPos !== this.state.selection) {
        this.props.onChange(finalPos);
      }

      Animated.spring(scrollX, {
        toValue: finalPos,
        useNativeDriver: false, // transform animations cannot use native driver
        isInteraction: false, // Prevents blocking other interactions in RN 0.80.2
        tension: 100, // Improved spring animation settings for smoother feel
        friction: 8,
      }).start();
    }
  }

  renderItem = ([position, item]) => {
    if (!this.state.width) {
      return null;
    }

    const { scrollX } = this.state;
    const {
      rotation,
      midRotation,
      perspective,
      children,
      scaleDown,
      scaleFurther,
      spacing,
      wingSpan,
    } = this.props;
    const count = Children.count(children);

    return (
      <Item
        key={item.key}
        scroll={scrollX}
        position={position}
        count={count}
        spacing={spacing}
        wingSpan={wingSpan}
        rotation={rotation}
        midRotation={midRotation}
        perspective={perspective}
        scaleDown={scaleDown}
        scaleFurther={scaleFurther}
        onSelect={this.onSelect}
      >
        {item}
      </Item>
    );
  }

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
    const { children, scrollX } = this.state;

    return (
      <AnimatedPositionContext.Provider value={scrollX}>
        <View
          style={[styles.container, style]}
          {...props}
          onLayout={this.onLayout}
          {...this.panResponder.panHandlers}
          accessible={true}
          accessibilityRole="adjustable"
          accessibilityLabel="Coverflow carousel"
          accessibilityHint="Swipe left or right to navigate between items"
          accessibilityValue={{
            min: 0,
            max: children.length - 1,
            now: this.state.selection,
          }}
        >
          {children.map(this.renderItem)}
        </View>
      </AnimatedPositionContext.Provider>
    );
  }
}

export default Coverflow;
