<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';

import {
  decodeHexText,
  encodeText,
  type TextEncoding,
} from '../../lib/tools/hex-text-converter';
import {
  formatHexTextError,
  hexTextConverterZhCN as messages,
} from '../../locales/zh-CN/tools/hex-text-converter';

type Direction = 'text-to-hex' | 'hex-to-text';

const direction = ref<Direction>('text-to-hex');
const encoding = ref<TextEncoding>('utf-8');
const textInput = ref('Hello, 中!');
const hexInput = ref('48 65 6C 6C 6F');
const copyFeedback = ref('');
let feedbackTimer: ReturnType<typeof setTimeout> | undefined;

const conversion = computed(() =>
  direction.value === 'text-to-hex'
    ? encodeText(textInput.value, encoding.value)
    : decodeHexText(hexInput.value, encoding.value),
);

const output = computed(() =>
  conversion.value.ok ? conversion.value.value : undefined,
);
const errorMessage = computed(() =>
  conversion.value.ok ? undefined : formatHexTextError(conversion.value.error),
);

function loadExample(): void {
  direction.value = 'text-to-hex';
  encoding.value = 'utf-8';
  textInput.value = 'EmbedAtlas 中文 😀';
}

function reset(): void {
  direction.value = 'text-to-hex';
  encoding.value = 'utf-8';
  textInput.value = '';
  hexInput.value = '';
  copyFeedback.value = '';
}

async function copy(value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
    copyFeedback.value = messages.copySuccess;
  } catch {
    copyFeedback.value = messages.copyFailure;
  }

  if (feedbackTimer !== undefined) {
    clearTimeout(feedbackTimer);
  }
  feedbackTimer = setTimeout(() => {
    copyFeedback.value = '';
  }, 1800);
}

onBeforeUnmount(() => {
  if (feedbackTimer !== undefined) {
    clearTimeout(feedbackTimer);
  }
});
</script>

<template>
  <section class="hex-tool" aria-labelledby="hex-tool-title">
    <header class="tool-header">
      <div>
        <p class="eyebrow">HEX / ASCII / UTF-8</p>
        <h2 id="hex-tool-title">HEX、ASCII 与字符串转换器</h2>
      </div>
      <span class="local-badge">{{ messages.localOnly }}</span>
    </header>

    <div class="control-grid">
      <fieldset>
        <legend>转换方向</legend>
        <div class="segmented">
          <label>
            <input v-model="direction" type="radio" value="text-to-hex" />
            {{ messages.textToHex }}
          </label>
          <label>
            <input v-model="direction" type="radio" value="hex-to-text" />
            {{ messages.hexToText }}
          </label>
        </div>
      </fieldset>

      <label class="select-label">
        {{ messages.encoding }}
        <select v-model="encoding">
          <option value="utf-8">UTF-8</option>
          <option value="ascii">ASCII</option>
        </select>
      </label>
    </div>

    <label v-if="direction === 'text-to-hex'" class="input-label">
      {{ messages.textInput }}
      <textarea
        v-model="textInput"
        :placeholder="messages.textPlaceholder"
        rows="5"
        spellcheck="false"
      />
    </label>
    <label v-else class="input-label">
      {{ messages.hexInput }}
      <textarea
        v-model="hexInput"
        :placeholder="messages.hexPlaceholder"
        rows="5"
        spellcheck="false"
      />
    </label>

    <p v-if="errorMessage" class="error-message" role="alert">
      {{ errorMessage }}
    </p>

    <div class="action-row">
      <button type="button" class="secondary" @click="loadExample">
        {{ messages.loadExample }}
      </button>
      <button type="button" class="ghost" @click="reset">
        {{ messages.reset }}
      </button>
    </div>

    <section v-if="output" class="result-panel" aria-live="polite">
      <h3>{{ messages.result }}</h3>
      <dl>
        <div v-if="direction === 'hex-to-text'" class="result-row">
          <dt>{{ messages.decodedText }}</dt>
          <dd><code class="text-output">{{ output.text }}</code></dd>
          <button type="button" @click="copy(output.text)">{{ messages.copy }}</button>
        </div>
        <div class="result-row">
          <dt>{{ messages.hexadecimal }}</dt>
          <dd><code>{{ output.hexadecimal }}</code></dd>
          <button type="button" @click="copy(output.hexadecimal)">{{ messages.copy }}</button>
        </div>
        <div class="result-row">
          <dt>{{ messages.decimalBytes }}</dt>
          <dd><code>{{ output.decimal }}</code></dd>
        </div>
        <div class="result-row">
          <dt>{{ messages.asciiPreview }}</dt>
          <dd><code>{{ output.asciiPreview }}</code></dd>
        </div>
        <div class="result-row compact">
          <dt>{{ messages.byteCount }}</dt>
          <dd>{{ output.byteCount }} byte</dd>
        </div>
      </dl>
      <p class="copy-feedback" aria-live="polite">{{ copyFeedback }}</p>
    </section>
  </section>
