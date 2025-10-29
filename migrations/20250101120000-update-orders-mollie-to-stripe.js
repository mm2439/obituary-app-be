'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new Stripe columns
    await queryInterface.addColumn('orders', 'stripeCustomerId', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('orders', 'stripePaymentIntentId', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('orders', 'stripeCheckoutSessionId', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Remove old Mollie columns (if they exist)
    try {
      await queryInterface.removeColumn('orders', 'mollieCustomerId');
    } catch (error) {
      console.log('mollieCustomerId column does not exist, skipping removal');
    }

    try {
      await queryInterface.removeColumn('orders', 'molliePaymentId');
    } catch (error) {
      console.log('molliePaymentId column does not exist, skipping removal');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove Stripe columns
    await queryInterface.removeColumn('orders', 'stripeCustomerId');
    await queryInterface.removeColumn('orders', 'stripePaymentIntentId');
    await queryInterface.removeColumn('orders', 'stripeCheckoutSessionId');

    // Re-add Mollie columns
    await queryInterface.addColumn('orders', 'mollieCustomerId', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('orders', 'molliePaymentId', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  }
};