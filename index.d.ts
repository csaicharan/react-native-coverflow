import React from 'react';

export interface CoverflowProps {
  /**
   * A callback invoked whenever the selection changes
   */
  onChange: (index: number) => void;
  
  /**
   * A callback invoked when the central card is pressed
   */
  onPress?: (index: number) => void;
  
  /**
   * The card that needs to be centered initially
   * @default 0
   */
  initialSelection?: number;
  
  /**
   * The number of pixels between the center card and its adjacent card
   * @default 100
   */
  spacing?: number;
  
  /**
   * The number of pixels between the adjacent card and its next card
   * @default 80
   */
  wingSpan?: number;
  
  /**
   * The angle in degrees at which the non centered cards need to be rotated
   * @default 50
   */
  rotation?: number;
  
  /**
   * The angle at which the center card needs to rotate during transition
   * @default 50
   */
  midRotation?: number;
  
  /**
   * The perspective value for 3D projection
   * @default 800
   */
  perspective?: number;
  
  /**
   * A scale factor for the card adjacent to the center
   * @default 0.8
   */
  scaleDown?: number;
  
  /**
   * A diminishing scale factor for the card next to the adjacent card
   * @default 0.75
   */
  scaleFurther?: number;
  
  /**
   * Touch sensitivity
   * @default 'normal'
   */
  sensitivity?: 'low' | 'normal' | 'high';
  
  /**
   * Animation deceleration
   * @default 0.994
   */
  deceleration?: number;
  
  /**
   * The child components to display in the coverflow
   */
  children: React.ReactElement[];
  
  /**
   * Additional styles for the container
   */
  style?: any;
}

export interface AnimatedPositionContextValue {
  animatedPosition?: any;
}

export const AnimatedPositionContext: React.Context<any>;

declare const Coverflow: React.ComponentType<CoverflowProps>;

export default Coverflow;