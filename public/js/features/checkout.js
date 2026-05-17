// --- Multi-step Checkout & Cities ---
let currentStep = 1;

// جلب مناطق الشحن وملء القائمة المنسدلة
async function fetchShippingZones() {
  try {
    const res = await fetch(`${API}/shipping`);
    shippingZones = await res.json();
    const sel = document.getElementById('custCity');
    sel.innerHTML = '<option value="">-- اختر مدينتك --</option>' +
      shippingZones.map(z =>
        `<option value="${z.city}" data-price="${z.price}">${z.city} — ${z.price === 0 ? 'شحن مجاني' : z.price.toLocaleString('ar-IQ') + ' د'}</option>`
      ).join('');
  } catch(e) { console.warn('لم يتم جلب مناطق الشحن:', e); }
}

function onCityChange() {
  const sel = document.getElementById('custCity');
  const selectedOption = sel.options[sel.selectedIndex];
  const city = sel.value;
  const price = city ? Number(selectedOption.dataset.price) : 0;
  
  selectedShippingPrice = price;
  
  const preview = document.getElementById('shippingPreview');
  if (city) {
    preview.style.display = 'block';
    document.getElementById('spCity').textContent = city;
    document.getElementById('spCityPrice').textContent = price === 0 ? 'مجاني 🎉' : `${price.toLocaleString('ar-IQ')} دينار`;
  } else {
    preview.style.display = 'none';
  }
  
  validateStep2();
  // تحديث ملخص الخطوة 3 فوراً
  updateFinalSummary();
}

function updateFinalSummary() {
  const itemsTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const count      = cart.reduce((s, i) => s + i.quantity, 0);
  const city       = document.getElementById('custCity')?.value || '';
  const shipping   = selectedShippingPrice;
  const grandTotal = itemsTotal + shipping;
  
  document.getElementById('fsCount').textContent      = count;
  document.getElementById('fsItemsTotal').textContent = itemsTotal.toLocaleString('ar-IQ') + ' د';
  document.getElementById('fsCityName').textContent   = city || '—';
  document.getElementById('fsShipping').textContent   = shipping === 0 ? 'مجاني 🎉' : `${shipping.toLocaleString('ar-IQ')} د`;
  document.getElementById('fsTotal').textContent      = grandTotal.toLocaleString('ar-IQ') + ' د';
}

function startCheckout() {
  closeCart();
  currentStep = 1;
  selectedShippingPrice = 0;
  updateCheckoutUI();
  document.getElementById('checkoutOverlay').classList.add('open');
  fetchShippingZones(); // جلب المدن عند كل فتح لضمان البيانات الحديثة
  updateFinalSummary();
}

function closeCheckout() { document.getElementById('checkoutOverlay').classList.remove('open'); }

function nextStep(step) {
  currentStep = step;
  updateCheckoutUI();
}

function updateCheckoutUI() {
  // Update Steps display
  [1,2,3].forEach(s => {
    document.getElementById(`step${s}`).classList.toggle('active', s === currentStep);
    const dot = document.getElementById(`dot${s}`);
    if (s < currentStep) { dot.className = 'step-dot done'; dot.innerHTML = '<i class="fa fa-check"></i>'; }
    else if (s === currentStep) { dot.className = 'step-dot active'; dot.innerHTML = s; }
    else { dot.className = 'step-dot'; dot.innerHTML = s; }
  });
  
  // Update Progress Line
  const progress = ((currentStep - 1) / 2) * 100;
  document.getElementById('stepProgress').style.width = `${progress}%`;
}

// Validation
function validateStep1() {
  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  
  const nameValid = name.length >= 3;
  const phoneValid = phone.length >= 10 && /^[0-9+]+$/.test(phone); // Basic phone validation
  
  document.getElementById('fgName').classList.toggle('valid', nameValid);
  document.getElementById('fgPhone').classList.toggle('valid', phoneValid);
  
  document.getElementById('btnNext1').disabled = !(nameValid && phoneValid);
}

function validateStep2() {
  const addr = document.getElementById('custAddress').value.trim();
  const city = document.getElementById('custCity').value;
  const addrValid = addr.length >= 10;
  const cityValid = city !== '';
  
  document.getElementById('fgAddress').classList.toggle('valid', addrValid);
  document.getElementById('btnNext2').disabled = !(addrValid && cityValid);
}

async function submitOrder() {
  const name    = document.getElementById('custName').value.trim();
  const phone   = document.getElementById('custPhone').value.trim();
  const address = document.getElementById('custAddress').value.trim();
  const city    = document.getElementById('custCity').value;
  const notes   = document.getElementById('custNotes').value.trim();
  
  const btn = document.getElementById('submitBtn');
  btn.disabled = true; btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> جاري الإرسال...';
  
  try {
    const res = await fetch(`${API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart, customerName: name, customerPhone: phone, customerAddress: address, city, notes })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    
    cart = []; saveCart();
    closeCheckout();
    showToast('شكراً لك! تم استلام طلبك بنجاح وسيتم التواصل معك قريباً 🥳', 'success');
    
    // Reset forms
    ['custName','custPhone','custAddress','custNotes'].forEach(id => document.getElementById(id).value = '');
    const cityEl = document.getElementById('custCity');
    if(cityEl) cityEl.selectedIndex = 0;
    document.getElementById('shippingPreview').style.display = 'none';
    selectedShippingPrice = 0;
    document.querySelectorAll('.form-group.valid').forEach(el => el.classList.remove('valid'));
    
    fetchProducts();
  } catch(e) { showToast(e.message, 'error'); }
  
  btn.disabled = false; btn.innerHTML = 'تأكيد وإرسال الطلب';
}