</template>

<style scoped>
.hex-tool {
  margin: 24px 0;
  padding: 22px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  background: var(--vp-c-bg-soft);
}

.tool-header,
.control-grid,
.action-row,
.result-row {
  display: flex;
  gap: 14px;
}

.tool-header {
  align-items: flex-start;
  justify-content: space-between;
}

.tool-header h2,
.result-panel h3 {
  margin: 0;
  border: 0;
}

.eyebrow {
  margin: 0 0 4px;
  color: var(--vp-c-brand-1);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.local-badge {
  padding: 5px 9px;
  border-radius: 999px;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  font-size: 12px;
  white-space: nowrap;
}

.control-grid {
  align-items: end;
  margin: 22px 0 16px;
}

fieldset {
  flex: 1;
  margin: 0;
  padding: 0;
  border: 0;
}

legend,
.select-label,
.input-label {
  color: var(--vp-c-text-2);
  font-size: 14px;
  font-weight: 600;
}

.segmented {
  display: flex;
  gap: 6px;
  margin-top: 7px;
}

.segmented label {
  padding: 8px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  cursor: pointer;
}

.select-label {
  display: grid;
  gap: 7px;
}

select,
textarea {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  font: inherit;
}

select {
  min-width: 130px;
  padding: 8px 10px;
}

.input-label {
  display: grid;
  gap: 7px;
}

textarea {
  width: 100%;
  padding: 12px;
  resize: vertical;
  font-family: var(--vp-font-family-mono);
  line-height: 1.6;
}

.action-row {
  margin: 14px 0;
}

button {
  padding: 7px 11px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 7px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  cursor: pointer;
}

button:hover {
  border-color: var(--vp-c-brand-1);
}

.secondary {
  color: var(--vp-c-brand-1);
}

.ghost {
  background: transparent;
}

.error-message {
  margin: 12px 0;
  padding: 10px 12px;
  border-left: 3px solid var(--vp-c-danger-1);
  color: var(--vp-c-danger-1);
  background: var(--vp-c-danger-soft);
}

.result-panel {
  margin-top: 18px;
  padding: 16px;
  border-radius: 10px;
  background: var(--vp-c-bg);
}

.result-panel dl {
  margin: 10px 0 0;
}

.result-row {
  align-items: flex-start;
  padding: 10px 0;
  border-bottom: 1px solid var(--vp-c-divider);
}

.result-row dt {
  flex: 0 0 125px;
  color: var(--vp-c-text-2);
}

.result-row dd {
  flex: 1;
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
}

.result-row code {
  white-space: pre-wrap;
}

.text-output {
  white-space: pre-wrap;
}

.compact {
  border-bottom: 0;
}

.copy-feedback {
  min-height: 20px;
  margin: 8px 0 0;
  color: var(--vp-c-brand-1);
  font-size: 13px;
}

@media (max-width: 640px) {
  .hex-tool {
    margin-inline: -8px;
    padding: 16px;
  }

  .tool-header,
  .control-grid,
  .result-row {
    flex-direction: column;
  }

  .local-badge {
    align-self: flex-start;
  }

  .segmented {
    flex-direction: column;
  }

  .result-row dt {
    flex-basis: auto;
  }

  .result-row button {
    align-self: flex-start;
  }
}
</style>
