/**
 * === MAIN APPLICATION ===
 * Coffee Shop Menu & Cart System
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('🎯 App initialized');

  // ===== INTERSECTION OBSERVER FOR ANIMATIONS =====
  const initScrollAnimations = () => {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              // اختیاری: عدم نظارت مجدد
              // observer.unobserve(entry.target);
            }
          });
        },
        { 
          threshold: 0.1,
          rootMargin: '0px 0px -50px 0px'
        }
      );

      animatedElements.forEach((el, index) => {
        el.style.setProperty('--animation-order', index % 4);
        observer.observe(el);
      });
    } else {
      // Fallback برای مرورگرهای قدیمی
      animatedElements.forEach((el) => {
        el.classList.add('is-visible');
      });
    }
  };

  // ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
  const initSmoothScroll = () => {
    document.querySelectorAll('nav a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = anchor.getAttribute('href');
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
          const headerHeight = document.querySelector('nav')?.offsetHeight || 80;
          const targetPosition = targetElement.offsetTop - headerHeight;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });

          // بند کردن کارت اگر باز باشد
          closeCart();
        }
      });
    });
  };

  // ===== STICKY NAVIGATION =====
  const initStickyNav = () => {
    const nav = document.querySelector('nav');
    
    if (!nav) return;

    const updateNavStyle = () => {
      const scrolled = window.scrollY > 8;
      nav.classList.toggle('scrolled', scrolled);
    };

    updateNavStyle();
    window.addEventListener('scroll', updateNavStyle, { passive: true });
  };

  // ===== MENU FILTERS =====
  const initMenuFilters = () => {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const menuItems = document.querySelectorAll('.menu-item');

    if (!filterButtons.length) return;

    filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        // حذف کلاس active از تمام دکمه‌ها
        filterButtons.forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });

        // اضافه کردن کلاس active به دکمه‌ی فعلی
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        // فیلتر کردن آیتم‌ها
        const filter = btn.dataset.filter;
        menuItems.forEach((item) => {
          const shouldShow = filter === 'all' || item.dataset.category === filter;
          item.style.display = shouldShow ? 'flex' : 'none';
          
          // اضافه کردن انیمیشن برای نمایش مجدد
          if (shouldShow) {
            item.style.animation = 'none';
            setTimeout(() => {
              item.style.animation = '';
            }, 10);
          }
        });
      });
    });
  };

  // ===== CART MANAGEMENT =====
  const cartState = {
    items: [],
    total: 0,
    
    load() {
      try {
        const saved = localStorage.getItem('dorna_cart');
        if (saved) {
          this.items = JSON.parse(saved);
        }
      } catch (error) {
        console.error('❌ Error loading cart from localStorage:', error);
        this.items = [];
      }
    },

    save() {
      try {
        localStorage.setItem('dorna_cart', JSON.stringify(this.items));
      } catch (error) {
        console.error('❌ Error saving cart to localStorage:', error);
      }
    },

    add(item) {
      const existing = this.items.find((i) => i.name === item.name);
      if (existing) {
        existing.qty++;
      } else {
        this.items.push({ ...item, qty: 1 });
      }
      this.save();
      this.updateUI();
    },

    remove(index) {
      this.items.splice(index, 1);
      this.save();
      this.updateUI();
    },

    updateQty(index, qty) {
      if (qty > 0) {
        this.items[index].qty = qty;
      } else {
        this.remove(index);
      }
      this.save();
      this.updateUI();
    },

    clear() {
      this.items = [];
      this.save();
      this.updateUI();
    },

    getTotal() {
      return this.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    },

    updateUI() {
      updateCartDisplay();
      updateBadge();
    }
  };

  // ===== DOM ELEMENTS =====
  const cartToggle = document.getElementById('cart-toggle');
  const cartDropdown = document.querySelector('.cart-dropdown');
  const cartList = cartDropdown?.querySelector('.cart-list');
  const cartTotal = cartDropdown?.querySelector('.cart-total');
  const cartEmpty = cartDropdown?.querySelector('.cart-empty');
  const cartCount = document.querySelector('.cart-count');
  const cartClearBtn = cartDropdown?.querySelector('.cart-clear');
  const cartCheckoutBtn = cartDropdown?.querySelector('.cart-checkout');

  // ===== UTILITY FUNCTIONS =====
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      maximumFractionDigits: 0
    }).format(price).replace('‍', '');
  };

  const showToast = (message) => {
    // حذف toast‌های قدیمی
    document.querySelectorAll('.toast').forEach((el) => el.remove());

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // حذف خودکار
    setTimeout(() => {
      toast.classList.remove('show');
      toast.addEventListener('transitionend', () => {
        toast.remove();
      }, { once: true });
    }, 3000);
  };

  const updateBadge = () => {
    if (!cartCount) return;

    const totalQty = cartState.items.reduce((sum, item) => sum + item.qty, 0);
    cartCount.textContent = totalQty;
    cartCount.style.display = totalQty > 0 ? 'inline-flex' : 'none';

    // Animation
    cartCount.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(1.2)' },
        { transform: 'scale(1)' }
      ],
      {
        duration: 250,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
      }
    );
  };

  const updateCartDisplay = () => {
    if (!cartList || !cartTotal || !cartEmpty) return;

    cartList.innerHTML = '';

    if (cartState.items.length === 0) {
      cartEmpty.style.display = 'block';
      cartTotal.textContent = 'جمع کل: ۰ تومان';
    } else {
      cartEmpty.style.display = 'none';

      cartState.items.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'cart-item';

        const itemTotal = item.price * item.qty;

        li.innerHTML = `
          <img 
            src="${item.img}" 
            alt="${item.name}" 
            class="cart-thumb" 
            loading="lazy"
          />
          <span 
            class="cart-item-name" 
            title="${item.name}"
          >${item.name}</span>
          <div class="cart-item-controls">
            <button 
              class="decrease" 
              aria-label="کاهش تعداد"
              data-index="${index}"
            >−</button>
            <span class="cart-item-qty">${item.qty}</span>
            <button 
              class="increase" 
              aria-label="افزایش تعداد"
              data-index="${index}"
            >+</button>
          </div>
          <span class="cart-item-price">${formatPrice(itemTotal)}</span>
        `;

        // Event Delegation
        const increaseBtn = li.querySelector('.increase');
        const decreaseBtn = li.querySelector('.decrease');
        const nameSpan = li.querySelector('.cart-item-name');

        increaseBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          cartState.updateQty(index, item.qty + 1);
        });

        decreaseBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          cartState.updateQty(index, item.qty - 1);
        });

        nameSpan.addEventListener('click', (e) => {
          e.stopPropagation();
          showToast(`${item.name} × ${item.qty}`);
        });

        cartList.appendChild(li);
      });

      // Update total
      const total = cartState.getTotal();
      cartTotal.textContent = `جمع کل: ${formatPrice(total)}`;
    }
  };

  // ===== CART TOGGLE & CLOSE =====
  const closeCart = () => {
    if (cartDropdown) {
      cartDropdown.classList.remove('open');
    }
    if (cartToggle) {
      cartToggle.setAttribute('aria-expanded', 'false');
    }
  };

  const openCart = () => {
    if (cartDropdown) {
      cartDropdown.classList.add('open');
    }
    if (cartToggle) {
      cartToggle.setAttribute('aria-expanded', 'true');
    }
  };

  if (cartToggle) {
    cartToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      cartDropdown?.classList.toggle('open');
      const isOpen = cartDropdown?.classList.contains('open');
      cartToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  // بستن کارت با کلیک خارج از آن
  document.addEventListener('click', (e) => {
    if (!cartDropdown || !cartToggle) return;
    const isClickInsideCart = cartDropdown.contains(e.target) || cartToggle.contains(e.target);
    if (!isClickInsideCart) {
      closeCart();
    }
  });

  // بستن کارت با فشار ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCart();
    }
  });

  // ===== CART ACTIONS =====
  if (cartClearBtn) {
    cartClearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('آیا مطمئن هستید؟')) {
        cartState.clear();
        showToast('سبد خرید خالی شد');
      }
    });
  }

  if (cartCheckoutBtn) {
    cartCheckoutBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (cartState.items.length === 0) {
        showToast('❌ سبد خرید خالی است');
        return;
      }
      
      // محاسبه جمع کل
      const total = cartState.getTotal();
      
      // نمونه: ارسال به سرویس خارجی یا صفحه پرداخت
      console.log('📦 Checkout:', {
        items: cartState.items,
        total: total,
        timestamp: new Date().toISOString()
      });

      showToast(`✅ سفارش شما با جمع ${formatPrice(total)} ثبت شد`);
      
      // Simulate checkout
      setTimeout(() => {
        // cartState.clear(); // اختیاری
        closeCart();
      }, 1500);
    });
  }

  // ===== ADD TO CART BUTTONS =====
  const initAddToCart = () => {
    const buttons = document.querySelectorAll('.add-to-cart-btn');

    buttons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();

        const menuItem = btn.closest('.menu-item');
        if (!menuItem) return;

        const name = menuItem.querySelector('h3')?.textContent?.trim() || 'Unknown Item';
        const priceText = menuItem.querySelector('.price')?.textContent || '0';
        const img = menuItem.querySelector('img')?.getAttribute('src') || '';

        // استخراج عدد از متن قیمت
        const price = parseInt(priceText.replace(/\D/g, '')) || 0;

        if (price === 0) {
          showToast('❌ خطا: قیمت مشخص نیست');
          return;
        }

        cartState.add({ name, price, img });
        showToast(`✅ ${name} به سبد اضافه شد`);
        openCart();
      });
    });
  };

  // ===== SMOOTH SCROLL LIBRARY (LENIS) =====
  const initLenis = () => {
    if (typeof Lenis === 'undefined') {
      console.warn('⚠️ Lenis library not loaded');
      return;
    }

    const lenis = new Lenis({
      lerp: 0.07,
      smoothWheel: true,
      wheelMultiplier: 1
    });

    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };

    requestAnimationFrame(raf);
  };

  // ===== LOADING OVERLAY (اختیاری) =====
  const initLoadingOverlay = () => {
    window.addEventListener('load', () => {
      const overlay = document.getElementById('loading-overlay');
      if (!overlay) return;

      overlay.classList.add('fade-out');
      setTimeout(() => {
        overlay.remove();
      }, 1000);
    });
  };

  // ===== INITIALIZATION =====
  const init = () => {
    console.log('🚀 Starting initialization...');

    // بارگذاری کارت از localStorage
    cartState.load();

    // راه‌اندازی تمام قسمت‌ها
    initScrollAnimations();
    initSmoothScroll();
    initStickyNav();
    initMenuFilters();
    initAddToCart();
    initLenis();
    initLoadingOverlay();

    // نمایش اولیه کارت
    updateBadge();
    updateCartDisplay();

    console.log('✅ App ready!');
  };

  init();
});

// ===== UTILITY: Detect if localStorage is available =====
const isLocalStorageAvailable = () => {
  try {
    const test = '__test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

// ===== PERFORMANCE OPTIMIZATION =====
// استفاده از debounce برای resize events
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

window.addEventListener('resize', debounce(() => {
  console.log('📐 Window resized');
  // اگر نیاز بود می‌توان اینجا کد‌های مختص resize بگذاریم
}, 250), { passive: true });

// ===== SERVICE WORKER (اختیاری برای PWA) =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // navigator.serviceWorker.register('/sw.js').catch(err => {
    //   console.log('Service Worker registration failed:', err);
    // });
  });
}