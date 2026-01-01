# 🌳 長青幸福農場 (Evergreen Happiness Farm)

這是一個結合 **LINE LIFF** 與 **遊戲化 (Gamification)** 的健康習慣養成應用程式。使用者透過完成每日的「喝水」與「抬腿」任務來培育虛擬作物，並支援每日定時推播提醒功能。

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![Nuxt](https://img.shields.io/badge/Nuxt-3.x-green.svg)
![Supabase](https://img.shields.io/badge/Supabase-Database-emerald.svg)
![Vercel](https://img.shields.io/badge/Vercel-Deployment-black.svg)

## ✨ 功能特色

* **LINE Login 整合**：透過 LIFF (LINE Front-end Framework) 自動取得使用者身分。
* **養成遊戲系統**：
    * 累積貢獻值（喝水/抬腿）讓作物成長（種子 -> 發芽 -> 開花 -> 收成）。
    * 隨機解鎖新作物（包含植物與動物，如蘋果、木瓜、雞...）。
    * 圖鑑系統：查看已收集的作物。
* **互動式 UI**：
    * 動態視覺回饋（水滴落下 💧、愛心飄升 ❤️、掃把掃除 🧹）。
    * 即時進度條與動畫。
* **個人化設定**：
    * 自訂每日目標（例如：喝水 2500cc、抬腿 5 組）。
    * 自訂每日提醒時間（如 09:00, 15:00）。
* **安全性架構**：
    * 前後端分離：前端透過 Nuxt Server API 存取資料庫。
    * Supabase RLS (Row Level Security) 保護資料。
* **自動化排程**：
    * 整合 Vercel Cron Jobs，定時檢查並發送 LINE 推播提醒。

## 🛠️ 技術堆疊

* **Frontend**: [Nuxt 3](https://nuxt.com/), Vue 3, Tailwind CSS
* **Backend**: Nuxt Server Routes (Nitro)
* **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
* **Platform**: [LINE Developers](https://developers.line.biz/) (LIFF & Messaging API)
* **Deployment**: [Vercel](https://vercel.com/)


