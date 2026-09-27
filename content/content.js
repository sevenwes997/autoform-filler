// Verificar se já foi inicializado
if (window.autoFormFillerInitialized) {
  console.log('Auto Form Filler já inicializado');
} else {
  window.autoFormFillerInitialized = true;
  console.log('Auto Form Filler inicializado');
}

class FormDetector {
  constructor() {
    this.formFields = [];
  }

  detectFormFields() {
    // Array para armazenar seletores alternativos
    const selectors = [
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"])',
      'textarea',
      'select',
      '[role="textbox"]',
      '[role="combobox"]',
      '[contenteditable="true"]'
    ];
    
    const inputs = document.querySelectorAll(selectors.join(','));
    this.formFields = [];

    inputs.forEach((input, index) => {
      const field = {
        element: input,
        index: index,
        type: this.getFieldType(input),
        name: this.getFieldName(input),
        placeholder: input.placeholder || input.getAttribute('aria-placeholder') || '',
        label: this.findLabel(input),
        ariaLabel: input.getAttribute('aria-label') || '',
        required: input.required || input.getAttribute('aria-required') === 'true' || false,
        value: input.value || input.textContent || ''
      };
      
      this.formFields.push(field);
    });

    console.log('Campos detectados:', this.formFields.length, this.formFields);
    return this.formFields;
  }

  getFieldType(input) {
    if (input.tagName === 'SELECT') return 'select-one';
    if (input.tagName === 'TEXTAREA') return 'textarea';
    if (input.getAttribute('role') === 'textbox') return 'text';
    if (input.getAttribute('role') === 'combobox') return 'select-one';
    if (input.getAttribute('contenteditable') === 'true') return 'textarea';
    return input.type || 'text';
  }

  getFieldName(input) {
    return input.name || 
           input.id || 
           input.getAttribute('data-field') || 
           input.getAttribute('data-testid') || 
           input.getAttribute('aria-labelledby') || 
           '';
  }

  findLabel(input) {
    // Método 1: Label com for
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) return label.textContent.trim();
    }

    // Método 2: Label pai direto
    const parentLabel = input.closest('label');
    if (parentLabel) {
      const text = parentLabel.textContent.trim();
      // Remover o próprio texto do input se estiver dentro do label
      return text.replace(input.value || '', '').trim();
    }

    // Método 3: Label irmão anterior
    let sibling = input.previousElementSibling;
    while (sibling) {
      if (sibling.tagName === 'LABEL') return sibling.textContent.trim();
      sibling = sibling.previousElementSibling;
    }

    // Método 4: Placeholder ou aria-label
    if (input.placeholder) return input.placeholder;
    if (input.getAttribute('aria-label')) return input.getAttribute('aria-label');

    // Método 5: Buscar em containers
    const container = input.closest('div, fieldset, .form-group, .field');
    if (container) {
      const labelInContainer = container.querySelector('label, .label, .field-label, span');
      if (labelInContainer) return labelInContainer.textContent.trim();
    }

    return '';
  }

  getFormContext() {
    const fields = this.detectFormFields();
    return fields.map(field => ({
      index: field.index,
      type: field.type,
      name: field.name,
      label: field.label || field.placeholder || field.ariaLabel,
      placeholder: field.placeholder,
      required: field.required,
      currentValue: field.value
    }));
  }
}

