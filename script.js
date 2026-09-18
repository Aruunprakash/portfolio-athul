/* ==========================================================================
   ATHUL P — ARCHITECTURAL PORTFOLIO INTERACTION SCRIPT
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMobileNav();
  initProjectScroll();
  initProjectFilters();
  initModalListeners();
  initLightboxPan();
});

/* --------------------------------------------------------------------------
   1. Theme System (Dark / Light Mode)
   -------------------------------------------------------------------------- */
/* --------------------------------------------------------------------------
   1. Theme System (Dark / Light Mode)
   -------------------------------------------------------------------------- */
function initTheme() {
  const themeToggleBtn = document.getElementById('themeToggle');
  // Changed default fallback from 'dark' to 'light'
  const savedTheme = localStorage.getItem('athul_portfolio_theme') || 'light';

  document.documentElement.setAttribute('data-theme', savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('athul_portfolio_theme', newTheme);
    });
  }
}

/* --------------------------------------------------------------------------
   2. Mobile Navigation Toggle
   -------------------------------------------------------------------------- */
function initMobileNav() {
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      const icon = mobileToggle.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-xmark');
      }
    });

    // Close menu when clicking a link
    navLinks.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        const icon = mobileToggle.querySelector('i');
        if (icon) {
          icon.classList.add('fa-bars');
          icon.classList.remove('fa-xmark');
        }
      });
    });
  }
}

/* --------------------------------------------------------------------------
   3. Project Horizontal Scroll & Controls
   -------------------------------------------------------------------------- */
function initProjectScroll() {
  const track = document.getElementById('projectSheetsTrack');
  const wrapper = document.getElementById('projectSheetsWrapper');
  const prevBtn = document.getElementById('scrollPrevBtn');
  const nextBtn = document.getElementById('scrollNextBtn');
  const currentSheetEl = document.getElementById('currentSheetNum');
  const totalSheetsEl = document.getElementById('totalSheetsNum');
  const dotsWrapper = document.getElementById('sheetDotsWrapper');

  if (!track) return;

  function updateScrollState() {
    const visibleCards = Array.from(track.querySelectorAll('.sheet-card')).filter(
      card => card.style.display !== 'none'
    );

    if (totalSheetsEl) totalSheetsEl.textContent = visibleCards.length;
    if (visibleCards.length === 0) return;

    const scrollLeft = track.scrollLeft;
    let closestIndex = 0;
    let minDistance = Infinity;

    visibleCards.forEach((card, index) => {
      const distance = Math.abs(card.offsetLeft - track.offsetLeft - scrollLeft);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    if (currentSheetEl) currentSheetEl.textContent = closestIndex + 1;

    // Update dots
    if (dotsWrapper) {
      const dots = dotsWrapper.querySelectorAll('.sheet-dot');
      dots.forEach((dot, idx) => {
        if (idx === closestIndex) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
        dot.style.display = idx < visibleCards.length ? 'inline-block' : 'none';
      });
    }

    // Button states
    if (prevBtn) prevBtn.disabled = scrollLeft <= 10;
    if (nextBtn) {
      const maxScroll = track.scrollWidth - track.clientWidth - 10;
      nextBtn.disabled = scrollLeft >= maxScroll;
    }
  }

  // Prev / Next button handlers
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      const cardWidth = track.querySelector('.sheet-card')?.offsetWidth || 380;
      track.scrollBy({ left: -(cardWidth + 24), behavior: 'smooth' });
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const cardWidth = track.querySelector('.sheet-card')?.offsetWidth || 380;
      track.scrollBy({ left: cardWidth + 24, behavior: 'smooth' });
    });
  }

  // Dots click handler
  if (dotsWrapper) {
    dotsWrapper.addEventListener('click', (e) => {
      const dot = e.target.closest('.sheet-dot');
      if (!dot) return;
      const index = parseInt(dot.getAttribute('data-index'), 10);
      const visibleCards = Array.from(track.querySelectorAll('.sheet-card')).filter(
        card => card.style.display !== 'none'
      );
      if (visibleCards[index]) {
        const targetScroll = visibleCards[index].offsetLeft - track.offsetLeft;
        track.scrollTo({ left: targetScroll, behavior: 'smooth' });
      }
    });
  }

  // Drag to scroll functionality
  let isDown = false;
  let startX;
  let scrollLeftPos;

  if (wrapper) {
    wrapper.addEventListener('mousedown', (e) => {
      if (e.target.closest('button') || e.target.closest('a')) return;
      isDown = true;
      wrapper.classList.add('active-drag');
      startX = e.pageX - wrapper.offsetLeft;
      scrollLeftPos = track.scrollLeft;
    });

    wrapper.addEventListener('mouseleave', () => {
      isDown = false;
      wrapper.classList.remove('active-drag');
    });

    wrapper.addEventListener('mouseup', () => {
      isDown = false;
      wrapper.classList.remove('active-drag');
    });

    wrapper.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - wrapper.offsetLeft;
      const walk = (x - startX) * 1.5;
      track.scrollLeft = scrollLeftPos - walk;
    });
  }

  track.addEventListener('scroll', updateScrollState);
  window.addEventListener('resize', updateScrollState);
  updateScrollState();
}

