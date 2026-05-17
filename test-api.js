// test-api.js
fetch('http://localhost:3000/api/products', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        name: "منتج تجريبي",
        description: "هذا أول منتج يتم إضافته لمتجر Smile Shop",
        price: 120,
        stock: 50,
        imageUrl: "https://example.com/image.jpg"
    })
})
    .then(response => response.json())
    .then(data => console.log("تم إضافة المنتج بنجاح في قاعدة البيانات:\n", data))
    .catch(error => console.error("حدث خطأ:", error));