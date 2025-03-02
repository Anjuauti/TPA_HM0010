// frontend.js - Example of how to connect your frontend with the MongoDB backend

// Configuration for API calls
const API_URL = 'http://localhost:5000/api';

// Store JWT token in localStorage
const setToken = (token) => {
  localStorage.setItem('campusExchangeToken', token);
};

const getToken = () => {
  return localStorage.getItem('campusExchangeToken');
};

const removeToken = () => {
  localStorage.removeItem('campusExchangeToken');
};

// API calls with fetch
// User Registration
const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    
    // Save token
    setToken(data.token);
    
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// User Login
const loginUser = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    
    // Save token
    setToken(data.token);
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Get user profile
const getUserProfile = async () => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch(`${API_URL}/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch profile');
    }
    
    return data.user;
  } catch (error) {
    console.error('Profile fetch error:', error);
    throw error;
  }
};

// Get products with filters
const getProducts = async (filters = {}) => {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.condition) queryParams.append('condition', filters.condition);
    if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
    if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.skip) queryParams.append('skip', filters.skip);
    
    const queryString = queryParams.toString();
    const url = `${API_URL}/products${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch products');
    }
    
    return data;
  } catch (error) {
    console.error('Products fetch error:', error);
    throw error;
  }
};

// Create product listing
const createProduct = async (productData) => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(productData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create product');
    }
    
    return data.product;
  } catch (error) {
    console.error('Product creation error:', error);
    throw error;
  }
};

// Place order
const createOrder = async (orderData) => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to place order');
    }
    
    return data.order;
  } catch (error) {
    console.error('Order creation error:', error);
    throw error;
  }
};

// Example of integrating with your signup form
document.getElementById('signup-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const confirmPassword = document.getElementById('signup-confirm-password').value;
  const userType = document.getElementById('user-type').value;
  
  // Validate passwords match
  if (password !== confirmPassword) {
    alert('Passwords do not match');
    return;
  }
  
  try {
    const userData = {
      name,
      email,
      password,
      userType
    };
    
    const result = await registerUser(userData);
    alert('Registration successful! You can now log in.');
    
    // Hide signup modal and show login
    document.getElementById('signup-modal').style.display = 'none';
    document.getElementById('login-modal').style.display = 'flex';
  } catch (error) {
    alert(`Registration failed: ${error.message}`);
  }
});

// Example of integrating with your login form
document.getElementById('login-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  try {
    const result = await loginUser(email, password);
    
    // Hide all sections
    document.body.style.overflow = 'hidden';
    document.querySelector('.navbar').style.display = 'none';
    document.querySelector('.hero').style.display = 'none';
    document.querySelector('.about').style.display = 'none';
    document.querySelector('.features').style.display = 'none';
    document.querySelector('.footer').style.display = 'none';
    document.getElementById('login-modal').style.display = 'none';
    
    // Show appropriate dashboard based on user type
    if (result.user.userType === 'seller' || result.user.userType === 'both') {
      document.getElementById('seller-dashboard').style.display = 'block';
      // Load seller's listings if needed
    } else {
      document.getElementById('buyer-dashboard').style.display = 'block';
      // Load products for buyer
      loadProducts();
    }
  } catch (error) {
    alert(`Login failed: ${error.message}`);
  }
});

// Example of loading products in buyer dashboard
const loadProducts = async () => {
  try {
    const products = await getProducts();
    const productGrid = document.querySelector('.product-grid');
    
    // Clear existing products
    productGrid.innerHTML = '';
    
    if (products.length === 0) {
      productGrid.innerHTML = '<p>No products available</p>';
      return;
    }
    
    // Create product cards
    products.forEach(product => {
      const productCard = document.createElement('div');
      productCard.className = 'product-card';
      
      // Choose image or placeholder
      const imageUrl = product.images && product.images.length > 0 
        ? product.images[0] 
        : '/api/placeholder/250/200';
      
      productCard.innerHTML = `
        <img src="${imageUrl}" alt="${product.title}">
        <div class="product-info">
          <h3 class="product-title">${product.title}</h3>
          <p>${product.description.substring(0, 50)}${product.description.length > 50 ? '...' : ''}</p>
          <p class="product-price">$${product.price.toFixed(2)}</p>
          <button class="btn btn-primary buy-btn" data-id="${product._id}" style="width: 100%;">Add to Cart</button>
        </div>
      `;
      
      productGrid.appendChild(productCard);
    });
    
    // Add event listeners to buy buttons
    document.querySelectorAll('.buy-btn').forEach(button => {
      button.addEventListener('click', function() {
        const productId = this.getAttribute('data-id');
        // Show order confirmation modal or directly add to cart
        alert(`Product ID ${productId} added to cart`);
      });
    });
  } catch (error) {
    console.error('Error loading products:', error);
    alert('Failed to load products. Please try again later.');
  }
};

// Example of creating a new product listing
document.querySelector('.add-item-btn').addEventListener('click', () => {
  // Show product creation form modal (you'll need to create this)
  alert('Product creation form would appear here');
});

// Handle logout
const logoutUser = () => {
  removeToken();
  window.location.reload();
};

document.querySelectorAll('#buyer-logout, #seller-logout').forEach(button => {
  button.addEventListener('click', function(e) {
    e.preventDefault();
    logoutUser();
  });
});