# 🌱 AgroTrace — Agricultural Satellite Intelligence Platform

Plataforma web para **monitoramento agrícola via sensoriamento remoto**, utilizando **imagens de satélite multispectrais**, análise de solo e dados climáticos para gerar **insights agronômicos automatizados** para fazendas.

O sistema integra imagens orbitais, processamento espectral (ex: índices de vegetação) e dados meteorológicos para apoiar decisões como:

- Condições do solo para plantio
- Estresse hídrico
- Saúde da vegetação
- Planejamento de uso de defensivos
- Previsão de clima/chuvas

---

## 🚀 Visão geral do produto

O **DronaiDash** permite que produtores informem sua localização via mapa + CEP e recebam automaticamente análises baseadas em:

- 🛰️ Imagens de satélite multispectrais  
- 🌧️ Dados climáticos  
- 🧮 Processamento de índices agronômicos  
- 📊 Visualização via dashboard interativo  

---

## 🧠 Como funciona (fluxo do sistema)

### 1. Autenticação
- Login seguro
- Usuários armazenados via FireBase

### 2. Cadastro da propriedade
- Inserção do CEP
- Seleção da área no mapa (API de mapas)
- Definição do talhão/fazenda

### 3. Coleta de dados externos
- Imagens orbitais via API SentinelHub
- Dados climáticos (chuva, temperatura, previsão) via API Maps

### 4. Processamento
Aplicação de filtros/índices multispectrais:

Exemplos:
- NDVI (saúde da vegetação)
- NDWI (umidade)
- Análise de estresse hídrico
- Condições do solo

### 5. Entrega de insights
- Mapas temáticos
- Indicadores visuais
- Recomendações para o produtor
- Dashboard web interativo

---

## 🛠️ Stack tecnológica

### Frontend
- Next.js (App Router)
- TypeScript
- TailwindCSS

### Backend / Serviços
- Firebase (Auth + Database)
- APIs de satélite (Sentinel Hub)
- APIs climáticas (OpenWeather)
- APIs de mapas (Maps)

### Deploy
- Vercel

---

## 📦 Funcionalidades atuais

- [x] Autenticação de usuários
- [x] Landing page com cadastro da propriedade
- [x] Seleção de localização via mapa
- [x] Integração com imagens de satélite
- [x] Processamento espectral de imagens
- [x] Dashboard com visualização dos resultados
- [x] Banco de dados em nuvem

---

## 📁 Estrutura do projeto
app/            → rotas e páginas (Next.js)
components/     → componentes reutilizáveis
lib/            → integrações com APIs externas
hooks/          → hooks customizados
services/       → chamadas HTTP
public/         → assets estáticos
