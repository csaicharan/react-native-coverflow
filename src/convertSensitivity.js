import { SENSITIVITY_LOW, SENSITIVITY_NORMAL, SENSITIVITY_HIGH } from './constants';

export default function convertSensitivity(sensitivity) {
  switch (sensitivity) {
    case SENSITIVITY_LOW:
      return 100; // Reduced from 120 for better low sensitivity response
    case SENSITIVITY_HIGH:
      return 30;  // Reduced from 40 for better high sensitivity response
    case SENSITIVITY_NORMAL:
    default:
      return 50;  // Reduced from 60 for better normal sensitivity response
  }
}