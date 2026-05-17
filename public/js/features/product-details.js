let currentDetailProduct = null;
let currentDetailImages = [];

function getDetailImages(product) {
  const images = [];
  if (product && product.imageUrl) images.push(product.imageUrl);
  if (product && Array.isArray(product.images)) {
    product.images.forEach(img => {
      if (img && !images.includes(img)) images.push(img);
    });
  }
  return images;
}

function renderStars(avg) {
  const filled = Math.round(avg);
  return Array.from({ length: 5 }, (_, i) => (
    `<i class="fa ${i < filled ? 'fa-star' : 'fa-regular fa-star'}"></i>`
  )).join('');
}

function getRatingLabel(count) {
  if (count === 1) return 'تقييم';
  if (count === 2) return 'تقييمان';
  return 'تقييمات';
}

function setMainImage(container, url, alt) {
  if (!container) return;
  container.innerHTML = '';
  if (!url) {
    container.textContent = '🛍️';
    return;
  }
  const img = document.createElement('img');
  img.src = url;
  img.alt = alt || 'صورة المنتج';
  container.appendChild(img);
}

function selectDetailImage(idx) {
  const main = document.getElementById('pmMainImage');
  const url = currentDetailImages[idx];
  setMainImage(main, url, currentDetailProduct?.name || 'صورة المنتج');
  document.querySelectorAll('.pm-thumb').forEach((el, index) => {
    el.classList.toggle('active', index === idx);
  });
}

function openProductDetails(product) {
  if (!product) return;
  currentDetailProduct = product;
  currentDetailImages = getDetailImages(product);

  const mainImage = document.getElementById('pmMainImage');
  const thumbs = document.getElementById('pmThumbs');
  const category = document.getElementById('pmCategory');
  const title = document.getElementById('pmTitle');
  const price = document.getElementById('pmPrice');
  const stock = document.getElementById('pmStock');
  const desc = document.getElementById('pmDesc');
  const rating = document.getElementById('pmRating');
  const specs = document.getElementById('pmSpecs');
  const reviews = document.getElementById('pmReviews');
  const addBtn = document.getElementById('pmAddBtn');

  if (category) category.textContent = product.category || 'عام';
  if (title) title.textContent = product.name || 'منتج';
  if (price) price.textContent = `${(product.price || 0).toLocaleString('ar-IQ')} د`;
  if (desc) desc.textContent = product.description || '';

  const stockClass = product.stock === 0 ? 'out' : product.stock < 5 ? 'low' : '';
  const stockTxt = product.stock === 0 ? 'نفذ المخزون' : product.stock < 5 ? `متبقي ${product.stock} فقط` : 'متوفر حالياً';
  if (stock) {
    stock.textContent = stockTxt;
    stock.className = `pm-stock ${stockClass}`;
  }

  if (addBtn) addBtn.disabled = product.stock === 0;

  if (mainImage) {
    setMainImage(mainImage, currentDetailImages[0], product.name);
  }

  if (thumbs) {
    thumbs.innerHTML = '';
    if (currentDetailImages.length) {
      currentDetailImages.forEach((img, idx) => {
        const btn = document.createElement('button');
        btn.className = `pm-thumb ${idx === 0 ? 'active' : ''}`;
        const thumbImg = document.createElement('img');
        thumbImg.src = img;
        thumbImg.alt = product.name || 'صورة المنتج';
        btn.appendChild(thumbImg);
        btn.addEventListener('click', () => selectDetailImage(idx));
        thumbs.appendChild(btn);
      });
    }
  }

  const avgRating = Number(product.ratingAverage) || 0;
  const ratingCount = Number(product.ratingCount) || 0;
  if (rating) {
    rating.innerHTML = ratingCount > 0
      ? `${renderStars(avgRating)} <span>${avgRating.toFixed(1)} (${ratingCount} ${getRatingLabel(ratingCount)})</span>`
      : `<span>لا توجد تقييمات بعد</span>`;
  }

  const baseSpecs = [
    { label: 'الفئة', value: product.category || 'عام' },
    { label: 'السعر', value: `${(product.price || 0).toLocaleString('ar-IQ')} د` },
    { label: 'التوفر', value: stockTxt }
  ];
  const extraSpecs = Array.isArray(product.specs) ? product.specs : [];
  const allSpecs = [...baseSpecs, ...extraSpecs].filter(s => s && s.label && s.value);
  if (specs) {
    specs.innerHTML = allSpecs.length
      ? allSpecs.map(s => `<div class="pm-spec"><span>${s.label}</span><span>${s.value}</span></div>`).join('')
      : '<div class="pm-empty">لا توجد مواصفات إضافية بعد</div>';
  }

  if (reviews) {
    reviews.innerHTML = ratingCount > 0
      ? `آخر تقييمات العملاء تظهر هنا قريباً.`
      : 'لا توجد تقييمات بعد — كن أول من يشارك رأيه.';
  }

  document.getElementById('productOverlay')?.classList.add('open');
  document.getElementById('productModal')?.classList.add('open');
}

async function openProductDetailsById(id) {
  if (!id) return;
  const cached = allProducts.find(p => p._id === id);
  if (cached) {
    openProductDetails(cached);
    return;
  }
  try {
    const res = await fetch(`${API}/products/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'تعذر تحميل تفاصيل المنتج');
    openProductDetails(data);
  } catch (e) {
    showToast(e.message, 'error');
  }
}

function closeProductDetails() {
  document.getElementById('productOverlay')?.classList.remove('open');
  document.getElementById('productModal')?.classList.remove('open');
}

function addDetailToCart() {
  if (currentDetailProduct && currentDetailProduct.stock > 0) {
    addToCart(currentDetailProduct);
    closeProductDetails();
  }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeProductDetails();
});
