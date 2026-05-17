// --- Init ---
updateCartUI();
fetchProducts();
// تحديث ملخص السعر عند الانتقال للخطوة 3
document.addEventListener('click', e => {
  if (e.target && e.target.id === 'btnNext2') setTimeout(updateFinalSummary, 50);
});