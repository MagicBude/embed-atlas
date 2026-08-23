<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';

import {
  calculateBaseBit,
  type BaseBitCalculationInput,
  type BitWidth,
  type BitwiseOperation,
  type ConverterError,
  type FormattedInteger,
  type Radix,
} from '../../lib/tools/base-bit-converter';
import {
  baseBitConverterZhCN as messages,
  formatBaseBitConverterError,
} from '../../locales/zh-CN/tools/base-bit-converter';

const bitWidths: readonly BitWidth[] = [8, 16, 32, 64];
const radixOptions: readonly Radix[] = [2, 8, 10, 16];
const operationOptions: readonly BitwiseOperation[] = [
  'convert',
  'and',
  'or',
  'xor',
  'not',
  'shift-left',
  'shift-right-logical',
  'shift-right-arithmetic',
];

const bitWidth = ref<BitWidth>(8);
const operandAText = ref('0x2A');
const radixA = ref<Radix>(16);
const operation = ref<BitwiseOperation>('convert');
const operandBText = ref('0x0F');
const radixB = ref<Radix>(16);
const shiftCountText = ref('1');
const copyFeedback = ref('');
let feedbackTimer: ReturnType<typeof setTimeout> | undefined;

const isBinaryOperation = computed(() =>
  ['and', 'or', 'xor'].includes(operation.value),
);
const isShiftOperation = computed(() => operation.value.startsWith('shift-'));

/**
 * HTML number 输入在清空时给出空字符串，而计算核心需要 number 或 undefined。
 * 显式转换可以保留“空输入”和“小数”等错误状态，避免 `Number('') === 0`
 * 把尚未填写的移位量误判为合法零值。
 */
const calculationInput = computed<BaseBitCalculationInput>(() => {
  const input: BaseBitCalculationInput = {
    bitWidth: bitWidth.value,
    operandA: { text: operandAText.value, radix: radixA.value },
    operation: operation.value,
  };

  if (isBinaryOperation.value) {
    input.operandB = { text: operandBText.value, radix: radixB.value };
  }

  if (isShiftOperation.value) {
    const normalizedShift = shiftCountText.value.trim();
    input.shiftCount =
      normalizedShift === '' ? undefined : Number(normalizedShift);
  }

  return input;
});

const calculation = computed(() => calculateBaseBit(calculationInput.value));
const output = computed(() =>
  calculation.value.ok ? calculation.value.value : undefined,
);
const activeError = computed<ConverterError | undefined>(() =>
  calculation.value.ok ? undefined : calculation.value.error,
);

function errorFor(field: ConverterError['field']): string | undefined {
  if (activeError.value?.field !== field) {
    return undefined;
  }

  return formatBaseBitConverterError(activeError.value);
}

const operandAError = computed(() => errorFor('operandA'));
const operandBError = computed(() => errorFor('operandB'));
const shiftCountError = computed(() => errorFor('shiftCount'));

const resultRows = computed(() => {
  if (output.value === undefined) {
    return [];
  }

  const result = output.value.result;

  return [
    {
      key: 'unsigned',
      label: messages.unsignedDecimal,
      display: result.unsignedDecimal,
      copyValue: result.unsignedDecimal,
    },
    {
      key: 'signed',
      label: messages.signedDecimal,
      display: result.signedDecimal,
      copyValue: result.signedDecimal,
    },
    {
      key: 'hexadecimal',
      label: messages.hexadecimal,
      display: result.hexadecimal,
      copyValue: result.hexadecimal,
    },
    {
      key: 'binary',
      label: messages.binary,
      display: groupBinary(result.binary),
      copyValue: result.binary,
    },
    {
      key: 'octal',
      label: messages.octal,
      display: result.octal,
      copyValue: result.octal,
    },
  ];
});

const comparisonRows = computed<
  ReadonlyArray<{ label: string; value: FormattedInteger }>
