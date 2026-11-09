'use strict';

const categories = [
  ['all', 'সব পণ্য', 'grid', '#F0DFD2'],
  ['mushroom', 'মাশরুম', 'mushroom', '#f1e8d9'],
  ['oil', 'তেল', 'drop', '#f5edce'],
  ['spices', 'মসলা', 'leaf', '#f5e4d7'],
  ['honey', 'মধু', 'jar', '#f4ebd4'],
  ['pantry', 'চাল ও ডাল', 'grain', '#EEE1CE']
];

const products = [
  {id:'mushroom', category:'mushroom', name:'অয়েস্টার মাশরুম', pack:'২৫০ গ্রাম', price:120, badge:'মাশরুম', keywords:'মাসরুম মাশরুম oyster mushroom', description:'ভাজি, স্যুপ বা সবজির সঙ্গে রান্না করার জন্য কোমল অয়েস্টার মাশরুম। ফ্রিজে রাখুন এবং রান্নার আগে পরিষ্কার করে নিন।'},
  {id:'oil', category:'oil', name:'ঘানির সরিষার তেল', pack:'১ লিটার', price:390, badge:'সরিষার তেল', keywords:'সর্ষের তেল সর্সার তেল mustard oil', description:'ভর্তা, ভাজি ও মাছের ঝোলে সরিষার পরিচিত ঘ্রাণ। বোতল বন্ধ করে শীতল ও শুকনো জায়গায় রাখুন।'},
  {id:'turmeric', category:'spices', name:'হলুদ গুঁড়া', pack:'২০০ গ্রাম', price:145, keywords:'turmeric spice', description:'ডাল, মাছ বা তরকারিতে রং ও স্বাদের জন্য গুঁড়া হলুদ। শুকনো চামচ ব্যবহার করুন।'},
  {id:'honey', category:'honey', name:'সরিষা ফুলের মধু', pack:'৫০০ গ্রাম', price:420, keywords:'honey', description:'চা, রুটি বা দইয়ের সঙ্গে পরিবেশনের জন্য সরিষা ফুলের মধু। স্বাভাবিকভাবে দানা বাঁধতে পারে।'},
  {id:'dal', category:'pantry', name:'সোনা মুগ ডাল', pack:'৫০০ গ্রাম', price:140, keywords:'dal lentil mung', description:'ভুনা ডাল ও খিচুড়ির জন্য ছোট দানার মুগ ডাল। রান্নার আগে ধুয়ে নিন।'},
  {id:'rice', category:'pantry', name:'সুগন্ধি চিনিগুঁড়া চাল', pack:'১ কেজি', price:185, keywords:'rice চাল চিনিগুড়া', description:'পোলাও, পায়েস ও উৎসবের রান্নার জন্য ছোট দানার সুগন্ধি চাল।'}
];

const $ = (id) => document.getElementById(id);
const moneyFormat = new Intl.NumberFormat('bn-BD');
const number = (n) => moneyFormat.format(n);
const money = (n) => '৳' + number(n);
const icon = (name) => '<svg class="icon" aria-hidden="true"><use href="#' + name + '"/></svg>';
const productMap = new Map(products.map((product) => [product.id, product]));
const imagePath = (id) => 'assets/' + id + '.webp';
const shippingFees = {dhaka:70, outside:130};
const cart = readCart();
const search = $('product-search');
const sort = $('sort');
const detailDialog = $('detail-dialog');
const cartDialog = $('cart-dialog');
const cartContent = $('cart-content');
let category = 'all';
let toastTimer;

function readCart() {
  try {
    const saved = JSON.parse(localStorage.getItem('matir-haat-cart') || '{}');
    return new Map(products.flatMap(({id}) => {
      const count = saved?.[id];
      return Number.isInteger(count) && count > 0 && count <= 99 ? [[id, count]] : [];
    }));
  } catch {
    return new Map();
  }
}

function saveCart() {
  try {
    localStorage.setItem('matir-haat-cart', JSON.stringify(Object.fromEntries(cart)));
  } catch {
    // The current tab still retains the cart when storage is unavailable.
  }
  const itemCount = number([...cart.values()].reduce((sum, count) => sum + count, 0));
  $('cart-count').textContent = itemCount;
  $('cart-button').setAttribute('aria-label', 'কার্ট, ' + itemCount + 'টি পণ্য');
}

function setQuantity(id, quantity) {
  if (!productMap.has(id)) return;
  if (quantity > 0) cart.set(id, Math.min(99, quantity));
  else cart.delete(id);
  saveCart();
}

