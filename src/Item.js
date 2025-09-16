import React, { memo, useContext } from 'react';
import { Animated, TouchableWithoutFeedback, View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import { AnimatedPositionContext } from './Coverflow';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Context wrapper for children components
const AnimatedPositionWrapper = ({ children, position }) => {
  const scroll = useContext(AnimatedPositionContext);
  
  const animatedPosition = scroll ? scroll.interpolate({
    inputRange: [position - 2, position - 1, position, position + 1, position + 2],
    outputRange: [-1, -1, 0, 1, 1],
  }) : null;

  // Clone the child and add the animatedPosition prop if needed
  if (React.isValidElement(children) && animatedPosition) {
    return React.cloneElement(children, { animatedPosition });
  }
  
  return children;
};

const Item = memo(({
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
  children,
}) => {
  const style = {
    transform: [
      { perspective },
      {
        translateX: scroll.interpolate({
          inputRange: [position - 2, position - 1, position, position + 1, position + 2],
          outputRange: [spacing + wingSpan, spacing, 0, -spacing, -spacing - wingSpan],
        }),
      },
      {
        scale: scroll.interpolate({
          inputRange: [position - 2, position - 1, position, position + 1, position + 2],
          outputRange: [scaleFurther, scaleDown, 1, scaleDown, scaleFurther],
        }),
      },
      {
        rotateY: scroll.interpolate({
          inputRange: [
            position - 2,
            position - 1,
            position - 0.5,
            position,
            position + 0.5,
            position + 1,
            position + 2,
          ],
          outputRange: [
            `-${rotation}deg`,
            `-${rotation}deg`,
            `-${midRotation}deg`,
            '0deg',
            `${midRotation}deg`,
            `${rotation}deg`,
            `${rotation}deg`,
          ],
        }),
      },
    ],
    // Add zIndex to ensure center item appears above others
    zIndex: scroll.interpolate({
      inputRange: [position - 2, position - 1, position, position + 1, position + 2],
      outputRange: [1, 2, 10, 2, 1],
    }),
  };

  return (
    <View pointerEvents="box-none" style={styles.container}>
      <TouchableWithoutFeedback 
        onPress={() => onSelect(position)}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Coverflow item ${position + 1}`}
        accessibilityHint="Tap to select this item"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Improve touch target
      >
        <Animated.View style={style}>
          <AnimatedPositionWrapper position={position}>
            {children}
          </AnimatedPositionWrapper>
        </Animated.View>
      </TouchableWithoutFeedback>
    </View>
  );
});

Item.propTypes = {
  scroll: PropTypes.instanceOf(Animated.Value).isRequired,
  position: PropTypes.number.isRequired,
  children: PropTypes.element.isRequired,
  wingSpan: PropTypes.number.isRequired,
  spacing: PropTypes.number.isRequired,
  rotation: PropTypes.number.isRequired,
  midRotation: PropTypes.number.isRequired,
  perspective: PropTypes.number.isRequired,
  scaleDown: PropTypes.number.isRequired,
  scaleFurther: PropTypes.number.isRequired,
  onSelect: PropTypes.func.isRequired,
};

Item.displayName = 'Item';

export default Item;
