# 🤖 AutoForm Filler

Extensão para Chrome que preenche formulários de candidatura de emprego automaticamente, usando IA (DeepSeek) e um sistema de fallback por palavras-chave.

## ✨ Funcionalidades

- 🔍 Detecta campos de formulários automaticamente
- ✍️ Preenche dados pessoais, contato, endereço e informações profissionais
- 🧠 Usa IA (DeepSeek) para interpretar campos ambíguos
- 🛡️ Fallback offline por palavras-chave (funciona sem API)
- 💾 Armazena dados localmente com segurança
- 🌐 Compatível com Gupy, Oracle HCM, Comeet, Greenhouse, PinPeople e outros

## 📦 Estrutura do Projeto

autoform-filler/
├── manifest.json
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── content/
│   └── content.js
├── background/
│   └── background.js
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png

## 🚀 Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/SEU-USUARIO/autoform-filler.git