// Mobile Menu Toggle
const mobileToggle = document.getElementById('mobileToggle');
const mainNav = document.getElementById('mainNav');

mobileToggle.addEventListener('click', () => {
    mobileToggle.classList.toggle('active');
    mainNav.classList.toggle('active');
});

// Close menu when clicking on a link
document.querySelectorAll('.nav a').forEach(link => {
    link.addEventListener('click', () => {
        mobileToggle.classList.remove('active');
        mainNav.classList.remove('active');
    });
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!mobileToggle.contains(e.target) && !mainNav.contains(e.target)) {
        mobileToggle.classList.remove('active');
        mainNav.classList.remove('active');
    }
});

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerHeight = document.querySelector('.header').offsetHeight;
            const targetPosition = target.offsetTop - headerHeight;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Header Scroll Effect
let lastScroll = 0;
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        header.style.padding = '15px 0';
        header.style.boxShadow = '0 5px 30px rgba(0, 0, 0, 0.1)';
    } else {
        header.style.padding = '25px 0';
        header.style.boxShadow = 'none';
    }

    lastScroll = currentScroll;
});

// Buy Button Functionality
document.querySelectorAll('.buy-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const item = this.closest('.collection-item');
        const itemName = item.querySelector('h3').textContent;
        const itemPrice = item.querySelector('.item-price').textContent;
        
        // Button animation
        const originalText = this.textContent;
        this.textContent = 'Added!';
        this.style.background = '#27ae60';
        
        setTimeout(() => {
            this.textContent = originalText;
            this.style.background = '';
        }, 2000);
        
        // Show alert
        alert(`${itemName}\n${itemPrice}\n\n장바구니에 추가되었습니다!`);
    });
});

// Form Submission
document.querySelector('.shop-form form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = e.target.querySelector('input[type="text"]').value;
    alert(`${name}님, 문의가 접수되었습니다.\n빠른 시일 내에 답변드리겠습니다. 감사합니다.`);
    e.target.reset();
});

// Intersection Observer for Fade-in Animations
const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
};

const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Apply fade-in to elements
document.querySelectorAll('.collection-item, .moment-card, .story-content, .shop-info').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(40px)';
    el.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
    fadeInObserver.observe(el);
});

// Parallax Effect for Hero
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    if (hero && scrolled < window.innerHeight) {
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// Gallery Lightbox Effect (부드러운 애니메이션)
document.querySelectorAll('.moment-card').forEach(card => {
    card.addEventListener('click', () => {
        const img = card.querySelector('img');
        
        // 라이트박스 생성
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        lightbox.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            cursor: pointer;
            transition: background 0.4s ease;
        `;
        
        const lightboxImg = document.createElement('img');
        lightboxImg.src = img.src;
        lightboxImg.style.cssText = `
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
            opacity: 0;
            transform: scale(0.9);
            transition: all 0.4s ease;
        `;
        
        lightbox.appendChild(lightboxImg);
        document.body.appendChild(lightbox);
        document.body.style.overflow = 'hidden';
        
        // 애니메이션 시작 (약간의 딜레이로 부드럽게)
        requestAnimationFrame(() => {
            lightbox.style.background = 'rgba(0, 0, 0, 0.9)';
            lightboxImg.style.opacity = '1';
            lightboxImg.style.transform = 'scale(1)';
        });
        
        // 닫기 이벤트
        lightbox.addEventListener('click', () => {
            // 페이드 아웃 애니메이션
            lightbox.style.background = 'rgba(0, 0, 0, 0)';
            lightboxImg.style.opacity = '0';
            lightboxImg.style.transform = 'scale(0.9)';
            
            // 애니메이션 완료 후 제거
            setTimeout(() => {
                lightbox.remove();
                document.body.style.overflow = '';
            }, 400);
        });
    });
});

