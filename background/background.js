// Configuração da API DeepSeek
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

let analyzedFields = [];

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  // Recebe os campos analisados pelo content.js
  if (request.action === 'formAnalyzed') {

    analyzedFields = request.fields;

    sendResponse({ success: true });

  }

  // Retorna os campos que devem ser preenchidos
  else if (request.action === 'getFieldsToFill') {

    chrome.storage.local.get(['userData'], async (result) => {

      if (!result.userData) {
        sendResponse({
          error: 'Dados do usuário não configurados'
        });
        return;
      }

      const fieldsToFill = prepareUniversalMapping(
        analyzedFields,
        result.userData
      );

      sendResponse({
        fields: fieldsToFill
      });

    });

    return true;
  }

  // Analisa os campos utilizando IA
  else if (request.action === 'analyzeAndFill') {

    handleAnalyzeAndFill(
      request.fields,
      sender,
      sendResponse
    );

    return true;
  }

  return true;
});


/*
=========================================================
MAPEAMENTO LOCAL
=========================================================

Esta função utiliza os dados pessoais armazenados
LOCALMENTE na extensão.

IMPORTANTE:
userData NÃO é enviado para a DeepSeek.
*/


function prepareUniversalMapping(fields, userData) {

  const filledFields = [];

  fields.forEach(field => {

    const ctx = `
      ${field.name || ''}
      ${field.id || ''}
      ${field.label || ''}
      ${field.placeholder || ''}
    `.toLowerCase();

    let value = '';


    // =====================================================
    // NOME
    // =====================================================

    if (
      ctx.includes('fullname') ||
      ctx.includes('full name') ||
      ctx.includes('nome completo')
    ) {

      value = userData.nome || '';

    }

    else if (
      ctx.includes('firstname') ||
      ctx.includes('first name') ||
      ctx.includes('legal first name')
    ) {

      const parts = (userData.nome || '').split(' ');

      value = parts[0] || '';

    }

    else if (
      ctx.includes('lastname') ||
      ctx.includes('last name') ||
      ctx.includes('sobrenome')
    ) {

      const parts = (userData.nome || '').split(' ');

      value =
        parts.slice(1).join(' ') ||
        userData.sobrenome ||
        '';

    }

    else if (
      ctx.includes('middlenames') ||
      ctx.includes('middle name')
    ) {

      value = userData.nomeMeio || '';

    }

    else if (
      ctx.includes('knownas') ||
      ctx.includes('preferred name') ||
      ctx.includes('apelido')
    ) {

      value =
        userData.apelido ||
        userData.nome?.split(' ')[0] ||
        '';

    }


    // =====================================================
    // CONTATO
    // =====================================================

    else if (
      ctx.includes('email') ||
      ctx.includes('e-mail')
    ) {

      value = userData.email || '';

    }

    else if (
      ctx.includes('phonenumber') ||
      (
        ctx.includes('phone') &&
        !ctx.includes('country') &&
        !ctx.includes('code')
      ) ||
      ctx.includes('celular') ||
      ctx.includes('telefone')
    ) {

      value = userData.telefone || '';

    }

    else if (
      ctx.includes('country-codes-dropdown') ||
      ctx.includes('codigo pais')
    ) {

      value = '55';

    }


    // =====================================================
    // ENDEREÇO
    // =====================================================

    else if (
      ctx.includes('country') &&
      ctx.includes('country-')
    ) {

      value = 'Brasil';

    }

    else if (
      ctx.includes('addressline1') ||
      (
        ctx.includes('address') &&
        !ctx.includes('line2') &&
        !ctx.includes('line3')
      )
    ) {

      value = userData.endereco || '';

    }

    else if (
      ctx.includes('addressline2') ||
      ctx.includes('número') ||
      ctx.includes('numero')
    ) {

      value = userData.numero || '';

    }

    else if (
      ctx.includes('addressline3') ||
      ctx.includes('neighborhood') ||
      ctx.includes('bairro')
    ) {

      value = userData.bairro || '';

    }

    else if (
      ctx.includes('addladdressattribute3') ||
      ctx.includes('address site')
    ) {

      value = userData.complemento || '';

    }

    else if (
      ctx.includes('building') ||
      ctx.includes('complemento') ||
      ctx.includes('complement')
    ) {

      value = userData.complemento || '';

    }

    else if (
      ctx.includes('postalcode') ||
      ctx.includes('cep') ||
      ctx.includes('zip')
    ) {

      value = userData.cep || '';

    }

    else if (
      ctx.includes('city') ||
      ctx.includes('cidade')
    ) {

      value = userData.cidade || 'Salvador';

    }

    else if (
      ctx.includes('region2') ||
      ctx.includes('state') ||
      ctx.includes('uf')
    ) {

      value = userData.estado || 'BA';

    }


    // =====================================================
    // PROFISSIONAL
    // =====================================================

    else if (
      ctx.includes('linkedin') ||
      ctx.includes('sitelink-1')
    ) {

      value = userData.linkedin || '';

    }

    else if (
      ctx.includes('websiteurl') ||
      ctx.includes('personal website') ||
      ctx.includes('portfolio')
    ) {

      value =
        userData.website ||
        userData.linkedin ||
        '';

    }

    else if (
      ctx.includes('jobtitle') ||
      ctx.includes('cargo') ||
      ctx.includes('objetivo')
    ) {

      value = userData.objetivo || '';

    }

    else if (
      ctx.includes('oda-work-summary') ||
      ctx.includes('resumo') ||
      ctx.includes('experiência') ||
      ctx.includes('experiencia')
    ) {

      value = userData.experiencia || '';

    }

    else if (
      ctx.includes('comment') ||
      ctx.includes('personal note')
    ) {

      value = userData.observacao || '';

    }


    // =====================================================
    // CHECKBOXES DE CONSENTIMENTO
    // =====================================================

    else if (
      ctx.includes('agreetc') ||
      ctx.includes('termos')
    ) {

      value = 'true';

    }

    else if (
      ctx.includes('agreepp') ||
      ctx.includes('privacidade')
    ) {

      value = 'true';

    }

    else if (
      ctx.includes('gdpr') ||
      ctx.includes('consent')
    ) {

      value = 'true';

    }


    // =====================================================
    // ADICIONA AO RESULTADO
    // =====================================================

    if (value) {

      filledFields.push({

        fieldIndex: field.index,

        value: value,

        label:
          field.label ||
          field.name ||
          ''

      });

    }

  });

  console.log(
    'Campos mapeados localmente:',
    filledFields.length
  );

  return filledFields;
}


