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
        return Math.abs(gestureState.dx) > 10
      },
      onPanResponderGrant: () => {
        scrollX.stopAnimation();
        scrollX.extractOffset();
      },
      onPanResponderTerminationRequest: () => false, // Better gesture handling in RN 0.80.2
      onPanResponderMove: (evt, gestureState) => {
        scrollX.setValue(-(gestureState.dx / sensitivity));
      },
      onPanResponderRelease: (evt, gestureState) => {
        scrollX.flattenOffset();

        const count = Children.count(this.props.children);
        const selection = Math.round(this.scrollPos);

        // Damp out the scroll with certain deceleration
        if (selection > 0 && selection < count - 2 && Math.abs(gestureState.vx) > 1) {
          const velocity = -Math.sign(gestureState.vx)
            * (clamp(Math.abs(gestureState.vx), 3, 5) / sensitivity);
          const deceleration = this.props.deceleration;

          Animated.decay(scrollX, {
            velocity,
            deceleration,
          }).start(({ finished }) => {
            // Only snap to finish if the animation was completed gracefully
            if (finished) {
              this.snapToPosition();
            }
          });
        } else {
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
    this.scrollPos = value;

    const count = this.state.children.length;

    const newSelection = clamp(Math.round(value), 0, count - 1);
    if (newSelection !== this.state.selection) {
      this.setState({
        selection: newSelection,
        children: fixChildrenOrder(this.props, newSelection),
      });
    }
  }

  onLayout = ({ nativeEvent }) => {
    this.setState({
      width: nativeEvent.layout.width,
    });
  }

  onSelect = (idx) => {
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
    if (finalPos !== this.scrollPos) {
      this.props.onChange(finalPos);

      Animated.spring(scrollX, {
        toValue: finalPos,
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
