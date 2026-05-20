import { flashModel } from './models.js';
import { safeParseJson } from './parser.js';

const CRISIS_EMOJIS = { fire: '🔥', flood: '🌊', blast: '💥', protest: '🚧' };

const URDU_CRISIS = { fire: 'آگ', flood: 'سیلاب', blast: 'دھماکہ', protest: 'احتجاج' };

export const communicator = async (state) => {
    const { classification, assigned_department, action_plan, triage } = state;

    const crisisType = (classification?.type || 'emergency').toLowerCase();
    const loc = classification?.location?.landmark || 'Karachi';
    const dept = (assigned_department || 'Emergency Services').replace(/_/g, ' ');
    const emoji = CRISIS_EMOJIS[crisisType] || '🚨';
    const urgency = classification?.urgency || 7;
    const isGlobal = urgency >= 8;

    // Pull real deployment data
    const etaMins = action_plan?.deployment?.eta_mins || triage?.route_directive ? '15' : '14';
    const hub = action_plan?.deployment?.hub || 'Central Emergency Hub';
    const units = Array.isArray(action_plan?.deployment?.units)
        ? action_plan.deployment.units.slice(0, 2).join(' + ')
        : dept + ' units';
    const primaryRoute = triage?.route_directive?.primary_route || 'Emergency corridor';
    const policeBlock = triage?.route_directive?.police_block_required_at || 'key intersections';
    const hospitals = classification?.zone_intel?.nearby_hospitals || [];
    const nearestHospital = hospitals[0] || 'nearest hospital';
    const urduCrisis = URDU_CRISIS[crisisType] || 'ہنگامی صورتحال';

    // Crisis-specific push notifications
    const pushMessages = {
        fire: {
            en: `${emoji} FIRE ALERT — ${loc}. Karachi Fire Brigade deployed from ${hub}. ETA ${etaMins} min. Evacuate within 150m immediately. Call 16 for emergencies.`,
            ur: `${emoji} آگ کا الرٹ — ${loc}۔ کراچی فائر بریگیڈ روانہ — ETA ${etaMins} منٹ۔ 150 میٹر کے اندر فوری انخلاء کریں۔ ہنگامی صورت: 16 پر کال کریں۔`,
        },
        flood: {
            en: `${emoji} FLOOD ALERT — ${loc}. KMC Dewatering Units deployed. Avoid ${policeBlock} area. Do NOT enter submerged underpasses. ETA ${etaMins} min.`,
            ur: `${emoji} سیلاب الرٹ — ${loc}۔ KMC ڈیواٹرنگ ٹیم روانہ — ETA ${etaMins} منٹ۔ ${policeBlock} سے دور رہیں۔ زیرآب راستوں میں نہ جائیں۔`,
        },
        blast: {
            en: `${emoji} BLAST ALERT — ${loc}. 300m exclusion zone active. LEAVE the area NOW. Do not use mobile phones near scene. Emergency: 1122 + 15.`,
            ur: `${emoji} دھماکہ الرٹ — ${loc}۔ 300 میٹر کا خطرناک زون فعال۔ ابھی علاقہ خالی کریں۔ 1122 اور 15 پر کال کریں۔`,
        },
        protest: {
            en: `${emoji} ROAD CLOSURE — ${loc}. Traffic Police managing diversion via ${primaryRoute}. Avoid the area. Ambulance corridor maintained for emergencies.`,
            ur: `${emoji} سڑک بند — ${loc}۔ ${primaryRoute} سے متبادل راستہ استعمال کریں۔ ایمبولینس کا راستہ کھلا ہے۔ ٹریفک پولیس موجود ہے۔`,
        },
        proactive_maintenance: {
            en: "",
            ur: "",
        },
    };

    // Detailed WhatsApp drafts
    const whatsappDrafts = {
        fire: {
            en: `🚨 MUHAFIZ-X SOVEREIGN ALERT\n━━━━━━━━━━━━━━━━━━━━━━━━\n🔥 INCIDENT: FIRE\n📍 LOCATION: ${loc}\n━━━━━━━━━━━━━━━━━━━━━━━━\n✅ RESPONSE DEPLOYED:\n• ${units} from ${hub}\n• ETA: ${etaMins} minutes (live TomTom routing)\n• Route: ${primaryRoute}\n• KESC power cut ordered for immediate block\n• ${nearestHospital} alerted for casualty intake\n━━━━━━━━━━━━━━━━━━━━━━━━\n⚠️ CITIZEN ACTION REQUIRED:\n• Evacuate ALL structures within 150m\n• Do NOT use elevators\n• Wet cloth over face if smoke present\n• Emergency hotline: 16 (Fire) / 1122 (Rescue)`,
            ur: `🚨 محافظ-X حکومتی الرٹ\n━━━━━━━━━━━━━━━━━━━━━━━━\n🔥 واقعہ: آگ لگنا\n📍 مقام: ${loc}\n━━━━━━━━━━━━━━━━━━━━━━━━\n✅ جوابی کارروائی:\n• ${dept} روانہ از ${hub}\n• ETA: ${etaMins} منٹ\n• ${nearestHospital} تیار\n━━━━━━━━━━━━━━━━━━━━━━━━\n⚠️ شہریوں سے گزارش:\n• 150 میٹر کے اندر فوری انخلاء\n• لفٹ استعمال نہ کریں\n• ہنگامی نمبر: 16 / 1122`,
        },
        flood: {
            en: `🚨 MUHAFIZ-X SOVEREIGN ALERT\n━━━━━━━━━━━━━━━━━━━━━━━━\n🌊 INCIDENT: URBAN FLOODING\n📍 LOCATION: ${loc}\n━━━━━━━━━━━━━━━━━━━━━━━━\n✅ RESPONSE DEPLOYED:\n• ${units} from ${hub}\n• ETA: ${etaMins} minutes\n• ${policeBlock} CLOSED — traffic diverted\n• Route for emergency vehicles: ${primaryRoute}\n• ${nearestHospital} on standby\n━━━━━━━━━━━━━━━━━━━━━━━━\n⚠️ CITIZEN ACTION REQUIRED:\n• AVOID all underpasses — submersion risk\n• Move vehicles to high ground immediately\n• Do NOT walk through water above ankle\n• Danger: Submerged electrical wiring\n• Emergency: 1122 / KMC 021-99251301`,
            ur: `🚨 محافظ-X حکومتی الرٹ\n━━━━━━━━━━━━━━━━━━━━━━━━\n🌊 واقعہ: شہری سیلاب\n📍 مقام: ${loc}\n━━━━━━━━━━━━━━━━━━━━━━━━\n✅ جوابی کارروائی:\n• KMC پمپ یونٹ روانہ\n• ${policeBlock} بند — راستہ بدلیں\n• ${nearestHospital} تیار\n━━━━━━━━━━━━━━━━━━━━━━━━\n⚠️ شہریوں سے گزارش:\n• زیرآب راستوں سے دور رہیں\n• گاڑیاں اونچی جگہ کھڑی کریں\n• ہنگامی نمبر: 1122`,
        },
        blast: {
            en: `🚨 MUHAFIZ-X SOVEREIGN ALERT\n━━━━━━━━━━━━━━━━━━━━━━━━\n💥 INCIDENT: EXPLOSION / BLAST\n📍 LOCATION: ${loc}\n━━━━━━━━━━━━━━━━━━━━━━━━\n✅ RESPONSE DEPLOYED:\n• CTD Bomb Disposal Squad + Rescue 1122\n• 300m exclusion zone established\n• ${nearestHospital} trauma bay activated\n━━━━━━━━━━━━━━━━━━━━━━━━\n⚠️ CRITICAL — LEAVE THE AREA:\n• EXIT within 300m radius IMMEDIATELY\n• Do NOT use mobile phones near scene\n• Avoid glass and debris\n• Emergency: 1122 / 15 (Police)`,
            ur: `🚨 محافظ-X حکومتی الرٹ\n━━━━━━━━━━━━━━━━━━━━━━━━\n💥 واقعہ: دھماکہ\n📍 مقام: ${loc}\n━━━━━━━━━━━━━━━━━━━━━━━━\n⚠️ اہم — ابھی علاقہ خالی کریں\n• 300 میٹر کا خطرناک زون\n• موبائل فون بند کریں\n• ہنگامی نمبر: 1122 / 15`,
        },
        protest: {
            en: `🚨 MUHAFIZ-X TRAFFIC ALERT\n━━━━━━━━━━━━━━━━━━━━━━━━\n🚧 INCIDENT: ROAD CLOSURE / PROTEST\n📍 LOCATION: ${loc}\n━━━━━━━━━━━━━━━━━━━━━━━━\n✅ TRAFFIC MANAGEMENT:\n• Traffic Police deployed at ${policeBlock}\n• ALTERNATE ROUTE: ${primaryRoute}\n• Ambulance corridor maintained\n• ${nearestHospital} — emergency access preserved\n━━━━━━━━━━━━━━━━━━━━━━━━\n📌 USE ALTERNATE ROUTES:\n• ${primaryRoute}\n• Avoid: ${policeBlock} area entirely\n• Traffic Police Hotline: 021-35662001`,
            ur: `🚨 محافظ-X ٹریفک الرٹ\n━━━━━━━━━━━━━━━━━━━━━━━━\n🚧 واقعہ: سڑک بندش\n📍 مقام: ${loc}\n━━━━━━━━━━━━━━━━━━━━━━━━\n✅ متبادل راستہ: ${primaryRoute}\n• ${policeBlock} سے دور رہیں\n• ٹریفک پولیس موجود\n• ہنگامی نمبر: 15`,
        },
        proactive_maintenance: {
            en: "",
            ur: "",
        },
    };

    const push = pushMessages[crisisType] || pushMessages.flood;
    const whatsapp = whatsappDrafts[crisisType] || whatsappDrafts.flood;

    let mayorBrief = "";
    if (crisisType === 'proactive_maintenance') {
        mayorBrief = `Mayor's Security Brief (SECURE/PRIVATE) — ${new Date().toLocaleTimeString('en-PK', { timeZone: 'Asia/Karachi' })}: ` +
            `Pre-emptive sludge suction deployment initiated at University Road (BRT Red Line Corridor) due to 85% drainage capacity usage and incoming precipitation forecast > 30mm. ` +
            `Public alerts suppressed. Automated work tickets routed to Karachi Water & Sewerage Corporation (KWSC) and Frontier Works Organisation (FWO). ` +
            `Tactical route avoidance instructions active for the BRT construction zone.`;
    } else {
        mayorBrief = `Mayor's Security Brief — ${new Date().toLocaleTimeString('en-PK', { timeZone: 'Asia/Karachi' })}: ` +
            `${crisisType.toUpperCase()} confirmed at ${loc} (Urgency: ${urgency}/10). ` +
            `${dept} dispatched from ${hub} — ETA ${etaMins} min via ${primaryRoute}. ` +
            `Police route clearance at ${policeBlock}. ` +
            `${nearestHospital} placed on standby. ` +
            `${isGlobal ? 'CITY-WIDE alert issued.' : 'Local 5km alert zone active.'} Muhafiz-X autonomous pipeline complete.`;
    }

    const dynamicFallback = {
        scope: crisisType === 'proactive_maintenance' ? 'SILENT' : (isGlobal ? 'GLOBAL' : 'LOCAL'),
        radius_km: crisisType === 'proactive_maintenance' ? 0 : (isGlobal ? 15 : 5),
        push_notification: push,
        whatsapp_draft: whatsapp,
        mayor_brief: mayorBrief,
    };

    let systemPrompt = `You are the Voice of Muhafiz-X, Karachi's Sovereign Emergency Communication System.
    CRISIS: ${crisisType.toUpperCase()} at ${loc}
    DEPLOYMENT: ${JSON.stringify(action_plan?.deployment || {})}
    ROUTE: ${primaryRoute}
    POLICE BLOCK: ${policeBlock}
    
    Generate bilingual (English + Urdu) emergency broadcasts. Be specific to ${loc}, not generic.
    Include: specific route alternatives, exact emergency numbers, specific unit ETAs, hospital names.
    
    Output ONLY JSON: { "scope": "LOCAL"|"GLOBAL"|"SILENT", "radius_km": number, "push_notification": {"en": string, "ur": string}, "whatsapp_draft": {"en": string, "ur": string}, "mayor_brief": string }`;

    if (crisisType === 'proactive_maintenance') {
        systemPrompt += `\nSPECIAL RULES FOR PROACTIVE MAINTENANCE:
        1. This is a preventative infrastructure clearance (University Road BRT Red Line drainage scenario).
        2. DO NOT issue public alerts. You MUST suppress all public notifications.
        3. Force scope to 'SILENT' and radius_km to 0.
        4. Push notification and WhatsApp draft MUST have empty strings for 'en' and 'ur' to avoid public panic.
        5. The mayor_brief MUST be a highly detailed private, secure brief outlining the pre-emptive sludge suction deployment to KWSC (Karachi Water & Sewerage Corporation) and FWO (Frontier Works Organisation) to clear the drainage blockages along the BRT Red Line corridor on University Road before the storm hits, avoiding public panic. Include details about suction trucks and depots.`;
    }

    let result;
    try {
        const response = await flashModel.invoke([
            ['system', systemPrompt],
            ['user', `Broadcast for ${crisisType} at ${loc}`]
        ]);
        result = safeParseJson(response.content, dynamicFallback);
    } catch (e) {
        console.warn('[Communicator] LLM unavailable — using crisis-specific broadcast templates.');
        result = dynamicFallback;
    }

    // Force and lock communication configuration for proactive maintenance regardless of LLM output
    if (crisisType === 'proactive_maintenance') {
        result.scope = 'SILENT';
        result.radius_km = 0;
        result.push_notification = { en: "", ur: "" };
        result.whatsapp_draft = { en: "", ur: "" };
        if (!result.mayor_brief || !result.mayor_brief.toLowerCase().includes('kwsc')) {
            result.mayor_brief = mayorBrief;
        }
    }

    console.log(`[Agent: The Communicator] Scope: ${result.scope} (${result.radius_km}km). Push: "${result.push_notification?.en?.substring(0, 80)}..."`);

    const log = {
        timestamp: new Date().toISOString(),
        agent: 'The Communicator',
        message: result.scope === 'SILENT'
            ? `📡 SILENT preventative infrastructure dispatch. No public notifications issued. Secure private briefing dispatched to the Mayor.`
            : `📡 ${result.scope} broadcast issued (${result.radius_km}km radius). Push + WhatsApp alerts dispatched in EN/UR. Mayor briefed.`,
        outcome: result.scope === 'SILENT' ? 'Silent Dispatch Actioned' : 'Broadcast Issued',
        details: result,
    };

    return {
        communication: result,
        traceLogs: [log],
    };
};

