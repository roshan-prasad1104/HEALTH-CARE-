const BLOOD_DEFINITIONS = [
  { key: 'hba1c', label: 'HbA1c', unit: '%', aliases: ['hba1c', 'hb a1c', 'glycated hemoglobin'], range: [4, 5.6] },
  { key: 'glucose', label: 'Glucose', unit: 'mg/dL', aliases: ['glucose', 'fasting sugar', 'blood sugar', 'fbs'], range: [70, 99] },
  { key: 'cholesterol', label: 'Total Cholesterol', unit: 'mg/dL', aliases: ['total cholesterol', 'cholesterol'], range: [0, 200] },
  { key: 'hemoglobin', label: 'Hemoglobin', unit: 'g/dL', aliases: ['hemoglobin', 'haemoglobin', 'hb'], range: [12, 16] },
  { key: 'triglycerides', label: 'Triglycerides', unit: 'mg/dL', aliases: ['triglycerides', 'tg'], range: [0, 150] },
  { key: 'hdl', label: 'HDL Cholesterol', unit: 'mg/dL', aliases: ['hdl'], range: [40, 100] },
  { key: 'ldl', label: 'LDL Cholesterol', unit: 'mg/dL', aliases: ['ldl'], range: [0, 100] }
];

const VISION_DEFINITIONS = [
  { key: 'odSph', label: 'OD SPH', unit: 'D', aliases: ['od sph', 'right sph', 'right eye sph', 're sph', 'sph od'] },
  { key: 'odCyl', label: 'OD CYL', unit: 'D', aliases: ['od cyl', 'right cyl', 'right eye cyl', 're cyl', 'cyl od'] },
  { key: 'odAxis', label: 'OD AXIS', unit: 'deg', aliases: ['od axis', 'right axis', 'right eye axis', 're axis', 'axis od'] },
  { key: 'osSph', label: 'OS SPH', unit: 'D', aliases: ['os sph', 'left sph', 'left eye sph', 'le sph', 'sph os'] },
  { key: 'osCyl', label: 'OS CYL', unit: 'D', aliases: ['os cyl', 'left cyl', 'left eye cyl', 'le cyl', 'cyl os'] },
  { key: 'osAxis', label: 'OS AXIS', unit: 'deg', aliases: ['os axis', 'left axis', 'left eye axis', 'le axis', 'axis os'] },
  { key: 'visualAcuity', label: 'Visual Acuity', unit: '', aliases: ['visual acuity', 'va', 'vision acuity'] },
  { key: 'iop', label: 'IOP', unit: 'mmHg', aliases: ['iop', 'intraocular pressure', 'eye pressure'], range: [10, 21] }
];

const BLOOD_KEYWORDS = BLOOD_DEFINITIONS.flatMap(item => item.aliases);
const VISION_KEYWORDS = VISION_DEFINITIONS.flatMap(item => item.aliases).concat(['sph', 'cyl', 'axis', 'od', 'os']);

function includesAny(text, keywords) {
  const normalized = text.toLowerCase();
  return keywords.some(keyword => new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'i').test(normalized));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractValue(text, aliases) {
  for (const alias of aliases) {
    const pattern = new RegExp(`\\b${escapeRegExp(alias)}\\b\\s*[:=]?\\s*([+-]?\\d+(?:\\.\\d+)?(?:\\s*\\/\\s*\\d+)?)`, 'i');
    const match = text.match(pattern);
    if (match) return match[1].replace(/\s+/g, '');
  }
  return null;
}

function extractVisionValue(text, definition) {
  const key = definition.key.toLowerCase();
  const eye = key.startsWith('od') ? 'od' : key.startsWith('os') ? 'os' : null;
  const field = key.includes('sph') ? 'sph' : key.includes('cyl') ? 'cyl' : key.includes('axis') ? 'axis' : null;

  if (!eye || !field) return null;

  const eyeLabels = eye === 'od'
    ? '(?:od|right eye|right|re)'
    : '(?:os|left eye|left|le)';
  const nextEyeLabels = eye === 'od'
    ? '(?:os|left eye|left|le)'
    : '(?:od|right eye|right|re)';
  const blockPattern = new RegExp(`${eyeLabels}([\\s\\S]*?)(?=${nextEyeLabels}|$)`, 'i');
  const block = text.match(blockPattern)?.[1] || '';
  const valuePattern = new RegExp(`\\b${field}\\b\\s*[:=]?\\s*([+-]?\\d+(?:\\.\\d+)?)`, 'i');
  return block.match(valuePattern)?.[1] || null;
}

function statusFor(value, range) {
  if (!range || value === null || value.includes('/')) return 'Recorded';
  const numeric = Number.parseFloat(value);
  if (Number.isNaN(numeric)) return 'Recorded';
  if (numeric < range[0]) return 'Low';
  if (numeric > range[1]) return 'High';
  return 'Normal';
}

function toMarker(definition, value) {
  return {
    key: definition.key,
    name: definition.label,
    value: value || 'Not found',
    unit: value ? definition.unit : '',
    status: value ? statusFor(value, definition.range) : 'Missing',
    normalRange: definition.range ? `${definition.range[0]} - ${definition.range[1]} ${definition.unit}` : 'Report-specific',
    explanation: value
      ? `${definition.label} was detected in the pasted report text.`
      : `${definition.label} was not detected in the pasted report text.`,
    educationalRecommendation: 'Use this structured extraction for discussion with a qualified clinician.'
  };
}

function analyzeLabText(text, mode = 'blood') {
  const source = String(text || '');
  const definitions = mode === 'vision' ? VISION_DEFINITIONS : BLOOD_DEFINITIONS;
  const markers = definitions.map(definition => {
    const value = mode === 'vision'
      ? extractVisionValue(source, definition) || extractValue(source, definition.aliases)
      : extractValue(source, definition.aliases);
    return toMarker(definition, value);
  });
  const foundCount = markers.filter(marker => marker.status !== 'Missing').length;
  const hasBloodKeywords = includesAny(source, BLOOD_KEYWORDS);
  const hasVisionKeywords = includesAny(source, VISION_KEYWORDS);

  return {
    mode,
    markers,
    foundCount,
    warnings: {
      bloodInVisionMode: mode === 'vision' && hasBloodKeywords,
      visionInBloodMode: mode === 'blood' && hasVisionKeywords
    },
    generalSummary: foundCount > 0
      ? `${foundCount} ${mode === 'vision' ? 'vision' : 'blood'} metric${foundCount === 1 ? '' : 's'} found in the pasted text.`
      : `No structured ${mode === 'vision' ? 'vision' : 'blood'} metrics were found. Check the selected mode and pasted report text.`,
    safetyDisclaimer: 'Text extraction only. This is not a diagnosis and does not replace professional medical review.'
  };
}

module.exports = {
  analyzeLabText,
  BLOOD_DEFINITIONS,
  VISION_DEFINITIONS,
  BLOOD_KEYWORDS,
  VISION_KEYWORDS
};
