'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add new custom package types to the ENUM for MySQL
    await queryInterface.sequelize.query(`
      ALTER TABLE orders MODIFY COLUMN packageType ENUM(
        'memory_page_one_month',
        'memory_page_one_year', 
        'memory_page_six_years',
        'florist_monthly_small_city',
        'florist_monthly_large_city',
        'florist_monthly_capital_city',
        'florist_yearly_small_city',
        'florist_yearly_large_city',
        'florist_yearly_capital_city',
        'advertiser_monthly_small_city',
        'advertiser_monthly_large_city',
        'advertiser_monthly_capital_city',
        'advertiser_yearly_small_city',
        'advertiser_yearly_large_city',
        'advertiser_yearly_capital_city',
        'custom_one',
        'custom_two'
      ) NOT NULL;
    `);
  },

  async down(queryInterface, Sequelize) {
    // Remove custom package types from the ENUM
    await queryInterface.sequelize.query(`
      ALTER TABLE orders MODIFY COLUMN packageType ENUM(
        'memory_page_one_month',
        'memory_page_one_year', 
        'memory_page_six_years',
        'florist_monthly_small_city',
        'florist_monthly_large_city',
        'florist_monthly_capital_city',
        'florist_yearly_small_city',
        'florist_yearly_large_city',
        'florist_yearly_capital_city',
        'advertiser_monthly_small_city',
        'advertiser_monthly_large_city',
        'advertiser_monthly_capital_city',
        'advertiser_yearly_small_city',
        'advertiser_yearly_large_city',
        'advertiser_yearly_capital_city'
      ) NOT NULL;
    `);
  }
};