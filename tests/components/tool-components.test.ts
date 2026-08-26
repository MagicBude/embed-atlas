// @vitest-environment happy-dom

import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import BaseBitConverter from '../../site/components/tools/BaseBitConverter.vue';
import CrcCalculator from '../../site/components/tools/CrcCalculator.vue';
import EndiannessConverter from '../../site/components/tools/EndiannessConverter.vue';
import HexTextConverter from '../../site/components/tools/HexTextConverter.vue';

/**
 * 按可见文案定位按钮，而不是依赖按钮在 DOM 中的固定序号。
 *
 * 工具界面后续可以增加结果行或调整布局；只要用户看到的操作名称没有改变，
 * 测试就仍然表达同一交互意图。找不到按钮时主动抛错，比对空 wrapper 调用
 * `trigger` 更容易判断是文案变化还是组件行为回归。
 */
function buttonByText(wrapper: VueWrapper, text: string) {
  const button = wrapper.findAll('button').find((item) => item.text() === text);
  if (button === undefined) {
    throw new Error(`找不到按钮：${text}`);
  }
  return button;
}

describe('BaseBitConverter component', () => {
  it('随输入与运算选择实时更新固定位宽结果', async () => {
    const wrapper = mount(BaseBitConverter);

    expect(wrapper.get('.primary-result').text()).toBe('0x2A');

    await wrapper.get('#operand-a').setValue('0xA5');
    await wrapper.get('#operation').setValue('xor');
    await wrapper.get('#operand-b').setValue('0x0F');

    expect(wrapper.get('.primary-result').text()).toBe('0xAA');
    expect(wrapper.get('.comparison-section').text()).toContain('A');
    expect(wrapper.get('.comparison-section').text()).toContain('B');
    expect(wrapper.get('.comparison-section').text()).toContain('R');
  });

  it('显示字段错误，并能通过示例按钮恢复有效状态', async () => {
    const wrapper = mount(BaseBitConverter);

    await wrapper.get('#operand-a').setValue('0xGG');
    expect(wrapper.get('#operand-a').attributes('aria-invalid')).toBe('true');
    expect(wrapper.get('[role="alert"]').text()).toContain('字符“G”');
    expect(wrapper.get('[role="alert"]').text()).toContain('位置 3');

    await buttonByText(wrapper, '载入 XOR 示例').trigger('click');
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    expect(wrapper.get('.primary-result').text()).toBe('0xAA');
  });
});

describe('HexTextConverter component', () => {
  it('在 UTF-8 文本和 HEX 字节之间双向严格转换', async () => {
    const wrapper = mount(HexTextConverter);

    await wrapper.get('textarea').setValue('A中😀');
    expect(wrapper.get('.result-panel').text()).toContain('41 E4 B8 AD F0 9F 98 80');
    expect(wrapper.get('.result-panel').text()).toContain('8 byte');

    await wrapper.findAll('input[type="radio"]')[1].setValue(true);
    await wrapper.get('textarea').setValue('C0 AF');
    expect(wrapper.get('[role="alert"]').text()).toContain('不是完整、合法的 UTF-8');

    await wrapper.get('textarea').setValue('E4 B8 AD');
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    expect(wrapper.get('.text-output').text()).toBe('中');
  });

  it('拒绝非 ASCII 字符，并提供重置和复制反馈', async () => {
    const wrapper = mount(HexTextConverter);

    await wrapper.get('select').setValue('ascii');
    await wrapper.get('textarea').setValue('A中');
    expect(wrapper.get('[role="alert"]').text()).toContain('不属于 ASCII');

    await buttonByText(wrapper, '重置').trigger('click');
    expect(wrapper.find('.result-panel').exists()).toBe(false);

    await wrapper.get('textarea').setValue('ABC');
    await buttonByText(wrapper, '复制').trigger('click');
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('41 42 43');
    expect(wrapper.get('.copy-feedback').text()).toBe('已复制结果');
  });
});

describe('CrcCalculator component', () => {
  it('加载模型预设，并让 UTF-8 与 HEX 输入得到相同检查值', async () => {
    const wrapper = mount(CrcCalculator);
    const selects = wrapper.findAll('select');

    expect(wrapper.get('.primary-result strong').text()).toBe('0xCBF43926');

    await selects[0].setValue('CRC-16/MODBUS');
    expect(wrapper.get('.primary-result strong').text()).toBe('0x4B37');
    expect(wrapper.get('.check').text()).toContain('0x4B37');

    await wrapper.findAll('select')[2].setValue('hex');
    await wrapper.get('textarea').setValue('31 32 33 34 35 36 37 38 39');
    expect(wrapper.get('.primary-result strong').text()).toBe('0x4B37');
  });

  it('显示参数错误、隐藏失效的预设检查提示并复制结果', async () => {
    const wrapper = mount(CrcCalculator);
    const parameterInputs = wrapper.findAll('.param-grid input');

    await parameterInputs[0].setValue('0');
    expect(wrapper.get('[role="alert"]').text()).toBe('Poly 不能为 0。');
    expect(wrapper.find('.check').exists()).toBe(false);

    await parameterInputs[0].setValue('04C11DB7');
    await buttonByText(wrapper, '复制结果').trigger('click');
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('0xCBF43926');
    expect(wrapper.get('.copy-feedback').text()).toBe('已复制 CRC 结果。');
  });
});

describe('EndiannessConverter component', () => {
  it('实时比较同一 byte 序列的大端和小端解释', async () => {
    const wrapper = mount(EndiannessConverter);

    expect(wrapper.get('.result-panel').text()).toContain('0x12345678');
    expect(wrapper.get('.result-panel').text()).toContain('0x78563412');

    await wrapper.get('textarea').setValue('34 12');
    expect(wrapper.get('.result-panel').text()).toContain('0x3412');
    expect(wrapper.get('.result-panel').text()).toContain('0x1234');

    await wrapper.get('textarea').setValue('12 G4');
    expect(wrapper.get('[role="alert"]').text()).toContain('字符“G”无效');
  });

  it('把固定宽度整数编码为两种 byte 序列并拒绝溢出', async () => {
    const wrapper = mount(EndiannessConverter);

    await wrapper.findAll('input[type="radio"]')[1].setValue(true);
    const integerInput = wrapper.get('input[placeholder="例如：12345678"]');
    await integerInput.setValue('1');
    expect(wrapper.get('.result-panel').text()).toContain('00 00 00 01');
    expect(wrapper.get('.result-panel').text()).toContain('01 00 00 00');

    await wrapper.findAll('select')[1].setValue('1');
    await integerInput.setValue('100');
    expect(wrapper.get('[role="alert"]').text()).toContain('超出 1 byte');

    await integerInput.setValue('FF');
    await buttonByText(wrapper, '复制').trigger('click');
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('FF');
    expect(wrapper.get('.copy-feedback').text()).toBe('已复制结果。');
  });
});

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});