/* --------------------------------------------------------------------------
   4. Category Filtering
   -------------------------------------------------------------------------- */
function initProjectFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const sheetCards = document.querySelectorAll('.sheet-card');
  const track = document.getElementById('projectSheetsTrack');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      sheetCards.forEach(card => {
        const categories = card.getAttribute('data-category') || '';
        if (filterValue === 'all' || categories.includes(filterValue)) {
          card.style.display = 'flex';
          card.style.opacity = '1';
        } else {
          card.style.display = 'none';
          card.style.opacity = '0';
        }
      });

      if (track) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
      }

      setTimeout(() => {
        const scrollEvent = new Event('scroll');
        if (track) track.dispatchEvent(scrollEvent);
      }, 100);
    });
  });
}

/* --------------------------------------------------------------------------
   5. HD Drawing Lightbox Modal Controls
   -------------------------------------------------------------------------- */
let currentZoom = 1;

function openLightbox(imgSrc, title, caption) {
  const modal = document.getElementById('lightboxModal');
  const img = document.getElementById('lightboxImg');
  const titleEl = document.getElementById('lightboxTitle');
  const captionEl = document.getElementById('lightboxCaption');

  if (modal && img) {
    img.src = imgSrc;
    if (titleEl) titleEl.textContent = title || 'Architectural Drawing';
    if (captionEl) captionEl.textContent = caption || '';

    resetLightboxZoom();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeLightbox() {
  const modal = document.getElementById('lightboxModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function zoomLightbox(factor) {
  const img = document.getElementById('lightboxImg');
  if (img) {
    currentZoom *= factor;
    currentZoom = Math.max(0.5, Math.min(currentZoom, 4.0));
    img.style.transform = `scale(${currentZoom})`;
  }
}

function resetLightboxZoom() {
  const img = document.getElementById('lightboxImg');
  if (img) {
    currentZoom = 1;
    img.style.transform = 'scale(1)';
  }
}

/* Drag to pan inside lightbox */
function initLightboxPan() {
  const lightboxBody = document.getElementById('lightboxBody');
  const img = document.getElementById('lightboxImg');

  if (!lightboxBody || !img) return;

  let isDragging = false;
  let startX, startY, scrollLeft, scrollTop;

  lightboxBody.addEventListener('mousedown', (e) => {
    if (currentZoom > 1) {
      isDragging = true;
      startX = e.pageX - lightboxBody.offsetLeft;
      startY = e.pageY - lightboxBody.offsetTop;
      scrollLeft = lightboxBody.scrollLeft;
      scrollTop = lightboxBody.scrollTop;
    }
  });

  lightboxBody.addEventListener('mouseleave', () => { isDragging = false; });
  lightboxBody.addEventListener('mouseup', () => { isDragging = false; });

  lightboxBody.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - lightboxBody.offsetLeft;
    const y = e.pageY - lightboxBody.offsetTop;
    const walkX = (x - startX) * 1.5;
    const walkY = (y - startY) * 1.5;
    lightboxBody.scrollLeft = scrollLeft - walkX;
    lightboxBody.scrollTop = scrollTop - walkY;
  });
}

/* --------------------------------------------------------------------------
   6. PDF Resume Modal Controls
   -------------------------------------------------------------------------- */
function openCvModal() {
  const modal = document.getElementById('cvModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeCvModal() {
  const modal = document.getElementById('cvModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function initModalListeners() {
  const openCvBtn = document.getElementById('openCvModalBtn');
  if (openCvBtn) {
    openCvBtn.addEventListener('click', openCvModal);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLightbox();
      closeCvModal();
    }
  });

  const modals = document.querySelectorAll('.modal-overlay');
  modals.forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeLightbox();
        closeCvModal();
      }
    });
  });
}

/* --------------------------------------------------------------------------
   7. Utilities & Copy Helper
   -------------------------------------------------------------------------- */
function copyText(text, btnElement) {
  navigator.clipboard.writeText(text).then(() => {
    const icon = btnElement.querySelector('i');
    if (icon) {
      icon.className = 'fa-solid fa-check text-accent';
      setTimeout(() => {
        icon.className = 'fa-regular fa-copy';
      }, 2000);
    }
  }).catch(err => {
    console.error('Failed to copy text: ', err);
  });
}

/* --------------------------------------------------------------------------
   8. Form Submission Handling
   -------------------------------------------------------------------------- */
function handleFormSubmit(e) {
  e.preventDefault();
  const statusEl = document.getElementById('formStatus');
  if (statusEl) {
    statusEl.innerHTML = '<span style="color: var(--accent-green); font-weight: 600;"><i class="fa-solid fa-circle-check"></i> Thank you! Your message has been prepared. Launching email client...</span>';

    const name = document.getElementById('senderName').value;
    const email = document.getElementById('senderEmail').value;
    const subject = document.getElementById('msgSubject').value;
    const message = document.getElementById('senderMsg').value;

    const mailtoUrl = `mailto:athulpsajeev1816@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`From: ${name} (${email})\n\nMessage:\n${message}`)}`;

    setTimeout(() => {
      window.location.href = mailtoUrl;
    }, 1000);
  }
}