/*
=========================================================
ANÁLISE E PREENCHIMENTO
=========================================================
*/

async function handleAnalyzeAndFill(
  fields,
  sender,
  sendResponse
) {

  try {

    // Recupera os dados SOMENTE localmente
    const result = await chrome.storage.local.get([
      'apiKey',
      'userData'
    ]);


    if (!result.userData) {

      sendResponse({
        error: 'Dados do usuário não configurados'
      });

      return;
    }


    /*
    =====================================================
    IA
    =====================================================

    A DeepSeek recebe apenas a estrutura dos campos.

    NÃO recebe:
    - nome
    - email
    - telefone
    - endereço
    - currículo
    - LinkedIn
    - valores preenchidos nos campos
    */

    if (result.apiKey) {

      try {

        const deepseekResponse =
          await callDeepSeekAPI(
            result.apiKey,
            fields
          );


        /*
        A IA apenas identifica o tipo de cada campo.
        */

        const aiFieldTypes =
          processDeepSeekResponse(
            deepseekResponse
          );


        /*
        Os dados pessoais são combinados
        LOCALMENTE com os tipos identificados pela IA.
        */

        const filledFields =
          applyAIFieldTypes(
            aiFieldTypes,
            fields,
            result.userData
          );


        if (filledFields.length > 0) {

          sendResponse({
            filledFields
          });

          return;
        }

      }

      catch (e) {

        console.error(
          'API falhou, usando fallback:',
          e
        );

      }

    }


    /*
    =====================================================
    FALLBACK
    =====================================================

    Se a IA falhar, utiliza o mapeamento local
    que já existia no projeto.
    */

    const filledFields =
      prepareUniversalMapping(
        fields,
        result.userData
      );


    sendResponse({
      filledFields,
      usedFallback: true
    });

  }

  catch (error) {

    sendResponse({
      error: error.message
    });

  }

}


/*
=========================================================
ENVIO PARA DEEPSEEK
=========================================================

ATENÇÃO:

Esta função NÃO recebe userData.

Também removemos os valores atuais dos campos.

A IA recebe somente informações estruturais.
*/

