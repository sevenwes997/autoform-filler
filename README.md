# 🤖 AutoForm Filler

Extensão para Chrome que preenche formulários de candidatura de emprego automaticamente, usando IA (DeepSeek) e um sistema de fallback por palavras-chave.

## 📋 Índice

- [Sobre o projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Como funciona](#como-funciona)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Instalação (modo desenvolvedor)](#instalação-modo-desenvolvedor)
- [Configuração](#configuração)
- [Como usar](#como-usar)
- [Permissões utilizadas](#permissões-utilizadas)
- [Sites compatíveis](#sites-compatíveis)
- [Privacidade e segurança](#privacidade-e-segurança)
- [Tecnologias](#tecnologias)
- [Roadmap](#roadmap)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

## Sobre o projeto

Preencher formulários de candidatura repetidas vezes (nome, e-mail, endereço, experiência profissional...) é uma das partes mais cansativas de procurar emprego. O **AutoForm Filler** resolve isso identificando os campos de um formulário na página e preenchendo automaticamente com os dados que você já cadastrou, usando IA para interpretar campos com nomes pouco óbvios.

## ✨ Funcionalidades

- 🔍 Detecta campos de formulários automaticamente na página
- ✍️ Preenche dados pessoais, contato, endereço e informações profissionais
- 🧠 Usa IA (DeepSeek) para interpretar campos ambíguos ou com nomenclatura incomum
- 🛡️ Fallback offline por mapeamento de palavras-chave (funciona mesmo sem API configurada)
- 💾 Armazena seus dados localmente, no seu navegador
- 🌐 Compatível com plataformas populares de recrutamento: Gupy, Oracle HCM, Comeet, Greenhouse, PinPeople e outras

## 🧠 Como funciona

1. O **content script** (`content/content.js`) é injetado em todas as páginas (`<all_urls>`) e varre o DOM em busca de campos de formulário (inputs, selects, textareas).
2. Cada campo encontrado é comparado com um dicionário de palavras-chave (nome, e-mail, telefone, cidade, cargo, etc.).
3. Quando o campo não é reconhecido pelo mapeamento direto, o **background script** (`background/background.js`) envia o contexto do campo para a API do DeepSeek, que sugere qual dado deve preenchê-lo.
4. Os dados vêm do armazenamento local do navegador (`chrome.storage`), configurados previamente pelo usuário no **popup** da extensão.
5. Os campos identificados são preenchidos automaticamente na página.

## 📦 Estrutura do projeto

```
autoform-filler/
├── manifest.json          # Configuração da extensão (Manifest V3)
├── popup/
│   ├── popup.html         # Interface do popup (clique no ícone da extensão)
│   ├── popup.css          # Estilos do popup
│   └── popup.js           # Lógica do popup (salvar/editar dados do usuário)
├── content/
│   └── content.js         # Roda dentro das páginas: detecta e preenche campos
├── background/
│   └── background.js      # Service worker: chamadas à API do DeepSeek
├── utils/                 # Funções auxiliares compartilhadas
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 🚀 Instalação (modo desenvolvedor)

Como a extensão ainda não está publicada na Chrome Web Store, ela precisa ser carregada manualmente:

1. Clone o repositório:
   ```
   git clone https://github.com/sevenwes997/autoform-filler.git
   ```
2. Abra o Chrome e acesse `chrome://extensions`
3. Ative o **Modo do desenvolvedor** (canto superior direito)
4. Clique em **Carregar sem compactação** (Load unpacked)
5. Selecione a pasta `autoform-filler` que você acabou de clonar
6. A extensão vai aparecer na barra de ferramentas do Chrome

## ⚙️ Configuração

Para usar o preenchimento por IA, você precisa de uma chave de API do DeepSeek:

1. Crie uma conta em [platform.deepseek.com](https://platform.deepseek.com)
2. Gere uma API Key
3. Clique no ícone da extensão no Chrome, abra as configurações e cole sua chave

> Sem uma chave configurada, a extensão continua funcionando normalmente através do fallback por palavras-chave — só não terá o reconhecimento inteligente de campos ambíguos.

## 🖱️ Como usar

1. Clique no ícone da extensão e preencha seus dados uma única vez (nome, e-mail, telefone, endereço, experiência, etc.)
2. Acesse qualquer formulário de candidatura de emprego
3. Clique em **Preencher formulário** no popup da extensão
4. Revise os campos preenchidos antes de enviar a candidatura

## 🔐 Permissões utilizadas

| Permissão | Por que é necessária |
|---|---|
| `activeTab` | Acessar a aba atual apenas quando você aciona a extensão |
| `storage` | Salvar seus dados de candidatura localmente no navegador |
| `scripting` | Injetar o script que localiza e preenche os campos do formulário |
| `host_permissions` (`api.deepseek.com`) | Enviar o contexto de campos ambíguos para a API do DeepSeek |

## 🌐 Sites compatíveis

Testado e compatível com formulários de:
- Gupy
- Oracle HCM
- Comeet
- Greenhouse
- PinPeople

> A extensão também tenta preencher formulários de outras plataformas através da detecção genérica de campos, mas a taxa de sucesso pode variar.

## 🔒 Privacidade e segurança

- Todos os dados pessoais ficam armazenados **localmente**, no `chrome.storage` do seu navegador — nada é enviado para servidores próprios do projeto.
- Apenas o **texto/contexto do campo do formulário** (não seus dados pessoais completos) é enviado à API do DeepSeek quando o fallback por palavras-chave não reconhece o campo.
- Recomenda-se nunca commitar sua API Key no repositório. Guarde-a apenas no armazenamento local da extensão.

## 🛠️ Tecnologias

- JavaScript (Vanilla)
- Chrome Extension Manifest V3
- API DeepSeek (IA)
- Chrome Storage API

## 🗺️ Roadmap

- [ ] Publicar na Chrome Web Store
- [ ] Suporte a mais plataformas de recrutamento
- [ ] Interface de configuração mais completa no popup
- [ ] Testes automatizados

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Envie para o seu fork (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Defina aqui a licença do projeto (ex: MIT, GPL-3.0). Se ainda não escolheu uma, o [choosealicense.com](https://choosealicense.com) ajuda a decidir.