function addProduct(id) {
  setQuantity(id, (cart.get(id) || 0) + 1);
  const toast = $('toast');
  toast.textContent = productMap.get(id).name + ' কার্টে যোগ হয়েছে';
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2400);
}

function resetFilters() {
  category = 'all';
  search.value = '';
  sort.value = 'featured';
  renderProducts();
}

function renderProducts() {
  const query = search.value.trim().normalize().toLocaleLowerCase();
  const filtered = products.filter((product) => {
    const searchable = [product.name, product.keywords, product.pack, categories.find(([id]) => id === product.category)[1]].join(' ').normalize().toLocaleLowerCase();
    return (category === 'all' || category === product.category) && query.split(/\s+/).every((term) => searchable.includes(term));
  });
  if (sort.value === 'low') filtered.sort((a,b) => a.price - b.price);
  if (sort.value === 'high') filtered.sort((a,b) => b.price - a.price);

  for (const button of $('category-list').querySelectorAll('button')) {
    button.setAttribute('aria-pressed', String(button.dataset.category === category));
  }
  $('result-count').textContent = number(filtered.length) + 'টি পণ্য';
  $('reset-filters').hidden = category === 'all' && !query && sort.value === 'featured';
  $('product-grid').innerHTML = filtered.length ? filtered.map((product) => `
    <article class="product">
      <button type="button" class="product-image" data-detail="${product.id}" aria-label="${product.name} সম্পর্কে দেখুন">
        <img src="${imagePath(product.id)}" alt="" loading="lazy" width="508" height="508">
        ${product.badge ? '<span class="tag">' + product.badge + '</span>' : ''}
      </button>
      <div class="product-info">
        <h3><button class="product-name" type="button" data-detail="${product.id}">${product.name}</button></h3>
        <p class="pack">${product.pack}</p>
        <div class="product-bottom"><span class="price">${money(product.price)}</span><button type="button" class="button primary add-button" data-add="${product.id}" aria-label="${product.name} কার্টে যোগ করুন">${icon('plus')} কার্টে যোগ</button></div>
      </div>
    </article>`).join('') : '<p class="empty">কোনো পণ্য পাওয়া যায়নি। অন্য শব্দ দিয়ে খুঁজে দেখুন।</p>';
}

function showProduct(id) {
  const product = productMap.get(id);
  detailDialog.innerHTML = `
    <article class="detail-card">
      <img src="${imagePath(id)}" alt="${product.name}">
      <button type="button" class="icon-button detail-close" data-close aria-label="পণ্যের বিবরণ বন্ধ করুন">${icon('close')}</button>
      <div class="detail-copy"><div class="eyebrow">পণ্যের বিবরণ</div>
        <h2 id="detail-title">${product.name}</h2><p>${product.pack} · নমুনা পণ্য</p>
        <p>${product.description}</p><div class="price">${money(product.price)}</div>
        <button class="button primary" type="button" data-detail-add="${id}">${icon('plus')} কার্টে যোগ করুন</button>
      </div>
    </article>`;
  detailDialog.showModal();
}

function subtotal() {
  return [...cart].reduce((sum, [id,count]) => sum + productMap.get(id).price * count, 0);
}

function showCart() {
  $('cart-title').textContent = 'আপনার কার্ট';
  if (cart.size === 0) {
    cartContent.innerHTML = '<p class="empty">আপনার কার্ট খালি।</p><a class="button primary cart-wide" href="#products" data-browse>পণ্য দেখুন</a>';
    return;
  }
  const rows = [...cart].map(([id,count]) => {
    const product = productMap.get(id);
    return `
      <article class="cart-line">
        <img src="${imagePath(id)}" alt="">
        <div><strong>${product.name}</strong><p class="pack">${product.pack}</p>
          <div class="quantity"><button type="button" data-change="-1" data-id="${id}" aria-label="${product.name} কমান">−</button><span>${number(count)}</span><button type="button" data-change="1" data-id="${id}" aria-label="${product.name} বাড়ান"${count === 99 ? ' disabled' : ''}>+</button></div>
          <button class="text-button" type="button" data-remove="${id}">সরান</button>
        </div><span class="price">${money(product.price * count)}</span>
      </article>`;
  }).join('');
  cartContent.innerHTML = `
    <div class="cart-lines">${rows}</div>
    <div class="total-line"><span>পণ্যের মোট</span><strong>${money(subtotal())}</strong></div>
    <p class="pack">ডেলিভারি চার্জ চেকআউটে যোগ হবে।</p>
    <button class="button primary cart-wide" type="button" data-checkout>চেকআউট দেখুন ${icon('left')}</button>`;
}

