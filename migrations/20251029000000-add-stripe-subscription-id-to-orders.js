'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('orders', 'stripeSubscriptionId', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'stripeCheckoutSessionId' // MySQL specific - can be removed for other DBs
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('orders', 'stripeSubscriptionId');
  }
};
