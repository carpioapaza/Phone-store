import STRIPE_KEYS from './config.js';

const d = document,
  $phones = d.getElementById('phones'),
  $template = d.getElementById('phone-template').content,
  $fragment = d.createDocumentFragment(),
  fetchOptions = {
    headers: {
      Authorization: `Bearer ${STRIPE_KEYS.secret}`,
    },
  };

let products, prices;

const moneyFormat = (num) => `${num.slice(0, -2)}.${num.slice(-2)}`;

Promise.all([
  fetch('https://api.stripe.com/v1/products', fetchOptions),
  fetch('https://api.stripe.com/v1/prices', fetchOptions),
])
  .then((responses) => Promise.all(responses.map((res) => res.json())))
  .then((json) => {
    products = json[0].data;
    prices = json[1].data;

    prices.forEach((el) => {
      let productData = products.filter((product) => product.id === el.product);

      $template.querySelector('.phone').setAttribute('data-price', `${el.id}`);
      $template.querySelector('img').src = productData[0].images[0];
      $template.querySelector('img').alt = productData[0].name;
      $template.querySelector('figcaption').innerHTML = `
      ${productData[0].name}
      ${moneyFormat(el.unit_amount_decimal)} ${el.currency.toUpperCase()}
      `;

      let $clone = d.importNode($template, true);
      $fragment.appendChild($clone);
    });
    $phones.appendChild($fragment);
  })
  .catch((err) => {
    console.log(err);
    let message =
      err.statusText || 'Ocurrio un error al conectarse con la API de Stripe';
    $phones.innerHTML = `<p>Error ${err.status}: ${message}</p>`;
  });

d.addEventListener('click', (e) => {
  if (e.target.matches('.phone *')) {
    let price = e.target.parentElement.getAttribute('data-price');
    Stripe(STRIPE_KEYS.public)
      .redirectToCheckout({
        lineItems: [{ price: price, quantity: 1 }],
        mode: 'payment',
        successUrl: 'http://127.0.0.1:5500/assets/stripe-succes.html',
        cancelUrl: 'http://127.0.0.1:5500/assets/stripe-error.html',
      })
      .then((res) => {
        if (res.error) {
          $phones.insertAdjacentHTML('afterend', res.error.message);
        }
      });
  }
});
