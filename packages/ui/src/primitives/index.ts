export { Button, buttonVariants, type ButtonProps } from './Button';

export { Input, inputVariants, type InputProps } from './Input';

export { Textarea, type TextareaProps } from './Textarea';

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
  type MultiSelectProps,
} from './Select';

export { Checkbox, type CheckboxProps } from './Checkbox';

export {
  RadioGroup,
  RadioGroupItem,
  radioGroupItemVariants,
  type RadioGroupProps,
  type RadioGroupItemProps,
} from './RadioGroup';

export { Switch, switchVariants, type SwitchProps } from './Switch';

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
} from './Dialog';

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
} from './DropdownMenu';

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  type PopoverContentProps,
} from './Popover';

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
} from './Tooltip';

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
} from './Tabs';
export type { TabsProps, TabsListProps, TabsTriggerProps, TabsContentProps } from './Tabs';

// Accordion
export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  accordionVariants,
  accordionItemVariants,
  accordionTriggerVariants,
} from './Accordion';
export type { AccordionProps, AccordionItemProps, AccordionTriggerProps } from './Accordion';

// Avatar
export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  avatarVariants,
  avatarFallbackVariants,
  statusDotVariants,
  getInitials,
} from './Avatar';
export type { AvatarProps, AvatarImageProps, AvatarFallbackProps } from './Avatar';

// Badge
export { Badge, badgeVariants } from './Badge';
export type { BadgeProps, BadgeVariantKey } from './Badge';

// Separator
export { Separator, separatorVariants } from './Separator';
export type { SeparatorProps } from './Separator';

// ScrollArea
export { ScrollArea, ScrollBar } from './ScrollArea';

// Skeleton
export { Skeleton, SkeletonText, SkeletonAvatar, skeletonVariants } from './Skeleton';
export type { SkeletonProps } from './Skeleton';

// Label
export { Label, labelVariants } from './Label';
export type { LabelProps } from './Label';

// Slider
export {
  Slider,
  sliderVariants,
  sliderTrackVariants,
  sliderRangeVariants,
  sliderThumbVariants,
} from './Slider';
export type { SliderProps, SliderMark } from './Slider';

// ProgressBar
export { ProgressBar, progressBarVariants } from './ProgressBar';
export type { ProgressBarProps } from './ProgressBar';

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
} from './Toast';
export type { ToastProps, ToastViewportProps } from './Toast';
