let printingTypes = []

let selectedType = null
let size = { w: 2, h: 2 }
let quantity = 10
let sessionUser = null
let orderIntent = false

const typeScroller = document.getElementById('typeScroller')
const productName = document.getElementById('productName')
const productDesc = document.getElementById('productDesc')
const basePrice = document.getElementById('basePrice')
const widthInput = document.getElementById('width')
const heightInput = document.getElementById('height')
const sizePreset = document.getElementById('sizePreset')
const quantityInput = document.getElementById('quantity')
const priceValue = document.getElementById('priceValue')
const orderOpen = document.getElementById('orderOpen')
const scrollLeft = document.getElementById('scrollLeft')
const scrollRight = document.getElementById('scrollRight')
const signInOpen = document.getElementById('signInOpen')
const signUpOpen = document.getElementById('signUpOpen')
const year = document.getElementById('year')
const nav = document.querySelector('header.nav')
const navToggle = document.getElementById('navToggle')

function currency(n) {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(n || 0))
  } catch (e) {
    return `₹${Number(n || 0).toFixed(2)}`
  }
}

function areaPrice(unitPrice, w, h) {
  const area = Math.max(1, w) * Math.max(1, h)
  return unitPrice * area
}

async function fetchProducts() {
  const r = await fetch('api/products.php', { credentials: 'same-origin' })
  const d = await r.json()
  printingTypes = d.products || []
  if (printingTypes.length) {
    selectedType = printingTypes[0]
    productName.textContent = selectedType.name
    productDesc.textContent = selectedType.description
    basePrice.textContent = currency(selectedType.unitPrice)
  }
  renderTypes()
  updatePrice()
}

function renderTypes() {
  typeScroller.innerHTML = ''
  printingTypes.forEach(t => {
    const b = document.createElement('button')
    b.className = 'type-btn' + ((selectedType && t.id === selectedType.id) ? ' active' : '')
    b.textContent = t.name
    b.addEventListener('click', () => selectType(t.id))
    typeScroller.appendChild(b)
  })
}

function selectType(id) {
  const t = printingTypes.find(x => x.id === id)
  if (!t) return
  selectedType = t
  productName.textContent = t.name
  productDesc.textContent = t.description
  basePrice.textContent = currency(t.unitPrice)
  renderTypes()
  updatePrice()
}

function updatePrice() {
  const w = Number(widthInput.value) || 1
  const h = Number(heightInput.value) || 1
  const q = Number(quantityInput.value) || 1
  size = { w, h }
  quantity = q
  if (!selectedType) {
    priceValue.textContent = currency(0)
    return
  }
  const perItem = areaPrice(selectedType.unitPrice, w, h)
  const total = perItem * q
  priceValue.textContent = currency(total)
}

function applyPreset() {
  const v = sizePreset.value
  if (v === 'custom') return
  const parts = v.split('x')
  const w = Number(parts[0])
  const h = Number(parts[1])
  if (w > 0 && h > 0) {
    widthInput.value = String(w)
    heightInput.value = String(h)
    updatePrice()
  }
}

function openModal(id) {
  document.getElementById('modalOverlay').classList.add('show')
  document.getElementById(id).classList.add('show')
}

function closeModal(id) {
  document.getElementById('modalOverlay').classList.remove('show')
  document.getElementById(id).classList.remove('show')
}

function wireModals() {
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.getAttribute('data-close')))
  })
  document.getElementById('modalOverlay').addEventListener('click', () => {
    ;['signInModal','signUpModal','orderModal'].forEach(m => document.getElementById(m).classList.remove('show'))
    document.getElementById('modalOverlay').classList.remove('show')
  })
}

function initNav() {
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => nav.classList.toggle('open'))
  }
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', () => nav.classList.remove('open'))
  })
}

