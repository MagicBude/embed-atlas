<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';

import {
  calculateCrc,
  CRC_PRESETS,
  formatCrcHex,
  type CrcModel,
  type CrcWidth,
} from '../../lib/tools/crc-calculator';
import { encodeText, parseHexBytes } from '../../lib/tools/hex-text-converter';
import { formatCrcError } from '../../locales/zh-CN/tools/crc-calculator';
import { formatHexTextError } from '../../locales/zh-CN/tools/hex-text-converter';

type DataFormat = 'utf-8' | 'hex';

const selectedPreset = ref(CRC_PRESETS[3].name);
const width = ref<CrcWidth>(32);
const polyText = ref('04C11DB7');
const initText = ref('FFFFFFFF');
const refIn = ref(true);
const refOut = ref(true);
const xorOutText = ref('FFFFFFFF');
const dataFormat = ref<DataFormat>('utf-8');
const dataText = ref('123456789');
const copyFeedback = ref('');
let copyTimer: ReturnType<typeof setTimeout> | undefined;

function loadPreset(name: string): void {
  const preset = CRC_PRESETS.find((item) => item.name === name);
  if (!preset) return;
  selectedPreset.value = name;
  width.value = preset.width;
  polyText.value = preset.poly.toString(16).toUpperCase().padStart(preset.width / 4, '0');
  initText.value = preset.init.toString(16).toUpperCase().padStart(preset.width / 4, '0');
  refIn.value = preset.refIn;
  refOut.value = preset.refOut;
  xorOutText.value = preset.xorOut.toString(16).toUpperCase().padStart(preset.width / 4, '0');
}

function parseParameter(text: string, label: string): { value?: bigint; error?: string } {
  const normalized = text.trim().replace(/^0x/i, '');
  if (normalized === '') return { error: `${label} 不能为空。` };
  if (!/^[0-9a-f]+$/i.test(normalized)) return { error: `${label} 只能包含十六进制数字。` };
  const value = BigInt(`0x${normalized}`);
  if (value >= (1n << BigInt(width.value))) return { error: `${label} 超出 ${width.value} bit 范围。` };
  return { value };
}

const calculation = computed(() => {
  const poly = parseParameter(polyText.value, 'Poly');
  const init = parseParameter(initText.value, 'Init');
  const xorOut = parseParameter(xorOutText.value, 'XorOut');
  const parameterError = poly.error ?? init.error ?? xorOut.error;
  if (parameterError) return { error: parameterError };

  const data = dataFormat.value === 'hex'
    ? parseHexBytes(dataText.value)
    : encodeText(dataText.value, 'utf-8');
  if (!data.ok) return { error: formatHexTextError(data.error) };

  const model: CrcModel = {
    name: selectedPreset.value,
    width: width.value,
    poly: poly.value!,
    init: init.value!,
    refIn: refIn.value,
    refOut: refOut.value,
    xorOut: xorOut.value!,
  };
  const result = calculateCrc(data.value.bytes, model);
  return result.ok ? { value: result.value } : { error: formatCrcError(result.error) };
});

const activePreset = computed(() => CRC_PRESETS.find((item) => item.name === selectedPreset.value));
const matchesActivePreset = computed(() => {
  const preset = activePreset.value;
  const model = calculation.value.value?.model;
  return preset !== undefined && model !== undefined
    && preset.width === model.width
    && preset.poly === model.poly
    && preset.init === model.init
    && preset.refIn === model.refIn
    && preset.refOut === model.refOut
    && preset.xorOut === model.xorOut;
});

function setExample(): void {
  dataFormat.value = 'utf-8';
  dataText.value = '123456789';
}

async function copyResult(): Promise<void> {
  const value = calculation.value.value?.hexadecimal;
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
    copyFeedback.value = '已复制 CRC 结果。';
  } catch {
    copyFeedback.value = '复制失败，请手动选择结果。';
  }
  if (copyTimer !== undefined) clearTimeout(copyTimer);
  copyTimer = setTimeout(() => { copyFeedback.value = ''; }, 1800);
}

onBeforeUnmount(() => {
  if (copyTimer !== undefined) clearTimeout(copyTimer);
});
</script>

