// --- Smart Search ---
function openSearch() {
  document.getElementById('searchOverlay').classList.add('open');
  setTimeout(() => document.getElementById('smartSearchInput').focus(), 100);
}
function closeSearch() {
  document.getElementById('searchOverlay').classList.remove('open');
}
async function onSmartSearch(val) {
  const resDiv = document.getElementById('searchResults');
  if(!val.trim()) { resDiv.innerHTML = '<div style="text-align:center; color:var(--txt2); grid-column:1/-1; padding-top:2rem;">ابحث عن أي شيء لتظهر النتائج هنا فوراً</div>'; return; }
  try {
    const res = await fetch(`${API}/products?search=${encodeURIComponent(val)}&limit=8`);
    const data = await res.json();
    const prods = data.data || data;
    if(!prods.length) { resDiv.innerHTML = '<div style="text-align:center; color:var(--txt2); grid-column:1/-1; padding-top:2rem;"><i class="fa fa-ghost fa-3x" style="opacity:0.2; margin-bottom:1rem; display:block"></i>لا توجد نتائج مطابقة</div>'; return; }
    resDiv.innerHTML = prods.map(p => `
      <div class="s-res-card" onclick="openSearchProduct('${p._id}')">
        <div class="s-res-img">${p.imageUrl ? `<img src="${p.imageUrl}">` : '🛍️'}</div>
        <div class="s-res-info">
          <h4>${p.name}</h4>
          <p>${p.price.toLocaleString('ar-IQ')} د</p>
        </div>
      </div>
    `).join('');
  } catch(e) {}
}
function openSearchProduct(id) {
  closeSearch();
  const p = allProducts.find(x => x._id === id);
  if(p) addToCart(p);
}