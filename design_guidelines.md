# Brand Identity Guidelines: Project Muhafiz-X
**Version:** 1.0 (May 2026)  
**Status:** Deployment-Ready  
**Theme:** Sovereign Digital Pakistan (Tactical Emerald)

---

## 1. Brand Philosophy
Muhafiz-X is not just a dashboard; it is a **Sovereign Intelligence Layer**. 
* **Mission:** To protect life and economy through proactive, agentic urban governance.
* **Voice:** Authoritative, calm, decisive, and transparent.
* **Target Audience:** Provincial Ministers, City Mayors, Crisis First-Responders, and the Citizens of Pakistan.

---

## 2. Visual Identity

### 2.1 Core Color Palette
The palette uses a **Digital Crescent** theme: extremely dark backgrounds for high-stakes focus, with a modernized Pakistani Emerald as the primary "Action" color.

| Use Case | Name | Hex Code | Tailwind Class |
| :--- | :--- | :--- | :--- |
| **Primary Background** | Night-Ops Black | `#09090b` | `bg-zinc-950` |
| **Surface/Card** | Tactical Gray | `#18181b` | `bg-zinc-900` |
| **Primary Accent** | Sovereign Green | `#10b981` | `text-emerald-500` |
| **Agentic Purple** | Intelligence Violet | `#818cf8` | `text-indigo-400` |
| **Critical Alert** | Crisis Red | `#ef4444` | `text-red-500` |
| **Warning/Verify** | Caution Amber | `#f59e0b` | `text-amber-500` |

### 2.2 Typography
* **UI/Primary Font:** `Inter` (Sans-serif). 
  * *Usage:* All headers, body text, and app navigation. Clean, high-legibility.
* **Data/Technical Font:** `JetBrains Mono`.
  * *Usage:* Antigravity Agent Trace logs, coordinate data, and sensor readouts. Gives a "System-Level" feel.

---

## 3. UI/UX Principles

### 3.1 The "Agentic Trace" Terminal
A mandatory feature for all Muhafiz-X interfaces is the **Live Trace**. Users must see the "thoughts" of the Agents to build trust in autonomous decisions.
* **Background:** 80% opacity blur (`backdrop-blur-md`).
* **Syntax Highlighting:** 
  * Timestamps in `Zinc-500`.
  * Agent names in `Indigo-400`.
  * Action outcomes in `Emerald-500` (Success) or `Red-500` (Failure).

### 3.2 Map Layering (Digital Twin)
* **Base:** Dark-mode vector map (Mapbox/Google Maps).
* **Overlay:** 3D glowing "Heat Polygons" representing floods or congestion.
* **Interaction:** Minimalist pins. Hovering over a pin reveals the "Validator Agent's" confidence score.

---

## 4. Technical Implementation Instructions

### 4.1 Tailwind CSS Configuration
Add this to your `tailwind.config.js` to lock in the brand colors:
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        muhafiz: {
          bg: '#09090b',
          surface: '#18181b',
          green: '#10b981',
          indigo: '#818cf8',
          red: '#ef4444',
          amber: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
}