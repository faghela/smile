// --- Cart & Upselling ---
function saveCart(){ localStorage.setItem('smile_cart', JSON.stringify(cart)); updateCartUI(); }

function addToCart(p) {
  const ex = cart.find(i => i.productId === p._id);
  const currentQty = ex ? ex.quantity : 0;
  if (currentQty >= p.stock) { showToast(`بلغت الحد الأقصى المتوفر من المخزون`, 'error'); return; }
  
  // Haptic-like visual feedback via adding a quick vibration class if supported or a CSS animation
  if (navigator.vibrate) navigator.vibrate(50);
  
  if(ex){ ex.quantity++; } else { cart.push({productId:p._id,name:p.name,price:p.price,quantity:1,imageUrl:p.imageUrl,stock:p.stock}); }
  saveCart();
  
  // Trigger cart badge animation
  const badge = document.getElementById('cartBadge');
  badge.classList.remove('show');
  setTimeout(() => badge.classList.add('show'), 50);
  
  showToast(`تمت إضافة "${p.name}" بسعادة ✨`, 'success');
  openCart();
}

function changeQty(id, delta) {
  const item = cart.find(i => i.productId === id);
  if (!item) return;
  const newQty = item.quantity + delta;
  if (newQty > (item.stock || 9999)) { showToast('وصلت للحد الأقصى المتاح', 'error'); return; }
  item.quantity = newQty;
  if (item.quantity <= 0) cart = cart.filter(i => i.productId !== id);
  saveCart();
}

function removeFromCart(id) { cart = cart.filter(i => i.productId !== id); saveCart(); }

function updateCartUI() {
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = cart.reduce((s, i) => s + i.quantity, 0);

  // تحديث الشارة
  const badge = document.getElementById('cartBadge');
  badge.textContent = count;
  if (count > 0) badge.classList.add('show'); else badge.classList.remove('show');

  const el     = document.getElementById('cartItems');
  const footer = document.getElementById('cartFooter');
  document.getElementById('cartTotal').textContent = total.toLocaleString('ar-IQ') + ' د';

  // شريط تقدم الشحن المجاني
  try {
    const spBar = document.getElementById('spBar');
    const spMsg = document.getElementById('spMsg');
    const progress = Math.min((total / FREE_SHIPPING_THRESHOLD) * 100, 100);
    spBar.style.width = `${progress}%`;
    if (total >= FREE_SHIPPING_THRESHOLD) {
      spMsg.innerHTML = '<span style="color:var(--green);font-weight:700">مبروك! حصلت على شحن مجاني 🎉</span>';
      spBar.style.background = 'var(--green)';
    } else if (total > 0) {
      const remaining = FREE_SHIPPING_THRESHOLD - total;
      spMsg.innerHTML = `أضف بـ <b style="color:var(--purple-l)">${remaining.toLocaleString('ar-IQ')} د</b> للحصول على شحن مجاني`;
      spBar.style.background = 'var(--grad)';
    } else {
      spMsg.innerHTML = `شحن مجاني عند تسوقك بـ ${FREE_SHIPPING_THRESHOLD.toLocaleString('ar-IQ')} د`;
      spBar.style.background = 'var(--grad)';
    }
  } catch(e) { console.warn('shipping bar:', e); }

  // عرض السلة
  if (cart.length === 0) {
    el.innerHTML = '<div class="cart-empty"><i class="fa fa-shopping-bag"></i><p>سلتك تنتظر إبداعك</p></div>';
    footer.style.display = 'none';
    document.getElementById('crossSellSection').style.display = 'none';
  } else {
    // عرض المنتجات أولاً — دائماً — بمعزل عن أي خطأ آخر
    el.innerHTML = cart.map(i => `
      <div class="cart-item">
        <div class="cart-item-img">${i.imageUrl ? `<img src="${i.imageUrl}">` : '🛒'}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${i.name}</div>
          <div class="cart-item-price">${(i.price * i.quantity).toLocaleString('ar-IQ')} د</div>
          <div class="qty-ctrl">
            <button class="qty-btn" onclick="changeQty('${i.productId}',-1)">-</button>
            <span class="qty-num">${i.quantity}</span>
            <button class="qty-btn" onclick="changeQty('${i.productId}',1)">+</button>
          </div>
        </div>
        <button class="remove-btn" onclick="removeFromCart('${i.productId}')" title="إزالة"><i class="fa fa-times"></i></button>
      </div>`).join('');
    footer.style.display = 'block';
    // المنتجات المقترحة — في try-catch حتى لا تؤثر على السلة
    try { populateCrossSell(); } catch(e) { console.warn('cross-sell:', e); }
  }
}

function openCart(){ document.getElementById('cartSidebar').classList.add('open'); document.getElementById('cartOverlay').classList.add('open'); }
function closeCart(){ document.getElementById('cartSidebar').classList.remove('open'); document.getElementById('cartOverlay').classList.remove('open'); }

function populateCrossSell() {
  const csDiv = document.getElementById('csItems');
  // Simple algorithm: pick 3 random products not in cart
  const available = allProducts.filter(p => !cart.find(c => c.productId === p._id) && p.stock > 0);
  const shuffled = available.sort(() => 0.5 - Math.random()).slice(0, 4);
  
  if(!shuffled.length) { document.getElementById('crossSellSection').style.display = 'none'; return; }
  document.getElementById('crossSellSection').style.display = 'block';
  
  csDiv.innerHTML = shuffled.map(p => `
    <div class="cs-card" onclick='addToCart(${JSON.stringify(p).replace(/"/g, '&quot;')})'>
      <div class="cs-img">${p.imageUrl ? `<img src="${p.imageUrl}">` : '🛍️'}</div>
      <div class="cs-name">${p.name}</div>
      <div class="cs-price">+ ${p.price.toLocaleString('ar-IQ')} د</div>
    </div>
  `).join('');
}