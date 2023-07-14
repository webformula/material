if (document.readyState !== 'loading') initialize();
else document.addEventListener('DOMContentLoaded', initialize);
function initialize() {
  window.addEventListener('formdata', onFormData);
  window.addEventListener('reset', onReset)
}


function onReset(event) {
  getAllFormElements(event.target).forEach(element => {
    if (['MDW-CHECKBOX', 'MDW-SWITCH'].includes(element.nodeName)) {
      element.checked = element.hasAttribute('checked');
    } else {
      element.value = element.getAttribute('value') || '';
    }
  });
}

function onFormData({ target, formData }) {
  getAllFormDataElement(target).forEach(element => {
    const name = element.getAttribute('name');
    const value = element.value;

    if (['MDW-CHECKBOX', 'MDW-SWITCH'].includes(element.nodeName)) {
      if (formData.has(name)) {
        if (element.checked === true) formData.set(name, value);
        else formData.delete(name);
      } else if (element.checked === true) formData.append(name, value);
    } else {
      if (formData.has(name)) formData.set(name, value);
      else formData.append(name, value);
    }
  });
}


function getAllFormElements(form) {
  return [
    ...form.querySelectorAll('input'),
    ...form.querySelectorAll('mdw-checkbox'),
    ...form.querySelectorAll('mdw-switch'),
    ...form.querySelectorAll('mdw-slider'),
    ...form.querySelectorAll('mdw-slider-range'),
    ...form.querySelectorAll('mdw-select'),
    ...form.querySelectorAll('mdw-radio-group')
  ];
}

// Does not include input because those are already handled correctly
function getAllFormDataElement(form) {
  return [
    ...form.querySelectorAll('mdw-checkbox[name]'),
    ...form.querySelectorAll('mdw-select[name]'),
      // ...form.querySelectorAll('mdw-switch[name]'),
      // ...form.querySelectorAll('mdw-slider[name]'),
      // ...form.querySelectorAll('mdw-slider-range[name]'),
      // ...form.querySelectorAll('mdw-radio-group[name]')
  ];
}