function initOrder() {
  orderOpen.addEventListener('click', () => {
    if (!sessionUser) {
      orderIntent = true
      nav.classList.remove('open')
      const status = document.getElementById('signInStatus')
      if (status) {
        status.textContent = 'Please sign in to place an order'
        status.className = 'form-status error'
      }
      openModal('signInModal')
      return
    }
    openOrderModalPrefilled()
  })
  document.getElementById('orderForm').addEventListener('submit', e => {
    e.preventDefault()
    const name = document.getElementById('oName').value.trim()
    const email = document.getElementById('oEmail').value.trim()
    const phone = document.getElementById('oPhone').value.trim()
    const address = document.getElementById('oAddress').value.trim()
    const qty = Number(document.getElementById('oQuantity').value) || 1
    fetch('api/order.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        typeId: selectedType.id,
        width: size.w,
        height: size.h,
        quantity: qty,
        name,
        email,
        phone,
        address
      })
    })
      .then(r => r.json())
      .then(d => {
        const success = document.getElementById('orderSuccess')
        if (d && d.ok) {
          success.textContent = `Order ${d.orderId} confirmed for ${name}. Total ${currency(Number(d.total))}.`
          document.getElementById('oTotal').value = currency(Number(d.total))
        } else {
          success.textContent = 'Order failed'
        }
      })
  })
}

function openOrderModalPrefilled() {
  document.getElementById('oType').value = selectedType ? selectedType.name : ''
  document.getElementById('oSize').value = `${size.w}×${size.h} in`
  document.getElementById('oQuantity').value = String(quantity)
  document.getElementById('oTotal').value = priceValue.textContent
  const nameEl = document.getElementById('oName')
  const emailEl = document.getElementById('oEmail')
  if (sessionUser) {
    nameEl.value = sessionUser.name || ''
    emailEl.value = sessionUser.email || ''
    nameEl.readOnly = true
    emailEl.readOnly = true
  } else {
    nameEl.readOnly = false
    emailEl.readOnly = false
  }
  openModal('orderModal')
}

function initAuth() {
  signInOpen.addEventListener('click', () => openModal('signInModal'))
  signUpOpen.addEventListener('click', () => openModal('signUpModal'))
  document.getElementById('toSignUp').addEventListener('click', () => {
    closeModal('signInModal')
    openModal('signUpModal')
  })
  document.getElementById('toSignIn').addEventListener('click', () => {
    closeModal('signUpModal')
    openModal('signInModal')
  })
  document.getElementById('signUpForm').addEventListener('submit', e => {
    e.preventDefault()
    const name = document.getElementById('suName').value.trim()
    const email = document.getElementById('suEmail').value.trim().toLowerCase()
    const password = document.getElementById('suPassword').value
    const status = document.getElementById('signUpStatus')
    if (!name || !email || !password) {
      status.textContent = 'Please fill all fields'
      status.className = 'form-status error'
      return
    }
    if (password.length < 6) {
      status.textContent = 'Password must be at least 6 characters'
      status.className = 'form-status error'
      return
    }
    fetch('api/signup.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ name, email, password })
    })
      .then(async r => {
        const d = await r.json().catch(() => ({}))
        if (r.ok && d && d.ok) {
          status.textContent = 'Account created. Please sign in.'
          status.className = 'form-status success'
          setTimeout(() => {
            closeModal('signUpModal')
            openModal('signInModal')
          }, 600)
        } else {
          status.textContent = d && d.error === 'exists' ? 'Email already exists' : 'Signup failed'
          status.className = 'form-status error'
        }
      })
      .catch(() => {
        status.textContent = 'Backend not reachable. Start PHP server.'
        status.className = 'form-status error'
      })
  })
  document.getElementById('signInForm').addEventListener('submit', e => {
    e.preventDefault()
    const email = document.getElementById('siEmail').value.trim().toLowerCase()
    const password = document.getElementById('siPassword').value
    const status = document.getElementById('signInStatus')
    fetch('api/signin.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email, password })
    })
      .then(async r => {
        const d = await r.json().catch(() => ({}))
        if (r.ok && d && d.user) {
          sessionUser = d.user
          status.textContent = ''
          closeModal('signInModal')
          updateSessionUI()
          if (orderIntent) {
            orderIntent = false
            openOrderModalPrefilled()
          }
        } else {
          status.textContent = 'Invalid email or password'
          status.className = 'form-status error'
        }
      })
      .catch(() => {
        status.textContent = 'Backend not reachable. Start PHP server.'
        status.className = 'form-status error'
      })
  })
  fetch('api/session.php', { credentials: 'same-origin' })
    .then(r => r.json())
    .then(d => {
      sessionUser = d.user || null
      updateSessionUI()
    })
}

