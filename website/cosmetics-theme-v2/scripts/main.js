// Mobile Navigation Toggle
const mobileToggle = document.querySelector('.mobile-toggle');
const navMenu = document.querySelector('.nav-menu');

mobileToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    mobileToggle.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        navMenu.classList.remove('active');
        mobileToggle.classList.remove('active');
    });
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Header scroll effect
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.98)';
        header.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.1)';
    } else {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.boxShadow = 'none';
    }
});

// Product filtering
const tabBtns = document.querySelectorAll('.tab-btn');
const productItems = document.querySelectorAll('.product-item');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const category = btn.getAttribute('data-category');
        
        // Update active tab
        tabBtns.forEach(tab => tab.classList.remove('active'));
        btn.classList.add('active');
        
        // Filter products
        productItems.forEach(item => {
            const itemCategory = item.getAttribute('data-category');
            
            if (category === 'all' || itemCategory === category) {
                item.classList.remove('hidden');
                item.style.display = 'block';
            } else {
                item.classList.add('hidden');
                setTimeout(() => {
                    if (item.classList.contains('hidden')) {
                        item.style.display = 'none';
                    }
                }, 300);
            }
        });
    });
});

// Shopping cart functionality
let cartCount = 0;
const cartCountElement = document.querySelector('.cart-count');
const addToCartBtns = document.querySelectorAll('.add-to-cart');

addToCartBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Add to cart animation
        cartCount++;
        cartCountElement.textContent = cartCount;
        
        // Button feedback
        const originalText = btn.textContent;
        btn.textContent = 'Added!';
        btn.style.background = '#28a745';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 1500);
        
        // Cart icon animation
        cartCountElement.style.transform = 'scale(1.5)';
        setTimeout(() => {
            cartCountElement.style.transform = 'scale(1)';
        }, 300);
    });
});

// Quick view functionality
const quickViewBtns = document.querySelectorAll('.quick-view');

quickViewBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Get product info
        const productItem = btn.closest('.product-item');
        const productName = productItem.querySelector('.product-name').textContent;
        const productPrice = productItem.querySelector('.price').textContent;
        const productImage = productItem.querySelector('.product-image img').src;
        
        // Create modal (simplified version)
        showQuickViewModal(productName, productPrice, productImage);
    });
});

