import { test, expect } from '@playwright/test';

// ✅ Set test timeout to 15 minutes (900,000 ms)
test.describe.configure({ timeout: 15 * 60 * 1000 });

test('Inject form and handle unlock buttons on inventory page', async ({ page }) => {

  await page.goto('https://www.davehallmanhyundai.com/new-inventory/index.htm', {
    waitUntil: 'domcontentloaded',
  });

  await page.evaluate(() => {
    const priceTargetSelector = 'dd.final-price .price-value';
    let cardSelector = 'li.vehicle-card[data-uuid]';
    let carTitle = 'h2.vehicle-card-title a span';
    let currentCardUuid = null;
    let selectedCarTitle = '';


    const styleTag = document.createElement('style');
    styleTag.textContent = `
      .unlock-btn {
        padding: 10px 20px;
        font-weight: bold;
        background-color:#002c5e;
        color: #fff;
        border-radius: 5px;
        border: none;
        cursor: pointer;
        transition: background-color 0.2s ease;
        font-size: 15px;
      }
      .unlock-btn:hover {
        background-color:#01264f;
      }
      #uuidDisplay {
        font-weight: 600;
        margin-bottom: 15px;
        font-size: 16px;
        color: #333;
      }
    `;
    document.head.appendChild(styleTag);

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

    const uuidDisplay = document.createElement('div');
    uuidDisplay.id = 'uuidDisplay';

    const form = document.createElement('form');
    Object.assign(form.style, {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
    });

    form.innerHTML = `
      <h3 style="grid-column: span 2; font-size:25px;">Unlock the Instant Price</h3>

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

      <div style="grid-column: span 2; text-align: center;">
        <button type="submit" class="unlock-btn">Unlock Instant Price</button>
      </div>
    `;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = {
        carTitle: selectedCarTitle || '',
        carPrice : priceTargetSelector || '',
        firstName: document.querySelector('#fname')?.value || '',
        lastName: document.querySelector('#lname')?.value || '',
        contactMode: document.querySelector('#contactMode')?.value || '',
        phone: document.querySelector('#phone')?.value || '',
        comment: document.querySelector('#comment')?.value || '',
      };

      console.log('Form Submitted:');
      console.log(JSON.stringify(formData, null, 2));

      try{
        const response = await fetch('http://127.0.0.1:8000/api/sms/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
        // Add Authorization header if needed:
        // 'Authorization': 'Bearer YOUR_TOKEN'
          },
            body: JSON.stringify(formData),
        });

          const result = await response.json();
          console.log('✅ SMS API Response:', result);

      }catch(error){
           console.error('❌ Failed to send SMS:', error);
      }

      form.reset();
      selectedCarTitle = '';
      uuidDisplay.innerText = '';
      overlay.style.display = 'none';
      formContainer.style.display = 'none';

      if (currentCardUuid) {
        const card = document.querySelector(`li[data-uuid="${currentCardUuid}"]`);
        if (card) {
          const priceElement = card.querySelector(priceTargetSelector);
          if (priceElement) priceElement.style.display = '';
          const unlockBtn = card.querySelector('button.unlock-btn');
          if (unlockBtn) unlockBtn.remove();
        }
      }
    });

    formContainer.appendChild(uuidDisplay);
    formContainer.appendChild(form);
    document.body.appendChild(overlay);
    document.body.appendChild(formContainer);

    const injectButtons = () => {
      const targets = document.querySelectorAll(priceTargetSelector);
      targets.forEach((el) => {
        const card = el.closest(cardSelector);
        const uuid = card?.getAttribute('data-uuid') || '';

        if (!el.getAttribute('data-modified')) {
          el.style.display = 'none';

          const btn = document.createElement('button');
          btn.innerText = 'Unlock Instant Price';
          btn.className = 'unlock-btn';
          btn.style.margin = '6px 0px'; // Optional margin only
          btn.onclick = () => {
            const cardTitleElement = card?.querySelector(carTitle);
            selectedCarTitle = cardTitleElement ? cardTitleElement.textContent.trim() : '';
            currentCardUuid = uuid;
            overlay.style.display = 'block';
            formContainer.style.display = 'block';
          };

          el.parentElement?.appendChild(btn);
          el.setAttribute('data-modified', 'true');
        }
      });
    };

    injectButtons();
    new MutationObserver(injectButtons).observe(document.body, {
      childList: true,
      subtree: true,
    });
  });

  await page.waitForTimeout(15 * 60 * 1000); // 15 minutes
});
