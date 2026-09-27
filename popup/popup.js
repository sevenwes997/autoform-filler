document.addEventListener('DOMContentLoaded', () => {
  // Carregar dados salvos
  chrome.storage.local.get(['apiKey', 'userData'], (result) => {
    if (result.apiKey) {
      document.getElementById('apiKey').value = result.apiKey;
    }
    if (result.userData) {
      document.getElementById('userData').value = JSON.stringify(result.userData, null, 2);
    }
  });

  // Salvar API Key
  document.getElementById('saveApiKey').addEventListener('click', () => {
    const apiKey = document.getElementById('apiKey').value.trim();
    if (!apiKey) {
      showStatus('Por favor, insira uma API Key', 'error');
      return;
    }
    chrome.storage.local.set({ apiKey }, () => {
      showStatus('API Key salva com sucesso!', 'success');
    });
  });

  // Salvar dados do usuário
  document.getElementById('saveData').addEventListener('click', () => {
    try {
      const rawData = document.getElementById('userData').value.trim();
      const userData = JSON.parse(rawData);
      
      if (typeof userData !== 'object' || Array.isArray(userData)) {
        throw new Error('Dados devem ser um objeto JSON');
      }
      
      chrome.storage.local.set({ userData }, () => {
        showStatus('Dados salvos com sucesso!', 'success');
      });
    } catch (e) {
      showStatus('Erro: JSON inválido! ' + e.message, 'error');
    }
  });

  // Carregar exemplo
  document.getElementById('loadSample').addEventListener('click', () => {
    const sampleData = {
      "nome": "",
      "email": "",
      "telefone": "",
      "endereco": "",
      "experiencia": "",
      "habilidades": [""],
      "formacao": "",
      "linkedin": "",
      "objetivo": "",
      "disponibilidade": ""
    };
    document.getElementById('userData').value = JSON.stringify(sampleData, null, 2);
  });

  // Analisar formulário
  document.getElementById('analyzeForm').addEventListener('click', async () => {
    await sendMessageToTab({ action: 'analyzeForm' });
  });

  // Preencher formulário
  document.getElementById('fillForm').addEventListener('click', async () => {
    await sendMessageToTab({ action: 'fillForm' });
  });

  // Analisar e preencher
  document.getElementById('analyzeAndFill').addEventListener('click', async () => {
    await sendMessageToTab({ action: 'analyzeAndFill' });
  });
});

// Função para enviar mensagem com verificação
async function sendMessageToTab(message) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      showStatus('Nenhuma aba ativa encontrada', 'error');
      return;
    }

    // Verificar se a URL é válida (não é chrome:// ou about:)
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('about:') || tab.url.startsWith('edge://')) {
      showStatus('Extensão não funciona em páginas do sistema', 'error');
      return;
    }

    // Enviar mensagem com timeout
    const response = await chrome.tabs.sendMessage(tab.id, message);
    console.log('Resposta:', response);
    
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    
    if (error.message.includes('Could not establish connection')) {
      showStatus('Recarregue a página e tente novamente', 'error');
      
      // Tentar reinjetar o content script
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content/content.js']
        });
        showStatus('Script recarregado. Tente novamente.', 'warning');
      } catch (injectError) {
        showStatus('Erro: Recarregue a página manualmente', 'error');
      }
    } else {
      showStatus('Erro: ' + error.message, 'error');
    }
  }
}

function showStatus(message, type) {
  const status = document.getElementById('status');
  if (!status) return;
  
  status.textContent = message;
  status.className = type;
  
  setTimeout(() => {
    status.textContent = '';
    status.className = '';
  }, 4000);
}
