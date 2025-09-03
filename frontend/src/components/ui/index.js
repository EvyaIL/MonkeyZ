// Component library barrel export
// frontend/src/components/ui/index.js

// Core Components
export { Button } from './Button'
export { Input } from './Input'
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card'
export { Badge } from './Badge'

// Form Components
export { Select, SelectItem } from './Select'
export { Checkbox } from './Checkbox'

// Typography Components
export { 
  Typography, 
  H1, H2, H3, H4, H5, H6, 
  P, Lead, Large, Small, Muted, Caption, 
  Code, Kbd 
} from './Typography'

// Overlay Components
export { 
  Modal, 
  ModalHeader, 
  ModalTitle, 
  ModalDescription, 
  ModalContent, 
  ModalFooter, 
  ModalCloseButton 
} from './Modal'

// Feedback Components
export { Alert, AlertTitle, AlertDescription, AlertIcons } from './Alert'
export { ToastProvider, useToast, ToastIcons } from './Toast'

// Loading Components
export { 
  Spinner, 
  LoadingDots, 
  LoadingBar, 
  LoadingOverlay, 
  LoadingCard 
} from './Loading'

// Interactive Components
export {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
  useDropdown
} from './Dropdown'

// Re-export utilities
export { cn, animations, createFocusTrap, debounce, throttle } from '../../lib/utils'
