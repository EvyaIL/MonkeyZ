import React from 'react';

// Generic skeleton component
export const Skeleton = ({ 
  width = '100%', 
  height = '20px', 
  className = '', 
  rounded = false 
}) => (
  <div 
    className={`bg-gray-200 animate-pulse ${rounded ? 'rounded-full' : 'rounded'} ${className}`}
    style={{ width, height }}
  />
);

// Product card skeleton
export const ProductCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm border p-4 h-80 flex flex-col">
    {/* Image skeleton */}
    <Skeleton height="128px" className="mb-3 rounded-lg" />
    
    {/* Title skeleton */}
    <Skeleton height="16px" className="mb-2" />
    <Skeleton height="16px" width="75%" className="mb-3" />
    
    {/* Price skeleton */}
    <Skeleton height="20px" width="60px" className="mb-2" />
    
    {/* Category skeleton */}
    <Skeleton height="14px" width="80px" className="mb-4" />
    
    {/* Button skeleton */}
    <div className="mt-auto">
      <Skeleton height="36px" className="rounded-md" />
    </div>
  </div>
);

// Product grid skeleton
export const ProductGridSkeleton = ({ count = 12 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
    {[...Array(count)].map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

// Navbar skeleton
export const NavbarSkeleton = () => (
  <nav className="p-4 bg-white shadow-md">
    <div className="max-w-7xl mx-auto flex justify-between items-center">
      {/* Logo skeleton */}
      <Skeleton width="120px" height="32px" />
      
      {/* Navigation links skeleton */}
      <div className="hidden md:flex gap-6 items-center">
        <Skeleton width="80px" height="20px" />
        <Skeleton width="60px" height="20px" />
        <Skeleton width="70px" height="20px" />
        <Skeleton width="40px" height="32px" rounded />
      </div>
      
      {/* Cart and menu skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton width="40px" height="40px" className="rounded-lg" />
        <Skeleton width="32px" height="32px" className="md:hidden" />
      </div>
    </div>
  </nav>
);

// Checkout form skeleton
export const CheckoutSkeleton = () => (
  <div className="container mx-auto px-4 py-8">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Order summary skeleton */}
      <div className="bg-white p-6 rounded shadow">
        <Skeleton height="24px" width="150px" className="mb-6" />
        
        {/* Cart items skeleton */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 pb-4 border-b border-gray-200 mb-4">
            <Skeleton width="64px" height="64px" className="rounded" />
            <div className="flex-1">
              <Skeleton height="16px" className="mb-2" />
              <Skeleton height="14px" width="60%" />
            </div>
            <Skeleton width="60px" height="16px" />
          </div>
        ))}
        
        {/* Total skeleton */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex justify-between">
            <Skeleton width="80px" height="20px" />
            <Skeleton width="100px" height="24px" />
          </div>
        </div>
      </div>
      
      {/* Payment form skeleton */}
      <div className="bg-white p-6 rounded shadow">
        <Skeleton height="24px" width="200px" className="mb-6" />
        
        {/* Form fields skeleton */}
        <div className="space-y-4">
          <div>
            <Skeleton height="16px" width="80px" className="mb-2" />
            <Skeleton height="40px" />
          </div>
          <div>
            <Skeleton height="16px" width="60px" className="mb-2" />
            <Skeleton height="40px" />
          </div>
          <div>
            <Skeleton height="16px" width="100px" className="mb-2" />
            <Skeleton height="40px" />
          </div>
        </div>
        
        {/* PayPal button skeleton */}
        <div className="mt-6">
          <Skeleton height="55px" className="rounded-lg" />
        </div>
      </div>
    </div>
  </div>
);

// Admin dashboard skeleton
export const AdminDashboardSkeleton = () => (
  <div className="p-6 space-y-6">
    {/* Header skeleton */}
    <div className="flex justify-between items-center">
      <Skeleton height="32px" width="200px" />
      <Skeleton height="40px" width="120px" className="rounded-lg" />
    </div>
    
    {/* Stats cards skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white p-4 rounded-lg shadow">
          <Skeleton height="14px" width="80px" className="mb-2" />
          <Skeleton height="28px" width="100px" />
        </div>
      ))}
    </div>
    
    {/* Chart skeleton */}
    <div className="bg-white p-6 rounded-lg shadow">
      <Skeleton height="20px" width="150px" className="mb-4" />
      <Skeleton height="300px" className="rounded" />
    </div>
    
    {/* Table skeleton */}
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <Skeleton height="20px" width="120px" />
      </div>
      
      {/* Table header skeleton */}
      <div className="px-4 py-3 bg-gray-50 border-b">
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} height="16px" width="80px" />
          ))}
        </div>
      </div>
      
      {/* Table rows skeleton */}
      {[...Array(8)].map((_, i) => (
        <div key={i} className="px-4 py-3 border-b">
          <div className="grid grid-cols-5 gap-4">
            {[...Array(5)].map((_, j) => (
              <Skeleton key={j} height="16px" width="90%" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Blog post skeleton
export const BlogPostSkeleton = () => (
  <article className="max-w-4xl mx-auto px-4 py-8">
    {/* Header skeleton */}
    <div className="mb-8">
      <Skeleton height="40px" className="mb-4" />
      <Skeleton height="20px" width="60%" className="mb-4" />
      <div className="flex items-center gap-4">
        <Skeleton width="40px" height="40px" rounded />
        <div>
          <Skeleton height="16px" width="120px" className="mb-1" />
          <Skeleton height="14px" width="80px" />
        </div>
      </div>
    </div>
    
    {/* Featured image skeleton */}
    <Skeleton height="400px" className="mb-8 rounded-lg" />
    
    {/* Content skeleton */}
    <div className="space-y-4">
      {[...Array(8)].map((_, i) => (
        <Skeleton key={i} height="20px" width={i % 3 === 0 ? '90%' : '100%'} />
      ))}
    </div>
    
    {/* Tags skeleton */}
    <div className="mt-8 flex gap-2">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} height="28px" width="80px" className="rounded-full" />
      ))}
    </div>
  </article>
);

// Profile page skeleton
export const ProfileSkeleton = () => (
  <div className="max-w-4xl mx-auto px-4 py-8">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Profile info skeleton */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-center mb-6">
            <Skeleton width="100px" height="100px" rounded className="mx-auto mb-4" />
            <Skeleton height="24px" width="150px" className="mx-auto mb-2" />
            <Skeleton height="16px" width="200px" className="mx-auto" />
          </div>
          
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <Skeleton height="14px" width="80px" className="mb-1" />
                <Skeleton height="16px" />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Orders and content skeleton */}
      <div className="lg:col-span-2">
        <div className="bg-white p-6 rounded-lg shadow">
          <Skeleton height="24px" width="120px" className="mb-6" />
          
          {/* Order items skeleton */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border border-gray-200 rounded p-4 mb-4">
              <div className="flex justify-between items-start mb-3">
                <Skeleton height="16px" width="120px" />
                <Skeleton height="20px" width="80px" className="rounded-full" />
              </div>
              <Skeleton height="14px" width="60%" className="mb-2" />
              <Skeleton height="14px" width="40%" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default {
  Skeleton,
  ProductCardSkeleton,
  ProductGridSkeleton,
  NavbarSkeleton,
  CheckoutSkeleton,
  AdminDashboardSkeleton,
  BlogPostSkeleton,
  ProfileSkeleton
};
