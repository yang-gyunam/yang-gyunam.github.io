// Translation data
const translations = {
    ko: {
        siteTitle: 'Yang Gyunam',
        siteTagline: 'Software Engineer',
        nav: {
            home: 'Home',
            projects: 'Projects',
            articles: 'Articles',
            games: 'Games',
            contact: 'Contact'
        },
        contact: {
            email: 'Email:',
            github: 'GitHub:'
        },
        footer: {
            copyright: 'Copyright © 2025 Yang Gyunam'
        }
    },
    en: {
        siteTitle: 'Yang Gyunam',
        siteTagline: 'Software Engineer',
        nav: {
            home: 'Home',
            projects: 'Projects',
            articles: 'Articles',
            games: 'Games',
            contact: 'Contact'
        },
        contact: {
            email: 'Email:',
            github: 'GitHub:'
        },
        footer: {
            copyright: 'Copyright © 2025 Yang Gyunam'
        }
    }
};

let currentLang = localStorage.getItem('language') || 'en';

// Set initial language class immediately to prevent flash
const toggle = document.querySelector('.lang-toggle');
if (toggle) {
    toggle.classList.remove('ko', 'en');
    toggle.classList.add(currentLang);
}

// Initialize language on page load
document.addEventListener('DOMContentLoaded', function() {
    setLanguage(currentLang);
});

function toggleLanguage() {
    currentLang = currentLang === 'ko' ? 'en' : 'ko';
    localStorage.setItem('language', currentLang);
    setLanguage(currentLang);
}

function setLanguage(lang) {
    const t = translations[lang];

    // Update lang attribute
    document.documentElement.lang = lang;

    // Update toggle button state
    const toggle = document.querySelector('.lang-toggle');
    if (toggle) {
        toggle.classList.remove('ko', 'en');
        toggle.classList.add(lang);
    }

    // Update site header
    const siteTitle = document.querySelector('.site-title');
    const siteTagline = document.querySelector('.site-tagline');
    if (siteTitle) siteTitle.textContent = t.siteTitle;
    if (siteTagline) siteTagline.textContent = t.siteTagline;

    // Update navigation
    const navLinks = document.querySelectorAll('.navigation a');
    if (navLinks.length >= 4) {
        navLinks[0].textContent = t.nav.home;
        navLinks[1].textContent = t.nav.projects;
        // navLinks[2].textContent = t.nav.articles; // Hidden
        navLinks[2].textContent = t.nav.games;
        navLinks[3].textContent = t.nav.contact;
    }

    // Update footer
    const footerText = document.querySelector('footer p');
    if (footerText) footerText.textContent = t.footer.copyright;

    // Trigger custom language change event for page-specific updates
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang, translations: t } }));
}

// Smooth scrolling
document.addEventListener('DOMContentLoaded', function() {
    // Handle hash on page load
    if (window.location.hash) {
        setTimeout(function() {
            const target = document.querySelector(window.location.hash);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }, 100);
    }

    // Handle hash clicks
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
});

// Load JSON data
async function loadJSON(url) {
    try {
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error('Error loading JSON:', error);
        return [];
    }
}

// Format date
function formatDate(dateString, lang = 'en') {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', options);
}
