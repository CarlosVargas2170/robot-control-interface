
import {type ReactNode } from "react";

export interface ButtonOptionProps {
  /** Font Awesome icon class, e.g. "fas fa-camera" */
  icon: string;
  /** Tooltip text shown on hover */
  tooltip: string;
  /** Accent variant for camera-like buttons */
  variant?: "cam";
  /** Click handler for simple buttons (ignored when dropdown is present) */
  onClick?: () => void;
  /** Dropdown content — when provided the button becomes a dropdown toggle */
  children?: ReactNode;
}

export interface DropdownSubmenuProps {
  icon: string;
  label: string;
  children: ReactNode;
}