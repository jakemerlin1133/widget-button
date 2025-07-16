import { test, expect } from '@playwright/test';

// Set test timeout to 15 minutes
test.describe.configure({ timeout: 15 * 60 * 1000 });

test('Inject form and handle unlock buttons on inventory page', async ({ page }) => {
  await page.goto('https://www.davehallmanhyundai.com/new-inventory/index.htm', {
    waitUntil: 'domcontentloaded',
  });

  await page.evaluate(() => {
    const priceLabelSelector = 'dt.final-price.SIFRule';
    const priceValueSelector = 'dd.final-price.SIFRule.font-weight-bold.ddc-font-size-large.line-height-reset.pb-2';
    const cardSelector = 'li.vehicle-card[data-uuid]';
    const carTitleSelector = 'h2.vehicle-card-title a span';
    let currentCardUuid = null;
    let selectedCarTitle = '';
    const unlockedUuids = new Set();

    // Inject styles
    const styleTag = document.createElement('style');
    styleTag.textContent = `
      .unlock-btn {
        padding: 10px 20px;
        font-weight: bold;
        background-color:#002c5e;
        color: #fff;
        border: none;
        cursor: pointer;
        transition: background-color 0.2s ease;
        font-size: 15px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        width: 100%;
        box-sizing: border-box;
        display: block;
      }
      .unlock-btn:hover {
        background-color:#011c3b;
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.17);
      }
      #uuidDisplay {
        font-weight: 600;
        margin-bottom: 15px;
        font-size: 16px;
        color: #333;
      }
    `;
    document.head.appendChild(styleTag);

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'revealOverlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(5px)',
      zIndex: '9998',
      display: 'none',
    });

    // Create form container
    const formContainer = document.createElement('div');
    formContainer.id = 'revealFormContainer';
    Object.assign(formContainer.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: '9999',
      backgroundColor: '#fff',
      padding: '20px 25px 25px 25px',
      borderRadius: '8px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      minWidth: '300px',
      width: '600px',
      display: 'none',
      boxSizing: 'border-box',
    });

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    Object.assign(closeBtn.style, {
      position: 'absolute',
      top: '8px',
      right: '12px',
      background: 'transparent',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#999',
      lineHeight: '1',
      padding: '0',
      userSelect: 'none',
    });
    closeBtn.onclick = () => {
      overlay.style.display = 'none';
      formContainer.style.display = 'none';
      selectedCarTitle = '';
      uuidDisplay.innerText = '';
    };
    formContainer.appendChild(closeBtn);

    // UUID display
    const uuidDisplay = document.createElement('div');
    uuidDisplay.id = 'uuidDisplay';

    // Build form
    const form = document.createElement('form');
    Object.assign(form.style, {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
    });

    const hyundaiLogo = document.querySelector('div.header-logo-container a.home-logolink img');
    const textLogo = document.querySelector('div.header-logo-container a.header-logo-style img');

    let clonedHyundai = null;
    let clonedText = null;

    if (hyundaiLogo) {
      clonedHyundai = hyundaiLogo.cloneNode(true);
      clonedHyundai.style.height = '33px';
      clonedHyundai.style.width = 'auto';
      clonedHyundai.style.marginRight = '20px';
    }

    if (textLogo) {
      clonedText = textLogo.cloneNode(true);
      clonedText.style.height = '47px';
      clonedText.style.width = 'auto';
      clonedText.style.marginRight = '10px';
    }

    form.innerHTML = `
      <div style="grid-column: span 2; align-items: center; gap: 12px; margin-bottom: 10px;">
        <div id="formLogoHolder" style="display: flex; align-items: center;"></div>
      </div>

      <div style="grid-column: span 2; display: flex; justify-content: center; align-items: center;">
        <h3 style="font-size: 20px; margin: 0;">Unlock the Instant Price</h3>
      </div>

      <div>
        <label for="fname">First Name:</label><br>
        <input type="text" id="fname" name="fname" required style="font-size:16px; padding: 8px; width: 100%; outline:none;">
      </div>

      <div>
        <label for="lname">Last Name:</label><br>
        <input type="text" id="lname" name="lname" required style="font-size:16px; padding: 8px; width: 100%; outline:none;">
      </div>

      <div>
        <label for="contactMode">Preferred Contact:</label><br>
        <select id="contactMode" name="contactMode" style="font-size:16px; padding: 8px; width: 100%; outline:none;">
          <option value="SMS">SMS</option>
          <option value="Call">Call</option>
        </select>
      </div>

      <div>
        <label for="phone">Phone:</label><br>
        <input type="text" id="phone" name="phone" required style="font-size:16px; padding: 8px; width: 100%; outline:none;">
      </div>

      <div style="grid-column: span 2;">
        <label for="comment">Comment:</label><br>
        <textarea id="comment" name="comment" required style="font-size:16px; padding: 8px; width: 100%; height: 150px; outline:none;"></textarea>
      </div>

      <div style="grid-column: span 2; text-align: center; color: #303030ff; font-weight: 400; font-size: 13.6px; margin: 0px 17px;">
        By requesting Instant Price, you agree that Dave Hallman Hyundai and its affiliates, and sales professionals may call/text you about your inquiry, which may involve use of automated means and prerecorded/artificial voices. Message/data rates may apply. You also agree to our
        <a href="#" style="cursor: pointer;"> terms of use </a>.
      </div>

      <div style="grid-column: span 2; text-align: center;">
        <button type="submit" class="unlock-btn">Unlock Instant Price</button>
      </div>
    `;

    // Insert logos
    const logoHolder = form.querySelector('#formLogoHolder');
    if (clonedHyundai) {
      const link = document.createElement('a');
      link.href = '/';
      link.appendChild(clonedHyundai);
      logoHolder.appendChild(link);
    }
    if (clonedText) {
      const link = document.createElement('a');
      link.href = '/';
      link.appendChild(clonedText);
      logoHolder.appendChild(link);
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const card = document.querySelector(`li[data-uuid="${currentCardUuid}"]`);
      const priceEl = card?.querySelector(priceValueSelector);
      const carPrice = priceEl ? priceEl.textContent.trim() : '';

      const formData = {
        carTitle: selectedCarTitle || '',
        carPrice: carPrice.replace(/[$,]/g, ''),
        firstName: document.querySelector('#fname')?.value || '',
        lastName: document.querySelector('#lname')?.value || '',
        contactMode: document.querySelector('#contactMode')?.value || '',
        phone: document.querySelector('#phone')?.value || '',
        comment: document.querySelector('#comment')?.value || '',
      };

      console.log('Form Submitted:', JSON.stringify(formData, null, 2));

      try {
        const response = await fetch('http://127.0.0.1:8000/api/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        const result = await response.json();
        console.log('✅ SMS API Response:', result);

        if (result.status === 'OTP sent!') {
          alert(`OTP sent to ${result.to}. Your OTP is: ${result.otp}`);
        } else {
          alert('Failed to send OTP.');
        }
      } catch (error) {
        console.error('❌ Failed to send SMS:', error);
      }

      form.reset();
      selectedCarTitle = '';
      uuidDisplay.innerText = '';
      overlay.style.display = 'none';
      formContainer.style.display = 'none';

      // Restore price and hide button
      if (currentCardUuid) {
        const card = document.querySelector(`li[data-uuid="${currentCardUuid}"]`);
        if (card) {
          const priceElement = card.querySelector(priceValueSelector);
          const priceLabelElement = card.querySelector(priceLabelSelector);

          if (priceElement) priceElement.style.display = '';
          if (priceLabelElement) priceLabelElement.style.display = '';

          const unlockBtn = card.querySelector('button.unlock-btn');
          if (unlockBtn) unlockBtn.remove();

          unlockedUuids.add(currentCardUuid); // Mark as unlocked
        }
      }
    });

    formContainer.appendChild(uuidDisplay);
    formContainer.appendChild(form);
    document.body.appendChild(overlay);
    document.body.appendChild(formContainer);

    // Inject Unlock buttons replacing final price label and value
    const injectButtons = () => {
      const values = document.querySelectorAll(priceValueSelector);

      values.forEach((valueEl) => {
        const card = valueEl.closest(cardSelector);
        if (!card) return;
        const uuid = card.getAttribute('data-uuid');
        if (!uuid) return;

        const priceLabel = card.querySelector(priceLabelSelector);

        if (!unlockedUuids.has(uuid)) {
          if (valueEl) valueEl.style.display = 'none';
          if (priceLabel) priceLabel.style.display = 'none';
        }

        if (!valueEl.getAttribute('data-modified')) {
          const btn = document.createElement('button');
          btn.innerText = 'Unlock Instant Price';
          btn.className = 'unlock-btn';
          btn.onclick = () => {
            const cardTitleElement = card.querySelector(carTitleSelector);
            selectedCarTitle = cardTitleElement ? cardTitleElement.textContent.trim() : '';
            currentCardUuid = uuid;
            overlay.style.display = 'block';
            formContainer.style.display = 'block';
          };

          valueEl.parentElement.appendChild(btn);
          valueEl.setAttribute('data-modified', 'true');
        }
      });
    };

    injectButtons();
    new MutationObserver(injectButtons).observe(document.body, { childList: true, subtree: true });
  });

  // Keep browser open for testing
  await page.waitForTimeout(15 * 60 * 1000);
});
