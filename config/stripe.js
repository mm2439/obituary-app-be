const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Package configurations with Stripe Price IDs
const PACKAGE_CONFIG = {
  memory_page_one_month: { 
    price_id: process.env.MEMORY_PAGE_ONE_MONTH_PRICE_ID,
    type: 'subscription',
    duration: 1 // month
  },
  memory_page_one_year: { 
    price_id: process.env.MEMORY_PAGE_ONE_YEAR_PRICE_ID,
    type: 'one_time',
    duration: 12 // months
  },
  memory_page_six_years: { 
    price_id: process.env.MEMORY_PAGE_SIX_YEARS_PRICE_ID,
    type: 'one_time',
    duration: 72 // months
  },
  florist_monthly_small_city: { 
    price_id: process.env.FLORIST_MONTHLY_SMALL_CITY_PRICE_ID,
    type: 'subscription'
  },
  florist_monthly_large_city: { 
    price_id: process.env.FLORIST_MONTHLY_LARGE_CITY_PRICE_ID,
    type: 'subscription'
  },
  florist_monthly_capital_city: { 
    price_id: process.env.FLORIST_MONTHLY_CAPITAL_CITY_PRICE_ID,
    type: 'subscription'
  },
  florist_yearly_small_city: { 
    price_id: process.env.FLORIST_YEARLY_SMALL_CITY_PRICE_ID,
    type: 'subscription'
  },
  florist_yearly_large_city: { 
    price_id: process.env.FLORIST_YEARLY_LARGE_CITY_PRICE_ID,
    type: 'subscription'
  },
  florist_yearly_capital_city: { 
    price_id: process.env.FLORIST_YEARLY_CAPITAL_CITY_PRICE_ID,
    type: 'subscription'
  },
  advertiser_monthly_small_city: { 
    price_id: process.env.ADVERTISER_MONTHLY_SMALL_CITY_PRICE_ID,
    type: 'one_time'
  },
  advertiser_monthly_large_city: { 
    price_id: process.env.ADVERTISER_MONTHLY_LARGE_CITY_PRICE_ID,
    type: 'one_time'
  },
  advertiser_monthly_capital_city: { 
    price_id: process.env.ADVERTISER_MONTHLY_CAPITAL_CITY_PRICE_ID,
    type: 'one_time'
  },
  advertiser_yearly_small_city: { 
    price_id: process.env.ADVERTISER_YEARLY_SMALL_CITY_PRICE_ID,
    type: 'one_time'
  },
  advertiser_yearly_large_city: { 
    price_id: process.env.ADVERTISER_YEARLY_LARGE_CITY_PRICE_ID,
    type: 'one_time'
  },
  advertiser_yearly_capital_city: { 
    price_id: process.env.ADVERTISER_YEARLY_CAPITAL_CITY_PRICE_ID,
    type: 'one_time'
  },
  custom_one: {
    price_id: process.env.CUSTOM_ONE_PRICE_ID,
    type: 'one_time'
  },
  custom_two: {
    price_id: process.env.CUSTOM_TWO_PRICE_ID,
    type: 'one_time'
  }
};

// Helper function to get price details from Stripe
const getPriceDetails = async (priceId) => {
  try {
    const price = await stripe.prices.retrieve(priceId, {
      expand: ['product']
    });
    
    return {
      id: price.id,
      amount: price.unit_amount,
      currency: price.currency,
      recurring: price.recurring,
      product: {
        id: price.product.id,
        name: price.product.name,
        description: price.product.description,
      }
    };
  } catch (error) {
    console.error(`Error fetching price details for ${priceId}:`, error.message);
    throw new Error(`Failed to fetch price details: ${error.message}`);
  }
};

module.exports = {
  stripe,
  PACKAGE_CONFIG,
  getPriceDetails
};