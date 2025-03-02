
        // Show Login Modal
        document.getElementById('login-link').addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('login-modal').style.display = 'flex';
        });
        
        // Show Signup Modal
        document.getElementById('signup-link').addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('signup-modal').style.display = 'flex';
        });
        
        // Close Login Modal
        document.getElementById('close-login').addEventListener('click', function() {
            document.getElementById('login-modal').style.display = 'none';
        });
        
        // Close Signup Modal
        document.getElementById('close-signup').addEventListener('click', function() {
            document.getElementById('signup-modal').style.display = 'none';
        });
        
        // Switch to Signup
        document.getElementById('switch-to-signup').addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('login-modal').style.display = 'none';
            document.getElementById('signup-modal').style.display = 'flex';
        });
        
        // Switch to Login
        document.getElementById('switch-to-login').addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('signup-modal').style.display = 'none';
            document.getElementById('login-modal').style.display = 'flex';
        });
        
        // Get Started Button
        document.getElementById('get-started-btn').addEventListener('click', function() {
            document.getElementById('signup-modal').style.display = 'flex';
        });
        
        // Buy Now Button
        document.getElementById('buy-now-btn').addEventListener('click', function() {
            document.getElementById('login-modal').style.display = 'flex';
        });
        
        // Sell Now Button
        document.getElementById('sell-now-btn').addEventListener('click', function() {
            document.getElementById('login-modal').style.display = 'flex';
        });
        
        // Login Form Submit
        document.getElementById('login-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Simulate login logic
            const email = document.getElementById('login-email').value;
            
            // Hide all sections
            document.body.style.overflow = 'hidden';
            document.querySelector('.navbar').style.display = 'none';
            document.querySelector('.hero').style.display = 'none';
            document.querySelector('.about').style.display = 'none';
            document.querySelector('.features').style.display = 'none';
            document.querySelector('.footer').style.display = 'none';
            document.getElementById('login-modal').style.display = 'none';
            
            // Show buyer dashboard by default (you can modify this based on user type)
            if (email.includes('seller')) {
                document.getElementById('seller-dashboard').style.display = 'block';
            } else {
                document.getElementById('buyer-dashboard').style.display = 'block';
            }
        });
        
        // Signup Form Submit
        document.getElementById('signup-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Hide signup modal
            document.getElementById('signup-modal').style.display = 'none';
            
            // Show login modal
            document.getElementById('login-modal').style.display = 'flex';
        });
        
        // Logout
        document.getElementById('buyer-logout').addEventListener('click', function(e) {
            e.preventDefault();
            window.location.reload();
        });
        
        document.getElementById('seller-logout').addEventListener('click', function(e) {
            e.preventDefault();
            window.location.reload();
        });
        // Handle Add Item Form Submission
document.getElementById('add-item-form').addEventListener('submit', async function (e) {
    e.preventDefault();
  
    const itemName = document.getElementById('item-name').value;
    const itemPrice = document.getElementById('item-price').value;
    const itemImage = document.getElementById('item-image').value;
    const itemDescription = document.getElementById('item-description').value;
  
    const itemData = {
      title: itemName,
      price: itemPrice,
      images: [itemImage],
      description: itemDescription,
      category: 'other', // Default category
      condition: 'good', // Default condition
    };
  
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('campusExchangeToken')}`,
        },
        body: JSON.stringify(itemData),
      });
  
      if (response.ok) {
        alert('Item added successfully!');
        loadSellerItems(); // Refresh the seller's listed items
      } else {
        const data = await response.json();
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item. Please try again.');
    }
  });
  
  // Function to Load Seller's Listed Items
  async function loadSellerItems() {
    try {
      const response = await fetch('/api/products/seller', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('campusExchangeToken')}`,
        },
      });
  
      if (response.ok) {
        const products = await response.json();
        const sellerItemsContainer = document.getElementById('seller-items');
        sellerItemsContainer.innerHTML = '';
  
        products.forEach(product => {
          const productCard = `
            <div class="product-card">
              <img src="${product.images[0]}" alt="${product.title}">
              <div class="product-info">
                <h3 class="product-title">${product.title}</h3>
                <p>${product.description}</p>
                <p class="product-price">$${product.price}</p>
              </div>
            </div>
          `;
          sellerItemsContainer.innerHTML += productCard;
        });
      } else {
        console.error('Failed to fetch seller items');
      }
    } catch (error) {
      console.error('Error loading seller items:', error);
    }
  }
  
  // Load Seller Items on Dashboard Load
  if (document.getElementById('seller-dashboard')) {
    loadSellerItems();
  }
    