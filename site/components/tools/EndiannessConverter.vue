<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';

import {
  analyzeEndianBytes,
  encodeUnsignedInteger,
  type IntegerByteWidth,
  type IntegerRadix,
} from '../../lib/tools/endianness-converter';
import { formatEndiannessError } from '../../locales/zh-CN/tools/endianness-converter';

type Direction = 'bytes-to-integer' | 'integer-to-bytes';

const direction = ref<Direction>('bytes-to-integer');
const byteInput = ref('12 34 56 78');
const integerInput = ref('12345678');
const integerRadix = ref<IntegerRadix>('hexadecimal');
const byteWidth = ref<IntegerByteWidth>(4);
const copyFeedback = ref('');
let feedbackTimer: ReturnType<typeof setTimeout> | undefined;

const conversion = computed(() =>
  direction.value === 'bytes-to-integer'
    ? analyzeEndianBytes(byteInput.value)
    : encodeUnsignedInteger(integerInput.value, integerRadix.value, byteWidth.value),
);

const output = computed(() => (conversion.value.ok ? conversion.value.value : undefined));
const errorMessage = computed(() =>
  conversion.value.ok ? undefined : formatEndiannessError(conversion.value.error),
);

function loadExample(): void {
  direction.value = 'bytes-to-integer';
  byteInput.value = '78 56 34 12';
}

function reset(): void {
  byteInput.value = '';
  integerInput.value = '';
  integerRadix.value = 'hexadecimal';
  byteWidth.value = 4;
  copyFeedback.value = '';
}

async function copy(value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
    copyFeedback.value = '已复制结果。';
  } catch {
    copyFeedback.value = '复制失败，请手动选择结果。';
  }

  if (feedbackTimer !== undefined) clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => (copyFeedback.value = ''), 1800);
}

onBeforeUnmount(() => {
  if (feedbackTimer !== undefined) clearTimeout(feedbackTimer);
});
</script>

<template>
  <section class="endian-tool" aria-labelledby="endian-tool-title">
    <header class="tool-header">
      <div>
        <p class="eyebrow">BYTE ORDER / UNSIGNED INTEGER</p>
        <h2 id="endian-tool-title">大小端与字节交换转换器</h2>
      </div>
      <span class="local-badge">仅在浏览器本地计算</span>
    </header>

    <fieldset>
      <legend>转换方向</legend>
      <div class="segmented">
        <label>
          <input v-model="direction" type="radio" value="bytes-to-integer" />
          byte 序列 → 整数
        </label>
        <label>
          <input v-model="direction" type="radio" value="integer-to-bytes" />
          整数 → byte 序列
        </label>
      </div>
    </fieldset>

    <label v-if="direction === 'bytes-to-integer'" class="input-label">
      HEX byte 序列（1～8 byte）
      <textarea
        v-model="byteInput"
        rows="3"
        spellcheck="false"
        placeholder="例如：12 34 56 78"
      />
    </label>

    <div v-else class="integer-controls">
      <label class="input-label">
        无符号整数
        <input v-model="integerInput" spellcheck="false" placeholder="例如：12345678" />
      </label>
      <label class="select-label">
        输入进制
        <select v-model="integerRadix">
          <option value="hexadecimal">十六进制</option>
          <option value="decimal">十进制</option>
        </select>
      </label>
      <label class="select-label">
        字段宽度
        <select v-model="byteWidth">
          <option :value="1">1 byte / 8 bit</option>
          <option :value="2">2 byte / 16 bit</option>
          <option :value="4">4 byte / 32 bit</option>
          <option :value="8">8 byte / 64 bit</option>
        </select>
      </label>
    </div>

    <p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>

    <div class="action-row">
      <button type="button" @click="loadExample">载入小端示例</button>
      <button type="button" class="ghost" @click="reset">重置</button>
    </div>

    <section v-if="output && direction === 'bytes-to-integer' && 'normalizedBytes' in output" class="result-panel">
      <h3>两种字节序解释</h3>
      <p class="result-note">输入顺序保持不变，只改变“第一个 byte 是最高有效还是最低有效”的解释。</p>
      <dl>
        <div class="result-row">
          <dt>规范 byte 序列</dt><dd><code>{{ output.normalizedBytes }}</code></dd>
          <button type="button" @click="copy(output.normalizedBytes)">复制</button>
        </div>
        <div class="result-row">
          <dt>完整反转</dt><dd><code>{{ output.reversedBytes }}</code></dd>
          <button type="button" @click="copy(output.reversedBytes)">复制</button>
        </div>
        <div class="result-row highlighted">
          <dt>按大端解释</dt>
          <dd><code>{{ output.bigEndianHex }}</code><small>{{ output.bigEndianDecimal }}</small></dd>
          <button type="button" @click="copy(output.bigEndianHex)">复制</button>
        </div>
        <div class="result-row highlighted">
          <dt>按小端解释</dt>
          <dd><code>{{ output.littleEndianHex }}</code><small>{{ output.littleEndianDecimal }}</small></dd>
          <button type="button" @click="copy(output.littleEndianHex)">复制</button>
        </div>
        <div class="result-row compact"><dt>长度</dt><dd>{{ output.byteCount }} byte / {{ output.byteCount * 8 }} bit</dd></div>
      </dl>
    </section>

    <section v-if="output && direction === 'integer-to-bytes' && 'bigEndianBytes' in output" class="result-panel">
      <h3>固定宽度编码结果</h3>
      <dl>
        <div class="result-row"><dt>规范数值</dt><dd><code>{{ output.valueHex }}</code><small>{{ output.valueDecimal }}</small></dd></div>
        <div class="result-row highlighted">
          <dt>大端 byte</dt><dd><code>{{ output.bigEndianBytes }}</code></dd>
          <button type="button" @click="copy(output.bigEndianBytes)">复制</button>
        </div>
        <div class="result-row highlighted">
          <dt>小端 byte</dt><dd><code>{{ output.littleEndianBytes }}</code></dd>
          <button type="button" @click="copy(output.littleEndianBytes)">复制</button>
        </div>
      </dl>
    </section>

    <p class="copy-feedback" aria-live="polite">{{ copyFeedback }}</p>
  </section>
