/**
 * Fiziksel sabitler
 * ==================
 * Tüm denklemler atm-L-mol-K birim sisteminde çalışır (CRC Handbook uyumlu).
 */

/** İdeal gaz sabiti (L·atm/(mol·K)) */
export const R = 0.08206;

/** Basınç dönüşümleri: model içinde atm, kullanıcı arayüzünde bar gösterilir. */
export const BAR_TO_ATM = 0.9869232667;
export const ATM_TO_BAR = 1 / BAR_TO_ATM;
