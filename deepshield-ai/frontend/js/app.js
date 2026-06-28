// ── app.js ───────────────────────────────────────────────

// Navbar scroll effect
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    navbar?.classList.add('scrolled');
  } else {
    navbar?.classList.remove('scrolled');
  }
});

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks  = document.querySelector('.nav-links');
const navActions = document.querySelector('.nav-actions');

navToggle?.addEventListener('click', () => {
  navToggle.classList.toggle('active');
  navLinks?.classList.toggle('open');
  navActions?.classList.toggle('open');
});

// Close mobile menu on link click
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    navToggle?.classList.remove('active');
    navLinks?.classList.remove('open');
    navActions?.classList.remove('open');
  });
});

// Scroll animations — cards appear on scroll
const animatedEls = document.querySelectorAll(
  '.feature-card, .step-card, .pricing-card'
);

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, i * 80);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

animatedEls.forEach(el => observer.observe(el));