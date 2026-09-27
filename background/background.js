// Configuração da API DeepSeek
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
let analyzedFields = [];

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'formAnalyzed') {
    analyzedFields = request.fields;
    sendResponse({ success: true });
  } else if (request.action === 'getFieldsToFill') {
    chrome.storage.local.get(['userData'], async (result) => {
      if (!result.userData) {
        sendResponse({ error: 'Dados do usuário não configurados' });
        return;
      }
      const fieldsToFill = prepareUniversalMapping(analyzedFields, result.userData);
      sendResponse({ fields: fieldsToFill });
    });
    return true;
  } else if (request.action === 'analyzeAndFill') {
    handleAnalyzeAndFill(request.fields, sender, sendResponse);
    return true;
  }
  return true;
});

// 🌍 MAPEAMENTO UNIVERSAL ATUALIZADO
function prepareUniversalMapping(fields, userData) {
  const filledFields = [];

  fields.forEach(field => {
    const ctx = `${field.name || ''} ${field.id || ''} ${field.label || ''} ${field.placeholder || ''}`.toLowerCase();
    let value = '';

    // --- NOME ---
    if (ctx.includes('fullname') || ctx.includes('full name') || ctx.includes('nome completo')) {
      value = userData.nome || '';
    }
    else if (ctx.includes('firstname') || ctx.includes('first name') || ctx.includes('legal first name')) {
      const parts = (userData.nome || '').split(' ');
      value = parts[0] || '';
    }
    else if (ctx.includes('lastname') || ctx.includes('last name') || ctx.includes('sobrenome')) {
      const parts = (userData.nome || '').split(' ');
      value = parts.slice(1).join(' ') || userData.sobrenome || '';
    }
    else if (ctx.includes('middlenames') || ctx.includes('middle name')) {
      value = userData.nomeMeio || '';
    }
    else if (ctx.includes('knownas') || ctx.includes('preferred name') || ctx.includes('apelido')) {
      value = userData.apelido || userData.nome?.split(' ')[0] || '';
    }

    // --- CONTATO ---
    else if (ctx.includes('email') || ctx.includes('e-mail')) {
      value = userData.email || '';
    }
    // Phone: captura tanto "phonenumber" quanto "phone" isolado, mas evita country code
    else if ((ctx.includes('phonenumber') || (ctx.includes('phone') && !ctx.includes('country') && !ctx.includes('code'))) ||
             ctx.includes('celular') || ctx.includes('telefone')) {
      value = userData.telefone || '';
    }
    else if (ctx.includes('country-codes-dropdown') || ctx.includes('codigo pais')) {
      value = '55'; // Brasil
    }

    // --- ENDEREÇO ---
    else if (ctx.includes('country') && ctx.includes('country-')) {
      value = 'Brasil';
    }
    else if (ctx.includes('addressline1') || (ctx.includes('address') && !ctx.includes('line2') && !ctx.includes('line3'))) {
      value = userData.endereco || '';
    }
    else if (ctx.includes('addressline2') || ctx.includes('número') || ctx.includes('numero')) {
      value = userData.numero || '';
    }
    else if (ctx.includes('addressline3') || ctx.includes('neighborhood') || ctx.includes('bairro')) {
      value = userData.bairro || '';
    }
    else if (ctx.includes('addladdressattribute3') || ctx.includes('address site')) {
      value = userData.complemento || '';
    }
    else if (ctx.includes('building') || ctx.includes('complemento') || ctx.includes('complement')) {
      value = userData.complemento || '';
    }
    else if (ctx.includes('postalcode') || ctx.includes('cep') || ctx.includes('zip')) {
      value = userData.cep || '';
    }
    else if (ctx.includes('city') || ctx.includes('cidade')) {
      value = userData.cidade || 'Salvador';
    }
    else if (ctx.includes('region2') || ctx.includes('state') || ctx.includes('uf')) {
      value = userData.estado || 'BA';
    }

    // --- PROFISSIONAL ---
    else if (ctx.includes('linkedin') || ctx.includes('sitelink-1')) {
      value = userData.linkedin || '';
    }
    else if (ctx.includes('websiteurl') || ctx.includes('personal website') || ctx.includes('portfolio')) {
      value = userData.website || userData.linkedin || ''; // usa LinkedIn se não tiver site pessoal
    }
    else if (ctx.includes('jobtitle') || ctx.includes('cargo') || ctx.includes('objetivo')) {
      value = userData.objetivo || '';
    }
    else if (ctx.includes('oda-work-summary') || ctx.includes('resumo') || ctx.includes('experiência') || ctx.includes('experiencia')) {
      value = userData.experiencia || '';
    }
    else if (ctx.includes('comment') || ctx.includes('personal note')) {
      value = userData.observacao || ''; // campo extra que você pode adicionar no popup
    }

    // --- CHECKBOXES DE CONSENTIMENTO ---
    else if (ctx.includes('agreetc') || ctx.includes('termos')) value = 'true';
    else if (ctx.includes('agreepp') || ctx.includes('privacidade')) value = 'true';
    else if (ctx.includes('gdpr') || ctx.includes('consent')) value = 'true'; // GDPR/Consentimento

    if (value) {
      filledFields.push({
        fieldIndex: field.index,
        value: value,
        label: field.label || field.name
      });
    }
  });

  console.log('Campos mapeados:', filledFields.length);
  return filledFields;
}

async function handleAnalyzeAndFill(fields, sender, sendResponse) {
  try {
    const result = await chrome.storage.local.get(['apiKey', 'userData']);
    if (!result.userData) {
      sendResponse({ error: 'Dados do usuário não configurados' });
      return;
    }
    if (result.apiKey) {
      try {
        const deepseekResponse = await callDeepSeekAPI(result.apiKey, result.userData, fields);
        const filledFields = processDeepSeekResponse(deepseekResponse, fields);
        if (filledFields.length > 0) {
          sendResponse({ filledFields });
          return;
        }
      } catch (e) { console.error('API falhou, usando fallback:', e); }
    }
    const filledFields = prepareUniversalMapping(fields, result.userData);
    sendResponse({ filledFields, usedFallback: true });
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

async function callDeepSeekAPI(apiKey, userData, fields) {
  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "Preencha formulários de emprego." },
        { role: "user", content: `Dados: ${JSON.stringify(userData)}\nCampos: ${JSON.stringify(fields)}\nRetorne JSON: {"fields":[{"index":0,"value":"..."}]}` }
      ],
      temperature: 0.3, max_tokens: 2000
    })
  });
  if (!response.ok) throw new Error(`Erro API: ${response.status}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

function processDeepSeekResponse(response) {
  try {
    const json = JSON.parse(response.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim());
    return json.fields.map(f => ({ fieldIndex: f.index, value: f.value }));
  } catch (e) { return []; }
}