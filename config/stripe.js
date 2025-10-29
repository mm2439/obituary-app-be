const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Package configurations with pricing and types
const PACKAGE_CONFIG = {
  memory_page_one_month: { 
    amount: 1000, // Stripe uses cents, so 10.00 EUR = 1000 cents
    type: 'subscription',
    interval: 'month',
    interval_count: 1,
    description: 'Spominska stran - mesečno',
    duration: 1 // month
  },
  memory_page_one_year: { 
    amount: 2000, // 20.00 EUR
    type: 'one_time',
    description: 'Spominska stran - eno leto',
    duration: 12 // months
  },
  memory_page_six_years: { 
    amount: 3000, // 30.00 EUR
    type: 'one_time',
    description: 'Spominska stran - šest let',
    duration: 72 // months
  },
  florist_monthly_small_city: { 
    amount: 1000, // 10.00 EUR
    type: 'subscription',
    interval: 'month',
    interval_count: 1,
    description: 'Cvetličarna - majhno mesto - mesečno'
  },
  florist_monthly_large_city: { 
    amount: 2000, // 20.00 EUR
    type: 'subscription',
    interval: 'month',
    interval_count: 1,
    description: 'Cvetličarna - večje mesto - mesečno'
  },
  florist_monthly_capital_city: { 
    amount: 3000, // 30.00 EUR
    type: 'subscription',
    interval: 'month',
    interval_count: 1,
    description: 'Cvetličarna - glavno mesto - mesečno'
  },
  florist_yearly_small_city: { 
    amount: 10000, // 100.00 EUR
    type: 'subscription',
    interval: 'year',
    interval_count: 1,
    description: 'Cvetličarna - majhno mesto - letno'
  },
  florist_yearly_large_city: { 
    amount: 20000, // 200.00 EUR
    type: 'subscription',
    interval: 'year',
    interval_count: 1,
    description: 'Cvetličarna - večje mesto - letno'
  },
  florist_yearly_capital_city: { 
    amount: 30000, // 300.00 EUR
    type: 'subscription',
    interval: 'year',
    interval_count: 1,
    description: 'Cvetličarna - glavno mesto - letno'
  },
  advertiser_monthly_small_city: { 
    amount: 1000, // 10.00 EUR
    type: 'one_time',
    description: 'Oglaševanje - majhno mesto - mesečno'
  },
  advertiser_monthly_large_city: { 
    amount: 2000, // 20.00 EUR
    type: 'one_time',
    description: 'Oglaševanje - večje mesto - mesečno'
  },
  advertiser_monthly_capital_city: { 
    amount: 3000, // 30.00 EUR
    type: 'one_time',
    description: 'Oglaševanje - glavno mesto - mesečno'
  },
  advertiser_yearly_small_city: { 
    amount: 10000, // 100.00 EUR
    type: 'one_time',
    description: 'Oglaševanje - majhno mesto - letno'
  },
  advertiser_yearly_large_city: { 
    amount: 20000, // 200.00 EUR
    type: 'one_time',
    description: 'Oglaševanje - večje mesto - letno'
  },
  advertiser_yearly_capital_city: { 
    amount: 30000, // 300.00 EUR
    type: 'one_time',
    description: 'Oglaševanje - glavno mesto - letno'
  }
};

module.exports = {
  stripe,
  PACKAGE_CONFIG
};