function showCheckout() {
  $('cart-title').textContent = 'চেকআউট';
  cartContent.innerHTML = `
    <form class="checkout" id="checkout-form">
      <p class="checkout-note">এটি নমুনা চেকআউট। পরীক্ষার জন্য নমুনা তথ্য ব্যবহার করুন। লাইভ অর্ডার ও পেমেন্ট প্রিভিউয়ের বাইরে।</p>
      <label>নাম<input name="name" type="text" required maxlength="100"></label>
      <label>মোবাইল নম্বর<input name="phone" type="tel" inputmode="tel" required pattern="(?:[+]88)?[০0][১1][০-৯0-9]{9}" title="০১ দিয়ে শুরু ১১ সংখ্যার মোবাইল নম্বর দিন" placeholder="০১XXXXXXXXX"></label>
      <label>ডেলিভারির ঠিকানা<textarea name="address" required maxlength="400"></textarea></label>
      <label>ডেলিভারি এলাকা<select name="zone"><option value="dhaka">ঢাকা শহর</option><option value="outside">ঢাকার বাইরে</option></select></label>
      <div>
        <div class="total-line"><span>পণ্যের মোট</span><strong>${money(subtotal())}</strong></div>
        <div class="total-line"><span>নমুনা ডেলিভারি চার্জ</span><strong id="shipping-fee"></strong></div>
        <div class="total-line cart-total"><span>সর্বমোট</span><strong id="checkout-total"></strong></div>
      </div>
      <button class="button primary" type="submit">নমুনা অর্ডার যাচাই করুন</button>
      <button class="text-button" type="button" data-back>কার্টে ফিরুন</button>
    </form>`;
  const form = $('checkout-form');
  const zone = form.elements.zone;
  const updateTotals = () => {
    const fee = shippingFees[zone.value];
    $('shipping-fee').textContent = money(fee);
    $('checkout-total').textContent = money(subtotal() + fee);
  };
  zone.addEventListener('change', updateTotals);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const total = subtotal() + shippingFees[zone.value];
    $('cart-title').textContent = 'নমুনা অর্ডারের সারাংশ';
    cartContent.innerHTML = `
      <p class="checkout-note">আপনার নমুনা চেকআউট সম্পন্ন হয়েছে।</p>
      <div class="total-line cart-total"><span>ডেলিভারিসহ মোট</span><strong>${money(total)}</strong></div>
      <button class="button primary cart-wide" type="button" data-back>কার্টে ফিরুন</button>`;
    cartContent.querySelector('button').focus();
  });
  updateTotals();
  form.elements.name.focus();
}

$('category-list').innerHTML = categories.map(([id,label,symbol,color]) => `
  <button class="category-button" type="button" data-category="${id}" style="--category-color:${color}" aria-pressed="false">
    <span class="category-icon">${icon(symbol)}</span>${label}
  </button>`).join('');

$('category-list').addEventListener('click', (event) => {
  const button = event.target.closest('[data-category]');
  if (!button) return;
  category = button.dataset.category;
  search.value = '';
  renderProducts();
  $('products').scrollIntoView();
});
$('reset-filters').addEventListener('click', resetFilters);
search.addEventListener('input', renderProducts);
sort.addEventListener('change', renderProducts);
$('search-button').addEventListener('click', () => {
  $('products').scrollIntoView();
  search.focus({preventScroll:true});
});
$('product-grid').addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (button?.dataset.detail) showProduct(button.dataset.detail);
  if (button?.dataset.add) addProduct(button.dataset.add);
});
detailDialog.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (event.target === detailDialog || button?.hasAttribute('data-close')) detailDialog.close();
  if (button?.dataset.detailAdd) {
    detailDialog.close();
    addProduct(button.dataset.detailAdd);
  }
});
$('cart-button').addEventListener('click', () => {
  showCart();
  cartDialog.showModal();
});
$('close-cart').addEventListener('click', () => cartDialog.close());
cartDialog.addEventListener('click', (event) => {
  if (event.target === cartDialog || event.target.closest('[data-browse]')) cartDialog.close();
});
cartContent.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const {id, change, remove} = button.dataset;
  if (change || remove) {
    setQuantity(id || remove, change ? cart.get(id) + Number(change) : 0);
    showCart();
    const next = id && cartContent.querySelector('[data-id="' + id + '"][data-change="' + change + '"]:not([disabled])');
    (next || cartContent.querySelector('button, a') || $('close-cart')).focus();
  }
  if (button.hasAttribute('data-checkout')) showCheckout();
  if (button.hasAttribute('data-back')) {
    showCart();
    cartContent.querySelector('[data-checkout]')?.focus();
  }
});

renderProducts();
saveCart();
