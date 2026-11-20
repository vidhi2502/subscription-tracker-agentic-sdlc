'use strict';

(function initSubscriptionTracker() {
  const form = document.getElementById('add-form');
  const formError = document.getElementById('form-error');
  const subscriptionList = document.getElementById('subscription-list');
  const renewingList = document.getElementById('renewing-list');
  const monthlyTotal = document.getElementById('monthly-total');
  const listEmpty = document.getElementById('list-empty');
  const renewingEmpty = document.getElementById('renewing-empty');

  function formatAmount(value) {
    return `₹${Number(value).toFixed(2)}`;
  }

  async function requestJson(url, options) {
    const response = await fetch(url, options);
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.error || `Request failed (${response.status})`);
    }
    return body;
  }

  function createTextElement(tagName, text, className) {
    const element = document.createElement(tagName);
    element.textContent = text;
    if (className) {
      element.className = className;
    }
    return element;
  }

  function renderSubscriptionItem(item) {
    const row = document.createElement('li');
    row.className = 'item';
    row.append(
      createTextElement('span', item.name, 'item-name'),
      createTextElement('span', formatAmount(item.cost), 'item-cost'),
      createTextElement('span', item.cycle, 'item-cycle'),
      createTextElement('span', item.category || '', 'item-category'),
      createTextElement('span', `Renews ${item.nextRenewalDate}`, 'item-date')
    );
    const deleteButton = createTextElement('button', 'Delete', 'delete-button');
    deleteButton.type = 'button';
    deleteButton.dataset.id = item.id;
    row.append(deleteButton);
    return row;
  }

  function renderRenewingItem(item) {
    const row = document.createElement('li');
    row.className = 'item';
    row.append(
      createTextElement('span', item.name, 'item-name'),
      createTextElement('span', formatAmount(item.cost), 'item-cost'),
      createTextElement('span', `Renews ${item.nextRenewalDate}`, 'item-date')
    );
    return row;
  }

  function renderSubscriptions(items) {
    subscriptionList.replaceChildren(...items.map(renderSubscriptionItem));
    listEmpty.hidden = items.length > 0;
  }

  function renderRenewing(items) {
    renewingList.replaceChildren(...items.map(renderRenewingItem));
    renewingEmpty.hidden = items.length > 0;
  }

  async function refresh() {
    const [list, summary] = await Promise.all([
      requestJson('/api/subscriptions'),
      requestJson('/api/summary'),
    ]);
    renderSubscriptions(list.subscriptions);
    renderRenewing(summary.renewingSoon);
    monthlyTotal.textContent = formatAmount(summary.monthlyTotal);
  }

  function readFormPayload() {
    const data = new FormData(form);
    return {
      name: data.get('name'),
      cost: Number(data.get('cost')),
      cycle: data.get('cycle'),
      renewalDate: data.get('renewalDate'),
      category: data.get('category'),
    };
  }

  async function handleAddSubmit(event) {
    event.preventDefault();
    formError.textContent = '';
    try {
      await requestJson('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(readFormPayload()),
      });
      form.reset();
      await refresh();
    } catch (error) {
      formError.textContent = error.message;
    }
  }

  async function handleDeleteClick(event) {
    const button = event.target.closest('.delete-button');
    if (!button) {
      return;
    }
    formError.textContent = '';
    try {
      await requestJson(`/api/subscriptions/${encodeURIComponent(button.dataset.id)}`, {
        method: 'DELETE',
      });
      await refresh();
    } catch (error) {
      formError.textContent = error.message;
    }
  }

  form.addEventListener('submit', handleAddSubmit);
  subscriptionList.addEventListener('click', handleDeleteClick);
  refresh().catch((error) => {
    formError.textContent = error.message;
  });
})();
