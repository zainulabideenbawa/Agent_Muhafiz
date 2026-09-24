# Data Schema

## Signal Payloads
```json
{
  "raw_input": "string",   // Original text from citizen app or social media
  "source": "APP" | "SOCIAL",
  "metadata": {
    "timestamp": "ISO8601",
    "device_id": "string"
  }
}
```

## Classification Output (Sentinel)
```json
{
  "is_crisis": true,
  "type": "fire" | "flood" | "blast" | "protest" | "proactive_maintenance",
  "location": "Specific address or landmark",
  "urgency": 1-10,
  "secondary_hazards": ["exposed_electrical_wires"],
  "reasoning": "Detailed description"
}
```

## Action Plan (Dispatcher)
```json
{
  "threat_level": 1-10,
  "category": "LIFE_SAFETY" | "INFRASTRUCTURE" | "CIVIL_ORDER" | "PREVENTATIVE_MAINTENANCE",
  "department": "FIRE_BRIGADE" | "KMC_HEALTH" | "RESCUE_1122" | "POLICE_FORCE" | "KWSC_FWO",
  "immediate_action": "DISPATCH …",
  "route_directive": {
    "primary_route": "string",
    "avoid": "string",
    "police_block_required_at": "string"
  },
  "units_dispatched": ["string"],
  "emergency_contact": "phone number"
}
```
