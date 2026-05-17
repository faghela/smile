// --- Data Fetching (Products & Categories) ---
async function fetchProducts(append = false) {
  if (!append) {
      currentPage = 1;
      document.getElementById('productsGrid').innerHTML = '<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>';
  }
  let url = `${API}/products?page=${currentPage}&limit=12`;
  if(currentCat !== 'الكل') url += `&category=${encodeURIComponent(currentCat)}`;
  if (currentSort) url += `&sort=${encodeURIComponent(currentSort)}`;
  if (currentMinPrice) url += `&minPrice=${encodeURIComponent(currentMinPrice)}`;
  if (currentMaxPrice) url += `&maxPrice=${encodeURIComponent(currentMaxPrice)}`;
  try {
    const res = await fetch(url);
    const result = await res.json();
    const products = result.data || result;
    if (result.pagination) {
        hasMoreProducts = currentPage < result.pagination.totalPages;
        document.getElementById('loadMoreBtn').style.display = hasMoreProducts ? 'block' : 'none';
    }
    if (!append) allProducts = [];
    allProducts = [...allProducts, ...products];
    renderProducts(products, append);
    if (!append) fetchCategories();
    populateCrossSell(); // Refresh cross-sell suggestions
  } catch(e){ document.getElementById('productsGrid').innerHTML='<div class="empty"><i class="fa fa-exclamation-circle"></i><p>حدث خطأ في جلب السعادة (المنتجات)</p></div>'; }
}

function loadMoreProducts() {
    if (hasMoreProducts) { currentPage++; fetchProducts(true); }
}

function renderProducts(products, append = false) {
  const grid = document.getElementById('productsGrid');
  if(!products.length && !append){ grid.innerHTML='<div class="empty"><i class="fa fa-box-open"></i><p>لا توجد منتجات في هذه الفئة حالياً</p></div>'; return; }
  
  const html = products.map((p, i) => {
    const stockClass = p.stock === 0 ? 'out' : p.stock < 5 ? 'low' : '';
    const stockTxt = p.stock === 0 ? 'نفذ المخزون' : p.stock < 5 ? `متبقي ${p.stock} فقط` : `متوفر`;
    return `<div class="product-card" style="animation-delay: ${append ? i*0.1 : 0}s" onclick="handleCardClick(event, ${JSON.stringify(p).replace(/"/g, '&quot;')})">
      <div class="card-img">${p.imageUrl ? `<img src="${p.imageUrl}" loading="lazy">` : '🛍️'}</div>
      <div class="card-body">
        <div class="card-cat">${p.category||'عام'}</div>
        <div class="card-name">${p.name}</div>
        <div class="card-desc">${p.description}</div>
        <div class="card-footer">
          <div>
            <div class="card-price">${p.price.toLocaleString('ar-IQ')} د</div>
            <div class="card-stock ${stockClass}">${stockTxt}</div>
          </div>
          <button class="add-btn" ${p.stock===0?'disabled':''} title="إضافة للسلة">
            <i class="fa ${p.stock===0 ? 'fa-ban' : 'fa-plus'}"></i>
          </button>
        </div>
      </div>
    </div>`;
  }).join('');
  
  if (append) { grid.insertAdjacentHTML('beforeend', html); } else { grid.innerHTML = html; }
  
  // Staggered reveal effect
  setTimeout(() => {
    document.querySelectorAll('.product-card:not(.reveal)').forEach((el, idx) => {
      setTimeout(() => el.classList.add('reveal'), idx * 50);
    });
  }, 50);
}

function handleCardClick(e, p) {
  // If clicked directly on the add button
  if (e.target.closest('.add-btn')) {
    if(p.stock > 0) addToCart(p);
  } else {
    openProductDetails(p);
  }
}

async function fetchCategories() {
  try {
    const res = await fetch(`${API}/products/categories`);
    const cats = await res.json();
    const bar = document.getElementById('catBar');
    bar.innerHTML = `<button class="cat-btn ${'الكل'===currentCat?'active':''}" onclick="filterCat('الكل',this)">الكل</button>` + 
      cats.map(c=>`<button class="cat-btn ${c===currentCat?'active':''}" onclick="filterCat('${c}',this)">${c}</button>`).join('');
  } catch(e) {}
}

function filterCat(cat, el) {
  currentCat = cat;
  document.querySelectorAll('.cat-btn').forEach(b=>b.classList.remove('active'));
  el.classList.add('active');
  fetchProducts();
}

function applyFilters() {
  const minEl = document.getElementById('minPrice');
  const maxEl = document.getElementById('maxPrice');
  const sortEl = document.getElementById('sortSelect');
  if (!minEl || !maxEl || !sortEl) return;

  const min = minEl.value.trim();
  const max = maxEl.value.trim();
  if (min && max && Number(min) > Number(max)) {
    showToast('تأكد أن الحد الأدنى أقل من الحد الأعلى', 'error');
    return;
  }

  currentMinPrice = min;
  currentMaxPrice = max;
  currentSort = sortEl.value || 'newest';
  fetchProducts();
}

function resetFilters() {
  const minEl = document.getElementById('minPrice');
  const maxEl = document.getElementById('maxPrice');
  const sortEl = document.getElementById('sortSelect');
  if (minEl) minEl.value = '';
  if (maxEl) maxEl.value = '';
  if (sortEl) sortEl.value = 'newest';
  currentMinPrice = '';
  currentMaxPrice = '';
  currentSort = 'newest';
  fetchProducts();
}

function initFilters() {
  const minEl = document.getElementById('minPrice');
  const maxEl = document.getElementById('maxPrice');
  const sortEl = document.getElementById('sortSelect');
  if (sortEl) sortEl.value = currentSort;
  [minEl, maxEl].forEach(el => {
    if (!el) return;
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter') applyFilters();
    });
  });
}