function updateSessionUI() {
  const actions = document.querySelector('.nav-actions')
  const toggle = document.getElementById('navToggle')
  const menuActions = document.getElementById('navMenuActions')
  actions.innerHTML = ''
  if (toggle) actions.appendChild(toggle)
  if (menuActions) menuActions.innerHTML = ''
  if (sessionUser) {
    const profile = document.createElement('button')
    profile.className = 'btn ghost'
    profile.textContent = `Hi, ${sessionUser.name.split(' ')[0]}`
    const logout = document.createElement('button')
    logout.className = 'btn accent'
    logout.textContent = 'Sign Out'
    logout.addEventListener('click', () => {
      fetch('api/signout.php', { method: 'POST', credentials: 'same-origin' })
        .then(() => {
          sessionUser = null
          updateSessionUI()
        })
    })
    actions.append(profile, logout)
    if (menuActions) {
      const mProfile = document.createElement('button')
      mProfile.className = 'btn ghost'
      mProfile.textContent = profile.textContent
      const mLogout = document.createElement('button')
      mLogout.className = 'btn accent'
      mLogout.textContent = 'Sign Out'
      mLogout.addEventListener('click', () => {
        fetch('api/signout.php', { method: 'POST', credentials: 'same-origin' })
          .then(() => {
            sessionUser = null
            nav.classList.remove('open')
            updateSessionUI()
          })
      })
      menuActions.append(mProfile, mLogout)
    }
  } else {
    const inBtn = document.createElement('button')
    inBtn.className = 'btn ghost'
    inBtn.id = 'signInOpen'
    inBtn.textContent = 'Sign In'
    inBtn.addEventListener('click', () => openModal('signInModal'))
    const upBtn = document.createElement('button')
    upBtn.className = 'btn accent'
    upBtn.id = 'signUpOpen'
    upBtn.textContent = 'Sign Up'
    upBtn.addEventListener('click', () => openModal('signUpModal'))
    actions.append(inBtn, upBtn)
    if (menuActions) {
      const mIn = document.createElement('button')
      mIn.className = 'btn ghost'
      mIn.textContent = 'Sign In'
      mIn.addEventListener('click', () => {
        nav.classList.remove('open')
        openModal('signInModal')
      })
      const mUp = document.createElement('button')
      mUp.className = 'btn accent'
      mUp.textContent = 'Sign Up'
      mUp.addEventListener('click', () => {
        nav.classList.remove('open')
        openModal('signUpModal')
      })
      menuActions.append(mIn, mUp)
    }
  }
}

function initProducts() {
  fetchProducts().then(() => {
    widthInput.addEventListener('input', updatePrice)
    heightInput.addEventListener('input', updatePrice)
    quantityInput.addEventListener('input', updatePrice)
    sizePreset.addEventListener('change', applyPreset)
    scrollLeft.addEventListener('click', () => typeScroller.scrollBy({ left: -240, behavior: 'smooth' }))
    scrollRight.addEventListener('click', () => typeScroller.scrollBy({ left: 240, behavior: 'smooth' }))
  })
}

function initContact() {
  document.getElementById('contactForm').addEventListener('submit', e => {
    e.preventDefault()
    const name = document.getElementById('cName').value.trim()
    const email = document.getElementById('cEmail').value.trim()
    const message = document.getElementById('cMessage').value.trim()
    fetch('api/contact.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ name, email, message })
    }).then(r => r.json()).then(d => {
      if (d && d.ok) {
        e.target.reset()
      }
    })
  })
}

function initMisc() {
  year.textContent = String(new Date().getFullYear())
}

document.addEventListener('DOMContentLoaded', () => {
  initMisc()
  wireModals()
  initNav()
  initProducts()
  initOrder()
  initAuth()
  initContact()
})