</template>

<style scoped>
.endian-tool { margin: 24px 0; padding: 22px; border: 1px solid var(--vp-c-divider); border-radius: 14px; background: var(--vp-c-bg-soft); }
.tool-header, .segmented, .integer-controls, .action-row, .result-row { display: flex; gap: 14px; }
.tool-header { align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
.tool-header h2, .result-panel h3 { margin: 0; border: 0; }
.eyebrow { margin: 0 0 4px; color: var(--vp-c-brand-1); font-size: 12px; font-weight: 700; letter-spacing: .08em; }
.local-badge { padding: 5px 9px; border-radius: 999px; color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); font-size: 12px; white-space: nowrap; }
fieldset { margin: 0 0 16px; padding: 0; border: 0; }
legend, .input-label, .select-label { color: var(--vp-c-text-2); font-size: 14px; font-weight: 600; }
.segmented { margin-top: 7px; }
.segmented label { padding: 8px 10px; border: 1px solid var(--vp-c-divider); border-radius: 8px; background: var(--vp-c-bg); cursor: pointer; }
.input-label, .select-label { display: grid; gap: 7px; }
.integer-controls { align-items: end; margin-bottom: 16px; }
.integer-controls .input-label { flex: 1; }
input:not([type='radio']), select, textarea { width: 100%; padding: 9px 11px; border: 1px solid var(--vp-c-divider); border-radius: 8px; color: var(--vp-c-text-1); background: var(--vp-c-bg); font: inherit; }
input:not([type='radio']), textarea { font-family: var(--vp-font-family-mono); }
textarea { resize: vertical; line-height: 1.6; }
.action-row { margin: 14px 0; }
button { padding: 7px 11px; border: 1px solid var(--vp-c-divider); border-radius: 7px; color: var(--vp-c-text-1); background: var(--vp-c-bg); cursor: pointer; }
button:hover { border-color: var(--vp-c-brand-1); }
.ghost { background: transparent; }
.error-message { margin: 12px 0; padding: 10px 12px; border-left: 3px solid var(--vp-c-danger-1); color: var(--vp-c-danger-1); background: var(--vp-c-danger-soft); }
.result-panel { margin-top: 18px; padding: 16px; border-radius: 10px; background: var(--vp-c-bg); }
.result-note { color: var(--vp-c-text-2); font-size: 13px; }
.result-panel dl { margin: 10px 0 0; }
.result-row { align-items: flex-start; padding: 10px 0; border-bottom: 1px solid var(--vp-c-divider); }
.result-row dt { flex: 0 0 130px; color: var(--vp-c-text-2); }
.result-row dd { display: grid; flex: 1; min-width: 0; gap: 4px; margin: 0; overflow-wrap: anywhere; }
.result-row code { white-space: pre-wrap; }
.result-row small { color: var(--vp-c-text-2); }
.highlighted { border-left: 3px solid var(--vp-c-brand-1); padding-left: 10px; }
.compact { border-bottom: 0; }
.copy-feedback { min-height: 20px; margin: 8px 0 0; color: var(--vp-c-brand-1); font-size: 13px; }
@media (max-width: 640px) {
  .endian-tool { margin-inline: -8px; padding: 16px; }
  .tool-header, .segmented, .integer-controls, .result-row { flex-direction: column; }
  .local-badge { align-self: flex-start; }
  .result-row dt { flex-basis: auto; }
  .result-row button { align-self: flex-start; }
}
</style>
