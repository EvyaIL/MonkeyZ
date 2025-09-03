// Design System Demo Component
// frontend/src/components/DesignSystemDemo.jsx

import React, { useState } from 'react'
import {
  Button,
  Card, CardHeader, CardTitle, CardContent, CardFooter,
  Input,
  Select, SelectItem,
  Checkbox,
  Badge,
  Alert, AlertTitle, AlertDescription,
  Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter,
  Dropdown, DropdownTrigger, DropdownContent, DropdownItem,
  H1, H2, H3, P, Small, Muted,
  Spinner, LoadingBar,
  useToast,
  useDropdown
} from './ui'

const DesignSystemDemo = () => {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState('')
  const [checkboxValue, setCheckboxValue] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(45)
  const { toast } = useToast()
  const dropdown = useDropdown()

  const handleToastDemo = (type) => {
    switch (type) {
      case 'success':
        toast.success('Success!', 'Your action was completed successfully.')
        break
      case 'error':
        toast.error('Error!', 'Something went wrong. Please try again.')
        break
      case 'warning':
        toast.warning('Warning!', 'Please review your input.')
        break
      case 'info':
        toast.info('Info', 'Here is some helpful information.')
        break
      default:
        toast.default('Default', 'This is a default notification.')
    }
  }

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-4">
        <H1>🎨 MonkeyZ Design System</H1>
        <P className="text-[var(--color-text-secondary)]">
          A comprehensive, unified design system replacing the mixed MUI/Tailwind approach
        </P>
        <Badge variant="success">Phase 1 Complete</Badge>
      </div>

      {/* Typography Section */}
      <Card>
        <CardHeader>
          <CardTitle>Typography System</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <H1>Heading 1 - Main Title</H1>
            <H2>Heading 2 - Section Title</H2>
            <H3>Heading 3 - Subsection</H3>
            <P>This is regular paragraph text with proper spacing and line height.</P>
            <Small>Small text for captions and metadata</Small>
            <Muted>Muted text for less important information</Muted>
          </div>
        </CardContent>
      </Card>

      {/* Button Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Button Components</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="primary" loading>Loading</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </div>
        </CardContent>
      </Card>

      {/* Form Components */}
      <Card>
        <CardHeader>
          <CardTitle>Form Components</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Email Address" 
              placeholder="Enter your email"
              helper="We'll never share your email"
            />
            <Input 
              label="Password" 
              type="password"
              placeholder="Enter password"
              showPasswordToggle
            />
          </div>
          
          <Select 
            label="Country"
            placeholder="Select your country"
            value={selectedValue}
            onValueChange={setSelectedValue}
          >
            <SelectItem value="us">United States</SelectItem>
            <SelectItem value="il">Israel</SelectItem>
            <SelectItem value="uk">United Kingdom</SelectItem>
            <SelectItem value="de">Germany</SelectItem>
          </Select>

          <Checkbox
            label="I agree to the terms and conditions"
            checked={checkboxValue}
            onCheckedChange={setCheckboxValue}
            helper="Please read our terms before proceeding"
          />
        </CardContent>
      </Card>

      {/* Feedback Components */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback & Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" onClick={() => handleToastDemo('success')}>
              Success Toast
            </Button>
            <Button variant="outline" onClick={() => handleToastDemo('error')}>
              Error Toast
            </Button>
            <Button variant="outline" onClick={() => handleToastDemo('warning')}>
              Warning Toast
            </Button>
            <Button variant="outline" onClick={() => handleToastDemo('info')}>
              Info Toast
            </Button>
          </div>

          <Alert variant="success">
            <AlertTitle>Success Alert</AlertTitle>
            <AlertDescription>
              Your changes have been saved successfully.
            </AlertDescription>
          </Alert>

          <Alert variant="warning">
            <AlertTitle>Warning Alert</AlertTitle>
            <AlertDescription>
              Please review your input before submitting.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Interactive Components */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Components</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <Button onClick={() => setModalOpen(true)}>
              Open Modal
            </Button>
            
            <div ref={dropdown.dropdownRef}>
              <Dropdown>
                <DropdownTrigger onClick={dropdown.toggle}>
                  Actions
                </DropdownTrigger>
                {dropdown.isOpen && (
                  <DropdownContent>
                    <DropdownItem onClick={() => {
                      console.log('Edit clicked')
                      dropdown.close()
                    }}>
                      Edit
                    </DropdownItem>
                    <DropdownItem onClick={() => {
                      console.log('Delete clicked')
                      dropdown.close()
                    }}>
                      Delete
                    </DropdownItem>
                  </DropdownContent>
                )}
              </Dropdown>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <P>Loading Progress: {loadingProgress}%</P>
              <LoadingBar progress={loadingProgress} />
            </div>
            <div className="flex items-center gap-4">
              <Spinner size="sm" />
              <Spinner size="md" />
              <Spinner size="lg" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badge Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Status Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="destructive">Error</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Modal Demo */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <ModalHeader>
          <ModalTitle>Design System Modal</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <P>This is a fully accessible modal component with focus trapping and keyboard navigation.</P>
          <div className="mt-4 space-y-3">
            <Input placeholder="Test input in modal" />
            <Checkbox label="Modal checkbox example" />
          </div>
        </ModalContent>
        <ModalFooter>
          <Button variant="outline" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => setModalOpen(false)}>
            Confirm
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

export default DesignSystemDemo
