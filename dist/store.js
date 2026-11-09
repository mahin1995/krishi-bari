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
const productPath = (id) => 'product.html?id=' + encodeURIComponent(id);
const detail = $('product-detail');
const browsePath = detail ? './#products' : '#products';
const shippingFees = {dhaka:70, outside:130};
const cart = readCart();
const search = $('product-search');
const sort = $('sort');
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
  updateCartCount();
}

function updateCartCount() {
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

function addProduct(id, count = 1) {
  setQuantity(id, (cart.get(id) || 0) + count);
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
      <a class="product-image" href="${productPath(product.id)}" aria-label="${product.name} বিস্তারিত দেখুন">
        <img src="${imagePath(product.id)}" alt="" loading="lazy" width="508" height="508">
        ${product.badge ? '<span class="tag">' + product.badge + '</span>' : ''}
      </a>
      <div class="product-info">
        <h3><a class="product-name" href="${productPath(product.id)}">${product.name}</a></h3>
        <p class="pack">${product.pack}</p>
        <div class="product-bottom"><span class="price">${money(product.price)}</span><a class="text-button detail-link" href="${productPath(product.id)}">বিস্তারিত</a></div>
        <div class="product-actions">
          <button type="button" class="button primary" data-order="${product.id}" aria-label="${product.name} এখনই অর্ডার করুন">এখনই অর্ডার</button>
          <button type="button" class="button secondary add-button" data-add="${product.id}" aria-label="${product.name} কার্টে যোগ করুন" title="কার্টে যোগ করুন">${icon('bag')}<span class="add-label">কার্টে যোগ</span></button>
        </div>
      </div>
    </article>`).join('') : '<p class="empty">কোনো পণ্য পাওয়া যায়নি। অন্য শব্দ দিয়ে খুঁজে দেখুন।</p>';
}

function renderDetail() {
  const product = productMap.get(new URLSearchParams(location.search).get('id'));
  if (!product) {
    detail.innerHTML = '<section class="empty"><h1>পণ্য পাওয়া যায়নি</h1><a class="button primary" href="./#products">সব পণ্য দেখুন</a></section>';
    return;
  }
  const {id, name, pack, price, description} = product;
  document.title = name + ' — কৃষি বাড়ি';
  document.querySelector('meta[name="description"]').content = description;
  detail.innerHTML = `
    <article class="product-detail">
      <div class="detail-gallery">
        <button class="gallery-stage" id="open-preview" type="button" aria-label="${name} এর ছবি বড় করে দেখুন">
          <img id="detail-photo" src="${imagePath(id)}" alt="${name}" width="508" height="508" fetchpriority="high">
          <span class="gallery-zoom">${icon('search')} বড় করে দেখুন</span>
        </button>
        <div class="gallery-thumbnails" role="group" aria-label="পণ্যের ছবি বেছে নিন"></div>
      </div>
      <div class="detail-copy">
        <div class="eyebrow"><span></span> পণ্যের বিস্তারিত</div>
        <h1>${name}</h1>
        <p class="detail-pack">${pack} প্রতি প্যাক</p>
        <p class="detail-description">${description}</p>
        <div class="detail-quantity">
          <strong>কয়টি প্যাক নেবেন?</strong>
          <div class="quantity">
            <button type="button" data-detail-qty="-1" aria-label="পরিমাণ কমান" disabled>−</button>
            <output id="detail-qty" aria-live="polite">১</output>
            <button type="button" data-detail-qty="1" aria-label="পরিমাণ বাড়ান">+</button>
          </div>
        </div>
        <div class="detail-price"><span>পণ্যের মোট</span><strong class="price" id="detail-price">${money(price)}</strong></div>
        <div class="detail-actions">
          <button class="button primary" id="order-product" type="button">এখনই অর্ডার করুন ${icon('left')}</button>
          <button class="button secondary add-button" id="add-product" type="button" aria-label="কার্টে যোগ করুন">${icon('bag')} কার্টে যোগ</button>
        </div>
        <p class="delivery-note">${icon('truck')} ঠিকানা দেওয়ার সময় ডেলিভারি খরচ দেখানো হবে।</p>
      </div>
    </article>`;
  let quantity = 1;
  const quantityButtons = detail.querySelectorAll('[data-detail-qty]');
  quantityButtons.forEach(button => button.addEventListener('click', () => {
    quantity = Math.max(1, Math.min(99, quantity + Number(button.dataset.detailQty)));
    $('detail-qty').textContent = number(quantity);
    $('detail-price').textContent = money(price * quantity);
    quantityButtons[0].disabled = quantity === 1;
    quantityButtons[1].disabled = quantity === 99;
  }));
  $('order-product').addEventListener('click', () => orderProduct(id, quantity));
  $('add-product').addEventListener('click', () => addProduct(id, quantity));

  setupGallery(id, name);
}

function setupGallery(id, name) {
  const photos = [
    {src:imagePath(id), label:'মূল ছবি'},
    {src:imagePath(id + '-angle'), label:'অন্য দিক থেকে'},
    {src:imagePath(id + '-detail'), label:'কাছ থেকে'}
  ];
  const main = $('detail-photo');
  const preview = $('photo-preview');
  const previewImage = $('preview-photo');
  const thumbnails = detail.querySelector('.gallery-thumbnails');
  let selected = 0;

  thumbnails.innerHTML = photos.map(({src, label}, index) => `
    <button class="gallery-thumb" type="button" aria-label="ছবি ${number(index + 1)} · ${label}" aria-pressed="${index === 0}">
      <img src="${src}" alt="" width="84" height="70" loading="lazy">
    </button>`).join('');
  const buttons = [...thumbnails.querySelectorAll('button')];

  function renderPreview() {
    previewImage.src = photos[selected].src;
    previewImage.alt = name + ' · ' + photos[selected].label;
    $('preview-count').textContent = 'ছবি ' + number(selected + 1) + ' / ' + number(photos.length);
  }

  function selectPhoto(index) {
    buttons[selected].setAttribute('aria-pressed', 'false');
    selected = (index + photos.length) % photos.length;
    buttons[selected].setAttribute('aria-pressed', 'true');
    main.src = photos[selected].src;
    main.alt = name + ' · ' + photos[selected].label;
    if (preview.open) renderPreview();
  }

  buttons.forEach((button, index) => button.addEventListener('click', () => selectPhoto(index)));
  $('open-preview').addEventListener('click', () => {
    $('photo-preview-title').textContent = name;
    renderPreview();
    preview.showModal();
  });
  $('close-preview').addEventListener('click', () => preview.close());
  $('previous-photo').addEventListener('click', () => selectPhoto(selected - 1));
  $('next-photo').addEventListener('click', () => selectPhoto(selected + 1));
  preview.addEventListener('click', event => {
    if (event.target === preview) preview.close();
  });
  preview.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    selectPhoto(selected + (event.key === 'ArrowLeft' ? -1 : 1));
  });
}

function subtotal(items = cart) {
  return [...items].reduce((sum, [id,count]) => sum + productMap.get(id).price * count, 0);
}

function orderProduct(id, quantity = 1) {
  showCheckout(new Map([[id, quantity]]));
}

function showCart() {
  $('cart-title').textContent = 'আপনার কার্ট';
  if (cart.size === 0) {
    cartContent.innerHTML = `<p class="empty">আপনার কার্ট খালি।</p><a class="button primary cart-wide" href="${browsePath}" data-browse>পণ্য দেখুন</a>`;
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
    <button class="button primary cart-wide" type="button" data-checkout>অর্ডার করতে ঠিকানা দিন ${icon('left')}</button>`;
}

function showCheckout(items = cart) {
  const direct = items !== cart;
  const itemTotal = subtotal(items);
  const summary = [...items].map(([id, count]) => {
    const product = productMap.get(id);
    return `<li><span>${product.name} · ${number(count)} প্যাক</span><strong>${money(product.price * count)}</strong></li>`;
  }).join('');
  $('cart-title').textContent = 'অর্ডারের ঠিকানা';
  cartContent.innerHTML = `
    <form class="checkout" id="checkout-form">
      <p class="checkout-note">ডেমো অর্ডার। ফর্মটি পরীক্ষা করতে নমুনা তথ্য দিন।</p>
      <ul class="checkout-items" aria-label="অর্ডারের পণ্য">${summary}</ul>
      <label>আপনার নাম<input name="name" type="text" autocomplete="name" required maxlength="100"></label>
      <label>মোবাইল নম্বর<input name="phone" type="tel" inputmode="tel" autocomplete="tel" required pattern="(?:[+]88)?[০0][১1][০-৯0-9]{9}" title="০১ দিয়ে শুরু ১১ সংখ্যার মোবাইল নম্বর দিন" placeholder="০১XXXXXXXXX"></label>
      <label>পুরো ঠিকানা<textarea name="address" autocomplete="street-address" required maxlength="400" placeholder="বাসা, রাস্তা, এলাকা ও জেলা"></textarea></label>
      <label>ডেলিভারি এলাকা<select name="zone"><option value="dhaka">ঢাকা শহর</option><option value="outside">ঢাকার বাইরে</option></select></label>
      <div aria-live="polite">
        <div class="total-line"><span>পণ্যের মোট</span><strong>${money(itemTotal)}</strong></div>
        <div class="total-line"><span>ডেলিভারি চার্জ</span><strong id="shipping-fee"></strong></div>
        <div class="total-line cart-total"><span>ডেলিভারিসহ মোট</span><strong id="checkout-total"></strong></div>
      </div>
      <button class="button primary" type="submit">ডেমো অর্ডার সম্পন্ন করুন</button>
      ${direct ? '<button class="text-button" type="button" data-cancel>পণ্য দেখা চালিয়ে যান</button>' : '<button class="text-button" type="button" data-back>কার্টে ফিরুন</button>'}
    </form>`;
  const form = $('checkout-form');
  const zone = form.elements.zone;
  const updateTotals = () => {
    const fee = shippingFees[zone.value];
    $('shipping-fee').textContent = money(fee);
    $('checkout-total').textContent = money(itemTotal + fee);
  };
  zone.addEventListener('change', updateTotals);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const total = itemTotal + shippingFees[zone.value];
    $('cart-title').textContent = 'ডেমো অর্ডার সম্পন্ন';
    cartContent.innerHTML = `
      <p class="checkout-note">আপনার ডেমো চেকআউট সম্পন্ন হয়েছে।</p>
      <ul class="checkout-items">${summary}</ul>
      <div class="total-line cart-total"><span>ডেলিভারিসহ মোট</span><strong>${money(total)}</strong></div>
      <button class="button primary cart-wide" type="button" data-cancel>পণ্য দেখা চালিয়ে যান</button>`;
    cartContent.querySelector('button').focus();
  });
  updateTotals();
  if (!cartDialog.open) cartDialog.showModal();
  $('close-cart').focus();
}

if (detail) {
  renderDetail();
} else {
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
    if (button?.dataset.add) addProduct(button.dataset.add);
    if (button?.dataset.order) orderProduct(button.dataset.order);
  });
  renderProducts();
}
if (detail) $('search-button').addEventListener('click', () => location.assign('./#products'));

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
  if (button.hasAttribute('data-cancel')) cartDialog.close();
  if (button.hasAttribute('data-back')) {
    showCart();
    cartContent.querySelector('[data-checkout]')?.focus();
  }
});

window.addEventListener('pageshow', event => {
  if (!event.persisted) return;
  cart.clear();
  for (const [id, count] of readCart()) cart.set(id, count);
  updateCartCount();
});
updateCartCount();