// Função melhorada para preencher campo
function fillField(fieldInfo, value) {
  if (!fieldInfo || !fieldInfo.element || !value) return false;
  
  const { element, type } = fieldInfo;
  
  try {
    // Focar no elemento
    element.focus();
    
    if (element.tagName === 'SELECT') {
      // Para selects tradicionais
      const option = Array.from(element.options).find(opt => 
        opt.text.toLowerCase().includes(value.toLowerCase()) ||
        opt.value.toLowerCase().includes(value.toLowerCase())
      );
      if (option) {
        element.value = option.value;
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else if (element.getAttribute('role') === 'combobox') {
      // Para comboboxes customizados (comum em React/Angular)
      element.click();
      
      setTimeout(() => {
        const options = document.querySelectorAll('[role="option"], .option, .item');
        const matchingOption = Array.from(options).find(opt => 
          opt.textContent.toLowerCase().includes(value.toLowerCase())
        );
        if (matchingOption) {
          matchingOption.click();
        }
      }, 500);
      
      return true;
    } else if (element.getAttribute('contenteditable') === 'true') {
      // Para divs editáveis
      element.textContent = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (type === 'checkbox' || type === 'radio') {
      // Para checkboxes e radios
      if (value === 'true' || value === 'yes' || value === true || value === 'sim') {
        element.checked = true;
      } else if (value === 'false' || value === 'no' || value === false || value === 'não') {
        element.checked = false;
      }
    } else if (type === 'date') {
      // Para campos de data
      element.value = value;
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (type === 'file') {
      // Arquivos não podem ser preenchidos automaticamente
      console.log('Campo de arquivo não pode ser preenchido:', fieldInfo.label);
      return false;
    } else {
      // Para inputs de texto, email, tel, etc.
      
      // Limpar primeiro se já tiver valor
      if (element.value) {
        element.value = '';
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      // Inserir novo valor
      element.value = value;
    }
    
    // Disparar todos os eventos possíveis
    const events = ['input', 'change', 'blur', 'keyup', 'keydown'];
    events.forEach(eventType => {
      element.dispatchEvent(new Event(eventType, { bubbles: true }));
    });
    
    // Para frameworks reativos, também disparar evento composto
    element.dispatchEvent(new CompositionEvent('compositionend', {
      data: value,
      bubbles: true
    }));
    
    element.blur();
    
    return true;
  } catch (error) {
    console.error('Erro ao preencher campo:', error, fieldInfo);
    return false;
  }
}

// Ouvir mensagens do popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Mensagem recebida:', request);
  
  try {
    if (request.action === 'analyzeForm') {
      const detector = new FormDetector();
      const formContext = detector.getFormContext();
      
      console.log('Formulário analisado:', formContext);
      
      chrome.runtime.sendMessage({
        action: 'formAnalyzed',
        fields: formContext
      });
      
      sendResponse({ success: true, fieldsCount: formContext.length });
      
    } else if (request.action === 'fillForm') {
      chrome.runtime.sendMessage({ action: 'getFieldsToFill' }, (response) => {
        if (response && response.fields) {
          const detector = new FormDetector();
          const formFields = detector.detectFormFields();
          
          let filledCount = 0;
          response.fields.forEach(({ fieldIndex, value }) => {
            // Buscar campo pelo índice ou pelo label
            const field = formFields.find(f => f.index === fieldIndex) || 
                         formFields.find(f => 
                           (f.label || '').toLowerCase().includes(value.toLowerCase()) ||
                           (f.name || '').toLowerCase().includes(value.toLowerCase())
                         );
            
            if (field && value) {
              if (fillField(field, value)) {
                filledCount++;
              }
            }
          });
          
          sendResponse({ success: true, filledCount });
        } else {
          sendResponse({ success: false, error: 'Dados não encontrados' });
        }
      });
      return true;
      
    } else if (request.action === 'analyzeAndFill') {
      const detector = new FormDetector();
      const formContext = detector.getFormContext();
      
      chrome.runtime.sendMessage({
        action: 'analyzeAndFill',
        fields: formContext
      }, (response) => {
        if (response && response.filledFields) {
          const formFields = detector.detectFormFields();
          
          let filledCount = 0;
          response.filledFields.forEach(({ fieldIndex, value }) => {
            if (formFields[fieldIndex] && value) {
              if (fillField(formFields[fieldIndex], value)) {
                filledCount++;
              }
            }
          });
          
          sendResponse({ success: true, filledCount });
        } else if (response && response.error) {
          sendResponse({ success: false, error: response.error });
        } else {
          sendResponse({ success: false, error: 'Resposta inválida' });
        }
      });
      return true;
    }
  } catch (error) {
    console.error('Erro no content script:', error);
    sendResponse({ success: false, error: error.message });
  }
  
  return true;
});