/**
 * Cardif Pilot 伺服器進入點
 * 開發模式：掛載 Vite 中介層；正式模式：提供 dist 靜態檔案。
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import { createApp } from './src/server/app';
import { createGeminiAssistant, getConfiguredModel, hasGeminiKey } from './src/server/geminiService';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

const partnerKeys = (process.env.PARTNER_API_KEYS ?? (isProduction ? '' : 'demo-partner-key'))
  .split(',')
  .map((k) => k.trim())
  .filter(Boolean);

const app = createApp({
  llm: createGeminiAssistant(),
  partnerKeys,
  adminKey: process.env.ADMIN_KEY || (isProduction ? undefined : 'demo-admin-key'),
  rateLimitPerMinute: Number(process.env.RATE_LIMIT_PER_MINUTE) || 30,
});

async function start() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.resolve(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cardif Pilot running at http://localhost:${PORT}`);
    console.log(hasGeminiKey() ? `Gemini: enabled (${getConfiguredModel()})` : 'Gemini: disabled — using knowledge-base retrieval only');
  });
}

start();
