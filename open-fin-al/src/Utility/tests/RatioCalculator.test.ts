import RatioCalculator from '../RatioCalculator';

describe('RatioCalculator', () => {
  const baseData = {
    EPS: 3.14,
    PERatio: 20.7,
    totalCurrentAssets: 125.8,
    totalCurrentLiabilities: 50,
    inventory: 10.3,
    shortTermDebt: '20',
    longTermDebt: '30',
    otherNonCurrentLiabilities: '5',
    totalShareholderEquity: 25,
    ProfitMargin: 0.42,
  };

  it('stores constructor data and starts with null ratio properties', () => {
    const calc = new RatioCalculator(baseData);

    expect(calc.data).toBe(baseData);
    expect(calc.EPS).toBeNull();
    expect(calc.PER).toBeNull();
    expect(calc.WCR).toBeNull();
    expect(calc.QR).toBeNull();
    expect(calc.DER).toBeNull();
    expect(calc.GPM).toBeNull();
  });

  it('calculates all ratios with expected transformations', () => {
    const calc = new RatioCalculator(baseData);

    calc.calculateRatios();

    expect(calc.EPS).toBe(3.14);
    expect(calc.PER).toBe(20.7);
    expect(calc.WCR).toBe('2.52'); // round(125.8)=126 / 50
    expect(calc.QR).toBe('2.32'); // round(125.8 - 10.3)=116; 116/50 = 2.32
    expect(calc.DER).toBe('2.20'); // round(20+30+5)=55 / 25
    expect(calc.GPM).toBe(0.42);
  });

  it('supports numeric strings for debt inputs via unary plus coercion', () => {
    const calc = new RatioCalculator({
      ...baseData,
      shortTermDebt: '1.1',
      longTermDebt: '2.2',
      otherNonCurrentLiabilities: '3.3',
      totalShareholderEquity: 2,
    });

    calc.calculateRatios();

    // round(1.1 + 2.2 + 3.3) = 7; 7 / 2 = 3.5
    expect(calc.DER).toBe('3.50');
  });

  it('formats WC and QR as fixed two-decimal strings', () => {
    const calc = new RatioCalculator({
      ...baseData,
      totalCurrentAssets: 101,
      totalCurrentLiabilities: 40,
      inventory: 1,
    });

    calc.calculateRatios();

    expect(typeof calc.WCR).toBe('string');
    expect(calc.WCR).toBe('2.52');
    expect(typeof calc.QR).toBe('string');
    expect(calc.QR).toBe('2.50');
  });
});