>(() => {
  if (output.value === undefined || !isBinaryOperation.value) {
    return [];
  }

  const rows = [{ label: 'A', value: output.value.operandA }];

  if (output.value.operandB !== undefined) {
    rows.push({ label: 'B', value: output.value.operandB });
  }

  rows.push({ label: 'R', value: output.value.result });
  return rows;
});

function groupBinary(binary: string): string {
  const digits = binary.slice(2);
  const groups = digits.match(/.{1,4}/g) ?? [];
  return `0b${groups.join(' ')}`;
}

function loadExample(): void {
  bitWidth.value = 8;
  operandAText.value = '0xA5';
  radixA.value = 16;
  operation.value = 'xor';
  operandBText.value = '0x0F';
  radixB.value = 16;
  shiftCountText.value = '1';
}

function reset(): void {
  bitWidth.value = 8;
  operandAText.value = '0x2A';
  radixA.value = 16;
  operation.value = 'convert';
  operandBText.value = '0x0F';
  radixB.value = 16;
  shiftCountText.value = '1';
  copyFeedback.value = '';
}

async function copyResult(value: string, label: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
    copyFeedback.value = messages.copySuccess.replace('{label}', label);
  } catch {
    copyFeedback.value = messages.copyFailure;
  }

  if (feedbackTimer !== undefined) {
    clearTimeout(feedbackTimer);
  }

  feedbackTimer = setTimeout(() => {
    copyFeedback.value = '';
  }, 2200);
}

onBeforeUnmount(() => {
  if (feedbackTimer !== undefined) {
    clearTimeout(feedbackTimer);
  }
});
</script>

