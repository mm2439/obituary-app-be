'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('orders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true, // null for advertisers who aren't logged in users
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'RESTRICT'
      },
      mollieCustomerId: {
        type: Sequelize.STRING,
        allowNull: true, // set after first payment
      },
      molliePaymentId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      packageType: {
        type: Sequelize.ENUM(
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
        ),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'paid', 'canceled', 'refunded'),
        allowNull: false,
        defaultValue: 'pending'
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true, // stores slug, email, city, page etc.
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'EUR'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('orders');
  }
};