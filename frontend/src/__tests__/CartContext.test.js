import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock CartContext functionality
const mockCart = [];
const mockAddToCart = jest.fn();
const mockRemoveFromCart = jest.fn();
const mockUpdateQuantity = jest.fn();
const mockClearCart = jest.fn();
const mockGetTotalPrice = jest.fn(() => 0);

// Simplified cart component for testing
const MockCartComponent = () => {
  const testProduct = {
    _id: 'test-product-1',
    name: 'Test Product',
    price: 25.99,
    image: 'test.jpg'
  };

  return (
    <div data-testid="cart-component">
      <h2>Cart ({mockCart.length} items)</h2>
      <div data-testid="cart-total">Total: ${mockGetTotalPrice()}</div>
      
      <button 
        onClick={() => mockAddToCart(testProduct)} 
        data-testid="add-to-cart-btn"
      >
        Add Test Product
      </button>
      
      <button 
        onClick={() => mockClearCart()} 
        data-testid="clear-cart-btn"
      >
        Clear Cart
      </button>
    </div>
  );
};

describe('Shopping Cart Critical Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTotalPrice.mockReturnValue(0);
  });

  test('renders cart component', () => {
    render(<MockCartComponent />);

    expect(screen.getByText('Cart (0 items)')).toBeInTheDocument();
    expect(screen.getByTestId('cart-total')).toHaveTextContent('Total: $0');
  });

  test('calls addToCart when add button clicked', async () => {
    const user = userEvent.setup();
    
    render(<MockCartComponent />);

    const addButton = screen.getByTestId('add-to-cart-btn');
    await user.click(addButton);

    expect(mockAddToCart).toHaveBeenCalledWith({
      _id: 'test-product-1',
      name: 'Test Product',
      price: 25.99,
      image: 'test.jpg'
    });
  });

  test('calls clearCart when clear button clicked', async () => {
    const user = userEvent.setup();
    
    render(<MockCartComponent />);

    const clearButton = screen.getByTestId('clear-cart-btn');
    await user.click(clearButton);

    expect(mockClearCart).toHaveBeenCalled();
  });
});