<template>
  <section class="base-bit-tool" aria-labelledby="base-bit-tool-title">
    <header class="tool-header">
      <div>
        <p class="eyebrow">EmbedAtlas 工程工具</p>
        <p id="base-bit-tool-title" class="tool-title" role="heading" aria-level="2">
          进制与位运算转换器
        </p>
        <p class="tool-summary">
          在固定 8、16、32、64 位下转换整数，并观察补码和逐位运算结果。
        </p>
      </div>
      <div class="status-list" aria-label="工具状态">
        <span class="status-badge status-badge--local">{{ messages.localOnly }}</span>
        <span class="status-badge">{{ messages.tested }}</span>
      </div>
    </header>

    <div class="workspace-grid">
      <form class="input-panel" @submit.prevent>
        <fieldset class="field-group width-fieldset">
          <legend>{{ messages.bitWidth }}</legend>
          <div class="segmented-control">
            <label v-for="width in bitWidths" :key="width">
              <input v-model="bitWidth" type="radio" name="bit-width" :value="width" />
              <span>{{ width }} bit</span>
            </label>
          </div>
        </fieldset>

        <div class="operand-grid">
          <div class="field-group">
            <label for="operand-a">{{ messages.operandA }}</label>
            <input
              id="operand-a"
              v-model="operandAText"
              class="text-input mono-input"
              type="text"
              maxlength="128"
              autocomplete="off"
              spellcheck="false"
              :aria-invalid="operandAError !== undefined"
              :aria-describedby="operandAError ? 'operand-a-error' : 'operand-a-help'"
            />
            <p v-if="operandAError" id="operand-a-error" class="field-error" role="alert">
              {{ operandAError }}
            </p>
            <p v-else id="operand-a-help" class="field-help">{{ messages.operandHelp }}</p>
          </div>

          <div class="field-group compact-field">
            <label for="radix-a">{{ messages.radix }}</label>
            <select id="radix-a" v-model.number="radixA" class="select-input">
              <option v-for="radix in radixOptions" :key="radix" :value="radix">
                {{ messages.radixLabels[radix] }}（{{ radix }}）
              </option>
            </select>
          </div>
        </div>

        <div class="field-group">
          <label for="operation">{{ messages.operation }}</label>
          <select id="operation" v-model="operation" class="select-input">
            <option v-for="item in operationOptions" :key="item" :value="item">
              {{ messages.operationLabels[item] }}
            </option>
          </select>
        </div>

        <div v-if="isBinaryOperation" class="operand-grid">
          <div class="field-group">
            <label for="operand-b">{{ messages.operandB }}</label>
            <input
              id="operand-b"
              v-model="operandBText"
              class="text-input mono-input"
              type="text"
              maxlength="128"
              autocomplete="off"
              spellcheck="false"
              :aria-invalid="operandBError !== undefined"
              :aria-describedby="operandBError ? 'operand-b-error' : 'operand-b-help'"
            />
            <p v-if="operandBError" id="operand-b-error" class="field-error" role="alert">
              {{ operandBError }}
            </p>
            <p v-else id="operand-b-help" class="field-help">{{ messages.operandHelp }}</p>
          </div>

          <div class="field-group compact-field">
            <label for="radix-b">{{ messages.radix }}</label>
            <select id="radix-b" v-model.number="radixB" class="select-input">
              <option v-for="radix in radixOptions" :key="radix" :value="radix">
                {{ messages.radixLabels[radix] }}（{{ radix }}）
              </option>
            </select>
          </div>
        </div>

        <div v-if="isShiftOperation" class="field-group shift-field">
          <label for="shift-count">{{ messages.shiftCount }}（{{ messages.shiftUnit }}）</label>
          <input
            id="shift-count"
            v-model="shiftCountText"
            class="text-input"
            type="number"
            inputmode="numeric"
            step="1"
            min="0"
            :max="bitWidth - 1"
            :aria-invalid="shiftCountError !== undefined"
            :aria-describedby="shiftCountError ? 'shift-error' : 'shift-help'"
          />
          <p v-if="shiftCountError" id="shift-error" class="field-error" role="alert">
            {{ shiftCountError }}
          </p>
          <p v-else id="shift-help" class="field-help">{{ messages.shiftHelp }}</p>
        </div>

        <div class="form-actions">
          <button type="button" class="action-button action-button--primary" @click="loadExample">
            {{ messages.loadExample }}
          </button>
          <button type="button" class="action-button" @click="reset">
            {{ messages.reset }}
          </button>
        </div>
      </form>

      <section class="result-panel" aria-labelledby="result-title">
        <div class="result-heading">
          <div>
            <p class="eyebrow">即时计算</p>
            <p id="result-title" class="result-title" role="heading" aria-level="3">
              {{ messages.result }}
            </p>
          </div>
          <strong v-if="output" class="primary-result" aria-live="polite">
            {{ output.result.hexadecimal }}
          </strong>
        </div>

        <div v-if="output" class="result-content">
          <p v-if="output.wasTruncated" class="warning-message" role="status">
            <span aria-hidden="true">⚠</span>
            {{ messages.truncated }}
          </p>

          <dl class="result-list">
            <div v-for="row in resultRows" :key="row.key" class="result-row">
              <dt>{{ row.label }}</dt>
              <dd><code>{{ row.display }}</code></dd>
              <button
                type="button"
                class="copy-button"
                :aria-label="`${messages.copy}${row.label}`"
                @click="copyResult(row.copyValue, row.label)"
              >
                {{ messages.copy }}
              </button>
            </div>
          </dl>

          <div class="bit-section">
            <p class="section-title" role="heading" aria-level="4">
              {{ messages.bitView }}
            </p>
            <div class="bit-scroll" tabindex="0" aria-label="结果位模式，可横向滚动">
              <div class="bit-grid" :style="{ '--bit-count': bitWidth }">
                <div v-for="bit in output.result.bits" :key="bit.index" class="bit-cell">
                  <span class="bit-index">{{ bit.index }}</span>
                  <strong>{{ bit.value }}</strong>
                </div>
              </div>
            </div>
          </div>

          <div v-if="comparisonRows.length > 0" class="comparison-section">
            <p class="section-title" role="heading" aria-level="4">
              {{ messages.operandComparison }}
            </p>
            <div class="comparison-scroll" tabindex="0">
              <div v-for="row in comparisonRows" :key="row.label" class="comparison-row">
                <strong>{{ row.label }}</strong>
                <code>{{ groupBinary(row.value.binary) }}</code>
              </div>
            </div>
          </div>
        </div>

        <p v-else class="result-empty">{{ messages.resultUnavailable }}</p>
        <p class="copy-feedback" role="status" aria-live="polite">{{ copyFeedback }}</p>
      </section>
    </div>
  </section>
