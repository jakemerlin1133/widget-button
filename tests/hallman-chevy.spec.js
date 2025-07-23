import { test, expect } from '@playwright/test';

// ✅ Set test timeout to 15 minutes (900,000 ms)
test.describe.configure({ timeout: 15 * 60 * 1000 });

test('Inject form and handle unlock buttons on inventory page', async ({ page }) => {
  await page.goto('https://www.hallmanchevrolet.com/searchnew.aspx', {
    waitUntil: 'domcontentloaded',
  });

  await page.evaluate(() => {
    const priceFinalSelector = 'li.priceStakRowBuyPrice:nth-child(3)';
    const priceTargetSelector = '.featuredPrice';
    let cardSelector = 'div.vehicle-card[data-vin]';
    let carTitle = 'h3.vehicle-title__text';
    let currentCardUuid = null;
    let selectedCarTitle = '';
    let savedPhoneNumber = '';

    // === Your existing styles & UI setup here (unchanged) ===
    const styleTag = document.createElement('style');
    styleTag.textContent = `
      .unlock-btn {
        padding: 10px 20px;
        font-weight: bold;
        background-color:#b6862d;
        color: #fff;
        border-radius: 5px;
        border: none;
        cursor: pointer;
        transition: background-color 0.2s ease;
        font-size: 15px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      .unlock-btn:hover {
        background-color:#9b7125;
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

    const chevroletLogo = document.querySelector('div.rotateLogos img.logoChevrolet');
    const textLogo = document.querySelector('li.dealerLogo a.stat-image-link img.img-responsive');

    let clonedChevrolet = null;
    let clonedText = null;

    if (chevroletLogo) {
      clonedChevrolet = chevroletLogo.cloneNode(true);
      clonedChevrolet.style.height = '43px';
      clonedChevrolet.style.width = 'auto';
    }

    if (textLogo) {
      clonedText = textLogo.cloneNode(true);
      clonedText.style.height = '43px';
      clonedText.style.width = 'auto';
      clonedText.style.marginRight = '10px'; // space between logos
    }

  form.innerHTML = `
  <div style="grid-column: span 2; align-items: center; gap: 12px; margin-bottom: 20px;">
    <div id="formLogoHolder" style="display: flex; align-items: center; gap: 10px;"></div>
  </div>

  <div style="grid-column: span 2; display: flex; justify-content: center; align-items: center;">
    <h3 style="font-size: 20px; margin: 0;">Unlock the Instant Price</h3>
  </div>

<div style="display: flex; gap: 10px; grid-column: span 2; margin-top: 20px;">
  <div style="flex: 1;">
    <label for="fname">First Name:</label><br>
    <input type="text" id="fname" name="fname" required style="font-size:16px; padding: 8px; width: 100%; outline: none;">
  </div>

  <div style="flex: 1;">
    <label for="lname">Last Name:</label><br>
    <input type="text" id="lname" name="lname" required style="font-size:16px; padding: 8px; width: 100%; outline: none;">
  </div>
</div>

<div style="display: flex; gap: 10px; grid-column: span 2; margin-top: 20px;">
 <div style="flex: 1;">
    <label for="contactMode">Preferred Contact:</label><br>
    <select id="contactMode" name="contactMode" style="font-size:16px; padding: 8px; width: 100%; outline:none;">
      <option value="SMS">SMS</option>
      <option value="Call">Call</option>
    </select>
  </div>

 <div style="flex: 1;">
    <label for="phone">Phone:</label><br>
    <input type="text" id="phone" name="phone" required style="font-size:16px; padding: 8px; width: 100%; outline:none;">
  </div>
</div>



  <div style="grid-column: span 2;">
    <label for="comment">Comment:</label><br>
    <textarea id="comment" name="comment" required style="font-size:16px; padding: 8px; width: 100%; height: 150px; outline:none;"></textarea>
  </div>

  <div style="grid-column: span 2; text-align: center; color: #303030ff; font-weight: 400; font-size: 13.6px; margin: 20px 17px;">
    By requesting Instant Price, you agree that Dave Hallman Chevrolet and its affiliates, and sales professionals may call/text you about your inquiry, which may involve use of automated means and prerecorded/artificial voices. Message/data rates may apply. You also agree to our
    <a href="#" style="cursor: pointer;">terms of use</a>.
  </div>

  <div style="grid-column: span 2; text-align: center; margin-top: 20px;">
    <button type="submit" class="unlock-btn">Unlock Instant Price</button>
  </div>
`;

    // Inject logos into logo holder
    const logoHolder = form.querySelector('#formLogoHolder');
    if (clonedChevrolet) {
      const link = document.createElement('a');
      link.href = '/';
      link.appendChild(clonedChevrolet);
      logoHolder.appendChild(link);
    }
    if (logoHolder && clonedText) {
      const link = document.createElement('a');
      link.href = '/';
      link.appendChild(clonedText);
      logoHolder.appendChild(link);
    }

    // Form for submitting credentials and phone number
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const card = document.querySelector(`div[data-vin="${currentCardUuid}"]`);
      const priceEl = card?.querySelector(priceTargetSelector);
      const rawPriceText = priceEl ? priceEl.textContent : '';
      const carPrice = (rawPriceText.match(/[\d,]+(?:\.\d{2})?/) || [''])[0].replace(/[,]/g, '');

      const formData = {
        carTitle: selectedCarTitle || '',
        carPrice: (carPrice || '').replace(/[$,]/g, ''),
        firstName: document.querySelector('#fname')?.value || '',
        lastName: document.querySelector('#lname')?.value || '',
        contactMode: document.querySelector('#contactMode')?.value || '',
        phone: document.querySelector('#phone')?.value || '',
        comment: document.querySelector('#comment')?.value || '',
      };

      console.log('🔄 Form Submitted:', JSON.stringify(formData, null, 2));

      try {
        const response = await fetch('http://127.0.0.1:8000/api/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        const result = await response.json();
        console.log('✅ SMS API Response:', result);  // grab OTP if returned, else empty string

        alert('📩 OTP sent to your phone!');

        if (!formContainer) {
          console.error('❌ formContainer is not defined!');
          return;
        }

        savedPhoneNumber = document.querySelector('#phone')?.value.trim() || '';

        formContainer.innerHTML = '';  // Clear existing content

        if (closeBtn) {
          formContainer.appendChild(closeBtn); // Re-add close button if any
        }

        // Setup formContainer styles
        formContainer.style.display = 'grid';
        formContainer.style.gridTemplateColumns = '1fr 1fr';
        formContainer.style.gap = '20px';

        // Creat code title
        const otpTitle = document.createElement('h3');
        otpTitle.textContent = 'Code sent to your phone';
        otpTitle.style.gridColumn = 'span 2';
        otpTitle.style.textAlign = 'center';
        otpTitle.style.marginBottom = '10px';

        // Create OTP input
        const otpInput = document.createElement('input');
        otpInput.type = 'text';
        otpInput.placeholder = 'Enter code';
        otpInput.required = true;
        otpInput.style.fontSize = '16px';
        otpInput.style.padding = '10px';
        otpInput.style.width = '100%';
        otpInput.style.outline = 'none';
        otpInput.style.gridColumn = 'span 2';
        otpInput.style.textAlign = 'center';

        // Create Verify button
        const verifyBtn = document.createElement('button');
        verifyBtn.type = 'button';
        verifyBtn.className = 'unlock-btn';
        verifyBtn.textContent = 'Verify Code';
        verifyBtn.style.gridColumn = 'span 2';

        Object.assign(verifyBtn.style, {
          padding: '10px 20px',
          fontWeight: 'bold',
          backgroundColor: '#b6862d',
          color: '#fff',
          borderRadius: '5px',
          border: 'none',
          cursor: 'pointer',
          fontSize: '15px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          transition: 'background-color 0.2s ease',
          marginTop: "20px",
          width: '100%',
          boxSizing: 'border-box'
        });

        // Append to container
        formContainer.appendChild(otpTitle);
        formContainer.appendChild(otpInput);
        formContainer.appendChild(verifyBtn);

        overlay.style.display = 'block';

        setTimeout(() => otpInput.focus(), 100);

        verifyBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          const enteredOtp = otpInput.value.trim();

          const payload = {
            phone: savedPhoneNumber,
            otp: enteredOtp,
          };

          console.log('📦 Sending payload to verify-otp:', payload);

          try {
            const response = await fetch('http://127.0.0.1:8000/api/verify-otp', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify(payload),
            });

            const data = await response.json();
            console.log('🔁 Received from /verify-otp:', data);

            if (response.ok && data.success) {
              alert('✅ Code Verified! Unlocking price...');

              if (currentCardUuid) {
                const card = document.querySelector(`div[data-vin="${currentCardUuid}"]`);
                if (card) {
                  const priceElement = card.querySelector(priceTargetSelector);
                  if (priceElement) priceElement.style.display = '';

                  const finalPriceElement = card.querySelector(priceFinalSelector);
                  if (finalPriceElement) finalPriceElement.style.display = '';

                  const unlockBtn = card.querySelector('button.unlock-btn');
                  if (unlockBtn) unlockBtn.remove();
                }
              }

              selectedCarTitle = '';
              uuidDisplay.innerText = '';

            // ✅ Hide OTP and re-show form properly
            overlay.style.display = 'none';
            overlay.style.visibility = 'hidden';
            formContainer.innerHTML = ''; // Clear OTP UI
            formContainer.style.display = 'none';
            form.style.display = 'none'; // Keep form hidden until next unlock click

            } else {
              alert('❌ Invalid code or server error. Please try again.');
              otpInput.focus();
            }
          } catch (error) {
            console.error('Error verifying OTP:', error);
            alert('⚠️ Server error. Please try again later.');
          }
        });

      } catch (error) {
        console.error('❌ Failed to send SMS:', error);
        alert('Server error. Please try again later.');
        overlay.style.display = 'none';
        formContainer.style.display = 'none';
      }
    });

    formContainer.appendChild(uuidDisplay);
    formContainer.appendChild(form);
    document.body.appendChild(overlay);
    document.body.appendChild(formContainer);

    // --- THE KEY PART: Remove the <li> with Final Price: label ---
    const listItems = [...document.querySelectorAll('li.priceBlockItem.priceBlockItemPrice.priceStakRowBuyPrice')];
    for (const li of listItems) {
      const labelSpan = li.querySelector('span.priceBlocItemPriceLabel');
      if (labelSpan && labelSpan.textContent.trim().startsWith('Final Price')) {
        li.remove();
        break;
      }
    }

    const injectButtons = () => {
      const targets = document.querySelectorAll(priceTargetSelector);
      targets.forEach((el) => {
        const card = el.closest(cardSelector);
        const uuid = card?.getAttribute('data-vin') || '';

        if (!el.getAttribute('data-modified')) {
          el.style.display = 'none';

          const btn = document.createElement('button');
          btn.innerText = 'Unlock Instant Price';
          btn.className = 'unlock-btn';
          btn.style.margin = '6px 0px';

          btn.onclick = () => {
            const cardTitleElement = card?.querySelector(carTitle);
            selectedCarTitle = cardTitleElement ? cardTitleElement.textContent.trim() : '';
            currentCardUuid = uuid;

            overlay.style.display = 'block';
            formContainer.style.display = '';
            if (closeBtn) formContainer.appendChild(closeBtn);
            formContainer.appendChild(uuidDisplay);
            formContainer.appendChild(form);
            form.style.display = 'block';
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

  // Wait 15 minutes for manual testing or whatever
  await page.waitForTimeout(15 * 60 * 1000);
});