function showQuickViewModal(name, price, image) {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'quick-view-modal';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <button class="modal-close">&times;</button>
            <div class="modal-product">
                <img src="${image}" alt="${name}">
                <div class="modal-info">
                    <h3>${name}</h3>
                    <p class="modal-price">${price}</p>
                    <button class="modal-add-cart">장바구니 담기</button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal styles
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    const overlay = modal.querySelector('.modal-overlay');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        z-index: -1;
    `;
    
    const content = modal.querySelector('.modal-content');
    content.style.cssText = `
        position: relative;
        background: white;
        border-radius: 20px;
        padding: 2rem;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: modalFadeIn 0.3s ease;
    `;
    
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.style.cssText = `
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        font-size: 2rem;
        cursor: pointer;
        color: #999;
    `;
    
    const productDiv = modal.querySelector('.modal-product');
    productDiv.style.cssText = `
        display: flex;
        gap: 2rem;
        align-items: center;
        flex-wrap: wrap;
    `;
    
    const img = modal.querySelector('img');
    img.style.cssText = `
        width: 200px;
        height: 200px;
        object-fit: cover;
        border-radius: 15px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    `;
    
    const info = modal.querySelector('.modal-info');
    info.style.cssText = `
        flex: 1;
        min-width: 200px;
    `;
    
    const title = info.querySelector('h3');
    title.style.cssText = `
        font-size: 1.5rem;
        margin-bottom: 0.5rem;
        color: #2c3e50;
    `;
    
    const modalPrice = info.querySelector('.modal-price');
    modalPrice.style.cssText = `
        font-size: 1.3rem;
        color: #ff6b9d;
        font-weight: 600;
        margin-bottom: 1rem;
    `;
    
    const addCartBtn = modal.querySelector('.modal-add-cart');
    addCartBtn.style.cssText = `
        background: linear-gradient(135deg, #ff6b9d 0%, #4ecdc4 100%);
        color: white;
        border: none;
        padding: 1rem 2rem;
        border-radius: 25px;
        font-weight: 600;
        cursor: pointer;
        margin-top: 1rem;
        transition: all 0.3s ease;
        font-size: 1rem;
    `;
    
    // Add animation keyframe
    const style = document.createElement('style');
    style.textContent = `
        @keyframes modalFadeIn {
            from {
                opacity: 0;
                transform: scale(0.9) translateY(-20px);
            }
            to {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }
    `;
    if (!document.querySelector('style[data-modal-animation]')) {
        style.setAttribute('data-modal-animation', 'true');
        document.head.appendChild(style);
    }
    
    document.body.appendChild(modal);
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    // Close modal functionality
    const closeModal = () => {
        modal.style.animation = 'modalFadeOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(modal);
            document.body.style.overflow = '';
        }, 300);
    };
    
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    
    // Add fade out animation
    if (!document.querySelector('style[data-modal-fadeout]')) {
        const fadeOutStyle = document.createElement('style');
        fadeOutStyle.setAttribute('data-modal-fadeout', 'true');
        fadeOutStyle.textContent = `
            @keyframes modalFadeOut {
                from {
                    opacity: 1;
                    transform: scale(1);
                }
                to {
                    opacity: 0;
                    transform: scale(0.9);
                }
            }
        `;
        document.head.appendChild(fadeOutStyle);
    }
    
    // Add to cart from modal
    addCartBtn.addEventListener('click', () => {
        cartCount++;
        cartCountElement.textContent = cartCount;
        cartCountElement.style.transform = 'scale(1.5)';
        setTimeout(() => {
            cartCountElement.style.transform = 'scale(1)';
        }, 300);
        closeModal();
    });
}

// Newsletter form
const newsletterForm = document.querySelector('.newsletter-form');
const newsletterInput = document.querySelector('.newsletter-input');
const newsletterBtn = document.querySelector('.newsletter-btn');

newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = newsletterInput.value.trim();
    if (!email) return;
    
    // Simulate subscription
    const originalText = newsletterBtn.textContent;
    newsletterBtn.textContent = 'Subscribing...';
    newsletterBtn.disabled = true;
    
    setTimeout(() => {
        newsletterBtn.textContent = 'Subscribed!';
        newsletterBtn.style.background = '#28a745';
        newsletterInput.value = '';
        
        setTimeout(() => {
            newsletterBtn.textContent = originalText;
            newsletterBtn.style.background = '';
            newsletterBtn.disabled = false;
        }, 2000);
    }, 1500);
});

// Enhanced Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            
            // Stagger animations for child elements
            const children = entry.target.querySelectorAll('.animate-child');
            children.forEach((child, index) => {
                setTimeout(() => {
                    child.classList.add('visible');
                }, index * 100);
            });
            
            // Trigger number animations
            if (entry.target.classList.contains('stat-number')) {
                animateNumber(entry.target);
            }
        }
    });
}, observerOptions);

// Advanced number animation
function animateNumber(element) {
    const target = element.getAttribute('data-target');
    if (!target) return;
    
    const duration = 2000;
    const start = 0;
    const end = parseInt(target);
    const range = end - start;
    const increment = range / (duration / 16);
    const isPercentage = element.textContent.includes('%');
    const isPlus = element.textContent.includes('+');
    
    let current = start;
    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            current = end;
            clearInterval(timer);
        }
        
        let displayValue = Math.floor(current);
        if (isPercentage) displayValue += '%';
        if (isPlus) displayValue += '+';
        
        element.textContent = displayValue;
    }, 16);
}

// Enhanced animations on scroll
document.addEventListener('DOMContentLoaded', () => {
    // Create dynamic styles
    const style = document.createElement('style');
    style.textContent = `
        .animate-fade-up {
            opacity: 0;
            transform: translateY(50px);
            transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .animate-fade-up.visible {
            opacity: 1;
            transform: translateY(0);
        }
        .animate-scale {
            opacity: 0;
            transform: scale(0.8);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .animate-scale.visible {
            opacity: 1;
            transform: scale(1);
        }
        .animate-slide-left {
            opacity: 0;
            transform: translateX(-100px);
            transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .animate-slide-left.visible {
            opacity: 1;
            transform: translateX(0);
        }
        .animate-slide-right {
            opacity: 0;
            transform: translateX(100px);
            transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .animate-slide-right.visible {
            opacity: 1;
            transform: translateX(0);
        }
        .animate-rotate {
            opacity: 0;
            transform: rotate(-180deg) scale(0.5);
            transition: opacity 1s ease, transform 1s ease;
        }
        .animate-rotate.visible {
            opacity: 1;
            transform: rotate(0deg) scale(1);
        }
    `;
    document.head.appendChild(style);
    
    // Animate feature cards with different effects
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.classList.add('animate-fade-up');
        card.style.transitionDelay = `${index * 0.15}s`;
        observer.observe(card);
    });

    // Animate product items with stagger effect
    const products = document.querySelectorAll('.product-item');
    products.forEach((product, index) => {
        if (index % 2 === 0) {
            product.classList.add('animate-slide-left');
        } else {
            product.classList.add('animate-slide-right');
        }
        product.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(product);
    });

    // Animate story section
    const storyText = document.querySelector('.story-text');
    const storyImage = document.querySelector('.story-image');
    if (storyText) {
        storyText.classList.add('animate-slide-left');
        observer.observe(storyText);
    }
    if (storyImage) {
        storyImage.classList.add('animate-slide-right');
        observer.observe(storyImage);
    }
    
    // Add data attributes for number animations
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(stat => {
        const value = stat.textContent;
        stat.setAttribute('data-target', value.replace(/[^0-9]/g, ''));
        stat.textContent = '0';
        if (value.includes('%')) stat.textContent += '%';
        if (value.includes('+')) stat.textContent = '0+';
        observer.observe(stat);
    });
});

// Search functionality (basic)
const searchBtn = document.querySelector('.search-btn');

searchBtn.addEventListener('click', () => {
    const searchTerm = prompt('검색할 제품명을 입력하세요:');
    if (!searchTerm) return;
    
    const products = document.querySelectorAll('.product-item');
    let found = false;
    
    products.forEach(product => {
        const productName = product.querySelector('.product-name').textContent.toLowerCase();
        if (productName.includes(searchTerm.toLowerCase())) {
            product.scrollIntoView({ behavior: 'smooth', block: 'center' });
            product.style.border = '3px solid var(--primary-color)';
            setTimeout(() => {
                product.style.border = '';
            }, 3000);
            found = true;
        }
    });
    
    if (!found) {
        alert('검색 결과가 없습니다.');
    }
});

// Enhanced parallax effects
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroImage = document.querySelector('.floating-product');
    const heroBg = document.querySelector('.hero-bg');
    const heroContent = document.querySelector('.hero-content');
    const featureCards = document.querySelectorAll('.feature-card');
    
    // Parallax for hero elements
    if (scrolled < window.innerHeight) {
        if (heroImage) {
            heroImage.style.transform = `translateY(${scrolled * 0.3}px) rotate(${scrolled * 0.02}deg)`;
        }
        if (heroBg) {
            heroBg.style.transform = `translateY(${scrolled * 0.5}px) scale(${1 + scrolled * 0.0005})`;
        }
        if (heroContent) {
            heroContent.style.opacity = 1 - scrolled * 0.001;
        }
    }
    
    // Parallax for feature cards
    featureCards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            const speed = 0.05 * (index + 1);
            card.style.transform = `translateY(${scrolled * speed}px)`;
        }
    });
});

// Enhanced loading animations
document.addEventListener('DOMContentLoaded', () => {
    // Create loading shimmer effect
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        // Create shimmer placeholder
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.display = 'inline-block';
        wrapper.style.width = '100%';
        wrapper.style.height = '100%';
        
        const shimmer = document.createElement('div');
        shimmer.style.position = 'absolute';
        shimmer.style.top = '0';
        shimmer.style.left = '0';
        shimmer.style.width = '100%';
        shimmer.style.height = '100%';
        shimmer.style.background = 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)';
        shimmer.style.backgroundSize = '200% 100%';
        shimmer.style.animation = 'shimmer 2s infinite';
        
        img.parentNode.insertBefore(wrapper, img);
        wrapper.appendChild(shimmer);
        wrapper.appendChild(img);
        
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.5s ease';
        
        img.addEventListener('load', () => {
            img.style.opacity = '1';
            shimmer.style.display = 'none';
        });
    });
    
    // Add page load animation
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// Keyboard navigation support
document.addEventListener('keydown', (e) => {
    // ESC key to close modals
    if (e.key === 'Escape') {
        const modal = document.querySelector('.quick-view-modal');
        if (modal) {
            document.body.removeChild(modal);
        }
    }
});

// Enhanced touch interactions
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchmove', (e) => {
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const touchDiffX = touchStartX - touchX;
    const touchDiffY = touchStartY - touchY;
    
    // 3D tilt effect on mobile
    const hero = document.querySelector('.hero');
    if (hero && window.scrollY < window.innerHeight) {
        const rotateX = touchDiffY * 0.1;
        const rotateY = touchDiffX * 0.1;
        hero.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }
});

document.addEventListener('touchend', () => {
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.style.transition = 'transform 0.5s ease';
        hero.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    }
});

// Text reveal animation
function initTextReveal() {
    const textElements = document.querySelectorAll('h1, h2, h3, .hero-description');
    
    textElements.forEach(element => {
        const text = element.textContent;
        element.textContent = '';
        element.style.opacity = '1';
        
        // Split text into spans
        text.split('').forEach((char, index) => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.style.opacity = '0';
            span.style.display = 'inline-block';
            span.style.transform = 'translateY(20px)';
            span.style.transition = `all 0.5s ease ${index * 0.02}s`;
            element.appendChild(span);
        });
        
        // Trigger animation on scroll
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const spans = entry.target.querySelectorAll('span');
                    spans.forEach(span => {
                        span.style.opacity = '1';
                        span.style.transform = 'translateY(0)';
                    });
                    revealObserver.unobserve(entry.target);
                }
            });
        });
        
        revealObserver.observe(element);
    });
}

// Particle animation system
function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouseX = 0;
    let mouseY = 0;
    
    // Set canvas size
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Set canvas styles
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '1';
    
    // Particle class
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 3 + 1;
            this.speedX = Math.random() * 2 - 1;
            this.speedY = Math.random() * 2 - 1;
            this.opacity = Math.random() * 0.5 + 0.2;
            this.color = Math.random() > 0.5 ? '#ff6b9d' : '#4ecdc4';
        }
        
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            
            // Mouse interaction
            const dx = mouseX - this.x;
            const dy = mouseY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 100) {
                const force = (100 - distance) / 100;
                this.x -= dx * force * 0.02;
                this.y -= dy * force * 0.02;
            }
            
            // Wrap around screen
            if (this.x > canvas.width) this.x = 0;
            if (this.x < 0) this.x = canvas.width;
            if (this.y > canvas.height) this.y = 0;
            if (this.y < 0) this.y = canvas.height;
        }
        
        draw() {
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw connections
            particles.forEach(particle => {
                const dx = this.x - particle.x;
                const dy = this.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 150) {
                    ctx.globalAlpha = this.opacity * (1 - distance / 150) * 0.3;
                    ctx.strokeStyle = this.color;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(particle.x, particle.y);
                    ctx.stroke();
                }
            });
        }
    }
    
    // Create particles
    for (let i = 0; i < 50; i++) {
        particles.push(new Particle());
    }
    
    // Track mouse position
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
}

// Initialize all animations
document.addEventListener('DOMContentLoaded', () => {
    initTextReveal();
    initParticles();
    
    // Smooth page transitions
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                const offset = target.offsetTop - 80;
                window.scrollTo({
                    top: offset,
                    behavior: 'smooth'
                });
            }
        });
    });
});

// Mouse move effects
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Magnetic button effect
    const buttons = document.querySelectorAll('.btn, .quick-view, .add-to-cart');
    buttons.forEach(button => {
        const rect = button.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const distanceX = mouseX - centerX;
        const distanceY = mouseY - centerY;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
        
        if (distance < 100) {
            const pullX = distanceX * 0.2;
            const pullY = distanceY * 0.2;
            button.style.transform = `translate(${pullX}px, ${pullY}px) scale(1.05)`;
        } else {
            button.style.transform = '';
        }
    });
    
    // Cursor glow effect
    const hero = document.querySelector('.hero');
    if (hero) {
        const rect = hero.getBoundingClientRect();
        if (mouseY < rect.bottom) {
            const x = (mouseX / window.innerWidth) * 100;
            const y = ((mouseY - rect.top) / rect.height) * 100;
            hero.style.background = `
                radial-gradient(circle at ${x}% ${y}%, 
                rgba(255, 255, 255, 0.2) 0%, 
                transparent 50%),
                var(--gradient-primary)
            `;
        }
    }
});