</template>

<style scoped>
.base-bit-tool {
  margin: 32px 0 40px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 18px;
  background: var(--vp-c-bg-soft);
  overflow: hidden;
}

.tool-header {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 24px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}

.tool-title,
.result-title,
.section-title {
  margin: 0;
  padding: 0;
  color: var(--vp-c-text-1);
  font-weight: 700;
}

.tool-title {
  font-size: 24px;
  line-height: 1.35;
}

.result-title {
  font-size: 20px;
  line-height: 1.4;
}

.eyebrow {
  margin: 0 0 6px;
  color: var(--vp-c-brand-1);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.tool-summary {
  max-width: 660px;
  margin: 8px 0 0;
  color: var(--vp-c-text-2);
  line-height: 1.7;
}

.status-list {
  display: flex;
  align-content: flex-start;
  align-items: flex-start;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 4px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
  font-size: 12px;
  white-space: nowrap;
}

.status-badge--local {
  border-color: var(--vp-c-brand-2);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
}

.input-panel,
.result-panel {
  min-width: 0;
  padding: 24px;
}

.input-panel {
  border-right: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}

.field-group {
  margin: 0 0 20px;
  padding: 0;
  border: 0;
}

.field-group > label,
.field-group > legend {
  display: block;
  margin-bottom: 8px;
  color: var(--vp-c-text-1);
  font-size: 14px;
  font-weight: 650;
}

.operand-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(138px, 0.46fr);
  gap: 12px;
}

.text-input,
.select-input {
  width: 100%;
  min-height: 44px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 9px;
  padding: 9px 11px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
  font: inherit;
}

.mono-input {
  font-family: var(--vp-font-family-mono);
}

.text-input:hover,
.select-input:hover {
  border-color: var(--vp-c-text-3);
}

.text-input:focus-visible,
.select-input:focus-visible,
.action-button:focus-visible,
.copy-button:focus-visible,
.segmented-control input:focus-visible + span,
.bit-scroll:focus-visible,
.comparison-scroll:focus-visible {
  outline: 3px solid var(--vp-c-brand-soft);
  outline-offset: 2px;
  border-color: var(--vp-c-brand-1);
}

.text-input[aria-invalid='true'] {
  border-color: var(--vp-c-danger-1);
}

.field-help,
.field-error {
  margin: 7px 0 0;
  font-size: 12px;
  line-height: 1.55;
}

.field-help {
  color: var(--vp-c-text-3);
}

.field-error {
  color: var(--vp-c-danger-1);
  font-weight: 600;
}

.segmented-control {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.segmented-control label {
  position: relative;
  cursor: pointer;
}

.segmented-control input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.segmented-control span {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 9px;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
  font-size: 13px;
  font-weight: 650;
}

.segmented-control input:checked + span {
  border-color: var(--vp-c-brand-2);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.shift-field {
  max-width: 240px;
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 4px;
}

.action-button,
.copy-button {
  min-height: 40px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 9px;
  padding: 8px 14px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
  font: inherit;
  font-size: 13px;
  font-weight: 650;
  cursor: pointer;
}

.action-button:hover,
.copy-button:hover {
  border-color: var(--vp-c-brand-2);
  color: var(--vp-c-brand-1);
}

.action-button--primary {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-button-brand-text);
  background: var(--vp-c-brand-1);
}

.action-button--primary:hover {
  border-color: var(--vp-c-brand-2);
  color: var(--vp-button-brand-text);
  background: var(--vp-c-brand-2);
}

.result-panel {
  position: relative;
  background: var(--vp-c-bg-soft);
}

.result-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.primary-result {
  max-width: 65%;
  color: var(--vp-c-brand-1);
  font-family: var(--vp-font-family-mono);
  font-size: clamp(20px, 3vw, 30px);
  line-height: 1.25;
  overflow-wrap: anywhere;
  text-align: right;
}

.result-list {
  margin: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg);
  overflow: hidden;
}

