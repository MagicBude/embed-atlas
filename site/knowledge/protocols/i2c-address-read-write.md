---
title: I²C 7 位地址与读写位
description: 区分 I²C 7 位目标地址、线上第一个地址字节和常见 8 位读写地址写法，并解释 ACK、重复起始与寄存器读取。
category: protocols
tags:
  - i2c
  - address
  - protocol
level: beginner
status: review
---

# I²C 7 位地址与读写位

## 本文解决什么问题

数据手册写地址 `0x50`，示例却发送 `0xA0` 和 `0xA1`；驱动 API 又要求 `0x50` 或 `0xA0`。这些值可能都来自同一个 7 位地址，但属于不同接口层。本文用线路上的第一个 byte 消除混淆。

## 阅读前需要知道什么

- I²C 使用 SDA 数据线和 SCL 时钟线，通常由开漏/开集电极输出与上拉电阻共同形成高电平。
- 一个 byte 的 HEX 写法与其 bit 位可回顾[整数、进制与位模式](../foundations/integer-radix-bit-pattern)。

## 7 位地址怎样变成地址 byte

常用 I²C 7 位目标地址范围用 7 bit 表示。线路上传输地址阶段时，把 7 位地址左移一位，最低位放读写方向：

```text
地址 byte = (address7 << 1) | R/W
```

- `R/W=0`：控制器向目标写（controller-transmitter）。
- `R/W=1`：控制器从目标读（controller-receiver）。

以 7 位地址 `0x50` 为例：

```text
7 位地址：       101 0000 = 0x50
写地址 byte：   1010 0000 = 0xA0
读地址 byte：   1010 0001 = 0xA1
```

因此 `0xA0/0xA1` 不应再叫两个独立设备地址，而是同一 7 位地址与方向位组合出的线上 byte。

## 为什么驱动 API 的参数看起来不一致

API 可能选择两种约定：

1. 接收 7 位地址 `0x50`，驱动内部左移并加入 R/W。
2. 接收已经左移的地址值 `0xA0`，驱动再根据操作修改最低位。

两者都可能存在，必须阅读 API 文档和函数实现。若把 `0xA0` 交给期望 7 位地址的 API，它可能再次左移，线上就不再是目标地址。

建议变量名明确层次：

```c
const uint8_t device_address_7bit = 0x50U;
```

不要只命名为 `DEVICE_ADDR` 后靠注释猜是否已左移。

## 一次 byte 传输有 9 个时钟脉冲

地址 byte 和每个数据 byte 后面都有第 9 个 ACK/NACK 时钟：

```text
S | 7-bit address | R/W | ACK | data[7:0] | ACK/NACK | P
       8 个 bit          1       8 个 bit      1
```

- START（S）：SCL 为高时 SDA 从高变低。
- STOP（P）：SCL 为高时 SDA 从低变高。
- ACK：接收方在第 9 个时钟把 SDA 拉低。
- NACK：SDA 在第 9 个时钟保持高。

控制器读取最后一个 byte 后通常发送 NACK，表示不再需要更多数据，然后发 STOP 或重复 START。不要把“最后 NACK”误判成从设备通信失败。

## 典型寄存器读取为什么先写后读

很多 I²C 器件把第一次写入的数据解释为内部寄存器索引。读取寄存器 `0x10` 的常见序列：

```text
S
0xA0  ACK        # 0x50 + Write
0x10  ACK        # 内部寄存器索引
Sr
0xA1  ACK        # 0x50 + Read
DATA  NACK
P
```

重复起始（repeated START，Sr）不先释放总线，维持一次组合事务。是否允许 STOP 后重新 START、寄存器索引长度和自动递增行为均由具体器件数据手册规定，不是 I²C 总线替所有器件定义的“寄存器协议”。

## 保留地址与 10 位地址

7 位空间并非 `0x00`～`0x7F` 全部可随意分配，其中一部分前缀用于通用呼叫、起始字节、10 位寻址等特殊目的。设计新设备地址时应核对 I²C 规范的保留地址表。

10 位寻址使用两个地址 byte，并以 `11110xx` 前缀开始；不能把 10 位地址简单套入 `(address << 1) | rw` 的单 byte 公式。首版文章和常见 MCU API示例聚焦 7 位寻址。

## 地址不应通过“扫描成功”单独确认

I²C 扫描器通常遍历地址并观察 ACK，但结果还受以下因素影响：

- 器件是否上电、复位或处于休眠。
- 地址引脚焊接状态。
- 上拉电阻、电压域和电平转换器。
- 总线是否被某个设备持续拉低。
- 某些器件是否会对无效访问产生副作用。

扫描适合诊断，不能替代原理图、BOM 和数据手册。

## 常见错误与排查

| 现象 | 常见原因 | 检查方法 |
| --- | --- | --- |
| 地址阶段一直 NACK | 7 位地址被重复左移或方向位错误 | 抓第一个 byte，反推 `byte >> 1` |
| 数据手册写 `A0/A1`，API 不工作 | 手册列的是 8 位读写 byte，API 要 7 位地址 | 查 API 参数定义，尝试确认而非盲猜 |
| 读取寄存器总是错误 | 缺少索引写入或 repeated START | 对照器件事务时序逐阶段抓取 |
| 读最后一个 byte 被分析仪标为 NACK | 控制器按规范结束读取 | 检查 NACK 发送方及后续 STOP |
| SCL/SDA 一直低 | 设备未释放、接线/上拉或电压问题 | 先测静态电平，再断开设备定位 |

## 用逻辑分析仪定位地址层问题

看到首 byte `0xD1`：

```text
address7 = 0xD1 >> 1 = 0x68
R/W = 0xD1 & 1 = 1（读）
```

先按原始 byte 手算，再与分析仪标签和驱动参数比较。若分析仪显示“地址 0x68 Read”，说明它已经替你拆掉最低方向位，不能再把显示值当成线上完整 byte。

## 关联工具与延伸阅读

- 用[进制与位运算转换器](/tools/base-bit-converter)验证 `address << 1`、按位或与反向拆解。
- 用 [HEX、ASCII 与字符串转换器](/tools/hex-text-converter)整理抓包 byte，但不要把 I²C 数据自动当作文本。
- 回顾[字节序与多字节整数](../foundations/endianness-multibyte-integer)，多字节寄存器的顺序由器件定义。

## 自测

1. 7 位地址 `0x3C` 的写、读地址 byte 分别是什么？
2. 线上首 byte `0xD0` 对应哪个 7 位地址和方向？
3. 为什么读取最后一个 byte 后的 NACK 可能是正常行为？

<details>
<summary>查看答案</summary>

1. 写为 `0x78`，读为 `0x79`。
2. `0xD0 >> 1 = 0x68`，最低位 0 表示写。
3. 控制器用 NACK 告诉目标设备不再请求后续 byte，随后结束或切换事务。

</details>

## 参考资料

- [NXP UM10204：I²C-bus specification and user manual，Rev. 7.0](https://www.nxp.com/docs/en/user-guide/UM10204.pdf)，7 位/10 位寻址、R/W、ACK/NACK、START 与重复 START 的规范来源。

## 审阅记录

- 内容状态：等待独立同行审阅（review）。
- 已核对：`0x50` 示例、9 时钟结构、组合寄存器读取与末字节 NACK。
- 待验证：独立嵌入式工程师结合常见 HAL 驱动复核地址参数差异表达。
