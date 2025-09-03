// Phase 2 Demo: Modern UX Patterns
// frontend/src/pages/Phase2Demo.jsx

import React, { useState } from 'react'
import { 
  Button, 
  Card, 
  Typography, 
  Input, 
  LoadingBarAdvanced,
  IndeterminateLoadingBar,
  CircularProgress,
  StepProgress,
  useToast
} from '../components/ui'
import { 
  ComponentLoadingIndicator, 
  SkeletonList, 
  SkeletonCard, 
  SkeletonTable 
} from '../components/GlobalLoadingIndicator'
import { 
  useCreateProduct, 
  useUpdateProduct, 
  useCreateOrder 
} from '../hooks/useSimpleHooks'
import { useSmartLoading } from '../hooks/useSmartLoading'

const Phase2Demo = () => {
  const [progress, setProgress] = useState(45)
  const [currentStep, setCurrentStep] = useState(1)
  const [isComponentLoading, setIsComponentLoading] = useState(false)
  const { toast } = useToast()
  
  // Demo mutations
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const createOrder = useCreateOrder()
  const { shouldShowLoading, loadingProgress, operationsCount } = useSmartLoading()

  const steps = [
    { title: 'Design', description: 'Create mockups' },
    { title: 'Develop', description: 'Build features' },
    { title: 'Test', description: 'Quality assurance' },
    { title: 'Deploy', description: 'Go live' }
  ]

  const handleOptimisticDemo = async () => {
    try {
      // Simulate creating a product with optimistic updates
      await createProduct.mutateAsync({
        name: 'Demo Product',
        price: 29.99,
        category: 'Electronics',
        description: 'This is a demo product created with optimistic updates'
      })
      
      toast({
        title: 'Success!',
        description: 'Product created with optimistic updates',
        type: 'success'
      })
    } catch (error) {
      console.error('Demo error:', error)
    }
  }

  const handleComponentLoadingDemo = () => {
    setIsComponentLoading(true)
    setTimeout(() => {
      setIsComponentLoading(false)
      toast({
        title: 'Component Loaded!',
        description: 'Smart loading completed',
        type: 'success'
      })
    }, 3000)
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <Typography variant="h1" className="mb-4">
          Phase 2: Modern UX Patterns
        </Typography>
        <Typography variant="large" className="text-[var(--color-text-secondary)]">
          Interactive demo of React Query optimistic updates and smart loading states
        </Typography>
      </div>

      {/* Global Loading State Info */}
      <Card className="p-6">
        <Typography variant="h3" className="mb-4">Global Loading State</Typography>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <Typography variant="small" className="text-[var(--color-text-secondary)]">
              Should Show Loading
            </Typography>
            <Typography variant="h4" className={shouldShowLoading ? "text-[var(--color-success-600)]" : "text-[var(--color-text-secondary)]"}>
              {shouldShowLoading ? 'Active' : 'Idle'}
            </Typography>
          </div>
          <div className="text-center">
            <Typography variant="small" className="text-[var(--color-text-secondary)]">
              Progress
            </Typography>
            <Typography variant="h4" className="text-[var(--color-primary-600)]">
              {loadingProgress}%
            </Typography>
          </div>
          <div className="text-center">
            <Typography variant="small" className="text-[var(--color-text-secondary)]">
              Operations
            </Typography>
            <Typography variant="h4" className="text-[var(--color-warning-600)]">
              {operationsCount}
            </Typography>
          </div>
        </div>
      </Card>

      {/* Loading Bar Demos */}
      <Card className="p-6">
        <Typography variant="h3" className="mb-4">Loading Progress Indicators</Typography>
        
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <Typography variant="h5">Standard Progress Bar</Typography>
              <Typography variant="small">{progress}%</Typography>
            </div>
            <LoadingBarAdvanced progress={progress} />
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={() => setProgress(Math.max(0, progress - 10))}>
                Decrease
              </Button>
              <Button size="sm" onClick={() => setProgress(Math.min(100, progress + 10))}>
                Increase
              </Button>
            </div>
          </div>

          <div>
            <Typography variant="h5" className="mb-2">Indeterminate Loading</Typography>
            <IndeterminateLoadingBar />
          </div>

          <div>
            <Typography variant="h5" className="mb-2">Circular Progress</Typography>
            <div className="flex gap-6 items-center">
              <CircularProgress progress={progress} showText />
              <CircularProgress progress={progress} size={60} strokeWidth={6} color="success" showText />
              <CircularProgress progress={progress} size={80} strokeWidth={8} color="warning" showText />
            </div>
          </div>
        </div>
      </Card>

      {/* Step Progress Demo */}
      <Card className="p-6">
        <Typography variant="h3" className="mb-6">Step Progress Indicator</Typography>
        <StepProgress steps={steps} currentStep={currentStep} />
        <div className="flex gap-2 mt-6">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          <Button 
            size="sm"
            onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
            disabled={currentStep === steps.length - 1}
          >
            Next
          </Button>
        </div>
      </Card>

      {/* Optimistic Updates Demo */}
      <Card className="p-6">
        <Typography variant="h3" className="mb-4">Optimistic Updates Demo</Typography>
        <Typography variant="p" className="mb-4 text-[var(--color-text-secondary)]">
          Click the button below to see optimistic updates in action. The UI will update immediately
          while the server request happens in the background.
        </Typography>
        
        <div className="flex gap-3">
          <Button 
            onClick={handleOptimisticDemo}
            loading={createProduct.isLoading}
          >
            Create Product (Optimistic)
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleComponentLoadingDemo}
          >
            Demo Component Loading
          </Button>
        </div>

        {createProduct.isLoading && (
          <div className="mt-4 p-4 bg-[var(--color-primary-50)] border border-[var(--color-primary-200)] rounded-lg">
            <Typography variant="small" className="text-[var(--color-primary-700)]">
              ⚡ Optimistic update applied! UI updated immediately while server processes the request.
            </Typography>
          </div>
        )}
      </Card>

      {/* Component Loading Demo */}
      <ComponentLoadingIndicator isLoading={isComponentLoading}>
        <Card className="p-6">
          <Typography variant="h3" className="mb-4">Component Loading Overlay</Typography>
          <Typography variant="p" className="mb-4">
            This component demonstrates smart loading overlays that don't interfere with the layout.
            Click "Demo Component Loading" above to see it in action.
          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Typography variant="h6">Sample Content</Typography>
              <Typography variant="small">
                This content gets overlaid with a loading indicator that doesn't shift the layout.
              </Typography>
            </div>
            <div className="space-y-2">
              <Typography variant="h6">More Content</Typography>
              <Typography variant="small">
                The overlay uses backdrop blur for a modern glass-morphism effect.
              </Typography>
            </div>
          </div>
        </Card>
      </ComponentLoadingIndicator>

      {/* Skeleton Loading Demos */}
      <Card className="p-6">
        <Typography variant="h3" className="mb-4">Skeleton Loading States</Typography>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Typography variant="h5" className="mb-3">List Skeleton</Typography>
            <SkeletonList count={3} />
          </div>
          
          <div>
            <Typography variant="h5" className="mb-3">Card Skeleton</Typography>
            <SkeletonCard />
          </div>
        </div>

        <div className="mt-6">
          <Typography variant="h5" className="mb-3">Table Skeleton</Typography>
          <SkeletonTable rows={4} columns={5} />
        </div>
      </Card>

      {/* Performance Metrics */}
      <Card className="p-6">
        <Typography variant="h3" className="mb-4">Performance Insights</Typography>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Typography variant="h6" className="mb-2">React Query Benefits</Typography>
            <ul className="space-y-1 text-sm text-[var(--color-text-secondary)]">
              <li>• Automatic background refetching</li>
              <li>• Smart caching with stale-while-revalidate</li>
              <li>• Optimistic updates for instant UI</li>
              <li>• Intelligent retry logic</li>
              <li>• Reduced bundle size vs Redux</li>
            </ul>
          </div>
          
          <div>
            <Typography variant="h6" className="mb-2">Smart Loading Features</Typography>
            <ul className="space-y-1 text-sm text-[var(--color-text-secondary)]">
              <li>• Minimum loading time prevents flashing</li>
              <li>• Staggered animations improve perceived performance</li>
              <li>• Context-aware indicators</li>
              <li>• Skeleton states maintain layout</li>
              <li>• Progressive loading patterns</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Phase2Demo