.result-row {
  display: grid;
  grid-template-columns: minmax(130px, 0.7fr) minmax(0, 1.3fr) auto;
  align-items: center;
  gap: 12px;
  min-height: 54px;
  padding: 8px 10px 8px 14px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.result-row:last-child {
  border-bottom: 0;
}

.result-row dt {
  color: var(--vp-c-text-2);
  font-size: 13px;
}

.result-row dd {
  min-width: 0;
  margin: 0;
}

.result-row code,
.comparison-row code {
  color: var(--vp-c-text-1);
  background: transparent;
  font-size: 13px;
  overflow-wrap: anywhere;
}

.copy-button {
  min-height: 34px;
  padding: 5px 10px;
}

.warning-message {
  display: flex;
  gap: 8px;
  margin: 0 0 14px;
  border: 1px solid var(--vp-c-warning-2);
  border-radius: 9px;
  padding: 10px 12px;
  color: var(--vp-c-warning-1);
  background: var(--vp-c-warning-soft);
  font-size: 13px;
  line-height: 1.5;
}

.bit-section,
.comparison-section {
  margin-top: 22px;
}

.section-title {
  margin-bottom: 10px;
  font-size: 15px;
}

.bit-scroll,
.comparison-scroll {
  max-width: 100%;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
  overflow-x: auto;
}

.bit-grid {
  display: grid;
  grid-template-columns: repeat(var(--bit-count), minmax(34px, 1fr));
  min-width: max-content;
  padding: 10px;
}

.bit-cell {
  display: grid;
  justify-items: center;
  min-width: 34px;
  border-right: 1px solid var(--vp-c-divider);
  font-family: var(--vp-font-family-mono);
}

.bit-cell:last-child {
  border-right: 0;
}

.bit-index {
  color: var(--vp-c-text-3);
  font-size: 10px;
}

.bit-cell strong {
  color: var(--vp-c-text-1);
  font-size: 15px;
}

.comparison-scroll {
  padding: 8px 12px;
}

.comparison-row {
  display: grid;
  grid-template-columns: 24px minmax(max-content, 1fr);
  gap: 10px;
  align-items: center;
  min-width: max-content;
  padding: 6px 0;
}

.comparison-row strong {
  color: var(--vp-c-brand-1);
  font-family: var(--vp-font-family-mono);
}

.result-empty {
  margin: 36px 0;
  color: var(--vp-c-text-2);
  text-align: center;
}

.copy-feedback {
  min-height: 20px;
  margin: 12px 0 0;
  color: var(--vp-c-brand-1);
  font-size: 12px;
  font-weight: 650;
  text-align: right;
}

@media (max-width: 860px) {
  .tool-header {
    flex-direction: column;
  }

  .status-list {
    justify-content: flex-start;
  }

  .workspace-grid {
    grid-template-columns: 1fr;
  }

  .input-panel {
    border-right: 0;
    border-bottom: 1px solid var(--vp-c-divider);
  }
}

@media (max-width: 560px) {
  .tool-header,
  .input-panel,
  .result-panel {
    padding: 18px;
  }

  .operand-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .compact-field {
    margin-top: -8px;
  }

  .segmented-control {
    grid-template-columns: repeat(2, 1fr);
  }

  .result-heading {
    flex-direction: column;
  }

  .primary-result {
    max-width: 100%;
    text-align: left;
  }

  .result-row {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .result-row dt {
    grid-column: 1 / -1;
    margin-bottom: -6px;
  }
}
</style>