async function callDeepSeekAPI(
  apiKey,
  fields
) {


  /*
  =======================================================
  SANITIZAÇÃO

  Pegamos somente propriedades que descrevem
  o campo.

  O valor atual do campo NÃO é enviado.
  =======================================================
  */

  const safeFields = fields.map(field => ({

    index: field.index,

    name: field.name || '',

    id: field.id || '',

    label: field.label || '',

    placeholder: field.placeholder || '',

    type: field.type || ''

  }));


  const response = await fetch(
    DEEPSEEK_API_URL,
    {

      method: 'POST',

      headers: {

        'Content-Type':
          'application/json',

        'Authorization':
          `Bearer ${apiKey}`

      },

      body: JSON.stringify({

        model: 'deepseek-chat',

        messages: [

          {
            role: 'system',

            content:
              `
Você é um classificador de campos de formulários
de emprego.

Sua função é SOMENTE identificar qual tipo de
informação cada campo solicita.

NÃO receba, solicite ou tente inferir dados pessoais.

Tipos permitidos:

nome
sobrenome
email
telefone
endereco
numero
bairro
complemento
cep
cidade
estado
linkedin
website
objetivo
experiencia
observacao
consentimento
desconhecido

Retorne SOMENTE JSON válido no formato:

{
  "fields": [
    {
      "index": 0,
      "type": "nome"
    }
  ]
}
`
          },

          {
            role: 'user',

            content:
              `
Analise somente a estrutura destes campos:

${JSON.stringify(safeFields)}

Identifique o tipo de informação solicitado
por cada campo.

Não forneça valores pessoais.

Retorne somente JSON válido.
`
          }

        ],

        temperature: 0.1,

        max_tokens: 2000

      })

    }
  );


  if (!response.ok) {

    throw new Error(
      `Erro API: ${response.status}`
    );

  }


  const data =
    await response.json();


  if (
    !data.choices ||
    !data.choices[0] ||
    !data.choices[0].message
  ) {

    throw new Error(
      'Resposta inválida da API'
    );

  }


  return data
    .choices[0]
    .message
    .content;

}


/*
=========================================================
PROCESSA RESPOSTA DA IA
=========================================================
*/

function processDeepSeekResponse(
  response
) {

  try {

    /*
    Remove possíveis blocos Markdown
    */

    const cleanedResponse =
      response
        .replace(/```json\n?/gi, '')
        .replace(/```\n?/g, '')
        .trim();


    const json =
      JSON.parse(cleanedResponse);


    if (
      !json.fields ||
      !Array.isArray(json.fields)
    ) {

      return [];

    }


    return json.fields
      .map(field => ({

        index: field.index,

        type:
          String(field.type || '')
            .toLowerCase()
            .trim()

      }))
      .filter(field =>
        Number.isInteger(field.index) &&
        field.type
      );

  }

  catch (e) {

    console.error(
      'Erro ao processar resposta da IA:',
      e
    );

    return [];

  }

}


/*
=========================================================
APLICA O RESULTADO DA IA LOCALMENTE
=========================================================

Aqui acontece a parte importante:

A DeepSeek diz:

campo 0 = nome
campo 1 = email
campo 2 = telefone

E SOMENTE A EXTENSÃO localmente consulta:

userData.nome
userData.email
userData.telefone

A DeepSeek nunca recebe esses valores.
*/

function applyAIFieldTypes(
  aiFields,
  fields,
  userData
) {

  const filledFields = [];


  aiFields.forEach(aiField => {

    const originalField =
      fields.find(
        field =>
          field.index === aiField.index
      );


    if (!originalField) {
      return;
    }


    const value =
      getLocalValueByType(
        aiField.type,
        userData
      );


    if (value) {

      filledFields.push({

        fieldIndex:
          originalField.index,

        value: value,

        label:
          originalField.label ||
          originalField.name ||
          ''

      });

    }

  });


  console.log(
    'Campos preenchidos usando classificação da IA:',
    filledFields.length
  );


  return filledFields;
}


/*
=========================================================
CONVERTE O TIPO IDENTIFICADO PELA IA
EM UM DADO LOCAL
=========================================================
*/

function getLocalValueByType(
  type,
  userData
) {

  switch (type) {

    case 'nome':
      return userData.nome || '';


    case 'sobrenome': {

      const parts =
        (userData.nome || '')
          .trim()
          .split(/\s+/);

      return (
        parts.slice(1).join(' ') ||
        userData.sobrenome ||
        ''
      );

    }


    case 'email':
      return userData.email || '';


    case 'telefone':
      return userData.telefone || '';


    case 'endereco':
      return userData.endereco || '';


    case 'numero':
      return userData.numero || '';


    case 'bairro':
      return userData.bairro || '';


    case 'complemento':
      return userData.complemento || '';


    case 'cep':
      return userData.cep || '';


    case 'cidade':
      return userData.cidade || '';


    case 'estado':
      return userData.estado || '';


    case 'linkedin':
      return userData.linkedin || '';


    case 'website':
      return (
        userData.website ||
        userData.linkedin ||
        ''
      );


    case 'objetivo':
      return userData.objetivo || '';


    case 'experiencia':
      return userData.experiencia || '';


    case 'observacao':
      return userData.observacao || '';


    case 'consentimento':
      return 'true';


    default:
      return '';

  }

}
