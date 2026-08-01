export {
  Button,
  buttonVariants,
  type ButtonProps,
} from './Button.js';

export {
  Input,
  inputVariants,
  type InputProps,
} from './Input.js';

export {
  Textarea,
  type TextareaProps,
} from './Textarea.js';

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
  MultiSelect,
  type SelectTriggerProps,
  type SelectContentProps,
  type SelectItemProps,
  type MultiSelectProps,
} from './Select.js';

export {
  Checkbox,
  type CheckboxProps,
} from './Checkbox.js';

export {
  RadioGroup,
  RadioGroupItem,
  radioGroupItemVariants,
  type RadioGroupProps,
  type RadioGroupItemProps,
} from './RadioGroup.js';

export {
  Switch,
  switchVariants,
  type SwitchProps,
} from './Switch.js';

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  dialogContentVariants,
  type DialogContentProps,
  type DialogHeaderProps,
  type DialogBodyProps,
  type DialogFooterProps,
} from './Dialog.js';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from './DropdownMenu.js';

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  type PopoverContentProps,
} from './Popover.js';

export {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  RichTooltipHeader,
  RichTooltipBody,
  RichTooltipFooter,
  tooltipContentVariants,
  type TooltipContentProps,
} from './Tooltip.js';

// ─── Batch 2: Data Display & Feedback Primitives ────────────────

// Tabs
export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  tabsRootVariants,
  tabsListVariants,
  tabsTriggerVariants,
  tabsContentVariants,
} from './Tabs.js';
export type {
  TabsProps,
  TabsListProps,
  TabsTriggerProps,
  TabsContentProps,
} from './Tabs.js';

// Accordion
export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  accordionVariants,
  accordionItemVariants,
  accordionTriggerVariants,
} from './Accordion.js';
export type {
  AccordionProps,
  AccordionItemProps,
  AccordionTriggerProps,
} from './Accordion.js';

// Avatar
export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  avatarVariants,
  avatarFallbackVariants,
  statusDotVariants,
  getInitials,
} from './Avatar.js';
export type {
  AvatarProps,
  AvatarImageProps,
  AvatarFallbackProps,
} from './Avatar.js';

// Badge
export { Badge, badgeVariants } from './Badge.js';
export type { BadgeProps, BadgeVariantKey } from './Badge.js';

// Separator
export { Separator, separatorVariants } from './Separator.js';
export type { SeparatorProps } from './Separator.js';

// ScrollArea
export { ScrollArea, ScrollBar } from './ScrollArea.js';

// Skeleton
export { Skeleton, SkeletonText, SkeletonAvatar, skeletonVariants } from './Skeleton.js';
export type { SkeletonProps } from './Skeleton.js';

// Label
export { Label, labelVariants } from './Label.js';
export type { LabelProps } from './Label.js';

// Slider
export {
  Slider,
  sliderVariants,
  sliderTrackVariants,
  sliderRangeVariants,
  sliderThumbVariants,
} from './Slider.js';
export type { SliderProps, SliderMark } from './Slider.js';

// ProgressBar
export { ProgressBar, progressBarVariants } from './ProgressBar.js';
export type { ProgressBarProps } from './ProgressBar.js';

// Toast
export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
  toastVariants,
  useToast,
} from './Toast.js';
export type { ToastProps, ToastViewportProps } from './Toast.js';