<template>
  <section class="crc-tool" aria-labelledby="crc-title">
    <header>
      <div>
        <p class="eyebrow">参数化 CRC</p>
        <h2 id="crc-title">CRC 计算器</h2>
      </div>
      <span class="badge">本地计算 · 检查向量已测试</span>
    </header>

    <div class="workspace">
      <form class="panel" @submit.prevent>
        <label>模型预设
          <select :value="selectedPreset" @change="loadPreset(($event.target as HTMLSelectElement).value)">
            <option v-for="preset in CRC_PRESETS" :key="preset.name" :value="preset.name">{{ preset.name }}</option>
          </select>
        </label>

        <div class="param-grid">
          <label>Width
            <select v-model.number="width">
              <option :value="8">8 bit</option><option :value="16">16 bit</option><option :value="32">32 bit</option>
            </select>
          </label>
          <label>Poly（HEX）<input v-model="polyText" spellcheck="false" /></label>
          <label>Init（HEX）<input v-model="initText" spellcheck="false" /></label>
          <label>XorOut（HEX）<input v-model="xorOutText" spellcheck="false" /></label>
        </div>

        <div class="checks">
          <label><input v-model="refIn" type="checkbox" /> RefIn</label>
          <label><input v-model="refOut" type="checkbox" /> RefOut</label>
        </div>

        <label>输入格式
          <select v-model="dataFormat"><option value="utf-8">UTF-8 文本</option><option value="hex">HEX 字节</option></select>
        </label>
        <label>待计算数据
          <textarea v-model="dataText" rows="5" spellcheck="false" />
        </label>
        <button type="button" @click="setExample">载入检查文本 123456789</button>
      </form>

      <section class="result" aria-live="polite">
        <p class="eyebrow">即时结果</p>
        <p v-if="calculation.error" class="error" role="alert">{{ calculation.error }}</p>
        <template v-else-if="calculation.value">
          <div class="primary-result">
            <strong>{{ calculation.value.hexadecimal }}</strong>
            <button type="button" @click="copyResult">复制结果</button>
          </div>
          <dl>
            <div><dt>宽度</dt><dd>{{ calculation.value.model.width }} bit</dd></div>
            <div><dt>输入长度</dt><dd>{{ calculation.value.byteCount }} byte</dd></div>
            <div><dt>Poly</dt><dd><code>{{ formatCrcHex(calculation.value.model.poly, calculation.value.model.width) }}</code></dd></div>
            <div><dt>Init / XorOut</dt><dd><code>{{ formatCrcHex(calculation.value.model.init, calculation.value.model.width) }} / {{ formatCrcHex(calculation.value.model.xorOut, calculation.value.model.width) }}</code></dd></div>
          </dl>
          <p v-if="matchesActivePreset && activePreset?.check !== undefined" class="check">
            `123456789` 的预期 Check：{{ formatCrcHex(activePreset.check, activePreset.width) }}
          </p>
          <p class="copy-feedback" role="status" aria-live="polite">{{ copyFeedback }}</p>
        </template>
      </section>
    </div>
  </section>
</template>

<style scoped>
.crc-tool { margin: 28px 0; border: 1px solid var(--vp-c-divider); border-radius: 16px; background: var(--vp-c-bg-soft); overflow: hidden; }
header { display: flex; justify-content: space-between; gap: 16px; padding: 22px; border-bottom: 1px solid var(--vp-c-divider); background: var(--vp-c-bg); }
h2 { margin: 0; border: 0; }
.eyebrow { margin: 0 0 5px; color: var(--vp-c-brand-1); font-size: 12px; font-weight: 700; letter-spacing: .08em; }
.badge { align-self: flex-start; padding: 5px 9px; border-radius: 999px; color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); font-size: 12px; }
.workspace { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, .85fr); }
.panel,.result { min-width: 0; padding: 22px; }
.panel { display: grid; gap: 15px; border-right: 1px solid var(--vp-c-divider); background: var(--vp-c-bg); }
label { display: grid; gap: 6px; color: var(--vp-c-text-2); font-size: 13px; font-weight: 650; }
.param-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
input,select,textarea,button { box-sizing: border-box; width: 100%; border: 1px solid var(--vp-c-divider); border-radius: 8px; padding: 9px 10px; color: var(--vp-c-text-1); background: var(--vp-c-bg-soft); font: inherit; }
input,textarea { font-family: var(--vp-font-family-mono); }
textarea { resize: vertical; }
.checks { display: flex; gap: 20px; }
.checks label { display: flex; align-items: center; gap: 7px; }
.checks input { width: auto; }
button { width: fit-content; cursor: pointer; }
.primary-result { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; margin: 16px 0; }
.result strong { min-width: 0; color: var(--vp-c-brand-1); font: 700 clamp(26px, 4vw, 36px)/1.2 var(--vp-font-family-mono); white-space: nowrap; }
.primary-result button { flex: 0 0 auto; }
.result dl { border: 1px solid var(--vp-c-divider); border-radius: 10px; background: var(--vp-c-bg); overflow: hidden; }
.result dl div { display: grid; grid-template-columns: 1fr; gap: 4px; padding: 10px 12px; border-bottom: 1px solid var(--vp-c-divider); }
.result dl div:last-child { border: 0; }
.result dt { color: var(--vp-c-text-2); }.result dd { min-width: 0; margin: 0; overflow-wrap: anywhere; }.result code { font-size: 12px; }
.check,.error { padding: 10px 12px; border-radius: 8px; background: var(--vp-c-bg); }
.error { color: var(--vp-c-danger-1); border-left: 3px solid var(--vp-c-danger-1); }
.copy-feedback { min-height: 20px; color: var(--vp-c-brand-1); font-size: 12px; text-align: right; }
@media (max-width: 760px) { .workspace { grid-template-columns: 1fr; }.panel { border-right: 0; border-bottom: 1px solid var(--vp-c-divider); } }
@media (max-width: 520px) { header { flex-direction: column; align-items: flex-start; }.panel,.result,header { padding: 16px; }.param-grid { grid-template-columns: 1fr; } }
</style>
