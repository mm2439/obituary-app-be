const { createMollieClient } = require('@mollie/api-client');

const mollieClient = createMollieClient({ 
  apiKey: process.env.MOLLIE_API_KEY 
});

// Package configurations with pricing and types
const PACKAGE_CONFIG = {
  memory_page_one_month: { 
    amount: 10.00, 
    type: 'subscription',
    interval: '1 month',
    description: 'Spominska stran - mesečno',
    duration: 1 // month
  },
  memory_page_one_year: { 
    amount: 20.00, 
    type: 'one_time',
    description: 'Spominska stran - eno leto',
    duration: 12 // months
  },
  memory_page_six_years: { 
    amount: 30.00, 
    type: 'one_time',
    description: 'Spominska stran - šest let',
    duration: 72 // months
  },
  florist_monthly_small_city: { 
    amount: 10.00, 
    type: 'subscription',
    interval: '1 month',
    description: 'Cvetličarna - majhno mesto - mesečno'
  },
  florist_monthly_large_city: { 
    amount: 20.00, 
    type: 'subscription',
    interval: '1 month',
    description: 'Cvetličarna - večje mesto - mesečno'
  },
  florist_monthly_capital_city: { 
    amount: 30.00, 
    type: 'subscription',
    interval: '1 month',
    description: 'Cvetličarna - glavno mesto - mesečno'
  },
  florist_yearly_small_city: { 
    amount: 100.00, 
    type: 'subscription',
    interval: '12 months',
    description: 'Cvetličarna - majhno mesto - letno'
  },
  florist_yearly_large_city: { 
    amount: 200.00, 
    type: 'subscription',
    interval: '12 months',
    description: 'Cvetličarna - večje mesto - letno'
  },
  florist_yearly_capital_city: { 
    amount: 300.00, 
    type: 'subscription',
    interval: '12 months',
    description: 'Cvetličarna - glavno mesto - letno'
  },
  advertiser_monthly_small_city: { 
    amount: 10.00, 
    type: 'one_time',
    description: 'Oglaševanje - majhno mesto - mesečno'
  },
  advertiser_monthly_large_city: { 
    amount: 20.00, 
    type: 'one_time',
    description: 'Oglaševanje - večje mesto - mesečno'
  },
  advertiser_monthly_capital_city: { 
    amount: 30.00, 
    type: 'one_time',
    description: 'Oglaševanje - glavno mesto - mesečno'
  },
  advertiser_yearly_small_city: { 
    amount: 100.00, 
    type: 'one_time',
    description: 'Oglaševanje - majhno mesto - letno'
  },
  advertiser_yearly_large_city: { 
    amount: 200.00, 
    type: 'one_time',
    description: 'Oglaševanje - večje mesto - letno'
  },
  advertiser_yearly_capital_city: { 
    amount: 300.00, 
    type: 'one_time',
    description: 'Oglaševanje - glavno mesto - letno'
  }
};

module.exports = {
  mollieClient,
  PACKAGE_CONFIG
};