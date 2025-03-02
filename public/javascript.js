
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
    